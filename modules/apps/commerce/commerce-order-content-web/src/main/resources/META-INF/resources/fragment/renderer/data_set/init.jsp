<%--
/**
 * SPDX-FileCopyrightText: (c) 2024 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */
--%>

<%@ taglib uri="http://liferay.com/tld/react" prefix="react" %><%@
	taglib uri="http://liferay.com/tld/theme" prefix="liferay-theme" %><%@
	taglib uri="http://liferay.com/tld/frontend-data-set" prefix="frontend-data-set" %>

<%@ page import="com.liferay.portal.kernel.util.HashMapBuilder" %><%@
	page import="com.liferay.portal.kernel.util.HtmlUtil" %>

<%@ page import="java.util.Map" %><%@
	page import="java.util.UUID" %>

<liferay-theme:defineObjects />

<%
String apiURL = (String)request.getAttribute("liferay-commerce:order-data-set:apiURL");
String displayStyle = (String)request.getAttribute("liferay-commerce:order-data-set:displayStyle");
String key = (String)request.getAttribute("liferay-commerce:order-data-set:key");
%>