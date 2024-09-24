/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.commerce.order.content.web.internal.info.item.provider;

import com.liferay.commerce.model.CommerceOrder;
import com.liferay.commerce.service.CommerceOrderLocalService;
import com.liferay.info.item.InfoItemFormVariation;
import com.liferay.info.item.provider.InfoItemFormVariationsProvider;
import com.liferay.info.localized.InfoLocalizedValue;
import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.security.auth.CompanyThreadLocal;
import com.liferay.portal.kernel.util.Portal;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * @author Jorge Ferrer
 */
@Component(service = InfoItemFormVariationsProvider.class)
public class CommerceOrderInfoItemFormVariationsProvider
	implements InfoItemFormVariationsProvider<CommerceOrder> {

	@Override
	public InfoItemFormVariation getInfoItemFormVariation(
		long groupId, String formVariationKey) {

		String value = formVariationKey.equals("1") ? "open" : "closed";

		try {
			return new InfoItemFormVariation(
				0,
				formVariationKey,
				InfoLocalizedValue.<String>builder(
				).value(_portal.getSiteDefaultLocale(groupId),
					value
				).build());
		}
		catch (PortalException e) {
			throw new RuntimeException(e);
		}
	}

	@Override
	public InfoItemFormVariation
		getInfoItemFormVariationByExternalReferenceCode(
			String externalReferenceCode, long groupId) {

		try {
			return new InfoItemFormVariation(
				0,
				"1",
				InfoLocalizedValue.<String>builder(
				).value(_portal.getSiteDefaultLocale(groupId),
					"open"
				).build());
		}
		catch (PortalException e) {
			throw new RuntimeException(e);
		}
	}

	@Override
	public Collection<InfoItemFormVariation> getInfoItemFormVariations(
		long groupId) {

		return getInfoItemFormVariations(new long[]{groupId});
	}

	@Override
	public Collection<InfoItemFormVariation> getInfoItemFormVariations(
		long[] groupIds) {

		List<InfoItemFormVariation> infoItemFormVariations = new ArrayList<>();

		try {
			infoItemFormVariations.add(new InfoItemFormVariation(
				0,
				"1",
				InfoLocalizedValue.<String>builder(
				).value(_portal.getSiteDefaultLocale(groupIds[0]),
					"open"
				).build()));

			infoItemFormVariations.add(new InfoItemFormVariation(
				0,
				"0",
				InfoLocalizedValue.<String>builder(
				).value(_portal.getSiteDefaultLocale(groupIds[0]),
					"closed"
				).build()));
		}
		catch (PortalException e) {
			throw new RuntimeException(e);
		}

		return infoItemFormVariations;
	}

	@Reference
	private CommerceOrderLocalService _commerceOrderLocalService;

	@Reference
	private Portal _portal;

}