/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {FrontendDataSet} from '@liferay/frontend-data-set-web';
import React, {useEffect, useRef, useState} from 'react';

import {
	TRoomDocumentsStatistics,
} from '../../../common/utils/types';
import {AverageTimeDataRenderer} from './cell_renderers/AverageTimeDataRenderer';
import {DocumentTitleDataRenderer} from './cell_renderers/DocumentTitleDataRenderer';
import {LastViewedDataRenderer} from './cell_renderers/LastViewedDataRenderer';
import {UserInvolvedDataRenderer} from './cell_renderers/UserInvolvedDataRenderer';

import '../../../../css/components/DocumentsStatistics.scss';
import useAnalyticsQuery from "../../../common/hooks/useAnalyticsQuery";
import DocumentsStatisticsQuery from "../queries/DocumentsStatisticsQuery";
import AnalyticsFrame from "./AnalyticsFrame";
import Loader from "./Loader";

const RoomDocumentsStatistics = ({
	namespace,
}: {
	namespace: string;
}) => {
	const [data, setData] = useState<TRoomDocumentsStatistics[]>([]);
	const [element, setElement] = useState<HTMLElement | null>(null);

	const {isLoading, response} = useAnalyticsQuery({
		element,
		query: DocumentsStatisticsQuery,
		variables: {
			"channelId": "808122315193619922",
			"keywords": "",
			"size": 20,
			"sort": {
				"column": "downloadsMetric",
				"type": "DESC"
			},
			"start": 0,
			"rangeEnd": null,
			"rangeKey": 7,
			"rangeStart": null
		}
	});

	useEffect(() => {
		if (response) {
			setData(response);
		}

		return () => {};
	}, [response, setData]);

	return (
		<AnalyticsFrame
			icon="documents-and-media"
			title={Liferay.Language.get('most-engaged-documents')}
		>
			<div ref={setElement}>
				{isLoading ? (
					<Loader />
				) : !data?.length ? (
					<p className="text-muted">
						{Liferay.Language.get('no-data-available')}
					</p>
				) : (
				<div className="document-statistics-fds">
					<FrontendDataSet
						customDataRenderers={{
							averageTimeDataRenderer: AverageTimeDataRenderer,
							documentNameDataRenderer: DocumentTitleDataRenderer,
							lastViewedDataRenderer: LastViewedDataRenderer,
							userInvolvedDataRenderer: UserInvolvedDataRenderer,
						}}
						id={namespace}
						items={data}
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
											contentRenderer: 'documentNameDataRenderer',
											fieldName: 'title',
											label: Liferay.Language.get('title'),
										},
										{
											fieldName: 'totalViews',
											label: Liferay.Language.get('total-views'),
										},
										{
											contentRenderer: 'lastViewedDataRenderer',
											fieldName: 'lastViewed',
											label: Liferay.Language.get('last-viewed'),
										},
										{
											fieldName: 'download',
											label: Liferay.Language.get('download'),
										},
										{
											contentRenderer: 'averageTimeDataRenderer',
											fieldName: 'averageTime',
											label: Liferay.Language.get('average-time'),
										},
										{
											contentRenderer: 'userInvolvedDataRenderer',
											fieldName: 'userInvolved',
											label: Liferay.Language.get(
												'user-involved'
											),
										},
									],
								},
								thumbnail: 'table',
							},
						]}
					/>
				</div>)}
			</div>
		</AnalyticsFrame>
	);
};

export default RoomDocumentsStatistics;
