package com.liferay.dotcom.playground.service;

import org.json.JSONObject;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.stereotype.Service;

/**
 * Orchestrates per-user playground site creation:
 *
 *   1. Idempotency check — does a site keyed `playground-{userId}` already
 *      exist? If yes, update enrollment status and exit.
 *   2. Create the site via Headless Admin Site with the playground site
 *      initializer applied.
 *   3. Add the user as a Site Member.
 *   4. Grant the user the built-in Site Administrator role for that site.
 *   5. Update the PlaygroundEnrollment object entry with siteId, friendlyURL,
 *      status=provisioned.
 *
 * On failure: update enrollment status=failed and write failureReason.
 *
 * Document Library quotas and the {@code playgroundCreatedDate} custom-field
 * stamp are not part of v1 — Liferay's portal-level site quota APIs are not
 * surfaced through Headless and would need either an OSGi configuration CX or
 * a follow-up Headless contract.
 */
@EnableAsync
@Service
public class PlaygroundProvisioner {

	@Async
	public void provisionAsync(
		long enrollmentId, long userId, String userScreenName,
		String userEmailAddress) {

		String externalReferenceCode = "playground-" + userId;
		String friendlyUrlPath = "/playground-" + userId;

		_log.info(
			"Provisioning playground site for userId={} (enrollment={}, " +
				"friendlyUrlPath={})",
			userId, enrollmentId, friendlyUrlPath);

		_enrollmentService.markProvisioning(enrollmentId);

		try {
			JSONObject site = _siteService.findByExternalReferenceCode(
				externalReferenceCode);

			if (site == null) {
				site = _siteService.createWithInitializer(
					externalReferenceCode, friendlyUrlPath,
					_displayName(userScreenName, userId), _siteInitializerKey);

				_log.info(
					"Created site id={} for userId={}", site.optLong("id"),
					userId);
			}
			else {
				_log.info(
					"Site already exists for userId={} — id={}", userId,
					site.optLong("id"));
			}

			long siteId = site.getLong("id");

			_siteService.addMember(siteId, userId);
			_siteService.grantSiteAdministrator(siteId, userId);

			_enrollmentService.markProvisioned(
				enrollmentId, siteId, site.optString("friendlyUrlPath"));

			_log.info(
				"Playground provisioned for userId={} siteId={}", userId, siteId);
		}
		catch (Exception exception) {
			_log.error(
				"Failed to provision playground for userId={}", userId, exception);

			_enrollmentService.markFailed(enrollmentId, exception.getMessage());
		}
	}

	private String _displayName(String screenName, long userId) {
		if ((screenName != null) && !screenName.isEmpty()) {
			return "Playground - " + screenName;
		}

		return "Playground - " + userId;
	}

	@Value("${playground.site.initializer.key:liferay-dotcom-playground-site-initializer}")
	private String _siteInitializerKey;

	private static final Logger _log = LoggerFactory.getLogger(
		PlaygroundProvisioner.class);

	@Autowired
	private EnrollmentService _enrollmentService;

	@Autowired
	private SiteService _siteService;

}
