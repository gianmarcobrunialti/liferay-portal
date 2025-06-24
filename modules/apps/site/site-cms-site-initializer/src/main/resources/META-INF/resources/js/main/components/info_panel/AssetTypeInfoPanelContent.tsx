//@ts-ignore

/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import React, {
    useContext,
    useEffect,
    useRef,
    useState
} from 'react';
import {Button, SidePanel} from "@clayui/core";
import {SidePanelContext} from "@clayui/core/lib/side-panel/context";
import AssetTypeInfoPanelHeader from "./AssetTypeInfoPanelHeader";
import AssetTypeInfoPanelBody from "./AssetTypeInfoPanelBody";

import {AssetTypeInfoPanelContext} from "./context";
import {SAMPLE_ASSET_OBJECT} from "./mocks";

import '../../../../css/components/AssetTypeInfoPanel.scss';
import {getBaseAssetInfo} from "./util";

const AssetTypeInfoPanelContent = () => {
    const [objectEntry, setObjectEntry] = useState(SAMPLE_ASSET_OBJECT);

    const assetInfo = getBaseAssetInfo(objectEntry);

    return (
        <>
            <AssetTypeInfoPanelContext.Provider value={{
                objectEntry,
                ...assetInfo,
            }}>
                <AssetTypeInfoPanelHeader/>

                <AssetTypeInfoPanelBody/>
            </AssetTypeInfoPanelContext.Provider>
        </>
    );
};

export default AssetTypeInfoPanelContent;

