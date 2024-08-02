package com.liferay.frontend.data.set.resolver;

import javax.servlet.http.HttpServletRequest;

public interface FDSRestURLParameterResolver {
	public String resolve(String apiURL, HttpServletRequest httpServletRequest);
}
