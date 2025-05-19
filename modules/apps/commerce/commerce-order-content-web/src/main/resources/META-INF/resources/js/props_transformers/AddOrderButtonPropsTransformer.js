/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {openModal} from 'frontend-js-components-web';

const AddOrderButtonPropsTransformer = ({additionalProps, ...props}) => ({
	...props,
	onClick(event) {
		event.preventDefault();

		openModal({
			title: Liferay.Language.get('order-type'),
			url: additionalProps.url,
		});
	},
});

export default AddOrderButtonPropsTransformer;