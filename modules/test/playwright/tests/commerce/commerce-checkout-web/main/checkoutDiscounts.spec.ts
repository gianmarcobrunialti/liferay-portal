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
import {createProductWithSku} from '../../utils/commerce';

export const test = mergeTests(
	apiHelpersTest,
	commercePagesTest,
	dataApiHelpersTest,
	isolatedSiteTest,
	loginTest(),
	pageViewModePagesTest
);

test(
	'When two L1 discounts target the same product the higher percentage applies at cart',
	{tag: ['@COMMERCE-10343']},
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

		const {product, sku} = await createProductWithSku(
			apiHelpers,
			catalog.id
		);

		await apiHelpers.headlessCommerceAdminPricing.postDiscount({
			discountProducts: [{productId: product.productId}],
			level: 'L1',
			percentageLevel1: 20,
			target: 'products',
			title: `Discount 20% off ${getRandomString()}`,
			usePercentage: true,
		});

		await apiHelpers.headlessCommerceAdminPricing.postDiscount({
			discountProducts: [{productId: product.productId}],
			level: 'L1',
			percentageLevel1: 30,
			target: 'products',
			title: `Discount 30% off ${getRandomString()}`,
			usePercentage: true,
		});

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
				cartItems: [{quantity: 1, skuId: sku.id}],
			},
			channel.id
		);

		await page.goto(`/web${site.friendlyUrlPath}${layout.friendlyURL}`);

		await widgetPagePage.addPortlet('Cart');

		await expect(
			commerceCartPage.commerceOrderItemsTable.getByText('$ 35.00', {
				exact: true,
			})
		).toBeVisible();
	}
);

test(
	'When two stacking discounts at different levels target the same product they apply cumulatively',
	{tag: ['@COMMERCE-10344']},
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

		const {product, sku} = await createProductWithSku(
			apiHelpers,
			catalog.id
		);

		await apiHelpers.headlessCommerceAdminPricing.postDiscount({
			discountProducts: [{productId: product.productId}],
			level: 'L1',
			percentageLevel1: 20,
			target: 'products',
			title: `L1 20% off ${getRandomString()}`,
			usePercentage: true,
		});

		await apiHelpers.headlessCommerceAdminPricing.postDiscount({
			discountProducts: [{productId: product.productId}],
			level: 'L2',
			percentageLevel1: 30,
			target: 'products',
			title: `L2 30% off ${getRandomString()}`,
			usePercentage: true,
		});

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
				cartItems: [{quantity: 1, skuId: sku.id}],
			},
			channel.id
		);

		await page.goto(`/web${site.friendlyUrlPath}${layout.friendlyURL}`);

		await widgetPagePage.addPortlet('Cart');

		await expect(
			commerceCartPage.commerceOrderItemsTable.getByText('$ 28.00', {
				exact: true,
			})
		).toBeVisible();
	}
);
