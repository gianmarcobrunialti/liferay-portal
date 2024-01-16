/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

const toggleContentBox = (event) => {
	event.preventDefault();

	const isDelivery = event.target.id.includes('delivery');

	const contentElement = document.querySelector(`.${isDelivery ? 'delivery-' : '' }never-ends-content`)

	contentElement.classList.toggle('hide');
}

const validateForm = (event) => {
	const namespace = event.target.dataset.fmNamespace
	const formId = event.target.id;

	const isDelivery = formId.includes('delivery');

	const formValidator = Liferay.Form.get(formId)
		.formValidator;

	formValidator.validateField(`${
		namespace
	}${
		isDelivery ? 'deliveryMax' : 'max'
	}SubscriptionCycles`)
}

export default ({ namespace }) => {
	const neverEndsFormElement = document.getElementById(`${namespace}neverEnds`);
	const deliveryNeverEndsFormElement = document.getElementById(`${namespace}deliveryNeverEnds`);

	const neverEndsToggle = neverEndsFormElement.querySelector('.never-ends-header input');
	const deliveryNeverEndsToggle = deliveryNeverEndsFormElement.querySelector('.delivery-never-ends-header input');

	neverEndsFormElement.addEventListener('change', validateForm);
	neverEndsToggle.addEventListener('click', toggleContentBox);
	deliveryNeverEndsFormElement.addEventListener('change', validateForm);
	deliveryNeverEndsToggle.addEventListener('click', toggleContentBox);

	return {
		dispose: () => {
			neverEndsFormElement.removeEventListener('change', validateForm)
			deliveryNeverEndsFormElement.removeEventListener('change', validateForm)
			neverEndsToggle.removeEventListener('click', toggleContentBox);
			deliveryNeverEndsToggle.removeEventListener('click', toggleContentBox);
		}
	}
}