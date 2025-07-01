import React, {useContext} from 'react';
import {AssetTypeInfoPanelContext} from "./context";
import {getImage} from "../../util/getImage";
import ClayEmptyState from "@clayui/empty-state";

const AssetTypeInfoPanelDefaultView = () => {
    const {objectEntries = []} = useContext(AssetTypeInfoPanelContext);

    const props: {
        className: string;
        description?: string | undefined;
        imgSrc: string;
        imgSrcReducedMotion: string;
        small: boolean;
        title: string | null;
    } = {
        className: 'justify-content-center structure-builder__empty-state',
        description: '',
        imgSrc: '',
        imgSrcReducedMotion: '',
        small: true,
        title: null,
    };

    if (!objectEntries.length) {
        props.description =
            Liferay.Language.get('click-on-an-asset-to-see-its-details');
        props.imgSrc = getImage('empty_selection_state.svg');
        props.imgSrcReducedMotion = getImage('empty_selection_state.svg');
    }
    else if (objectEntries.length > 1) {
        props.className = `${props.className} asset-multi-selection`;
        props.imgSrc = getImage('multiselection_state.svg');
        props.imgSrcReducedMotion = getImage('multiselection_state.svg');
    }

    return (

        <div className="asset-type-default-view autofit-col">
            <ClayEmptyState {...props} />
        </div>
    );
};


export default AssetTypeInfoPanelDefaultView;