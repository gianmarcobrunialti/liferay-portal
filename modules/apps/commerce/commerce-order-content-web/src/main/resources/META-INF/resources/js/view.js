/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {delegate} from 'frontend-js-web';

export default function ({namespace}) {
	const requestQuote =
		document.getElementById(`${namespace}requestQuote`) ||
		document.getElementById(`requestQuote`);

	let requestQuoteDelegate = null;

	if (requestQuote) {
		requestQuoteDelegate = delegate(
			requestQuote,
			'click',
			'.request-quote',
			(event) => {
				window[`${namespace}requestQuote`](event);
			}
		);
	}

	const orderTransition = document.getElementById(`${namespace}orderTransition`);

	let orderTransitionDelegate = null;

	if (orderTransition) {
		orderTransitionDelegate = delegate(
			orderTransition,
			'click',
			'.transition-link',
			(event) => {
				window[`${namespace}transition`](event);
			},
		);
	}

	return {
		dispose() {
			if (requestQuoteDelegate) {
				requestQuoteDelegate.dispose();
			}

			if (orderTransitionDelegate) {
				orderTransitionDelegate.dispose();
			}
		},
	};
}
