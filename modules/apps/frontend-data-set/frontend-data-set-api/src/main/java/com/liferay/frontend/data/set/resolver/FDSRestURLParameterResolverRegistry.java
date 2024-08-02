package com.liferay.frontend.data.set.resolver;

public interface FDSRestURLParameterResolverRegistry {
	public FDSRestURLParameterResolver getFDSRestURLParameterResolver(String restEndpoint);
}
