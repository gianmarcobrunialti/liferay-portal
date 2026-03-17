/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ApiHelper} from "@liferay/site-cms-site-initializer";
import {
    TAnalyticsFilter,
    TAnalyticsFilterValue
} from "../../main_view/analytics/types";

const QUERY_ANALYTICS_URL = '';
const STORE_ANALYTICS_FILTERS_URL = '/dsr/analytics/store_filters';

function get(query: string, filters: TAnalyticsFilter) {
    console.log('fetch');

    // TODO implement fetch for GQL endpoint
}

function storeFilters(filters: TAnalyticsFilterValue) {
    return ApiHelper.post(STORE_ANALYTICS_FILTERS_URL, {
        filters: JSON.stringify(filters)
    });
}

export default {get, storeFilters}