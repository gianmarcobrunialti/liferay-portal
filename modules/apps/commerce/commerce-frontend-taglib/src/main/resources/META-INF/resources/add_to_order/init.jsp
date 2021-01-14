<%--
/**
 * Copyright (c) 2000-present Liferay, Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
 * details.
 */
--%>

<%@ taglib uri="http://liferay.com/tld/aui" prefix="aui" %><%@
	taglib uri="http://liferay.com/tld/theme" prefix="liferay-theme" %>
<%@ taglib prefix="liferay-util" uri="http://liferay.com/tld/util" %>

<%@ page import="com.liferay.portal.kernel.util.PortalUtil" %>
<%@ page import="com.liferay.petra.string.StringPool" %>

<liferay-theme:defineObjects />

<%
String block = (String) request.getAttribute("liferay-commerce:add-to-order:block");
String commerceAccountId = (String) request.getAttribute("liferay-commerce:add-to-order:commerceAccountId");
String currencyCode = (String) request.getAttribute("liferay-commerce:add-to-order:currencyCode");
String channelId = (String) request.getAttribute("liferay-commerce:add-to-order:channelId");
String disabled = (String) request.getAttribute("liferay-commerce:add-to-order:disabled");
String isInCart = (String) request.getAttribute("liferay-commerce:add-to-order:isInCart");
String options = (String) request.getAttribute("liferay-commerce:add-to-order:options");
String orderId = (String) request.getAttribute("liferay-commerce:add-to-order:orderId");
String skuId = (String) request.getAttribute("liferay-commerce:add-to-order:skuId");
String spritemap = (String) request.getAttribute("liferay-commerce:add-to-order:spritemap");
String stockQuantity = (String) request.getAttribute("liferay-commerce:add-to-order:stockQuantity");
String willUpdate = (String) request.getAttribute("liferay-commerce:add-to-order:willUpdate");

String randomNamespace = PortalUtil.generateRandomKey(request, "taglib") + StringPool.UNDERLINE;
String addToCartId = randomNamespace + "add_to_cart";
%>
