package com.liferay.dotcom.playground.service;

import org.json.JSONObject;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * CRUD against the {@code PlaygroundEnrollment} custom Object, addressed via
 * the auto-generated REST endpoint at {@code /o/c/playgroundenrollments}.
 *
 * The Object is defined in the {@code liferay-dotcom-playground-batch} CX.
 */
@Service
public class EnrollmentService {

	public void markFailed(long enrollmentId, String reason) {
		_patch(
			enrollmentId,
			new JSONObject().put(
				"enrollmentStatus", "failed"
			).put(
				"failureReason", reason
			));
	}

	public void markProvisioned(
		long enrollmentId, long siteId, String siteFriendlyURL) {

		_patch(
			enrollmentId,
			new JSONObject().put(
				"enrollmentStatus", "provisioned"
			).put(
				"liferaySiteId", siteId
			).put(
				"siteFriendlyURL", siteFriendlyURL
			));
	}

	public void markProvisioning(long enrollmentId) {
		_patch(
			enrollmentId,
			new JSONObject().put("enrollmentStatus", "provisioning"));
	}

	private void _patch(long enrollmentId, JSONObject body) {
		try {
			WebClient webClient = _headlessClient.webClient();

			webClient.patch(
			).uri(
				"/o/c/playgroundenrollments/{id}", enrollmentId
			).bodyValue(
				body.toString()
			).retrieve(
			).toBodilessEntity(
			).block(
				_headlessClient.defaultTimeout()
			);
		}
		catch (Exception exception) {
			_log.warn(
				"Failed to PATCH enrollment {}: {}", enrollmentId,
				exception.getMessage());
		}
	}

	private static final Logger _log = LoggerFactory.getLogger(
		EnrollmentService.class);

	@Autowired
	private HeadlessClient _headlessClient;

}
