/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '@testing-library/jest-dom';
import {render} from '@testing-library/react';
import React from 'react';
import ResizeObserver from 'resize-observer-polyfill';

import EngagementTimelineChart from '../../../src/main/resources/META-INF/resources/js/main_view/analytics/components/EngagementTimelineChart';

global.ResizeObserver = ResizeObserver;

jest.mock('recharts', () => {
	const OriginalModule = jest.requireActual('recharts');

	return {
		...OriginalModule,
		ResponsiveContainer: ({children}: {children: React.ReactNode}) => (
			<OriginalModule.ResponsiveContainer height={400} width={800}>
				{children}
			</OriginalModule.ResponsiveContainer>
		),
	};
});

const mockPayload = {
	engagementTimeSeries: [
		{
			timestamp: '2026-02-18T00:00:00Z',
			totalTimeSpent: 2400,
			totalVisits: 400,
		},
		{
			timestamp: '2026-02-19T00:00:00Z',
			totalTimeSpent: 4567,
			totalVisits: 300,
		},
		{
			timestamp: '2026-02-20T00:00:00Z',
			totalTimeSpent: 1398,
			totalVisits: 320,
		},
		{
			timestamp: '2026-02-21T00:00:00Z',
			totalTimeSpent: 9800,
			totalVisits: 200,
		},
		{
			timestamp: '2026-02-22T00:00:00Z',
			totalTimeSpent: 3908,
			totalVisits: 278,
		},
		{
			timestamp: '2026-02-23T00:00:00Z',
			totalTimeSpent: 4800,
			totalVisits: 189,
		},
		{
			timestamp: '2026-02-24T00:00:00Z',
			totalTimeSpent: 1800,
			totalVisits: 199,
		},
	],
};

describe('EngagementTimelineChart component', () => {
	let container: HTMLElement;

	beforeEach(() => {
		const view = render(
			<EngagementTimelineChart apiData={mockPayload} isLoading={false} />
		);

		container = view.container;
	});

	afterAll(() => {
		delete (global as any).ResizeObserver;
	});

	it('render the chart matching snapshot', async () => {
		const svgChart = container.querySelector(
			'.recharts-surface'
		) as HTMLElement;

		expect(svgChart).toMatchSnapshot();
	});

	it('render the chart with data', async () => {
		const svgChart = container.querySelector(
			'.recharts-surface'
		) as HTMLElement;

		expect(svgChart).toBeInTheDocument();

		const line = svgChart.querySelector('.recharts-line-curve');

		expect(line).toBeInTheDocument();
		expect(line).toHaveAttribute('stroke', 'url(#lineGradient)');

		const xAxisTick = container.querySelector(
			'.recharts-xAxis .recharts-cartesian-axis-tick-value'
		);
		expect(xAxisTick).toHaveTextContent('Feb 18');
	});
});
