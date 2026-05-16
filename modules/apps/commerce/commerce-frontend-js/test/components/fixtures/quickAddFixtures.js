/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

const BASE_PRODUCT_CONFIGURATION = {
	allowBackOrder: false,
	allowedOrderQuantities: [],
	maxOrderQuantity: 9999,
	minOrderQuantity: 1,
	multipleOrderQuantity: 1,
};

export function mockProductConfiguration(overrides = {}) {
	return {...BASE_PRODUCT_CONFIGURATION, ...overrides};
}

export function mockQuickAddSku(overrides = {}) {
	return {
		availability: {label: 'available', stockQuantity: 100},
		id: 12345,
		label: 'Sample Product',
		productConfiguration: mockProductConfiguration(
			overrides.productConfiguration
		),
		published: true,
		purchasable: true,
		sku: 'SKU-001',
		value: 'SKU-001',
		...overrides,
		productConfiguration: mockProductConfiguration(
			overrides.productConfiguration
		),
	};
}

export function mockDiscontinuedSkuWithReplacement(overrides = {}) {
	return mockQuickAddSku({
		availability: {label: 'discontinued', stockQuantity: 0},
		replacementSku: mockQuickAddSku({
			id: 99999,
			label: 'Replacement Product',
			sku: 'REPL-001',
			value: 'REPL-001',
		}),
		...overrides,
	});
}

export function mockNonPurchasableSku(overrides = {}) {
	return mockQuickAddSku({purchasable: false, ...overrides});
}

export function mockExpiredSku(overrides = {}) {
	return mockQuickAddSku({
		availability: {label: 'expired', stockQuantity: 0},
		published: false,
		purchasable: false,
		...overrides,
	});
}

export function mockCartItemForCorrectedQuantity(overrides = {}) {
	return {
		quantity: 1,
		sku: 'SKU-001',
		...overrides,
	};
}
