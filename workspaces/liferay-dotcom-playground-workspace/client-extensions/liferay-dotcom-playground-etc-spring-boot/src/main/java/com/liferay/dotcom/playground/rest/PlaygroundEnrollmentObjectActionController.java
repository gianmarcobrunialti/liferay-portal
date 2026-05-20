package com.liferay.dotcom.playground.rest;

import com.liferay.client.extension.util.spring.boot3.BaseRestController;
import com.liferay.dotcom.playground.service.PlaygroundProvisioner;

import org.json.JSONObject;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Invoked by the PlaygroundEnrollment Object Action when a new enrollment
 * record is created. Delegates to the provisioner and returns immediately —
 * the actual site creation runs asynchronously.
 *
 * Liferay's Object Action webhook body shape varies across DXP versions. We
 * accept any of:
 *   {"objectEntry": {"id": .., "properties": {"liferayUserId": ..}}}
 *   {"objectEntryDTOPlaygroundEnrollment": {"id": .., "liferayUserId": ..}}
 *   {"id": .., "liferayUserId": ..}
 *   {"objectEntry": {"id": .., "liferayUserId": ..}}
 */
@RequestMapping("/object/action/enrollment")
@RestController
public class PlaygroundEnrollmentObjectActionController
	extends BaseRestController {

	@PostMapping
	public ResponseEntity<String> handle(@RequestBody String body) {
		_log.info("Received Object Action webhook: {}", body);

		JSONObject json = new JSONObject(body);

		Long enrollmentId = _findLong(json, "id");
		Long liferayUserId = _findLong(json, "liferayUserId");
		String userScreenName = _findString(json, "userScreenName");
		String userEmailAddress = _findString(json, "userEmailAddress");

		if ((liferayUserId == null) || (liferayUserId == 0) ||
			(enrollmentId == null)) {

			_log.warn(
				"Enrollment {} is missing liferayUserId in payload: {}",
				enrollmentId, body);

			return ResponseEntity.badRequest().body(
				"missing liferayUserId or enrollment id");
		}

		_provisioner.provisionAsync(
			enrollmentId, liferayUserId, userScreenName, userEmailAddress);

		return ResponseEntity.accepted().body("queued");
	}

	private Long _findLong(JSONObject json, String key) {
		if (json.has(key)) {
			long value = json.optLong(key);

			if (value != 0) {
				return value;
			}
		}

		for (String childKey : json.keySet()) {
			JSONObject child = json.optJSONObject(childKey);

			if (child != null) {
				Long found = _findLong(child, key);

				if (found != null) {
					return found;
				}
			}
		}

		return null;
	}

	private String _findString(JSONObject json, String key) {
		if (json.has(key)) {
			String value = json.optString(key);

			if (!value.isEmpty()) {
				return value;
			}
		}

		for (String childKey : json.keySet()) {
			JSONObject child = json.optJSONObject(childKey);

			if (child != null) {
				String found = _findString(child, key);

				if (found != null) {
					return found;
				}
			}
		}

		return null;
	}

	private static final Logger _log = LoggerFactory.getLogger(
		PlaygroundEnrollmentObjectActionController.class);

	@Autowired
	private PlaygroundProvisioner _provisioner;

}
