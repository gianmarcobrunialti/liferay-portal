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

import {INVITE_USERS} from '../../../src/main/resources/META-INF/resources/utilities/eventsDefinitions';
import launcher from '../../../src/main/resources/META-INF/resources/utilities/launcher';
import {getRandomId} from '../../../src/main/resources/META-INF/resources/utilities/index';
import UserInvitation from '../../../src/main/resources/META-INF/resources/components/user_invitation/entry';

import '../../../src/main/resources/META-INF/resources/styles/main.scss';

const randomNamespace = getRandomId();

const props = {
	accountId: 41110,
	namespace: randomNamespace,
	spritemap: './assets/icons.svg'
};

UserInvitation('user-invitation', 'user-invitation', props);

launcher(
	() => (
		<button
			className="btn btn-primary"
			onClick={() => Liferay.fire(`${randomNamespace}${INVITE_USERS}`)}
		>
			Open UserInvitation
		</button>
	),
	'user-invitation-modal-trigger',
	'user-invitation-modal-trigger',
	props
);
