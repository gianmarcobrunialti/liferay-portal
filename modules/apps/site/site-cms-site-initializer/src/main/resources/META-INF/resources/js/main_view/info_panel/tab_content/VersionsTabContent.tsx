/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {Button} from '@clayui/core';
import Label from '@clayui/label';
import {dateUtils, fetch, sub} from 'frontend-js-web';
import React, {useCallback, useContext, useEffect, useState} from 'react';

import {IAssetObjectEntry} from '../../../structure_builder/types/AssetType';
import {
	AssetTypeInfoPanelContext,
	IAssetTypeInfoPanelContext,
} from '../context';

const MAX_LIST_SIZE = 10;

const VersionsTabContent = () => {
	const {objectEntries = []}: IAssetTypeInfoPanelContext = useContext(
		AssetTypeInfoPanelContext
	);

	const [versionedObjectEntries, setVersionedObjectEntries] = useState<{
		count: number;
		items: IAssetObjectEntry[];
	}>({count: 0, items: []});

	const getVersionedObjectEntries = useCallback(async () => {
		const [
			{
				actions: {
					versions: {href = ''},
				},
			},
		] = objectEntries;

		const response = await fetch(
			`${href}?page=1&pageSize=${MAX_LIST_SIZE}`
		);

		if (response.ok) {
			const {items, totalCount} = await response.json();

			setVersionedObjectEntries({count: totalCount, items});
		}
	}, [objectEntries, setVersionedObjectEntries]);

	useEffect(() => {
		getVersionedObjectEntries();
	}, [getVersionedObjectEntries]);

	return (
		<>
			<ul className="list-group">
				{versionedObjectEntries.items.map(
					(
						{creator, dateModified, status, systemProperties},
						index
					) => (
						<li
							className="list-group-item list-group-item-flex"
							key={index}
						>
							<div className="ml-2 mt-2">
								<p className="list-group-title text-truncate">
									{Liferay.Language.get('version')}{' '}

									{systemProperties.version.number}
								</p>

								<span>
									<p className="list-group-subtitle text-truncate">
										{sub(
											Liferay.Language.get('x,-modified'),
											[creator.name]
										)}
									</p>
								</span>

								<p className="list-group-subtitle text-truncate">
									{dateUtils.format(
										new Date(dateModified),
										'P p'
									)}
								</p>

								<Label displayType="success">
									{status.label_i18n}
								</Label>
							</div>
						</li>
					)
				)}
			</ul>

			{versionedObjectEntries.count > MAX_LIST_SIZE && (
				<div className="d-flex justify-content-center">
					<Button displayType="secondary">
						{Liferay.Language.get('view-all')}
					</Button>
				</div>
			)}
		</>
	);
};

export default VersionsTabContent;
