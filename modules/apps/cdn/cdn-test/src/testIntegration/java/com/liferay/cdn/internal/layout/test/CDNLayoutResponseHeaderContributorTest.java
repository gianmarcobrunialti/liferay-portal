/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.cdn.internal.layout.test;

import com.liferay.arquillian.extension.junit.bridge.junit.Arquillian;
import com.liferay.journal.constants.JournalContentPortletKeys;
import com.liferay.journal.constants.JournalFolderConstants;
import com.liferay.journal.model.JournalArticle;
import com.liferay.journal.test.util.JournalTestUtil;
import com.liferay.layout.test.util.LayoutTestUtil;
import com.liferay.petra.io.StreamUtil;
import com.liferay.petra.string.StringBundler;
import com.liferay.petra.string.StringPool;
import com.liferay.portal.configuration.test.util.CompanyConfigurationTemporarySwapper;
import com.liferay.portal.kernel.model.Group;
import com.liferay.portal.kernel.model.Layout;
import com.liferay.portal.kernel.test.rule.AggregateTestRule;
import com.liferay.portal.kernel.test.rule.DeleteAfterTestRun;
import com.liferay.portal.kernel.test.util.GroupTestUtil;
import com.liferay.portal.kernel.test.util.RandomTestUtil;
import com.liferay.portal.kernel.test.util.TestPropsValues;
import com.liferay.portal.kernel.test.util.UserTestUtil;
import com.liferay.portal.kernel.util.Base64;
import com.liferay.portal.kernel.util.HashMapBuilder;
import com.liferay.portal.kernel.util.HashMapDictionaryBuilder;
import com.liferay.portal.kernel.util.PortalUtil;
import com.liferay.portal.kernel.util.SetUtil;
import com.liferay.portal.kernel.util.StringUtil;
import com.liferay.portal.kernel.workflow.WorkflowConstants;
import com.liferay.portal.test.rule.FeatureFlag;
import com.liferay.portal.test.rule.LiferayIntegrationTestRule;
import com.liferay.segments.model.SegmentsExperience;
import com.liferay.segments.service.SegmentsExperienceLocalServiceUtil;
import com.liferay.segments.test.util.SegmentsTestUtil;

import java.io.InputStream;

import java.net.HttpURLConnection;
import java.net.URL;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.Assert;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * @author Gianmarco Brunialti Masera
 */
@RunWith(Arquillian.class)
public class CDNLayoutResponseHeaderContributorTest {

	@ClassRule
	@Rule
	public static final AggregateTestRule aggregateTestRule =
		new LiferayIntegrationTestRule();

	@Before
	public void setUp() throws Exception {
		_group = GroupTestUtil.addGroup();

		UserTestUtil.setUser(TestPropsValues.getUser());
	}

	@FeatureFlag("LPD-107638")
	@Test
	public void testContribute() throws Exception {
		Layout contentLayout = LayoutTestUtil.addTypeContentPublishedLayout(
			_group, RandomTestUtil.randomString(),
			WorkflowConstants.STATUS_APPROVED);

		JournalArticle journalArticle = JournalTestUtil.addArticle(
			_group.getGroupId(),
			JournalFolderConstants.DEFAULT_PARENT_FOLDER_ID);

		Layout portletLayout = LayoutTestUtil.addTypePortletLayout(_group);

		LayoutTestUtil.addPortletToLayout(
			portletLayout, JournalContentPortletKeys.JOURNAL_CONTENT,
			HashMapBuilder.put(
				"articleId", new String[] {journalArticle.getArticleId()}
			).put(
				"groupId",
				new String[] {String.valueOf(journalArticle.getGroupId())}
			).build());

		long companyId = TestPropsValues.getCompanyId();

		try (CompanyConfigurationTemporarySwapper
				companyConfigurationTemporarySwapper =
					_getCompanyConfigurationTemporarySwapper(companyId);
			CompanyConfigurationTemporarySwapper
				basicAuthCompanyConfigurationTemporarySwapper =
					new CompanyConfigurationTemporarySwapper(
						companyId,
						"com.liferay.portal.security.auto.login.basic.auth." +
							"header",
						HashMapDictionaryBuilder.<String, Object>put(
							"enabled", true
						).build())) {

			String companyCacheTag = "lfr-c" + companyId;
			String groupCacheTag = "lfr-s" + _group.getGroupId();

			Assert.assertEquals(
				SetUtil.fromArray(
					companyCacheTag, groupCacheTag,
					"lfr-p" + contentLayout.getPlid()),
				_getCacheTags(contentLayout, false));
			Assert.assertEquals(
				SetUtil.fromArray(
					companyCacheTag, groupCacheTag,
					"lfr-p" + portletLayout.getPlid(),
					"lfr-wc" + journalArticle.getResourcePrimKey()),
				_getCacheTags(portletLayout, false));

			Assert.assertNull(_getCacheTags(contentLayout, true));

			Map<String, List<String>> headerFields = _getHeaderFields(
				contentLayout, null, false);

			Assert.assertEquals(
				Collections.singletonList("max-age=300"),
				headerFields.get("CDN-Cache-Control"));
			Assert.assertNotNull(headerFields.get("Set-Cookie"));

			String cookie = _getCookie(headerFields);

			headerFields = _getHeaderFields(contentLayout, cookie, false);

			Assert.assertEquals(
				Collections.singletonList("max-age=300"),
				headerFields.get("CDN-Cache-Control"));
			Assert.assertNull(headerFields.get("Set-Cookie"));

			headerFields = _getHeaderFields(contentLayout, cookie, true);

			Assert.assertNull(headerFields.get("CDN-Cache-Control"));
		}
	}

	@FeatureFlag("LPD-107638")
	@Test
	public void testContributeWhenCDNIsNotConfigured() throws Exception {
		Layout layout = LayoutTestUtil.addTypeContentPublishedLayout(
			_group, RandomTestUtil.randomString(),
			WorkflowConstants.STATUS_APPROVED);

		String cookie = _getCookie(_getHeaderFields(layout, null, false));

		try (CompanyConfigurationTemporarySwapper
				companyConfigurationTemporarySwapper =
					new CompanyConfigurationTemporarySwapper(
						TestPropsValues.getCompanyId(),
						"com.liferay.cdn.configuration.CDNConfiguration",
						HashMapDictionaryBuilder.<String, Object>put(
							"emitCacheTags", true
						).put(
							"enabled", false
						).put(
							"templateKey", "custom"
						).build())) {

			Map<String, List<String>> headerFields = _getHeaderFields(
				layout, cookie, false);

			Assert.assertNull(headerFields.get("Cache-Tag"));
			Assert.assertNull(headerFields.get("CDN-Cache-Control"));
		}
	}

	@FeatureFlag(enable = false, value = "LPD-107638")
	@Test
	public void testContributeWhenFeatureFlagIsDisabled() throws Exception {
		Layout layout = LayoutTestUtil.addTypeContentPublishedLayout(
			_group, RandomTestUtil.randomString(),
			WorkflowConstants.STATUS_APPROVED);

		try (CompanyConfigurationTemporarySwapper
				companyConfigurationTemporarySwapper =
					_getCompanyConfigurationTemporarySwapper(
						TestPropsValues.getCompanyId())) {

			Assert.assertNull(_getCacheTags(layout, false));

			Map<String, List<String>> headerFields = _getHeaderFields(
				layout, _getCookie(_getHeaderFields(layout, null, false)),
				false);

			Assert.assertNull(headerFields.get("CDN-Cache-Control"));
		}
	}

	@FeatureFlag("LPD-107638")
	@Test
	public void testContributeWhenLayoutHasSegmentsExperiences()
		throws Exception {

		Layout layout = LayoutTestUtil.addTypeContentPublishedLayout(
			_group, RandomTestUtil.randomString(),
			WorkflowConstants.STATUS_APPROVED);

		try (CompanyConfigurationTemporarySwapper
				companyConfigurationTemporarySwapper =
					_getCompanyConfigurationTemporarySwapper(
						TestPropsValues.getCompanyId())) {

			Map<String, List<String>> headerFields = _getHeaderFields(
				layout, null, false);

			Assert.assertEquals(
				Collections.singletonList("max-age=300"),
				headerFields.get("CDN-Cache-Control"));

			SegmentsExperience segmentsExperience =
				SegmentsTestUtil.addSegmentsExperience(
					_group.getGroupId(), layout.getPlid());

			headerFields = _getHeaderFields(layout, null, false);

			Assert.assertNotNull(headerFields.get("Cache-Tag"));
			Assert.assertNull(headerFields.get("CDN-Cache-Control"));

			SegmentsExperienceLocalServiceUtil.deleteSegmentsExperience(
				segmentsExperience);

			headerFields = _getHeaderFields(layout, null, false);

			Assert.assertEquals(
				Collections.singletonList("max-age=300"),
				headerFields.get("CDN-Cache-Control"));
		}
	}

	private Set<String> _getCacheTags(Layout layout, boolean signedIn)
		throws Exception {

		Map<String, List<String>> headerFields = _getHeaderFields(
			layout, null, signedIn);

		List<String> cacheTagHeaderValues = headerFields.get("Cache-Tag");

		if (cacheTagHeaderValues == null) {
			return null;
		}

		return SetUtil.fromArray(StringUtil.split(cacheTagHeaderValues.get(0)));
	}

	private CompanyConfigurationTemporarySwapper
			_getCompanyConfigurationTemporarySwapper(long companyId)
		throws Exception {

		return new CompanyConfigurationTemporarySwapper(
			companyId, "com.liferay.cdn.configuration.CDNConfiguration",
			HashMapDictionaryBuilder.<String, Object>put(
				"emitCacheTags", true
			).put(
				"enabled", true
			).put(
				"templateKey", "custom"
			).build());
	}

	private String _getCookie(Map<String, List<String>> headerFields) {
		List<String> cookies = new ArrayList<>();

		for (String setCookieHeaderValue : headerFields.get("Set-Cookie")) {
			cookies.add(
				StringUtil.extractFirst(
					setCookieHeaderValue, StringPool.SEMICOLON));
		}

		return StringUtil.merge(cookies, "; ");
	}

	private Map<String, List<String>> _getHeaderFields(
			Layout layout, String cookie, boolean signedIn)
		throws Exception {

		URL url = new URL(
			StringBundler.concat(
				"http://localhost:", PortalUtil.getPortalServerPort(false),
				"/web", _group.getFriendlyURL(), layout.getFriendlyURL()));

		HttpURLConnection httpURLConnection =
			(HttpURLConnection)url.openConnection();

		if (signedIn) {
			httpURLConnection.setRequestProperty(
				"Authorization",
				"Basic " + Base64.encode("test@liferay.com:test".getBytes()));
		}

		if (cookie != null) {
			httpURLConnection.setRequestProperty("Cookie", cookie);
		}

		try (InputStream inputStream = httpURLConnection.getInputStream()) {
			Assert.assertEquals(200, httpURLConnection.getResponseCode());

			StreamUtil.toByteArray(inputStream);

			return httpURLConnection.getHeaderFields();
		}
		finally {
			httpURLConnection.disconnect();
		}
	}

	@DeleteAfterTestRun
	private Group _group;

}