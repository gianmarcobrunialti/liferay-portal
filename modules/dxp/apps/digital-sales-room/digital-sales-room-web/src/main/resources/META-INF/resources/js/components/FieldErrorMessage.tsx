/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayForm from '@clayui/form';
import React from 'react';

type TProps = {
	error: null | string | undefined;
};

export default function FieldErrorMessage({error}: TProps) {
	return (
		<>
			{!!error && (
				<ClayForm.FeedbackItem>
					<ClayForm.FeedbackIndicator symbol="exclamation-full" />

					{error}
				</ClayForm.FeedbackItem>
			)}
		</>
	);
}
