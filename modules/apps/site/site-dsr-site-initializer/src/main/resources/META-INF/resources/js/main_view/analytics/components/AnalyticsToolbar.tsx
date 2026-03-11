/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayButton from '@clayui/button';
import ClayNavigationBar from '@clayui/navigation-bar';
import {navigate} from 'frontend-js-web';
import React from 'react';

import {Breadcrumb} from '@liferay/site-cms-site-initializer';

export default function AnalyticsToolbar({
    activeTab = 'overview',
    overviewURL,
    timelineURL,
    visitsURL,
}: {
    activeTab?: string;
    overviewURL: string;
    timelineURL: string;
    visitsURL: string;
}) {
    return (
        <div>
            <div className="d-flex">
                <Breadcrumb
                    breadcrumbItems={[
                        {
                            active: true,
                            label: Liferay.Language.get('analytics'),
                        },
                    ]}
                    hideSpace
                />

                {/* TODO Add room selector */}
            </div>

            <ClayNavigationBar
                aria-label={Liferay.Language.get('navigation')}
                fluidSize={false}
                triggerLabel={activeTab}
            >
                <ClayNavigationBar.Item
                    active={activeTab.includes('overview')}
                    key={Liferay.Language.get('overview')}
                >
                    <ClayButton onClick={() => navigate(overviewURL)}>
                        {Liferay.Language.get('overview')}
                    </ClayButton>
                </ClayNavigationBar.Item>

                <ClayNavigationBar.Item
                    active={activeTab.includes('timeline')}
                    key={Liferay.Language.get('timeline')}
                >
                    <ClayButton onClick={() => navigate(timelineURL)}>
                        {Liferay.Language.get('timeline')}
                    </ClayButton>
                </ClayNavigationBar.Item>

                <ClayNavigationBar.Item
                    active={activeTab.includes('visits')}
                    key={Liferay.Language.get('visits')}
                >
                    <ClayButton onClick={() => navigate(visitsURL)}>
                        {Liferay.Language.get('visits')}
                    </ClayButton>
                </ClayNavigationBar.Item>
            </ClayNavigationBar>
        </div>
    );
}
