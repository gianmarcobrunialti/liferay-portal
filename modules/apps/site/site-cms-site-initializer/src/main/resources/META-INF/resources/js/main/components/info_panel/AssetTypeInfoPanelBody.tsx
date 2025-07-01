import React, {useContext} from 'react';
import {AssetTypeInfoPanelContext, IAssetTypeInfoPanelContext} from "./context";
import AssetTypeInfoPanelFilesView from "./AssetTypeInfoPanelFilesView";
import AssetTypeInfoPanelDefaultView from "./AssetTypeInfoPanelDefaultView";
import AssetTypeInfoPanelFolderView from "./AssetTypeInfoPanelFolderView";
import {ASSET_TYPE} from "./util/constants";

const AssetTypeInfoPanelBody = () => {
    const {
        objectEntries = [],
        type,
    }: IAssetTypeInfoPanelContext = useContext(AssetTypeInfoPanelContext);

    return (
        <>
            {(objectEntries.length > 1 || !objectEntries.length)
                ? <AssetTypeInfoPanelDefaultView/>
                : (type === ASSET_TYPE.FOLDER)
                    ? <AssetTypeInfoPanelFolderView/>
                    : <AssetTypeInfoPanelFilesView />
            }
        </>
    );
};

export default AssetTypeInfoPanelBody;