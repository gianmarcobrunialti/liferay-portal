/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import React, {useRef} from 'react';

import Loader from './Loader';
import AnalyticsFrame from "./AnalyticsFrame";
import {BASE_URL} from "../utils/constants";
import {EngagementChart} from "../../../index";
import useAnalyticsQuery from "../../../common/hooks/useAnalyticsQuery";
import ActivityLogQuery from "../queries/ActivityLogQuery";
import RecentEngagementChartQuery from "../queries/RecentEngagementChartQuery";

function RecentEngagementChart() {
	const elementRef = useRef(null);

	const {isLoading, response} = useAnalyticsQuery({
		element: elementRef.current,
		query: RecentEngagementChartQuery,
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
		title={Liferay.Language.get('recent-engagement')}
		url={`${BASE_URL}/view-timeline`}
	>
		<EngagementChart ref={elementRef} />
	</AnalyticsFrame>
	);
}

export default RecentEngagementChart;
