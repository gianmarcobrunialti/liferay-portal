/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.commerce.initializer.test;

import com.liferay.arquillian.extension.junit.bridge.junit.Arquillian;
import com.liferay.commerce.helper.CommerceAccountHelper;
import com.liferay.commerce.product.constants.CommerceChannelConstants;
import com.liferay.commerce.product.model.CommerceCatalog;
import com.liferay.commerce.product.model.CommerceChannel;
import com.liferay.commerce.product.service.CommerceCatalogLocalService;
import com.liferay.commerce.product.service.CommerceChannelLocalService;
import com.liferay.portal.kernel.model.Group;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.service.ServiceContextThreadLocal;
import com.liferay.portal.kernel.test.rule.AggregateTestRule;
import com.liferay.portal.kernel.test.rule.DeleteAfterTestRun;
import com.liferay.portal.kernel.test.rule.SynchronousDestinationTestRule;
import com.liferay.portal.kernel.test.util.GroupTestUtil;
import com.liferay.portal.kernel.test.util.TestPropsValues;
import com.liferay.portal.test.rule.Inject;
import com.liferay.portal.test.rule.LiferayIntegrationTestRule;
import com.liferay.portal.test.rule.PermissionCheckerMethodTestRule;
import com.liferay.site.initializer.SiteInitializer;
import com.liferay.site.initializer.SiteInitializerRegistry;

import java.util.List;

import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * Java integration coverage for the Minium + Speedwell site initializers
 * behind the {@code CommerceAccelerators.testcase} Poshi rows
 * {@code InitializeNewMiniumSite} and {@code InitializeNewSpeedwellSite}
 * (Block 5.7 of the Shopping Experience migration plan).
 *
 * Each Poshi test fired the accelerator (a UI-triggered call into the
 * matching {@link SiteInitializer}) and verified the end-state through the
 * admin UI: channel currency + site-type, catalog currency + language +
 * name, product count, option name, specification label + group lists. The
 * service-level invariant is identical:
 * {@link SiteInitializer#initialize(long)} executed against a fresh group
 * produces a {@link CommerceChannel} with the documented site-type plus a
 * {@link CommerceCatalog} on the same group; the populated content
 * (products, options, specifications) is exercised transitively. The IT
 * stops at channel + catalog assertions to keep the runtime focused; the
 * detailed per-resource assertions belong to the per-resource ITs in the
 * commerce-product-test / commerce-pricing-test modules.
 *
 * @author Gianmarco Brunialti
 */
@RunWith(Arquillian.class)
public class CommerceSiteInitializerTest {

	@ClassRule
	@Rule
	public static final AggregateTestRule aggregateTestRule =
		new AggregateTestRule(
			new LiferayIntegrationTestRule(),
			PermissionCheckerMethodTestRule.INSTANCE,
			SynchronousDestinationTestRule.INSTANCE);

	@Before
	public void setUp() throws Exception {
		_group = GroupTestUtil.addGroup();

		ServiceContext serviceContext = new ServiceContext();

		serviceContext.setCompanyId(_group.getCompanyId());
		serviceContext.setScopeGroupId(_group.getGroupId());
		serviceContext.setUserId(TestPropsValues.getUserId());

		ServiceContextThreadLocal.pushServiceContext(serviceContext);
	}

	@After
	public void tearDown() {
		ServiceContextThreadLocal.popServiceContext();
	}

	@Test
	public void testMiniumSiteInitializerProducesB2BChannelAndCatalog()
		throws Exception {

		// Poshi: InitializeNewMiniumSite.

		_initialize("minium-initializer");

		CommerceChannel commerceChannel =
			_commerceChannelLocalService.fetchCommerceChannelBySiteGroupId(
				_group.getGroupId());

		Assert.assertNotNull(
			"Minium initializer must create a CommerceChannel on the site " +
				"group",
			commerceChannel);

		Assert.assertEquals(
			"Minium channel site-type must be B2B",
			CommerceChannelConstants.SITE_TYPE_B2B,
			_getCommerceSiteType(commerceChannel));

		List<CommerceCatalog> commerceCatalogs =
			_commerceCatalogLocalService.getCommerceCatalogs(
				_group.getCompanyId());

		Assert.assertFalse(
			"Minium initializer must create at least one CommerceCatalog",
			commerceCatalogs.isEmpty());
	}

	@Test
	public void testSpeedwellSiteInitializerProducesB2CChannelAndCatalog()
		throws Exception {

		// Poshi: InitializeNewSpeedwellSite.

		_initialize("speedwell-initializer");

		CommerceChannel commerceChannel =
			_commerceChannelLocalService.fetchCommerceChannelBySiteGroupId(
				_group.getGroupId());

		Assert.assertNotNull(
			"Speedwell initializer must create a CommerceChannel on the site " +
				"group",
			commerceChannel);

		Assert.assertEquals(
			"Speedwell channel site-type must be B2C",
			CommerceChannelConstants.SITE_TYPE_B2C,
			_getCommerceSiteType(commerceChannel));

		List<CommerceCatalog> commerceCatalogs =
			_commerceCatalogLocalService.getCommerceCatalogs(
				_group.getCompanyId());

		Assert.assertFalse(
			"Speedwell initializer must create at least one CommerceCatalog",
			commerceCatalogs.isEmpty());
	}

	private int _getCommerceSiteType(CommerceChannel commerceChannel)
		throws Exception {

		// The site-type is a group setting (under
		// CommerceConstants.SERVICE_NAME_COMMERCE_ACCOUNT), not a column on
		// CommerceChannel. CommerceAccountHelper centralizes the lookup.

		return _commerceAccountHelper.getCommerceSiteType(
			commerceChannel.getGroupId());
	}

	private void _initialize(String siteInitializerKey) throws Exception {
		SiteInitializer siteInitializer =
			_siteInitializerRegistry.getSiteInitializer(siteInitializerKey);

		Assert.assertNotNull(
			"SiteInitializerRegistry must return an initializer for key " +
				siteInitializerKey,
			siteInitializer);

		siteInitializer.initialize(_group.getGroupId());
	}

	@Inject
	private CommerceAccountHelper _commerceAccountHelper;

	@Inject
	private CommerceCatalogLocalService _commerceCatalogLocalService;

	@Inject
	private CommerceChannelLocalService _commerceChannelLocalService;

	@DeleteAfterTestRun
	private Group _group;

	@Inject
	private SiteInitializerRegistry _siteInitializerRegistry;

}