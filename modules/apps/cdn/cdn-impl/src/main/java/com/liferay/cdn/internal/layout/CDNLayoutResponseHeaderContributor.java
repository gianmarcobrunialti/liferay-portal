/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.cdn.internal.layout;

import com.liferay.asset.kernel.service.AssetEntryLocalService;
import com.liferay.cdn.cache.tag.CDNCacheTagBuilder;
import com.liferay.cdn.configuration.CDNConfiguration;
import com.liferay.cdn.internal.cache.tag.CDNCacheTagHeaderUtil;
import com.liferay.cdn.internal.cacheability.CDNCacheabilityRuleRegistry;
import com.liferay.cdn.internal.template.CDNTemplateRegistry;
import com.liferay.cdn.internal.template.ConfiguredCDNTemplate;
import com.liferay.petra.string.CharPool;
import com.liferay.portal.configuration.module.configuration.ConfigurationProvider;
import com.liferay.portal.kernel.cdn.CDNCacheTagsUtil;
import com.liferay.portal.kernel.change.tracking.CTCollectionThreadLocal;
import com.liferay.portal.kernel.cookies.constants.CookiesConstants;
import com.liferay.portal.kernel.dao.orm.DynamicQuery;
import com.liferay.portal.kernel.dao.orm.ProjectionFactoryUtil;
import com.liferay.portal.kernel.dao.orm.ProjectionList;
import com.liferay.portal.kernel.dao.orm.Property;
import com.liferay.portal.kernel.dao.orm.PropertyFactoryUtil;
import com.liferay.portal.kernel.layout.LayoutResponseHeaderContributor;
import com.liferay.portal.kernel.model.Layout;
import com.liferay.portal.kernel.servlet.HttpHeaders;
import com.liferay.portal.kernel.servlet.HttpMethods;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.LocaleUtil;
import com.liferay.portal.kernel.util.Portal;
import com.liferay.portal.kernel.util.SetUtil;
import com.liferay.portal.kernel.util.StringUtil;
import com.liferay.portal.kernel.util.Validator;
import com.liferay.portal.kernel.util.WebKeys;

import jakarta.servlet.ServletResponse;
import jakarta.servlet.ServletResponseWrapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

import org.osgi.framework.BundleContext;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Reference;

/**
 * Adds the CDN headers to the pages a CDN may cache: public pages requested by
 * guests with GET, outside of a publication. The cache tag header lets the CDN
 * purge a page by tag, and the CDN cache control header lets the CDN cache a
 * page that every guest can share. A signed in response never carries either
 * header, so even a misconfigured CDN has nothing to index or share.
 *
 * @author Gianmarco Brunialti Masera
 */
@Component(service = LayoutResponseHeaderContributor.class)
public class CDNLayoutResponseHeaderContributor
	implements LayoutResponseHeaderContributor {

	@Override
	public void contribute(
			HttpServletRequest httpServletRequest,
			HttpServletResponse httpServletResponse, Layout layout)
		throws Exception {

		if (!Objects.equals(httpServletRequest.getMethod(), HttpMethods.GET) ||
			layout.isDraftLayout() || layout.isPrivateLayout() ||
			!CTCollectionThreadLocal.isProductionMode()) {

			return;
		}

		ThemeDisplay themeDisplay =
			(ThemeDisplay)httpServletRequest.getAttribute(
				WebKeys.THEME_DISPLAY);

		if ((themeDisplay == null) || themeDisplay.isSignedIn()) {
			return;
		}

		long companyId = layout.getCompanyId();

		CDNConfiguration cdnConfiguration =
			_cdnTemplateRegistry.getCDNConfiguration(companyId);

		ConfiguredCDNTemplate configuredCDNTemplate =
			_cdnTemplateRegistry.getConfiguredCDNTemplate(
				companyId, cdnConfiguration);

		if (configuredCDNTemplate == null) {
			return;
		}

		_setCDNCacheControlHeader(
			cdnConfiguration, configuredCDNTemplate, httpServletRequest,
			httpServletResponse, layout, themeDisplay);

		if (!cdnConfiguration.emitCacheTags()) {
			return;
		}

		Set<String> cacheTags = new LinkedHashSet<>();

		cacheTags.add(_cdnCacheTagBuilder.getCompanyCacheTag(companyId));
		cacheTags.add(
			_cdnCacheTagBuilder.getGroupCacheTag(
				companyId, layout.getGroupId()));
		cacheTags.addAll(_cdnCacheTagBuilder.getLayoutCacheTags(layout));

		httpServletResponse.setHeader(
			configuredCDNTemplate.getCacheTagHeaderName(),
			CDNCacheTagHeaderUtil.getHeaderValue(
				cacheTags, configuredCDNTemplate.getCacheTagHeaderMaxBytes(),
				_getModelCacheTags(companyId, httpServletRequest),
				_cdnCacheTagBuilder.getOverflowCacheTag(
					companyId, layout.getGroupId()),
				configuredCDNTemplate.getCacheTagHeaderSeparator()));
	}

	@Activate
	protected void activate(BundleContext bundleContext) {
		_cdnCacheabilityRuleRegistry = new CDNCacheabilityRuleRegistry(
			bundleContext);
		_cdnTemplateRegistry = new CDNTemplateRegistry(
			bundleContext, _configurationProvider);
	}

	@Deactivate
	protected void deactivate() {
		_cdnCacheabilityRuleRegistry.close();
		_cdnTemplateRegistry.close();
	}

	private Set<String> _getModelCacheTags(
		long companyId, HttpServletRequest httpServletRequest) {

		Set<String> modelCacheTags = new LinkedHashSet<>(
			CDNCacheTagsUtil.getCacheTags(httpServletRequest));

		Set<Long> linkedAssetEntryIds =
			(Set<Long>)httpServletRequest.getAttribute(
				WebKeys.LINKED_ASSET_ENTRY_IDS);

		if (SetUtil.isEmpty(linkedAssetEntryIds)) {
			return modelCacheTags;
		}

		DynamicQuery dynamicQuery = _assetEntryLocalService.dynamicQuery();

		Property entryIdProperty = PropertyFactoryUtil.forName("entryId");

		dynamicQuery.add(entryIdProperty.in(linkedAssetEntryIds));

		ProjectionList projectionList = ProjectionFactoryUtil.projectionList();

		projectionList.add(PropertyFactoryUtil.forName("classNameId"));
		projectionList.add(PropertyFactoryUtil.forName("classPK"));

		dynamicQuery.setProjection(projectionList);

		List<Object[]> results = _assetEntryLocalService.dynamicQuery(
			dynamicQuery);

		for (Object[] result : results) {
			String modelCacheTag = _cdnCacheTagBuilder.getModelCacheTag(
				companyId, _portal.getClassName((Long)result[0]),
				(Long)result[1]);

			if (modelCacheTag == null) {
				continue;
			}

			modelCacheTags.add(modelCacheTag);
		}

		return modelCacheTags;
	}

	/**
	 * Returns whether the response sets a cookie other than the session,
	 * cookie support, and guest language cookies that DXP sets on nearly every
	 * guest response. The cookies are read from the response of the servlet
	 * container, which every wrapper passes its cookies to, because a wrapper
	 * only knows the cookies added through it, and the servlet container adds
	 * the session cookie itself. A cookie whose name cannot be read counts as
	 * another cookie.
	 */
	private boolean _hasCookies(HttpServletResponse httpServletResponse) {
		ServletResponse servletResponse = httpServletResponse;

		while (servletResponse instanceof ServletResponseWrapper) {
			ServletResponseWrapper servletResponseWrapper =
				(ServletResponseWrapper)servletResponse;

			servletResponse = servletResponseWrapper.getResponse();
		}

		if (!(servletResponse instanceof HttpServletResponse)) {
			return httpServletResponse.containsHeader(HttpHeaders.SET_COOKIE);
		}

		HttpServletResponse containerHttpServletResponse =
			(HttpServletResponse)servletResponse;

		Collection<String> setCookieHeaderValues =
			containerHttpServletResponse.getHeaders(HttpHeaders.SET_COOKIE);

		if (setCookieHeaderValues.isEmpty()) {
			return httpServletResponse.containsHeader(HttpHeaders.SET_COOKIE);
		}

		for (String setCookieHeaderValue : setCookieHeaderValues) {
			String name = StringUtil.extractFirst(
				setCookieHeaderValue, CharPool.EQUAL);

			if ((name == null) ||
				!_ignoredCookieNames.contains(StringUtil.trim(name))) {

				return true;
			}
		}

		return false;
	}

	/**
	 * Returns whether the response can be shared by every guest that requests
	 * the same URL: a successful response that sets no cookie of its own,
	 * whose URLs do not carry the session ID, rendered in the language that
	 * its URL selects, and that no cacheability rule vetoes. A redirect or an
	 * error has nothing to share, and a cookie of its own would be handed to
	 * every guest. Without a language in the URL, the page is shared only in
	 * the site's default language, because a language taken from the session
	 * or a cookie is one guest's choice.
	 *
	 * <p>
	 * The session, cookie support, and guest language cookies are ignored,
	 * because DXP sets them on nearly every guest response, and on every
	 * response to a guest without cookies, which is how a CDN forwards a
	 * request to fill its cache. Ignoring them is safe only because the CDN
	 * never stores <code>Set-Cookie</code> in a cached copy: otherwise, every
	 * guest served from the cache would receive the session of the guest whose
	 * request filled it. Fastly must remove the header in
	 * <code>vcl_fetch</code>, as the liferay.com service does, and any other
	 * CDN or edge emulator must do the same. A new session does not make the
	 * response less shareable: it holds nothing yet, so the page is rendered
	 * exactly as for any other guest, as long as its URLs do not carry the
	 * session ID.
	 * </p>
	 */
	private boolean _isShareable(
		HttpServletRequest httpServletRequest,
		HttpServletResponse httpServletResponse, Layout layout,
		ThemeDisplay themeDisplay) {

		if ((httpServletResponse.getStatus() != HttpServletResponse.SC_OK) ||
			themeDisplay.isAddSessionIdToURL() ||
			_hasCookies(httpServletResponse)) {

			return false;
		}

		String languageId = themeDisplay.getI18nLanguageId();

		if (Validator.isNull(languageId)) {
			languageId = LocaleUtil.toLanguageId(
				themeDisplay.getSiteDefaultLocale());
		}

		if (!Objects.equals(themeDisplay.getLanguageId(), languageId)) {
			return false;
		}

		return _cdnCacheabilityRuleRegistry.isShareable(
			httpServletRequest, httpServletResponse, layout);
	}

	/**
	 * Tells the CDN, and only the CDN, how long it can cache the response.
	 * Browsers ignore the header and keep following the
	 * <code>Cache-Control</code> header.
	 */
	private void _setCDNCacheControlHeader(
		CDNConfiguration cdnConfiguration,
		ConfiguredCDNTemplate configuredCDNTemplate,
		HttpServletRequest httpServletRequest,
		HttpServletResponse httpServletResponse, Layout layout,
		ThemeDisplay themeDisplay) {

		String cdnCacheControlHeaderName =
			configuredCDNTemplate.getCDNCacheControlHeaderName();

		if (Validator.isNull(cdnCacheControlHeaderName) ||
			(cdnConfiguration.cdnCacheControlMaxAge() <= 0) ||
			!_isShareable(
				httpServletRequest, httpServletResponse, layout,
				themeDisplay)) {

			return;
		}

		httpServletResponse.setHeader(
			cdnCacheControlHeaderName,
			"max-age=" + cdnConfiguration.cdnCacheControlMaxAge());
	}

	private static final Set<String> _ignoredCookieNames = SetUtil.fromArray(
		CookiesConstants.NAME_COOKIE_SUPPORT,
		CookiesConstants.NAME_GUEST_LANGUAGE_ID,
		CookiesConstants.NAME_JSESSIONID);

	@Reference
	private AssetEntryLocalService _assetEntryLocalService;

	@Reference
	private CDNCacheTagBuilder _cdnCacheTagBuilder;

	private CDNCacheabilityRuleRegistry _cdnCacheabilityRuleRegistry;
	private CDNTemplateRegistry _cdnTemplateRegistry;

	@Reference
	private ConfigurationProvider _configurationProvider;

	@Reference
	private Portal _portal;

}