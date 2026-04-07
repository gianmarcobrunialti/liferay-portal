/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

// @ts-nocheck

import React, {Dispatch, SetStateAction, useCallback, useEffect} from 'react';
import {BASE_URL} from '../utils/constants'

import AnalyticsFiltersToolbar from './AnalyticsFiltersToolbar';
import useAnalyticsFilters from "../../../common/hooks/useAnalyticsFilters";
import {AnalyticsFilters, TAnalyticsFilter} from "../types";
import {Breadcrumb} from "@liferay/site-cms-site-initializer";
import RoomAnalyticsFilter from "./filters/RoomAnalyticsFilter";
import ClayNavigationBar from "@clayui/navigation-bar";
import ClayButton from "@clayui/button";
import {navigate} from "frontend-js-web";

interface IProps {
	activeTab: string;
	filtersJSONString: string;
	filterSettings: {
		disabled: boolean;
		interactable: boolean;
		persisted: boolean;
	};
}


export default function Navigation({
	activeTab,
	filterSettings,
	filtersJSONString,
}: IProps) {
	const [filters, setFilter] = useAnalyticsFilters(
		filtersJSONString,
		filterSettings.persisted
	);

	console.log(activeTab, filtersJSONString, filterSettings);

	return (
		<>
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

					<RoomAnalyticsFilter
						filter={filters[AnalyticsFilters.ROOM]}
						setValue={setFilter}
					/>
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
						<ClayButton onClick={() => navigate(`${BASE_URL}/view-overview`)}>
							{Liferay.Language.get('overview')}
						</ClayButton>
					</ClayNavigationBar.Item>

					<ClayNavigationBar.Item
						active={activeTab.includes('timeline')}
						key={Liferay.Language.get('timeline')}
					>
						<ClayButton onClick={() => navigate(`${BASE_URL}/view-timeline`)}>
							{Liferay.Language.get('timeline')}
						</ClayButton>
					</ClayNavigationBar.Item>
				</ClayNavigationBar>
			</div>

			{filterSettings.disabled ? null : (
				<AnalyticsFiltersToolbar
					{...filterSettings}
					filters={filters}
					filtersJSONString={filtersJSONString}
					setValue={setFilter}
				/>
			)}
		</>
	);
}
