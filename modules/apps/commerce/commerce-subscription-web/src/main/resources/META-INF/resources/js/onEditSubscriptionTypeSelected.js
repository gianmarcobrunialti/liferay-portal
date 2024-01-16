/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

const updateUI = (event, namespace, isDelivery) => {
	const subscriptionType = event.target.value;

	let subscriptionTypeLabel = event.target.options[event.target.selectedIndex];

	if (subscriptionTypeLabel) {
		subscriptionTypeLabel = subscriptionTypeLabel.dataset.label;
	}

	const subscriptionTypePrefix = isDelivery
		? 'deliverySubscription'
		: 'subscription'

	Array.from(
		document.getElementById(
			`${namespace}${subscriptionTypePrefix}TypeContributors`
		).children
	).forEach((child) => {
		child.classList.add('hide');
	});

	const subscriptionTypeContributor = document.getElementById(
		`${namespace}${subscriptionTypePrefix}TypeContributor${subscriptionType}`
	);

	if (subscriptionTypeContributor) {
		subscriptionTypeContributor.classList.remove('hide');
	}

	document.querySelector(
		`#${namespace}${
			isDelivery 
				? 'deliveryCycle' 
				: 'cycle'
		}LengthContainer .input-group-text`
	).innerHTML = subscriptionTypeLabel;
}

export default ({ namespace }) => {
	const editSubscriptionFormElement = document.getElementById(`${namespace}fm`);
	const subscriptionTypeSelectElement = editSubscriptionFormElement.querySelector('select[name="subscriptionType"]');
	const deliverySubscriptionTypeSelectElement = editSubscriptionFormElement.querySelector('select[name="deliverySubscriptionType"]');

	/**
	 * Liferay.Util.toggleBoxes if the elements are not present,
	 * but if they are, it'll handle the indicated checkbox
	 */
	Liferay.Util.toggleBoxes(
		`${namespace}overrideSubscriptionInfo`,
		`${namespace}subscriptionInfo`
	);

	const onSubscriptionTypeSelected = (event) => {
		const isDelivery = event.target.name.includes('delivery');

		updateUI(event, namespace, isDelivery);
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