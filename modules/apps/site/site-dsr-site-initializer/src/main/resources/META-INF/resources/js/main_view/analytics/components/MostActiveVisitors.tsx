/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {FrontendDataSet} from '@liferay/frontend-data-set-web';
import React, {useEffect, useRef, useState} from 'react';

import VisitorStickerRenderer from './cell_renderers/VisitorStickerRenderer';

import './../../../../css/components/MostActiveVisitors.scss';
import AnalyticsFrame from "./AnalyticsFrame";
import useAnalyticsQuery from "../../../common/hooks/useAnalyticsQuery";
import MostActiveVisitorsQuery from "../queries/MostActiveVisitorsQuery";
import {TVisitor} from "../../../common/utils/types";
import Loader from "./Loader";

const MostActiveVisitors = ({
	namespace,
}: {
	namespace: string;
}) => {
	const [data, setData] = useState<TVisitor[]>([]);

	const elementRef = useRef(null);

	const {isLoading, response} = useAnalyticsQuery({
		element: elementRef.current,
		query: MostActiveVisitorsQuery,
		variables: {
			"channelId": "808122315193619922",
			"rangeKey": 7,
			"size": 10,
			"start": 0
		},
	});

	useEffect(() => {
		if (response) {
			setData(response);
		}
	}, [response]);

	if (isLoading) {
		return <Loader />;
	}

	if (!data?.length) {
		return <p>{Liferay.Language.get('no-data-available')}</p>;
	}

	return (
		<AnalyticsFrame
			icon="user"
			title={Liferay.Language.get('most-active-visitors')}
		>
		<div className="most-active-visitors-fds" ref={elementRef}>
			<FrontendDataSet
				customRenderers={{
					tableCell: [
						{
							component: VisitorStickerRenderer,
							name: 'visitorSticker',
							type: 'internal',
						},
					],
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
									contentRenderer: 'visitorSticker',
									fieldName: 'title',
									label: '',
								},
							],
						},
						thumbnail: 'table',
					},
				]}
			/>
		</div>
		</AnalyticsFrame>
	);
};

export default MostActiveVisitors;
