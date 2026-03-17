/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {useIsMounted} from '@liferay/frontend-js-react-web';
import {fetch} from 'frontend-js-web';
import React, {useCallback, useEffect, useState} from 'react';

import {TAnalyticsFilter} from '../../main_view/analytics/types';
import AnalyticsService from '../services/AnalyticsService';
import useIsInViewport from './useIsInViewport';
import useAnalyticsFilters from "./useAnalyticsFilters";
import {toFilters} from "../../main_view/analytics/utils";

const formatQuery = (data: any) => {
	let { query, variables } = data;

	const keys = Object.keys(variables).sort((a, b) => b.length - a.length);

	keys.forEach((key) => {
		const value = variables[key];

		const regex = new RegExp(`\\$${key}\\b`, 'g');

		const formattedValue = value === null ? 'null' : JSON.stringify(value);

		query = query.replace(regex, formattedValue);
	});

	query = query.replace(/\$\w+:\s*[\w!]+,?/g, '');

	query = query.replace(/\w+:\s*\$\w+,?/g, '');

	query = query
		.replace(/,\s*\)/g, ')')
		.replace(/\(\s*,/g, '(')
		.replace(/\(\s*\)/g, '')
		.replace(/,\s*,/g, ',');

	return query.trim();

	return query;
};

export default function useAnalyticsQuery({
	element,
	query,
	settings = { checkViewportVisibility: true, useMock: true },
	variables,
}: {
	element: HTMLElement | null;
	query: { mock: any; query: string; };
	settings?: {
		checkViewportVisibility: boolean;
		useMock: boolean;
	},
	variables: any;
}) {
	const isLoading = useState(true);
	const isMounted = useIsMounted();
	const isVisible = useIsInViewport(element);

	const [filters, setFilters] = useAnalyticsFilters('');
	const [response, setResponse] = useState(null);

	const sendRequest = useCallback(
		async (filters: TAnalyticsFilter) => {
			console.log("sendRequest");
			console.log(settings.checkViewportVisibility, isVisible, variables);
			if (settings.checkViewportVisibility && isVisible) {
				const {mock, query: queryString} = query;

				if (settings.useMock) {
					setResponse(mock);
				}
				else {
					const response = await AnalyticsService.post(
						JSON.stringify({ query: queryString, variables}), filters);

					setResponse(response?.data?.[0]);

					console.log(response);
				}
			}
		},
		[filters, isVisible, setResponse, settings, variables]
	);

	useEffect(() => {
		if (isMounted()) {
			Liferay.on('dsr-filters-updated', sendRequest);
		}

		return () => {
			if (isMounted()) {
				Liferay.detach('dsr-filters-updated', sendRequest);
			}
		};
	}, [sendRequest]);

	return {isLoading, response, sendRequest};
}
