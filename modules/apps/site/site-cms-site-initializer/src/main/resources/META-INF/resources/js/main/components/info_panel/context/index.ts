import React from 'react';

export const AssetTypeInfoPanelContext = React.createContext({
    externalReferenceCode: null,
    id: null,
    items: [],
    name: null,
    type: 'files',
});