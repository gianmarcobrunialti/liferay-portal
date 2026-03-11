/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {fetch} from 'frontend-js-web';
import React, {useCallback, useEffect, useState} from 'react';
import useIsInViewport from "./useIsInViewport";
import AnalyticsService from "../services/AnalyticsService";
import {useIsMounted} from "@liferay/frontend-js-react-web";
import {TAnalyticsFilter} from "../../main_view/analytics/types";

export default function useAnalyticsQuery(
    element: HTMLElement,
    query: string,
    settings: any = {checkViewportVisibility: true},
) {
    const isMounted = useIsMounted();
    const isVisible= useIsInViewport(element);

    const [filters, setFilters] = useState<string>('');
    const [response, setResponse] = useState(null);

    const sendRequest = useCallback(async (filters: TAnalyticsFilter) => {
        if (settings.checkViewportVisibility && isVisible) {
            // TODO Apollo useQuery
            const response = await AnalyticsService.get(query, filters);

            setResponse(response as any);
        }
    }, [filters, setResponse,  settings, isVisible]);

    useEffect(() => {
        if (isMounted()) {
            Liferay.on('dsr-filters-updated', sendRequest)
        }

        return () => {
            if (isMounted()) {
                Liferay.detach('dsr-filters-updated', sendRequest);
            }
        }
    }, [sendRequest]);

    return {response, sendRequest};
}