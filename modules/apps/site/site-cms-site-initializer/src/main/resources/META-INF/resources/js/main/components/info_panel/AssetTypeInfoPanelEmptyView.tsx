import React, {useContext} from 'react';
import {AssetTypeInfoPanelContext} from "./context";
import {getImage} from "../../util/getImage";
import ClayEmptyState from "@clayui/empty-state";
import {ASSET_TYPE} from "./util/constants";

// TODO Check SVG

const AssetTypeInfoPanelEmptyView = () => {
    const {
        id,
        externalReferenceCode,
        type,
    } = useContext(AssetTypeInfoPanelContext);

    return (
        <>
            {type === ASSET_TYPE.EMPTY ?
                <>
                    <div className="autofit-col">
                        <ClayEmptyState
                            className="justify-content-center structure-builder__empty-state"
                            description=""
                            imgSrc={getImage('multiselection_state.svg')}
                            imgSrcReducedMotion={getImage('multiselection_state.svg')}
                            small
                            title={Liferay.Language.get('multiple-items-selected')}
                        />
                        <p>Click on asset to see its details</p>
                    </div>
                </>
                :
                <div className="autofit-col">
                    <ClayEmptyState
                        className="justify-content-center structure-builder__empty-state"
                        description=""
                        imgSrc={getImage('multiselection_state.svg')}
                        imgSrcReducedMotion={getImage('multiselection_state.svg')}
                        small
                        title={Liferay.Language.get('multiple-items-selected')}
                    />
                </div>
            }
        </>
    );
};


export default AssetTypeInfoPanelEmptyView;