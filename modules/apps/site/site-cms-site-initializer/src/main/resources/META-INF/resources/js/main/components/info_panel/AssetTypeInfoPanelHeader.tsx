import React, {useContext} from 'react';
import classnames from 'classnames';
import {AssetTypeInfoPanelContext, IAssetTypeInfoPanelContext} from "./context";
import ClayIcon from "@clayui/icon";
import {sub} from "frontend-js-web";
import {ASSET_TYPE} from "./util/constants";

const renderTitle = ({
    objectEntries,
    title,
    title_i18n,
    type
}: IAssetTypeInfoPanelContext) => {
    if (!objectEntries?.length) {
        return <>{Liferay.Language.get('no-assets-selected')}</>
    }
    else if (objectEntries?.length > 1) {
        return <>{
            sub(
                Liferay.Language.get('x-assets-selected'),
                objectEntries.length
            )
        }</>;
    }
    else if (type === ASSET_TYPE.FILES || type === ASSET_TYPE.CONTENTS || type === ASSET_TYPE.FOLDER) {
        return <>{!title_i18n
            ? title
            : title_i18n[Liferay.ThemeDisplay.getLanguageId()] || title}</>
    }

    return null;
}

const AssetTypeInfoPanelHeader = () => {
    const context = useContext(AssetTypeInfoPanelContext);

    return (
        <>
            <div className="sidebar-header">
                <div className="component-title">
                    {context.objectEntries?.length === 1 && (
                        <ClayIcon
                            className={classnames(
                                "asset-icon inline-item inline-item-before",
                                {'asset-icon-files': context.type === ASSET_TYPE.FILES}
                            )}
                            symbol={context.icon || ''}
                        >
                        </ClayIcon>
                    )}

                    <h3 className="asset-title inline-item inline-item-after">
                        {renderTitle(context)}
                    </h3>
                </div>
            </div>
        </>
    );
};

export default AssetTypeInfoPanelHeader;