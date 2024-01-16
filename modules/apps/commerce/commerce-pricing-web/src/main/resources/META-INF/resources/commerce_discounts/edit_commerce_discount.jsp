<%--
/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */
--%>

<%@ include file="/init.jsp" %>

<%
CommerceDiscountDisplayContext commerceDiscountDisplayContext = (CommerceDiscountDisplayContext)request.getAttribute(WebKeys.PORTLET_DISPLAY_CONTEXT);

CommerceDiscount commerceDiscount = commerceDiscountDisplayContext.getCommerceDiscount();
%>

<liferay-portlet:renderURL var="editCommerceDiscountExternalReferenceCodeURL" windowState="<%= LiferayWindowState.POP_UP.toString() %>">
	<portlet:param name="mvcRenderCommandName" value="/commerce_discount/edit_commerce_discount_external_reference_code" />
	<portlet:param name="commerceDiscountId" value="<%= String.valueOf(commerceDiscount.getCommerceDiscountId()) %>" />
</liferay-portlet:renderURL>

<commerce-ui:header
	actions="<%= commerceDiscountDisplayContext.getHeaderActionModels() %>"
	bean="<%= commerceDiscount %>"
	beanIdLabel="id"
	externalReferenceCode="<%= commerceDiscount.getExternalReferenceCode() %>"
	externalReferenceCodeEditUrl="<%= editCommerceDiscountExternalReferenceCodeURL %>"
	model="<%= CommerceDiscount.class %>"
	title="<%= commerceDiscount.getTitle() %>"
/>

<liferay-frontend:screen-navigation
	containerWrapperCssClass="container"
	key="<%= CommerceDiscountScreenNavigationConstants.SCREEN_NAVIGATION_KEY_DISCOUNT_GENERAL %>"
	modelBean="<%= commerceDiscount %>"
	portletURL="<%= currentURLObj %>"
/>

<liferay-frontend:component
	context='<%=
		HashMapBuilder.<String, Object>put(
			"workflowAction", WorkflowConstants.ACTION_PUBLISH
		).build()
	%>'
	module="js/onEdit"
/>