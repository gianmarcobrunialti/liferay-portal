import React, {useContext, useRef, useState} from 'react';
import {Button, SidePanel} from "@clayui/core";
import {SidePanelContext} from "@clayui/core/lib/side-panel/context";
import AssetTypeInfoPanelHeader from "./AssetTypeInfoPanelHeader";
import AssetTypeInfoPanelBody from "./AssetTypeInfoPanelBody";

const AssetTypeInfoPanelContainer = () => {
    const containerRef = useRef(null);
    const context = useContext(SidePanelContext);

    const [open, setOpen] = useState(false);

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
            </div>
        </>
    );
};

export default AssetTypeInfoPanelContainer;

