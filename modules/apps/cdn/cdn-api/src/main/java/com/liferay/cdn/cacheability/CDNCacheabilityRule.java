/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.cdn.cacheability;

import com.liferay.portal.kernel.model.Layout;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Decides whether a guest page response can be shared by every guest that
 * requests the same URL, so applications that render a page differently for
 * different guests can keep the CDN from caching it. Register an
 * implementation as an OSGi service. The CDN caches a response only when no
 * rule vetoes it.
 *
 * <p>
 * Rules are asked only for public pages requested by guests with GET, with the
 * CDN integration enabled and configured, and only after the built in checks
 * have found the response shareable. Rules run on every such page request, so
 * a rule must read what the render already resolved, such as request
 * attributes, and otherwise only make lookups served by the entity or finder
 * cache. A rule must not throw. When it is unable to decide, it must return
 * <code>false</code>.
 * </p>
 *
 * @author Gianmarco Brunialti Masera
 */
public interface CDNCacheabilityRule {

	/**
	 * Returns <code>false</code> when the response depends on the guest that
	 * requested it, for example on the guest's segments, cookies, or a random
	 * choice, and <code>true</code> otherwise.
	 */
	public boolean isShareable(
		HttpServletRequest httpServletRequest,
		HttpServletResponse httpServletResponse, Layout layout);

}