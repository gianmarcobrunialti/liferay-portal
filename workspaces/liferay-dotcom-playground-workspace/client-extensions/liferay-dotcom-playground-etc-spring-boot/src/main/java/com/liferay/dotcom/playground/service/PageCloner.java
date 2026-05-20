package com.liferay.dotcom.playground.service;

import java.net.URI;

import java.util.UUID;

import org.json.JSONArray;
import org.json.JSONObject;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

/**
 * Same-instance page cloning. Resolves a Liferay page URL on this DXP host,
 * fetches the page-definition via Headless Delivery, validates fragment
 * references, and posts the page-definition into the target playground site.
 *
 * Missing-fragment fallback: any fragment referenced by the source page that
 * isn't resolvable from the playground site (Global + site scope) is rewritten
 * to a {@code missing-fragment} placeholder so the import succeeds.
 *
 * The expected URL shape is the standard Liferay layout URL:
 *
 *   {protocol}://{host}/web/{site-friendly-url}/{page-friendly-url}
 *   {protocol}://{host}/group/{site-friendly-url}/{page-friendly-url}
 */
@Service
public class PageCloner {

	public String cloneToPlayground(String sourceUrl, long targetSiteId)
		throws Exception {

		URI uri = URI.create(sourceUrl);

		String host = uri.getHost();

		if ((host == null) || !host.equals(_headlessClient.getMainDomain())) {
			throw new IllegalArgumentException(
				"sourceUrl must be on the same Liferay instance");
		}

		String[] parsed = _parsePath(uri.getPath());

		String siteFriendlyUrl = parsed[0];
		String pageFriendlyUrl = parsed[1];

		_log.info(
			"Cloning source site={} page={} into siteId={}", siteFriendlyUrl,
			pageFriendlyUrl, targetSiteId);

		long sourceSiteId = _resolveSiteId(siteFriendlyUrl);

		JSONObject pageDefinition = _fetchPageDefinition(
			sourceSiteId, pageFriendlyUrl);

		_swapMissingFragments(pageDefinition, targetSiteId);

		String newFriendlyUrl = _uniqueFriendlyUrl(pageFriendlyUrl);

		_postPage(
			targetSiteId, newFriendlyUrl, pageFriendlyUrl, pageDefinition);

		return newFriendlyUrl;
	}

	private JSONObject _fetchPageDefinition(
		long sourceSiteId, String pageFriendlyUrl) {

		WebClient webClient = _headlessClient.webClient();

		String response = webClient.get(
		).uri(
			uri -> uri.path(
				"/o/headless-delivery/v1.0/sites/{siteId}/site-pages/by-friendly-url-path/page-definition"
			).queryParam(
				"friendlyUrlPath", pageFriendlyUrl
			).build(
				sourceSiteId
			)
		).retrieve(
		).bodyToMono(
			String.class
		).block(
			_headlessClient.defaultTimeout()
		);

		return new JSONObject(response);
	}

	private boolean _fragmentExists(long siteId, String fragmentKey) {
		try {
			WebClient webClient = _headlessClient.webClient();

			webClient.get(
			).uri(
				"/o/headless-delivery/v1.0/sites/{siteId}/fragments/by-key/{key}",
				siteId, fragmentKey
			).retrieve(
			).toBodilessEntity(
			).block(
				_headlessClient.defaultTimeout()
			);

			return true;
		}
		catch (WebClientResponseException webClientResponseException) {
			if (webClientResponseException.getStatusCode() == HttpStatus.NOT_FOUND) {
				return false;
			}

			throw webClientResponseException;
		}
	}

	private String[] _parsePath(String path) {
		String[] segments = path.replaceAll("^/+", "").split("/");

		if ((segments.length < 3) ||
			(!segments[0].equals("web") && !segments[0].equals("group"))) {

			throw new IllegalArgumentException(
				"URL must look like /web/{site}/{page} — got: " + path);
		}

		String siteFriendlyUrl = "/" + segments[1];

		StringBuilder pagePath = new StringBuilder();

		for (int i = 2; i < segments.length; i++) {
			pagePath.append('/').append(segments[i]);
		}

		return new String[] {siteFriendlyUrl, pagePath.toString()};
	}

	private void _postPage(
		long targetSiteId, String friendlyUrlPath, String originalPath,
		JSONObject pageDefinition) {

		WebClient webClient = _headlessClient.webClient();

		String pageName = "Clone of " + originalPath;

		JSONObject body = new JSONObject().put(
			"friendlyUrlPath", friendlyUrlPath
		).put(
			"hidden", false
		).put(
			"name", pageName
		).put(
			"pageDefinition", pageDefinition
		).put(
			"type", "Content"
		);

		webClient.post(
		).uri(
			"/o/headless-delivery/v1.0/sites/{siteId}/site-pages", targetSiteId
		).bodyValue(
			body.toString()
		).retrieve(
		).toBodilessEntity(
		).block(
			_headlessClient.defaultTimeout()
		);
	}

	private long _resolveSiteId(String siteFriendlyUrl) {
		WebClient webClient = _headlessClient.webClient();

		String response = webClient.get(
		).uri(
			uri -> uri.path(
				"/o/headless-admin-site/v1.0/sites"
			).queryParam(
				"filter", "friendlyUrlPath eq '" + siteFriendlyUrl + "'"
			).queryParam(
				"pageSize", 1
			).build()
		).retrieve(
		).bodyToMono(
			String.class
		).block(
			_headlessClient.defaultTimeout()
		);

		JSONArray items = new JSONObject(response).optJSONArray("items");

		if ((items == null) || items.isEmpty()) {
			throw new IllegalArgumentException(
				"No site found for friendlyUrlPath=" + siteFriendlyUrl);
		}

		return items.getJSONObject(0).getLong("id");
	}

	/**
	 * Walks the page-definition tree recursively. Any Fragment element whose
	 * key cannot be resolved in the target site's visibility (Global + site)
	 * gets rewritten to the {@code missing-fragment} placeholder shipped by
	 * the playground site initializer.
	 */
	private void _swapMissingFragments(
		JSONObject pageDefinition, long targetSiteId) {

		JSONObject root = pageDefinition.optJSONObject("pageElement");

		if (root != null) {
			_walkAndSwap(root, targetSiteId);
		}
	}

	private String _uniqueFriendlyUrl(String original) {
		return original + "-" +
			UUID.randomUUID().toString().substring(0, 8);
	}

	private void _walkAndSwap(JSONObject element, long targetSiteId) {
		String type = element.optString("type");

		if ("Fragment".equals(type)) {
			JSONObject definition = element.optJSONObject("definition");

			if (definition != null) {
				JSONObject fragment = definition.optJSONObject("fragment");

				if (fragment != null) {
					String key = fragment.optString("key");

					if (!key.isEmpty() &&
						!_fragmentExists(targetSiteId, key)) {

						_log.info(
							"Fragment {} missing in site {}, swapping for " +
								"placeholder",
							key, targetSiteId);

						fragment.put("key", _placeholderFragmentKey);
					}
				}
			}
		}

		JSONArray children = element.optJSONArray("pageElements");

		if (children != null) {
			for (int i = 0; i < children.length(); i++) {
				_walkAndSwap(children.getJSONObject(i), targetSiteId);
			}
		}
	}

	private final String _placeholderFragmentKey = "missing-fragment";

	private static final Logger _log = LoggerFactory.getLogger(PageCloner.class);

	@Autowired
	private HeadlessClient _headlessClient;

}
