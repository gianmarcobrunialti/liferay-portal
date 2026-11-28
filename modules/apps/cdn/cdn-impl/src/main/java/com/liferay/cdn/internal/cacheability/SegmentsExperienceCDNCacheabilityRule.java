/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.cdn.internal.cacheability;

import com.liferay.cdn.cacheability.CDNCacheabilityRule;
import com.liferay.portal.kernel.model.Layout;
import com.liferay.segments.constants.SegmentsWebKeys;
import com.liferay.segments.service.SegmentsExperienceLocalService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

/**
 * Vetoes sharing a page that has more than its default experience. Which
 * experience a guest sees depends on the guest's segments, whose criteria can
 * read cookies, the URL, the date, or anything else about the request, and an
 * A/B test picks a variant at random. Every variant of an A/B test is an
 * experience of the page, so a page with an A/B test always has more than one
 * experience.
 *
 * <p>
 * The rule counts the experiences of the page whatever their segments,
 * priority, or status, so it never has to reproduce how the segments
 * application selects an experience. It reads the experiences that the
 * segments application selected for the request first: when there are none,
 * segmentation is disabled or the page is neither a content page nor a display
 * page, so every guest sees the same page and the rule makes no lookup.
 * Otherwise, the count is served by the finder cache.
 * </p>
 *
 * @author Gianmarco Brunialti Masera
 */
@Component(service = CDNCacheabilityRule.class)
public class SegmentsExperienceCDNCacheabilityRule
	implements CDNCacheabilityRule {

	@Override
	public boolean isShareable(
		HttpServletRequest httpServletRequest,
		HttpServletResponse httpServletResponse, Layout layout) {

		Object segmentsExperienceIds = httpServletRequest.getAttribute(
			SegmentsWebKeys.SEGMENTS_EXPERIENCE_IDS);

		if (segmentsExperienceIds == null) {
			return true;
		}

		int segmentsExperiencesCount =
			_segmentsExperienceLocalService.getSegmentsExperiencesCount(
				layout.getGroupId(), layout.getPlid());

		if (segmentsExperiencesCount > 1) {
			return false;
		}

		return true;
	}

	@Reference
	private SegmentsExperienceLocalService _segmentsExperienceLocalService;

}