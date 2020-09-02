/**
 * Copyright (c) 2000-present Liferay, Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
 * details.
 */

import ClayForm, {ClayInput} from '@clayui/form';
import ClayMultiSelect from '@clayui/multi-select';
import classnames from 'classnames';
import React, {createRef, useEffect, useState} from 'react';

import {isEmpty} from '../../utilities/collections';
import RolesMenuRenderer from './RolesMenuRenderer';
import {discardItem} from './util/index';

function RolesMultiSelect({
	addRole,
	availableRoles = [],
	discardRole,
	resetRoles,
	rolesToApply = {},
	spritemap
}) {
	const [itemsList, setItemsList] = useState([]),
		[value, setValue] = useState(''),
		[listRolesFn, setListRolesFn] = useState(() => role => !role),
		inputRef = createRef();

	const reduceAvailableRoles = roles =>
		roles
			.filter(({id}) => !(id in rolesToApply))
			.map(item => ({label: item.name, value: item}));

	useEffect(() => {
		setItemsList(
			Object.values(rolesToApply).map(role => ({
				label: role.name,
				value: role
			}))
		);
	}, [rolesToApply]);

	return (
		<>
			<ClayForm.Group
				className={classnames(
					'user-invitation-modal-form-group',
					!isEmpty(rolesToApply) && 'has-success'
				)}
			>
				<label htmlFor={'role'}>
					{Liferay.Language.get('role')}
					<span className={'required'}>*</span>
				</label>

				<ClayInput.Group>
					<ClayInput.GroupItem>
						<ClayMultiSelect
							filter={listRolesFn}
							inputName="role"
							inputValue={value}
							items={itemsList}
							menuRenderer={RolesMenuRenderer(addRole)}
							onChange={setValue}
							onFocus={() => setListRolesFn(() => role => role)}
							onItemsChange={nextItemsList =>
								discardItem(
									nextItemsList,
									itemsList,
									resetRoles,
									discardRole
								)
							}
							placeholder={
								isEmpty(itemsList)
									? Liferay.Language.get('role')
									: ''
							}
							ref={inputRef}
							sourceItems={reduceAvailableRoles(availableRoles)}
							spritemap={spritemap}
						/>
					</ClayInput.GroupItem>
				</ClayInput.Group>
			</ClayForm.Group>
		</>
	);
}

export default RolesMultiSelect;
