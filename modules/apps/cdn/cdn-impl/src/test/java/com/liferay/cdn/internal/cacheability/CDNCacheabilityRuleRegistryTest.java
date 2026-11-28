/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.cdn.internal.cacheability;

import com.liferay.cdn.cacheability.CDNCacheabilityRule;
import com.liferay.portal.kernel.model.Layout;
import com.liferay.portal.kernel.module.util.SystemBundleUtil;
import com.liferay.portal.test.rule.LiferayUnitTestRule;

import java.util.ArrayList;
import java.util.List;

import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Test;

import org.mockito.Mockito;

import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceRegistration;

import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

/**
 * @author Gianmarco Brunialti Masera
 */
public class CDNCacheabilityRuleRegistryTest {

	@ClassRule
	public static final LiferayUnitTestRule liferayUnitTestRule =
		LiferayUnitTestRule.INSTANCE;

	@Before
	public void setUp() {
		_cdnCacheabilityRuleRegistry = new CDNCacheabilityRuleRegistry(
			_bundleContext);
	}

	@After
	public void tearDown() {
		_cdnCacheabilityRuleRegistry.close();

		for (ServiceRegistration<CDNCacheabilityRule> serviceRegistration :
				_serviceRegistrations) {

			serviceRegistration.unregister();
		}
	}

	@Test
	public void testIsShareable() {
		Assert.assertTrue(_isShareable());

		_registerCDNCacheabilityRule(true);

		Assert.assertTrue(_isShareable());

		CDNCacheabilityRule cdnCacheabilityRule = _registerCDNCacheabilityRule(
			false);

		Assert.assertFalse(_isShareable());

		Mockito.verify(
			cdnCacheabilityRule
		).isShareable(
			_mockHttpServletRequest, _mockHttpServletResponse, _layout
		);

		ServiceRegistration<CDNCacheabilityRule> serviceRegistration =
			_serviceRegistrations.remove(1);

		serviceRegistration.unregister();

		Assert.assertTrue(_isShareable());
	}

	private boolean _isShareable() {
		return _cdnCacheabilityRuleRegistry.isShareable(
			_mockHttpServletRequest, _mockHttpServletResponse, _layout);
	}

	private CDNCacheabilityRule _registerCDNCacheabilityRule(
		boolean shareable) {

		CDNCacheabilityRule cdnCacheabilityRule = Mockito.mock(
			CDNCacheabilityRule.class);

		Mockito.when(
			cdnCacheabilityRule.isShareable(
				Mockito.any(), Mockito.any(), Mockito.any())
		).thenReturn(
			shareable
		);

		_serviceRegistrations.add(
			_bundleContext.registerService(
				CDNCacheabilityRule.class, cdnCacheabilityRule, null));

		return cdnCacheabilityRule;
	}

	private final BundleContext _bundleContext =
		SystemBundleUtil.getBundleContext();
	private CDNCacheabilityRuleRegistry _cdnCacheabilityRuleRegistry;
	private final Layout _layout = Mockito.mock(Layout.class);
	private final MockHttpServletRequest _mockHttpServletRequest =
		new MockHttpServletRequest();
	private final MockHttpServletResponse _mockHttpServletResponse =
		new MockHttpServletResponse();
	private final List<ServiceRegistration<CDNCacheabilityRule>>
		_serviceRegistrations = new ArrayList<>();

}