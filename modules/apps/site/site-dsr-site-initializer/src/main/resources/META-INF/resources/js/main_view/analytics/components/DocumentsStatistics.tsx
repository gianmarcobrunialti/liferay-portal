/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayIcon from '@clayui/icon';
import ClaySticker from '@clayui/sticker';
import {FrontendDataSet} from '@liferay/frontend-data-set-web';
import classNames from 'classnames';
import {sub} from 'frontend-js-web';
import React from 'react';

import '../../../../css/components/FDSMostEngagedDocuments.scss';

const AverageTimeDataRender = ({itemData = []}: any) => {
	const {totalTimeViewingAsset = 0, totalViews = 0} = itemData;

	const secondsAverageTime = Math.round(totalTimeViewingAsset / totalViews);

	const hour = Math.floor(secondsAverageTime / 3600);
	const minutes = Math.floor((secondsAverageTime % 3600) / 60);

	return sub(`${Liferay.Language.get('x-h-x-min')}`, hour, minutes);
};

const DocumentTitleDataRender = ({itemData = []}: any) => {
	const {title = '', type = ''} = itemData;

	return (
		<div>
			<ClaySticker
				className={classNames(
					'c-mr-2',
					'flex-shrink-0',
					'inline-item',
					'inline-item-before',
					type === 'pdf' ? 'file-icon-color-0' : 'file-icon-color-6'
				)}
				inline
				size="lg"
			>
				<ClayIcon
					aria-label={Liferay.Language.get(type)}
					symbol={type === 'pdf' ? 'document-pdf' : 'document-text'}
				/>
			</ClaySticker>

			<span
				aria-label={Liferay.Language.get(title)}
				className="table-list-title"
			>
				{Liferay.Language.get(title)}
			</span>
		</div>
	);
};

const LastViewedDataRender = ({itemData = []}: any) => {
	const {lastViewed = ''} = itemData;

	return new Intl.DateTimeFormat(Liferay.ThemeDisplay.getBCP47LanguageId(), {
		dateStyle: 'medium',
	}).format(new Date(lastViewed));
};

const UserInvolvedDataRender = ({itemData = []}: any) => {
	const {userInvolved = []} = itemData;

	if (!userInvolved.length) {
		return 0;
	}

	return sub(Liferay.Language.get('x-users'), [new Set(userInvolved).size]);
};

const DocumentsStatistics = ({items = []}: any) => {
	return (
		<FrontendDataSet
			customDataRenderers={{
				averageTimeDataRender: AverageTimeDataRender,
				documentNameDataRender: DocumentTitleDataRender,
				lastViewedDataRender: LastViewedDataRender,
				userInvolvedDataRender: UserInvolvedDataRender,
			}}
			id="EngagedDocumentsDataSet"
			items={items}
			showManagementBar={false}
			showPagination={false}
			showSearch={false}
			showSelectAll={false}
			views={[
				{
					contentRenderer: 'table',
					label: Liferay.Language.get('table'),
					name: 'table',
					schema: {
						fields: [
							{
								contentRenderer: 'documentNameDataRender',
								fieldName: 'title',
								label: Liferay.Language.get('title'),
							},
							{
								fieldName: 'totalViews',
								label: Liferay.Language.get('total-views'),
							},
							{
								contentRenderer: 'lastViewedDataRender',
								fieldName: 'lastViewed',
								label: Liferay.Language.get('last-viewed'),
							},
							{
								fieldName: 'download',
								label: Liferay.Language.get('download'),
							},
							{
								contentRenderer: 'averageTimeDataRender',
								fieldName: 'averageTime',
								label: Liferay.Language.get('average-time'),
							},
							{
								contentRenderer: 'userInvolvedDataRender',
								fieldName: 'userInvolved',
								label: Liferay.Language.get('user-involved'),
							},
						],
					},
					thumbnail: 'table',
				},
			]}
		/>
	);
};

export default DocumentsStatistics;
