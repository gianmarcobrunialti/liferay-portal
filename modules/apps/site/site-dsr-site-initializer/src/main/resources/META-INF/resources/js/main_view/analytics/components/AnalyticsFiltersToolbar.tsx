/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import React, {
    useCallback,
    useEffect,
} from 'react';
import useAnalyticsFilters from "../../../common/hooks/useAnalyticsFilters";
import {TAnalyticsFilter} from "../types";

interface IProps {
    additionalProps?: Record<string, any>;
    filtersJSONString: string | null;
    interactable: boolean;
    persisted: boolean;
}


export default function AnalyticsFiltersToolbar(props: IProps) {
    const [filters, setFilters] = useAnalyticsFilters(
        props.filtersJSONString);

    const setValue = useCallback((filter: TAnalyticsFilter) => {
        // @ts-ignore
        setFilters((filters: TAnalyticsFilter) => ({
            ...filters,
            ...filter,
        } as TAnalyticsFilter));
    }, [setFilters]);

    useEffect(() => {
        Liferay.fire('dsr-filters-updated', { filters });
    }, [filters]);

    return props.interactable
        ? null
        : (
            <div className="d-flex">
                {Object.values(filters).map((filter, index) => (
                    filter.active
                        ? (
                            <filter.component
                                {...props.additionalProps}
                                key={index}
                                setValue={setValue}
                                value={filter.value}
                            />
                        ) : null
                ))}
            </div>
        );
}