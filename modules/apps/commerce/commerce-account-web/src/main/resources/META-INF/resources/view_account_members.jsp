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

<%@ include file="/init.jsp" %>

<%
CommerceAccountDisplayContext commerceAccountDisplayContext = (CommerceAccountDisplayContext)request.getAttribute(WebKeys.PORTLET_DISPLAY_CONTEXT);

long commerceAccountId = commerceAccountDisplayContext.getCurrentCommerceAccountId();

CommerceAccount commerceAccount = commerceAccountDisplayContext.getCurrentCommerceAccount();

Map<String, String> contextParams = HashMapBuilder.<String, String>put(
	"commerceAccountId", String.valueOf(commerceAccount.getCommerceAccountId())
).build();

PortletURL portletURL = currentURLObj;

portletURL.setParameter(PortletQName.PUBLIC_RENDER_PARAMETER_NAMESPACE + "backURL", backURL);
%>

<clay:data-set-display
	contextParams="<%= contextParams %>"
	creationMenu="<%= commerceAccountDisplayContext.getCreationMenu(renderResponse) %>"
	dataProviderKey="<%= CommerceAccountUserClayDataSetDataSetDisplayView.NAME %>"
	id="<%= CommerceAccountUserClayDataSetDataSetDisplayView.NAME %>"
	itemsPerPage="<%= 10 %>"
	namespace="<%= liferayPortletResponse.getNamespace() %>"
	pageNumber="<%= 1 %>"
	portletURL="<%= commerceAccountDisplayContext.getPortletURL() %>"
	style="stacked"
/>

<c:if test="<%= commerceAccountDisplayContext.hasCommerceAccountModelPermissions(CommerceAccountActionKeys.MANAGE_MEMBERS) %>">
	<%
		String userInvitationComponentId = "user-invitation" + renderResponse.getNamespace();
		Theme themeDisplayTheme = themeDisplay.getTheme();
		String themeDisplayName = themeDisplayTheme.getName();
	%>
	<portlet:actionURL name="inviteUser" var="inviteUserActionURL" />

	<aui:form action="<%= inviteUserActionURL %>" method="post" name="inviteUserFm">
		<aui:input name="<%= Constants.CMD %>" type="hidden" value="<%= Constants.ASSIGN %>" />
		<aui:input name="redirect" type="hidden" value="<%= portletURL %>" />
		<aui:input name="commerceAccountId" type="hidden" value="<%= commerceAccountId %>" />
		<aui:input name="userId" type="hidden" />
		<aui:input name="userIds" type="hidden" />
		<aui:input name="emailAddresses" type="hidden" />
	</aui:form>

	<div class="user-invitation" id="<%= userInvitationComponentId %>"></div>

	<aui:script require="commerce-frontend-js/components/user_invitation/entry as UserInvitation">
		new UserInvitation.default('<%= userInvitationComponentId %>', '<%= userInvitationComponentId %>', {
			accountId: <%= commerceAccountId %>,
			cssClasses: '<%= themeDisplayName.toLowerCase() + "-styled" %>',
			namespace: '<%= renderResponse.getNamespace() %>',
			spritemap: '<%= themeDisplay.getPathThemeImages() + "/lexicon/icons.svg" %>'
		});
	</aui:script>

	<aui:script>
		Liferay.provide(window, 'removeCommerceAccountUser', function (id) {
			document.querySelector('#<portlet:namespace /><%= Constants.CMD %>').value =
				'<%= Constants.REMOVE %>';
			document.querySelector('#<portlet:namespace />userId').value = id;

			submitForm(document.<portlet:namespace />inviteUserFm);
		});
	</aui:script>
</c:if>