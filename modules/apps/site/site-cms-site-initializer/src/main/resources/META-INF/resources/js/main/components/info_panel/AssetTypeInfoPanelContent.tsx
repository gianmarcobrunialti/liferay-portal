/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import React, {useEffect, useState} from 'react';
import AssetTypeInfoPanelHeader from "./AssetTypeInfoPanelHeader";
import AssetTypeInfoPanelBody from "./AssetTypeInfoPanelBody";
import {AssetTypeInfoPanelContext, IAssetTypeInfoPanelContext} from "./context";
import {
    getBaseAssetInformation,
    IAssetInformation,
    IAssetObjectEntry
} from "./util";

import '../../../../css/components/AssetTypeInfoPanel.scss';
import {EVENTS} from "./util/constants";
import {error} from 'console';

const AssetTypeInfoPanelContent = () => {
    const [assetInfo, setAssetInfo] = useState({} as IAssetInformation);
    const [objectEntries, setObjectEntries] = useState([] as IAssetObjectEntry[]);

    useEffect(() => {
        const handler = ({items}: {items: IAssetObjectEntry[]}): void => {
            error('======> handler called');

            setObjectEntries(items as IAssetObjectEntry[]);
        };

        Liferay.on(EVENTS.ASSET_DATA, handler);

        return () => {
            Liferay.detach(EVENTS.ASSET_DATA, handler);
        }
    }, [setObjectEntries]);

    useEffect(() => {
        if (objectEntries.length === 1) {
            setAssetInfo(getBaseAssetInformation(objectEntries[0]));
        }
    }, [objectEntries]);

    return (
        <>
            <AssetTypeInfoPanelContext.Provider value={{
                objectEntries,
                ...assetInfo,
            } as IAssetTypeInfoPanelContext}>
                <AssetTypeInfoPanelHeader/>

                <AssetTypeInfoPanelBody/>
            </AssetTypeInfoPanelContext.Provider>
        </>
    );
};

export default AssetTypeInfoPanelContent;

