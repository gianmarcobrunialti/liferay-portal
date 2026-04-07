/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayDatePicker from '@clayui/date-picker';
import {ClayInput, ClaySelect} from '@clayui/form';
import ClayForm from '@clayui/form/src/Form';
import React, {ChangeEvent, useCallback, useState} from 'react';

import {
	AnalyticsFilters,
	DateRangePreset, IAnalyticsDateRangeFilter,
	TAnalyticsFilter,
	TDateRangeAnalyticsFilterValue
} from '../../types';
import {DATE_RANGE_PRESETS} from '../../utils';

interface IProps {
	setValue: any;
	filter: IAnalyticsDateRangeFilter;
}

export default function DateRangeAnalyticsFilter({
	setValue: setDateRange,
	filter: dateRangeFilter,
}: IProps) {
	const changePreset = useCallback(
		(event: ChangeEvent<HTMLSelectElement>) => {
			event.preventDefault();

			const preset = event.target.value as DateRangePreset;

			setDateRange({
				[AnalyticsFilters.DATE_RANGE]: {
					...dateRangeFilter,
					value: {
						preset,
						...DATE_RANGE_PRESETS[preset],
					},
				}
			});
		},
		[setDateRange]
	);

	const changeDateRange = useCallback(
		(value: string) => {
			console.log(value);
			const [from, to] = value.split(' - ');

			setDateRange({
				[AnalyticsFilters.DATE_RANGE]: {
					...dateRangeFilter,
					value: {
						from: new Date(from).toString(),
						preset: DateRangePreset.CUSTOM_RANGE,
						to: new Date(to).toString(),
					}
				}
			});
		},
		[setDateRange]
	);

	return (
		<ClayForm.Group>
			<ClayInput.Group>
				<ClayInput.GroupItem prepend shrink>
					<ClaySelect
						onChange={changePreset}
						value={dateRangeFilter?.value?.preset}
					>
						{Object.keys(DATE_RANGE_PRESETS).map((key) => (
							<ClaySelect.Option value={key}>
								{Liferay.Language.get(key)}
							</ClaySelect.Option>
						))}
					</ClaySelect>
				</ClayInput.GroupItem>

				<ClayInput.GroupItem append>
					<ClayDatePicker
						id="dsrEngagementRange"
						onChange={changeDateRange}
						placeholder="YYYY-MM-DD - YYYY-MM-DD"
						range
						time={false}
						value={`${dateRangeFilter?.value?.from} - ${dateRangeFilter?.value?.to}`}
						years={{
							end: new Date().getFullYear(),
							start: new Date('1969-12-01T00:00:00.000Z').getFullYear(),
						}}
					/>
				</ClayInput.GroupItem>
			</ClayInput.Group>
		</ClayForm.Group>
	);
}
