package com.liferay.dotcom.playground.service;

import com.liferay.client.extension.util.spring.boot3.client.LiferayOAuth2AccessTokenManager;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Low-level helper exposing an authenticated WebClient against the DXP host.
 *
 * Credentials come from the OAuth2 application headless server registered in
 * client-extension.yaml ({@code liferay-dotcom-playground-etc-spring-boot-oahs}).
 * The scopes there determine what this client is allowed to call.
 */
@Service
public class HeadlessClient {

	public String baseUrl() {
		return _lxcDXPServerProtocol + "://" + _lxcDXPMainDomain;
	}

	public Duration defaultTimeout() {
		return Duration.ofSeconds(30);
	}

	public String getMainDomain() {
		return _lxcDXPMainDomain;
	}

	public WebClient webClient() {
		return WebClient.builder(
		).baseUrl(
			baseUrl()
		).defaultHeader(
			HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE
		).defaultHeader(
			HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE
		).defaultHeader(
			HttpHeaders.AUTHORIZATION,
			_liferayOAuth2AccessTokenManager.getAuthorization(_OAHS_NAME)
		).build();
	}

	private static final String _OAHS_NAME =
		"liferay-dotcom-playground-etc-spring-boot-oahs";

	@Autowired
	private LiferayOAuth2AccessTokenManager _liferayOAuth2AccessTokenManager;

	@Value("${com.liferay.lxc.dxp.mainDomain}")
	private String _lxcDXPMainDomain;

	@Value("${com.liferay.lxc.dxp.server.protocol}")
	private String _lxcDXPServerProtocol;

}
