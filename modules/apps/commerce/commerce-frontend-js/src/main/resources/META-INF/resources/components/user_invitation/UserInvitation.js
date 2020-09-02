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

import ClayButton from '@clayui/button';
import ClayForm from '@clayui/form';
import ClayLoadingIndicator from '@clayui/loading-indicator';
import ClayModal, {useModal} from '@clayui/modal';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';

import ServiceProvider from '../../ServiceProvider/index';
import {isEmpty} from '../../utilities/collections';
import {INVITE_USERS} from '../../utilities/eventsDefinitions';
import {showErrorNotification} from '../../utilities/notifications';
import RolesMultiSelect from './RolesMultiSelect';
import UsersMultiSelect from './UsersMultiSelect';

const ROLE_TYPE = 'site';

function UserInvitation({accountId, cssClasses = '', namespace, spritemap}) {
	const AdminUserResource = ServiceProvider.AdminUserAPI('v1'),
		CommerceAdminAccountResource = ServiceProvider.AdminAccountAPI('v1');

	const [availableRoles, setAvailableRoles] = useState([]),
		[isLoading, setIsLoading] = useState(false),
		[usersToInvite, setUsersToInvite] = useState({}),
		[rolesToApply, setRolesToApply] = useState({}),
		[visible, setVisible] = useState(false);

	const {observer, onClose: closeModal} = useModal({
		onClose: () => {
			setVisible(false);
			setUsersToInvite({});
			setRolesToApply({});
			setIsLoading(false);
		}
	});

	const addRole = role => setRolesToApply({...rolesToApply, ...role}),
		addUser = user => setUsersToInvite({...usersToInvite, ...user}),
		discardRole = roleId => {
			delete rolesToApply[roleId];

			setRolesToApply({...rolesToApply});
		},
		discardUser = userId => {
			delete usersToInvite[userId];

			setUsersToInvite({...usersToInvite});
		},
		inviteUsers = () => {
			setIsLoading(true);

			const accountMembers = Object.values(usersToInvite).map(
				({email}) => ({
					accountId,
					email,
					roles: Object.values(rolesToApply)
				})
			);

			CommerceAdminAccountResource.createAccountMembersByAccountId(
				accountId,
				accountMembers
			)
				.then(closeModal)
				.catch(() => {
					setIsLoading(false);

					showErrorNotification(
						Liferay.Language.get('an-unexpected-error-occurred')
					);
				});
		},
		resetRoles = () => setRolesToApply({}),
		resetUsers = () => setUsersToInvite({});

	const openModal = () => setVisible(true);

	useEffect(() => {
		Liferay[!visible ? 'on' : 'detach'](
			`${namespace}${INVITE_USERS}`,
			openModal
		);
	}, [namespace, openModal, visible]);

	useEffect(() => {
		if (isEmpty(availableRoles)) {
			AdminUserResource.getRoles().then(({items}) =>
				setAvailableRoles([
					...items.filter(({roleType}) => roleType === ROLE_TYPE)
				])
			);
		}
	}, [AdminUserResource, availableRoles]);

	return (
		<>
			{visible && (
				<ClayModal
					className={classnames('user-invitation-modal', cssClasses)}
					observer={observer}
					size={null}
					spritemap={spritemap}
				>
					<ClayModal.Header>
						{Liferay.Language.get('invite-users')}
					</ClayModal.Header>

					<ClayModal.Body scrollable={false}>
						<div className={'user-invitation-modal-wrapper'}>
							<ClayForm>
								<UsersMultiSelect
									addUser={addUser}
									discardUser={discardUser}
									resetUsers={resetUsers}
									spritemap={spritemap}
									usersToInvite={usersToInvite}
								/>

								<RolesMultiSelect
									addRole={addRole}
									availableRoles={availableRoles}
									discardRole={discardRole}
									resetRoles={resetRoles}
									rolesToApply={rolesToApply}
									spritemap={spritemap}
								/>
							</ClayForm>

							{isLoading && (
								<div
									className={'user-invitation-modal-spinner'}
								>
									<ClayLoadingIndicator />
								</div>
							)}
						</div>
					</ClayModal.Body>

					<ClayModal.Footer
						last={
							<ClayButton.Group spaced>
								<ClayButton
									displayType="secondary"
									onClick={closeModal}
								>
									{Liferay.Language.get('cancel')}
								</ClayButton>

								<ClayButton
									disabled={
										isEmpty(usersToInvite) ||
										isEmpty(rolesToApply)
									}
									displayType="primary"
									onClick={inviteUsers}
								>
									{Liferay.Language.get('send-invitations')}
								</ClayButton>
							</ClayButton.Group>
						}
					/>
				</ClayModal>
			)}
		</>
	);
}

UserInvitation.propTypes = {
	accountId: PropTypes.number.isRequired,
	additionalClasses: PropTypes.string,
	namespace: PropTypes.string.isRequired,
	spritemap: PropTypes.string.isRequired
};

export default UserInvitation;
