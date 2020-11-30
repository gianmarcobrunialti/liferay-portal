/**
 * Copyright (c) 2000-present Liferay, Inc. All rights reserved.
 *
 * The contents of this file are subject to the terms of the Liferay Enterprise
 * Subscription License ("License"). You may not use this file except in
 * compliance with the License. You can obtain a copy of the License by
 * contacting Liferay, Inc. See the License for the specific language governing
 * permissions and limitations under the License, including but not limited to
 * distribution rights of the Software.
 */

import {createBrowserHistory} from 'history';
import React, {useMemo} from 'react';

import PartFinder from './components/PartFinder.es';

function App(props) {
	const history = useMemo(
		() => createBrowserHistory({basename: props.basename || '/'}),
		[props.basename]
	);

	return (
		<div className="bom-wrapper container pt-3">
			<PartFinder
				areasEndpoint={props.areasEndpoint}
				basePathUrl={props.basePathUrl}
				basename={props.basename}
				foldersEndpoint={props.foldersEndpoint}
				history={history}
				spritemap={props.spritemap}
			/>
		</div>
	);
}

export default App;
