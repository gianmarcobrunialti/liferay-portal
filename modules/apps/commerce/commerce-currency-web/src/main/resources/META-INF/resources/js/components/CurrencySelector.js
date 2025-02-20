/**
 * SPDX-FileCopyrightText: (c) 2024 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {CURRENT_ORDER_UPDATED,} from '../../utilities/eventsDefinitions';
import ClayButton from '@clayui/button';
import DropDown from '@clayui/drop-down';
import {CommerceServiceProvider} from 'commerce-frontend-js';
import {openToast} from 'frontend-js-web';
import React, {useCallback, useEffect, useState} from 'react';
import {
	DEFAULT_ORDER_DETAILS_PORTLET_ID,
	getCommerceCurrencyCookie,
	openCurrencyConfirmationModal,
	setCommerceCurrencyCookie
} from "../util";

const DeliveryCatalogResource =
	CommerceServiceProvider.DeliveryCatalogAPI('v1');

function CurrencySelector({
	commerceChannelId,
	commerceOrderDetailBaseURL,
	commerceOrderId,
	commerceOrderTypes: orderTypes,
}) {

	const [availableCurrencies, setAvailableCurrencies] = useState(null);
	const [currentCommerceOrderId, setCurrentCommerceOrderId] = useState(commerceOrderId);
	const [selectedCurrency, setSelectedCurrency] = useState(null)

	const setCurrencyCookie = useCallback(() => {
		const currentCommerceCurrencyCode = getCommerceCurrencyCookie();

		if (!currentCommerceCurrencyCode) {
			setCommerceCurrencyCookie(selectedCurrency.code);

			return;
		}

		const hasCurrencyChanged =
			currentCommerceCurrencyCode !== selectedCurrency.code;

		if (hasCurrencyChanged && currentCommerceOrderId) {
			const {accountId} = Liferay.CommerceContext.account;

			openCurrencyConfirmationModal({
				accountId,
				commerceChannelId,
				currencyCode: selectedCurrency.code,
				hasCommerceOpenOrderContentPortlet:
					commerceOrderDetailBaseURL.includes(
						DEFAULT_ORDER_DETAILS_PORTLET_ID),
				orderDetailURL: commerceOrderDetailBaseURL,
				orderTypes,
			})
		}
		else if (hasCurrencyChanged && !currentCommerceOrderId) {
			window.location.reload();
		}
}, [currentCommerceOrderId, selectedCurrency]);

	useEffect(() => {
		if (availableCurrencies === null) {
			DeliveryCatalogResource.getCurrenciesByChannelId(commerceChannelId)
				.then(({items: currencies}) => {
					if (currencies.length) {
						setAvailableCurrencies(currencies);

						const {currencyCode} = Liferay.CommerceContext.currency;

						setSelectedCurrency(currencies.find(
							({code}) => code === currencyCode));
					}
				})
				.catch((error) => {
					openToast({
						message:
							error.message ||
							Liferay.Language.get(
								'an-unexpected-error-occurred'
							),
						type: 'danger',
					});
				});
		}

		return () => {};
	}, [availableCurrencies, commerceChannelId]);

	useEffect(() => {
		if (selectedCurrency?.id) {
			setCurrencyCookie();
		}

		return () => {};
	}, [selectedCurrency]);

	useEffect(() => {
		const onOrderChange = ({order: {currencyCode, id}}) => {
			setCurrentCommerceOrderId(id);

			setSelectedCurrency(
				availableCurrencies.find(({code}) => code === currencyCode)
			);
		}

		Liferay.on(CURRENT_ORDER_UPDATED, onOrderChange);

		return () => {
			Liferay.detach(CURRENT_ORDER_UPDATED, onOrderChange);
		};
	}, [
		availableCurrencies,
		setCurrentCommerceOrderId,
		setSelectedCurrency,
	]);

	return (
		availableCurrencies?.length && (
			<>
				<DropDown
					items={availableCurrencies}
					trigger={
						<ClayButton
							className="border-0 btn-sm"
							displayType="secondary"
						>
							{selectedCurrency.symbol} {selectedCurrency.code}
						</ClayButton>
					}
				>
					{(currency) => currency.active ? (
						<DropDown.Item
							active={currency.id === selectedCurrency.id}
							key={currency.id}
							onClick={() => setSelectedCurrency(currency)}
						>
							{currency.symbol} {currency.code}
						</DropDown.Item>
					) : null}
				</DropDown>
			</>
		)
	);
}

export default CurrencySelector;
