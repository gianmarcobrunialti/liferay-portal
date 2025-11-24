/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {openModal} from 'frontend-js-components-web';
import React from 'react';

import DSRInitializer from './DSRInitializer';

function Test() {
	const handle = () => {
		return openModal({
			containerProps: {
				className: '',
			},
			contentComponent: ({closeModal}: {closeModal: () => void}) =>
				DSRInitializer({
					closeModal,
					numberOfSteps: 1,
				}),
			size: 'md',
		});
	};

	return (
		<div>
			<button onClick={handle}>click me!</button>
		</div>
	);
}

export default Test;
