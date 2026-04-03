/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import React, {useEffect, useState} from 'react';

import {
	IAnalyticsFilterProps,
	TDateRangeAnalyticsFilterValue
} from '../../types';
import {ClaySelect} from "@clayui/form";
import {IRoom, IRoomObjectEntry} from "../../../../common/utils/types";
import RoomService from "../../../../common/services/RoomService";

export default function RoomAnalyticsFilter({
	setValue,
	value,
	...otherProps
}: IAnalyticsFilterProps) {
	const [rooms, setRooms] = useState<IRoomObjectEntry[]>([]);

	useEffect(() => {
		RoomService.getRooms().then((rooms) => {
			setRooms(rooms as IRoomObjectEntry[]);
		}).catch(() => {
			setRooms([]);
		})
	}, []);

	function handleSelectChange(event: any) {
		const {id: roomId = 0, siteId: channelId = ""} = event.target.value;

		setValue(
			{
				...value,
				value: {
					channelId,
					roomId
				}
			}
		);
	}

	return (
		<ClaySelect name="roomSelect" onChange={handleSelectChange}>
			<ClaySelect.Option
				aria-label={Liferay.Language.get('all-rooms')}
				label={Liferay.Language.get('all-rooms')}
				value=""
			/>

			{rooms.map((room: any) => (
				<ClaySelect.Option
					key={room.id}
					label={`${room.name}`}
					selected={otherProps.roomId === room.id}
					value={room}
				/>
			))}
		</ClaySelect>
	);
}
