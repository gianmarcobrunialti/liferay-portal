/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.cdn.internal.purge;

import com.liferay.cdn.cache.tag.CDNCacheTagBuilder;
import com.liferay.cdn.purge.CDNPurgeManager;
import com.liferay.cdn.purge.CDNPurgeRequest;
import com.liferay.change.tracking.constants.CTConstants;
import com.liferay.journal.model.JournalArticle;
import com.liferay.journal.service.JournalArticleLocalService;
import com.liferay.petra.string.StringBundler;
import com.liferay.portal.kernel.change.tracking.CTCollectionThreadLocal;
import com.liferay.portal.kernel.dao.orm.DynamicQuery;
import com.liferay.portal.kernel.dao.orm.ProjectionFactoryUtil;
import com.liferay.portal.kernel.dao.orm.ProjectionList;
import com.liferay.portal.kernel.dao.orm.Property;
import com.liferay.portal.kernel.dao.orm.PropertyFactoryUtil;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.kernel.model.Group;
import com.liferay.portal.kernel.service.GroupLocalService;
import com.liferay.portal.kernel.transaction.TransactionCallbackUtil;
import com.liferay.portal.kernel.util.Portal;
import com.liferay.portal.kernel.workflow.WorkflowConstants;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * Purges the pages that render the web content of a structure when the
 * structure or one of its templates changes. A template only renders web
 * content of its structure, whether it is the web content's own template, the
 * template a Web Content Display widget selects, or the template a display
 * page or a fragment maps, so the web content of the structure covers every
 * page that renders with the template.
 *
 * <p>
 * The web content is looked up after the transaction commits, and its cache
 * tags are filed under its site, so a site with more cache tags than the CDN
 * purges with one request is purged instead. A structure with more than 10,000
 * web content articles purges the sites of its web content without loading
 * every web content, to keep the loaded rows bounded. Every site can use the
 * structures and templates of the global site, so a change in the global site
 * purges the company.
 * </p>
 *
 * @author Gianmarco Brunialti Masera
 */
public class JournalDDMStructureCDNPurger {

	public JournalDDMStructureCDNPurger(
		CDNCacheTagBuilder cdnCacheTagBuilder, CDNPurgeManager cdnPurgeManager,
		GroupLocalService groupLocalService,
		JournalArticleLocalService journalArticleLocalService, Portal portal) {

		_cdnCacheTagBuilder = cdnCacheTagBuilder;
		_cdnPurgeManager = cdnPurgeManager;
		_groupLocalService = groupLocalService;
		_journalArticleLocalService = journalArticleLocalService;
		_portal = portal;
	}

	/**
	 * Purges the pages that render the web content of the structure after the
	 * current transaction commits. A structure ID of <code>0</code> purges the
	 * group, because the web content cannot be told apart.
	 */
	public void purge(
		long companyId, long ctCollectionId, long ddmStructureId,
		long groupId) {

		if (!CTCollectionThreadLocal.isProductionMode() ||
			(ctCollectionId != CTConstants.CT_COLLECTION_ID_PRODUCTION) ||
			!_cdnPurgeManager.isEnabled(companyId)) {

			return;
		}

		TransactionCallbackUtil.registerCommitCallback(
			() -> {
				_purge(companyId, ddmStructureId, groupId);

				return null;
			});
	}

	private CDNPurgeRequest _getCDNPurgeRequest(
		long companyId, long ddmStructureId, long groupId) {

		CDNPurgeRequest.Builder builder = CDNPurgeRequest.builder();

		Group group = _groupLocalService.fetchGroup(groupId);

		if (group == null) {
			return builder.build();
		}

		if (group.isCompany()) {
			return builder.tags(
				_cdnCacheTagBuilder.getCompanyCacheTag(companyId)
			).build();
		}

		if (ddmStructureId == 0) {
			return builder.tags(
				_cdnCacheTagBuilder.getGroupCacheTag(companyId, groupId)
			).build();
		}

		DynamicQuery dynamicQuery = _getDynamicQuery(ddmStructureId);

		ProjectionList projectionList = ProjectionFactoryUtil.projectionList();

		projectionList.add(PropertyFactoryUtil.forName("groupId"));
		projectionList.add(PropertyFactoryUtil.forName("resourcePrimKey"));

		dynamicQuery.setProjection(
			ProjectionFactoryUtil.distinct(projectionList));

		List<Object[]> results = _journalArticleLocalService.dynamicQuery(
			dynamicQuery, 0, _MAX_JOURNAL_ARTICLES + 1);

		if (results.size() > _MAX_JOURNAL_ARTICLES) {
			return _getGroupsCDNPurgeRequest(companyId, ddmStructureId);
		}

		long classNameId = _portal.getClassNameId(JournalArticle.class);

		for (Object[] result : results) {
			long journalArticleGroupId = (Long)result[0];

			builder.tags(
				journalArticleGroupId,
				Arrays.asList(
					_cdnCacheTagBuilder.getModelCacheTag(
						companyId, JournalArticle.class.getName(),
						(Long)result[1]),
					_cdnCacheTagBuilder.getCollectionCacheTag(
						companyId, journalArticleGroupId, classNameId),
					_cdnCacheTagBuilder.getOverflowCacheTag(
						companyId, journalArticleGroupId)));
		}

		return builder.build();
	}

	/**
	 * Returns a query for the web content of the structure that guests can
	 * see. Web content with an approved version is visible, even when a later
	 * version is a draft.
	 */
	private DynamicQuery _getDynamicQuery(long ddmStructureId) {
		DynamicQuery dynamicQuery = _journalArticleLocalService.dynamicQuery();

		Property ddmStructureIdProperty = PropertyFactoryUtil.forName(
			"DDMStructureId");

		dynamicQuery.add(ddmStructureIdProperty.eq(ddmStructureId));

		Property statusProperty = PropertyFactoryUtil.forName("status");

		dynamicQuery.add(statusProperty.eq(WorkflowConstants.STATUS_APPROVED));

		return dynamicQuery;
	}

	/**
	 * Returns a request that purges the sites of the web content of the
	 * structure, without loading every web content.
	 */
	private CDNPurgeRequest _getGroupsCDNPurgeRequest(
		long companyId, long ddmStructureId) {

		if (_log.isDebugEnabled()) {
			_log.debug(
				StringBundler.concat(
					"Purging the sites of the web content of structure ",
					ddmStructureId, " because it has more than ",
					_MAX_JOURNAL_ARTICLES, " web content articles"));
		}

		CDNPurgeRequest.Builder builder = CDNPurgeRequest.builder();

		DynamicQuery dynamicQuery = _getDynamicQuery(ddmStructureId);

		dynamicQuery.setProjection(
			ProjectionFactoryUtil.distinct(
				PropertyFactoryUtil.forName("groupId")));

		List<Long> groupIds = _journalArticleLocalService.dynamicQuery(
			dynamicQuery);

		for (long groupId : groupIds) {
			builder.tags(
				groupId,
				Collections.singleton(
					_cdnCacheTagBuilder.getGroupCacheTag(companyId, groupId)));
		}

		return builder.build();
	}

	private void _purge(long companyId, long ddmStructureId, long groupId) {
		try {
			_cdnPurgeManager.purge(
				companyId,
				_getCDNPurgeRequest(companyId, ddmStructureId, groupId));
		}
		catch (Exception exception) {
			_log.error(
				"Unable to purge the CDN cache tags of the web content of " +
					"structure " + ddmStructureId,
				exception);
		}
	}

	private static final int _MAX_JOURNAL_ARTICLES = 10000;

	private static final Log _log = LogFactoryUtil.getLog(
		JournalDDMStructureCDNPurger.class);

	private final CDNCacheTagBuilder _cdnCacheTagBuilder;
	private final CDNPurgeManager _cdnPurgeManager;
	private final GroupLocalService _groupLocalService;
	private final JournalArticleLocalService _journalArticleLocalService;
	private final Portal _portal;

}