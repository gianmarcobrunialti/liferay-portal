/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.commerce.order.test;

import com.liferay.account.constants.AccountConstants;
import com.liferay.account.model.AccountEntry;
import com.liferay.arquillian.extension.junit.bridge.junit.Arquillian;
import com.liferay.commerce.account.test.util.CommerceAccountTestUtil;
import com.liferay.commerce.constants.CPDefinitionInventoryConstants;
import com.liferay.commerce.currency.model.CommerceCurrency;
import com.liferay.commerce.currency.test.util.CommerceCurrencyTestUtil;
import com.liferay.commerce.model.CPDefinitionInventory;
import com.liferay.commerce.model.CommerceOrder;
import com.liferay.commerce.order.CommerceOrderValidatorRegistry;
import com.liferay.commerce.order.CommerceOrderValidatorResult;
import com.liferay.commerce.product.constants.CommerceChannelConstants;
import com.liferay.commerce.product.model.CPConfigurationEntry;
import com.liferay.commerce.product.model.CPDefinition;
import com.liferay.commerce.product.model.CPInstance;
import com.liferay.commerce.product.model.CommerceCatalog;
import com.liferay.commerce.product.model.CommerceChannel;
import com.liferay.commerce.product.service.CPConfigurationEntryLocalService;
import com.liferay.commerce.product.service.CommerceCatalogLocalService;
import com.liferay.commerce.product.service.CommerceChannelLocalService;
import com.liferay.commerce.product.test.util.CPTestUtil;
import com.liferay.commerce.service.CPDefinitionInventoryLocalService;
import com.liferay.commerce.service.CommerceOrderLocalService;
import com.liferay.petra.string.StringBundler;
import com.liferay.petra.string.StringPool;
import com.liferay.portal.kernel.model.Group;
import com.liferay.portal.kernel.model.User;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.test.rule.AggregateTestRule;
import com.liferay.portal.kernel.test.util.GroupTestUtil;
import com.liferay.portal.kernel.test.util.RandomTestUtil;
import com.liferay.portal.kernel.test.util.ServiceContextTestUtil;
import com.liferay.portal.kernel.test.util.UserTestUtil;
import com.liferay.portal.kernel.util.LocaleUtil;
import com.liferay.portal.test.rule.Inject;
import com.liferay.portal.test.rule.LiferayIntegrationTestRule;
import com.liferay.portal.test.rule.PermissionCheckerMethodTestRule;

import java.math.BigDecimal;

import java.util.ArrayList;
import java.util.List;

import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(Arquillian.class)
public class OrderImporterTest {

	@ClassRule
	@Rule
	public static final AggregateTestRule aggregateTestRule =
		new AggregateTestRule(
			new LiferayIntegrationTestRule(),
			PermissionCheckerMethodTestRule.INSTANCE);

	@Before
	public void setUp() throws Exception {
		_group = GroupTestUtil.addGroup();

		_user = UserTestUtil.addUser();

		_serviceContext = ServiceContextTestUtil.getServiceContext(
			_group.getCompanyId(), _group.getGroupId(), _user.getUserId());

		try {
			_accountEntry = CommerceAccountTestUtil.addPersonAccountEntry(
				_user.getUserId(), _serviceContext);
		}
		catch (Exception exception) {
			_accountEntry = CommerceAccountTestUtil.getPersonAccountEntry(
				_user.getUserId());
		}

		_commerceCurrency = CommerceCurrencyTestUtil.addCommerceCurrency(
			_group.getCompanyId());

		_commerceChannel = _commerceChannelLocalService.addCommerceChannel(
			StringPool.BLANK, AccountConstants.ACCOUNT_ENTRY_ID_DEFAULT,
			_group.getGroupId(),
			_group.getName(_serviceContext.getLanguageId()),
			CommerceChannelConstants.CHANNEL_TYPE_SITE, null,
			_commerceCurrency.getCode(), _serviceContext);

		_commerceCatalog = _commerceCatalogLocalService.addCommerceCatalog(
			null, RandomTestUtil.randomString(), _commerceCurrency.getCode(),
			LocaleUtil.US.getDisplayLanguage(), _serviceContext);

		_cpInstance = CPTestUtil.addCPInstanceFromCatalog(
			_commerceCatalog.getGroupId());

		// Enable back-orders on the CPDefinitionInventory so the availability
		// validator (which always reads back-orders from CPDefinitionInventory
		// via cpConfigurationListId=0, regardless of CPConfigurationEntry) lets
		// the quantity through. Otherwise it would short-circuit before
		// DefaultCommerceOrderValidatorImpl runs its min/max/multiple/allowed
		// rules.

		CPDefinitionInventory cpDefinitionInventory =
			_cpDefinitionInventoryLocalService.
				fetchCPDefinitionInventoryByCPDefinitionId(
					_cpInstance.getCPDefinitionId());

		if (cpDefinitionInventory == null) {
			_cpDefinitionInventoryLocalService.addCPDefinitionInventory(
				_user.getUserId(), _cpInstance.getCPDefinitionId(), "default",
				"default", false, false, BigDecimal.ZERO, true,
				CPDefinitionInventoryConstants.DEFAULT_MIN_ORDER_QUANTITY,
				CPDefinitionInventoryConstants.DEFAULT_MAX_ORDER_QUANTITY, null,
				CPDefinitionInventoryConstants.DEFAULT_MULTIPLE_ORDER_QUANTITY);
		}
		else {
			cpDefinitionInventory.setBackOrders(true);

			_cpDefinitionInventoryLocalService.updateCPDefinitionInventory(
				cpDefinitionInventory);
		}

		_commerceOrder = _commerceOrderLocalService.addCommerceOrder(
			_user.getUserId(), _commerceChannel.getGroupId(),
			_accountEntry.getAccountEntryId(), _commerceCurrency.getCode(), 0);

		_commerceOrders.add(_commerceOrder);
	}

	@After
	public void tearDown() throws Exception {
		for (CommerceOrder commerceOrder : _commerceOrders) {
			_commerceOrderLocalService.deleteCommerceOrder(commerceOrder);
		}
	}

	@Test
	public void testAcceptsValidQuantity() throws Exception {

		_configureInventory(
			BigDecimal.valueOf(2), BigDecimal.valueOf(20), null,
			BigDecimal.valueOf(2));

		_assertValid(BigDecimal.valueOf(6));
	}

	@Test
	public void testRejectsAboveMaxOrderQuantity() throws Exception {

		_configureInventory(
			CPDefinitionInventoryConstants.DEFAULT_MIN_ORDER_QUANTITY,
			BigDecimal.valueOf(5), null, BigDecimal.ONE);

		_assertInvalidWithMessageFragment(BigDecimal.valueOf(6), "5");
	}

	@Test
	public void testRejectsBelowMinOrderQuantity() throws Exception {

		_configureInventory(
			BigDecimal.valueOf(5),
			CPDefinitionInventoryConstants.DEFAULT_MAX_ORDER_QUANTITY, null,
			BigDecimal.ONE);

		_assertInvalidWithMessageFragment(BigDecimal.valueOf(4), "5");
	}

	@Test
	public void testRejectsDisallowedQuantity() throws Exception {

		_configureInventory(
			CPDefinitionInventoryConstants.DEFAULT_MIN_ORDER_QUANTITY,
			CPDefinitionInventoryConstants.DEFAULT_MAX_ORDER_QUANTITY,
			"1, 3, 6", BigDecimal.ONE);

		_assertInvalidWithMessageFragment(BigDecimal.valueOf(4), "allowed");
	}

	@Test
	public void testRejectsQuantityNotMatchingMultiple() throws Exception {

		_configureInventory(
			CPDefinitionInventoryConstants.DEFAULT_MIN_ORDER_QUANTITY,
			CPDefinitionInventoryConstants.DEFAULT_MAX_ORDER_QUANTITY, null,
			BigDecimal.valueOf(3));

		_assertInvalidWithMessageFragment(BigDecimal.valueOf(4), "3");
	}

	private void _assertInvalidWithMessageFragment(
			BigDecimal quantity, String messageFragment)
		throws Exception {

		List<CommerceOrderValidatorResult> commerceOrderValidatorResults =
			_commerceOrderValidatorRegistry.validate(
				LocaleUtil.US, _commerceOrder, _cpInstance, null, quantity,
				false);

		Assert.assertFalse(
			"Validator returned no results for invalid quantity " + quantity,
			commerceOrderValidatorResults.isEmpty());

		boolean fragmentFound = false;

		for (CommerceOrderValidatorResult commerceOrderValidatorResult :
				commerceOrderValidatorResults) {

			String localizedMessage =
				commerceOrderValidatorResult.getLocalizedMessage();

			if ((localizedMessage != null) &&
				localizedMessage.contains(messageFragment)) {

				fragmentFound = true;

				break;
			}
		}

		Assert.assertTrue(
			StringBundler.concat(
				"Expected a validator result containing '", messageFragment,
				"', got ", commerceOrderValidatorResults),
			fragmentFound);
	}

	private void _assertValid(BigDecimal quantity) throws Exception {
		List<CommerceOrderValidatorResult> commerceOrderValidatorResults =
			_commerceOrderValidatorRegistry.validate(
				LocaleUtil.US, _commerceOrder, _cpInstance, null, quantity,
				false);

		Assert.assertTrue(
			StringBundler.concat(
				"Expected a valid result for quantity ", quantity, ", got ",
				commerceOrderValidatorResults),
			commerceOrderValidatorResults.isEmpty());
	}

	private void _configureInventory(
			BigDecimal minOrderQuantity, BigDecimal maxOrderQuantity,
			String allowedOrderQuantities, BigDecimal multipleOrderQuantity)
		throws Exception {

		// The validator chain reads min/max/multiple/allowed from the
		// catalog-scoped CPConfigurationEntry attached to the CPDefinition,
		// not from the per-CPDefinition CPDefinitionInventory record. The
		// engine only falls back to CPDefinitionInventory when no
		// configuration list resolves (cpConfigurationListId == 0), and the
		// default catalog discovery always finds the master configuration
		// list. So the constraints must be set on the master configuration
		// entry to take effect.

		CPDefinition cpDefinition = _cpInstance.getCPDefinition();

		CPConfigurationEntry cpConfigurationEntry =
			cpDefinition.fetchMasterCPConfigurationEntry();

		cpConfigurationEntry.setAllowedOrderQuantities(
			(allowedOrderQuantities == null) ? StringPool.BLANK :
				allowedOrderQuantities);
		cpConfigurationEntry.setBackOrders(true);
		cpConfigurationEntry.setMaxOrderQuantity(maxOrderQuantity);
		cpConfigurationEntry.setMinOrderQuantity(minOrderQuantity);
		cpConfigurationEntry.setMultipleOrderQuantity(multipleOrderQuantity);

		_cpConfigurationEntryLocalService.updateCPConfigurationEntry(
			cpConfigurationEntry);
	}

	private AccountEntry _accountEntry;
	private CommerceCatalog _commerceCatalog;

	@Inject
	private CommerceCatalogLocalService _commerceCatalogLocalService;

	private CommerceChannel _commerceChannel;

	@Inject
	private CommerceChannelLocalService _commerceChannelLocalService;

	private CommerceCurrency _commerceCurrency;
	private CommerceOrder _commerceOrder;

	@Inject
	private CommerceOrderLocalService _commerceOrderLocalService;

	private final List<CommerceOrder> _commerceOrders = new ArrayList<>();

	@Inject
	private CommerceOrderValidatorRegistry _commerceOrderValidatorRegistry;

	@Inject
	private CPConfigurationEntryLocalService _cpConfigurationEntryLocalService;

	@Inject
	private CPDefinitionInventoryLocalService
		_cpDefinitionInventoryLocalService;

	private CPInstance _cpInstance;
	private Group _group;
	private ServiceContext _serviceContext;
	private User _user;

}