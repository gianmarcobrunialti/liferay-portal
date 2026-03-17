/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import React from 'react';

import {IAnalyticsFilterProps} from '../../types';
import {ClaySelect} from "@clayui/form";

export default function RoomAnalyticsFilter({
	setValue,
	value,
	...otherProps
}: IAnalyticsFilterProps) {
	const rooms = [
		{
			id: 12345,
			name: 'test1',
		},
		{
			id: 67890,
			name: 'test2',
		},
	];

	function handleSelectChange(event: any) {
		const value = Number(event.currentTarget.value);

		window.location.reload();
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
					value={room.id}
				/>
			))}
		</ClaySelect>
	);
}
