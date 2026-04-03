/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import React, {useEffect, useRef, useState} from 'react';

import AnalyticsFrame from "./AnalyticsFrame";
import Loader from "./Loader";
import EngagementChart from "./EngagementChart";
import useAnalyticsQuery from "../../../common/hooks/useAnalyticsQuery";
import ActivityLogQuery from "../queries/ActivityLogQuery";
import TimelineEngagementChartQuery
	from "../queries/TimelineEngagementChartQuery";
import {IEngagementChartItem} from "../../../common/utils/types";

function TimelineEngagementChart() {
	const [data, setData] = useState<IEngagementChartItem[]>([]);
	const [element, setElement] = useState<HTMLElement | null>(null);

	const {isLoading, response} = useAnalyticsQuery({
		element,
		query: TimelineEngagementChartQuery,
		variables: {
			"interval": "D",
			"emailAddresses" : ["test@liferay.com"],
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
	}, [response]);

	return (
		<AnalyticsFrame
			icon="analytics"
			title={Liferay.Language.get('engagement-timeline')}
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

export default TimelineEngagementChart;
