/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.cdn.internal.cacheability;

import com.liferay.portal.kernel.model.Layout;
import com.liferay.portal.kernel.test.ReflectionTestUtil;
import com.liferay.portal.kernel.test.util.RandomTestUtil;
import com.liferay.portal.test.rule.LiferayUnitTestRule;
import com.liferay.segments.constants.SegmentsWebKeys;
import com.liferay.segments.service.SegmentsExperienceLocalService;

import org.junit.Assert;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Test;

import org.mockito.Mockito;

import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

/**
 * @author Gianmarco Brunialti Masera
 */
public class SegmentsExperienceCDNCacheabilityRuleTest {

	@ClassRule
	public static final LiferayUnitTestRule liferayUnitTestRule =
		LiferayUnitTestRule.INSTANCE;

	@Before
	public void setUp() {
		Mockito.when(
			_layout.getGroupId()
		).thenReturn(
			_GROUP_ID
		);

		Mockito.when(
			_layout.getPlid()
		).thenReturn(
			_PLID
		);

		ReflectionTestUtil.setFieldValue(
			_segmentsExperienceCDNCacheabilityRule,
			"_segmentsExperienceLocalService", _segmentsExperienceLocalService);
	}

	@Test
	public void testIsShareable() {
		Assert.assertTrue(_isShareable());

		Mockito.verifyNoInteractions(_segmentsExperienceLocalService);

		_mockHttpServletRequest.setAttribute(
			SegmentsWebKeys.SEGMENTS_EXPERIENCE_IDS,
			new long[] {RandomTestUtil.randomLong()});

		_setSegmentsExperiencesCount(1);

		Assert.assertTrue(_isShareable());

		_setSegmentsExperiencesCount(2);

		Assert.assertFalse(_isShareable());
	}

	private boolean _isShareable() {
		return _segmentsExperienceCDNCacheabilityRule.isShareable(
			_mockHttpServletRequest, new MockHttpServletResponse(), _layout);
	}

	private void _setSegmentsExperiencesCount(int segmentsExperiencesCount) {
		Mockito.when(
			_segmentsExperienceLocalService.getSegmentsExperiencesCount(
				_GROUP_ID, _PLID)
		).thenReturn(
			segmentsExperiencesCount
		);
	}

	private static final long _GROUP_ID = RandomTestUtil.randomLong();

	private static final long _PLID = RandomTestUtil.randomLong();

	private final Layout _layout = Mockito.mock(Layout.class);
	private final MockHttpServletRequest _mockHttpServletRequest =
		new MockHttpServletRequest();
	private final SegmentsExperienceCDNCacheabilityRule
		_segmentsExperienceCDNCacheabilityRule =
			new SegmentsExperienceCDNCacheabilityRule();
	private final SegmentsExperienceLocalService
		_segmentsExperienceLocalService = Mockito.mock(
			SegmentsExperienceLocalService.class);

}