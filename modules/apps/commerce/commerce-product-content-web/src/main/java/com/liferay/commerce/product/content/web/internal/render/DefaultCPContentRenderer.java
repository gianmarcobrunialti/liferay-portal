/**
 * Copyright (c) 2000-present Liferay, Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
 * details.
 */

package com.liferay.commerce.product.content.web.internal.render;

import com.liferay.commerce.account.model.CommerceAccount;
import com.liferay.commerce.constants.CommerceWebKeys;
import com.liferay.commerce.context.CommerceContext;
import com.liferay.commerce.currency.model.CommerceCurrency;
import com.liferay.commerce.frontend.model.ProductSettingsModel;
import com.liferay.commerce.frontend.util.ProductHelper;
import com.liferay.commerce.inventory.engine.CommerceInventoryEngine;
import com.liferay.commerce.model.CommerceOrder;
import com.liferay.commerce.model.CommerceOrderItem;
import com.liferay.commerce.product.catalog.CPCatalogEntry;
import com.liferay.commerce.product.catalog.CPSku;
import com.liferay.commerce.product.content.constants.CPContentWebKeys;
import com.liferay.commerce.product.content.render.CPContentRenderer;
import com.liferay.commerce.product.content.util.CPContentHelper;
import com.liferay.commerce.product.type.grouped.util.GroupedCPTypeHelper;
import com.liferay.commerce.product.type.virtual.util.VirtualCPTypeHelper;
import com.liferay.commerce.service.CommerceOrderItemLocalService;
import com.liferay.commerce.wish.list.model.CommerceWishList;
import com.liferay.commerce.wish.list.service.CommerceWishListItemService;
import com.liferay.commerce.wish.list.service.CommerceWishListService;
import com.liferay.frontend.taglib.servlet.taglib.util.JSPRenderer;
import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.language.LanguageUtil;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.Portal;
import com.liferay.portal.kernel.util.ResourceBundleUtil;
import com.liferay.portal.kernel.util.WebKeys;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.ResourceBundle;

/**
 * @author Gianmarco Brunialti Masera
 */
@Component(
	enabled = false, immediate = true,
	property = {
		"commerce.product.content.renderer.key=" + DefaultCPContentRenderer.KEY,
		"commerce.product.content.renderer.order=" + Integer.MIN_VALUE,
		"commerce.product.content.renderer.type=grouped",
		"commerce.product.content.renderer.type=simple",
		"commerce.product.content.renderer.type=virtual"
	},
	service = CPContentRenderer.class
)
public class DefaultCPContentRenderer implements CPContentRenderer {

	public static final String KEY = "default";

	@Override
	public String getKey() {
		return KEY;
	}

	@Override
	public String getLabel(Locale locale) {
		ResourceBundle resourceBundle = ResourceBundleUtil.getBundle(
			"content.Language", locale, getClass());

		return LanguageUtil.get(resourceBundle, KEY);
	}

	@Override
	public void render(
		CPCatalogEntry cpCatalogEntry,
		HttpServletRequest httpServletRequest,
		HttpServletResponse httpServletResponse)
		throws Exception {

		httpServletRequest.setAttribute("displayProductInformation",
			_getDisplayProductInformation(httpServletRequest));

		httpServletRequest.setAttribute(
			"groupedCPTypeHelper", _groupedCPTypeHelper);
		httpServletRequest.setAttribute(
			"virtualCPTypeHelper", _virtualCPTypeHelper);

		_jspRenderer.renderJSP(
			_servletContext, httpServletRequest, httpServletResponse,
			"/product_detail/render/view.jsp");
	}

	private HashMap<String, Object> _getDisplayProductInformation(
		HttpServletRequest httpServletRequest) throws Exception {

		HashMap<String, Object> displayProductInformation = new HashMap<>();

		CommerceContext commerceContext =
			(CommerceContext) httpServletRequest.getAttribute(
				CommerceWebKeys.COMMERCE_CONTEXT);

		CPContentHelper cpContentHelper =
			(CPContentHelper) httpServletRequest.getAttribute(CPContentWebKeys.CP_CONTENT_HELPER);

		CPCatalogEntry cpCatalogEntry = cpContentHelper.getCPCatalogEntry(httpServletRequest);

		CPSku cpSku = cpContentHelper.getDefaultCPSku(cpCatalogEntry);

		long cpDefinitionId = cpCatalogEntry.getCPDefinitionId();

		CommerceAccount commerceAccount = commerceContext.getCommerceAccount();
		long commerceAccountId = 0;

		if (commerceAccount != null) {
			commerceAccountId = commerceAccount.getCommerceAccountId();
		}

		CommerceOrder commerceOrder = commerceContext.getCommerceOrder();
		long commerceOrderId = 0;
		boolean isInCart = false;
		int stockQuantity = 0;
		boolean isLowStock = false;

		if (cpSku != null) {
			ProductSettingsModel productSettingsModel =
				_productHelper.getProductSettingsModel(cpSku.getCPInstanceId());

			stockQuantity = _commerceInventoryEngine.getStockQuantity(
				_portal.getCompanyId(httpServletRequest), cpSku.getSku());

			isLowStock = (stockQuantity > 0 &&
						  stockQuantity <= productSettingsModel.getLowStockQuantity());

			if (commerceOrder != null) {
				commerceOrderId = commerceOrder.getCommerceOrderId();

				isInCart = _isInCart(cpSku, commerceOrderId);
			}
		}

		CommerceCurrency commerceCurrency =
			commerceContext.getCommerceCurrency();

		ThemeDisplay themeDisplay = (ThemeDisplay) httpServletRequest.getAttribute(
			WebKeys.THEME_DISPLAY);

		String pathThemeImages = themeDisplay.getPathThemeImages();

		String spritemap = pathThemeImages + "/icons.svg";

		if (pathThemeImages.contains("classic")) {
			spritemap = pathThemeImages + "/lexicon/icons.svg";
		}

		boolean isInWishList = _isInWishlist(
			cpSku, cpCatalogEntry, themeDisplay);

		displayProductInformation.put("channelId", commerceContext.getCommerceChannelId());
		displayProductInformation.put("commerceAccountId", commerceAccountId);
		displayProductInformation.put("commerceOrderId", commerceOrderId);
		displayProductInformation.put("cpDefinitionId", cpDefinitionId);
		displayProductInformation.put("currencyCode", commerceCurrency.getCode());
		displayProductInformation.put("isInCart", isInCart);
		displayProductInformation.put("isInWishList", isInWishList);
		displayProductInformation.put("isLowStock", isLowStock);
		displayProductInformation.put("spritemap", spritemap);
		displayProductInformation.put("stockQuantity", stockQuantity);

		return displayProductInformation;
	}

	private boolean _isInCart(CPSku cpSku, long commerceOrderId) {
		if (cpSku != null) {
			List<CommerceOrderItem> commerceOrderItems =
				_commerceOrderItemLocalService.getCommerceOrderItems(
					commerceOrderId, cpSku.getCPInstanceId(), 0, 1);

			return !commerceOrderItems.isEmpty();
		}

		return false;
	}

	private boolean _isInWishlist(
		CPSku cpSku, CPCatalogEntry cpCatalogEntry,
		ThemeDisplay themeDisplay) throws PortalException {

		CommerceWishList commerceWishList =
			_commerceWishListService.getDefaultCommerceWishList(
				themeDisplay.getScopeGroupId(), themeDisplay.getUserId());

		if (commerceWishList != null) {
			return (cpSku != null && _commerceWishListItemService.
				getCommerceWishListItemByContainsCPInstanceCount(
					commerceWishList.getCommerceWishListId(),
					cpSku.getCPInstanceUuid()) > 0);
		}
		else {
			return _commerceWishListItemService.
				getCommerceWishListItemByContainsCProductCount(
					commerceWishList.getCommerceWishListId(),
					cpCatalogEntry.getCProductId()) > 0;
		}
	}

	@Reference
	private CommerceInventoryEngine _commerceInventoryEngine;

	@Reference
	private CommerceOrderItemLocalService _commerceOrderItemLocalService;

	@Reference
	private CommerceWishListItemService _commerceWishListItemService;

	@Reference
	private CommerceWishListService _commerceWishListService;

	@Reference
	private GroupedCPTypeHelper _groupedCPTypeHelper;

	@Reference
	private Portal _portal;

	@Reference
	private ProductHelper _productHelper;

	@Reference
	private JSPRenderer _jspRenderer;

	@Reference
	private VirtualCPTypeHelper _virtualCPTypeHelper;

	@Reference(
		target = "(osgi.web.symbolicname=com.liferay.commerce.product.content.web)"
	)
	private ServletContext _servletContext;
}
