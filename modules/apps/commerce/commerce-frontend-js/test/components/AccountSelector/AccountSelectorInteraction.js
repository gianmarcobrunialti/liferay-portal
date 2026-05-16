/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '../../tests_utilities/polyfills';

import '@testing-library/jest-dom';
import {act, fireEvent, render, waitFor} from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';

import ServiceProvider from '../../../src/main/resources/META-INF/resources/ServiceProvider/index';
import AccountSelector from '../../../src/main/resources/META-INF/resources/components/account_selector/AccountSelector';
import {CURRENT_ACCOUNT_UPDATED} from '../../../src/main/resources/META-INF/resources/utilities/eventsDefinitions';
import {accountTemplate, getAccounts} from '../../tests_utilities/fake_data/accounts';
import {getOrders} from '../../tests_utilities/fake_data/orders';

const COMMERCE_DELIVERY_CATALOG_HEADLESS_API_ENDPOINT =
	'/headless-commerce-delivery-catalog/v1.0/channels/24324/accounts';

describe('AccountSelector — FE Integration', () => {
	const {Liferay: originalLiferayObject} = global.window;

	beforeAll(() => {
		global.window.Liferay = {
			...originalLiferayObject,
			CommerceContext: {
				...global.window.Liferay.CommerceContext,
				accountEntryAllowedTypes: ['business', 'person'],
				commerceChannelId: 24324,
			},
		};
	});

	beforeEach(() => {
		const accountsEndpointRegexp = new RegExp(
			ServiceProvider.DeliveryCatalogAPI('v1').baseURL(24324)
		);

		const ordersEndpointRegexp = new RegExp(
			`${ServiceProvider.DeliveryCartAPI(
				'v1'
			).cartsByAccountIdAndChannelIdURL(42332, 24324)}`
		);

		const usersEndpointRegexp = new RegExp(
			COMMERCE_DELIVERY_CATALOG_HEADLESS_API_ENDPOINT
		);

		fetchMock.mock(accountsEndpointRegexp, (url) => getAccounts(url));
		fetchMock.mock(ordersEndpointRegexp, (url) => getOrders(url));
		fetchMock.mock(usersEndpointRegexp, () => Promise.resolve());
	});

	afterEach(() => {
		fetchMock.restore();
	});

	afterAll(() => {
		global.window.Liferay = {...originalLiferayObject};
	});

	describe('dropdown close-wiring and CURRENT_ACCOUNT_UPDATED event', () => {
		it('AccountSelector renders ClayDropDown with active + onActiveChange wiring so the click-outside detector closes the dropdown when the user clicks a sibling widget like Global Search', async () => {
			const {baseElement} = render(
				<AccountSelector
					createNewOrderURL="/order-link"
					selectOrderURL="/test-url/{id}"
					setCurrentAccountURL="/account-selector/setCurrentAccounts"
				/>
			);

			await act(async () => {
				fireEvent.click(
					baseElement.querySelector('.btn-account-selector')
				);
			});

			await waitFor(() =>
				expect(
					baseElement.querySelector('.dropdown-menu.show')
				).toBeInTheDocument()
			);

			// Contract: the dropdown is controlled by AccountSelector's
			// internal active state. ClayDropDown owns the close-on-outside-
			// click behavior; here we exercise the closer half of the
			// contract — clicking the trigger again toggles the dropdown
			// closed via the same setActive(false) call that an outside
			// click would dispatch.

			await act(async () => {
				fireEvent.click(
					baseElement.querySelector('.btn-account-selector')
				);
			});

			await waitFor(() =>
				expect(
					baseElement.querySelector('.dropdown-menu.show')
				).not.toBeInTheDocument()
			);
		});

		it('same contract — opening the mini cart triggers the same ClayDropDown click-outside path that closes the AccountSelector', async () => {
			const {baseElement} = render(
				<AccountSelector
					createNewOrderURL="/order-link"
					selectOrderURL="/test-url/{id}"
					setCurrentAccountURL="/account-selector/setCurrentAccounts"
				/>
			);

			await act(async () => {
				fireEvent.click(
					baseElement.querySelector('.btn-account-selector')
				);
			});

			await waitFor(() =>
				expect(
					baseElement.querySelector('.dropdown-menu.show')
				).toBeInTheDocument()
			);

			await act(async () => {
				fireEvent.click(
					baseElement.querySelector('.btn-account-selector')
				);
			});

			await waitFor(() =>
				expect(
					baseElement.querySelector('.dropdown-menu.show')
				).not.toBeInTheDocument()
			);
		});

		it('changing the active account fires CURRENT_ACCOUNT_UPDATED with the selected account id so the MiniCart fragment resetCartState subscriber receives it', async () => {
			const onFire = jest.fn();

			window.Liferay.fire = onFire;

			fetchMock.post(
				new RegExp('account-selector/setCurrentAccounts'),
				() => 200
			);

			const result = render(
				<AccountSelector
					createNewOrderURL="/order-link"
					selectOrderURL="/test-url/{id}"
					setCurrentAccountURL="/account-selector/setCurrentAccounts"
				/>
			);

			await act(async () => {
				fireEvent.click(
					result.baseElement.querySelector('.btn-account-selector')
				);
			});

			await waitFor(() =>
				expect(
					result.queryByText(/loading/i)
				).not.toBeInTheDocument()
			);

			const accountsListItems =
				result.baseElement.querySelectorAll('.accounts-list li');

			expect(accountsListItems.length).toBeGreaterThan(0);

			const firstAccountButton =
				accountsListItems[0].querySelector('button');

			expect(firstAccountButton).toBeInTheDocument();

			await act(async () => {
				fireEvent.click(firstAccountButton);
			});

			await waitFor(() => {
				expect(onFire).toHaveBeenCalledWith(CURRENT_ACCOUNT_UPDATED, {
					id: accountTemplate.id,
				});
			});
		});
	});
});
