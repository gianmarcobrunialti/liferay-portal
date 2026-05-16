/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.commerce.product.test;

import com.liferay.account.constants.AccountConstants;
import com.liferay.account.model.AccountEntry;
import com.liferay.arquillian.extension.junit.bridge.junit.Arquillian;
import com.liferay.commerce.account.test.util.CommerceAccountTestUtil;
import com.liferay.commerce.currency.model.CommerceCurrency;
import com.liferay.commerce.currency.test.util.CommerceCurrencyTestUtil;
import com.liferay.commerce.product.constants.CommerceChannelConstants;
import com.liferay.commerce.product.helper.CPInstanceHelper;
import com.liferay.commerce.product.model.CPInstance;
import com.liferay.commerce.product.model.CommerceCatalog;
import com.liferay.commerce.product.model.CommerceChannel;
import com.liferay.commerce.product.service.CPInstanceLocalService;
import com.liferay.commerce.product.service.CommerceCatalogLocalService;
import com.liferay.commerce.product.service.CommerceChannelLocalService;
import com.liferay.commerce.product.test.util.CPTestUtil;
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

import org.junit.Assert;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * Java integration coverage for the discontinued-SKU replacement resolution
 * behind the {@code CommerceQuickAddToCart} and
 * {@code CPCommerceProductReplacements} Poshi suites (Block 5.4 of the
 * Shopping Experience migration plan).
 *
 * The 5 Integration-classified Poshi rows reduce to coverage of one underlying
 * invariant: {@link CPInstanceHelper#fetchFirstAvailableReplacementCPInstance(
 * long, long, long, long)} returns the configured replacement
 * {@link CPInstance} when the original is discontinued and unavailable, and
 * returns {@code null} when no replacement is needed. The discount / promotion
 * / price-on-application Poshi rows are reclassified to {@code Delete} (covered
 * transitively by this test plus the existing pricing-test suites in
 * {@code commerce-test}'s {@code price} and {@code pricing} packages); the
 * cross-catalog row is exercised here directly.
 *
 * @author Gianmarco Brunialti
 */
@RunWith(Arquillian.class)
public class ReplacementCPInstanceTest {

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
	}

	@Test
	public void testFetchReplacementResolvesAcrossCatalogs() throws Exception {

		// Poshi: ReplacementCanBeSetBetweenDifferentCatalogs

		CommerceCatalog otherCommerceCatalog =
			_commerceCatalogLocalService.addCommerceCatalog(
				null, RandomTestUtil.randomString(),
				_commerceCurrency.getCode(), LocaleUtil.US.getDisplayLanguage(),
				_serviceContext);

		CPInstance replacementCPInstance = CPTestUtil.addCPInstanceFromCatalog(
			otherCommerceCatalog.getGroupId());

		CPInstance discontinuedCPInstance = _addDiscontinuedCPInstance(
			_commerceCatalog.getGroupId(), replacementCPInstance);

		CPInstance resolvedCPInstance =
			_cpInstanceHelper.fetchFirstAvailableReplacementCPInstance(
				_accountEntry.getAccountEntryId(),
				_commerceChannel.getGroupId(), 0,
				discontinuedCPInstance.getCPInstanceId());

		Assert.assertNotNull(
			"Expected replacement to resolve across catalogs",
			resolvedCPInstance);
		Assert.assertEquals(
			replacementCPInstance.getCPInstanceId(),
			resolvedCPInstance.getCPInstanceId());
	}

	@Test
	public void testFetchReplacementWhenOriginalIsDiscontinuedAndUnavailable()
		throws Exception {

		// Poshi: CanDiscontinuedSKUBeReplaced (the resolution half; the UI
		// assertions about the "Replacement" label and the info tooltip are
		// frontend concerns and stay with the Playwright suite of this
		// component, not this Java IT block).

		CPInstance replacementCPInstance = CPTestUtil.addCPInstanceFromCatalog(
			_commerceCatalog.getGroupId());

		CPInstance discontinuedCPInstance = _addDiscontinuedCPInstance(
			_commerceCatalog.getGroupId(), replacementCPInstance);

		CPInstance resolvedCPInstance =
			_cpInstanceHelper.fetchFirstAvailableReplacementCPInstance(
				_accountEntry.getAccountEntryId(),
				_commerceChannel.getGroupId(), 0,
				discontinuedCPInstance.getCPInstanceId());

		Assert.assertNotNull(
			"Expected replacement to resolve for discontinued unavailable " +
				"original",
			resolvedCPInstance);
		Assert.assertEquals(
			replacementCPInstance.getCPInstanceId(),
			resolvedCPInstance.getCPInstanceId());
	}

	@Test
	public void testNoReplacementWhenOriginalIsNotDiscontinued()
		throws Exception {

		// Negative path: a non-discontinued CPInstance returns null even when
		// a replacement is wired up. Confirms the
		// fetchFirstAvailableReplacementCPInstance contract short-circuits
		// when the discontinued flag is not set.

		CPInstance replacementCPInstance = CPTestUtil.addCPInstanceFromCatalog(
			_commerceCatalog.getGroupId());

		CPInstance cpInstance = CPTestUtil.addCPInstanceFromCatalog(
			_commerceCatalog.getGroupId());

		cpInstance.setReplacementCPInstanceUuid(
			replacementCPInstance.getCPInstanceUuid());
		cpInstance.setReplacementCProductId(
			replacementCPInstance.getCPDefinition(
			).getCProductId());

		cpInstance = _cpInstanceLocalService.updateCPInstance(cpInstance);

		CPInstance resolvedCPInstance =
			_cpInstanceHelper.fetchFirstAvailableReplacementCPInstance(
				_accountEntry.getAccountEntryId(),
				_commerceChannel.getGroupId(), 0, cpInstance.getCPInstanceId());

		Assert.assertNull(
			"Expected no replacement for non-discontinued CPInstance",
			resolvedCPInstance);
	}

	private CPInstance _addDiscontinuedCPInstance(
			long groupId, CPInstance replacementCPInstance)
		throws Exception {

		CPInstance cpInstance = CPTestUtil.addCPInstanceFromCatalog(groupId);

		cpInstance.setDiscontinued(true);
		cpInstance.setReplacementCPInstanceUuid(
			replacementCPInstance.getCPInstanceUuid());
		cpInstance.setReplacementCProductId(
			replacementCPInstance.getCPDefinition(
			).getCProductId());

		return _cpInstanceLocalService.updateCPInstance(cpInstance);
	}

	private AccountEntry _accountEntry;
	private CommerceCatalog _commerceCatalog;

	@Inject
	private CommerceCatalogLocalService _commerceCatalogLocalService;

	private CommerceChannel _commerceChannel;

	@Inject
	private CommerceChannelLocalService _commerceChannelLocalService;

	private CommerceCurrency _commerceCurrency;

	@Inject
	private CPInstanceHelper _cpInstanceHelper;

	@Inject
	private CPInstanceLocalService _cpInstanceLocalService;

	private Group _group;
	private ServiceContext _serviceContext;
	private User _user;

}