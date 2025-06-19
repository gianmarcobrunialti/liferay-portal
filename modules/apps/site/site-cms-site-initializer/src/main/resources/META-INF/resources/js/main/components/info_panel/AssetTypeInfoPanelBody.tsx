import React, {useContext} from 'react';
import {AssetTypeInfoPanelContext} from "./context";
import AssetTypeInfoPanelFilesView from "./AssetTypeInfoPanelFilesView";
import AssetTypeInfoPanelEmptyView from "./AssetTypeInfoPanelEmptyView";
import AssetTypeInfoPanelFolderView from "./AssetTypeInfoPanelFolderView";

const ASSET_TYPE = {
    CONTENT: 'content',
    EMPTY: 'empty',
    FILES: 'files',
    FOLDER: 'folder',
    MULTIPLE: 'multiple',
}

const AssetTypeInfoPanelBody = () => {
    const {
        id,
        externalReferenceCode,
        type,
    } = useContext(AssetTypeInfoPanelContext);

    return (
        <>
            {type === ASSET_TYPE.EMPTY
             || type === ASSET_TYPE.MULTIPLE ?
                <AssetTypeInfoPanelEmptyView/>
                :
                type === ASSET_TYPE.FILES
                || type === ASSET_TYPE.CONTENT
                    ?
                    <AssetTypeInfoPanelFilesView/>
                    :
                    <AssetTypeInfoPanelFolderView/>
            }
        </>
    );
};

export default AssetTypeInfoPanelBody;