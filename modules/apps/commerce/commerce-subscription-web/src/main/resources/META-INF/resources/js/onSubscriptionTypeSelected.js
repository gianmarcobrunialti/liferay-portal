/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import { createPortletURL } from 'frontend-js-web';

const navigateToPortletURL = (currentURL, namespace, isDelivery) => {
	const portletURL = createPortletURL(currentURL, {
		subscriptionLength: document.getElementById(
			`${namespace}${isDelivery ? 'deliverySubscription' : 'subscription'}Length`
		).value,
		subscriptionType: document.getElementById(
			`${namespace}${isDelivery ? 'deliverySubscription' : 'subscription'}Type`
		).value,
		maxSubscriptionCycles: document.getElementById(
			`${namespace}${isDelivery ? 'deliveryMax' : 'max'}SubscriptionCycles`
		).value,
	});

	window.location.replace(portletURL.toString());
}

export default ({ currentURL, namespace }) => {
	const subscriptionTypeSelectElement = document.querySelector('select[name="subscriptionType"]');
	const deliverySubscriptionTypeSelectElement = document.querySelector('select[name="deliverySubscriptionType"]');

	const onSubscriptionTypeSelected = (event) => {
		const isDelivery = event.target.name.includes('delivery');

		navigateToPortletURL(currentURL, namespace, isDelivery);
	}

	subscriptionTypeSelectElement.addEventListener('change', onSubscriptionTypeSelected);
	deliverySubscriptionTypeSelectElement.addEventListener('change', onSubscriptionTypeSelected);

	return {
		dispose: () => {
			subscriptionTypeSelectElement.removeEventListener('change', onSubscriptionTypeSelected);
			deliverySubscriptionTypeSelectElement.removeEventListener('change', onSubscriptionTypeSelected);
		}
	}
}