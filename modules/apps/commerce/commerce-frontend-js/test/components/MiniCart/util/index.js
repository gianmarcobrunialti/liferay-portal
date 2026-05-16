/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '@testing-library/jest-dom';

import {
	DEFAULT_ORDER_DETAILS_PORTLET_ID,
	ORDER_UUID_PARAMETER,
} from '../../../../src/main/resources/META-INF/resources/components/mini_cart/util/constants';
import {
	filterOptions,
	getCorrectedQuantity,
	hasErrors,
	parseOptions,
	summaryDataMapper,
} from '../../../../src/main/resources/META-INF/resources/components/mini_cart/util/index';
import {regenerateOrderDetailURL} from '../../../../src/main/resources/META-INF/resources/utilities/regenerateOrderDetailURL';
import {mockProductConfiguration} from '../../fixtures/quickAddFixtures';

jest.mock(
	'../../../../src/main/resources/META-INF/resources/ServiceProvider/index'
);

jest.mock('frontend-js-components-web', () => ({
	...jest.requireActual('frontend-js-components-web'),
	openToast: jest.fn(),
}));

describe('MiniCart tests_utilities', () => {
	describe('hasErrors', () => {
		it('returns true if at least one cart item contains error messages', () => {
			const CART_ITEMS = [
				{id: 1},
				{errorMessages: 'Error', id: 2},
				{id: 3},
			];

			expect(hasErrors(CART_ITEMS)).toBe(true);
		});

		it('returns false if no cart item contains error messages', () => {
			const CART_ITEMS = [{id: 1}, {id: 2}, {id: 3}];

			expect(hasErrors(CART_ITEMS)).toBe(false);
		});
	});

	describe('parseOptions', () => {
		it('parses and formats an array of {value} entries to a comma-separated options list string', () => {
			const PARSED_OPTIONS = [
				{key: 'package-quantity', value: '24'},
				{key: 'size', value: 'L'},
			];

			expect(parseOptions(PARSED_OPTIONS)).toEqual('24, L');
		});

		it('passes a non-array input through unchanged (graceful fall-through)', () => {
			expect(parseOptions(null)).toBeNull();
			expect(parseOptions('/fail]')).toEqual('/fail]');
		});
	});

	describe('regenerateOrderDetailURL', () => {
		const VALID_BASE_ORDER_DETAIL_PORTLET_URL = `http://localhost:3333/group/name/?p_p_id=${DEFAULT_ORDER_DETAILS_PORTLET_ID}`;
		const VALID_BASE_ORDER_DETAIL_URL = 'http://localhost:3333/group/name/';
		const VALID_ORDER_UUID = '00000-00000-22222-213jd-qwerty';

		const errorMessage = (argName) =>
			`Cannot generate a new Order Detail URL. Invalid "${argName}"`;

		it('returns a new valid Order Detail Portlet URL string', () => {
			expect(
				regenerateOrderDetailURL(
					VALID_BASE_ORDER_DETAIL_PORTLET_URL,
					12345,
					VALID_ORDER_UUID
				)
			).toEqual(
				`${VALID_BASE_ORDER_DETAIL_PORTLET_URL}&_${DEFAULT_ORDER_DETAILS_PORTLET_ID}_${ORDER_UUID_PARAMETER}=${VALID_ORDER_UUID}`
			);
		});

		it('returns a new valid Order Detail URL string', () => {
			expect(
				regenerateOrderDetailURL(
					VALID_BASE_ORDER_DETAIL_URL,
					12345,
					VALID_ORDER_UUID
				)
			).toEqual(VALID_BASE_ORDER_DETAIL_URL + 12345);
		});

		it('throws if the "orderId" string argument is empty or null', () => {
			try {
				expect(
					regenerateOrderDetailURL(
						VALID_BASE_ORDER_DETAIL_URL,
						'',
						VALID_ORDER_UUID
					)
				).toThrow();
				expect(
					regenerateOrderDetailURL(
						VALID_BASE_ORDER_DETAIL_URL,
						null,
						VALID_ORDER_UUID
					)
				).toThrow();
			}
			catch (error) {
				expect(error.message).toEqual(errorMessage`orderId`);
			}
		});

		it('throws if the "orderUUID" string argument is empty or null', () => {
			try {
				expect(
					regenerateOrderDetailURL(
						VALID_BASE_ORDER_DETAIL_PORTLET_URL,
						12345,
						''
					)
				).toThrow();

				expect(
					regenerateOrderDetailURL(
						VALID_BASE_ORDER_DETAIL_PORTLET_URL,
						12345,
						null
					)
				).toThrow();
			}
			catch (error) {
				expect(error.message).toEqual(errorMessage`orderUUID`);
			}
		});

		it('throws if the "baseOrderDetailURL" string argument is empty or null', () => {
			try {
				expect(
					regenerateOrderDetailURL('', 12345, VALID_ORDER_UUID)
				).toThrow();

				expect(
					regenerateOrderDetailURL(null, 12345, VALID_ORDER_UUID)
				).toThrow();

				expect(
					regenerateOrderDetailURL('', 12345, VALID_ORDER_UUID)
				).toThrow();

				expect(
					regenerateOrderDetailURL(null, 12345, VALID_ORDER_UUID)
				).toThrow();
			}
			catch (error) {
				expect(error.message).toEqual(errorMessage`baseOrderDetailURL`);
			}
		});
	});

	describe('summaryDataMapper', () => {
		const SUMMARY_SAMPLE = {
			currency: 'US Dollar',
			itemsQuantity: 48,
			shippingDiscountPercentages: ['0.00', '0.00', '0.00', '0.00'],
			shippingDiscountValue: 0.0,
			shippingDiscountValueFormatted: '$ 0.00',
			shippingValue: 0.0,
			shippingValueFormatted: '$ 0.00',
			shippingValueWithTaxAmount: 0.0,
			shippingValueWithTaxAmountFormatted: '$ 0.00',
			subtotal: 1858.5,
			subtotalDiscountPercentages: ['0.00', '0.00', '0.00', '0.00'],
			subtotalDiscountValue: 0.0,
			subtotalDiscountValueFormatted: '$ 0.00',
			subtotalFormatted: '$ 1,858.50',
			taxValue: 0.0,
			taxValueFormatted: '$ 0.00',
			total: 1858.5,
			totalDiscountPercentages: ['0.00', '0.00', '0.00', '0.00'],
			totalDiscountValue: 0.0,
			totalDiscountValueFormatted: '$ 0.00',
			totalFormatted: '$ 1,858.50',
		};

		it('converts a DeliveryCart API summary payload to a label/value map list for the Summary used in the MiniCart', () => {
			expect(summaryDataMapper(SUMMARY_SAMPLE)).toEqual([
				{label: 'quantity', value: 48},
				{label: 'subtotal', value: '$ 1,858.50'},
				{label: 'subtotal-discount', value: '$ 0.00'},
				{label: 'order-discount', value: '$ 0.00'},
				{label: 'total', style: 'big', value: '$ 1,858.50'},
			]);
		});

		describe('discount-to-subtotal and discount-to-total rows', () => {
			it('surfaces the subtotal discount value in the subtotal-discount row', () => {
				const rows = summaryDataMapper({
					...SUMMARY_SAMPLE,
					subtotalDiscountValue: 25.0,
					subtotalDiscountValueFormatted: '$ 25.00',
					total: 1833.5,
					totalFormatted: '$ 1,833.50',
				});

				const subtotalDiscountRow = rows.find(
					(row) => row.label === 'subtotal-discount'
				);
				const totalRow = rows.find((row) => row.label === 'total');

				expect(subtotalDiscountRow.value).toBe('$ 25.00');
				expect(totalRow.value).toBe('$ 1,833.50');
			});

			it('surfaces the order-level discount value in the order-discount row', () => {
				const rows = summaryDataMapper({
					...SUMMARY_SAMPLE,
					total: 1758.5,
					totalDiscountValue: 100.0,
					totalDiscountValueFormatted: '$ 100.00',
					totalFormatted: '$ 1,758.50',
				});

				const orderDiscountRow = rows.find(
					(row) => row.label === 'order-discount'
				);
				const totalRow = rows.find((row) => row.label === 'total');

				expect(orderDiscountRow.value).toBe('$ 100.00');
				expect(totalRow.value).toBe('$ 1,758.50');
			});
		});
	});

	describe('getCorrectedQuantity', () => {
		const SKU = 'SKU-001';

		describe('Poshi: CommerceQuickAddToCart Unit ports', () => {
			it('CannotAddSKUWithAllowedQuantitiesWhenTheyAreHigherThanMaximumQuantity: returns 0 when maxOrderQuantity is below the lowest allowed value', () => {
				const productConfiguration = mockProductConfiguration({
					allowedOrderQuantities: [10, 20, 30],
					maxOrderQuantity: 5,
				});

				expect(
					getCorrectedQuantity(productConfiguration, SKU, [])
				).toBe(0);
			});

			it('CannotAddSKUWithAllowedQuantitiesWhenTheyAreLowerThanMinimumQuantity: returns 0 when minOrderQuantity is above the highest allowed value', () => {
				const productConfiguration = mockProductConfiguration({
					allowedOrderQuantities: [1, 2, 3],
					minOrderQuantity: 5,
				});

				expect(
					getCorrectedQuantity(productConfiguration, SKU, [])
				).toBe(0);
			});

			it('CannotAddSKUWithAllowedQuantitiesWhichAreNotMultiples: returns 0 when no allowed quantity is a multiple of multipleOrderQuantity', () => {
				const productConfiguration = mockProductConfiguration({
					allowedOrderQuantities: [1, 5, 10],
					multipleOrderQuantity: 3,
				});

				expect(
					getCorrectedQuantity(productConfiguration, SKU, [])
				).toBe(0);
			});

			it('CannotAddSKUWithMultipleQuantityWhenItIsHigherThanMaximumQuantity: returns 0 when multipleOrderQuantity exceeds maxOrderQuantity', () => {
				const productConfiguration = mockProductConfiguration({
					maxOrderQuantity: 5,
					multipleOrderQuantity: 10,
				});

				expect(
					getCorrectedQuantity(productConfiguration, SKU, [])
				).toBe(0);
			});

			it('CanAddToCartProductWithPriceList: returns a positive quantity for a SKU whose configuration is unconstrained (price-list pricing does not affect quantity validation)', () => {
				const productConfiguration = mockProductConfiguration({
					maxOrderQuantity: 50,
					minOrderQuantity: 1,
					multipleOrderQuantity: 1,
				});

				expect(
					getCorrectedQuantity(productConfiguration, SKU, [])
				).toBeGreaterThan(0);
			});

			it('CanAddToCartProductWithPromotion: returns a positive quantity for an unconstrained SKU regardless of any promotional pricing applied upstream', () => {
				const productConfiguration = mockProductConfiguration({
					maxOrderQuantity: 50,
					minOrderQuantity: 1,
					multipleOrderQuantity: 1,
				});

				expect(
					getCorrectedQuantity(productConfiguration, SKU, [])
				).toBeGreaterThan(0);
			});

			it('CanUseQuickAddToCartWhenOneProductHasExpiredSKU: an expired-SKU configuration still yields a positive default quantity — purchasability filtering happens upstream of getCorrectedQuantity', () => {
				const productConfiguration = mockProductConfiguration({
					maxOrderQuantity: 50,
					minOrderQuantity: 1,
					multipleOrderQuantity: 1,
				});

				expect(
					getCorrectedQuantity(productConfiguration, SKU, [])
				).toBeGreaterThan(0);
			});

			it('CanUseQuickAddToCartWhenOneProductHasNoSKU: an empty cartItems list is a valid input — the function returns the configured min', () => {
				const productConfiguration = mockProductConfiguration({
					maxOrderQuantity: 50,
					minOrderQuantity: 1,
					multipleOrderQuantity: 1,
				});

				expect(
					getCorrectedQuantity(productConfiguration, SKU, [])
				).toBe(1);
			});
		});
	});
});
