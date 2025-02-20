/**
 * SPDX-FileCopyrightText: (c) 2024 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	COOKIE_TYPES,
	createPortletURL,
	getCookie,
	openModal,
	openToast
} from 'frontend-js-web';
import {
	CommerceFrontendUtils,
	createCommerceCart,
} from 'commerce-frontend-js';

const CommerceCookie = CommerceFrontendUtils.CommerceCookie;

export const CURRENCY_CODE_COOKIE_IDENTIFIER =
	'com.liferay.commerce.currency.model.CommerceCurrency#';

export const DEFAULT_ORDER_DETAILS_PORTLET_ID =
	'com_liferay_commerce_order_content_web_internal_portlet_' +
	'CommerceOpenOrderContentPortlet';

export function getCommerceCurrencyCookie() {
	const {commerceChannelGroupId: groupId} = Liferay.CommerceContext;

	const cookieKey = `${CURRENCY_CODE_COOKIE_IDENTIFIER}${groupId}`;

	const [cookieValue = ''] = getCookie(cookieKey, COOKIE_TYPES.FUNCTIONAL);

	return cookieValue.split('=')[1];
}

export function setCommerceCurrencyCookie(currencyCode) {
	const {commerceChannelGroupId: groupId} = Liferay.CommerceContext;

	const cookie = new CommerceCookie(
		CURRENCY_CODE_COOKIE_IDENTIFIER, COOKIE_TYPES.FUNCTIONAL);

	cookie.setValue(groupId, `currencyCode=${currencyCode}`)
}

export function openCurrencyConfirmationModal(payload) {
	// TODO Change language key with instructions for the user for currency change

	openModal({
		bodyHTML: `
				<div>
					<p>${Liferay.Language.get('the-following-products-are-no-longer-available-and-were-removed-from-the-cart')}</p>
				</div>
			`,
		buttons: [
			{
				displayType: 'secondary',
				label: Liferay.Language.get('cancel'),
				onClick: ({processClose}) => {
					processClose();
				},
				type: 'button',
			},
			{
				displayType: 'warning',
				label: Liferay.Language.get('ok'),
				onClick: ({processClose}) => {
					processClose();

					createCommerceCart(payload);
				},
				type: 'button',
			},
		],
		status: 'warning',
		title: Liferay.Language.get('cart-updated'),
	});
}