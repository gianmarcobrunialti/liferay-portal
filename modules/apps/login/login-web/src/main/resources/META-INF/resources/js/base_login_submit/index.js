/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

function handleSubmit({
	formName,
	isEnablePersistentCookies,
	isSessionCookieSupport,
	loginURL,
	namespace,
	redirect: redirectURL,
}) {

	const form = document.getElementById(`${namespace}${formName}`);

	if (form) {
		form.action = '';

		form.addEventListener('submit', (event) => {
			event.preventDefault();

			if (isEnablePersistentCookies && isSessionCookieSupport) {
				if (!navigator.cookieEnabled) {
					document
						.getElementById(`${namespace}cookieDisabled`)
						.classList.remove('hide');

					return;
				}
			}

			if (redirectURL) {
				const redirect = form.querySelector(`#${namespace}redirect`);

				if (redirect) {
					const redirectVal = redirect.getAttribute('value');

					redirect.setAttribute(
						'value', redirectVal + window.location.hash);
				}
			}

			form.action = loginURL;

			submitForm(form);
		});

		const password = form.querySelector(`#${namespace}password`);

		if (password) {
			password.addEventListener('keypress', (event) => {
				Liferay.Util.showCapsLock(
					event,
					`${namespace}passwordCapsLockSpan`
				);
			});
		}
	}
	
	const signInButton = document.getElementsByClassName(
		'btn disabled btn-primary'
	)[0];

	if (signInButton) {
		signInButton.classList.remove('disabled');
		signInButton.disabled = false;
	}
}

export default function attachSubmitHandler(props) {
	const handler = () => {
		handleSubmit(props);
	};

	window.document.addEventListener('DOMContentLoaded', handler);

	return {
		dispose: () => {
			window.document.removeEventListener('DOMContentLoaded', handler);
		}
	}
}

