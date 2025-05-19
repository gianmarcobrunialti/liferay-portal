/**
 * SPDX-FileCopyrightText: (c) 2023 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {openModal} from 'frontend-js-components-web';

const ERCButtonPropsTransformer = ({additionalProps, ...props}) => ({
	...props,
	onClick(event) {
		event.preventDefault();

		openModal({
			buttons: [
				{
					displayType: 'secondary',
					label: Liferay.Language.get('cancel'),
					type: 'cancel',
				},
				{
					formId,
					label: Liferay.Language.get('submit'),
					type: 'submit',
				},
			],
			containerProps: {
				className,
			},
			id,
			onClose: () => {
				if (refreshOnClose) {
					const refreshTimeout = setTimeout(() => {
						clearTimeout(refreshTimeout);

						window.top.location.reload();
					}, 200);
				}
			},
			onOpen: ({iframeWindow}) => {
				const formElement = iframeWindow.document.querySelector(
					`#${formId}`
				);

				if (formElement) {
					const {
						[`${namespace}redirect`]: {value: redirect = null} = {},
					} = formElement;

					formElement.addEventListener('submit', () => {
						Liferay.fire('closeModal', {
							id,
							redirect,
						});
					});
				}
			},
			size: 'md',
			title: additionalProps.title,
			url: additionalProps.url,
		})
	},
});

export default ERCButtonPropsTransformer;