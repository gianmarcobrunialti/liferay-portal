/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.site.dsr.site.initializer.internal.display.context;

import com.liferay.frontend.data.set.filter.FDSFilter;
import com.liferay.frontend.data.set.model.FDSActionDropdownItem;
import com.liferay.frontend.taglib.clay.servlet.taglib.util.CreationMenu;
import com.liferay.frontend.taglib.clay.servlet.taglib.util.CreationMenuBuilder;
import com.liferay.object.model.ObjectDefinition;
import com.liferay.object.service.ObjectEntryService;
import com.liferay.petra.string.StringBundler;
import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.json.JSONUtil;
import com.liferay.portal.kernel.language.LanguageUtil;
import com.liferay.portal.kernel.model.Layout;
import com.liferay.portal.kernel.util.HashMapBuilder;
import com.liferay.portal.kernel.util.ListUtil;

import jakarta.servlet.http.HttpServletRequest;

import java.util.List;
import java.util.Map;

/**
 * @author Stefano Motta
 */
public class ViewRoomsSectionDisplayContext
	extends BaseSectionDisplayContext {

	public ViewRoomsSectionDisplayContext(
		HttpServletRequest httpServletRequest,
		ObjectDefinition objectDefinition,
		ObjectEntryService objectEntryService) {

		super(httpServletRequest, objectDefinition, objectEntryService);
	}

	public String getAPIURL() {
		StringBundler sb = new StringBundler(5);

		sb.append("/o/search/v1.0/search?emptySearch=true&");
		sb.append("filter=objectDefinitionId eq ");
		sb.append(objectDefinition.getObjectDefinitionId());
		sb.append("&nestedFields=embedded,r_accountToDSRRoom_accountEntryId");

		return sb.toString();
	}

	public CreationMenu getCreationMenu() throws Exception {
		return null;
	}

	public Map<String, Object> getEmptyState() {
		return HashMapBuilder.<String, Object>put(
			"description",
			LanguageUtil.get(
				httpServletRequest, "click-new-to-create-your-first-project")
		).put(
			"image", "/states/cmp_empty_state_projects.svg"
		).put(
			"title", LanguageUtil.get(httpServletRequest, "no-projects-yet")
		).build();
	}

	public List<FDSActionDropdownItem> getFDSActionDropdownItems() {
		return null;
	}

}