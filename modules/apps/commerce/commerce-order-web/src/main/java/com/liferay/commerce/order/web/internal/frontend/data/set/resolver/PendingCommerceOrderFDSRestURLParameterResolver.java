package com.liferay.commerce.order.web.internal.frontend.data.set.resolver;

import com.liferay.commerce.constants.CommerceWebKeys;
import com.liferay.commerce.context.CommerceContext;
import com.liferay.frontend.data.set.resolver.FDSRestURLParameterResolver;
import org.osgi.service.component.annotations.Component;

import javax.servlet.http.HttpServletRequest;

@Component(
	property = "fds.rest.url.parameter.resolver.key=",
	service = FDSRestURLParameterResolver.class
)
public class PendingCommerceOrderFDSRestURLParameterResolver implements
	FDSRestURLParameterResolver {

	@Override
	public String resolve(
		String apiURL, HttpServletRequest httpServletRequest) {
		CommerceContext commerceContext = (CommerceContext)httpServletRequest.getAttribute(
			CommerceWebKeys.COMMERCE_CONTEXT);

		return "";
	}
}
