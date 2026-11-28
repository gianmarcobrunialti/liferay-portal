/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.cdn.internal.purge;

import com.liferay.cdn.purge.CDNPurgeRequest;
import com.liferay.fragment.service.FragmentEntryLinkLocalService;
import com.liferay.fragment.service.FragmentEntryLocalService;
import com.liferay.info.item.InfoItemReference;
import com.liferay.journal.model.JournalArticle;
import com.liferay.layout.display.page.LayoutDisplayPageObjectProvider;
import com.liferay.layout.display.page.LayoutDisplayPageProvider;
import com.liferay.layout.display.page.LayoutDisplayPageProviderRegistry;
import com.liferay.layout.model.LayoutClassedModelUsage;
import com.liferay.layout.service.LayoutClassedModelUsageLocalService;
import com.liferay.object.service.ObjectDefinitionLocalService;
import com.liferay.object.service.ObjectEntryLocalService;
import com.liferay.portal.kernel.language.Language;
import com.liferay.portal.kernel.model.Company;
import com.liferay.portal.kernel.model.Group;
import com.liferay.portal.kernel.model.Layout;
import com.liferay.portal.kernel.model.LayoutSet;
import com.liferay.portal.kernel.service.CompanyLocalService;
import com.liferay.portal.kernel.service.GroupLocalService;
import com.liferay.portal.kernel.service.LayoutLocalService;
import com.liferay.portal.kernel.service.LayoutSetLocalService;
import com.liferay.portal.kernel.util.HashMapBuilder;
import com.liferay.portal.kernel.util.LocaleUtil;
import com.liferay.portal.kernel.util.Portal;
import com.liferay.portal.kernel.util.PrefsProps;
import com.liferay.portal.kernel.util.PropsKeys;
import com.liferay.portal.kernel.util.SetUtil;
import com.liferay.portal.kernel.util.StringUtil;
import com.liferay.portal.kernel.util.TreeMapBuilder;
import com.liferay.portal.test.rule.LiferayUnitTestRule;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.TreeMap;

import org.junit.Assert;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Test;

import org.mockito.Mockito;

/**
 * @author Gianmarco Brunialti Masera
 */
public class CDNPurgeURLResolverTest {

	@ClassRule
	public static final LiferayUnitTestRule liferayUnitTestRule =
		LiferayUnitTestRule.INSTANCE;

	@Before
	public void setUp() {
		_cdnPurgeURLResolver = new CDNPurgeURLResolver(
			_companyLocalService,
			Mockito.mock(FragmentEntryLinkLocalService.class),
			Mockito.mock(FragmentEntryLocalService.class), _groupLocalService,
			_language, _layoutClassedModelUsageLocalService,
			_layoutDisplayPageProviderRegistry, _layoutLocalService,
			_layoutSetLocalService,
			Mockito.mock(ObjectDefinitionLocalService.class),
			Mockito.mock(ObjectEntryLocalService.class), _portal, _prefsProps,
			true);

		Company company = Mockito.mock(Company.class);

		Mockito.when(
			company.getVirtualHostname()
		).thenReturn(
			"localhost"
		);

		Mockito.when(
			_companyLocalService.fetchCompany(1L)
		).thenReturn(
			company
		);

		Mockito.when(
			_language.getAvailableLocales(Mockito.anyLong())
		).thenReturn(
			SetUtil.fromArray(LocaleUtil.US, LocaleUtil.SPAIN)
		);

		Mockito.when(
			_portal.getClassNameId(JournalArticle.class.getName())
		).thenReturn(
			104L
		);

		Mockito.when(
			_portal.getI18nPathLanguageId(
				Mockito.any(Locale.class), Mockito.anyString())
		).thenAnswer(
			invocation -> {
				Locale locale = invocation.getArgument(0);

				return locale.getLanguage();
			}
		);

		Mockito.when(
			_portal.getPathFriendlyURLPublic()
		).thenReturn(
			"/web"
		);

		Mockito.when(
			_portal.getPortalServerPort(true)
		).thenReturn(
			443
		);

		Mockito.when(
			_portal.getPortalURL(
				Mockito.anyString(), Mockito.eq(443), Mockito.eq(true))
		).thenAnswer(
			invocation -> "https://" + invocation.getArgument(0)
		);

		_mockGroup(20L, "/site", false, new TreeMap<>());
	}

	@Test
	public void testGetLayoutURLs() {
		Assert.assertEquals(
			SetUtil.fromArray(
				"https://localhost/web/site/page",
				"https://localhost/web/site/page/",
				"https://localhost/web/site/pagina",
				"https://localhost/web/site/pagina/",
				"https://localhost/en/web/site/page",
				"https://localhost/en/web/site/page/",
				"https://localhost/es/web/site/pagina",
				"https://localhost/es/web/site/pagina/"),
			_cdnPurgeURLResolver.getLayoutURLs(_mockLayout(41L, 20L)));

		// Draft, private, and system pages are not reachable by guests

		Layout draftLayout = _mockLayout(42L, 20L);

		Mockito.when(
			draftLayout.isDraftLayout()
		).thenReturn(
			true
		);

		Assert.assertEquals(
			Collections.emptySet(),
			_cdnPurgeURLResolver.getLayoutURLs(draftLayout));

		Layout privateLayout = _mockLayout(42L, 20L);

		Mockito.when(
			privateLayout.isPrivateLayout()
		).thenReturn(
			true
		);

		Assert.assertEquals(
			Collections.emptySet(),
			_cdnPurgeURLResolver.getLayoutURLs(privateLayout));
	}

	@Test
	public void testGetLayoutURLsOfHomePage() {

		// Site with a virtual host

		_mockGroup(
			21L, "/virtual", false,
			TreeMapBuilder.put(
				"www.example.com", ""
			).build());

		Mockito.when(
			_layoutLocalService.getDefaultPlid(21L, false)
		).thenReturn(
			41L
		);

		Set<String> urls = _cdnPurgeURLResolver.getLayoutURLs(
			_mockLayout(41L, 21L));

		Assert.assertTrue(
			urls.containsAll(
				Arrays.asList(
					"https://www.example.com", "https://www.example.com/",
					"https://www.example.com/en", "https://www.example.com/en/",
					"https://www.example.com/es", "https://www.example.com/es/",
					"https://www.example.com/page",
					"https://www.example.com/es/pagina")));

		for (String url : urls) {
			Assert.assertFalse(url, url.contains("/web/"));
		}

		// Default site of the company

		_mockGroup(22L, "/guest", true, new TreeMap<>());

		Mockito.when(
			_layoutLocalService.getDefaultPlid(22L, false)
		).thenReturn(
			41L
		);

		urls = _cdnPurgeURLResolver.getLayoutURLs(_mockLayout(41L, 22L));

		Assert.assertTrue(
			urls.containsAll(
				Arrays.asList(
					"https://localhost", "https://localhost/",
					"https://localhost/es", "https://localhost/web/guest",
					"https://localhost/web/guest/",
					"https://localhost/es/web/guest",
					"https://localhost/web/guest/page")));
	}

	@Test
	public void testGetLayoutURLsOfLanguageVirtualHosts() {
		_mockGroup(
			23L, "/virtual", false,
			TreeMapBuilder.put(
				"de.example.com", "de_DE"
			).put(
				"es.example.com", "es_ES"
			).put(
				"www.example.com", ""
			).build());

		Mockito.when(
			_language.isAvailableLocale(23L, "es_ES")
		).thenReturn(
			true
		);

		Mockito.when(
			_layoutLocalService.getDefaultPlid(23L, false)
		).thenReturn(
			41L
		);

		_mockLayoutDisplayPageProvider(23L);

		Layout layout = _mockLayout(41L, 23L);

		// When the locale is never prepended to friendly URLs, a host bound
		// to a language serves the page without a prefix in its language
		// only, and every language under the language's prefix

		Mockito.when(
			_prefsProps.getInteger(
				1L, PropsKeys.LOCALE_PREPEND_FRIENDLY_URL_STYLE)
		).thenReturn(
			0
		);

		Set<String> urls = _cdnPurgeURLResolver.getLayoutURLs(layout);

		Assert.assertEquals(
			SetUtil.fromArray(
				"https://es.example.com", "https://es.example.com/",
				"https://es.example.com/en", "https://es.example.com/en/",
				"https://es.example.com/en/page",
				"https://es.example.com/en/page/", "https://es.example.com/es",
				"https://es.example.com/es/",
				"https://es.example.com/es/pagina",
				"https://es.example.com/es/pagina/",
				"https://es.example.com/pagina",
				"https://es.example.com/pagina/"),
			_getURLs(urls, "https://es.example.com"));

		// A host without a language, or bound to a language that is not one
		// of the site's languages, serves every localized path without a
		// prefix

		for (String portalURL :
				new String[] {
					"https://de.example.com", "https://www.example.com"
				}) {

			Set<String> portalURLs = _getURLs(urls, portalURL);

			Assert.assertEquals(portalURLs.toString(), 14, portalURLs.size());
			Assert.assertTrue(
				portalURLs.containsAll(
					Arrays.asList(
						portalURL + "/page", portalURL + "/page/",
						portalURL + "/pagina", portalURL + "/pagina/")));
		}

		// The display page resolves the URL title with the locale of the
		// guest's session, so the host serves the URL title of every language
		// without a prefix

		urls = _cdnPurgeURLResolver.getURLCDNPurgeRequest(
			1L, "ns-",
			CDNPurgeRequest.builder(
			).tags(
				"ns-wc52"
			).build(),
			true
		).getURLs();

		Assert.assertTrue(
			urls.containsAll(
				Arrays.asList(
					"https://es.example.com/w/article",
					"https://es.example.com/w/articulo",
					"https://es.example.com/es/w/articulo")));

		// Otherwise, the guest's session and cookies decide the language of
		// the page without a prefix

		for (int localePrependFriendlyURLStyle : new int[] {1, 2, 3}) {
			Mockito.when(
				_prefsProps.getInteger(
					1L, PropsKeys.LOCALE_PREPEND_FRIENDLY_URL_STYLE)
			).thenReturn(
				localePrependFriendlyURLStyle
			);

			Set<String> portalURLs = _getURLs(
				_cdnPurgeURLResolver.getLayoutURLs(layout),
				"https://es.example.com");

			Assert.assertEquals(portalURLs.toString(), 14, portalURLs.size());
			Assert.assertTrue(
				portalURLs.containsAll(
					Arrays.asList(
						"https://es.example.com/page",
						"https://es.example.com/pagina")));
		}
	}

	@Test
	public void testGetURLCDNPurgeRequest() {
		Layout layout = _mockLayout(41L, 20L);

		Mockito.when(
			_layoutLocalService.fetchLayout(41L)
		).thenReturn(
			layout
		);

		Set<String> layoutURLs = _cdnPurgeURLResolver.getLayoutURLs(layout);

		// Page

		CDNPurgeRequest cdnPurgeRequest =
			_cdnPurgeURLResolver.getURLCDNPurgeRequest(
				1L, "ns-",
				CDNPurgeRequest.builder(
				).soft(
					false
				).tags(
					"ns-p41", "ns-p99", "ns-zz1", "other-p41"
				).urls(
					"https://localhost/deleted"
				).build(),
				true);

		Assert.assertFalse(cdnPurgeRequest.isPurgeAll());
		Assert.assertFalse(cdnPurgeRequest.isSoft());
		Assert.assertEquals(Collections.emptySet(), cdnPurgeRequest.getTags());

		Set<String> urls = SetUtil.fromArray("https://localhost/deleted");

		urls.addAll(layoutURLs);

		Assert.assertEquals(urls, cdnPurgeRequest.getURLs());

		// Web content used by a draft page and shown on a display page

		Layout draftLayout = _mockLayout(43L, 20L);

		Mockito.when(
			draftLayout.getClassPK()
		).thenReturn(
			41L
		);

		Mockito.when(
			draftLayout.isDraftLayout()
		).thenReturn(
			true
		);

		Mockito.when(
			_layoutLocalService.fetchLayout(43L)
		).thenReturn(
			draftLayout
		);

		LayoutClassedModelUsage layoutClassedModelUsage = Mockito.mock(
			LayoutClassedModelUsage.class);

		Mockito.when(
			layoutClassedModelUsage.getPlid()
		).thenReturn(
			43L
		);

		Mockito.when(
			_layoutClassedModelUsageLocalService.getLayoutClassedModelUsages(
				104L, 52L, 0, 500, null)
		).thenReturn(
			Collections.singletonList(layoutClassedModelUsage)
		);

		_mockLayoutDisplayPageProvider(20L);

		cdnPurgeRequest = _cdnPurgeURLResolver.getURLCDNPurgeRequest(
			1L, "ns-",
			CDNPurgeRequest.builder(
			).tags(
				"ns-wc52"
			).build(),
			true);

		urls = SetUtil.fromArray(
			"https://localhost/web/site/w/article",
			"https://localhost/web/site/w/article/",
			"https://localhost/en/web/site/w/article",
			"https://localhost/en/web/site/w/article/",
			"https://localhost/web/site/w/articulo",
			"https://localhost/web/site/w/articulo/",
			"https://localhost/es/web/site/w/articulo",
			"https://localhost/es/web/site/w/articulo/");

		urls.addAll(layoutURLs);

		Assert.assertEquals(urls, cdnPurgeRequest.getURLs());
	}

	@Test
	public void testGetURLCDNPurgeRequestOfGroup() {
		List<Layout> layouts = new ArrayList<>();

		for (int i = 0; i < 501; i++) {
			layouts.add(_mockLayout(1000L + i, 20L, "/page-" + i));
		}

		Mockito.when(
			_layoutLocalService.getLayouts(20L, false, 0, 501, null)
		).thenReturn(
			layouts
		);

		// Site and collection tags purge every page of the site, up to the
		// limit

		for (String tag : new String[] {"ns-s20", "ns-l20-104"}) {
			CDNPurgeRequest cdnPurgeRequest =
				_cdnPurgeURLResolver.getURLCDNPurgeRequest(
					1L, "ns-",
					CDNPurgeRequest.builder(
					).tags(
						tag
					).build(),
					true);

			Set<String> urls = cdnPurgeRequest.getURLs();

			Assert.assertEquals(urls.toString(), 500 * 8, urls.size());
			Assert.assertTrue(
				urls.contains("https://localhost/web/site/page-499"));
			Assert.assertFalse(
				urls.contains("https://localhost/web/site/page-500"));
		}

		// Overflow tags are skipped

		Assert.assertEquals(
			Collections.emptySet(),
			_cdnPurgeURLResolver.getURLCDNPurgeRequest(
				1L, "ns-",
				CDNPurgeRequest.builder(
				).tags(
					"ns-x0", "ns-x20"
				).build(),
				true
			).getURLs());

		// Company and group 0 tags purge everything when the CDN can

		for (String tag : new String[] {"ns-c1", "ns-l0-105"}) {
			CDNPurgeRequest cdnPurgeRequest =
				_cdnPurgeURLResolver.getURLCDNPurgeRequest(
					1L, "ns-",
					CDNPurgeRequest.builder(
					).tags(
						"ns-s20", tag
					).build(),
					true);

			Assert.assertTrue(cdnPurgeRequest.isPurgeAll());
			Assert.assertEquals(
				Collections.emptySet(), cdnPurgeRequest.getURLs());
		}

		// Otherwise, they purge every page of every site

		Group group = _groupLocalService.fetchGroup(20L);

		Mockito.when(
			_groupLocalService.getActiveGroups(1L, true, true, 0, 100, null)
		).thenReturn(
			Collections.singletonList(group)
		);

		CDNPurgeRequest cdnPurgeRequest =
			_cdnPurgeURLResolver.getURLCDNPurgeRequest(
				1L, "ns-",
				CDNPurgeRequest.builder(
				).tags(
					"ns-c1"
				).build(),
				false);

		Assert.assertFalse(cdnPurgeRequest.isPurgeAll());
		Assert.assertEquals(
			500 * 8,
			cdnPurgeRequest.getURLs(
			).size());
	}

	private Set<String> _getURLs(Set<String> urls, String portalURL) {
		Set<String> portalURLs = new HashSet<>();

		for (String url : urls) {
			if (!url.equals(portalURL) && !url.startsWith(portalURL + "/")) {
				continue;
			}

			portalURLs.add(url);
		}

		return portalURLs;
	}

	private void _mockGroup(
		long groupId, String friendlyURL, boolean guest,
		TreeMap<String, String> virtualHostnames) {

		Group group = Mockito.mock(Group.class);

		Mockito.when(
			group.getFriendlyURL()
		).thenReturn(
			friendlyURL
		);

		Mockito.when(
			group.getGroupId()
		).thenReturn(
			groupId
		);

		Mockito.when(
			group.isActive()
		).thenReturn(
			true
		);

		Mockito.when(
			group.isGuest()
		).thenReturn(
			guest
		);

		Mockito.when(
			_groupLocalService.fetchGroup(groupId)
		).thenReturn(
			group
		);

		LayoutSet layoutSet = Mockito.mock(LayoutSet.class);

		Mockito.when(
			layoutSet.getVirtualHostnames()
		).thenReturn(
			virtualHostnames
		);

		Mockito.when(
			_layoutSetLocalService.fetchLayoutSet(groupId, false)
		).thenReturn(
			layoutSet
		);
	}

	private Layout _mockLayout(long plid, long groupId) {
		return _mockLayout(plid, groupId, "/page");
	}

	private Layout _mockLayout(long plid, long groupId, String friendlyURL) {
		Layout layout = Mockito.mock(Layout.class);

		Mockito.when(
			layout.getCompanyId()
		).thenReturn(
			1L
		);

		Mockito.when(
			layout.getFriendlyURL()
		).thenReturn(
			friendlyURL
		);

		Mockito.when(
			layout.getFriendlyURLMap()
		).thenReturn(
			HashMapBuilder.put(
				LocaleUtil.SPAIN,
				StringUtil.replace(friendlyURL, "/page", "/pagina")
			).put(
				LocaleUtil.US, friendlyURL
			).build()
		);

		Mockito.when(
			layout.getGroupId()
		).thenReturn(
			groupId
		);

		Mockito.when(
			layout.getPlid()
		).thenReturn(
			plid
		);

		return layout;
	}

	private void _mockLayoutDisplayPageProvider(long groupId) {
		LayoutDisplayPageObjectProvider<?> layoutDisplayPageObjectProvider =
			Mockito.mock(LayoutDisplayPageObjectProvider.class);

		Mockito.when(
			layoutDisplayPageObjectProvider.getGroupId()
		).thenReturn(
			groupId
		);

		Mockito.when(
			layoutDisplayPageObjectProvider.getURLTitle(LocaleUtil.SPAIN)
		).thenReturn(
			"articulo"
		);

		Mockito.when(
			layoutDisplayPageObjectProvider.getURLTitle(LocaleUtil.US)
		).thenReturn(
			"article"
		);

		LayoutDisplayPageProvider<?> layoutDisplayPageProvider = Mockito.mock(
			LayoutDisplayPageProvider.class);

		Mockito.doReturn(
			layoutDisplayPageObjectProvider
		).when(
			layoutDisplayPageProvider
		).getLayoutDisplayPageObjectProvider(
			Mockito.any(InfoItemReference.class)
		);

		Mockito.when(
			layoutDisplayPageProvider.getURLSeparator()
		).thenReturn(
			"/w/"
		);

		Mockito.doReturn(
			layoutDisplayPageProvider
		).when(
			_layoutDisplayPageProviderRegistry
		).getLayoutDisplayPageProviderByClassName(
			1L, JournalArticle.class.getName()
		);
	}

	private CDNPurgeURLResolver _cdnPurgeURLResolver;
	private final CompanyLocalService _companyLocalService = Mockito.mock(
		CompanyLocalService.class);
	private final GroupLocalService _groupLocalService = Mockito.mock(
		GroupLocalService.class);
	private final Language _language = Mockito.mock(Language.class);
	private final LayoutClassedModelUsageLocalService
		_layoutClassedModelUsageLocalService = Mockito.mock(
			LayoutClassedModelUsageLocalService.class);
	private final LayoutDisplayPageProviderRegistry
		_layoutDisplayPageProviderRegistry = Mockito.mock(
			LayoutDisplayPageProviderRegistry.class);
	private final LayoutLocalService _layoutLocalService = Mockito.mock(
		LayoutLocalService.class);
	private final LayoutSetLocalService _layoutSetLocalService = Mockito.mock(
		LayoutSetLocalService.class);
	private final Portal _portal = Mockito.mock(Portal.class);
	private final PrefsProps _prefsProps = Mockito.mock(PrefsProps.class);

}