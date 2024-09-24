/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.commerce.order.content.web.internal.info.item.provider;

import com.liferay.commerce.model.CommerceOrder;
import com.liferay.dynamic.data.mapping.model.DDMStructure;
import com.liferay.info.item.provider.InfoItemObjectVariationProvider;
import com.liferay.journal.model.JournalArticle;
import com.liferay.portal.kernel.language.Language;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import java.util.Locale;

/**
 * @author Eudaldo Alonso
 */
@Component(service = InfoItemObjectVariationProvider.class)
public class CommerceOrderInfoItemObjectVariationProvider
	implements InfoItemObjectVariationProvider<CommerceOrder> {

	@Override
	public String getInfoItemFormVariationKey(CommerceOrder commerceOrder) {
		if (commerceOrder == null) {
			return null;
		}

		return String.valueOf(commerceOrder.isOpen() ? 1 : 0);
	}

	@Override
	public String getInfoItemFormVariationLabel(
		CommerceOrder commerceOrder, Locale locale) {

		if (commerceOrder.isOpen()) {
			return _language.get(locale, "open");
		}

		return _language.get(locale, "closed");
	}

	@Reference
	private Language _language;
}