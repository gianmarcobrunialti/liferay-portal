import React, {useCallback, useEffect, useState} from 'react';
import {AssetTypeInfoPanelContext} from "./context";
import AssetTypeInfoPanelHeader from "./AssetTypeInfoPanelHeader";

/*
    - Context Provider
        {
            id: <assetId / Object Entry Id>,
            externalReferenceCode: <asset ERC / Object Entry ERC>,
            type: <asset Type>tab-pane active fade show
            ...
        }
        - header
            - asset type resolution
                - tab

 */

const AssetTypeInfoPanelContainer = ({
                                         externalReferenceCode,
                                         id,
                                         type,
                                     }) => {
    const [objectEntry, setObjectEntry] = useState(null);

    const fetchObjectEntry = useCallback(async () =>
        fetch('...')
            .then((objectEntry) => {
                setObjectEntry(objectEntry);
            })
            .catch(() => {}), []);

    useEffect(() => {
        /*
        if (someCondition()) {
            const objectEntryAPIResponse = await someAPICall();

            setAssetERC(objectEntryAPIResponse.externalReferenceCode);
        }
         */
    }, []);

    return (
        <AssetTypeInfoPanelContext.Provider value={{
            externalReferenceCode: assetERC,
            id: assetId,
            type: assetType,
        }}>
            <AssetTypeInfoPanelHeader/>
        </AssetTypeInfoPanelContext.Provider>
    );
};

export default AssetTypeInfoPanelContainer;