/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import React from 'react';
import {
	Bar,
	BarChart,
	CartesianGrid,
	ReferenceLine,
	ResponsiveContainer,
	XAxis,
	YAxis,
} from 'recharts';

const margin = {
	bottom: 5,
	left: 20,
	right: 30,
	top: 20,
};

export interface ApiFrequencyNode {
	frequencyType: string;
	userCount: number;
}

export interface VisitFrequencyBarChartProps {
	apiData?: {visitFrequencyStats: ApiFrequencyNode[]} | null;
	isLoading?: boolean;
}

const mockedData = {
	visitFrequencyStats: [
		{frequencyType: 'DAILY', userCount: 400},
		{frequencyType: 'WEEKLY', userCount: 300},
		{frequencyType: 'BIWEEKLY', userCount: 300},
		{frequencyType: 'MONTHLY', userCount: 200},
	],
};

const getFrequencyLabel = (type: string): string => {
	if (type === 'DAILY') {
		return Liferay.Language.get('daily');
	}
	if (type === 'WEEKLY') {
		return Liferay.Language.get('weekly');
	}
	if (type === 'BIWEEKLY') {
		return Liferay.Language.get('bi-weekly');
	}
	if (type === 'MONTHLY') {
		return Liferay.Language.get('monthly');
	}

	return type;
};

const mapBarChartData = (apiData: any) => {
	if (
		!apiData?.visitFrequencyStats ||
		!Array.isArray(apiData.visitFrequencyStats)
	) {
		return [];
	}

	return apiData.visitFrequencyStats.map((node: ApiFrequencyNode) => ({
		name: getFrequencyLabel(node.frequencyType),
		visitFrequency: node.userCount || 0,
	}));
};

function VisitFrequencyChart({
	apiData,
	isLoading = false,
}: VisitFrequencyBarChartProps) {
	if (isLoading) {
		return <span aria-hidden="true" className="loading-animation" />;
	}

	const dataToUse = apiData === undefined ? mockedData : apiData;
	const chartData = mapBarChartData(dataToUse);

	// if is not a test then use mockedData

	if (!chartData.length) {
		return (
			<p className="text-muted">
				{Liferay.Language.get('no-data-available')}
			</p>
		);
	}

	return (
		<ResponsiveContainer height={250} width={550}>
			<BarChart data={chartData} height={300} margin={margin} width={600}>
				{chartData.map((entry: any, index: number) => {
					return (
						<ReferenceLine
							key={`bg-strip-${index}`}
							stroke="#E5F1FF"
							strokeOpacity={0.3}
							strokeWidth={60}
							x={entry.name}
						/>
					);
				})}

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
					dataKey="visitFrequency"
					fill="#97C5FF"
					radius={[4, 4, 0, 0]}
				/>

				<XAxis dataKey="name" />

				<YAxis />
			</BarChart>
		</ResponsiveContainer>
	);
}

export default VisitFrequencyChart;
