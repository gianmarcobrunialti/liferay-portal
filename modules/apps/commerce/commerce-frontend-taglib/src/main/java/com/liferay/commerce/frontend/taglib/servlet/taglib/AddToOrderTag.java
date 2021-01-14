package com.liferay.commerce.frontend.taglib.servlet.taglib;

import com.liferay.commerce.frontend.taglib.internal.servlet.ServletContextUtil;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.Validator;
import com.liferay.portal.kernel.util.WebKeys;
import com.liferay.taglib.util.IncludeTag;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.jsp.PageContext;

/**
 * @author Gianmarco Brunialti Masera
 */
public class AddToOrderTag extends IncludeTag {
	@Override
	public void setAttributes(HttpServletRequest httpServletRequest) {
		setAttributeNamespace(_ATTRIBUTE_NAMESPACE);

		if (Validator.isNull(_spritemap)) {
			ThemeDisplay themeDisplay = (ThemeDisplay) httpServletRequest.getAttribute(
				WebKeys.THEME_DISPLAY);

			_spritemap = themeDisplay.getPathThemeImages() + "/clay/icons.svg";
		}

		setNamespacedAttribute(httpServletRequest, "block", _block);
		setNamespacedAttribute(httpServletRequest, "commerceAccountId", _commerceAccountId);
		setNamespacedAttribute(httpServletRequest, "currencyCode", _commerceAccountId);
		setNamespacedAttribute(httpServletRequest, "channelId", _commerceAccountId);
		setNamespacedAttribute(httpServletRequest, "disabled", _disabled);
		setNamespacedAttribute(httpServletRequest, "isInCart", _isInCart);
		setNamespacedAttribute(httpServletRequest, "options", _options);
		setNamespacedAttribute(httpServletRequest, "orderId", _orderId);
		setNamespacedAttribute(httpServletRequest, "skuId", _skuId);
		setNamespacedAttribute(httpServletRequest, "spritemap", _spritemap);
		setNamespacedAttribute(httpServletRequest, "stockQuantity", _stockQuantity);
		setNamespacedAttribute(httpServletRequest, "willUpdate", _willUpdate);
	}

	@Override
	protected String getPage() {
		return _PAGE;
	}

	@Override
	public void setPageContext(PageContext pageContext) {
		super.setPageContext(pageContext);

		servletContext = ServletContextUtil.getServletContext();
	}

	@Override
	protected void cleanUp() {
		_block = false;
		_commerceAccountId = 0;
		_skuId = 0;
		_spritemap = null;
		_stockQuantity = 0;
		_willUpdate = false;

		super.cleanUp();
	}

	private static final String _ATTRIBUTE_NAMESPACE =
		"liferay-commerce:add-to-order:";

	private static final String _PAGE = "/add_to_order/page.jsp";

	private boolean _block = false;
	private long _commerceAccountId = 0;
	private String _currencyCode;
	private long _channelId;
	private boolean _disabled;
	private boolean _isInCart;
	private String _options = "[]";
	private long _orderId;
	private long _skuId = 0;
	private int _stockQuantity = 0;
	private String _spritemap = null;
	private boolean _willUpdate = false;

	public long getCommerceAccountId() {
		return _commerceAccountId;
	}

	public void setCommerceAccountId(long commerceAccountId) {
		_commerceAccountId = commerceAccountId;
	}

	public long getSkuId() {
		return _skuId;
	}

	public void setSkuId(long skuId) {
		_skuId = skuId;
	}

	public String getSpritemap() {
		return _spritemap;
	}

	public void setSpritemap(String spritemap) {
		_spritemap = spritemap;
	}

	public String getCurrencyCode() {
		return _currencyCode;
	}

	public void setCurrencyCode(String currencyCode) {
		_currencyCode = currencyCode;
	}

	public long getChannelId() {
		return _channelId;
	}

	public void setChannelId(long channelId) {
		_channelId = channelId;
	}

	public boolean isInCart() {
		return _isInCart;
	}

	public void setIsInCart(boolean isInCart) {
		_isInCart = isInCart;
	}

	public long getOrderId() {
		return _orderId;
	}

	public void setOrderId(long orderId) {
		_orderId = orderId;
	}

	public boolean getBlock() {
		return _block;
	}

	public void setBlock(boolean block) {
		_block = block;
	}

	public String getOptions() {
		return _options;
	}

	public void setOptions(String options) {
		_options = options;
	}

	public boolean isDisabled() {
		return _disabled;
	}

	public void setDisabled(boolean disabled) {
		_disabled = disabled;
	}

	public int getStockQuantity() {
		return _stockQuantity;
	}

	public void setStockQuantity(int stockQuantity) {
		_stockQuantity = stockQuantity;
	}

	public boolean isWillUpdate() {
		return _willUpdate;
	}

	public void setWillUpdate(boolean willUpdate) {
		_willUpdate = willUpdate;
	}
}
