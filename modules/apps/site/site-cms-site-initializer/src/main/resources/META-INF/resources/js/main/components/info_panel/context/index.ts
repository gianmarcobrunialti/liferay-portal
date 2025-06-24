import React from 'react';

interface IAssetTypeSidePanelContext {
    externalReferenceCode?: string | null;
    icon?: string | null;
    id?: number | null;
    items?: any[] | [];
    name?: string | null;
    objectEntry?: any;
    type?: string | null;
}

const BASE_CONTEXT: IAssetTypeSidePanelContext = {
    externalReferenceCode: null,
    icon: null,
    id: null,
    items: [],
    name: null,
    objectEntry: null,
    type: 'files',
};

export const AssetTypeInfoPanelContext = React.createContext(BASE_CONTEXT);