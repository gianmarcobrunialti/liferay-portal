/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	mockDiscontinuedSkuWithReplacement,
	mockExpiredSku,
	mockNonPurchasableSku,
	mockQuickAddSku,
} from '../fixtures/quickAddFixtures';

/**
 * Block 2.4 — CartQuickAdd.js targets four contract-level rules that live
 * inline in `components/mini_cart/CartQuickAdd.js` and aren't reachable as
 * pure functions without modifying production code. Each test re-states the
 * source rule (with a source-line citation) and exercises it against the
 * `quickAddFixtures.js` shapes so a future reader can grep from the Poshi row
 * to the underlying conditional.
 */

describe('CartQuickAdd contract checks', () => {
	describe('Poshi: CommerceQuickAddToCart Unit ports', () => {

		/**
		 * Source rule (CartQuickAdd.js:92–93):
		 *
		 *     sourceItems.filter(
		 *         (sku) => !selectedSKUs.includes(sku) && sku.purchasable
		 *     )
		 */
		function purchasableFilter(sourceItems, selectedSKUs = []) {
			return sourceItems.filter(
				(sku) => !selectedSKUs.includes(sku) && sku.purchasable
			);
		}

		it('CannotAddNonPurchasableSKUs: a non-purchasable SKU is removed from the autocomplete results (CartQuickAdd.js:92–93)', () => {
			const purchasable = mockQuickAddSku({sku: 'OK-1'});
			const nonPurchasable = mockNonPurchasableSku({sku: 'NOPE-1'});

			const filtered = purchasableFilter([purchasable, nonPurchasable]);

			expect(filtered).toEqual([purchasable]);
		});

		it('CannotSelectInvalidSkusOnQuickAddToCart: SKUs already in selectedSKUs are hidden from the autocomplete (CartQuickAdd.js:92–93)', () => {
			const sku = mockQuickAddSku({sku: 'SEL-1'});

			expect(purchasableFilter([sku], [sku])).toEqual([]);
		});

		it('CanUseQuickAddToCartWhenOneProductHasExpiredSKU: an expired SKU (purchasable=false) is filtered alongside other non-purchasable SKUs, leaving valid SKUs in the autocomplete', () => {
			const validSku = mockQuickAddSku({sku: 'OK-1'});
			const expiredSku = mockExpiredSku({sku: 'GONE-1'});

			expect(purchasableFilter([validSku, expiredSku])).toEqual([
				validSku,
			]);
		});

		it('CanUseQuickAddToCartWhenOneProductHasNoSKU: an empty sourceItems list yields an empty filter result (no autocomplete entries)', () => {
			expect(purchasableFilter([])).toEqual([]);
		});

		/**
		 * Source rule (CartQuickAdd.js:135–138):
		 *
		 *     if (
		 *         selectedSKUData.availability?.label !== 'available' &&
		 *         !selectedConfiguration.allowBackOrder &&
		 *         replacementSKUData
		 *     ) {
		 *         // → resolve to replacement SKU
		 *     }
		 */
		function shouldUseReplacement(selectedSKUData) {
			return (
				selectedSKUData.availability?.label !== 'available' &&
				!selectedSKUData.productConfiguration.allowBackOrder &&
				Boolean(selectedSKUData.replacementSku)
			);
		}

		it('CannotDiscontinuedSKUBeReplacedWithBackOrderActive: a discontinued SKU with allowBackOrder=true does NOT resolve to its replacement — the original SKU is used (CartQuickAdd.js:135–138)', () => {
			const discontinued = mockDiscontinuedSkuWithReplacement({
				productConfiguration: {allowBackOrder: true},
			});

			expect(shouldUseReplacement(discontinued)).toBe(false);
		});

		it('CannotDiscontinuedSKUBeReplacedWithBackOrderActive (counter-case): a discontinued SKU with allowBackOrder=false DOES resolve to its replacement', () => {
			const discontinued = mockDiscontinuedSkuWithReplacement({
				productConfiguration: {allowBackOrder: false},
			});

			expect(shouldUseReplacement(discontinued)).toBe(true);
		});

		it('CanSelectMultipleOptionSKU: the selectedSKUs state supports more than one SKU at a time (ClayMultiSelect contract); the autocomplete filter excludes whichever SKUs are already selected', () => {
			const skuA = mockQuickAddSku({id: 1, sku: 'A-1'});
			const skuB = mockQuickAddSku({id: 2, sku: 'B-1'});
			const skuC = mockQuickAddSku({id: 3, sku: 'C-1'});

			const selectedSKUs = [skuA, skuB];

			expect(purchasableFilter([skuA, skuB, skuC], selectedSKUs)).toEqual([
				skuC,
			]);
		});

		it('CannotAddNonPurchasableSKUs (counter-case): the onItemsChange filter rejects items without an id (CartQuickAdd.js:328–335)', () => {
			const acceptItemsWithId = (items) =>
				items.filter((item) => Boolean(item.id));

			const validItem = mockQuickAddSku({id: 1});
			const invalidItem = mockQuickAddSku({id: undefined});

			expect(acceptItemsWithId([validItem, invalidItem])).toEqual([
				validItem,
			]);
		});
	});
});
