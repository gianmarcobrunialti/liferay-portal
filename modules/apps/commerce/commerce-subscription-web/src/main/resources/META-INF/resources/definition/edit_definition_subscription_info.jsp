<%--
/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */
--%>

<%@ include file="/init.jsp" %>

<%
CPDefinitionSubscriptionInfoDisplayContext cpDefinitionSubscriptionInfoDisplayContext = (CPDefinitionSubscriptionInfoDisplayContext)request.getAttribute(WebKeys.PORTLET_DISPLAY_CONTEXT);

CPDefinition cpDefinition = cpDefinitionSubscriptionInfoDisplayContext.getCPDefinition();
long cpDefinitionId = cpDefinitionSubscriptionInfoDisplayContext.getCPDefinitionId();
List<CPSubscriptionType> cpSubscriptionTypes = cpDefinitionSubscriptionInfoDisplayContext.getCPSubscriptionTypes();

String defaultCPSubscriptionType = StringPool.BLANK;

if (!cpSubscriptionTypes.isEmpty()) {
	CPSubscriptionType firstCPSubscriptionType = cpSubscriptionTypes.get(0);

	defaultCPSubscriptionType = firstCPSubscriptionType.getName();
}

boolean subscriptionEnabled = BeanParamUtil.getBoolean(cpDefinition, request, "subscriptionEnabled", false);
int subscriptionLength = BeanParamUtil.getInteger(cpDefinition, request, "subscriptionLength", 1);
String subscriptionType = BeanParamUtil.getString(cpDefinition, request, "subscriptionType", defaultCPSubscriptionType);
long maxSubscriptionCycles = BeanParamUtil.getLong(cpDefinition, request, "maxSubscriptionCycles");

boolean deliverySubscriptionEnabled = BeanParamUtil.getBoolean(cpDefinition, request, "deliverySubscriptionEnabled", false);
int deliverySubscriptionLength = BeanParamUtil.getInteger(cpDefinition, request, "deliverySubscriptionLength", 1);
String deliverySubscriptionType = BeanParamUtil.getString(cpDefinition, request, "deliverySubscriptionType", defaultCPSubscriptionType);
long deliveryMaxSubscriptionCycles = BeanParamUtil.getLong(cpDefinition, request, "deliveryMaxSubscriptionCycles");

String defaultCPSubscriptionTypeLabel = StringPool.BLANK;
String defaultDeliveryCPSubscriptionTypeLabel = StringPool.BLANK;

CPSubscriptionType cpSubscriptionType = cpDefinitionSubscriptionInfoDisplayContext.getCPSubscriptionType(subscriptionType);
CPSubscriptionType deliveryCPSubscriptionType = cpDefinitionSubscriptionInfoDisplayContext.getCPSubscriptionType(deliverySubscriptionType);

if (cpSubscriptionType != null) {
	defaultCPSubscriptionTypeLabel = cpDefinitionSubscriptionInfoDisplayContext.getCPSubscriptionTypeLabel(subscriptionLength, cpSubscriptionType, locale);
}

if (deliveryCPSubscriptionType != null) {
	defaultDeliveryCPSubscriptionTypeLabel = cpDefinitionSubscriptionInfoDisplayContext.getCPSubscriptionTypeLabel(deliverySubscriptionLength, deliveryCPSubscriptionType, locale);
}

CPSubscriptionTypeJSPContributor paymentCPSubscriptionTypeJSPContributor = cpDefinitionSubscriptionInfoDisplayContext.getCPSubscriptionTypeJSPContributor(subscriptionType);
CPSubscriptionTypeJSPContributor deliveryCPSubscriptionTypeJSPContributor = cpDefinitionSubscriptionInfoDisplayContext.getCPSubscriptionTypeJSPContributor(deliverySubscriptionType);

boolean ending = false;
boolean deliveryEnding = false;

if (maxSubscriptionCycles > 0) {
	ending = true;
}

if (deliveryMaxSubscriptionCycles > 0) {
	deliveryEnding = true;
}
%>

<clay:alert
	cssClass="mt-3"
	displayType="warning"
	message="all-channels-associated-with-this-product-must-have-at-least-one-payment-method-active-that-supports-recurring-payments"
/>

<portlet:actionURL name="/cp_definitions/edit_cp_definition" var="editProductDefinitionSubscriptionInfoActionURL" />

<aui:form action="<%= editProductDefinitionSubscriptionInfoActionURL %>" method="post" name="fm">
	<aui:input name="<%= Constants.CMD %>" type="hidden" value="updateSubscriptionInfo" />
	<aui:input name="redirect" type="hidden" value="<%= String.valueOf(cpDefinitionSubscriptionInfoDisplayContext.getPortletURL()) %>" />
	<aui:input name="cpDefinitionId" type="hidden" value="<%= cpDefinitionId %>" />
	<aui:input name="workflowAction" type="hidden" value="<%= WorkflowConstants.ACTION_SAVE_DRAFT %>" />

	<aui:model-context bean="<%= cpDefinition %>" model="<%= CPDefinition.class %>" />

	<commerce-ui:panel
		collapsed="<%= !subscriptionEnabled %>"
		collapseLabel='<%= LanguageUtil.get(request, "enable") %>'
		collapseSwitchName='<%= liferayPortletResponse.getNamespace() + "subscriptionEnabled" %>'
		title='<%= LanguageUtil.get(request, "payment-subscription") %>'
	>
		<aui:select name="subscriptionType">

			<%
			for (CPSubscriptionType curCPSubscriptionType : cpSubscriptionTypes) {
			%>

				<aui:option data-label="<%= curCPSubscriptionType.getLabel(locale) %>" label="<%= curCPSubscriptionType.getLabel(locale) %>" selected="<%= subscriptionType.equals(curCPSubscriptionType.getName()) %>" value="<%= curCPSubscriptionType.getName() %>" />

			<%
			}
			%>

		</aui:select>

		<div id="<portlet:namespace />subscriptionTypeContributors">

		<%
		for (CPSubscriptionType curCPSubscriptionType : cpSubscriptionTypes) {
			CPSubscriptionTypeJSPContributor cpSubscriptionTypeJSPContributor = cpDefinitionSubscriptionInfoDisplayContext.getCPSubscriptionTypeJSPContributor(curCPSubscriptionType.getName());

			if (cpSubscriptionTypeJSPContributor == null) {
				continue;
			}
		%>

			<div class="<%= !cpSubscriptionTypeJSPContributor.equals(paymentCPSubscriptionTypeJSPContributor) ? "hide" : "" %>" id="<portlet:namespace />subscriptionTypeContributor<%= curCPSubscriptionType.getName() %>">

				<%
				cpSubscriptionTypeJSPContributor.render(cpDefinition, request, PipingServletResponseFactory.createPipingServletResponse(pageContext));
				%>

			</div>

		<%
		}
		%>

		</div>

		<div id="<portlet:namespace />cycleLengthContainer">
			<aui:input name="subscriptionLength" suffix="<%= defaultCPSubscriptionTypeLabel %>" value="<%= String.valueOf(subscriptionLength) %>">
				<aui:validator name="digits" />

				<aui:validator errorMessage='<%= LanguageUtil.format(request, "please-enter-a-value-greater-than-or-equal-to-x", 1) %>' name="custom">
					<%-- TODO AUI:VALIDATOR scriptlet  --%>
					function(val) {
						var subscriptionEnabled = window.document.querySelector('#<portlet:namespace />subscriptionEnabled');

						if (!subscriptionEnabled.checked) {
							return true;
						}

						if (subscriptionEnabled.checked && parseInt(val, 10) > 0) {
							return true;
						}

						return false;
					}
				</aui:validator>
			</aui:input>
		</div>

		<div id="<portlet:namespace />neverEndsContainer">
			<div class="never-ends-header">
				<aui:input checked="<%= ending ? false : true %>" name="neverEnds" type="toggle-switch" />
			</div>

			<div class="never-ends-content <%= ending ? StringPool.BLANK : "hide" %>">
				<aui:input helpMessage="max-subscription-cycles-help" label="end-after" name="maxSubscriptionCycles" suffix='<%= LanguageUtil.get(request, "cycles") %>' value="<%= String.valueOf(maxSubscriptionCycles) %>">
					<aui:validator name="digits" />

					<aui:validator errorMessage='<%= LanguageUtil.format(request, "please-enter-a-value-greater-than-or-equal-to-x", 1) %>' name="custom">
						<%-- TODO AUI:VALIDATOR scriptlet  --%>
						function(val) {
							var subscriptionNeverEndsCheckbox = window.document.querySelector('#<portlet:namespace />neverEnds');

							if (subscriptionNeverEndsCheckbox && subscriptionNeverEndsCheckbox.checked) {
								return true;
							}

							if (parseInt(val, 10) > 0) {
								return true;
							}

							return false;
						}
					</aui:validator>
				</aui:input>
			</div>
		</div>
	</commerce-ui:panel>

	<commerce-ui:panel
		collapsed="<%= !deliverySubscriptionEnabled %>"
		collapseLabel='<%= LanguageUtil.get(request, "enable") %>'
		collapseSwitchName='<%= liferayPortletResponse.getNamespace() + "deliverySubscriptionEnabled" %>'
		title='<%= LanguageUtil.get(request, "delivery-subscription") %>'
	>
		<aui:select label="subscription-type" name="deliverySubscriptionType">

			<%
			for (CPSubscriptionType curCPSubscriptionType : cpSubscriptionTypes) {
			%>

				<aui:option data-label="<%= curCPSubscriptionType.getLabel(locale) %>" label="<%= curCPSubscriptionType.getLabel(locale) %>" selected="<%= deliverySubscriptionType.equals(curCPSubscriptionType.getName()) %>" value="<%= curCPSubscriptionType.getName() %>" />

			<%
			}
			%>

		</aui:select>

		<div id="<portlet:namespace />deliverySubscriptionTypeContributors">

			<%
			for (CPSubscriptionType curCPSubscriptionType : cpSubscriptionTypes) {
				CPSubscriptionTypeJSPContributor cpSubscriptionTypeJSPContributor = cpDefinitionSubscriptionInfoDisplayContext.getCPSubscriptionTypeJSPContributor(curCPSubscriptionType.getName());

				if (cpSubscriptionTypeJSPContributor == null) {
					continue;
				}
			%>

			<div class="<%= !cpSubscriptionTypeJSPContributor.equals(deliveryCPSubscriptionTypeJSPContributor) ? "hide" : "" %>" id="<portlet:namespace />deliverySubscriptionTypeContributor<%= curCPSubscriptionType.getName() %>">

				<%
				cpSubscriptionTypeJSPContributor.render(cpDefinition, request, PipingServletResponseFactory.createPipingServletResponse(pageContext), false);
				%>

			</div>

			<%
			}
			%>

		</div>

		<div id="<portlet:namespace />deliveryCycleLengthContainer">
			<aui:input label="subscription-length" name="deliverySubscriptionLength" suffix="<%= defaultDeliveryCPSubscriptionTypeLabel %>" value="<%= String.valueOf(deliverySubscriptionLength) %>">
				<aui:validator name="digits" />

				<aui:validator errorMessage='<%= LanguageUtil.format(request, "please-enter-a-value-greater-than-or-equal-to-x", 1) %>' name="custom">
					<%-- TODO AUI:VALIDATOR scriptlet  --%>
					function(val) {
						var deliverySubscriptionEnabled = window.document.querySelector('#<portlet:namespace />deliverySubscriptionEnabled');

						if (!deliverySubscriptionEnabled.checked) {
							return true;
						}

						if (deliverySubscriptionEnabled.checked && parseInt(val, 10) > 0) {
							return true;
						}

						return false;
					}
				</aui:validator>
			</aui:input>
		</div>

		<div id="<portlet:namespace />deliveryNeverEndsContainer">
			<div class="never-ends-header">
				<aui:input checked="<%= deliveryEnding ? false : true %>" label="never-ends" name="deliveryNeverEnds" type="toggle-switch" />
			</div>

			<div class="never-ends-content delivery-never-ends-content <%= ending ? StringPool.BLANK : "hide" %>">
				<aui:input helpMessage="max-subscription-cycles-help" label="end-after" name="deliveryMaxSubscriptionCycles" suffix='<%= LanguageUtil.get(request, "cycles") %>' value="<%= String.valueOf(deliveryMaxSubscriptionCycles) %>">
					<aui:validator name="digits" />

					<aui:validator errorMessage='<%= LanguageUtil.format(request, "please-enter-a-value-greater-than-or-equal-to-x", 1) %>' name="custom">
						<%-- TODO AUI:VALIDATOR scriptlet  --%>
						function(val) {
							var deliveryNeverEndsCheckbox = window.document.querySelector('#<portlet:namespace />deliveryNeverEnds');

							if (deliveryNeverEndsCheckbox && deliveryNeverEndsCheckbox.checked) {
								return true;
							}

							if (parseInt(val, 10) > 0) {
								return true;
							}

							return false;
						}
					</aui:validator>
				</aui:input>
			</div>
		</div>
	</commerce-ui:panel>
</aui:form>

<liferay-frontend:component module="js/onEditSubscriptionTypeSelected" />

<liferay-frontend:component module="js/neverEnds" />