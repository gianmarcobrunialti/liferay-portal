<%--
/**
 * SPDX-FileCopyrightText: (c) 2024 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */
--%>

<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %><%@
	taglib uri="http://liferay.com/tld/react" prefix="react" %><%@
	taglib uri="http://liferay.com/tld/theme" prefix="liferay-theme" %><%@
	taglib uri="http://liferay.com/tld/frontend" prefix="liferay-frontend" %><%@
	taglib uri="http://liferay.com/tld/frontend-data-set" prefix="frontend-data-set" %>

<%@ page import="com.liferay.portal.kernel.util.HashMapBuilder" %><%@
	page import="com.liferay.portal.kernel.util.HtmlUtil" %><%@
	page import="com.liferay.frontend.taglib.clay.servlet.taglib.util.CreationMenu" %><%@
	page import="com.liferay.frontend.data.set.model.FDSActionDropdownItem" %><%@
	page import="com.liferay.commerce.order.content.web.internal.constants.CommerceOrderFragmentFDSNames" %><%@
	page import="com.liferay.portal.kernel.json.JSONArray" %>
<%@ page import="java.util.List" %>
<%@ page import="java.util.Map" %>


<liferay-theme:defineObjects />

<%
Map<String, Object> additionalProps = (Map<String, Object>)request.getAttribute("liferay-commerce:order-data-set:additionalProps");
String apiURL = (String)request.getAttribute("liferay-commerce:order-data-set:apiURL");
String displayStyle = (String)request.getAttribute("liferay-commerce:order-data-set:displayStyle");
List<FDSActionDropdownItem> fdsActionDropdownItems = (List<FDSActionDropdownItem>)request.getAttribute("liferay-commerce:order-data-set:fdsActionDropdownItems");
CreationMenu fdsCreationMenu = (CreationMenu)request.getAttribute("liferay-commerce:order-data-set:fdsCreationMenu");
String name = (String)request.getAttribute("liferay-commerce:order-data-set:name");
JSONArray orderTypes = (JSONArray)request.getAttribute("liferay-commerce:order-data-set:orderTypes");
String propsTransformer = (String)request.getAttribute("liferay-commerce:order-data-set:propsTransformer");
%>