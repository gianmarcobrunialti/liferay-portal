/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.cdn.internal.client.extension.configuration;

import com.liferay.cdn.cache.tag.CDNCacheTagBuilder;
import com.liferay.cdn.configuration.CDNConfiguration;
import com.liferay.cdn.purge.CDNPurgeManager;
import com.liferay.cdn.purge.CDNPurgeRequest;
import com.liferay.client.extension.type.configuration.CETConfiguration;
import com.liferay.osgi.util.configuration.ConfigurationFactoryUtil;
import com.liferay.petra.lang.CentralizedThreadLocal;
import com.liferay.petra.string.StringBundler;
import com.liferay.petra.string.StringPool;
import com.liferay.portal.configuration.module.configuration.ConfigurationProvider;
import com.liferay.portal.kernel.cache.thread.local.Lifecycle;
import com.liferay.portal.kernel.cache.thread.local.ThreadLocalCacheManager;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.kernel.module.util.SystemBundleUtil;
import com.liferay.portal.kernel.service.CompanyLocalService;
import com.liferay.portal.kernel.service.PortalPreferencesLocalService;
import com.liferay.portal.kernel.util.ArrayUtil;
import com.liferay.portal.kernel.util.DigesterUtil;
import com.liferay.portal.kernel.util.NamedThreadFactory;
import com.liferay.portal.kernel.util.PortletKeys;

import jakarta.portlet.PortletPreferences;

import java.util.Arrays;
import java.util.Collections;
import java.util.Dictionary;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

import org.osgi.framework.Bundle;
import org.osgi.framework.BundleContext;
import org.osgi.service.cm.Configuration;
import org.osgi.service.cm.ConfigurationAdmin;
import org.osgi.service.cm.ConfigurationEvent;
import org.osgi.service.cm.ConfigurationListener;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Reference;

/**
 * Purges every guest page of the company when a client extension deployed
 * from a client extension project is added, changed, or removed.
 *
 * <p>
 * Every node of a cluster deploys the project on its own and builds its client
 * extension configurations again on each start, so the configuration events
 * alone cannot tell a new build from a restart, and they repeat on every node.
 * The digest of each client extension's configuration is kept in the company
 * preferences, which all nodes share, and only a digest that changes purges.
 * The first node that runs a new build purges, and the other nodes and the
 * restarts find the same digest and do not.
 * </p>
 *
 * <p>
 * Changes are collected per company until no client extension changes for the
 * company's coalesce window, so a project with many client extensions, or a
 * start that deploys many projects, sends one purge.
 * </p>
 *
 * @author Gianmarco Brunialti Masera
 */
@Component(service = ConfigurationListener.class)
public class CETConfigurationListener implements ConfigurationListener {

	@Override
	public void configurationEvent(ConfigurationEvent configurationEvent) {
		if (!Objects.equals(
				configurationEvent.getFactoryPid(),
				CETConfiguration.class.getName())) {

			return;
		}

		String pid = configurationEvent.getPid();

		try {
			if (configurationEvent.getType() == ConfigurationEvent.CM_DELETED) {
				Long companyId = _companyIds.remove(pid);

				// The configurations of client extension projects are deleted
				// when the portal shuts down, which removes nothing for guests

				if ((companyId != null) && !_isShuttingDown()) {
					_schedule(companyId, null, pid);
				}
			}
			else if (configurationEvent.getType() ==
						ConfigurationEvent.CM_UPDATED) {

				Configuration[] configurations =
					_configurationAdmin.listConfigurations(
						"(service.pid=" +
							SystemBundleUtil.escapeFilterValue(pid) + ")");

				if (ArrayUtil.isNotEmpty(configurations)) {
					_update(configurations[0]);
				}
			}
		}
		catch (Exception exception) {
			_log.error(
				"Unable to purge the CDN for client extension configuration " +
					pid,
				exception);
		}
	}

	@Activate
	protected void activate() throws Exception {
		_scheduledExecutorService = Executors.newSingleThreadScheduledExecutor(
			new NamedThreadFactory(
				CETConfigurationListener.class.getName(), Thread.NORM_PRIORITY,
				CETConfigurationListener.class.getClassLoader()));

		// Client extension projects may be deployed before this component
		// activates, so their configurations are compared now

		Configuration[] configurations = _configurationAdmin.listConfigurations(
			"(service.factoryPid=" + CETConfiguration.class.getName() + ")");

		if (configurations == null) {
			return;
		}

		for (Configuration configuration : configurations) {
			try {
				_update(configuration);
			}
			catch (Exception exception) {
				_log.error(
					"Unable to purge the CDN for client extension " +
						"configuration " + configuration.getPid(),
					exception);
			}
		}
	}

	@Deactivate
	protected void deactivate() {
		_scheduledExecutorService.shutdownNow();
	}

	private void _flush(long companyId) {
		Map<String, String> digests = null;

		synchronized (this) {
			digests = _digestsMap.remove(companyId);
		}

		if (digests == null) {
			return;
		}

		try {
			PortletPreferences portletPreferences =
				_portalPreferencesLocalService.getPreferences(
					companyId, PortletKeys.PREFS_OWNER_TYPE_COMPANY);

			boolean modified = false;

			for (Map.Entry<String, String> entry : digests.entrySet()) {
				String key = _PREFERENCE_KEY_PREFIX + entry.getKey();
				String value = entry.getValue();

				if (Objects.equals(
						portletPreferences.getValue(key, null), value)) {

					continue;
				}

				if (value == null) {
					portletPreferences.reset(key);
				}
				else {
					portletPreferences.setValue(key, value);
				}

				modified = true;
			}

			if (!modified) {
				return;
			}

			portletPreferences.store();

			_cdnPurgeManager.purge(
				companyId,
				CDNPurgeRequest.builder(
				).tags(
					_cdnCacheTagBuilder.getCompanyCacheTag(companyId)
				).build());
		}
		catch (Exception exception) {
			_log.error(
				"Unable to purge the CDN for the client extensions of " +
					"company " + companyId,
				exception);
		}
		finally {
			ThreadLocalCacheManager.clearAll(Lifecycle.REQUEST);

			CentralizedThreadLocal.clearShortLivedCentralizedThreadLocals();
		}
	}

	/**
	 * Returns the digest of the properties that change what guest pages
	 * render. The build timestamp changes with every build of the project, so
	 * a new build is detected even when only the files it serves change.
	 */
	private String _getDigest(Dictionary<String, Object> properties) {
		StringBundler sb = new StringBundler(_PROPERTY_KEYS.length * 4);

		for (String key : _PROPERTY_KEYS) {
			Object value = properties.get(key);

			if (value instanceof Object[]) {
				value = Arrays.toString((Object[])value);
			}

			sb.append(key);
			sb.append(StringPool.EQUAL);
			sb.append(value);
			sb.append(StringPool.NEW_LINE);
		}

		return DigesterUtil.digestHex(DigesterUtil.SHA_256, sb.toString());
	}

	private boolean _isShuttingDown() {
		BundleContext bundleContext = SystemBundleUtil.getBundleContext();

		Bundle bundle = bundleContext.getBundle();

		if (bundle.getState() == Bundle.STOPPING) {
			return true;
		}

		return false;
	}

	/**
	 * Adds the client extension's digest, or <code>null</code> when the client
	 * extension is removed, to the company's pending changes and postpones
	 * their comparison until the company's coalesce window passes without
	 * another change.
	 */
	private void _schedule(long companyId, String digest, String pid)
		throws Exception {

		if (!_cdnPurgeManager.isEnabled(companyId)) {
			return;
		}

		CDNConfiguration cdnConfiguration =
			_configurationProvider.getCompanyConfiguration(
				CDNConfiguration.class, companyId);

		String externalReferenceCode =
			ConfigurationFactoryUtil.getExternalReferenceCode(
				CETConfiguration.class.getName(),
				Collections.singletonList(pid));

		synchronized (this) {
			Map<String, String> digests = _digestsMap.computeIfAbsent(
				companyId, key -> new HashMap<>());

			digests.put(externalReferenceCode, digest);

			ScheduledFuture<?> scheduledFuture = _scheduledFutures.put(
				companyId,
				_scheduledExecutorService.schedule(
					() -> _flush(companyId),
					Math.max(0, cdnConfiguration.coalesceWindowMs()),
					TimeUnit.MILLISECONDS));

			if (scheduledFuture != null) {
				scheduledFuture.cancel(false);
			}
		}
	}

	private void _update(Configuration configuration) throws Exception {
		Dictionary<String, Object> properties = configuration.getProperties();

		if (properties == null) {
			return;
		}

		Map<String, Object> propertiesMap = new HashMap<>();

		for (String key : Collections.list(properties.keys())) {
			propertiesMap.put(key, properties.get(key));
		}

		long companyId = ConfigurationFactoryUtil.getCompanyId(
			_companyLocalService, propertiesMap);

		_companyIds.put(configuration.getPid(), companyId);

		_schedule(companyId, _getDigest(properties), configuration.getPid());
	}

	private static final String _PREFERENCE_KEY_PREFIX =
		"cdn.client.extension.digest.";

	private static final String[] _PROPERTY_KEYS = {
		"baseURL", "buildTimestamp", "name", "properties", "type",
		"typeSettings"
	};

	private static final Log _log = LogFactoryUtil.getLog(
		CETConfigurationListener.class);

	@Reference
	private CDNCacheTagBuilder _cdnCacheTagBuilder;

	@Reference
	private CDNPurgeManager _cdnPurgeManager;

	private final Map<String, Long> _companyIds = new ConcurrentHashMap<>();

	@Reference
	private CompanyLocalService _companyLocalService;

	@Reference
	private ConfigurationAdmin _configurationAdmin;

	@Reference
	private ConfigurationProvider _configurationProvider;

	private final Map<Long, Map<String, String>> _digestsMap = new HashMap<>();

	@Reference
	private PortalPreferencesLocalService _portalPreferencesLocalService;

	private ScheduledExecutorService _scheduledExecutorService;
	private final Map<Long, ScheduledFuture<?>> _scheduledFutures =
		new HashMap<>();

}