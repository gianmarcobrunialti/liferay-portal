import React, {useContext} from 'react';
import {AssetTypeInfoPanelContext} from "./context";
import AssetTypeInfoPanelFilesView from "./AssetTypeInfoPanelFilesView";
import AssetTypeInfoPanelEmptyView from "./AssetTypeInfoPanelEmptyView";
import AssetTypeInfoPanelFolderView from "./AssetTypeInfoPanelFolderView";
import {ASSET_TYPE} from "./util/constants";

const AssetTypeInfoPanelBody = () => {
    const {
        id,
        externalReferenceCode,
        type,
    } = useContext(AssetTypeInfoPanelContext);

    return (
        <>
            {(type === ASSET_TYPE.EMPTY || type === ASSET_TYPE.MULTIPLE)
                ? <AssetTypeInfoPanelEmptyView/>
                : (type === ASSET_TYPE.FILES || type === ASSET_TYPE.CONTENTS)
                    ? <AssetTypeInfoPanelFilesView />
                    : <AssetTypeInfoPanelFolderView/>
            }
        </>
    );
};

export default AssetTypeInfoPanelBody;