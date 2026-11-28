/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.cdn.purge;

import com.liferay.petra.string.StringBundler;
import com.liferay.portal.kernel.util.Validator;

import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

/**
 * @author Gianmarco Brunialti Masera
 */
public class CDNPurgeRequest {

	public static Builder builder() {
		return new Builder();
	}

	/**
	 * Returns the cache tags keyed by the ID of the site they belong to. The
	 * cache tags that belong to no site are keyed by <code>0</code>. When the
	 * CDN purges by cache tag and a site has more cache tags than the CDN
	 * purges with one request, the site's cache tag is purged instead.
	 */
	public Map<Long, Set<String>> getGroupTags() {
		return _groupTags;
	}

	public Set<String> getTags() {
		return _tags;
	}

	public Set<String> getURLs() {
		return _urls;
	}

	public boolean isEmpty() {
		if (!_purgeAll && _tags.isEmpty() && _urls.isEmpty()) {
			return true;
		}

		return false;
	}

	public boolean isPurgeAll() {
		return _purgeAll;
	}

	/**
	 * Returns whether the request allows a soft purge. A soft purge is only
	 * sent when the company configuration and the provider also allow it.
	 */
	public boolean isSoft() {
		return _soft;
	}

	@Override
	public String toString() {
		return StringBundler.concat(
			"{purgeAll=", _purgeAll, ", soft=", _soft, ", tags=", _tags,
			", urls=", _urls, "}");
	}

	public static class Builder {

		public CDNPurgeRequest build() {
			return new CDNPurgeRequest(this);
		}

		public Builder purgeAll(boolean purgeAll) {
			_purgeAll = purgeAll;

			return this;
		}

		public Builder soft(boolean soft) {
			_soft = soft;

			return this;
		}

		public Builder tags(Collection<String> tags) {
			return tags(0, tags);
		}

		/**
		 * Adds cache tags that belong to the site. The pages of the site must
		 * carry the site's cache tag wherever they carry these cache tags,
		 * because the site's cache tag may be purged instead. A group ID of
		 * <code>0</code> adds cache tags that belong to no site.
		 */
		public Builder tags(long groupId, Collection<String> tags) {
			Set<String> groupTags = _groupTags.computeIfAbsent(
				groupId, key -> new LinkedHashSet<>());

			for (String tag : tags) {
				if (Validator.isNull(tag)) {
					continue;
				}

				groupTags.add(tag);
			}

			if (groupTags.isEmpty()) {
				_groupTags.remove(groupId);
			}

			return this;
		}

		public Builder tags(String... tags) {
			return tags(Arrays.asList(tags));
		}

		public Builder urls(Collection<String> urls) {
			for (String url : urls) {
				if (Validator.isNull(url)) {
					continue;
				}

				_urls.add(url);
			}

			return this;
		}

		public Builder urls(String... urls) {
			return urls(Arrays.asList(urls));
		}

		private final Map<Long, Set<String>> _groupTags = new LinkedHashMap<>();
		private boolean _purgeAll;
		private boolean _soft = true;
		private final Set<String> _urls = new LinkedHashSet<>();

	}

	private CDNPurgeRequest(Builder builder) {
		Map<Long, Set<String>> groupTags = new LinkedHashMap<>();
		Set<String> tags = new LinkedHashSet<>();

		for (Map.Entry<Long, Set<String>> entry :
				builder._groupTags.entrySet()) {

			groupTags.put(
				entry.getKey(),
				Collections.unmodifiableSet(
					new LinkedHashSet<>(entry.getValue())));
			tags.addAll(entry.getValue());
		}

		_groupTags = Collections.unmodifiableMap(groupTags);
		_purgeAll = builder._purgeAll;
		_soft = builder._soft;
		_tags = Collections.unmodifiableSet(tags);
		_urls = Collections.unmodifiableSet(new LinkedHashSet<>(builder._urls));
	}

	private final Map<Long, Set<String>> _groupTags;
	private final boolean _purgeAll;
	private final boolean _soft;
	private final Set<String> _tags;
	private final Set<String> _urls;

}