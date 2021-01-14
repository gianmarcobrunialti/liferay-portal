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
public class AddToWishListTag extends IncludeTag {
	@Override
	public void setAttributes(HttpServletRequest httpServletRequest) {
		setAttributeNamespace(_ATTRIBUTE_NAMESPACE);

		if (Validator.isNull(_spritemap)) {
			ThemeDisplay themeDisplay = (ThemeDisplay) httpServletRequest.getAttribute(WebKeys.THEME_DISPLAY);

			_spritemap = themeDisplay.getPathThemeImages() + "/clay/icons.svg";
		}

		setNamespacedAttribute(httpServletRequest, "commerceAccountId", _commerceAccountId);
		setNamespacedAttribute(httpServletRequest, "cpDefinitionId", _cpDefinitionId);
		setNamespacedAttribute(httpServletRequest, "isInWishList", _isInWishList);
		setNamespacedAttribute(httpServletRequest, "large", _large);
		setNamespacedAttribute(httpServletRequest, "skuId", _skuId);
		setNamespacedAttribute(httpServletRequest, "spritemap", _spritemap);
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
		_commerceAccountId = 0;
		_isInWishList = false;
		_large = false;
		_skuId = 0;
		_spritemap = null;

		super.cleanUp();
	}

	private static final String _ATTRIBUTE_NAMESPACE =
		"liferay-commerce:add-to-wish-list:";

	private static final String _PAGE = "/add_to_wish_list/page.jsp";

	private long _commerceAccountId = 0;
	private long _cpDefinitionId;
	private boolean _large = false;
	private boolean _isInWishList = false;
	private long _skuId = 0;
	private String _spritemap = null;

	public long getCommerceAccountId() {
		return _commerceAccountId;
	}

	public void setCommerceAccountId(long commerceAccountId) {
		_commerceAccountId = commerceAccountId;
	}

	public long getCpDefinitionId() {
		return _cpDefinitionId;
	}

	public void setCpDefinitionId(long cpDefinitionId) {
		_cpDefinitionId = cpDefinitionId;
	}

	public boolean isInWishList() {
		return _isInWishList;
	}

	public void setIsInWishList(boolean isInWishList) {
		_isInWishList = isInWishList;
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

	public boolean isLarge() {
		return _large;
	}

	public void setLarge(boolean large) {
		_large = large;
	}
}
