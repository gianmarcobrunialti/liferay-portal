/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

export default ({ namespace, workflowAction }) => {
	const publishButton = document.getElementById(`${namespace}publishButton`);
	const formElement = document.getElementById(`${namespace}fm`);

	const onPublish = (event) => {
		event.preventDefault();

		if (!formElement) {
			throw new Error(`Form with id: ${namespace} fm not found!`);
		}

		const workflowActionInput = formElement.querySelector(`#${namespace}workflowAction`);

		if (workflowActionInput) {
			workflowActionInput.value = `${workflowAction}`;
		}

		submitForm(formElement);
	}


	publishButton.addEventListener('click', onPublish);


	return {
		dispose: () => {
			publishButton.removeEventListener('click', onPublish);
		}
	}
}