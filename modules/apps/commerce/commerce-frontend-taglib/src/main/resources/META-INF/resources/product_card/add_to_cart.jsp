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
long accountId = (long) displayProductInformation.get("commerceAccountId");
String currencyCode = (String) displayProductInformation.get("currencyCode");
long channelId = (long) displayProductInformation.get("channelId");
boolean isInCart = (boolean) displayProductInformation.get("isInCart");
long orderId = (long) displayProductInformation.get("orderId");
long skuId = (long) displayProductInformation.get("skuId");
int stockQuantity = (int) displayProductInformation.get("stockQuantity");

String randomNamespace = PortalUtil.generateRandomKey(request, "taglib") + StringPool.UNDERLINE;
String addToCartId = randomNamespace + "add_to_cart";
%>

<%
if (skuId != 0) {
%>
	<commerce-ui:add-to-order
		block="<%= true %>"
		commerceAccountId="<%= accountId %>"
		currencyCode="<%= currencyCode %>"
		channelId="<%= channelId %>"
		disabled="<%= stockQuantity == 0 %>"
		isInCart="<%= isInCart %>"
		orderId="<%= orderId %>"
		skuId="<%= skuId %>"
		stockQuantity="<%= stockQuantity %>"
		spritemap="<%= spritemap %>"
	/>
<%
} else {
%>
	<div class="add-to-cart d-flex my-2 pt-5" id="<%= addToCartId %>">
		<a class="btn btn-block btn-secondary" href="<%= productDetailURL %>" role="button" style="margin-top: 0.35rem">
			<%= LanguageUtil.get(request, "view-all-variants") %>
		</a>
	</div>
<%
}
%>