/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import React, {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState
} from 'react';

import {AssetTypeInfoPanelContext} from '../context';
import {IAssetObjectEntry} from "../../../common/types/AssetType";
import AssetCategories from "../components/AssetCategories";
import AssetTags from "../components/AssetTags";
import ObjectEntryService from "../services/ObjectEntryService";
import {displayErrorToast} from "../../../common/utils/toastUtil";

const CategorizationTabContent = () => {
	const {
		actions,
		asset,
		assetLibrary,
		cmsGroupId,
	} = useContext(AssetTypeInfoPanelContext);

	if (!assetLibrary || !cmsGroupId || !actions?.get?.href) {
		return null;
	}

	const [currentAsset, setCurrentAsset] =
		useState<IAssetObjectEntry | null>(null);

	const getObjectEntry = useCallback(async () => {
		try {
			const {data, error} = await ObjectEntryService.getObjectEntry(actions.get.href);

			if (error) {
				throw new Error(error);
			}

			delete (data as Partial<IAssetObjectEntry>).actions;

			setCurrentAsset(data);
		} catch(error) {
			console.log(error);

			displayErrorToast(error as string)
		}
	}, [actions]);

	const hasUpdatePermission = useMemo(() =>
		!!actions?.update?.href, [actions]);

	const updateObjectEntry = useCallback(async ({
		keywords,
		taxonomyCategoryIds,
	}: IAssetObjectEntry) => {
		if (!currentAsset || !hasUpdatePermission) {
			return;
		}

		const {href} = actions.update;

		try {
			const {data: {...objectEntry}, error} = await ObjectEntryService.patchObjectEntry({
				...currentAsset,
				keywords: keywords || currentAsset.keywords,
				taxonomyCategoryIds:
					taxonomyCategoryIds ||
					currentAsset.taxonomyCategoryIds,
			}, href);

			if (error) {
				throw new Error();
			}

			delete (objectEntry as Partial<IAssetObjectEntry>).actions;

			setCurrentAsset(objectEntry as IAssetObjectEntry);
		} catch(_error) {
			displayErrorToast();
		}
	}, [currentAsset, hasUpdatePermission, setCurrentAsset]);

	useEffect(() => {
		if (asset) {
			// setCurrentAsset({...asset});
			getObjectEntry();
		}
	}, [asset]);

	return !currentAsset ? null : (
		<>
			<AssetCategories
				cmsGroupId={cmsGroupId}
				hasUpdatePermission={hasUpdatePermission}
				objectEntry={currentAsset}
				updateObjectEntry={updateObjectEntry}
			/>

			<AssetTags
				assetLibraryId={assetLibrary.groupId}
				hasUpdatePermission={hasUpdatePermission}
				cmsGroupId={cmsGroupId}
				objectEntry={currentAsset}
				updateObjectEntry={updateObjectEntry}
			/>
		</>
	);
};

export default CategorizationTabContent;
