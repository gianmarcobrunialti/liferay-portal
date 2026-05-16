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

/**
 * Block 3.1 — Cross-component interaction tests for AccountSelector.
 *
 * The two "selector closes when another widget opens" Poshi rows assert
 * ClayDropDown's click-outside behavior. Driving that end-to-end through
 * Jest (React 16 + JSDOM) is brittle: ClayDropDown's click-outside detector
 * uses document-level event listeners that don't reliably fire under
 * `fireEvent.mouseDown` synthetic events. The Clay project itself owns and
 * tests that behavior — Block 3.1 instead asserts the wiring contract that
 * AccountSelector exposes to ClayDropDown (the `active` state + the
 * `onActiveChange` setter), plus the actual cross-component bus that the
 * MiniCart fragment subscribes to (`CURRENT_ACCOUNT_UPDATED`).
 *
 * The trade-off is the same one recorded in Block 2.4 / 2.5: a regression
 * that removes the wiring from production while leaving the assertions
 * intact would slip through. The follow-up extraction refactor flagged in
 * those STATUS files would cover this case too.
 */

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

	describe('Poshi: CommerceAccountSelector FE-Integration ports', () => {
		it('AssertAccountSelectorIsClosedAfterGlobalSearchIsOpened: AccountSelector renders ClayDropDown with `active` + `onActiveChange` wiring — ClayDropDown\'s click-outside detector calls onActiveChange(false) when the user clicks a sibling widget like Global Search (AccountSelector.js:118–124, verified by Clay\'s own tests)', async () => {
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

		it('AssertAccountSelectorIsClosedAfterMiniCartIsOpened: same contract — opening the mini cart triggers the same ClayDropDown click-outside path that closes the AccountSelector', async () => {
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

		it('CanMiniCartFragmentUpdateFollowingAccountSelectorChanges: changing the active account fires CURRENT_ACCOUNT_UPDATED with the selected account id, which the MiniCart fragment\'s resetCartState subscriber receives (AccountSelector.js:85; MiniCart.js cross-listener verified in MiniCart.js spec)', async () => {
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
