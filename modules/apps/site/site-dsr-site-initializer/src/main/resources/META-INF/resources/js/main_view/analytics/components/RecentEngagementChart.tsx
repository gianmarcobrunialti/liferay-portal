/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import React, {useEffect, useState} from 'react';

import Loader from './Loader';
import AnalyticsFrame from "./AnalyticsFrame";
import {BASE_URL} from "../utils/constants";
import useAnalyticsQuery from "../../../common/hooks/useAnalyticsQuery";
import RecentEngagementChartQuery from "../queries/RecentEngagementChartQuery";
import EngagementChart from "./EngagementChart";
import {IEngagementChartItem} from "../../../common/utils/types";

function RecentEngagementChart() {
	const [data, setData] = useState<IEngagementChartItem[]>([]);
	const [element, setElement] = useState<HTMLElement | null>(null);

	const {isLoading, response} = useAnalyticsQuery({
		element,
		query: RecentEngagementChartQuery,
		variables: {
			"interval": "D",
			"devices": "Any",
			"location": "Any",
			"rangeEnd": null,
			"rangeKey": 7,
			"rangeStart": null,
			"channelId": "808122315193619922"
		}
	});

	useEffect(() => {
		if (response) {
			setData(response);
		}

		return () => {};
	}, [response]);

	return (
		<AnalyticsFrame
			icon="analytics"
			title={Liferay.Language.get('recent-engagement')}
			url={`${BASE_URL}/view-timeline`}
		>
			<div ref={setElement}>
				{isLoading ? (
					<Loader />
				) : !data?.length ? (
					<p className="text-muted">
						{Liferay.Language.get('no-data-available')}
					</p>
				) : (<EngagementChart data={data} />)}
			</div>
		</AnalyticsFrame>
	);
}

export default RecentEngagementChart;
