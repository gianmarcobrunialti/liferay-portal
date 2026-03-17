/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {FrontendDataSet} from '@liferay/frontend-data-set-web';
import React, {useRef} from 'react';

import AccountSticker from '../../../common/components/AccountSticker';

import './../../../../css/components/MostActiveVisitors.scss';
import AnalyticsFrame from "./AnalyticsFrame";
import useAnalyticsQuery from "../../../common/hooks/useAnalyticsQuery";
import ActivityLogQuery from "../queries/ActivityLogQuery";
import MostActiveVisitorsQuery from "../queries/MostActiveVisitorsQuery";

type TVisitor = {
	activitiesCount: number;
	emailAddress: string;
	firstName: string;
	lastName: string;
	logoURL: string | undefined;
};

function VisitorSticker({itemData}: {itemData: TVisitor}) {
	return (
		<div className="d-flex inline-item">
			<AccountSticker
				logoURL={itemData.logoURL}
				name={itemData.firstName}
				shape="user-icon"
			/>

			<div className="ml-3">
				<div className="align-items-center font-weight-semi-bold visitors-full-name">
					<span className="mb-0 mr-1">
						{Liferay.Language.get(itemData.firstName)}
					</span>

					<span className="mb-0">
						{Liferay.Language.get(itemData.lastName)}
					</span>
				</div>

				<div className="align-items-center">
					<span className="mb-0 mr-1">
						{itemData.activitiesCount}
					</span>

					<span className="mb-0">
						{Liferay.Language.get('actions')}
					</span>
				</div>

				<p className="email-text mb-0 text-secondary">
					{Liferay.Language.get(itemData.emailAddress)}
				</p>
			</div>
		</div>
	);
}

const MostActiveVisitors = ({
	namespace,
}: {
	namespace: string;
}) => {
	const elementRef = useRef(null);

	const {isLoading, response} = useAnalyticsQuery({
		element: elementRef.current,
		query: MostActiveVisitorsQuery,
		variables: {
			channelId: "808122315193619922",
			entityType: "INDIVIDUAL",
			keywords: "",
			rangeEnd: null,
			rangeKey: 7,
			rangeStart: null,
			page: 1,
			size: 20
		}
	});

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
							component: VisitorSticker,
							name: 'visitorSticker',
							type: 'internal',
						},
					],
				}}
				id={namespace}
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
