/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */


window.Liferay.on('perform-sign-in', () => {
	const signInButton = document.body.querySelector('button.sign-in');

	if (signInButton) {
		signInButton.click();
	}
});