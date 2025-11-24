/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';
import React from 'react';

import Test from '../../../src/main/resources/META-INF/resources/js/components/Test';

const renderComponent = ({
	backURL,
	children,
	title = 'New Page',
}: {
	backURL?: string;
	children?: React.ReactNode;
	title?: string;
} = {}) => {
	return render(
		<Test backURL={backURL} title={title}>
			{children}
		</Test>
	);
};

describe('Test', () => {
	it('renders Toolbar with the title but not the Back button', async () => {
		renderComponent();

		expect(
			screen.getByRole('heading', {name: 'New Page'})
		).toBeInTheDocument();
	});
});
