package com.liferay.commerce.frontend.taglib.servlet.taglib;

import com.liferay.commerce.frontend.taglib.internal.servlet.ServletContextUtil;
import com.liferay.taglib.util.IncludeTag;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.jsp.PageContext;

/**
 * @author Gianmarco Brunialti Masera
 */
public class AvailabilityLabelTag extends IncludeTag {
	@Override
	public void setAttributes(HttpServletRequest httpServletRequest) {
		setAttributeNamespace(_ATTRIBUTE_NAMESPACE);

		setNamespacedAttribute(httpServletRequest, "isLowStock", _isLowStock);
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
		_willUpdate = false;

		super.cleanUp();
	}

	private static final String _ATTRIBUTE_NAMESPACE =
		"liferay-commerce:availability-label:";

	private static final String _PAGE = "/availability_label/page.jsp";

	private boolean _isLowStock;
	private int _stockQuantity;
	private boolean _willUpdate = false;

	public boolean isLowStock() {
		return _isLowStock;
	}

	public void setIsLowStock(boolean isLowStock) {
		_isLowStock = isLowStock;
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
