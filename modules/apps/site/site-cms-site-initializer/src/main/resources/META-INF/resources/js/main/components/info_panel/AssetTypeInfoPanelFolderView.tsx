import React, {useContext, useState} from 'react';
import {AssetTypeInfoPanelContext} from "./context";
import Tabs from "@clayui/tabs";
import DetailsTabContent from "./tabs_content/DetailsTabContent";
import PerformanceTabContent from "./tabs_content/PerformanceTabContent";
import {TABS} from "./tabs_content";

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
                className="nav nav-justified nav-tabs"
                active={active}
                onActiveChange={setActive}>
                    <Tabs.Item
                        innerProps={{
                            'aria-controls': `tabpanel-${TABS.DETAILS.id}`,
                        }}
                    >
                        {TABS.DETAILS.name}
                    </Tabs.Item>
                    <Tabs.Item
                        innerProps={{
                            'aria-controls': `tabpanel-${TABS.PERFORMANCE.id}`,
                        }}
                    >
                        {TABS.PERFORMANCE.name}
                    </Tabs.Item>
            </Tabs>
            <Tabs.Content active={active} fade>
                    <Tabs.TabPane
                        key={TABS.DETAILS.id}
                    >
                        <DetailsTabContent/>
                    </Tabs.TabPane>
                    <Tabs.TabPane
                        key={TABS.PERFORMANCE.id}
                    >
                        <PerformanceTabContent/>
                    </Tabs.TabPane>
            </Tabs.Content>
        </>
    );
};

export default AssetTypeInfoPanelFilesView;