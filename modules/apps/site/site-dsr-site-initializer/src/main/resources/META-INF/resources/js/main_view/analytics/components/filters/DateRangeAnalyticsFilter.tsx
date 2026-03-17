/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ClayInput, ClaySelect} from '@clayui/form';
import ClayDatePicker from "@clayui/date-picker";
import ClayForm from "@clayui/form/src/Form";
import React, {ChangeEvent, useCallback, useState} from 'react';

import {
    DateRangePreset,
    TDateRangeAnalyticsFilterValue,
} from "../../types";
import {DATE_RANGE_PRESETS} from "../../utils";

interface IProps {
    setValue: any;
    value: TDateRangeAnalyticsFilterValue;
    [k: string]: any;
}

export default function DateRangeAnalyticsFilter({
    setValue: setDateRange,
    value: dateRange,
    ...otherProps
}: IProps) {
    const changePreset = useCallback(
        (event: ChangeEvent<HTMLSelectElement>) => {
            event.preventDefault();

            const preset = event.target.value as DateRangePreset;

            setDateRange({
                preset,
                ...DATE_RANGE_PRESETS[preset],
            } as TDateRangeAnalyticsFilterValue);
        },
        [setDateRange]
    );

    const changeDateRange = useCallback((value: string) => {
        const [from, to] = value.split(' - ');

        setDateRange({
            from: new Date(from).toString(),
            preset: DateRangePreset.CUSTOM_RANGE,
            to: new Date(to).toString(),
        } as TDateRangeAnalyticsFilterValue);
    }, [setDateRange]);

    return (
        <ClayForm.Group>
            <ClayInput.Group>
                <ClayInput.GroupItem shrink prepend>
                    <ClaySelect onChange={changePreset} value={dateRange.preset}>
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
                        value={`${dateRange?.from} - ${dateRange?.to}`}
                        time={false}
                        years={{
                            end: new Date().getFullYear(),
                            start: new Date(otherProps.dateCreated).getFullYear(),
                        }}
                    />
                </ClayInput.GroupItem>
            </ClayInput.Group>
        </ClayForm.Group>
    );
}