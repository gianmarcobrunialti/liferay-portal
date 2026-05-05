/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {LayoutData, LayoutDataItem} from '../../types/layout_data/LayoutData';
import {ViewportSize} from '../config/constants/viewportSizes';

export function isItemHidden(
	layoutData: LayoutData,
	itemId: LayoutDataItem['itemId'],
	_selectedViewportSize?: ViewportSize,
	options = {recursive: false}
): boolean {
	const item = layoutData?.items[itemId];

	if (!item) {
		return false;
	}

	if (options.recursive) {
		return (
			item.config?.hidden === true ||
			isItemHidden(
				layoutData,
				item.parentId,
				_selectedViewportSize,
				options
			)
		);
	}

	return item.config?.hidden === true;
}
