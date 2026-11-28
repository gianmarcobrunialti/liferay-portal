/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.cdn.internal.service;

import com.liferay.asset.kernel.model.AssetEntry;
import com.liferay.asset.kernel.service.AssetEntryLocalService;
import com.liferay.blogs.model.BlogsEntry;
import com.liferay.blogs.service.BlogsEntryLocalService;
import com.liferay.cdn.purge.CDNPurgeManager;
import com.liferay.document.library.kernel.model.DLFileEntry;
import com.liferay.document.library.kernel.service.DLFileEntryLocalService;
import com.liferay.journal.model.JournalArticle;
import com.liferay.journal.service.JournalArticleLocalService;
import com.liferay.object.model.ObjectDefinition;
import com.liferay.object.model.ObjectEntry;
import com.liferay.object.service.ObjectDefinitionLocalService;
import com.liferay.object.service.ObjectEntryLocalService;
import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.test.ReflectionTestUtil;
import com.liferay.portal.kernel.test.util.RandomTestUtil;
import com.liferay.portal.kernel.workflow.WorkflowConstants;
import com.liferay.portal.test.rule.LiferayUnitTestRule;

import org.junit.Assert;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Test;

import org.mockito.Mockito;

/**
 * @author Gianmarco Brunialti Masera
 */
public class CDNAssetEntryLocalServiceWrapperTest {

	@ClassRule
	public static final LiferayUnitTestRule liferayUnitTestRule =
		LiferayUnitTestRule.INSTANCE;

	@Before
	public void setUp() {
		_cdnAssetEntryLocalServiceWrapper.setWrappedService(
			_assetEntryLocalService);

		ReflectionTestUtil.setFieldValue(
			_cdnAssetEntryLocalServiceWrapper, "_blogsEntryLocalService",
			_blogsEntryLocalService);
		ReflectionTestUtil.setFieldValue(
			_cdnAssetEntryLocalServiceWrapper, "_cdnPurgeManager",
			_cdnPurgeManager);
		ReflectionTestUtil.setFieldValue(
			_cdnAssetEntryLocalServiceWrapper, "_dlFileEntryLocalService",
			_dlFileEntryLocalService);
		ReflectionTestUtil.setFieldValue(
			_cdnAssetEntryLocalServiceWrapper, "_journalArticleLocalService",
			_journalArticleLocalService);
		ReflectionTestUtil.setFieldValue(
			_cdnAssetEntryLocalServiceWrapper, "_objectDefinitionLocalService",
			_objectDefinitionLocalService);
		ReflectionTestUtil.setFieldValue(
			_cdnAssetEntryLocalServiceWrapper, "_objectEntryLocalService",
			_objectEntryLocalService);

		Mockito.when(
			_assetEntry.getCompanyId()
		).thenReturn(
			_COMPANY_ID
		);

		Mockito.when(
			_objectDefinitionLocalService.fetchObjectDefinitionByClassName(
				_COMPANY_ID, _CLASS_NAME)
		).thenReturn(
			Mockito.mock(ObjectDefinition.class)
		);

		Mockito.when(
			_objectEntryLocalService.fetchObjectEntry(_CLASS_PK)
		).thenReturn(
			_objectEntry
		);
	}

	@Test
	public void testUpdateEntry() throws Exception {

		// Asset entry that guests cannot see

		_setUp(true, false);

		Assert.assertSame(_assetEntry, _updateEntry());

		Mockito.verifyNoInteractions(_objectEntryLocalService);

		// Asset entry that guests see

		_setUp(true, true);

		Assert.assertSame(_assetEntry, _updateEntry());

		Mockito.verify(
			_cdnPurgeManager
		).purge(
			_objectEntry
		);

		// Disabled CDN

		Mockito.reset(_cdnPurgeManager);

		_setUp(false, true);

		_updateEntry();

		Mockito.verify(
			_cdnPurgeManager, Mockito.never()
		).purge(
			_objectEntry
		);

		// Failed update

		Mockito.reset(_cdnPurgeManager);

		_setUp(true, true);

		Mockito.when(
			_assetEntryLocalService.updateEntry(
				_USER_ID, _GROUP_ID, _CLASS_NAME, _CLASS_PK, _CATEGORY_IDS,
				_TAG_NAMES)
		).thenThrow(
			new PortalException()
		);

		Assert.assertThrows(PortalException.class, this::_updateEntry);

		Mockito.verify(
			_cdnPurgeManager, Mockito.never()
		).purge(
			_objectEntry
		);
	}

	@Test
	public void testUpdateEntryWithContentTypes() throws Exception {
		Mockito.when(
			_assetEntry.isVisible()
		).thenReturn(
			true
		);

		Mockito.when(
			_cdnPurgeManager.isEnabled(_COMPANY_ID)
		).thenReturn(
			true
		);

		// Blogs entry

		BlogsEntry blogsEntry = Mockito.mock(BlogsEntry.class);

		Mockito.when(
			_blogsEntryLocalService.fetchBlogsEntry(_CLASS_PK)
		).thenReturn(
			blogsEntry
		);

		_updateEntry(BlogsEntry.class.getName());

		Mockito.verify(
			_cdnPurgeManager
		).purge(
			blogsEntry
		);

		// Document

		DLFileEntry dlFileEntry = Mockito.mock(DLFileEntry.class);

		Mockito.when(
			_dlFileEntryLocalService.fetchDLFileEntry(_CLASS_PK)
		).thenReturn(
			dlFileEntry
		);

		_updateEntry(DLFileEntry.class.getName());

		Mockito.verify(
			_cdnPurgeManager
		).purge(
			dlFileEntry
		);

		// Other asset

		_updateEntry(RandomTestUtil.randomString());

		Mockito.verifyNoInteractions(_objectEntryLocalService);

		// Web content

		JournalArticle journalArticle = Mockito.mock(JournalArticle.class);

		Mockito.when(
			_journalArticleLocalService.fetchLatestArticle(
				_CLASS_PK, WorkflowConstants.STATUS_APPROVED)
		).thenReturn(
			journalArticle
		);

		_updateEntry(JournalArticle.class.getName());

		Mockito.verify(
			_cdnPurgeManager
		).purge(
			journalArticle
		);
	}

	private void _setUp(boolean enabled, boolean visible) throws Exception {
		Mockito.when(
			_assetEntry.isVisible()
		).thenReturn(
			visible
		);

		Mockito.when(
			_assetEntryLocalService.updateEntry(
				_USER_ID, _GROUP_ID, _CLASS_NAME, _CLASS_PK, _CATEGORY_IDS,
				_TAG_NAMES)
		).thenReturn(
			_assetEntry
		);

		Mockito.when(
			_cdnPurgeManager.isEnabled(_COMPANY_ID)
		).thenReturn(
			enabled
		);
	}

	private AssetEntry _updateEntry() throws Exception {
		return _cdnAssetEntryLocalServiceWrapper.updateEntry(
			_USER_ID, _GROUP_ID, _CLASS_NAME, _CLASS_PK, _CATEGORY_IDS,
			_TAG_NAMES);
	}

	private void _updateEntry(String className) throws Exception {
		Mockito.when(
			_assetEntryLocalService.updateEntry(
				_USER_ID, _GROUP_ID, className, _CLASS_PK, _CATEGORY_IDS,
				_TAG_NAMES)
		).thenReturn(
			_assetEntry
		);

		_cdnAssetEntryLocalServiceWrapper.updateEntry(
			_USER_ID, _GROUP_ID, className, _CLASS_PK, _CATEGORY_IDS,
			_TAG_NAMES);
	}

	private static final long[] _CATEGORY_IDS = {RandomTestUtil.randomLong()};

	private static final String _CLASS_NAME = RandomTestUtil.randomString();

	private static final long _CLASS_PK = RandomTestUtil.randomLong();

	private static final long _COMPANY_ID = RandomTestUtil.randomLong();

	private static final long _GROUP_ID = RandomTestUtil.randomLong();

	private static final String[] _TAG_NAMES = {RandomTestUtil.randomString()};

	private static final long _USER_ID = RandomTestUtil.randomLong();

	private final AssetEntry _assetEntry = Mockito.mock(AssetEntry.class);
	private final AssetEntryLocalService _assetEntryLocalService = Mockito.mock(
		AssetEntryLocalService.class);
	private final BlogsEntryLocalService _blogsEntryLocalService = Mockito.mock(
		BlogsEntryLocalService.class);
	private final CDNAssetEntryLocalServiceWrapper
		_cdnAssetEntryLocalServiceWrapper =
			new CDNAssetEntryLocalServiceWrapper();
	private final CDNPurgeManager _cdnPurgeManager = Mockito.mock(
		CDNPurgeManager.class);
	private final DLFileEntryLocalService _dlFileEntryLocalService =
		Mockito.mock(DLFileEntryLocalService.class);
	private final JournalArticleLocalService _journalArticleLocalService =
		Mockito.mock(JournalArticleLocalService.class);
	private final ObjectDefinitionLocalService _objectDefinitionLocalService =
		Mockito.mock(ObjectDefinitionLocalService.class);
	private final ObjectEntry _objectEntry = Mockito.mock(ObjectEntry.class);
	private final ObjectEntryLocalService _objectEntryLocalService =
		Mockito.mock(ObjectEntryLocalService.class);

}