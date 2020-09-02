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
import debounce from '../../utilities/debounce';
import {validateEmailAddress} from '../../utilities/email';
import {discardItem} from './util/index';

function getCN(usersToInvite, isValidAddress, value) {
	const hasSuccess = !value
		? !isEmpty(usersToInvite)
		: isValidAddress && !isEmpty(usersToInvite);

	return classnames(
		'user-invitation-modal-form-group',
		hasSuccess && 'has-success'
	);
}

function UsersMultiSelect({
	addUser,
	discardUser,
	resetUsers,
	spritemap,
	usersToInvite = {}
}) {
	const [itemsList, setItemsList] = useState([]),
		[value, setValue] = useState(''),
		[isValidAddress, setIsValidAddress] = useState(false),
		inputRef = createRef();

	const validate = debounce(() => {
		const input = inputRef.current.querySelector('input[type="text"]'),
			email = input.value;

		validateEmailAddress(email)
			.then(() => {
				if (!(email in usersToInvite)) {
					setIsValidAddress(true);

					addUser({
						[email]: {
							email,
							id: email
						}
					});
				}

				setValue('');
			})
			.catch(() => setIsValidAddress(false));
	}, 500);

	useEffect(() => {
		setItemsList(
			Object.values(usersToInvite).map(user => ({
				label: user.email,
				value: user
			}))
		);
	}, [usersToInvite]);

	return (
		<>
			<ClayForm.Group
				className={getCN(usersToInvite, isValidAddress, value)}
			>
				<label htmlFor={'email-address'}>
					{Liferay.Language.get('email-address')}
					<span className={'required'}>*</span>
				</label>
				<ClayInput.Group>
					<ClayInput.GroupItem>
						<ClayMultiSelect
							inputName="email-address"
							inputValue={value}
							items={itemsList}
							onChange={setValue}
							onItemsChange={nextItemsList =>
								discardItem(
									nextItemsList,
									itemsList,
									resetUsers,
									discardUser
								)
							}
							onKeyUp={validate}
							placeholder={
								!itemsList.length
									? Liferay.Language.get('email-address')
									: ''
							}
							ref={inputRef}
							spritemap={spritemap}
						/>
					</ClayInput.GroupItem>
				</ClayInput.Group>

				<ClayForm.FeedbackGroup className={'mt-2'}>
					<ClayForm.FeedbackItem className={'validation-feedback'}>
						<ClayForm.FeedbackIndicator
							spritemap={spritemap}
							symbol="warning-full"
						/>
						{Liferay.Language.get(
							'please-enter-a-valid-email-address'
						)}
					</ClayForm.FeedbackItem>
				</ClayForm.FeedbackGroup>
			</ClayForm.Group>
		</>
	);
}

export default UsersMultiSelect;
