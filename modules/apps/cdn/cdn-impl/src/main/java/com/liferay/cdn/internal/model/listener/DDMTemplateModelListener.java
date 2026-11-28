/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.cdn.internal.model.listener;

import com.liferay.cdn.cache.tag.CDNCacheTagBuilder;
import com.liferay.cdn.internal.purge.JournalDDMStructureCDNPurger;
import com.liferay.cdn.purge.CDNPurgeManager;
import com.liferay.dynamic.data.mapping.model.DDMStructure;
import com.liferay.dynamic.data.mapping.model.DDMTemplate;
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
 * Purges the pages that render web content with a template when the template
 * changes. A web content template belongs to a structure and only renders web
 * content of that structure, so the pages that render the web content of the
 * structure are purged, and those of the original structure too when the
 * template moves to another structure. Templates of other applications, such
 * as widget templates, forms, and dynamic data lists, are skipped.
 *
 * @author Gianmarco Brunialti Masera
 */
@Component(service = ModelListener.class)
public class DDMTemplateModelListener extends BaseModelListener<DDMTemplate> {

	@Override
	public void onAfterUpdate(
		DDMTemplate originalDDMTemplate, DDMTemplate ddmTemplate) {

		if (ddmTemplate.getResourceClassNameId() != _portal.getClassNameId(
				JournalArticle.class)) {

			return;
		}

		long ddmStructureId = _getDDMStructureId(ddmTemplate);

		_journalDDMStructureCDNPurger.purge(
			ddmTemplate.getCompanyId(), ddmTemplate.getCtCollectionId(),
			ddmStructureId, ddmTemplate.getGroupId());

		long originalDDMStructureId = _getDDMStructureId(originalDDMTemplate);

		if (originalDDMStructureId != ddmStructureId) {
			_journalDDMStructureCDNPurger.purge(
				ddmTemplate.getCompanyId(), ddmTemplate.getCtCollectionId(),
				originalDDMStructureId, ddmTemplate.getGroupId());
		}
	}

	@Activate
	protected void activate() {
		_journalDDMStructureCDNPurger = new JournalDDMStructureCDNPurger(
			_cdnCacheTagBuilder, _cdnPurgeManager, _groupLocalService,
			_journalArticleLocalService, _portal);
	}

	private long _getDDMStructureId(DDMTemplate ddmTemplate) {
		if (ddmTemplate.getClassNameId() != _portal.getClassNameId(
				DDMStructure.class)) {

			return 0;
		}

		return ddmTemplate.getClassPK();
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