<%@ taglib prefix="commerce-ui" uri="http://liferay.com/tld/commerce-ui" %>
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

<%@ include file="/product_card/init.jsp" %>

<%
String productImageURL = (String) displayProductInformation.get("productImageURL");
boolean isLowStock = (boolean) displayProductInformation.get("isLowStock");
long skuId = (long) displayProductInformation.get("skuId");
int stockQuantity = (int) displayProductInformation.get("stockQuantity");
%>

<div class="aspect-ratio-bg-cover aspect-ratio-item aspect-ratio-item-center-middle aspect-ratio-item-fluid card-type-asset-icon h-100 w-100"
	 style="background-image: url('<%= productImageURL %>');"></div>


<%
if (skuId != 0) {
%>
<div class="aspect-ratio-item-bottom-left">
	<commerce-ui:availability-label
		isLowStock="<%= isLowStock %>"
		stockQuantity="<%= stockQuantity %>"
	/>
</div>
<%
}
%>