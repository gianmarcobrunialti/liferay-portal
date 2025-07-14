/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import React, {useContext} from 'react';
import AssetMetadataComponent from "../components/AssetMetadataComponent";
import {AssetTypeInfoPanelContext} from "../context";
import {ASSET_TYPE} from "../util/constants";

const DetailsTabContent = () => {
	const {type} = useContext(AssetTypeInfoPanelContext);

	return (
		<>
			{type === ASSET_TYPE.FILES && (
				<div>image</div>
			)}

			<AssetMetadataComponent/>
		</>
	);
};

export default DetailsTabContent;
