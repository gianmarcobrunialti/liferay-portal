/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.cdn.internal.model.listener;

import com.liferay.cdn.cache.tag.CDNCacheTagBuilder;
import com.liferay.cdn.internal.purge.JournalDDMStructureCDNPurger;
import com.liferay.cdn.purge.CDNPurgeManager;
import com.liferay.dynamic.data.mapping.model.DDMStructure;
import com.liferay.journal.model.JournalArticle;
import com.liferay.journal.service.JournalArticleLocalService;
import com.liferay.portal.kernel.model.BaseModelListener;
import com.liferay.portal.kernel.model.ModelListener;
import com.liferay.portal.kernel.service.GroupLocalService;
import com.liferay.portal.kernel.util.Portal;

import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

/**
 * Purges the pages that render web content of a structure when the structure
 * changes. Structures of other applications, such as forms and dynamic data
 * lists, are skipped.
 *
 * @author Gianmarco Brunialti Masera
 */
@Component(service = ModelListener.class)
public class DDMStructureModelListener extends BaseModelListener<DDMStructure> {

	@Override
	public void onAfterUpdate(
		DDMStructure originalDDMStructure, DDMStructure ddmStructure) {

		if (ddmStructure.getClassNameId() != _portal.getClassNameId(
				JournalArticle.class)) {

			return;
		}

		_journalDDMStructureCDNPurger.purge(
			ddmStructure.getCompanyId(), ddmStructure.getCtCollectionId(),
			ddmStructure.getStructureId(), ddmStructure.getGroupId());
	}

	@Activate
	protected void activate() {
		_journalDDMStructureCDNPurger = new JournalDDMStructureCDNPurger(
			_cdnCacheTagBuilder, _cdnPurgeManager, _groupLocalService,
			_journalArticleLocalService, _portal);
	}

	@Reference
	private CDNCacheTagBuilder _cdnCacheTagBuilder;

	@Reference
	private CDNPurgeManager _cdnPurgeManager;

	@Reference
	private GroupLocalService _groupLocalService;

	@Reference
	private JournalArticleLocalService _journalArticleLocalService;

	private JournalDDMStructureCDNPurger _journalDDMStructureCDNPurger;

	@Reference
	private Portal _portal;

}