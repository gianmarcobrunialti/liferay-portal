/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

export function mockAccount(overrides = {}) {
	return {
		emailAddresses: ['account@example.com'],
		id: 42332,
		logoURL: '/test-logo/test.jpg',
		name: 'Sample Account',
		type: 'business',
		...overrides,
	};
}

export function mockOrder(overrides = {}) {
	return {
		accountId: 42332,
		id: 34234,
		orderId: 34234,
		workflowStatusInfo: {
			code: 0,
			label: 'open',
			label_i18n: 'Open',
		},
		...overrides,
	};
}

export function mockCurrentUserWithCreate(overrides = {}) {
	return {
		actions: {create: {href: '/o/headless-commerce-delivery-catalog/v1.0/channels/1/accounts', method: 'POST'}},
		id: 1001,
		...overrides,
	};
}

export function mockCurrentUserWithoutCreate(overrides = {}) {
	return {
		actions: {},
		id: 1001,
		...overrides,
	};
}

export function mockAccountList(count = 3) {
	return Array.from({length: count}, (_, i) =>
		mockAccount({
			id: 100 + i,
			name: `Account ${i + 1}`,
		})
	);
}

export function mockAccountSelectorOrders(count = 3) {
	return Array.from({length: count}, (_, i) =>
		mockOrder({
			id: 200 + i,
			orderId: 200 + i,
		})
	);
}

export function mockInFlowAccountFormData(overrides = {}) {
	return {
		description: '',
		externalReferenceCode: '',
		name: 'New In-Flow Account',
		organizations: [],
		taxId: '',
		type: 'business',
		...overrides,
	};
}
