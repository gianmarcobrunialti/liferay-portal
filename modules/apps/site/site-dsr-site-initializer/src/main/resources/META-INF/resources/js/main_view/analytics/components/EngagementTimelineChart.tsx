/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import moment from 'moment';
import React from 'react';
import {
	CartesianGrid,
	Line,
	LineChart,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

import CustomChartTooltip from './CustomChartTooltip';

const formatDateXAxis = (tickItem: string | number): string => {
	return moment(tickItem).format('MMM DD');
};

interface ApiChartNode {
	timestamp: string;
	totalTimeSpent?: number;
	totalVisits?: number;
}

interface EngagementTimeLineChartProps {
	apiData?: {engagementTimeSeries: ApiChartNode[]} | null;
	isLoading?: boolean;
}

const mockData = {
	engagementTimeSeries: [
		{
			timestamp: '2026-02-20T00:00:00Z',
			totalTimeSpent: 2400,
			totalVisits: 400,
		},
		{
			timestamp: '2026-02-21T00:00:00Z',
			totalTimeSpent: 4567,
			totalVisits: 300,
		},
		{
			timestamp: '2026-02-22T00:00:00Z',
			totalTimeSpent: 1398,
			totalVisits: 320,
		},
		{
			timestamp: '2026-02-23T00:00:00Z',
			totalTimeSpent: 9800,
			totalVisits: 200,
		},
		{
			timestamp: '2026-02-24T00:00:00Z',
			totalTimeSpent: 3908,
			totalVisits: 278,
		},
		{
			timestamp: '2026-02-25T00:00:00Z',
			totalTimeSpent: 4800,
			totalVisits: 189,
		},
		{
			timestamp: '2026-02-26T00:00:00Z',
			totalTimeSpent: 1800,
			totalVisits: 199,
		},
	],
};

const mapChartData = (apiData: any) => {
	if (
		!apiData?.engagementTimeSeries ||
		!Array.isArray(apiData.engagementTimeSeries)
	) {
		return [];
	}

	return apiData.engagementTimeSeries.map((node: ApiChartNode) => ({
		date: node.timestamp,
		numberOfVisits: node.totalVisits || 0,
		timeSpent: node.totalTimeSpent || 0,
	}));
};

function EngagementTimelineChart({
	apiData,
	isLoading = false,
}: EngagementTimeLineChartProps) {

	// if is not a test then use mockedData

	if (!apiData) {
		apiData = mockData;
	}

	if (isLoading) {
		return <span aria-hidden="true" className="loading-animation" />;
	}

	const chartData = mapChartData(apiData);

	if (!chartData) {
		return <p>{Liferay.Language.get('no-data-available')}</p>;
	}

	return (
		<ResponsiveContainer height={300} width={700}>
			<LineChart
				data={chartData}
				margin={{
					bottom: 5,
					left: 0,
					right: 20,
					top: 20,
				}}
			>
				<defs>
					<linearGradient
						id="lineGradient"
						x1="0"
						x2="1"
						y1="0"
						y2="0"
					>
						<stop offset="0%" stopColor="#E0C2FF" />

						<stop offset="50%" stopColor="#AA33FF" />

						<stop offset="100%" stopColor="#E0C2FF" />
					</linearGradient>
				</defs>

				{chartData.map((entry: any, index: number) => {
					return (
						<ReferenceLine
							key={`bg-strip-${index}`}
							stroke="#F2E5FF"
							strokeOpacity={0.3}
							strokeWidth={50}
							x={entry.date}
						/>
					);
				})}

				<CartesianGrid
					stroke="#aaa"
					strokeDasharray="3 3"
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

				<Line
					activeDot={{
						fill: '#AA33FF',
						r: 6,
						stroke: '#AA33FF',
					}}
					dataKey="numberOfVisits"
					dot={false}
					stroke="url(#lineGradient)"
					strokeWidth={4}
					type="monotone"
				/>

				<XAxis
					dataKey="date"
					dy={10}
					padding={{left: 30, right: 30}}
					tickFormatter={formatDateXAxis}
				/>

				<YAxis />

				<Tooltip
					content={<CustomChartTooltip />}
					isAnimationActive={false}
				/>
			</LineChart>
		</ResponsiveContainer>
	);
}

export default EngagementTimelineChart;
