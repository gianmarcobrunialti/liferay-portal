/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.cdn.internal.client.extension.configuration.test;

import com.liferay.arquillian.extension.junit.bridge.junit.Arquillian;
import com.liferay.client.extension.constants.ClientExtensionEntryConstants;
import com.liferay.petra.io.StreamUtil;
import com.liferay.petra.string.StringBundler;
import com.liferay.portal.configuration.test.util.CompanyConfigurationTemporarySwapper;
import com.liferay.portal.configuration.test.util.ConfigurationTestUtil;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.json.JSONUtil;
import com.liferay.portal.kernel.test.rule.AggregateTestRule;
import com.liferay.portal.kernel.test.util.RandomTestUtil;
import com.liferay.portal.kernel.test.util.TestPropsValues;
import com.liferay.portal.kernel.util.HashMapDictionaryBuilder;
import com.liferay.portal.test.rule.FeatureFlag;
import com.liferay.portal.test.rule.Inject;
import com.liferay.portal.test.rule.LiferayIntegrationTestRule;

import com.sun.net.httpserver.HttpServer;

import java.io.InputStream;

import java.net.InetSocketAddress;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Dictionary;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import org.osgi.service.cm.Configuration;
import org.osgi.service.cm.ConfigurationAdmin;

/**
 * @author Gianmarco Brunialti Masera
 */
@RunWith(Arquillian.class)
public class CETConfigurationListenerTest {

	@ClassRule
	@Rule
	public static final AggregateTestRule aggregateTestRule =
		new LiferayIntegrationTestRule();

	@Before
	public void setUp() throws Exception {
		_httpServer = HttpServer.create(
			new InetSocketAddress("127.0.0.1", 0), 0);

		_httpServer.createContext(
			"/purge",
			httpExchange -> {
				try (InputStream inputStream = httpExchange.getRequestBody()) {
					_bodies.add(
						new String(StreamUtil.toByteArray(inputStream)));
				}

				httpExchange.sendResponseHeaders(200, -1);

				httpExchange.close();
			});

		_httpServer.start();
	}

	@After
	public void tearDown() throws Exception {
		for (Configuration configuration : _configurations) {
			ConfigurationTestUtil.deleteConfiguration(configuration);
		}

		_httpServer.stop(0);
	}

	@FeatureFlag("LPD-107638")
	@Test
	public void testConfigurationEvent() throws Exception {
		try (CompanyConfigurationTemporarySwapper
				cdnCompanyConfigurationTemporarySwapper =
					_getCDNCompanyConfigurationTemporarySwapper()) {

			Configuration configuration = _addConfiguration();

			_assertPurge();

			// A node that starts again builds the same configuration

			Dictionary<String, Object> properties =
				configuration.getProperties();

			configuration.update(properties);

			_assertNoPurge();

			properties.put("buildTimestamp", RandomTestUtil.nextLong());

			configuration.update(properties);

			_assertPurge();

			_addConfiguration();
			_addConfiguration();
			_addConfiguration();

			_assertPurge();

			_configurations.remove(configuration);

			configuration.delete();

			_assertPurge();

			for (Configuration curConfiguration : _configurations) {
				curConfiguration.delete();
			}

			_configurations.clear();

			_assertPurge();
		}
	}

	@FeatureFlag(enable = false, value = "LPD-107638")
	@Test
	public void testConfigurationEventWhenFeatureFlagIsDisabled()
		throws Exception {

		try (CompanyConfigurationTemporarySwapper
				cdnCompanyConfigurationTemporarySwapper =
					_getCDNCompanyConfigurationTemporarySwapper()) {

			Configuration configuration = _addConfiguration();

			_assertNoPurge();

			_configurations.remove(configuration);

			configuration.delete();

			_assertNoPurge();
		}
	}

	private Configuration _addConfiguration() throws Exception {
		String name = RandomTestUtil.randomString();

		Configuration configuration =
			_configurationAdmin.getFactoryConfiguration(
				"com.liferay.client.extension.type.configuration." +
					"CETConfiguration",
				name, "?");

		configuration.update(
			HashMapDictionaryBuilder.<String, Object>put(
				"baseURL", "${portalURL}/o/" + name
			).put(
				"buildTimestamp", RandomTestUtil.nextLong()
			).put(
				"companyId", TestPropsValues.getCompanyId()
			).put(
				"name", name
			).put(
				"type", ClientExtensionEntryConstants.TYPE_GLOBAL_CSS
			).put(
				"typeSettings",
				new String[] {
					StringBundler.concat(
						"url=https://", RandomTestUtil.randomString(),
						".com/global.css")
				}
			).build());

		_configurations.add(configuration);

		return configuration;
	}

	private void _assertNoPurge() throws Exception {
		Assert.assertNull(_bodies.poll(5, TimeUnit.SECONDS));
	}

	private void _assertPurge() throws Exception {
		String body = _bodies.poll(30, TimeUnit.SECONDS);

		Assert.assertNotNull(body);

		JSONObject jsonObject = JSONFactoryUtil.createJSONObject(body);

		Assert.assertTrue(jsonObject.getBoolean("soft"));
		Assert.assertEquals(
			Collections.singletonList("lfr-c" + TestPropsValues.getCompanyId()),
			JSONUtil.toStringList(jsonObject.getJSONArray("tags")));

		_assertNoPurge();
	}

	private CompanyConfigurationTemporarySwapper
			_getCDNCompanyConfigurationTemporarySwapper()
		throws Exception {

		InetSocketAddress inetSocketAddress = _httpServer.getAddress();

		return new CompanyConfigurationTemporarySwapper(
			TestPropsValues.getCompanyId(),
			"com.liferay.cdn.configuration.CDNConfiguration",
			HashMapDictionaryBuilder.<String, Object>put(
				"coalesceWindowMs", 1000L
			).put(
				"enabled", true
			).put(
				"endpoint",
				StringBundler.concat(
					"http://127.0.0.1:", inetSocketAddress.getPort(), "/purge")
			).put(
				"templateKey", "custom"
			).build());
	}

	private final BlockingQueue<String> _bodies = new LinkedBlockingQueue<>();

	@Inject
	private ConfigurationAdmin _configurationAdmin;

	private final List<Configuration> _configurations = new ArrayList<>();
	private HttpServer _httpServer;

}