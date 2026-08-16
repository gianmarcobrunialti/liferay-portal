/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {expect, mergeTests} from '@playwright/test';

import {commercePagesTest} from '../../../../fixtures/commercePagesTest';
import {dataApiHelpersTest} from '../../../../fixtures/dataApiHelpersTest';
import {loginTest} from '../../../../fixtures/loginTest';
import getRandomString from '../../../../utils/getRandomString';
import {miniumSetUp} from '../../utils/commerce';

export const test = mergeTests(
	commercePagesTest,
	dataApiHelpersTest,
	loginTest()
);

const MINIUM_PRODUCTS = ['ABS Sensor', 'U-Joint', 'Transmission Fluid'];

test(
	'Quick-adding a Minium SKU to the mini cart creates the cart item',
	{tag: ['@COMMERCE-10532']},
	async ({apiHelpers, commerceMiniCartPage, page}) => {
		await apiHelpers.headlessAdminUser.postAccount({
			name: getRandomString(),
			type: 'business',
		});

		const {site} = await miniumSetUp(apiHelpers);

		const productName = MINIUM_PRODUCTS[0];

		await page.goto(`/web/${site.name}`);

		await commerceMiniCartPage.quickAddToCart(productName);

		await expect(
			commerceMiniCartPage.miniCartItem(productName)
		).toBeVisible();
	}
);

test(
	'Quick-adding multiple Minium SKUs populates the mini cart with each item',
	{tag: ['@COMMERCE-10390']},
	async ({apiHelpers, commerceMiniCartPage, page}) => {
		await apiHelpers.headlessAdminUser.postAccount({
			name: getRandomString(),
			type: 'business',
		});

		const {site} = await miniumSetUp(apiHelpers);

		await page.goto(`/web/${site.name}`);

		for (const productName of MINIUM_PRODUCTS) {
			await commerceMiniCartPage.quickAddToCart(productName);
		}

		for (const productName of MINIUM_PRODUCTS) {
			await expect(
				commerceMiniCartPage.miniCartItem(productName)
			).toBeVisible();
		}
	}
);
