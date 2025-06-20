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

function getAssetType({entryClassName = '', embedded: {objectEntryFolderExternalReferenceCode} = ''}: any) {
    if (entryClassName.includes('ObjectEntryFolder')) {
        return 'folder';
    } else if (objectEntryFolderExternalReferenceCode === 'L_FILES') {
        return 'files';
    } else if (objectEntryFolderExternalReferenceCode === 'L_CONTENTS') {
        return 'content';
    }
}

const AssetTypeInfoPanelContainer = () => {
    const containerRef = useRef(null);
    const context = useContext(SidePanelContext);

    const [open, setOpen] = useState(false);
    const [objectEntry, setObjectEntry] = useState(SAMPLE_ASSET_OBJECT);

    return (
        <>
            <Button
                aria-controls="sidepanel-example"
                aria-pressed={open}
                onClick={() => setOpen(!open)}
            >
                Open
            </Button>
            <div>
                <AssetTypeInfoPanelContext.Provider value={{
                    objectEntry,
                    type: getAssetType(objectEntry),
                }}>
                    <SidePanel
                        className="top-bar"
                        containerRef={containerRef}
                        direction="right"
                        onOpenChange={setOpen}
                        open={open}
                        position="absolute"
                    >
                        <AssetTypeInfoPanelHeader/>

                        <AssetTypeInfoPanelBody/>
                    </SidePanel>
                </AssetTypeInfoPanelContext.Provider>
            </div>
        </>
    );
};

export default AssetTypeInfoPanelContainer;

