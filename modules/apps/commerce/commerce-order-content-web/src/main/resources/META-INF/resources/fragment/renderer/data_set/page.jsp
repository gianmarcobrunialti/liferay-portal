<%--
/**
 * SPDX-FileCopyrightText: (c) 2024 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */
--%>

<%@ include file="/fragment/renderer/data_set/init.jsp" %>

<frontend-data-set:headless-display
	apiURL="<%= apiURL %>"
	id="<%= key %>"
	style="<%= displayStyle %>"
/>