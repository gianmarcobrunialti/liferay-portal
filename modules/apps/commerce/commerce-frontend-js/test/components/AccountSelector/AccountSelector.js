/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '../../tests_utilities/polyfills';

import '@testing-library/jest-dom';
import {act, cleanup, fireEvent, render, waitFor} from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';

import ServiceProvider from '../../../src/main/resources/META-INF/resources/ServiceProvider/index';
import AccountSelector from '../../../src/main/resources/META-INF/resources/components/account_selector/AccountSelector';
import {
	accountTemplate,
	getAccounts,
} from '../../tests_utilities/fake_data/accounts';
import {getOrders} from '../../tests_utilities/fake_data/orders';

const ACCOUNTS_HEADLESS_API_ENDPOINT =
	ServiceProvider.DeliveryCatalogAPI('v1').baseURL(24324);

const COMMERCE_DELIVERY_CATALOG_HEADLESS_API_ENDPOINT =
	'/headless-commerce-delivery-catalog/v1.0/channels/24324/accounts';

describe('AccountSelector', () => {
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
			ACCOUNTS_HEADLESS_API_ENDPOINT
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

	afterAll(() => {
		global.window.Liferay = {...originalLiferayObject};
	});

	afterEach(() => {
		fetchMock.restore();

		cleanup();
	});

	describe('When no account is selected', () => {
		let renderedComponent;

		beforeEach(() => {
			renderedComponent = render(
				<AccountSelector
					createNewOrderURL="/order-link"
					selectOrderURL="/test-url/{id}"
					setCurrentAccountURL="/account-selector/setCurrentAccounts"
				/>
			);
		});

		afterEach(() => {
			cleanup();
		});

		it('must display the accounts search autocomplete component"', () => {
			expect(
				renderedComponent.getByPlaceholderText(/search/)
			).toBeInTheDocument();
		});

		it('must display a placeholder if no account is selected"', () => {
			expect(
				renderedComponent.getByText('select-account-and-order')
			).toBeInTheDocument();
		});

		it('displays an account list', async () => {
			await act(async () => {
				fireEvent.click(
					renderedComponent.baseElement.querySelector(
						'.btn-account-selector'
					)
				);
			});

			await waitFor(() =>
				expect(
					renderedComponent.queryByText(/loading/i)
				).not.toBeInTheDocument()
			);

			const accountsList =
				renderedComponent.baseElement.querySelectorAll(
					'.accounts-list li'
				);

			const accountsListItem = accountsList[0];

			expect(accountsList.length).toBe(11);

			expect(accountsListItem.querySelector('img').src).toContain(
				'/test-logo-folder/test.jpg'
			);
		});

		it('must update the remote selected account when an account item is clicked', async () => {
			await act(async () => {
				fireEvent.click(
					renderedComponent.baseElement.querySelector(
						'.btn-account-selector'
					)
				);
			});

			await waitFor(() =>
				expect(
					renderedComponent.queryByText(/loading/i)
				).not.toBeInTheDocument()
			);

			const accountsListItem =
				renderedComponent.baseElement.querySelectorAll(
					'.accounts-list li'
				)[0];

			fetchMock.post(
				new RegExp('account-selector/setCurrentAccounts'),
				(url, params) => {
					expect(params.body.get('accountId')).toEqual(
						accountTemplate.id.toString()
					);

					expect(url.searchParams.get('groupId')).toBeTruthy();

					return 200;
				}
			);

			await act(async () => {
				fireEvent.click(accountsListItem.querySelector('button'));
			});
		});
	});

	describe('When account is selected', () => {
		let renderedComponent;

		beforeEach(() => {
			renderedComponent = render(
				<AccountSelector
					createNewOrderURL="/order-link"
					currentCommerceAccount={{
						id: 42332,
						name: 'My Account Name',
					}}
					selectOrderURL="/test-url/{id}"
					setCurrentAccountURL="/account-selector/setCurrentAccounts"
				/>
			);
		});

		afterEach(() => {
			cleanup();
		});

		it('must display the orders search autocomplete component"', async () => {
			await act(async () => {
				fireEvent.click(
					renderedComponent.baseElement.querySelector(
						'.btn-account-selector'
					)
				);
			});

			expect(
				renderedComponent.getByPlaceholderText(/search-order/)
			).toBeInTheDocument();
		});

		it('must display the account name', () => {
			const currentAccountName =
				renderedComponent.container.querySelector(
					'.btn-account-selector .account-name .text-truncate'
				).innerHTML;
			expect(currentAccountName).toBe('My Account Name');
		});

		it('must display an order placeholder"', () => {
			const orderPlaceholder =
				renderedComponent.getByText(/no-order-selected/i);
			expect(orderPlaceholder).toBeInTheDocument();
		});

		it('displays an order list', async () => {
			await act(async () => {
				fireEvent.click(
					renderedComponent.baseElement.querySelector(
						'.btn-account-selector'
					)
				);
			});

			await waitFor(() =>
				expect(
					renderedComponent.queryByText(/loading/i)
				).not.toBeInTheDocument()
			);

			const orders = renderedComponent.baseElement.querySelectorAll(
				'.orders-table tbody tr'
			);

			expect(orders.length).toBe(10);
		});
	});

	describe('When account and order are selected', () => {
		let renderedComponent;

		beforeEach(() => {
			renderedComponent = render(
				<AccountSelector
					createNewOrderURL="/order-link"
					currentCommerceAccount={{
						id: 42332,
						name: 'My Account Name',
					}}
					currentCommerceOrder={{
						orderId: 34234,
						workflowStatusInfo: {
							label_i18n: 'Completed',
						},
					}}
					selectOrderURL="/test-url/{id}"
					setCurrentAccountURL="/account-selector/setCurrentAccounts"
				/>
			);
		});

		it('displays the current account name, order ID and order status localized label', () => {
			const button = renderedComponent.container.querySelector(
				'.btn-account-selector'
			);
			const currentAccountName = button.querySelector(
				'.account-name .text-truncate'
			).innerHTML;
			const currentOrderId = button.querySelector('.order-id').innerHTML;
			const currentOrderLabel = button.querySelector(
				'.order-label .label'
			).innerHTML;

			expect(currentAccountName).toBe('My Account Name');
			expect(currentOrderId).toBe('34234');
			expect(currentOrderLabel).toBe('Completed');
		});
	});

	describe('When account and order are selected and order view is hidden', () => {
		it('displays the current account name, order ID and order status localized label, but the orders list and button to change view are hidden', () => {
			const renderedComponent = render(
				<AccountSelector
					createNewOrderURL="/order-link"
					currentCommerceAccount={{
						id: 42332,
						name: 'My Account Name',
					}}
					currentCommerceOrder={{
						orderId: 34234,
						workflowStatusInfo: {
							label_i18n: 'Completed',
						},
					}}
					orderSelectionDisabled={true}
					selectOrderURL="/test-url/{id}"
					setCurrentAccountURL="/account-selector/setCurrentAccounts"
				/>
			);

			const button = renderedComponent.container.querySelector(
				'.btn-account-selector'
			);
			const changeViewButton =
				renderedComponent.container.querySelectorAll(
					'.lexicon-icon-angle-right-small'
				);
			const currentAccountName = button.querySelector(
				'.account-name .text-truncate'
			).innerHTML;
			const currentOrderId = button.querySelector('.order-id').innerHTML;
			const currentOrderLabel = button.querySelector(
				'.order-label .label'
			).innerHTML;

			expect(changeViewButton.length).toBe(0);
			expect(currentAccountName).toBe('My Account Name');
			expect(currentOrderId).toBe('34234');
			expect(currentOrderLabel).toBe('Completed');

			expect(
				renderedComponent.baseElement.querySelector(
					'.orders-list-container'
				)
			).not.toBeInTheDocument();
		});

		it('displays the current account name, order ID and order status localized label, the orders list and button to change view', () => {
			const renderedComponent = render(
				<AccountSelector
					createNewOrderURL="/order-link"
					currentCommerceAccount={{
						id: 42332,
						name: 'My Account Name',
					}}
					currentCommerceOrder={{
						orderId: 34234,
						workflowStatusInfo: {
							label_i18n: 'Completed',
						},
					}}
					orderSelectionDisabled={false}
					selectOrderURL="/test-url/{id}"
					setCurrentAccountURL="/account-selector/setCurrentAccounts"
				/>
			);

			const button = renderedComponent.container.querySelector(
				'.btn-account-selector'
			);
			const changeViewButton =
				renderedComponent.container.querySelectorAll(
					'.lexicon-icon-angle-left-small'
				);
			const currentAccountName = button.querySelector(
				'.account-name .text-truncate'
			).innerHTML;
			const currentOrderId = button.querySelector('.order-id').innerHTML;
			const currentOrderLabel = button.querySelector(
				'.order-label .label'
			).innerHTML;

			expect(changeViewButton.length).toBe(0);
			expect(currentAccountName).toBe('My Account Name');
			expect(currentOrderId).toBe('34234');
			expect(currentOrderLabel).toBe('Completed');

			expect(
				renderedComponent.baseElement.querySelector(
					'.orders-list-container'
				)
			).toBeInTheDocument();
		});
	});

	describe('Poshi: CommerceAccountSelector Unit ports', () => {
		it('ViewAccountSelectorDropdownAccountsList: opening the selector renders the list of available accounts (per the channel API response)', async () => {
			const renderedComponent = render(
				<AccountSelector
					createNewOrderURL="/order-link"
					selectOrderURL="/test-url/{id}"
					setCurrentAccountURL="/account-selector/setCurrentAccounts"
				/>
			);

			await act(async () => {
				fireEvent.click(
					renderedComponent.baseElement.querySelector(
						'.btn-account-selector'
					)
				);
			});

			await waitFor(() =>
				expect(
					renderedComponent.queryByText(/loading/i)
				).not.toBeInTheDocument()
			);

			const accountsList =
				renderedComponent.baseElement.querySelectorAll(
					'.accounts-list li'
				);

			expect(accountsList.length).toBeGreaterThan(0);
		});

		it('ChangeActiveAccountFromAccountsList: clicking an account in the dropdown POSTs to setCurrentAccountURL with the corresponding accountId', async () => {
			const renderedComponent = render(
				<AccountSelector
					createNewOrderURL="/order-link"
					selectOrderURL="/test-url/{id}"
					setCurrentAccountURL="/account-selector/setCurrentAccounts"
				/>
			);

			await act(async () => {
				fireEvent.click(
					renderedComponent.baseElement.querySelector(
						'.btn-account-selector'
					)
				);
			});

			await waitFor(() =>
				expect(
					renderedComponent.queryByText(/loading/i)
				).not.toBeInTheDocument()
			);

			const accountsListItem =
				renderedComponent.baseElement.querySelectorAll(
					'.accounts-list li'
				)[0];

			let postedAccountId = null;

			fetchMock.post(
				new RegExp('account-selector/setCurrentAccounts'),
				(url, params) => {
					postedAccountId = params.body.get('accountId');

					return 200;
				}
			);

			await act(async () => {
				fireEvent.click(accountsListItem.querySelector('button'));
			});

			expect(postedAccountId).toEqual(accountTemplate.id.toString());
		});

		it('SearchForAnAccountAndSelectItAsActive: the dropdown exposes an autocomplete input rooted at the placeholder "Search"', async () => {
			const renderedComponent = render(
				<AccountSelector
					createNewOrderURL="/order-link"
					selectOrderURL="/test-url/{id}"
					setCurrentAccountURL="/account-selector/setCurrentAccounts"
				/>
			);

			await act(async () => {
				fireEvent.click(
					renderedComponent.baseElement.querySelector(
						'.btn-account-selector'
					)
				);
			});

			expect(
				renderedComponent.getByPlaceholderText(/search/)
			).toBeInTheDocument();
		});

		it('SearchForAnOrderAndSelectItAsActive: with an account selected, the orders dropdown surfaces an order-search autocomplete', async () => {
			const renderedComponent = render(
				<AccountSelector
					createNewOrderURL="/order-link"
					currentCommerceAccount={{
						id: 42332,
						name: 'My Account Name',
					}}
					selectOrderURL="/test-url/{id}"
					setCurrentAccountURL="/account-selector/setCurrentAccounts"
				/>
			);

			await act(async () => {
				fireEvent.click(
					renderedComponent.baseElement.querySelector(
						'.btn-account-selector'
					)
				);
			});

			expect(
				renderedComponent.getByPlaceholderText(/search-order/)
			).toBeInTheDocument();
		});

		it('CanSearchForAnInFlowAccountAndSelectItAsActive: searching for an account and clicking the result POSTs to setCurrentAccountURL — the "select-as-active" half of the in-flow flow is covered by the account-list click path', async () => {
			const renderedComponent = render(
				<AccountSelector
					createNewOrderURL="/order-link"
					selectOrderURL="/test-url/{id}"
					setCurrentAccountURL="/account-selector/setCurrentAccounts"
				/>
			);

			await act(async () => {
				fireEvent.click(
					renderedComponent.baseElement.querySelector(
						'.btn-account-selector'
					)
				);
			});

			await waitFor(() =>
				expect(
					renderedComponent.queryByText(/loading/i)
				).not.toBeInTheDocument()
			);

			let postedAccountId = null;

			fetchMock.post(
				new RegExp('account-selector/setCurrentAccounts'),
				(url, params) => {
					postedAccountId = params.body.get('accountId');

					return 200;
				}
			);

			const firstAccount =
				renderedComponent.baseElement.querySelectorAll(
					'.accounts-list li'
				)[0];

			await act(async () => {
				fireEvent.click(firstAccount.querySelector('button'));
			});

			expect(postedAccountId).toEqual(accountTemplate.id.toString());
		});

		it('CannotCreateAccountInFlowWithoutPermissions: when the channel API response carries no `actions.create`, the dropdown does NOT render the "Create new account" button (AccountsListView.js:133)', async () => {
			const renderedComponent = render(
				<AccountSelector
					createNewOrderURL="/order-link"
					selectOrderURL="/test-url/{id}"
					setCurrentAccountURL="/account-selector/setCurrentAccounts"
				/>
			);

			await act(async () => {
				fireEvent.click(
					renderedComponent.baseElement.querySelector(
						'.btn-account-selector'
					)
				);
			});

			await waitFor(() =>
				expect(
					renderedComponent.queryByText(/loading/i)
				).not.toBeInTheDocument()
			);

			expect(
				renderedComponent.queryByText(/create-new-account/i)
			).not.toBeInTheDocument();
		});
	});
});
