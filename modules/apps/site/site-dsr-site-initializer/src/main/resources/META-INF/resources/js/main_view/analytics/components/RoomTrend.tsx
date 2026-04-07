/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import React, {useCallback, useEffect, useState} from 'react';
import ClayIcon from '@clayui/icon';
import DropDown from '@clayui/drop-down';
import ClayButton from '@clayui/button';

import '../../../../css/components/RoomTrend.scss';
import RoomService from '../../../common/services/RoomService';
import AnalyticsFrame from "./AnalyticsFrame";
import {
	AnalyticsFilters,
	TAnalyticsFilter,
	TRoomAnalyticsFilterValue,
	TTrendOptions
} from "../types";
import {IRoomObjectEntry} from "../../../common/utils/types";
import useAnalyticsFilters from "../../../common/hooks/useAnalyticsFilters";

function getDegrees(percentage: number) {
	const clampedPercentage = Math.max(0, Math.min(100, percentage));

	return Math.round(-90 + (clampedPercentage / 100) * 180);
}

function getImage(filename: string) {
	return `${Liferay.ThemeDisplay.getPortalURL()}${Liferay.ThemeDisplay.getPathContext()}/o/site-dsr-site-initializer/images/${filename}`;
}

const OPTIONS: TTrendOptions[] = [
	{
		color: '#DA1414',
		icon: 'times-circle-full',
		label: Liferay.Language.get('closed-lost'),
		percentage: 0,
		status: 0,
	},
	{
		color: '#4B9FFF',
		icon: 'snow',
		label: Liferay.Language.get('cold'),
		percentage: 12.5,
		status: 1,
		useSpritemap: true,
	},
	{
		icon: 'reload',
		label: Liferay.Language.get('reignited'),
		percentage: 25,
		status: 2,
		useSpritemap: true,
	},
	{
		color: '#FFBB00',
		icon: 'sun',
		label: Liferay.Language.get('warming-up'),
		percentage: 37.5,
		status: 3,
	},
	{
		color: '#FF8133',
		icon: 'heating',
		label: Liferay.Language.get('heating-up'),
		percentage: 50,
		status: 4,
		useSpritemap: true,
	},
	{
		color: '#6CE0CC',
		icon: 'comments',
		label: Liferay.Language.get('engaged'),
		percentage: 62.5,
		status: 5,
	},
	{
		color: '#FF4F45',
		icon: 'hot',
		label: Liferay.Language.get('hot'),
		percentage: 75,
		status: 6,
		useSpritemap: true,
	},
	{
		color: '#5ACA75',
		icon: 'shield-check',
		label: Liferay.Language.get('ready-to-close'),
		percentage: 87.5,
		status: 7,
	},
	{
		color: '#AA33FF',
		icon: 'champion-cup',
		label: Liferay.Language.get('closed-won'),
		percentage: 100,
		status: 8,
		useSpritemap: true,
	},
];

const RoomTrend = () => {
	const [room, setRoom] = useState<IRoomObjectEntry | null>(null);
	const [trendStatus, setTrendStatus] = useState<TTrendOptions>(OPTIONS[1]);

	const {color, icon, label, percentage, useSpritemap} = trendStatus;

	const updateRoomTrend = useCallback((roomId: number, trend: number) => {
		return RoomService.updateRoom(roomId, {
			trend: trend,
		});
	}, []);

	useEffect(() => {
		const doSetRoom = ({filters}: {filters: TAnalyticsFilter}) => {
			const {room} = filters[AnalyticsFilters.ROOM]?.value as TRoomAnalyticsFilterValue;

			setRoom(room);
		};

		Liferay.on('dsr-filters-updated', doSetRoom)

		return () => {
			Liferay.detach('dsr-filters-updated', doSetRoom);
		};
	}, []);

	return (
		<>
			{room ? (
				<AnalyticsFrame>
					<div className="align-items-center d-flex justify-content-between p-3 room-trend">
						<div>
						<div className="mb-1">
							<p
								className="font-weight-semi-bold inline-item
                                inline-item-before mr-1"
							>
								{Liferay.Language.get('room-trend')}
							</p>
							<ClayIcon
								className="text-secondary"
								symbol="question-circle-full"
							/>
						</div>

							<DropDown
								closeOnClick
								trigger={
									<ClayButton
										className="align-items-center d-flex font-weight-normal justify-content-between px-2 room-trend-button"
										displayType="secondary"
									>
									<span
										className="align-items-center d-flex flex-grow-1 overflow-hidden">
										<ClayIcon
											className="flex-shrink-0 mr-2"
											color={color}
											fontSize={16}
											symbol={icon}
											spritemap={
												useSpritemap
													? getImage(
														'room_trend_icons.svg'
													)
													: undefined
											}
										/>
										<span
											className="room-trend-button-text text-left text-truncate">
											{label}
										</span>
									</span>
										<ClayIcon
											className="flex-shrink-0 ml-2"
											symbol="caret-double"
										/>
									</ClayButton>
								}
							>
								<DropDown.ItemList>
									{OPTIONS.map((option, index) => (
										<DropDown.Item
											active={room.trend ===
													option.status}
											key={index}
											onClick={() => {
												updateRoomTrend(
													room.id,
													option.status
												).then(({trend}) => {
													setTrendStatus(
														OPTIONS[trend]);
												});
											}}
										>
										<span className="mr-4">
											<ClayIcon
												color={option.color}
												fontSize={16}
												symbol={option.icon}
												spritemap={
													option.useSpritemap
														? getImage(
															'room_trend_icons.svg'
														)
														: undefined
												}
											/>
										</span>
											{option.label}
										</DropDown.Item>
									))}
								</DropDown.ItemList>
							</DropDown>
						</div>

						<div className="gauge-container inline-item-after ml-4">
							<img
								alt={Liferay.Language.get(
									'room-trend-semicircle')}
								className="room-trend-semicircle"
								src={getImage('room_trend_semicircle.svg')}
							></img>

							<img
								alt={Liferay.Language.get(
									'room-trend-pointer')}
								className="room-trend-pointer"
								src={getImage('room_trend_pointer.svg')}
								style={{
									transform: `rotate(${getDegrees(percentage)}deg) translateZ(0)`,
								}}
							></img>
						</div>
					</div>
				</AnalyticsFrame>
			) : null}
		</>
	);
};

export default RoomTrend;
