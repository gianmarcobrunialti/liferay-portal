package com.liferay.dotcom.playground.service;

import com.liferay.petra.string.StringPool;

import org.json.JSONObject;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

/**
 * Site lifecycle for the playground:
 *
 *   - lookup by external reference code (idempotency check)
 *   - create a private site
 *   - grant Site Member / Site Administrator via role association
 *
 * Assigning a site role makes the user a member; no separate "addMember"
 * call is needed against headless-admin-user (the corresponding endpoint
 * doesn't exist in this DXP release).
 */
@Service
public class SiteService {

	/**
	 * Adds {@code userId} as a member by assigning the built-in
	 * {@code L_SITE_MEMBER} role within the given site.
	 */
	public void addMember(long siteId, long userId) {
		_assignSiteRole("L_SITE_MEMBER", siteId, userId);
	}

	/**
	 * Creates a new private Site via {@code POST /sites}. Returns the new
	 * Site's JSON descriptor (includes {@code id} and {@code friendlyUrlPath}).
	 *
	 * Site initializer application against this newly-created site is a
	 * follow-up: Liferay's {@code PUT /sites/{erc}/site-initializer} requires
	 * a multipart body containing either a zip export or the initializer key
	 * as form data. Implement as a separate step when the multipart contract
	 * stabilizes for the current DXP release.
	 */
	public JSONObject createWithInitializer(
		String externalReferenceCode, String friendlyUrlPath, String displayName,
		String siteInitializerKey) {

		WebClient webClient = _headlessClient.webClient();

		JSONObject body = new JSONObject().put(
			"externalReferenceCode", externalReferenceCode
		).put(
			"friendlyUrlPath", _ensureLeadingSlash(friendlyUrlPath)
		).put(
			"membershipType", "private"
		).put(
			"name", displayName
		);

		String response = webClient.post(
		).uri(
			"/o/headless-admin-site/v1.0/sites"
		).bodyValue(
			body.toString()
		).retrieve(
		).bodyToMono(
			String.class
		).block(
			_headlessClient.defaultTimeout()
		);

		return new JSONObject(response);
	}

	/**
	 * Idempotency probe — returns the Site keyed by
	 * {@code externalReferenceCode}, or {@code null} when no such Site exists.
	 */
	public JSONObject findByExternalReferenceCode(String externalReferenceCode) {
		try {
			WebClient webClient = _headlessClient.webClient();

			String response = webClient.get(
			).uri(
				"/o/headless-admin-site/v1.0/sites/by-external-reference-code/{erc}",
				externalReferenceCode
			).retrieve(
			).bodyToMono(
				String.class
			).block(
				_headlessClient.defaultTimeout()
			);

			return new JSONObject(response);
		}
		catch (WebClientResponseException webClientResponseException) {
			if (webClientResponseException.getStatusCode() == HttpStatus.NOT_FOUND) {
				return null;
			}

			throw webClientResponseException;
		}
	}

	/**
	 * Grants the user the built-in Site Administrator role
	 * ({@code L_SITE_ADMINISTRATOR}) within the given site.
	 */
	public void grantSiteAdministrator(long siteId, long userId) {
		_assignSiteRole("L_SITE_ADMINISTRATOR", siteId, userId);
	}

	private void _assignSiteRole(
		String roleExternalReferenceCode, long siteId, long userId) {

		WebClient webClient = _headlessClient.webClient();

		try {
			webClient.post(
			).uri(
				"/o/headless-admin-user/v1.0/roles/by-external-reference-code/" +
					"{erc}/association/user-account/{userId}/site/{siteId}",
				roleExternalReferenceCode, userId, siteId
			).bodyValue(
				"{}"
			).retrieve(
			).toBodilessEntity(
			).block(
				_headlessClient.defaultTimeout()
			);
		}
		catch (WebClientResponseException webClientResponseException) {
			if (webClientResponseException.getStatusCode() ==
					HttpStatus.CONFLICT) {

				_log.info(
					"Role {} already assigned to user {} on site {}",
					roleExternalReferenceCode, userId, siteId);
			}
			else {
				throw webClientResponseException;
			}
		}
	}

	private String _ensureLeadingSlash(String path) {
		if ((path == null) || path.isEmpty()) {
			return StringPool.SLASH;
		}

		if (path.startsWith(StringPool.SLASH)) {
			return path;
		}

		return StringPool.SLASH + path;
	}

	private static final Logger _log = LoggerFactory.getLogger(
		SiteService.class);

	@Autowired
	private HeadlessClient _headlessClient;

}
