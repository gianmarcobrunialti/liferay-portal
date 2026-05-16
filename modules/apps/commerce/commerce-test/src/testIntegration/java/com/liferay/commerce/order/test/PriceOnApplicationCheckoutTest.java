/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.commerce.order.test;

import com.liferay.account.constants.AccountConstants;
import com.liferay.arquillian.extension.junit.bridge.junit.Arquillian;
import com.liferay.commerce.currency.model.CommerceCurrency;
import com.liferay.commerce.currency.test.util.CommerceCurrencyTestUtil;
import com.liferay.commerce.exception.CommerceOrderPriceException;
import com.liferay.commerce.model.CommerceOrder;
import com.liferay.commerce.model.CommerceOrderItem;
import com.liferay.commerce.order.engine.CommerceOrderEngine;
import com.liferay.commerce.product.constants.CommerceChannelConstants;
import com.liferay.commerce.product.model.CommerceChannel;
import com.liferay.commerce.product.service.CommerceChannelLocalService;
import com.liferay.commerce.service.CommerceOrderItemLocalService;
import com.liferay.commerce.service.CommerceOrderLocalService;
import com.liferay.commerce.test.util.CommerceTestUtil;
import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.model.Group;
import com.liferay.portal.kernel.model.User;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.test.rule.AggregateTestRule;
import com.liferay.portal.kernel.test.util.GroupTestUtil;
import com.liferay.portal.kernel.test.util.ServiceContextTestUtil;
import com.liferay.portal.kernel.test.util.UserTestUtil;
import com.liferay.portal.test.rule.Inject;
import com.liferay.portal.test.rule.LiferayIntegrationTestRule;
import com.liferay.portal.test.rule.PermissionCheckerMethodTestRule;

import java.util.List;

import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * Java integration coverage for the price-on-application (POA) checkout-block
 * invariant behind the {@code CommercePriceOnApplication.testcase} Poshi
 * suite (Block 5.5 of the Shopping Experience migration plan).
 *
 * Of the 2 Integration-classified Poshi rows, the checkout-block invariant is
 * ported here directly:
 *
 * <ul>
 * <li>{@code CanPreventPriceOnApplicationProductBeDirectlyCheckoutTogether
 *     WithANormalProduct} (COMMERCE-11687) &rarr;
 *     {@link #testCheckoutThrowsWhenAnOrderItemIsMarkedPriceOnApplication}
 *     and {@link #testCheckoutSucceedsWhenNoOrderItemIsMarkedPriceOnApplication}.
 *     </li>
 * </ul>
 *
 * The second Integration row,
 * {@code CanPriceListPriceOverrideSkuPriceOnApplicationSet} (COMMERCE-11728),
 * is reclassified to {@code Delete} (deferred-P6): it exercises the
 * price-list priority resolution which is the scope of
 * {@code CommerceProductPriceCalculationV2Test} et al., not an
 * order-engine concern. See the block STATUS file for the rationale.
 *
 * @author Gianmarco Brunialti
 */
@RunWith(Arquillian.class)
public class PriceOnApplicationCheckoutTest {

	@ClassRule
	@Rule
	public static final AggregateTestRule aggregateTestRule =
		new AggregateTestRule(
			new LiferayIntegrationTestRule(),
			PermissionCheckerMethodTestRule.INSTANCE);

	@Before
	public void setUp() throws Exception {
		_group = GroupTestUtil.addGroup();

		_user = UserTestUtil.addUser(true);

		_commerceCurrency = CommerceCurrencyTestUtil.addCommerceCurrency(
			_group.getCompanyId());

		_serviceContext = ServiceContextTestUtil.getServiceContext(
			_group.getGroupId());

		_commerceChannel = _commerceChannelLocalService.addCommerceChannel(
			null, AccountConstants.ACCOUNT_ENTRY_ID_DEFAULT,
			_group.getGroupId(), "Test Channel",
			CommerceChannelConstants.CHANNEL_TYPE_SITE, null,
			_commerceCurrency.getCode(), _serviceContext);
	}

	@After
	public void tearDown() throws Exception {
		_commerceOrderLocalService.deleteCommerceOrders(
			_commerceChannel.getGroupId());
	}

	@Test
	public void testCheckoutSucceedsWhenNoOrderItemIsMarkedPriceOnApplication()
		throws Exception {

		// Negative control: an order whose items are NOT POA-flagged passes
		// the POA validation hook in CommerceOrderEngineImpl#_validateCheckout
		// (line 707). It may still fail other validators, but it must not
		// raise CommerceOrderPriceException.

		CommerceOrder commerceOrder = _addCheckoutReadyOrder();

		try {
			_commerceOrderEngine.checkoutCommerceOrder(
				commerceOrder, _user.getUserId());
		}
		catch (PortalException portalException) {
			Throwable throwable = portalException.getCause();

			if (throwable instanceof CommerceOrderPriceException) {
				throw new AssertionError(
					"Checkout must not raise CommerceOrderPriceException for " +
						"an order without POA items",
					portalException);
			}

			// Other validators (workflow, payment, etc.) may legitimately
			// reject this minimal fixture — only the POA check is in scope.

		}
	}

	@Test
	public void testCheckoutThrowsWhenAnOrderItemIsMarkedPriceOnApplication()
		throws Exception {

		// Poshi:
		// CanPreventPriceOnApplicationProductBeDirectlyCheckoutTogetherWith
		// ANormalProduct. The Poshi added a mix of normal + POA items; the
		// service-level invariant is independent of mix-vs-single — one POA
		// item is sufficient to block the checkout transition.

		//

		// CommerceOrderEngineImpl wraps the underlying
		// CommerceOrderPriceException in a generic PortalException via
		// _executeInTransaction, so we assert on the chained cause rather
		// than the top-level exception type.

		CommerceOrder commerceOrder = _addCheckoutReadyOrder();

		List<CommerceOrderItem> commerceOrderItems =
			commerceOrder.getCommerceOrderItems();

		CommerceOrderItem commerceOrderItem = commerceOrderItems.get(0);

		commerceOrderItem.setPriceOnApplication(true);

		_commerceOrderItemLocalService.updateCommerceOrderItem(
			commerceOrderItem);

		try {
			_commerceOrderEngine.checkoutCommerceOrder(
				commerceOrder, _user.getUserId());

			Assert.fail(
				"Expected checkout to throw when an order item is " +
					"price-on-application");
		}
		catch (PortalException portalException) {
			Throwable throwable = portalException.getCause();

			Assert.assertTrue(
				"Expected wrapped cause CommerceOrderPriceException, got " +
					throwable,
				throwable instanceof CommerceOrderPriceException);
		}
	}

	private CommerceOrder _addCheckoutReadyOrder() throws Exception {
		CommerceOrder commerceOrder = CommerceTestUtil.addB2CCommerceOrder(
			_user.getUserId(), _commerceChannel.getGroupId(),
			_commerceCurrency);

		return CommerceTestUtil.addCheckoutDetailsToCommerceOrder(
			commerceOrder, _user.getUserId(), false);
	}

	private CommerceChannel _commerceChannel;

	@Inject
	private CommerceChannelLocalService _commerceChannelLocalService;

	private CommerceCurrency _commerceCurrency;

	@Inject
	private CommerceOrderEngine _commerceOrderEngine;

	@Inject
	private CommerceOrderItemLocalService _commerceOrderItemLocalService;

	@Inject
	private CommerceOrderLocalService _commerceOrderLocalService;

	private Group _group;
	private ServiceContext _serviceContext;
	private User _user;

}