<%--
/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */
--%>

<%@ include file="/init.jsp" %>

<%
AccountEntry accountEntry = commerceOrderContentDisplayContext.getAccountEntry();
%>

<liferay-ui:error exception="<%= CommerceOrderAccountLimitException.class %>" message="unable-to-create-a-new-order-as-the-open-order-limit-has-been-reached" />

<liferay-ddm:template-renderer
	className="<%= CommerceOpenOrderContentPortlet.class.getName() %>"
	contextObjects='<%=
		HashMapBuilder.<String, Object>put(
			"commerceOrderContentDisplayContext", commerceOrderContentDisplayContext
		).build()
	%>'
	displayStyle="<%= commerceOrderContentDisplayContext.getDisplayStyle(CommercePortletKeys.COMMERCE_OPEN_ORDER_CONTENT) %>"
	displayStyleGroupId="<%= commerceOrderContentDisplayContext.getDisplayStyleGroupId(CommercePortletKeys.COMMERCE_OPEN_ORDER_CONTENT) %>"
	entries="<%= commerceOrderSearchContainer.getResults() %>"
>
	<frontend-data-set:classic-display
		dataProviderKey="<%= CommerceOrderFDSNames.PENDING_ORDERS %>"
		id="<%= CommerceOrderFDSNames.PENDING_ORDERS %>"
		itemsPerPage="<%= 10 %>"
		style="stacked"
	/>

	<portlet:actionURL name="/commerce_open_order_content/edit_commerce_order" var="editCommerceOrderURL" />

	<c:if test="<%= commerceOrderContentDisplayContext.hasPermission(accountEntry, CommerceOrderActionKeys.ADD_COMMERCE_ORDER) %>">
		<div class="commerce-cta is-visible">
			<aui:form action="<%= editCommerceOrderURL %>" method="post" name="fm">
				<aui:input name="<%= Constants.CMD %>" type="hidden" value="<%= Constants.ADD %>" />
				<aui:input name="redirect" type="hidden" value="<%= currentURL %>" />
				<aui:input name="deleteCommerceOrderIds" type="hidden" />

				<c:choose>
					<c:when test="<%= commerceOrderContentDisplayContext.getCommerceOrderTypesCount() > 1 %>">
						<portlet:renderURL var="viewCommerceOrderOrderTypeURL" windowState="<%= LiferayWindowState.POP_UP.toString() %>">
							<portlet:param name="mvcRenderCommandName" value="/commerce_order_content/view_commerce_order_order_type_modal" />
						</portlet:renderURL>

						<clay:button
							additionalProps="<%=
								HashMapBuilder.<String, Object>put(
									"url", viewCommerceOrderOrderTypeURL
								).build()
							%>"
							cssClass="btn-fixed btn-lg btn-primary"
							disabled="<%= accountEntry == null %>"
							displayType="primary"
							id="add-order"
							label='<%= LanguageUtil.get(request, "add-order") %>'
							propsTransformer="{AddOrderButtonPropsTransformer} from commerce-order-content-web"
							type="button"
						/>
					</c:when>
					<c:otherwise>
						<clay:button
							cssClass="btn-fixed btn-lg btn-primary"
							disabled="<%= accountEntry == null %>"
							displayType="primary"
							id="add-order"
							label='<%= LanguageUtil.get(request, "add-order") %>'
							small="<%= false %>"
							type="submit"
						/>
					</c:otherwise>
				</c:choose>
			</aui:form>
		</div>
	</c:if>
</liferay-ddm:template-renderer>