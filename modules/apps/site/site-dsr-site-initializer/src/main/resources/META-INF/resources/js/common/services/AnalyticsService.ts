/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ApiHelper} from '@liferay/site-cms-site-initializer';

import {
	TAnalyticsFilter,
	TAnalyticsFilterValue,
} from '../../main_view/analytics/types';

const API_URL = 'https://osbasahbackend-ac-stg.lfr.st/api/1.0/graphql';
const STORE_ANALYTICS_FILTERS_URL = '/dsr/analytics/store_filters';

async function post(query: string, filters: TAnalyticsFilter): Promise<any> {
	console.log('fetch');

	// TODO implement fetch for GQL endpoint

	const response = await fetch(API_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'OSB-Asah-Project-ID': 'stg97e94fed78774ba48d0e916f822773d4',
			'OSB-Asah-Data-Source-ID': '808122314969199499',
			'OSB-Asah-Faro-Backend-Security-Signature': 'd65dc054-949c-426a-adb6-205599202390'
		},
		body: JSON.stringify(query),
	});

	if (!response.ok) {
		throw new Error(`API Error: ${response.status} ${response.statusText}`);
	}

	return response;
}

const AJAX = {
	POST(url: string, json = {}, customOptions = {}, params = {}) {
		const options = {
			body: JSON.stringify(json),
			method: 'POST',
			...customOptions,
		};

		return _fetch(url, options, params);
	},
};

function _fetch(url: string, options = {}, params = {}) {
	const formattedURL = new URL(url, Liferay.ThemeDisplay.getPortalURL());

	Object.entries(params).map(([key, value]) => {
		formattedURL.searchParams.append(key, String(value));
	});

	return fetch(formattedURL.pathname + formattedURL.search, {
		...{
			headers: new Headers({
				'Accept': 'application/json',
				'Accept-Language': Liferay.ThemeDisplay.getBCP47LanguageId(),
				'Content-Type': 'application/json',
			}),
		},
		...options,
	})
		.then((response) => {
			if (!response.ok) {
				return response
					.json()
					.catch((parseError) =>
						Promise.reject(new Error(parseError))
					)
					.then((reason) => Promise.reject(reason));
			}

			if (response.status === 204) {
				return Promise.resolve();
			}

			return response.json().catch(() => {
				const contentType = response.headers.get('content-type');

				if (!contentType && response.status === 200) {
					return response;
				}
			});
		})
		.catch((error) => Promise.reject(error));
}

function storeFilters(filters: TAnalyticsFilterValue) {
	return AJAX.POST(
		Liferay.ThemeDisplay.getPathMain() + STORE_ANALYTICS_FILTERS_URL,
		{},
		{},
		{
			filters: JSON.stringify(filters),
		}
	);
}

export default {post, storeFilters};
