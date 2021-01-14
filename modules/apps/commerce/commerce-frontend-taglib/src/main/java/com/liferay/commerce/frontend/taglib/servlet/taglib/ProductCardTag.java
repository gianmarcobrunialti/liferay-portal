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

package com.liferay.commerce.frontend.taglib.servlet.taglib;

import com.liferay.commerce.frontend.taglib.internal.servlet.ServletContextUtil;
import com.liferay.taglib.util.IncludeTag;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.jsp.PageContext;
import java.util.HashMap;

/**
 * @author Gianmarco Brunialti Masera
 */
public class ProductCardTag extends IncludeTag {
	@Override
	public void setAttributes(HttpServletRequest httpServletRequest) {
		setAttributeNamespace(_ATTRIBUTE_NAMESPACE);

		setNamespacedAttribute(
			httpServletRequest, "displayProductInformation", _displayProductInformation);
		setNamespacedAttribute(httpServletRequest, "elementClasses", _elementClasses);
	}

	@Override
	protected String getPage() {
		return _PAGE;
	}

	public void setElementClasses(String elementClasses) {
		_elementClasses = elementClasses;
	}

	@Override
	public void setPageContext(PageContext pageContext) {
		super.setPageContext(pageContext);

		servletContext = ServletContextUtil.getServletContext();
	}

	@Override
	protected void cleanUp() {
		super.cleanUp();
	}

	private static final String _ATTRIBUTE_NAMESPACE =
		"liferay-commerce:product-card:";

	private static final String _PAGE = "/product_card/page.jsp";

	private HashMap<String, Object> _displayProductInformation;
	private String _elementClasses;

	public HashMap<String, Object> getDisplayProductInformation() {
		return _displayProductInformation;
	}

	public void setDisplayProductInformation(HashMap<String, Object> context) {
		_displayProductInformation = context;
	}
}
