import React, {useContext, useState} from 'react';
import {AssetTypeInfoPanelContext} from "./context";
import Tabs from "@clayui/tabs";
import {TABS} from "./tabs_content";
import {SidePanel} from "@clayui/core";

const AssetTypeInfoPanelFilesView = () => {
    const {
        id,
        externalReferenceCode,
        type,
    } = useContext(AssetTypeInfoPanelContext);

    const [active, setActive] = useState(0);

    return (
        <>
            <Tabs
                active={active}
                onActiveChange={setActive}
            >
                {Object.entries(TABS).map(([key, value], index) => (
                    <Tabs.Item
                        key={`tab_${key}_${index}`}
                        innerProps={{
                            'aria-controls': `tabpanel-${value.id}`,
                        }}
                    >
                        {value.name}
                    </Tabs.Item>
                ))}
            </Tabs>

            <Tabs.Content active={active} fade>
                {Object.entries(TABS).map(([key, value], index) => (
                    <Tabs.TabPane key={`pane_${key}_${index}`}>
                        <SidePanel.Body>
                            <value.component/>
                        </SidePanel.Body>
                    </Tabs.TabPane>
                ))}
            </Tabs.Content>
        </>
    );
};

export default AssetTypeInfoPanelFilesView;