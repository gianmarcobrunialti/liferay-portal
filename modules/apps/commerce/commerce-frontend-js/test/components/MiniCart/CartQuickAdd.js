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

describe('CartQuickAdd contract checks', () => {
	describe('purchasable filter, multi-select, and replacement-SKU contract', () => {

		function purchasableFilter(sourceItems, selectedSKUs = []) {
			return sourceItems.filter(
				(sku) => !selectedSKUs.includes(sku) && sku.purchasable
			);
		}

		it('a non-purchasable SKU is removed from the autocomplete results', () => {
			const purchasable = mockQuickAddSku({sku: 'OK-1'});
			const nonPurchasable = mockNonPurchasableSku({sku: 'NOPE-1'});

			const filtered = purchasableFilter([purchasable, nonPurchasable]);

			expect(filtered).toEqual([purchasable]);
		});

		it('SKUs already in selectedSKUs are hidden from the autocomplete', () => {
			const sku = mockQuickAddSku({sku: 'SEL-1'});

			expect(purchasableFilter([sku], [sku])).toEqual([]);
		});

		it('an expired SKU (purchasable=false) is filtered alongside other non-purchasable SKUs, leaving valid SKUs in the autocomplete', () => {
			const validSku = mockQuickAddSku({sku: 'OK-1'});
			const expiredSku = mockExpiredSku({sku: 'GONE-1'});

			expect(purchasableFilter([validSku, expiredSku])).toEqual([
				validSku,
			]);
		});

		it('an empty sourceItems list yields an empty filter result (no autocomplete entries)', () => {
			expect(purchasableFilter([])).toEqual([]);
		});

		function shouldUseReplacement(selectedSKUData) {
			return (
				selectedSKUData.availability?.label !== 'available' &&
				!selectedSKUData.productConfiguration.allowBackOrder &&
				Boolean(selectedSKUData.replacementSku)
			);
		}

		it('a discontinued SKU with allowBackOrder=true does NOT resolve to its replacement — the original SKU is used', () => {
			const discontinued = mockDiscontinuedSkuWithReplacement({
				productConfiguration: {allowBackOrder: true},
			});

			expect(shouldUseReplacement(discontinued)).toBe(false);
		});

		it('a discontinued SKU with allowBackOrder=false DOES resolve to its replacement', () => {
			const discontinued = mockDiscontinuedSkuWithReplacement({
				productConfiguration: {allowBackOrder: false},
			});

			expect(shouldUseReplacement(discontinued)).toBe(true);
		});

		it('the selectedSKUs state supports more than one SKU at a time (ClayMultiSelect contract); the autocomplete filter excludes whichever SKUs are already selected', () => {
			const skuA = mockQuickAddSku({id: 1, sku: 'A-1'});
			const skuB = mockQuickAddSku({id: 2, sku: 'B-1'});
			const skuC = mockQuickAddSku({id: 3, sku: 'C-1'});

			const selectedSKUs = [skuA, skuB];

			expect(purchasableFilter([skuA, skuB, skuC], selectedSKUs)).toEqual([
				skuC,
			]);
		});

		it('the onItemsChange filter rejects items without an id', () => {
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
