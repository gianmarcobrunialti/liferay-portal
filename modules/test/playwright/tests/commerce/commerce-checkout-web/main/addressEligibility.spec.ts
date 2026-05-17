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

const ELIGIBLE_ADDRESS_NAME = 'Eligible Test Address';
const INELIGIBLE_ADDRESS_NAME = 'Ineligible Test Address';

async function setUpAccountWithCart({apiHelpers, site}) {
	const channel = await apiHelpers.headlessCommerceAdminChannel.postChannel({
		siteGroupId: site.id,
	});

	const otherChannel =
		await apiHelpers.headlessCommerceAdminChannel.postChannel({
			siteGroupId: 0,
		});

	const catalog = await apiHelpers.headlessCommerceAdminCatalog.postCatalog({
		name: getRandomString(),
	});

	const product = await apiHelpers.headlessCommerceAdminCatalog.postProduct({
		catalogId: catalog.id,
		name: {en_US: 'Product'},
		skus: [
			{
				cost: 0,
				price: 50,
				published: true,
				purchasable: true,
				sku: getRandomString(),
			},
		],
	});

	const sku = (
		await apiHelpers.headlessCommerceAdminCatalog.getProduct(
			product.productId
		)
	).skus[0];

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

	return {account, channel, otherChannel};
}

test(
	'Address eligible for the active channel is selectable in checkout',
	{tag: ['@COMMERCE-12893']},
	async ({apiHelpers, checkoutPage, page, site, widgetPagePage}) => {
		const {account, channel} = await setUpAccountWithCart({
			apiHelpers,
			site,
		});

		const address =
			await apiHelpers.headlessCommerceAdminAccount.postAddress(
				account.id,
				{
					countryISOCode: 'US',
					name: ELIGIBLE_ADDRESS_NAME,
					regionISOCode: 'AL',
					type: 2,
				}
			);

		await apiHelpers.headlessCommerceAdminChannel.postAccountAddressChannel(
			address.id,
			channel.id
		);

		const layout = await apiHelpers.jsonWebServicesLayout.addLayout({
			groupId: site.id,
			title: getRandomString(),
		});

		await page.goto(`/web${site.friendlyUrlPath}${layout.friendlyURL}`);

		await widgetPagePage.addPortlet('Checkout');

		await expect(
			checkoutPage.commerceAddressOptions.filter({
				hasText: ELIGIBLE_ADDRESS_NAME,
			})
		).toHaveCount(1);
	}
);

test(
	'Address restricted to another channel is not selectable in checkout',
	{tag: ['@COMMERCE-12890']},
	async ({apiHelpers, checkoutPage, page, site, widgetPagePage}) => {
		const {account, otherChannel} = await setUpAccountWithCart({
			apiHelpers,
			site,
		});

		const address =
			await apiHelpers.headlessCommerceAdminAccount.postAddress(
				account.id,
				{
					countryISOCode: 'US',
					name: INELIGIBLE_ADDRESS_NAME,
					regionISOCode: 'AL',
					type: 2,
				}
			);

		await apiHelpers.headlessCommerceAdminChannel.postAccountAddressChannel(
			address.id,
			otherChannel.id
		);

		const layout = await apiHelpers.jsonWebServicesLayout.addLayout({
			groupId: site.id,
			title: getRandomString(),
		});

		await page.goto(`/web${site.friendlyUrlPath}${layout.friendlyURL}`);

		await widgetPagePage.addPortlet('Checkout');

		await expect(
			checkoutPage.commerceAddressOptions.filter({
				hasText: INELIGIBLE_ADDRESS_NAME,
			})
		).toHaveCount(0);
	}
);

test(
	'Removing a channel eligibility restriction restores selection in checkout',
	{tag: ['@COMMERCE-12934']},
	async ({apiHelpers, checkoutPage, page, site, widgetPagePage}) => {
		const {account, otherChannel} = await setUpAccountWithCart({
			apiHelpers,
			site,
		});

		const address =
			await apiHelpers.headlessCommerceAdminAccount.postAddress(
				account.id,
				{
					countryISOCode: 'US',
					name: INELIGIBLE_ADDRESS_NAME,
					regionISOCode: 'AL',
					type: 2,
				}
			);

		const restriction =
			await apiHelpers.headlessCommerceAdminChannel.postAccountAddressChannel(
				address.id,
				otherChannel.id
			);

		const layout = await apiHelpers.jsonWebServicesLayout.addLayout({
			groupId: site.id,
			title: getRandomString(),
		});

		await page.goto(`/web${site.friendlyUrlPath}${layout.friendlyURL}`);

		await widgetPagePage.addPortlet('Checkout');

		await expect(
			checkoutPage.commerceAddressOptions.filter({
				hasText: INELIGIBLE_ADDRESS_NAME,
			})
		).toHaveCount(0);

		await apiHelpers.headlessCommerceAdminChannel.deleteAccountAddressChannel(
			restriction.accountAddressChannelId
		);

		await page.reload();

		await expect(
			checkoutPage.commerceAddressOptions.filter({
				hasText: INELIGIBLE_ADDRESS_NAME,
			})
		).toHaveCount(1);
	}
);
