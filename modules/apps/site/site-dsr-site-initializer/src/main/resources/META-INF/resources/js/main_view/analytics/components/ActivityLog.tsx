/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayIcon from '@clayui/icon';
import ClaySticker from '@clayui/sticker';
import {sub} from 'frontend-js-web';
import React, {useEffect, useState} from 'react';

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
	const [activityLogs, setActivityLogs] = useState<TActivityLog>({});

	useEffect(() => {
		const data = [
			{
				createDate: 1772757506000,
				label: 'tab',
				title: 'Shared Document',
				type: 'view',
				userName: 'John Doe',
			},
			{
				createDate: 1772774004000,
				description: 'Lorem ipsum dolor sit amet...',
				title: 'Technical Requirements',
				type: 'comment',
				userName: 'John Doe',
			},
			{
				createDate: 1772788091000,
				label: 'document',
				title: 'Quote Software License.pdf',
				type: 'upload',
				userName: 'John Doe',
			},
			{
				createDate: 1772831368491,
				description: 'Lorem ipsum dolor sit amet...',
				title: 'Quote Software License',
				type: 'comment',
				userName: 'Paul Gerome',
			},
			{
				createDate: 1772795460014,
				description: 'Lorem ipsum dolor sit amet...',
				title: 'Roadmap Plan 2026',
				type: 'comment',
				userName: 'Emily Blunt',
			},
			{
				createDate: 1772857149296,
				description: 'Lorem ipsum dolor sit amet...',
				title: 'Quote Software License',
				type: 'comment',
				userName: 'Paul Gerome',
			},
			{
				createDate: 1772859315713,
				description: 'Lorem ipsum dolor sit amet...',
				title: 'Roadmap Plan 2026',
				type: 'comment',
				userName: 'Emily Blunt',
			},
			{
				createDate: 1772902574223,
				description: 'Lorem ipsum dolor sit amet...',
				title: 'Roadmap Plan 2026',
				type: 'comment',
				userName: 'Paul Gerome',
			},
		];

		const formattedData = formatData(data);

		setActivityLogs(formattedData);
	}, []);

	function getUserInitials(name: string | undefined): string {
		if (name) {
			const trimmedName = name.trim();

			if (trimmedName.length) {
				return trimmedName[0].toUpperCase();
			}
		}

		return '';
	}

	return (
		<>
			<style
				dangerouslySetInnerHTML={{
					__html: `
			li.timeline-item::before {
				background-color: #E7E7ED;
				bottom: -20px;
			}
			li.timeline-item:first-of-type::before {
				top: 34px;
			}
			li.timeline-item:last-of-type::before {
				content: none;
			}
			.activity-logs-date {
				background-color: #F7F8F9;
				border: 1px solid #CDCED9;
			}
			.fw-600 {
				font-weight: 600;
			}
			.log-description {
				border-left: 3px solid #DFB3FF;
				font-size: 12px;
				font-style: italic;
			}
			.log-time {
				font-size: 10px;
			}
			.log-title {
				font-size: 12px;
			}
			.timeline .panel-body > div {
				line-height: 21px;
			}
			.timeline .sticker {
				top: 12px;
				transform: translateX(-50%);
			}
			.timeline-increment {
            	height: 32px;
            	line-height: 0;
            	width: 32px;
			}
            .timeline-increment-comment {
            	background-color: #F2E5FF;
            }
            .timeline-increment-icon-comment {
            	color: #AA33FF;
            }
            .timeline-increment-upload {
            	background-color: #F1FCE9;
            }
            .timeline-increment-icon-upload {
            	color: #458613;
            }
            .timeline-increment-view {
            	background-color: #E5F6FF;
            }
            .timeline-increment-icon-view {
            	color: #0077B3;
            }
         `,
				}}
			/>

			{Object.entries(activityLogs).map(
				([date, userLogs]: [string, IUserLogsEntry[]]) => (
					<>
						<div className="activity-logs-date fw-600 mb-3 px-3 py-2 text-secondary">
							{date}
						</div>

						{userLogs.map((userLogsEntry: IUserLogsEntry) => (
							<>
								<div className="pl-3">
									<ClaySticker
										className="sticker-user-icon"
										shape="circle"
										size="lg"
									>
										{getUserInitials(
											userLogsEntry.userName
										)}
									</ClaySticker>

									<span className="fw-600 ml-2">
										{userLogsEntry.userName}
									</span>
								</div>

								<ul className="pl-5 timeline">
									{userLogsEntry.logs.map(
										(logEntry: ILogEntry) => (
											<li
												className="timeline-item"
												key={logEntry.createDate}
											>
												<div className="panel">
													<div
														className={`sticker sticker-circle timeline-increment timeline-increment-${logEntry.type}`}
													>
														<span
															className={`timeline-increment-icon timeline-increment-icon-${logEntry.type}`}
														>
															<ClayIcon
																className="log-icon"
																symbol={
																	logEntry.icon
																}
															/>
														</span>
													</div>

													<div className="panel-body pl-0">
														<div className="log-time text-secondary">
															{logEntry.time}
														</div>

														<div className="fw-600 log-label">
															{logEntry.label}
														</div>

														<div className="log-title">
															{logEntry.title}
														</div>

														{logEntry.description && (
															<div className="log-description px-2 py-1">
																{
																	logEntry.description
																}
															</div>
														)}
													</div>
												</div>
											</li>
										)
									)}
								</ul>
							</>
						))}
					</>
				)
			)}
		</>
	);
}

export default ActivityLog;
