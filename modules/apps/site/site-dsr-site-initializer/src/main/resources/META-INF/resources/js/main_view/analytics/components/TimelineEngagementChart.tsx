/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import React, {useRef} from 'react';

import AnalyticsFrame from "./AnalyticsFrame";
import Loader from "./Loader";
import EngagementChart from "./EngagementChart";
import useAnalyticsQuery from "../../../common/hooks/useAnalyticsQuery";
import ActivityLogQuery from "../queries/ActivityLogQuery";
import TimelineEngagementChartQuery
	from "../queries/TimelineEngagementChartQuery";

function TimelineEngagementChart() {
	const elementRef = useRef(null);

	const {isLoading, response} = useAnalyticsQuery({
		element: elementRef.current,
		query: TimelineEngagementChartQuery,
		variables: {
			channelId: "808122315193619922",
			entityType: "INDIVIDUAL",
			keywords: "",
			rangeEnd: null,
			rangeKey: 7,
			rangeStart: null,
			page: 1,
			size: 20
		}
	});

	if (isLoading) {
		return <Loader />;
	}

	if (!engagementChartItems?.length) {
		return <p>{Liferay.Language.get('no-data-available')}</p>;
	}
	return (
		<AnalyticsFrame
			icon="analytics"
			title={Liferay.Language.get('engagement-timeline')}
		>
			<EngagementChart ref={elementRef} />
		</AnalyticsFrame>
	);
}

export default TimelineEngagementChart;
