/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import React from 'react';
import AnalyticsToolbar from "./AnalyticsToolbar";
import AnalyticsFiltersToolbar from "./AnalyticsFiltersToolbar";

interface IProps {
    activeTab: string;
    filtersJSONString: string;
    filterSettings: {
        disabled: boolean;
        interactable: boolean;
        persisted: boolean;
    },
    room: any;
}

const BASE_URL = `${
    Liferay.ThemeDisplay.getPortalURL()
}/web/dsr/analytics`;

export default function Navigation({
    activeTab,
    filtersJSONString,
    filterSettings,
}: IProps) {

    console.log(activeTab, filtersJSONString, filterSettings);

    return (
        <>
            <AnalyticsToolbar
                activeTab={activeTab}
                overviewURL={`${BASE_URL}/view-overview`}
                timelineURL={`${BASE_URL}/view-timeline`}
            />

            {filterSettings.disabled
                ? null
                : (
                    <AnalyticsFiltersToolbar
                        {...filterSettings}
                        filtersJSONString={filtersJSONString}
                    />
                )
            }
        </>
    );
}