/**
 * SPDX-FileCopyrightText: (c) 2024 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayButton from '@clayui/button';
import DropDown from '@clayui/drop-down';
import {openToast} from 'frontend-js-web';
import React, {useCallback, useEffect, useState} from 'react';

import ServiceProvider from '../../ServiceProvider';
import {confirmCurrencyChange} from '../../utilities/modals/confirmCurrencyChange';
import {retrieveCommerceCurrency, storeCommerceCurrency} from './util';

const DeliveryCatalogResource = ServiceProvider.DeliveryCatalogAPI('v1');

function CurrencySelector({
	commerceChannelId,
	commerceOrderDetailBaseURL: orderDetailURL,
	commerceOrderId,
	commerceOrderTypes: orderTypes,
}) {
	const [activeOrderId] = useState(parseInt(commerceOrderId, 10));
	const [availableCurrencies, setAvailableCurrencies] = useState(null);
	const [selectedCurrency, setSelectedCurrency] = useState(null);

	const setCurrencyCookie = useCallback(() => {
		const currentCommerceCurrencyCode = retrieveCommerceCurrency();

		if (!currentCommerceCurrencyCode) {
			storeCommerceCurrency(selectedCurrency.code);

			return;
		}

		const hasCurrencyChanged =
			currentCommerceCurrencyCode !== selectedCurrency.code;

		if (hasCurrencyChanged && activeOrderId) {
			const {accountId} = Liferay.CommerceContext.account;

			confirmCurrencyChange({
				accountId,
				commerceChannelId,
				currencyCode: selectedCurrency.code,
				onCancel: () =>
					setSelectedCurrency(
						availableCurrencies.find(
							({code}) => code === currentCommerceCurrencyCode
						)
					),
				onCreate: () => storeCommerceCurrency(selectedCurrency.code),
				orderDetailURL,
				orderTypes,
			});
		}
		else if (hasCurrencyChanged && !activeOrderId) {
			storeCommerceCurrency(selectedCurrency.code);

			window.location.reload();
		}
	}, [activeOrderId, selectedCurrency]);

	useEffect(() => {
		if (availableCurrencies === null) {
			DeliveryCatalogResource.getCurrenciesByChannelId(commerceChannelId)
				.then(({items: currencies}) => {
					if (currencies.length) {
						setAvailableCurrencies(currencies);

						const currencyCode =
							retrieveCommerceCurrency() ??
							Liferay.CommerceContext.currency.currencyCode;

						setSelectedCurrency(
							currencies.find(({code}) => code === currencyCode)
						);
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
					{(currency) =>
						currency.active ? (
							<DropDown.Item
								active={currency.id === selectedCurrency.id}
								key={currency.id}
								onClick={() => setSelectedCurrency(currency)}
							>
								{currency.symbol} {currency.code}
							</DropDown.Item>
						) : null
					}
				</DropDown>
			</>
		)
	);
}

export default CurrencySelector;
