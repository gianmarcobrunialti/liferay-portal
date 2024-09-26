package com.liferay.commerce.order.content.web.internal.fragment.renderer;

import com.liferay.commerce.model.CommerceOrder;
import com.liferay.commerce.order.content.web.internal.constants.CommerceOrderFragmentFDSNames;
import com.liferay.commerce.product.model.CommerceChannel;
import com.liferay.commerce.product.service.CommerceChannelLocalService;
import com.liferay.commerce.service.CommerceOrderService;
import com.liferay.commerce.service.CommerceOrderTypeService;
import com.liferay.commerce.util.CommerceShippingEngineRegistry;
import com.liferay.fragment.model.FragmentEntryLink;
import com.liferay.fragment.renderer.FragmentRenderer;
import com.liferay.fragment.renderer.FragmentRendererContext;
import com.liferay.fragment.util.configuration.FragmentEntryConfigurationParser;
import com.liferay.petra.string.StringBundler;
import com.liferay.petra.string.StringPool;
import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.json.JSONException;
import com.liferay.portal.kernel.json.JSONFactory;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.language.Language;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.kernel.security.permission.resource.ModelResourcePermission;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.GetterUtil;
import com.liferay.portal.kernel.util.Portal;
import com.liferay.portal.kernel.util.ResourceBundleUtil;
import com.liferay.portal.kernel.util.StringUtil;
import com.liferay.portal.kernel.util.WebKeys;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import javax.servlet.RequestDispatcher;
import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Locale;
import java.util.ResourceBundle;

@Component(service = FragmentRenderer.class)
public class OrderDataSetFragmentRenderer implements FragmentRenderer {
	@Override
	public String getCollectionKey() {
		return "commerce-order";
	}

	@Override
	public String getConfiguration(
		FragmentRendererContext fragmentRendererContext) {
		ResourceBundle resourceBundle = ResourceBundleUtil.getBundle(
			"content.Language", getClass());

		try {
			JSONObject jsonObject = _jsonFactory.createJSONObject(
				StringUtil.read(
					getClass(),
					"/com/liferay/commerce/order/content/web/internal" +
					"/fragment/renderer/data_set/dependencies" +
					"/configuration.json"));

			return _fragmentEntryConfigurationParser.translateConfiguration(
				jsonObject, resourceBundle);
		}
		catch (JSONException jsonException) {
			if (_log.isDebugEnabled()) {
				_log.debug(jsonException);
			}

			return StringPool.BLANK;
		}
	}

	@Override
	public String getIcon() {
		return "catalog";
	}

	@Override
	public String getLabel(Locale locale) {
		return _language.get(locale, "data-set");
	}

	@Override
	public void render(
		FragmentRendererContext fragmentRendererContext,
		HttpServletRequest httpServletRequest,
		HttpServletResponse httpServletResponse) throws IOException {

		FragmentEntryLink fragmentEntryLink =
			fragmentRendererContext.getFragmentEntryLink();

		String displayStyle = _getConfigurationValue(
			fragmentRendererContext, fragmentEntryLink, "displayStyle");

		httpServletRequest.setAttribute(
			"liferay-commerce:order-data-set:displayStyle",
			displayStyle);

		String status = _getConfigurationValue(
			fragmentRendererContext, fragmentEntryLink, "status");

		httpServletRequest.setAttribute(
			"liferay-commerce:order-data-set:apiURL",
			_getAPIURL(httpServletRequest, status));

		httpServletRequest.setAttribute(
			"liferay-commerce:order-data-set:key",
			_getOrderDataSetKey(status));

		try {
			RequestDispatcher requestDispatcher =
				_servletContext.getRequestDispatcher(
					"/fragment/renderer/data_set/page.jsp");

			requestDispatcher.include(httpServletRequest, httpServletResponse);
		} catch (Exception exception) {
			_log.error(exception);
		}
	}

	private String _getOrderDataSetKey(String orderStatusDataSet) {
		if (orderStatusDataSet.equals("pending")) {
			return CommerceOrderFragmentFDSNames.PENDING_ORDERS;
		}

		return CommerceOrderFragmentFDSNames.PLACED_ORDERS;
	}

	private String _getAPIURL(HttpServletRequest httpServletRequest,
		String orderStatusDataSet) {

		long commerceChannelId = _getCommerceChannelId(httpServletRequest);

		if (orderStatusDataSet.equals("pending")) {
			return StringBundler.concat(
				"/o/headless-commerce-delivery-cart/v1.0/channels/",
				String.valueOf(commerceChannelId),
				"/carts");
		}

		return StringBundler.concat(
			"/o/headless-commerce-delivery-order/v1.0/channels/",
			String.valueOf(commerceChannelId),
			"/placed-orders");
	}

	private long _getCommerceChannelId(HttpServletRequest httpServletRequest) {
		ThemeDisplay themeDisplay =
			(ThemeDisplay)httpServletRequest.getAttribute(
				WebKeys.THEME_DISPLAY);

		CommerceChannel commerceChannel =
			_commerceChannelLocalService.fetchCommerceChannelBySiteGroupId(
				themeDisplay.getScopeGroupId());

		if (commerceChannel == null) {
			return 0;
		}

		return commerceChannel.getCommerceChannelId();
	}

	private String _getConfigurationValue(
		FragmentRendererContext fragmentRendererContext,
		FragmentEntryLink fragmentEntryLink, String name) {

		return GetterUtil.getString(
			_fragmentEntryConfigurationParser.getFieldValue(
				fragmentEntryLink.getConfiguration(),
				fragmentEntryLink.getEditableValues(),
				fragmentRendererContext.getLocale(), name));
	}

	private static final Log _log = LogFactoryUtil.getLog(
		OrderDataSetFragmentRenderer.class);

	@Reference(
		target = "(model.class.name=com.liferay.commerce.model.CommerceOrder)"
	)
	private ModelResourcePermission<CommerceOrder>
		_commerceOrderModelResourcePermission;

	@Reference
	private CommerceChannelLocalService _commerceChannelLocalService;

	@Reference
	private CommerceOrderService _commerceOrderService;

	@Reference
	private CommerceOrderTypeService _commerceOrderTypeService;

	@Reference
	private CommerceShippingEngineRegistry _commerceShippingEngineRegistry;	

	@Reference
	private FragmentEntryConfigurationParser _fragmentEntryConfigurationParser;

	@Reference
	private Language _language;	

	@Reference
	private JSONFactory _jsonFactory;

	@Reference
	private Portal _portal;

	@Reference(
		target = "(osgi.web.symbolicname=com.liferay.commerce.order.content.web)"
	)
	private ServletContext _servletContext;
}
