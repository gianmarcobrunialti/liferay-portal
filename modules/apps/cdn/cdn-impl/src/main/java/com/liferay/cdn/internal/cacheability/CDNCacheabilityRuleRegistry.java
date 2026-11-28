/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.cdn.internal.cacheability;

import com.liferay.cdn.cacheability.CDNCacheabilityRule;
import com.liferay.osgi.service.tracker.collections.list.ServiceTrackerList;
import com.liferay.osgi.service.tracker.collections.list.ServiceTrackerListFactory;
import com.liferay.portal.kernel.model.Layout;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.osgi.framework.BundleContext;

/**
 * Tracks the registered cacheability rules and asks them whether a response
 * can be shared.
 *
 * @author Gianmarco Brunialti Masera
 */
public class CDNCacheabilityRuleRegistry {

	public CDNCacheabilityRuleRegistry(BundleContext bundleContext) {
		_serviceTrackerList = ServiceTrackerListFactory.open(
			bundleContext, CDNCacheabilityRule.class);
	}

	public void close() {
		_serviceTrackerList.close();
	}

	/**
	 * Returns whether no registered rule vetoes sharing the response. The
	 * first veto stops the evaluation.
	 */
	public boolean isShareable(
		HttpServletRequest httpServletRequest,
		HttpServletResponse httpServletResponse, Layout layout) {

		for (CDNCacheabilityRule cdnCacheabilityRule : _serviceTrackerList) {
			if (!cdnCacheabilityRule.isShareable(
					httpServletRequest, httpServletResponse, layout)) {

				return false;
			}
		}

		return true;
	}

	private final ServiceTrackerList<CDNCacheabilityRule> _serviceTrackerList;

}