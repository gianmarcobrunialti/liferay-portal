/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {expect, mergeTests} from '@playwright/test';

import {apiHelpersTest} from '../../../../fixtures/apiHelpersTest';
import {commercePagesTest} from '../../../../fixtures/commercePagesTest';
import {dataApiHelpersTest} from '../../../../fixtures/dataApiHelpersTest';
import {isolatedSiteTest} from '../../../../fixtures/isolatedSiteTest';
import {loginTest} from '../../../../fixtures/loginTest';
import {pageViewModePagesTest} from '../../../../fixtures/pageViewModePagesTest';
import getRandomString from '../../../../utils/getRandomString';

export const test = mergeTests(
	apiHelpersTest,
	commercePagesTest,
	dataApiHelpersTest,
	isolatedSiteTest,
	loginTest(),
	pageViewModePagesTest
);

type TierEntry = {
	minimumQuantity: number;
	price: number;
};

type PricingScenario = {
	baseListBulkPricing?: boolean;
	baseListPrice: number;
	baseListTiers?: TierEntry[];
	expectedUnitPrice: string;
	name: string;
	promoBulkPricing?: boolean;
	promoPrice?: number;
	promoTiers?: TierEntry[];
	tag: string;
	testQuantity: number;
};

const scenarios: PricingScenario[] = [
	{
		baseListPrice: 50,
		expectedUnitPrice: '$ 30.00',
		name: 'CanCheckoutProductWithPromotionPriceLowerThenPricelist',
		promoPrice: 30,
		tag: '@COMMERCE-pricing-promo-lower',
		testQuantity: 1,
	},
	{
		baseListPrice: 24,
		expectedUnitPrice: '$ 24.00',
		name: 'CanAssertListPriceRatherThanHigherPromotionPriceAtCheckout',
		promoPrice: 40,
		tag: '@COMMERCE-10279',
		testQuantity: 3,
	},
	{
		baseListBulkPricing: true,
		baseListPrice: 50,
		baseListTiers: [{minimumQuantity: 5, price: 30}],
		expectedUnitPrice: '$ 30.00',
		name: 'CanCheckoutProductWithBulkPrice',
		tag: '@COMMERCE-10245',
		testQuantity: 5,
	},
	{
		baseListBulkPricing: true,
		baseListPrice: 50,
		baseListTiers: [
			{minimumQuantity: 5, price: 30},
			{minimumQuantity: 10, price: 20},
		],
		expectedUnitPrice: '$ 20.00',
		name: 'CanCheckoutProductWithMultipleBulkPrice',
		tag: '@COMMERCE-12402',
		testQuantity: 10,
	},
	{
		baseListPrice: 50,
		expectedUnitPrice: '$ 10.00',
		name: 'CanCheckoutProductWithBulkPriceOnlyInPromotions',
		promoBulkPricing: true,
		promoPrice: 40,
		promoTiers: [{minimumQuantity: 5, price: 10}],
		tag: '@COMMERCE-pricing-promo-bulk-only',
		testQuantity: 5,
	},
	{
		baseListBulkPricing: true,
		baseListPrice: 50,
		baseListTiers: [{minimumQuantity: 5, price: 40}],
		expectedUnitPrice: '$ 10.00',
		name: 'CanCheckoutProductWithBulkPriceOnPromotionAndPriceList',
		promoBulkPricing: true,
		promoPrice: 30,
		promoTiers: [{minimumQuantity: 5, price: 10}],
		tag: '@COMMERCE-pricing-bulk-both-lower-wins',
		testQuantity: 5,
	},
];

for (const scenario of scenarios) {
	test(
		`Cart unit price reflects pricing scenario: ${scenario.name}`,
		{tag: [scenario.tag]},
		async ({apiHelpers, commerceCartPage, page, site, widgetPagePage}) => {
			const layout = await apiHelpers.jsonWebServicesLayout.addLayout({
				groupId: site.id,
				title: getRandomString(),
			});

			const channel =
				await apiHelpers.headlessCommerceAdminChannel.postChannel({
					siteGroupId: site.id,
				});

			const catalog =
				await apiHelpers.headlessCommerceAdminCatalog.postCatalog({
					name: getRandomString(),
				});

			const product =
				await apiHelpers.headlessCommerceAdminCatalog.postProduct({
					catalogId: catalog.id,
					name: {en_US: `Product-${getRandomString()}`},
				});

			const skus = await apiHelpers.headlessCommerceAdminCatalog
				.getProduct(product.productId)
				.then((p) => p.skus);

			const sku = skus[0];

			const basePriceList =
				await apiHelpers.headlessCommerceAdminPricing.getBasePriceListId(
					catalog.id
				);

			const basePriceEntry =
				await apiHelpers.headlessCommerceAdminPricing.postPriceEntry({
					price: scenario.baseListPrice,
					priceListId: basePriceList.items[0].id,
					skuId: sku.id,
				});

			if (scenario.baseListTiers?.length) {
				for (const tier of scenario.baseListTiers) {
					await apiHelpers.post(
						`${apiHelpers.baseUrl}headless-commerce-admin-pricing/v2.0/price-entries/${basePriceEntry.priceEntryId}/tier-prices`,
						{
							data: {
								active: true,
								minimumQuantity: tier.minimumQuantity,
								neverExpire: true,
								price: tier.price,
								priceEntryId: basePriceEntry.priceEntryId,
							},
							failOnStatusCode: true,
						}
					);
				}

				if (scenario.baseListBulkPricing) {
					await apiHelpers.patch(
						`${apiHelpers.baseUrl}headless-commerce-admin-pricing/v2.0/price-entries/${basePriceEntry.priceEntryId}`,
						{bulkPricing: true}
					);
				}
			}

			if (scenario.promoPrice !== undefined) {
				const promoPriceList =
					await apiHelpers.headlessCommerceAdminPricing.getBasePromoPriceListId(
						catalog.id
					);

				const promoPriceEntry =
					await apiHelpers.headlessCommerceAdminPricing.postPriceEntry(
						{
							price: scenario.promoPrice,
							priceListId: promoPriceList.items[0].id,
							skuId: sku.id,
						}
					);

				if (scenario.promoTiers?.length) {
					for (const tier of scenario.promoTiers) {
						await apiHelpers.post(
							`${apiHelpers.baseUrl}headless-commerce-admin-pricing/v2.0/price-entries/${promoPriceEntry.priceEntryId}/tier-prices`,
							{
								data: {
									active: true,
									minimumQuantity: tier.minimumQuantity,
									neverExpire: true,
									price: tier.price,
									priceEntryId: promoPriceEntry.priceEntryId,
								},
								failOnStatusCode: true,
							}
						);
					}

					if (scenario.promoBulkPricing) {
						await apiHelpers.patch(
							`${apiHelpers.baseUrl}headless-commerce-admin-pricing/v2.0/price-entries/${promoPriceEntry.priceEntryId}`,
							{bulkPricing: true}
						);
					}
				}
			}

			const account = await apiHelpers.headlessAdminUser.postAccount({
				name: getRandomString(),
				type: 'person',
			});

			await apiHelpers.headlessAdminUser.assignUserToAccountByEmailAddress(
				account.id,
				['test@liferay.com']
			);

			await apiHelpers.headlessCommerceDeliveryCart.postCart(
				{
					accountId: account.id,
					cartItems: [
						{quantity: scenario.testQuantity, skuId: sku.id},
					],
				},
				channel.id
			);

			await page.goto(`/web${site.friendlyUrlPath}${layout.friendlyURL}`);

			await widgetPagePage.addPortlet('Cart');

			await expect(
				commerceCartPage.commerceOrderItemsTable
					.locator('.lfr-price-column')
					.getByText(scenario.expectedUnitPrice, {exact: true})
			).toBeVisible();
		}
	);
}
