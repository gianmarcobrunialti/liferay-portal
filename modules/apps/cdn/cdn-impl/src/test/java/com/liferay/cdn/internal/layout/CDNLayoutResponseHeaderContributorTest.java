/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.cdn.internal.layout;

import com.liferay.cdn.configuration.CDNConfiguration;
import com.liferay.cdn.internal.cacheability.CDNCacheabilityRuleRegistry;
import com.liferay.cdn.internal.template.CDNTemplateRegistry;
import com.liferay.cdn.internal.template.ConfiguredCDNTemplate;
import com.liferay.cdn.internal.template.FastlyCDNTemplate;
import com.liferay.petra.lang.SafeCloseable;
import com.liferay.portal.kernel.change.tracking.CTCollectionThreadLocal;
import com.liferay.portal.kernel.cookies.constants.CookiesConstants;
import com.liferay.portal.kernel.model.Layout;
import com.liferay.portal.kernel.servlet.HttpMethods;
import com.liferay.portal.kernel.servlet.MetaInfoCacheServletResponse;
import com.liferay.portal.kernel.test.ReflectionTestUtil;
import com.liferay.portal.kernel.test.util.RandomTestUtil;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.LocaleUtil;
import com.liferay.portal.kernel.util.WebKeys;
import com.liferay.portal.test.rule.LiferayUnitTestRule;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import org.junit.Assert;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Test;

import org.mockito.Mockito;

import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

/**
 * @author Gianmarco Brunialti Masera
 */
public class CDNLayoutResponseHeaderContributorTest {

	@ClassRule
	public static final LiferayUnitTestRule liferayUnitTestRule =
		LiferayUnitTestRule.INSTANCE;

	@Before
	public void setUp() throws Exception {
		Mockito.when(
			_cdnCacheabilityRuleRegistry.isShareable(
				Mockito.any(), Mockito.any(), Mockito.any())
		).thenReturn(
			true
		);

		Mockito.when(
			_cdnConfiguration.cdnCacheControlMaxAge()
		).thenReturn(
			300
		);

		Mockito.when(
			_cdnTemplateRegistry.getCDNConfiguration(Mockito.anyLong())
		).thenReturn(
			_cdnConfiguration
		);

		Mockito.when(
			_cdnTemplateRegistry.getConfiguredCDNTemplate(
				Mockito.anyLong(), Mockito.eq(_cdnConfiguration))
		).thenReturn(
			new ConfiguredCDNTemplate(
				_cdnConfiguration, new FastlyCDNTemplate(),
				RandomTestUtil.randomLong())
		);

		ReflectionTestUtil.setFieldValue(
			_cdnLayoutResponseHeaderContributor, "_cdnCacheabilityRuleRegistry",
			_cdnCacheabilityRuleRegistry);
		ReflectionTestUtil.setFieldValue(
			_cdnLayoutResponseHeaderContributor, "_cdnTemplateRegistry",
			_cdnTemplateRegistry);

		_mockHttpServletRequest.setAttribute(
			WebKeys.THEME_DISPLAY, _themeDisplay);
		_mockHttpServletRequest.setMethod(HttpMethods.GET);

		_themeDisplay.setLanguageId("en_US");
		_themeDisplay.setSiteDefaultLocale(LocaleUtil.US);
	}

	@Test
	public void testContribute() throws Exception {
		Assert.assertEquals(
			"max-age=300", _getCDNCacheControlHeaderValue("Surrogate-Control"));

		_themeDisplay.setI18nLanguageId("es_ES");
		_themeDisplay.setLanguageId("es_ES");

		Assert.assertEquals(
			"max-age=300", _getCDNCacheControlHeaderValue("Surrogate-Control"));

		Mockito.when(
			_cdnConfiguration.cdnCacheControlHeaderName()
		).thenReturn(
			"Edge-Control"
		);

		Mockito.when(
			_cdnConfiguration.cdnCacheControlMaxAge()
		).thenReturn(
			86400
		);

		Assert.assertEquals(
			"max-age=86400", _getCDNCacheControlHeaderValue("Edge-Control"));
		Assert.assertNull(_getCDNCacheControlHeaderValue("Surrogate-Control"));
	}

	@Test
	public void testContributeWhenCDNCacheControlMaxAgeIsZero()
		throws Exception {

		Mockito.when(
			_cdnConfiguration.cdnCacheControlMaxAge()
		).thenReturn(
			0
		);

		Assert.assertNull(_getCDNCacheControlHeaderValue("Surrogate-Control"));
	}

	@Test
	public void testContributeWhenCDNIsNotConfigured() throws Exception {
		Mockito.when(
			_cdnTemplateRegistry.getConfiguredCDNTemplate(
				Mockito.anyLong(), Mockito.eq(_cdnConfiguration))
		).thenReturn(
			null
		);

		Assert.assertNull(_getCDNCacheControlHeaderValue("Surrogate-Control"));
	}

	@Test
	public void testContributeWhenResponseIsNotShareable() throws Exception {

		// Cookie

		MockHttpServletResponse mockHttpServletResponse =
			new MockHttpServletResponse();

		mockHttpServletResponse.addCookie(
			new Cookie(
				RandomTestUtil.randomString(), RandomTestUtil.randomString()));

		Assert.assertNull(
			_getCDNCacheControlHeaderValue(
				"Surrogate-Control", mockHttpServletResponse));

		mockHttpServletResponse = new MockHttpServletResponse();

		mockHttpServletResponse.addCookie(
			new Cookie(
				CookiesConstants.NAME_JSESSIONID,
				RandomTestUtil.randomString()));

		MetaInfoCacheServletResponse metaInfoCacheServletResponse =
			new MetaInfoCacheServletResponse(mockHttpServletResponse);

		metaInfoCacheServletResponse.addCookie(
			new Cookie(
				RandomTestUtil.randomString(), RandomTestUtil.randomString()));

		Assert.assertNull(
			_getCDNCacheControlHeaderValue(
				"Surrogate-Control", metaInfoCacheServletResponse));

		// Error

		mockHttpServletResponse = new MockHttpServletResponse();

		mockHttpServletResponse.setStatus(HttpServletResponse.SC_NOT_FOUND);

		Assert.assertNull(
			_getCDNCacheControlHeaderValue(
				"Surrogate-Control", mockHttpServletResponse));

		// Language from the session or a cookie

		_themeDisplay.setLanguageId("es_ES");

		Assert.assertNull(_getCDNCacheControlHeaderValue("Surrogate-Control"));

		_themeDisplay.setI18nLanguageId("en_US");

		Assert.assertNull(_getCDNCacheControlHeaderValue("Surrogate-Control"));

		_themeDisplay.setI18nLanguageId(null);
		_themeDisplay.setLanguageId("en_US");

		// Redirect

		mockHttpServletResponse = new MockHttpServletResponse();

		mockHttpServletResponse.setStatus(
			HttpServletResponse.SC_MOVED_TEMPORARILY);

		Assert.assertNull(
			_getCDNCacheControlHeaderValue(
				"Surrogate-Control", mockHttpServletResponse));

		// Rule

		Mockito.when(
			_cdnCacheabilityRuleRegistry.isShareable(
				Mockito.any(), Mockito.any(), Mockito.any())
		).thenReturn(
			false
		);

		Assert.assertNull(_getCDNCacheControlHeaderValue("Surrogate-Control"));

		Mockito.when(
			_cdnCacheabilityRuleRegistry.isShareable(
				Mockito.any(), Mockito.any(), Mockito.any())
		).thenReturn(
			true
		);

		// Session ID in the URLs

		_themeDisplay.setAddSessionIdToURL(true);

		Assert.assertNull(_getCDNCacheControlHeaderValue("Surrogate-Control"));
	}

	@Test
	public void testContributeWhenResponseSetsIgnoredCookies()
		throws Exception {

		MockHttpServletResponse mockHttpServletResponse =
			new MockHttpServletResponse();

		mockHttpServletResponse.addCookie(
			new Cookie(
				CookiesConstants.NAME_COOKIE_SUPPORT,
				RandomTestUtil.randomString()));
		mockHttpServletResponse.addCookie(
			new Cookie(
				CookiesConstants.NAME_GUEST_LANGUAGE_ID,
				RandomTestUtil.randomString()));
		mockHttpServletResponse.addCookie(
			new Cookie(
				CookiesConstants.NAME_JSESSIONID,
				RandomTestUtil.randomString()));

		HttpSession httpSession = Mockito.mock(HttpSession.class);

		Mockito.when(
			httpSession.isNew()
		).thenReturn(
			true
		);

		_mockHttpServletRequest.setSession(httpSession);

		Assert.assertEquals(
			"max-age=300",
			_getCDNCacheControlHeaderValue(
				"Surrogate-Control", mockHttpServletResponse));

		mockHttpServletResponse = new MockHttpServletResponse();

		mockHttpServletResponse.addCookie(
			new Cookie(
				CookiesConstants.NAME_JSESSIONID,
				RandomTestUtil.randomString()));

		MetaInfoCacheServletResponse metaInfoCacheServletResponse =
			new MetaInfoCacheServletResponse(mockHttpServletResponse);

		metaInfoCacheServletResponse.addCookie(
			new Cookie(
				CookiesConstants.NAME_COOKIE_SUPPORT,
				RandomTestUtil.randomString()));

		Assert.assertEquals(
			"max-age=300",
			_getCDNCacheControlHeaderValue(
				"Surrogate-Control", metaInfoCacheServletResponse));
	}

	@Test
	public void testContributeWhenUserIsSignedIn() throws Exception {
		_themeDisplay.setSignedIn(true);

		Assert.assertNull(_getCDNCacheControlHeaderValue("Surrogate-Control"));
	}

	private String _getCDNCacheControlHeaderValue(String name)
		throws Exception {

		return _getCDNCacheControlHeaderValue(
			name, new MockHttpServletResponse());
	}

	private String _getCDNCacheControlHeaderValue(
			String name, HttpServletResponse httpServletResponse)
		throws Exception {

		try (SafeCloseable safeCloseable =
				CTCollectionThreadLocal.setProductionModeWithSafeCloseable()) {

			_cdnLayoutResponseHeaderContributor.contribute(
				_mockHttpServletRequest, httpServletResponse,
				Mockito.mock(Layout.class));
		}

		return httpServletResponse.getHeader(name);
	}

	private final CDNCacheabilityRuleRegistry _cdnCacheabilityRuleRegistry =
		Mockito.mock(CDNCacheabilityRuleRegistry.class);
	private final CDNConfiguration _cdnConfiguration = Mockito.mock(
		CDNConfiguration.class);
	private final CDNLayoutResponseHeaderContributor
		_cdnLayoutResponseHeaderContributor =
			new CDNLayoutResponseHeaderContributor();
	private final CDNTemplateRegistry _cdnTemplateRegistry = Mockito.mock(
		CDNTemplateRegistry.class);
	private final MockHttpServletRequest _mockHttpServletRequest =
		new MockHttpServletRequest();
	private final ThemeDisplay _themeDisplay = new ThemeDisplay();

}