/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import React, {useEffect, useRef, useState} from 'react';
import {
	Bar,
	BarChart,
	CartesianGrid,
	ReferenceLine,
	ResponsiveContainer,
	XAxis,
	YAxis,
} from 'recharts';

import {
	IFrequencyChartItem,
	IFrequencyChartProps,
} from '../../../common/utils/types';
import Loader from './Loader';
import AnalyticsFrame from "./AnalyticsFrame";
import useAnalyticsQuery from "../../../common/hooks/useAnalyticsQuery";
import ActivityLogQuery from "../queries/ActivityLogQuery";
import FrequencyChartQuery from "../queries/FrequencyChartQuery";

const margin = {
	bottom: 5,
	left: 20,
	right: 30,
	top: 20,
};

const getFrequencyLabel = (type: string): string => {
	if (type === 'DAILY') {
		return Liferay.Language.get('daily');
	}
	if (type === 'WEEKLY') {
		return Liferay.Language.get('weekly');
	}
	if (type === 'BIWEEKLY') {
		return Liferay.Language.get('biweekly');
	}
	if (type === 'MONTHLY') {
		return Liferay.Language.get('monthly');
	}

	return type;
};

const formatData = (
	frequencyChartItems: IFrequencyChartItem[]
): IFrequencyChartItem[] => {
	if (!frequencyChartItems) {
		return [];
	}

	return frequencyChartItems.map((frequencyChartItem) => ({
		frequencyType: getFrequencyLabel(frequencyChartItem.frequencyType),
		visitCount: frequencyChartItem.visitCount || 0,
	}));
};

function FrequencyChart() {
	const [data, setData] = useState<IFrequencyChartItem[]>([]);

	const elementRef = useRef(null);

	const {isLoading, response} = useAnalyticsQuery({
		element: elementRef.current,
		query: FrequencyChartQuery,
		variables: {
			"rangeKey": 30,
			"channelId": "808122315193619922"
		}
	});

	useEffect(() => {
		if (response) {
			const formattedData = formatData(response);

			setData(formattedData);
		}

		return () => {};
	}, [response, setData]);

	if (isLoading) {
		return <Loader />;
	}

	if (!data?.length) {
		return (
			<p className="text-muted">
				{Liferay.Language.get('no-data-available')}
			</p>
		);
	}

	return (
		<AnalyticsFrame
			icon="liferay-ac"
			title={Liferay.Language.get('visits-frequency')}
		>
		<ResponsiveContainer ref={elementRef}>
			<BarChart
				data={data}
				height={300}
				margin={margin}
				width={600}
			>
				{data.map(
					(
						frequencyChartItem: IFrequencyChartItem,
						index: number
					) => {
						return (
							<ReferenceLine
								key={`bg-strip-${index}`}
								stroke="#E5F1FF"
								strokeOpacity={0.3}
								strokeWidth={60}
								x={frequencyChartItem.frequencyType}
							/>
						);
					}
				)}

				<CartesianGrid
					stroke="#ccc"
					strokeDasharray="5 5"
					vertical={(props: any) => (
						<line
							key={props.key}
							stroke="none"
							x1={props.x1}
							x2={props.x2}
							y1={props.y1}
							y2={props.y2}
						/>
					)}
				/>

				<Bar
					barSize={60}
					dataKey="visitCount"
					fill="#97C5FF"
					radius={[4, 4, 0, 0]}
				/>

				<XAxis dataKey="frequencyType" />

				<YAxis />
			</BarChart>
		</ResponsiveContainer>
		</AnalyticsFrame>
	);
}

export default FrequencyChart;
