<%--
/**
 * SPDX-FileCopyrightText: (c) 2024 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */
--%>

<%@ taglib uri="http://liferay.com/tld/react" prefix="react" %><%@
taglib uri="http://liferay.com/tld/theme" prefix="liferay-theme" %>

<%@ page import="com.liferay.portal.kernel.util.HashMapBuilder" %><%@
page import="com.liferay.portal.kernel.util.HtmlUtil" %>

<%@ page import="java.util.Map" %><%@
page import="java.util.UUID" %>

<liferay-theme:defineObjects />

<%
long commerceOrderId = (long)request.getAttribute("liferay-commerce:status-label:commerceOrderId");
boolean isOpenOrder = (boolean)request.getAttribute("liferay-commerce:status-label:isOpenOrder");
String namespace = (String)request.getAttribute("liferay-commerce:status-label:namespace");
String selectedStatus = (String)request.getAttribute("liferay-commerce:status-label:selectedStatus");
%>