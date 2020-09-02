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

import React from 'react';
import {launcher, getRandomId} from '../../utilities/index.es';
import userInvitationLauncher from './entry.es';
import {INVITE_USER} from "../../utilities/eventsDefinitions.es";

import '../../styles/main.scss';

const randomNamespace = getRandomId();

const props = {
	apiEndpoint: `/o/headless-commerce-admin-account/v1.0/accounts/${getRandomId()}/accountMembers`,
	namespace: randomNamespace,
	spritemap: './assets/icons.svg'
};

userInvitationLauncher('user-invitation', 'user-invitation', props);

launcher(
	() => (
		<button
			className="btn btn-primary"
			onClick={() =>
				Liferay.fire(`${randomNamespace}${INVITE_USER}`)
			}
		>
			Open UserInvitation
		</button>
	),
	'user-invitation-modal-trigger',
	'user-invitation-modal-trigger',
	props
);
