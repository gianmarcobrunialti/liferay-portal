/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */
import ClayIcon from '@clayui/icon';
import {sub} from 'frontend-js-web';
import React, {useEffect, useRef, useState} from 'react';
import AccountSticker from "../../../common/components/AccountSticker";
import useAnalyticsQuery from "../../../common/hooks/useAnalyticsQuery";
import './../../../../css/components/ActivityLog.scss';
import AnalyticsFrame from "./AnalyticsFrame";
import ActivityLogQuery from "../queries/ActivityLogQuery";
import UserLogEntry from "./UserLogEntry";
export const TYPES = [
	{
		icon: 'comments',
		key: 'comment',
		label: Liferay.Language.get('commented-on'),
	},
	{
		icon: 'upload',
		key: 'upload',
		label: Liferay.Language.get('uploaded-a-x'),
	},
	{
		icon: 'view',
		key: 'view',
		label: Liferay.Language.get('viewed-a-x'),
	},
];
export interface ILogEntry extends IRawDataEntry {
	icon: string;
	time: string;
}
export interface IUserLogsEntry {
	logs: ILogEntry[];
	userName: string;
}
export type TActivityLog = Record<string, IUserLogsEntry[]>;
export interface IRawDataEntry {
	createDate: number;
	description?: string;
	label?: string;
	title: string;
	type: string;
	userName: string;
}
const formatData = (data: IRawDataEntry[]) => {
	return data.reduce((activityLog: TActivityLog, item: IRawDataEntry) => {
		const date = new Date(item.createDate);
		const dateKey = date.toISOString().split('T')[0];
		const timeString = date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			hour12: true,
			minute: '2-digit',
		});
		if (!activityLog[dateKey]) {
			activityLog[dateKey] = [];
		}
		const type = TYPES.find((type) => type.key === item.type);
		const logEntry: ILogEntry = {
			...item,
			icon: type ? type.icon : '',
			label: type
				? sub(
					Liferay.Language.get(type.label),
					Liferay.Language.get(item.label || '')
				)
				: '',
			time: timeString,
		};
		const dayGroup = activityLog[dateKey];
		const lastUserBlock = dayGroup[dayGroup.length - 1];
		if (lastUserBlock && lastUserBlock.userName === item.userName) {
			lastUserBlock.logs.push(logEntry);
		}
		else {
			dayGroup.push({
				logs: [logEntry],
				userName: item.userName,
			});
		}
		return activityLog;
	}, {});
};
function ActivityLog() {
	const [data, setData] = useState<TActivityLog>({});

	const elementRef = useRef(null);

	const {isLoading, response} = useAnalyticsQuery({
		element: elementRef.current,
		query: ActivityLogQuery,
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

	useEffect(() => {
		if (response) {
			const formattedData = formatData(response);

			setData(formattedData);
		}

		return () => {};
	}, [response]);

	return (
		<AnalyticsFrame
			icon="box-container"
			title={Liferay.Language.get('activity-log')}
		>
			<div ref={elementRef}>
				{Object.entries(data).map(
					([date, userLogs]: [string, IUserLogsEntry[]]) => (
						<>
							<div
								className="activity-logs-date fw-600 mb-3 px-3 py-2 text-secondary">
								{date}
							</div>

							{userLogs.map((userLogsEntry: IUserLogsEntry) =>
								<UserLogEntry
									logs={userLogsEntry.logs}
									userName={userLogsEntry.userName}
								/>
							)}
						</>
					)
				)}
			</div>
		</AnalyticsFrame>
	);
}
export default ActivityLog;