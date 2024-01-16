/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

export default ({namespace}) => {
	const formElement = document[`${namespace}fm`];

	const processQuoteButton = formElement.querySelector('.process-quote-button');
	const reorderButton = formElement.querySelector('.reorder-button');

	const submit = (event) => {
		formElement[`${namespace}cmd`].value = event.target.value;

		submitForm(formElement);
	}

	if (processQuoteButton) {
		processQuoteButton.addEventListener('click', submit);
	}

	reorderButton.addEventListener('click', submit);

	return {
		dispose: () => {
			reorderButton.removeEventListener('click', submit);

			if (processQuoteButton) {
				processQuoteButton.removeEventListener('click', submit);
			}
		}
	}
}