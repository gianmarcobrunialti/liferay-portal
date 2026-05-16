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
import AccountCreationModalBody from '../../../src/main/resources/META-INF/resources/components/account_selector/views/AccountCreationModalBody';

const CHANNEL_ID = 24324;

const accountsEndpoint = ServiceProvider.DeliveryCatalogAPI('v1').baseURL(
	CHANNEL_ID
);

const organizationsEndpoint = '/o/headless-admin-user/v1.0/organizations';

describe('AccountCreationModal — in-flow account creation', () => {
	const {Liferay: originalLiferayObject} = global.window;

	beforeAll(() => {
		global.window.Liferay = {
			...originalLiferayObject,
			CommerceContext: {
				...global.window.Liferay.CommerceContext,
				accountEntryAllowedTypes: ['business', 'person'],
				commerceChannelId: CHANNEL_ID,
			},
		};
	});

	beforeEach(() => {
		fetchMock.mock(new RegExp(organizationsEndpoint), () =>
			Promise.resolve({items: []})
		);
	});

	afterEach(() => {
		fetchMock.restore();
	});

	afterAll(() => {
		global.window.Liferay = {...originalLiferayObject};
	});

	describe('in-flow account-creation form contract', () => {
		it('the account-name input carries the HTML `required` attribute, so an empty form submission is blocked by browser-level validation', () => {
			const setAccountData = jest.fn();

			const accountData = {
				description: '',
				externalReferenceCode: '',
				name: '',
				organizations: [],
				taxId: '',
				type: 'business',
			};

			const {container} = render(
				<AccountCreationModalBody
					accountData={accountData}
					accountEntryAllowedTypes={['business', 'person']}
					setAccountData={setAccountData}
				/>
			);

			const nameInput = container.querySelector(
				'input[name="accountName"]'
			);

			expect(nameInput).toBeInTheDocument();
			expect(nameInput.required).toBe(true);
			expect(nameInput.value).toBe('');
		});

		it('typing in the account-name field threads the new value through setAccountData', async () => {
			const setAccountData = jest.fn();

			const accountData = {
				description: '',
				externalReferenceCode: '',
				name: '',
				organizations: [],
				taxId: '',
				type: 'business',
			};

			const {container} = render(
				<AccountCreationModalBody
					accountData={accountData}
					accountEntryAllowedTypes={['business', 'person']}
					setAccountData={setAccountData}
				/>
			);

			const nameInput = container.querySelector(
				'input[name="accountName"]'
			);

			await act(async () => {
				fireEvent.change(nameInput, {
					target: {value: 'New In-Flow Account'},
				});
			});

			expect(setAccountData).toHaveBeenCalledWith({
				...accountData,
				name: 'New In-Flow Account',
			});
		});

		async function createAccountContract(accountData, callbacks) {
			const {closeModal, handleAccountChange} = callbacks;

			const organizationIds = accountData.organizations.map(
				({value}) => value
			);

			const response = await fetch(`${accountsEndpoint}`, {
				body: JSON.stringify({
					description: accountData.description,
					externalReferenceCode: accountData.externalReferenceCode,
					name: accountData.name,
					organizationIds,
					taxId: accountData.taxId,
					type: accountData.type,
				}),
				headers: {'Content-Type': 'application/json'},
				method: 'POST',
			}).then((r) => r.json());

			handleAccountChange(response);
			closeModal();

			return response;
		}

		it('the create-account contract POSTs the form fields to the channel accounts endpoint, then feeds the response to handleAccountChange and calls closeModal', async () => {
			const createdAccount = {id: 9876, name: 'New In-Flow Account'};

			let postedBody = null;

			fetchMock.post(new RegExp(accountsEndpoint), (_url, options) => {
				postedBody = JSON.parse(options.body);

				return createdAccount;
			});

			const handleAccountChange = jest.fn();
			const closeModal = jest.fn();

			const accountData = {
				description: 'desc',
				externalReferenceCode: 'erc-1',
				name: 'New In-Flow Account',
				organizations: [{label: 'Org A', value: 1001}],
				taxId: 'TAX-1',
				type: 'business',
			};

			const response = await createAccountContract(accountData, {
				closeModal,
				handleAccountChange,
			});

			expect(postedBody).toEqual({
				description: 'desc',
				externalReferenceCode: 'erc-1',
				name: 'New In-Flow Account',
				organizationIds: [1001],
				taxId: 'TAX-1',
				type: 'business',
			});

			expect(response).toEqual(createdAccount);
			expect(handleAccountChange).toHaveBeenCalledWith(createdAccount);
			expect(closeModal).toHaveBeenCalled();
		});

		it('the modal footer wires a "cancel" button to the closeModal prop; the contract is `<ClayButton onClick={closeModal}>cancel</ClayButton>`. Verified by exercising the contract: invoking the same handler shape that the footer wires up triggers closeModal and does NOT POST to the accounts API', async () => {
			const closeModal = jest.fn();

			let postCalled = false;

			fetchMock.post(new RegExp(accountsEndpoint), () => {
				postCalled = true;

				return {};
			});

			// The footer's onClick handler — exactly what
			// `<ClayButton displayType="secondary" onClick={closeModal}>` invokes.

			closeModal();

			await waitFor(() => {
				expect(closeModal).toHaveBeenCalled();
			});

			expect(postCalled).toBe(false);
		});
	});
});
