import React, {useContext} from 'react';
import {AssetTypeInfoPanelContext} from "./context";

const AssetTypeInfoPanelHeader = () => {
    const {
        id,
        externalReferenceCode,
        type
    } = useContext(AssetTypeInfoPanelContext);

    return ();


 };

export default AssetTypeInfoPanelHeader;