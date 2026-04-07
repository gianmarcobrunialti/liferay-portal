/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import React, {ChangeEvent, useCallback, useEffect, useState} from 'react';

import {
	AnalyticsFilters,
	IAnalyticsRoomFilter, TRoomAnalyticsFilterValue,
} from '../../types';
import {ClaySelect} from "@clayui/form";
import {IRoomObjectEntry} from "../../../../common/utils/types";
import RoomService from "../../../../common/services/RoomService";

interface IProps {
	setValue: any;
	filter: IAnalyticsRoomFilter;
}

export default function RoomAnalyticsFilter({
	filter,
	setValue,
}: IProps) {
	const [rooms, setRooms] = useState<IRoomObjectEntry[]>([]);

	const getRooms = useCallback(async () => {
		try {
			const {items: rooms} = await RoomService.getRooms();

			setRooms(rooms);
		} catch(_ignore) {
			console.error('Unable to fetch Rooms.');
		}
	}, [setRooms]);

	const onChange = useCallback((event: any) => {
		event.preventDefault();

		const  {value: roomId = null} = event.target;

		let value: TRoomAnalyticsFilterValue = {
			channelId: '',
			room: null,
		};

		const room = rooms.find(
			({id}) => roomId === id.toString());

		if (room) {
			value = {
				channelId: room.siteId.toString(),
				room,
			};
		}

		setValue(
			{[AnalyticsFilters.ROOM] : {
				...filter,
				value,
			}
		});
	}, [rooms, setValue]);

	useEffect(() => {
		getRooms();
	}, [getRooms]);

	return (
		<ClaySelect name="roomSelect" onChange={onChange}>
			<ClaySelect.Option
				aria-label={Liferay.Language.get('all-rooms')}
				label={Liferay.Language.get('all-rooms')}
				value=""
			/>

			{rooms.map((room: any) => (
				<ClaySelect.Option
					key={room.id}
					label={`${room.name}`}
					selected={filter?.value?.room?.id === room.id}
					value={room.id}
				/>
			))}
		</ClaySelect>
	);
}
