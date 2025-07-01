import React from 'react';
import {IAssetInformation, IAssetObjectEntry} from "../util";

export interface IAssetTypeInfoPanelContext extends IAssetInformation {
    objectEntries?: IAssetObjectEntry[];
}

const BASE_CONTEXT: IAssetTypeInfoPanelContext = {
    externalReferenceCode: null,
    icon: null,
    id: null,
    objectEntries: [],
    title: null,
    title_i18n: null,
    type: null,
};

export const AssetTypeInfoPanelContext = React.createContext(BASE_CONTEXT);