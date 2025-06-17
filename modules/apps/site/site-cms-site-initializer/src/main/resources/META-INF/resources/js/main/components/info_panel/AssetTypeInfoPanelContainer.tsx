// @ts-ignore

import React, {useContext, useRef} from 'react';
import {SidePanel} from "@clayui/core";
import {SidePanelContext} from "@clayui/core/lib/side-panel/context";

const AssetTypeInfoPanelContainer = () => {
    const containerRef = useRef(null);
    const context = useContext(SidePanelContext);

    return (
        <SidePanel
            className="il-nostro-side-panel"
            containerRef={containerRef}
            direction="right"
            open={true}
            position="fixed"
        >
            Is Open: {context?.open}
            TitleId: {context?.titleId}

            <h1>Test!</h1>
        </SidePanel>
    );
};

export default AssetTypeInfoPanelContainer;

