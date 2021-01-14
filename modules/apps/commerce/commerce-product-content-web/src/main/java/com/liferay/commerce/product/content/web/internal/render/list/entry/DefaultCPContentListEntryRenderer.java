package com.liferay.commerce.product.content.web.internal.render.list.entry;

import com.liferay.commerce.account.model.CommerceAccount;
import com.liferay.commerce.constants.CommerceWebKeys;
import com.liferay.commerce.context.CommerceContext;
import com.liferay.commerce.currency.model.CommerceCurrency;
import com.liferay.commerce.frontend.model.PriceModel;
import com.liferay.commerce.frontend.model.ProductSettingsModel;
import com.liferay.commerce.frontend.util.ProductHelper;
import com.liferay.commerce.model.CommerceOrder;
import com.liferay.commerce.model.CommerceOrderItem;
import com.liferay.commerce.product.catalog.CPCatalogEntry;
import com.liferay.commerce.product.catalog.CPSku;
import com.liferay.commerce.product.constants.CPPortletKeys;
import com.liferay.commerce.product.content.constants.CPContentWebKeys;
import com.liferay.commerce.product.content.render.list.entry.CPContentListEntryRenderer;
import com.liferay.commerce.product.content.util.CPContentHelper;
import com.liferay.commerce.product.util.CPCompareHelperUtil;
import com.liferay.commerce.service.CommerceOrderItemLocalService;
import com.liferay.commerce.wish.list.model.CommerceWishList;
import com.liferay.commerce.wish.list.service.CommerceWishListItemService;
import com.liferay.commerce.wish.list.service.CommerceWishListService;
import com.liferay.frontend.taglib.servlet.taglib.util.JSPRenderer;
import com.liferay.petra.string.StringPool;
import com.liferay.portal.kernel.json.JSONFactory;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.language.LanguageUtil;
import com.liferay.portal.kernel.portlet.PortletURLFactoryUtil;
import com.liferay.portal.kernel.theme.PortletDisplay;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.MapUtil;
import com.liferay.portal.kernel.util.Portal;
import com.liferay.portal.kernel.util.ResourceBundleUtil;
import com.liferay.portal.kernel.util.WebKeys;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import javax.portlet.ActionRequest;
import javax.portlet.PortletRequest;
import javax.portlet.PortletURL;
import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.ResourceBundle;

/**
 * @author Gianmarco Brunialti Masera
 */
@Component(
	enabled = false, immediate = true,
	property = {
		"commerce.product.content.list.entry.renderer.key=" + DefaultCPContentListEntryRenderer.KEY,
		"commerce.product.content.list.entry.renderer.order=" + Integer.MIN_VALUE,
		"commerce.product.content.list.entry.renderer.portlet.name=" +
		CPPortletKeys.CP_COMPARE_CONTENT_WEB,
		"commerce.product.content.list.entry.renderer.portlet.name=" +
		CPPortletKeys.CP_PUBLISHER_WEB,
		"commerce.product.content.list.entry.renderer.portlet.name=" +
		CPPortletKeys.CP_SEARCH_RESULTS,
		"commerce.product.content.list.entry.renderer.type=grouped",
		"commerce.product.content.list.entry.renderer.type=simple",
		"commerce.product.content.list.entry.renderer.type=virtual"
	},
	service = CPContentListEntryRenderer.class
)
public class DefaultCPContentListEntryRenderer
	implements CPContentListEntryRenderer {

	public static final String KEY = "list-entry-default";

	@Override
	public String getKey() {
		return KEY;
	}

	@Override
	public String getLabel(Locale locale) {
		ResourceBundle resourceBundle = ResourceBundleUtil.getBundle(
			"content.Language", locale, getClass());

		return LanguageUtil.get(resourceBundle, "default");
	}

	@Override
	public void render(
		HttpServletRequest httpServletRequest,
		HttpServletResponse httpServletResponse)
		throws Exception {

		CommerceContext commerceContext =
			(CommerceContext) httpServletRequest.getAttribute(
				CommerceWebKeys.COMMERCE_CONTEXT);

		CPContentHelper cpContentHelper =
			(CPContentHelper) httpServletRequest.getAttribute(
				CPContentWebKeys.CP_CONTENT_HELPER);

		CPCatalogEntry cpCatalogEntry = cpContentHelper.getCPCatalogEntry(
			httpServletRequest);

		List<CPSku> cpSkus = cpCatalogEntry.getCPSkus();

		CPSku cpSku = null;

		if (cpSkus.size() == 1) {
			cpSku = cpSkus.get(0);
		}

		ThemeDisplay themeDisplay =
			(ThemeDisplay) httpServletRequest.getAttribute(
				WebKeys.THEME_DISPLAY);

		Map<String, Object> displayProductInformation = new HashMap<>();

		CommerceAccount commerceAccount = commerceContext.getCommerceAccount();

		PortletDisplay portletDisplay = themeDisplay.getPortletDisplay();

		String portletName = portletDisplay.getPortletName();

		if (portletName.equals(CPPortletKeys.CP_COMPARE_CONTENT_WEB)) {
			PortletURL editCompareProductActionURL =
				PortletURLFactoryUtil.create(
					httpServletRequest, CPPortletKeys.CP_COMPARE_CONTENT_WEB,
					PortletRequest.ACTION_PHASE);

			editCompareProductActionURL.setParameter(
				ActionRequest.ACTION_NAME, "editCompareProduct");

			displayProductInformation.put("compareCheckboxVisible", false);
			displayProductInformation.put(
				"compareContentNamespace",
				_portal.getPortletNamespace(
					CPPortletKeys.CP_COMPARE_CONTENT_WEB));
			displayProductInformation.put("deleteButtonVisible", true);
			displayProductInformation.put(
				"editCompareProductActionURL",
				editCompareProductActionURL.toString());
		}
		else {
			long commerceAccountId = 0;

			if (commerceAccount != null) {
				commerceAccountId = commerceAccount.getCommerceAccountId();
			}

			displayProductInformation.put("commerceAccountId", commerceAccountId);

			HttpServletRequest originalHttpServletRequest =
				_portal.getOriginalServletRequest(httpServletRequest);

			List<Long> cpDefinitionIds = CPCompareHelperUtil.getCPDefinitionIds(
				commerceContext.getCommerceChannelGroupId(), commerceAccountId,
				originalHttpServletRequest.getSession());

			JSONObject jsonObject = _jsonFactory.createJSONObject();

			jsonObject.put(
				"checkboxVisible", true
			).put(
				"compareAvailable", true
			).put(
				"inCompare",
				cpDefinitionIds.contains(cpCatalogEntry.getCPDefinitionId())
			);

			displayProductInformation.put("compareCheckboxVisible", true);
			displayProductInformation.put("compareState", jsonObject);
			displayProductInformation.put("deleteButtonVisible", false);
		}

		CommerceOrder commerceOrder = commerceContext.getCommerceOrder();

		long commerceOrderId = 0;

		if (commerceOrder != null) {
			commerceOrderId = commerceOrder.getCommerceOrderId();
		}

		displayProductInformation.put("orderId", commerceOrderId);

		displayProductInformation.put("description", cpCatalogEntry.getShortDescription());

		displayProductInformation.put("isInCart", false);

		displayProductInformation.put(
			"productDetailURL",
			cpContentHelper.getFriendlyURL(cpCatalogEntry, themeDisplay));

		displayProductInformation.put("name", cpCatalogEntry.getName());
		displayProductInformation.put("productImageURL", cpCatalogEntry.getDefaultImageFileUrl());

		displayProductInformation.put("cpDefinitionId", cpCatalogEntry.getCPDefinitionId());

		boolean hasChildCPDefinitions = cpContentHelper.hasChildCPDefinitions(
			cpCatalogEntry.getCPDefinitionId());

		String sku = StringPool.BLANK;
		long skuId = 0;
		int stockQuantity = 0;
		boolean isLowStock = false;

		if ((cpSku != null) && !hasChildCPDefinitions) {
			sku = cpSku.getSku();
			skuId = cpSku.getCPInstanceId();

			ProductSettingsModel productSettingsModel =
				_productHelper.getProductSettingsModel(cpSku.getCPInstanceId());

			PriceModel priceModel = _productHelper.getPriceModel(
				cpSku.getCPInstanceId(), productSettingsModel.getMinQuantity(),
				commerceContext, StringPool.BLANK, themeDisplay.getLocale());

			displayProductInformation.put("prices", priceModel);

			displayProductInformation.put("settings", productSettingsModel);

			if (commerceOrder != null) {
				List<CommerceOrderItem> commerceOrderItems =
					_commerceOrderItemLocalService.getCommerceOrderItems(
						commerceOrder.getCommerceOrderId(),
						cpSku.getCPInstanceId(), 0, 1);

				if (!commerceOrderItems.isEmpty()) {
					displayProductInformation.put("isInCart", true);
				}
			}

			Map<String, Integer> stockQuantities =
				(Map<String, Integer>) httpServletRequest.getAttribute(
					"stockQuantities");

			if (MapUtil.isNotEmpty(stockQuantities)) {
				stockQuantity = MapUtil.getInteger(
					stockQuantities, cpSku.getSku());
			}

			isLowStock = (stockQuantity > 0 &&
						  stockQuantity <= productSettingsModel.getLowStockQuantity());
		}
		else if (hasChildCPDefinitions) {
			PriceModel priceModel = _productHelper.getMinPrice(
				cpCatalogEntry.getCPDefinitionId(), commerceContext,
				themeDisplay.getLocale());

			displayProductInformation.put("prices", priceModel);
		}

		displayProductInformation.put("sku", sku);
		displayProductInformation.put("skuId", skuId);
		displayProductInformation.put("stockQuantity", stockQuantity);
		displayProductInformation.put("isLowStock", isLowStock);

		boolean isInWishList = false;

		CommerceWishList commerceWishList =
			_commerceWishListService.getDefaultCommerceWishList(
				themeDisplay.getScopeGroupId(), themeDisplay.getUserId());

		if (commerceWishList != null) {
			if (cpSku != null) {
				if (_commerceWishListItemService.
					getCommerceWishListItemByContainsCPInstanceCount(
						commerceWishList.getCommerceWishListId(),
						cpSku.getCPInstanceUuid()) > 0) {

					isInWishList = true;
				}
			}
			else {
				if (_commerceWishListItemService.
					getCommerceWishListItemByContainsCProductCount(
						commerceWishList.getCommerceWishListId(),
						cpCatalogEntry.getCProductId()) > 0) {

					isInWishList = true;
				}
			}
		}

		displayProductInformation.put("isInWishList", isInWishList);

		displayProductInformation.put("channelId",
			commerceContext.getCommerceChannelId());

		CommerceCurrency commerceCurrency =
			commerceContext.getCommerceCurrency();

		displayProductInformation.put("currencyCode",
			commerceCurrency.getCode());

		String pathThemeImages = themeDisplay.getPathThemeImages();

		String spritemap = pathThemeImages + "/icons.svg";

		if (pathThemeImages.contains("classic")) {
			spritemap = pathThemeImages + "/lexicon/icons.svg";
		}

		displayProductInformation.put("spritemap", spritemap);

		httpServletRequest.setAttribute(
			"displayProductInformation", displayProductInformation);

		_jspRenderer.renderJSP(
			_servletContext, httpServletRequest, httpServletResponse,
			"/product_publisher/render/list/entry/view.jsp");
	}

	@Reference
	private CommerceOrderItemLocalService _commerceOrderItemLocalService;

	@Reference
	private CommerceWishListItemService _commerceWishListItemService;

	@Reference
	private CommerceWishListService _commerceWishListService;

	@Reference
	private JSONFactory _jsonFactory;

	@Reference
	private JSPRenderer _jspRenderer;

	@Reference
	private Portal _portal;

	@Reference
	private ProductHelper _productHelper;

	@Reference(
		target = "(osgi.web.symbolicname=com.liferay.commerce.product.content.web)"
	)
	private ServletContext _servletContext;
}
