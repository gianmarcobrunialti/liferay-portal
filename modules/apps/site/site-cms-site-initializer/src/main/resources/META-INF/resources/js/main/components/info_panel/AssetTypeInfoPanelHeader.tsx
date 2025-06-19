import React, {useContext} from 'react';
import {AssetTypeInfoPanelContext} from "./context";
import {SidePanel} from "@clayui/core";
import ClayIcon from "@clayui/icon";
import {sub} from "frontend-js-web";

const ASSET_TYPE = {
    CONTENT: 'content',
    EMPTY: 'empty',
    FILES: 'files',
    FOLDER: 'folder',
    MULTIPLE: 'multiple',
}

const AssetTypeInfoPanelHeader = () => {
    const {
        externalReferenceCode,
        id,
        items,
        name,
        type,
    } = useContext(AssetTypeInfoPanelContext);

    return (
        <>
            <SidePanel.Header>
                <span className="text-5">
                    {type !== ASSET_TYPE.EMPTY && (
                        <ClayIcon
                            className="inline-item inline-item-before"
                            symbol={type === ASSET_TYPE.CONTENT ? "forms" :
                                type === ASSET_TYPE.FILES ? "document-image" :
                                    type === ASSET_TYPE.FOLDER ? "folder" :
                                        "check-square"}
                        >
                        </ClayIcon>
                    )}
                    <SidePanel.Title
                        className="inline-item inline-item-after"
                    >
                        <h3>
                        {type === ASSET_TYPE.EMPTY && (
                            Liferay.Language.get('no-assets-selected')
                        )}
                        {type === ASSET_TYPE.MULTIPLE && (
                            sub(
                                Liferay.Language.get('x-assets-selected'),
                                [items.length]
                            )
                        )}
                        {(type === ASSET_TYPE.FILES || type === ASSET_TYPE.CONTENT || type === ASSET_TYPE.FOLDER) &&
                         (
                             name
                            )}
                        </h3>
                    </SidePanel.Title>
                </span>
            </SidePanel.Header>
        </>
    );
};

export default AssetTypeInfoPanelHeader;