/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.site.dsr.site.initializer.internal.display.context;

import com.liferay.object.model.ObjectDefinition;
import com.liferay.object.model.ObjectEntry;
import com.liferay.object.service.ObjectEntryLocalServiceUtil;
import com.liferay.object.service.ObjectEntryService;
import com.liferay.petra.string.StringPool;
import com.liferay.portal.kernel.json.JSONFactory;
import com.liferay.portal.kernel.json.JSONFactoryUtil;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.json.JSONUtil;
import com.liferay.portal.kernel.service.GroupLocalServiceUtil;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.GetterUtil;
import com.liferay.portal.kernel.util.Validator;
import com.liferay.portal.kernel.util.WebKeys;
import com.liferay.site.dsr.site.initializer.internal.constants.DSRWebKeys;

import jakarta.servlet.ServletContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import java.util.Collections;
import java.util.Map;

import org.osgi.service.component.annotations.Reference;

/**
 * @author Gianmarco Brunialti Masera
 */
public abstract class BaseAnalyticsSectionDisplayContext {

	public BaseAnalyticsSectionDisplayContext(
		HttpServletRequest httpServletRequest,
		ObjectDefinition objectDefinition,
		ObjectEntryService objectEntryService) {

		this.httpServletRequest = httpServletRequest;
		this.objectDefinition = objectDefinition;

		_objectEntryService = objectEntryService;

		themeDisplay = (ThemeDisplay)httpServletRequest.getAttribute(
			WebKeys.THEME_DISPLAY);
	}

	public String getAnalyticsStoreFilters() {
		HttpSession httpSession = httpServletRequest.getSession();

		String filters = (String)httpSession.getAttribute(
			DSRWebKeys.DSR_ANALYTICS_STORE_FILTERS);

		if (Validator.isNotNull(filters)) {
			return filters;
		}

		return StringPool.BLANK;
	}

	public Map<String, Object> getProps() {
		return Collections.emptyMap();
	}

	protected final HttpServletRequest httpServletRequest;
	protected final ObjectDefinition objectDefinition;

	@Reference(
		target = "(osgi.web.symbolicname=com.liferay.site.dsr.site.initializer)"
	)
	protected ServletContext servletContext;

	protected final ThemeDisplay themeDisplay;

	private final ObjectEntryService _objectEntryService;

}