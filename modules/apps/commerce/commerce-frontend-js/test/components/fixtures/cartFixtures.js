/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

const ZERO_PRICE = {
	currency: 'USD',
	discount: 0,
	discountFormatted: '$ 0.00',
	discountPercentage: '0.00',
	discountPercentageLevel1: 0,
	discountPercentageLevel2: 0,
	discountPercentageLevel3: 0,
	discountPercentageLevel4: 0,
	finalPrice: 10,
	finalPriceFormatted: '$ 10.00',
	price: 10,
	priceFormatted: '$ 10.00',
	promoPrice: 10,
	promoPriceFormatted: '$ 10.00',
};

const BASE_SETTINGS = {
	maxQuantity: 9999,
	minQuantity: 1,
	multipleQuantity: 1,
};

export function mockCartItem(overrides = {}) {
	return {
		adaptiveMediaImageHTMLTag: '',
		cartItems: [],
		id: 42,
		name: 'Sample Product',
		options: '[]',
		price: {...ZERO_PRICE},
		productId: 100,
		productURLs: {en_US: 'sample-product'},
		quantity: 1,
		settings: {...BASE_SETTINGS},
		sku: 'SAMPLE-001',
		skuId: 200,
		thumbnail: '',
		...overrides,
		price: overrides.price
			? {...ZERO_PRICE, ...overrides.price}
			: {...ZERO_PRICE},
		settings: overrides.settings
			? {...BASE_SETTINGS, ...overrides.settings}
			: {...BASE_SETTINGS},
	};
}

export function mockCart(overrides = {}) {
	return {
		accountId: 1,
		cartItems: [],
		channel: {id: 42},
		couponCode: '',
		id: 1001,
		orderUUID: 'mock-order-uuid',
		summary: {
			currency: 'USD',
			itemsCount: 0,
			itemsQuantity: 0,
			subtotal: 0,
			subtotalFormatted: '$ 0.00',
			total: 0,
			totalFormatted: '$ 0.00',
		},
		workflowStatusInfo: {code: 0, label: 'approved'},
		...overrides,
	};
}

export function mockCartItemWithDiscount(overrides = {}) {
	return mockCartItem({
		price: {
			discount: 2,
			discountFormatted: '$ 2.00',
			discountPercentage: '20.00',
			finalPrice: 8,
			finalPriceFormatted: '$ 8.00',
			price: 10,
			priceFormatted: '$ 10.00',
			promoPrice: 8,
			promoPriceFormatted: '$ 8.00',
		},
		...overrides,
	});
}

export function mockCartItemWithDiscountLevels(overrides = {}) {
	return mockCartItem({
		price: {
			discount: 3,
			discountFormatted: '$ 3.00',
			discountPercentage: '30.00',
			discountPercentageLevel1: 10,
			discountPercentageLevel2: 10,
			discountPercentageLevel3: 5,
			discountPercentageLevel4: 5,
			finalPrice: 7,
			finalPriceFormatted: '$ 7.00',
			price: 10,
			priceFormatted: '$ 10.00',
			promoPrice: 7,
			promoPriceFormatted: '$ 7.00',
		},
		...overrides,
	});
}

export function mockCartItemWithTierPrice(overrides = {}) {
	return mockCartItem({
		price: {
			finalPrice: 6,
			finalPriceFormatted: '$ 6.00',
			price: 10,
			priceFormatted: '$ 10.00',
			promoPrice: 6,
			promoPriceFormatted: '$ 6.00',
		},
		quantity: 10,
		...overrides,
	});
}

export function mockCartItemWithBulkPrice(overrides = {}) {
	return mockCartItem({
		price: {
			finalPrice: 5,
			finalPriceFormatted: '$ 5.00',
			price: 10,
			priceFormatted: '$ 10.00',
			promoPrice: 5,
			promoPriceFormatted: '$ 5.00',
		},
		quantity: 20,
		settings: {...BASE_SETTINGS, multipleQuantity: 5},
		...overrides,
	});
}

export function mockCartItemWithPromotion(overrides = {}) {
	return mockCartItem({
		price: {
			finalPrice: 7,
			finalPriceFormatted: '$ 7.00',
			price: 10,
			priceFormatted: '$ 10.00',
			promoPrice: 7,
			promoPriceFormatted: '$ 7.00',
		},
		...overrides,
	});
}

export function mockCartWithDiscountToSubtotal(itemCount = 2) {
	const cartItems = Array.from({length: itemCount}, (_, i) =>
		mockCartItem({id: 100 + i, skuId: 200 + i, sku: `SAMPLE-${100 + i}`})
	);

	return mockCart({
		cartItems,
		summary: {
			currency: 'USD',
			itemsCount: itemCount,
			itemsQuantity: itemCount,
			subtotal: 10 * itemCount,
			subtotalDiscountPercentages: ['10.00', '0.00', '0.00', '0.00'],
			subtotalDiscountValue: 2,
			subtotalDiscountValueFormatted: '$ 2.00',
			subtotalFormatted: `$ ${(10 * itemCount).toFixed(2)}`,
			total: 10 * itemCount - 2,
			totalFormatted: `$ ${(10 * itemCount - 2).toFixed(2)}`,
		},
	});
}

export function mockCartWithDiscountToTotal(itemCount = 2) {
	const cartItems = Array.from({length: itemCount}, (_, i) =>
		mockCartItem({id: 100 + i, skuId: 200 + i, sku: `SAMPLE-${100 + i}`})
	);

	return mockCart({
		cartItems,
		summary: {
			currency: 'USD',
			itemsCount: itemCount,
			itemsQuantity: itemCount,
			subtotal: 10 * itemCount,
			subtotalFormatted: `$ ${(10 * itemCount).toFixed(2)}`,
			total: 10 * itemCount - 3,
			totalDiscountPercentages: ['0.00', '10.00', '0.00', '0.00'],
			totalDiscountValue: 3,
			totalDiscountValueFormatted: '$ 3.00',
			totalFormatted: `$ ${(10 * itemCount - 3).toFixed(2)}`,
		},
	});
}
