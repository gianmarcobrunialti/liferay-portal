package com.liferay.dotcom.playground.rest;

import com.liferay.client.extension.util.spring.boot3.BaseRestController;
import com.liferay.dotcom.playground.service.PageCloner;

import org.json.JSONObject;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Called by the URL Cloner custom element on the landing page. Clones a
 * same-instance Liferay page into the calling user's playground site.
 *
 * Expected body:
 *   {"sourceUrl": "https://host/web/some-site/some-page", "targetSiteId": 123}
 */
@RequestMapping("/clone-page")
@RestController
public class PageClonerRestController extends BaseRestController {

	@PostMapping
	public ResponseEntity<String> clone(@RequestBody String body) {
		JSONObject json = new JSONObject(body);

		String sourceUrl = json.optString("sourceUrl");
		long targetSiteId = json.optLong("targetSiteId");

		if (sourceUrl.isEmpty() || (targetSiteId == 0)) {
			return ResponseEntity.badRequest().body(
				"sourceUrl and targetSiteId are required");
		}

		try {
			String clonedFriendlyURL = _pageCloner.cloneToPlayground(
				sourceUrl, targetSiteId);

			return ResponseEntity.ok(
				new JSONObject().put("friendlyURL", clonedFriendlyURL).toString());
		}
		catch (Exception exception) {
			return ResponseEntity.internalServerError().body(
				exception.getMessage());
		}
	}

	@Autowired
	private PageCloner _pageCloner;

}
