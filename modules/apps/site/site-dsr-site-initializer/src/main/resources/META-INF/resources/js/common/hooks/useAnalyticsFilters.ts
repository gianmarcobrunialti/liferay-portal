/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import React, {useCallback, useEffect, useState} from 'react';

import {TAnalyticsFilter} from '../../main_view/analytics/types';
import {toFilters, toStoredFilters} from '../../main_view/analytics/utils';
import AnalyticsService from '../services/AnalyticsService';

export default function useAnalyticsFilters(
	filtersJSONString: string | null,
	persisted: boolean = false
) {
	const [filters, setFilters] = useState<TAnalyticsFilter>(
		toFilters(filtersJSONString)
	);

	const storeFilters = useCallback(
		async () => AnalyticsService.storeFilters(toStoredFilters(filters)),
		[filters]
	);

	useEffect(() => {
		if (persisted) {
			storeFilters();
		}
	}, [persisted, storeFilters]);

	return [filters, setFilters];
}
