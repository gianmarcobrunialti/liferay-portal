/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

function injectPlaceholder(list, callback, placeholder = 'country') {
	const callbackList = [];

	callbackList.push(
		placeholder === 'country'
			? {
				countryId: '0',
				nameCurrentValue: `- ${Liferay.Language.get('select-country')}`
			}
			: {
				regionId: '0',
				name: `- ${Liferay.Language.get('select-region')}`,
				nameCurrentValue: `- ${Liferay.Language.get('select-region')}`
			}
	)

	list.forEach((listElement) => {
		callbackList.push(listElement);
	});

	callback(callbackList);
}

export default ({
	commerceChannelId,
	commerceCountrySelectionMethodName,
	countryId,
	namespace,
	regionId,
}) => {
	Liferay.component(
		`${namespace}countrySelects`,
		new Liferay.DynamicSelect([
			{
				select: `${namespace}countryId`,
				selectData: (callback) => {
					Liferay.Service(
						`/commerce.commercecountrymanagerimpl/${commerceCountrySelectionMethodName}-by-channel-id`,
						{
							channelId: commerceChannelId,
							end: -1,
							start: -1,
						},
						(list) => injectPlaceholder(list, callback)
					);
				},
				selectDesc: 'nameCurrentValue',
				selectId: 'countryId',
				selectNullable: false,
				selectSort: 'true',
				selectVal: countryId,
			},
			{
				select: `${namespace}regionId`,
				selectData: (callback, selectKey) => {
					Liferay.Service(
						'/region/get-regions',
						{
							active: true,
							countryId: Number(selectKey),
						},
						(list) => injectPlaceholder(list, callback, 'region')
					);
				},
				selectDesc: 'name',
				selectId: 'regionId',
				selectNullable: false,
				selectVal: regionId,
			},
		])
	);
}
