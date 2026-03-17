/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */
import React from "react";

export enum AnalyticsFilters {
    DATE_RANGE = 'dateRange',
    USER = 'user',
}

export enum DateRangePreset {
    ALL_TIME = 'all-time',
    CUSTOM_RANGE = 'custom-range',
    LAST_WEEK = 'last-week',
    LAST_2_WEEKS = 'last-2-weeks',
    LAST_30_DAYS = 'last-30-days',
    LAST_3_MONTHS = 'last-3-months',
    LAST_6_MONTHS = 'last-6-months',
    LAST_YEAR = 'last-year',
}

export interface IAnalyticsFilter {
    active: boolean;
    component: React.ComponentType<any>;
    value: TDateRangeAnalyticsFilterValue
        | string[];
}

export interface IAnalyticsFilterProps {
    setValue: any;
    value: TAnalyticsFilterValue;
    [k: string]: any;
}

export type TAnalyticsFilterValue = {
    [key in AnalyticsFilters]: IAnalyticsFilter['value'];
}

export type TAnalyticsFilter = {
    [key in AnalyticsFilters]: IAnalyticsFilter
}

export type TDateRangePreset = {
    [key in DateRangePreset]: TDateRangeAnalyticsFilterValue | null;
}

export type TDateRangeAnalyticsFilterValue = {
    from: string;
    preset?: string;
    to: string;
}