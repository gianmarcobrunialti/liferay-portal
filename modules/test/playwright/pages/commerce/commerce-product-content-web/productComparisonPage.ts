/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {Locator, Page} from '@playwright/test';

import {CommerceLayoutsPage} from '../commerce-order-content-web/commerceLayoutsPage';

export class ProductComparisonPage {
	readonly activeCompareItems: Locator;
	readonly compareBar: Locator;
	readonly deleteCompareItemButton: Locator;
	readonly layoutsPage: CommerceLayoutsPage;
	readonly page: Page;

	constructor(page: Page) {
		this.compareBar = page
			.locator('.mini-compare.active')
			.filter({hasText: 'Compare'});
		this.activeCompareItems = this.compareBar.locator(
			'.mini-compare-item.active'
		);
		this.deleteCompareItemButton = this.activeCompareItems.locator(
			'.mini-compare-delete'
		);
		this.layoutsPage = new CommerceLayoutsPage(page);
		this.page = page;
	}

	async addProductComparisonBarWidget() {
		await this.layoutsPage.addWidgetToPage('Product Comparison Bar');
	}
}
