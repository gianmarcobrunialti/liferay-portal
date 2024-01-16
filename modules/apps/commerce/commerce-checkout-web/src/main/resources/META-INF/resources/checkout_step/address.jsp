<%@ page import="com.liferay.portal.kernel.util.HashMapBuilder" %><%--
/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */
--%>

<%@ include file="/init.jsp" %>

<%
CommerceContext commerceContext = (CommerceContext)request.getAttribute(CommerceWebKeys.COMMERCE_CONTEXT);

BaseAddressCheckoutStepDisplayContext baseAddressCheckoutStepDisplayContext = (BaseAddressCheckoutStepDisplayContext)request.getAttribute(CommerceCheckoutWebKeys.COMMERCE_CHECKOUT_STEP_DISPLAY_CONTEXT);

List<CommerceAddress> commerceAddresses = baseAddressCheckoutStepDisplayContext.getCommerceAddresses();

String paramName = baseAddressCheckoutStepDisplayContext.getParamName();

long commerceAddressId = BeanParamUtil.getLong(baseAddressCheckoutStepDisplayContext.getCommerceOrder(), request, paramName);

boolean validCommerceAddressId = false;

CommerceAddress orderCommerceAddress = baseAddressCheckoutStepDisplayContext.getCommerceAddress(commerceAddressId);

if ((orderCommerceAddress == null) || (orderCommerceAddress.getClassNameId() != PortalUtil.getClassNameId(CommerceOrder.class))) {
	commerceAddressId = baseAddressCheckoutStepDisplayContext.getDefaultCommerceAddressId(commerceContext.getCommerceChannelId());

	for (CommerceAddress validCommerceAddress : commerceAddresses) {
		if (commerceAddressId == validCommerceAddress.getCommerceAddressId()) {
			validCommerceAddressId = true;
		}
	}
}
else {
	for (CommerceAddress validCommerceAddress : commerceAddresses) {
		if (Objects.equals(orderCommerceAddress.getName(), validCommerceAddress.getName()) && Objects.equals(orderCommerceAddress.getStreet1(), validCommerceAddress.getStreet1()) && Objects.equals(orderCommerceAddress.getStreet2(), validCommerceAddress.getStreet2()) && Objects.equals(orderCommerceAddress.getStreet3(), validCommerceAddress.getStreet3()) && (orderCommerceAddress.getZip() == validCommerceAddress.getZip()) && (orderCommerceAddress.getCountryId() == validCommerceAddress.getCountryId()) && (orderCommerceAddress.getRegionId() == validCommerceAddress.getRegionId()) && (orderCommerceAddress.getType() == validCommerceAddress.getType()) && (orderCommerceAddress.getLatitude() == validCommerceAddress.getLatitude()) && (orderCommerceAddress.getLongitude() == validCommerceAddress.getLongitude())) {
			validCommerceAddressId = true;

			commerceAddressId = validCommerceAddress.getCommerceAddressId();
		}
	}
}

if (!validCommerceAddressId) {
	commerceAddressId = 0;
}

String selectLabel = "choose-" + baseAddressCheckoutStepDisplayContext.getTitle();

CommerceOrder commerceOrder = commerceContext.getCommerceOrder();

if (commerceOrder.isGuestOrder()) {
	commerceAddressId = 0;
}

CommerceAddress currentCommerceAddress = baseAddressCheckoutStepDisplayContext.getCommerceAddress(commerceAddressId);

AccountEntry accountEntry = commerceContext.getAccountEntry();

boolean hasManageAddressesPermission = baseAddressCheckoutStepDisplayContext.hasPermission(permissionChecker, accountEntry, AccountActionKeys.MANAGE_ADDRESSES);
%>

<liferay-ui:error exception="<%= CommerceOrderDefaultBillingAddressException.class %>" message="no-default-billing-address" />

<c:if test="<%= !GetterUtil.getBoolean(request.getAttribute(CommerceCheckoutWebKeys.SHOW_ERROR_NO_BILLING_ADDRESS)) %>">
	<div class="form-group-autofit">
		<c:if test="<%= !commerceOrder.isGuestOrder() %>">
			<c:if test="<%= baseAddressCheckoutStepDisplayContext.hasPermission(permissionChecker, accountEntry, AccountActionKeys.VIEW_ADDRESSES) %>">
				<aui:select label="<%= selectLabel %>" name="commerceAddress" onChange='<%= liferayPortletResponse.getNamespace() + "selectAddress();" %>' wrapperCssClass="commerce-form-group-item-row form-group-item">
					<c:choose>
						<c:when test="<%= hasManageAddressesPermission %>">
							<aui:option label="add-new-address" value="0" />
						</c:when>
						<c:otherwise>
							<aui:option label="choose-address" value="0" />
						</c:otherwise>
					</c:choose>

					<%
					for (CommerceAddress commerceAddress : commerceAddresses) {
					%>

						<aui:option data-city="<%= HtmlUtil.escapeAttribute(commerceAddress.getCity()) %>" data-country="<%= HtmlUtil.escapeAttribute(String.valueOf(commerceAddress.getCountryId())) %>" data-name="<%= HtmlUtil.escapeAttribute(commerceAddress.getName()) %>" data-phone-number="<%= HtmlUtil.escapeAttribute(commerceAddress.getPhoneNumber()) %>" data-region="<%= HtmlUtil.escapeAttribute(String.valueOf(commerceAddress.getRegionId())) %>" data-street-1="<%= HtmlUtil.escapeAttribute(commerceAddress.getStreet1()) %>" data-street-2="<%= Validator.isNotNull(commerceAddress.getStreet2()) ? HtmlUtil.escapeAttribute(commerceAddress.getStreet2()) : StringPool.BLANK %>" data-street-3="<%= Validator.isNotNull(commerceAddress.getStreet3()) ? HtmlUtil.escapeAttribute(commerceAddress.getStreet3()) : StringPool.BLANK %>" data-zip="<%= HtmlUtil.escapeAttribute(commerceAddress.getZip()) %>" label="<%= HtmlUtil.escape(commerceAddress.getName()) %>" selected="<%= commerceAddressId == commerceAddress.getCommerceAddressId() %>" value="<%= commerceAddress.getCommerceAddressId() %>" />

					<%
					}
					%>

				</aui:select>
			</c:if>
		</c:if>

		<aui:input disabled="<%= commerceAddresses.isEmpty() ? true : false %>" name="<%= paramName %>" type="hidden" value="<%= commerceAddressId %>" />

		<aui:input name="newAddress" type="hidden" value='<%= ((commerceAddressId > 0) || !hasManageAddressesPermission) ? "0" : "1" %>' />
	</div>

	<liferay-ui:error exception="<%= CommerceAddressCityException.class %>" message="please-enter-a-valid-city" />
	<liferay-ui:error exception="<%= CommerceAddressCountryException.class %>" message="please-enter-a-valid-country" />
	<liferay-ui:error exception="<%= CommerceAddressNameException.class %>" message="please-enter-a-valid-name" />
	<liferay-ui:error exception="<%= CommerceAddressStreetException.class %>" message="please-enter-a-valid-street" />
	<liferay-ui:error exception="<%= CommerceAddressZipException.class %>" message="please-enter-a-valid-zip" />
	<liferay-ui:error exception="<%= CommerceOrderBillingAddressException.class %>" message="please-enter-a-valid-address" />
	<liferay-ui:error exception="<%= CommerceOrderShippingAddressException.class %>" message="please-enter-a-valid-address" />
	<liferay-ui:error exception="<%= CommerceOrderShippingAndBillingException.class %>" message="please-enter-a-valid-country-for-the-billing-address" />

	<aui:model-context bean="<%= baseAddressCheckoutStepDisplayContext.getCommerceAddress(commerceAddressId) %>" model="<%= CommerceAddress.class %>" />

	<div class="address-fields">
		<div class="form-group-autofit">
			<aui:input disabled="<%= (commerceAddressId > 0) || !hasManageAddressesPermission %>" label="" name="name" placeholder="name" wrapperCssClass="form-group-item" />

			<aui:input disabled="<%= (commerceAddressId > 0) || !hasManageAddressesPermission %>" label="" name="phoneNumber" placeholder="phone-number" wrapperCssClass="form-group-item" />
		</div>

		<div class="form-group-autofit">
			<aui:input disabled="<%= (commerceAddressId > 0) || !hasManageAddressesPermission %>" label="" name="street1" placeholder="address" wrapperCssClass="form-group-item" />

			<aui:select disabled="<%= (commerceAddressId > 0) || !hasManageAddressesPermission %>" label="" name="countryId" placeholder="country" title="country" wrapperCssClass="form-group-item">
				<aui:validator errorMessage='<%= LanguageUtil.get(request, "please-enter-a-valid-country") %>' name="min">1</aui:validator>
			</aui:select>
		</div>

		<c:choose>
			<c:when test="<%= (commerceAddressId > 0) && (!Validator.isBlank(currentCommerceAddress.getStreet2()) || !Validator.isBlank(currentCommerceAddress.getStreet3())) %>">
				<div class="form-group-autofit">
					<aui:input disabled="<%= (commerceAddressId > 0) || !hasManageAddressesPermission %>" label="" name="street2" placeholder="address-2" wrapperCssClass="form-group-item" />
					<aui:input disabled="<%= (commerceAddressId > 0) || !hasManageAddressesPermission %>" label="" name="street3" placeholder="address-3" wrapperCssClass="form-group-item" />
				</div>
			</c:when>
			<c:otherwise>
				<div class="add-street-link form-group-autofit">
					<aui:a hidden="<%= (commerceAddressId > 0) || !hasManageAddressesPermission %>" href="javascript:void(0);" label="+-add-address-line" onClick='<%= liferayPortletResponse.getNamespace() + "addStreetAddress();" %>' />
				</div>

				<div class="add-street-fields form-group-autofit hide">
					<aui:input disabled="<%= (commerceAddressId > 0) || !hasManageAddressesPermission %>" label="" name="street2" placeholder="address-2" wrapperCssClass="form-group-item" />

					<aui:input disabled="<%= (commerceAddressId > 0) || !hasManageAddressesPermission %>" label="" name="street3" placeholder="address-3" wrapperCssClass="form-group-item" />
				</div>
			</c:otherwise>
		</c:choose>

		<div class="form-group-autofit">
			<aui:input disabled="<%= (commerceAddressId > 0) || !hasManageAddressesPermission %>" label="" name="zip" placeholder="zip" wrapperCssClass="form-group-item" />

			<aui:input disabled="<%= (commerceAddressId > 0) || !hasManageAddressesPermission %>" label="" name="city" placeholder="city" wrapperCssClass="form-group-item" />

			<aui:select disabled="<%= (commerceAddressId > 0) || !hasManageAddressesPermission %>" label="" name="regionId" placeholder="region" title="region" wrapperCssClass="form-group-item" />

			<aui:input disabled="<%= (commerceAddressId > 0) || !hasManageAddressesPermission %>" id="commerceRegionIdInput" label="" name="regionId" placeholder="regionId" title="region" wrapperCssClass="d-none form-group-item" />

			<aui:input disabled="<%= (commerceAddressId > 0) || !hasManageAddressesPermission %>" id="commerceRegionIdName" label="" name="regionId" placeholder="regionName" title="region" wrapperCssClass="d-none form-group-item" />
		</div>

		<div class="form-group-autofit">
			<c:if test="<%= commerceOrder.isGuestOrder() %>">
				<aui:input name="email" required="<%= true %>" type="text" wrapperCssClass="form-group-item">
					<aui:validator name="email" />
				</aui:input>
			</c:if>
		</div>
	</div>

	<c:if test="<%= Objects.equals(CommerceCheckoutWebKeys.SHIPPING_ADDRESS_PARAM_NAME, paramName) && baseAddressCheckoutStepDisplayContext.hasPermission(permissionChecker, accountEntry, AccountActionKeys.MANAGE_ADDRESSES) && baseAddressCheckoutStepDisplayContext.hasViewBillingAddressPermission(permissionChecker, accountEntry) %>">
		<div class="shipping-as-billing">
			<aui:input checked="<%= baseAddressCheckoutStepDisplayContext.isShippingUsedAsBilling() || (commerceAddressId == 0) %>" disabled="<%= false %>" label="use-shipping-address-as-billing-address" name="use-as-billing" type="checkbox" />
		</div>
	</c:if>

	<liferay-frontend:component
		context="<%=
			HashMapBuilder.<String, Object>put(
				"hasManageAddressesPermission", hasManageAddressesPermission
			).put(
				"isShippingUsedAsBilling", baseAddressCheckoutStepDisplayContext.isShippingUsedasBilling()
			).put(
				"paramName", paramName
			)
		%>"
		module="js/address"
	/>

	<liferay-frontend:component
		context="<%=
			HashMapBuilder.<String, Object>put(
				"commerceCountrySelectionMethodName", baseAddressCheckoutStepDisplayContext.getCommerceCountrySelectionMethodName()
			).put(
				"commerceChannelId", commerceContext.getCommerceChannelId()
			).put(
				"countryId", BeanParamUtil.getLong(currentCommerceAddress, request, "countryId", 0)
			).put(
				"regionId", BeanParamUtil.getLong(currentCommerceAddress, request, "regionId", 0)
			)
		%>"
		module="js/selectCountryRegion.js"
	/>
</c:if>