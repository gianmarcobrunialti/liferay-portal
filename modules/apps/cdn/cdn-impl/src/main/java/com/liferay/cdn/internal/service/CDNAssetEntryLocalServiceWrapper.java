/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.cdn.internal.service;

import com.liferay.asset.kernel.model.AssetEntry;
import com.liferay.asset.kernel.service.AssetEntryLocalServiceWrapper;
import com.liferay.blogs.model.BlogsEntry;
import com.liferay.blogs.service.BlogsEntryLocalService;
import com.liferay.cdn.purge.CDNPurgeManager;
import com.liferay.document.library.kernel.model.DLFileEntry;
import com.liferay.document.library.kernel.service.DLFileEntryLocalService;
import com.liferay.journal.model.JournalArticle;
import com.liferay.journal.service.JournalArticleLocalService;
import com.liferay.object.model.ObjectDefinition;
import com.liferay.object.service.ObjectDefinitionLocalService;
import com.liferay.object.service.ObjectEntryLocalService;
import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.model.BaseModel;
import com.liferay.portal.kernel.service.ServiceWrapper;
import com.liferay.portal.kernel.workflow.WorkflowConstants;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

/**
 * Purges the content whose categories or tags change while the content itself
 * does not. Bulk categorization and tagging of documents, web content, blogs,
 * and objects update the asset entries alone, so no content model listener
 * runs. Updating the content updates its asset entry through another method,
 * which the content model listeners already cover.
 *
 * <p>
 * The content model is purged rather than the asset entry, so the content
 * keeps its own cache tags and site. Web content is identified by its
 * resource primary key, so its latest approved version is purged.
 * </p>
 *
 * @author Gianmarco Brunialti Masera
 */
@Component(service = ServiceWrapper.class)
public class CDNAssetEntryLocalServiceWrapper
	extends AssetEntryLocalServiceWrapper {

	@Override
	public AssetEntry updateEntry(
			long userId, long groupId, String className, long classPK,
			long[] categoryIds, String[] tagNames)
		throws PortalException {

		AssetEntry assetEntry = super.updateEntry(
			userId, groupId, className, classPK, categoryIds, tagNames);

		if (!assetEntry.isVisible() ||
			!_cdnPurgeManager.isEnabled(assetEntry.getCompanyId())) {

			return assetEntry;
		}

		BaseModel<?> baseModel = _fetchBaseModel(
			assetEntry.getCompanyId(), className, classPK);

		if (baseModel != null) {
			_cdnPurgeManager.purge(baseModel);
		}

		return assetEntry;
	}

	private BaseModel<?> _fetchBaseModel(
		long companyId, String className, long classPK) {

		if (className.equals(BlogsEntry.class.getName())) {
			return _blogsEntryLocalService.fetchBlogsEntry(classPK);
		}

		if (className.equals(DLFileEntry.class.getName())) {
			return _dlFileEntryLocalService.fetchDLFileEntry(classPK);
		}

		if (className.equals(JournalArticle.class.getName())) {
			return _journalArticleLocalService.fetchLatestArticle(
				classPK, WorkflowConstants.STATUS_APPROVED);
		}

		ObjectDefinition objectDefinition =
			_objectDefinitionLocalService.fetchObjectDefinitionByClassName(
				companyId, className);

		if (objectDefinition == null) {
			return null;
		}

		return _objectEntryLocalService.fetchObjectEntry(classPK);
	}

	@Reference
	private BlogsEntryLocalService _blogsEntryLocalService;

	@Reference
	private CDNPurgeManager _cdnPurgeManager;

	@Reference
	private DLFileEntryLocalService _dlFileEntryLocalService;

	@Reference
	private JournalArticleLocalService _journalArticleLocalService;

	@Reference
	private ObjectDefinitionLocalService _objectDefinitionLocalService;

	@Reference
	private ObjectEntryLocalService _objectEntryLocalService;

}