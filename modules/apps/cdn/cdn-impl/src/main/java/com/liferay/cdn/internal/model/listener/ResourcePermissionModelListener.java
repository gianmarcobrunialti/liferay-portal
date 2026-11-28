/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.cdn.internal.model.listener;

import com.liferay.blogs.model.BlogsEntry;
import com.liferay.blogs.service.BlogsEntryLocalService;
import com.liferay.cdn.cache.tag.CDNCacheTagBuilder;
import com.liferay.cdn.purge.CDNPurgeManager;
import com.liferay.cdn.purge.CDNPurgeRequest;
import com.liferay.change.tracking.constants.CTConstants;
import com.liferay.document.library.kernel.model.DLFileEntry;
import com.liferay.document.library.kernel.service.DLFileEntryLocalService;
import com.liferay.journal.model.JournalArticle;
import com.liferay.journal.service.JournalArticleLocalService;
import com.liferay.object.constants.ObjectDefinitionConstants;
import com.liferay.object.service.ObjectEntryLocalService;
import com.liferay.petra.lang.CentralizedThreadLocal;
import com.liferay.petra.string.StringBundler;
import com.liferay.portal.kernel.change.tracking.CTCollectionThreadLocal;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.kernel.model.BaseModel;
import com.liferay.portal.kernel.model.BaseModelListener;
import com.liferay.portal.kernel.model.Group;
import com.liferay.portal.kernel.model.GroupedModel;
import com.liferay.portal.kernel.model.Layout;
import com.liferay.portal.kernel.model.ModelListener;
import com.liferay.portal.kernel.model.ResourceConstants;
import com.liferay.portal.kernel.model.ResourcePermission;
import com.liferay.portal.kernel.model.Role;
import com.liferay.portal.kernel.model.role.RoleConstants;
import com.liferay.portal.kernel.service.GroupLocalService;
import com.liferay.portal.kernel.service.LayoutLocalService;
import com.liferay.portal.kernel.service.RoleLocalService;
import com.liferay.portal.kernel.transaction.TransactionCallbackUtil;
import com.liferay.portal.kernel.workflow.WorkflowConstants;

import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

/**
 * Purges the pages, web content, documents, blogs entries, and object entries
 * that guests gain or lose access to. Every permission change in the portal
 * calls this listener, so it first checks, with constant work and without
 * reading anything, that the change grants or revokes the Guest role's View
 * permission on models of those types in production. Everything else returns
 * right away.
 *
 * <p>
 * The changed models are read and purged after the transaction commits. The
 * permissions created together with a new model are skipped, because guests
 * have not seen the model yet and the model's own listener purges it. A new
 * model is recognized by its owner permission, which is created with it. When
 * the purges of a site hold more cache tags than the CDN purges with one
 * request, the site is purged instead, as for every other purge.
 * </p>
 *
 * <p>
 * A permission on every model of a type in the company purges the company. A
 * permission on every model of a type in a site purges the site. It purges the
 * company instead for the global site, whose content every site can show, and
 * for documents, which are downloaded without the site's cache tag.
 * </p>
 *
 * <p>
 * Permission changes inside a publication are skipped, because guests only
 * see them once the publication is published. Permission changes in a staging
 * site are skipped, because guests only see them once they are published to
 * the live site, where they purge.
 * </p>
 *
 * @author Gianmarco Brunialti Masera
 */
@Component(service = ModelListener.class)
public class ResourcePermissionModelListener
	extends BaseModelListener<ResourcePermission> {

	@Override
	public void onAfterCreate(ResourcePermission resourcePermission) {
		if (!resourcePermission.isViewActionId() ||
			!_isCacheTagged(resourcePermission)) {

			return;
		}

		if (_isGuestRole(resourcePermission)) {
			_addGuestResourcePermission(resourcePermission);
		}
		else if ((resourcePermission.getScope() ==
					ResourceConstants.SCOPE_INDIVIDUAL) &&
				 (resourcePermission.getRoleId() == _getRoleId(
					 resourcePermission.getCompanyId(), _ownerRoleIds,
					 RoleConstants.OWNER))) {

			_addPrimKeyId(true, resourcePermission);
		}
	}

	@Override
	public void onAfterRemove(ResourcePermission resourcePermission) {
		if (!resourcePermission.isViewActionId() ||
			!_isCacheTagged(resourcePermission) ||
			!_isGuestRole(resourcePermission)) {

			return;
		}

		_addGuestResourcePermission(resourcePermission);
	}

	@Override
	public void onAfterUpdate(
		ResourcePermission originalResourcePermission,
		ResourcePermission resourcePermission) {

		if ((originalResourcePermission.isViewActionId() ==
				resourcePermission.isViewActionId()) ||
			!_isCacheTagged(resourcePermission) ||
			!_isGuestRole(resourcePermission)) {

			return;
		}

		_addGuestResourcePermission(resourcePermission);
	}

	/**
	 * Records the model of an individual permission, or purges the company or
	 * the site of a company or site permission after the transaction commits.
	 */
	private void _addGuestResourcePermission(
		ResourcePermission resourcePermission) {

		int scope = resourcePermission.getScope();

		if (scope == ResourceConstants.SCOPE_INDIVIDUAL) {
			_addPrimKeyId(false, resourcePermission);

			return;
		}

		long companyId = resourcePermission.getCompanyId();

		if (!_cdnPurgeManager.isEnabled(companyId)) {
			return;
		}

		String name = resourcePermission.getName();
		long primKeyId = resourcePermission.getPrimKeyId();

		TransactionCallbackUtil.registerCommitCallback(
			() -> {
				_purge(companyId, name, primKeyId, scope);

				return null;
			});
	}

	/**
	 * Records the model of the permission until the transaction commits. The
	 * map of each resource name maps the primary keys of its models to whether
	 * the model was added in the transaction. The callbacks are registered
	 * after the first model is recorded, because without a transaction the
	 * commit callback runs right away.
	 */
	private void _addPrimKeyId(
		boolean added, ResourcePermission resourcePermission) {

		if (!_cdnPurgeManager.isEnabled(resourcePermission.getCompanyId())) {
			return;
		}

		Map<String, Map<Long, Boolean>> addedMaps = _addedMaps.get();

		boolean registerCallbacks = false;

		if (addedMaps == null) {
			addedMaps = new HashMap<>();

			_addedMaps.set(addedMaps);

			registerCallbacks = true;
		}

		Map<Long, Boolean> addedMap = addedMaps.computeIfAbsent(
			resourcePermission.getName(), name -> new HashMap<>());

		addedMap.merge(
			resourcePermission.getPrimKeyId(), added, Boolean::logicalOr);

		if (!registerCallbacks) {
			return;
		}

		Map<String, Map<Long, Boolean>> committedAddedMaps = addedMaps;

		TransactionCallbackUtil.registerCommitCallback(
			() -> {
				_purge(committedAddedMaps);

				return null;
			});

		TransactionCallbackUtil.registerCompletionCallback(
			() -> {
				_addedMaps.remove();

				return null;
			});
	}

	private BaseModel<?> _fetchBaseModel(String name, long primKeyId) {
		if (name.equals(BlogsEntry.class.getName())) {
			return _blogsEntryLocalService.fetchBlogsEntry(primKeyId);
		}

		if (name.equals(DLFileEntry.class.getName())) {
			return _dlFileEntryLocalService.fetchDLFileEntry(primKeyId);
		}

		if (name.equals(JournalArticle.class.getName())) {
			return _journalArticleLocalService.fetchLatestArticle(
				primKeyId, WorkflowConstants.STATUS_APPROVED);
		}

		if (name.equals(Layout.class.getName())) {
			return _layoutLocalService.fetchLayout(primKeyId);
		}

		return _objectEntryLocalService.fetchObjectEntry(primKeyId);
	}

	private long _getRoleId(
		long companyId, Map<Long, Long> roleIds, String name) {

		Long roleId = roleIds.get(companyId);

		if (roleId != null) {
			return roleId;
		}

		Role role = _roleLocalService.fetchRole(companyId, name);

		if (role == null) {
			return 0;
		}

		roleIds.put(companyId, role.getRoleId());

		return role.getRoleId();
	}

	/**
	 * Returns whether the permission is a company, site, or individual
	 * permission in production on models with a cache tag. Web content
	 * permissions are set on the resource primary key, which is also the
	 * primary key in the web content cache tag. The Guest role is a regular
	 * role, so it has no permissions on the sites of a site role.
	 */
	private boolean _isCacheTagged(ResourcePermission resourcePermission) {
		int scope = resourcePermission.getScope();

		if (((scope != ResourceConstants.SCOPE_COMPANY) &&
			 (scope != ResourceConstants.SCOPE_GROUP) &&
			 (scope != ResourceConstants.SCOPE_INDIVIDUAL)) ||
			(resourcePermission.getCtCollectionId() !=
				CTConstants.CT_COLLECTION_ID_PRODUCTION) ||
			!CTCollectionThreadLocal.isProductionMode()) {

			return false;
		}

		String name = resourcePermission.getName();

		if (name.equals(BlogsEntry.class.getName()) ||
			name.equals(DLFileEntry.class.getName()) ||
			name.equals(JournalArticle.class.getName()) ||
			name.equals(Layout.class.getName()) ||
			name.startsWith(
				ObjectDefinitionConstants.
					CLASS_NAME_PREFIX_CUSTOM_OBJECT_DEFINITION)) {

			return true;
		}

		return false;
	}

	private boolean _isGuestRole(ResourcePermission resourcePermission) {
		if (resourcePermission.getRoleId() == _getRoleId(
				resourcePermission.getCompanyId(), _guestRoleIds,
				RoleConstants.GUEST)) {

			return true;
		}

		return false;
	}

	/**
	 * Returns whether the page appears in the navigation that every page of
	 * the site renders for guests.
	 */
	private boolean _isNavigationLayout(Layout layout) {
		if (layout.isDraftLayout() || layout.isHidden() ||
			layout.isPrivateLayout() || layout.isSystem()) {

			return false;
		}

		return true;
	}

	private boolean _isStagingGroup(long groupId) {
		Group group = _groupLocalService.fetchGroup(groupId);

		if ((group != null) && group.isStagingGroup()) {
			return true;
		}

		return false;
	}

	private void _purge(
		long companyId, String name, long primKeyId, int scope) {

		try {
			String cacheTag = _cdnCacheTagBuilder.getCompanyCacheTag(companyId);

			if (scope == ResourceConstants.SCOPE_GROUP) {
				Group group = _groupLocalService.fetchGroup(primKeyId);

				if ((group == null) || group.isStagingGroup()) {
					return;
				}

				if (!group.isCompany() &&
					!name.equals(DLFileEntry.class.getName())) {

					cacheTag = _cdnCacheTagBuilder.getGroupCacheTag(
						companyId, primKeyId);
				}
			}

			_cdnPurgeManager.purge(
				companyId,
				CDNPurgeRequest.builder(
				).tags(
					cacheTag
				).build());
		}
		catch (Exception exception) {
			_log.error(
				StringBundler.concat(
					"Unable to purge the models of ", name,
					" whose guest access changed"),
				exception);
		}
	}

	private void _purge(Map<String, Map<Long, Boolean>> addedMaps) {
		try {
			Map<Long, Set<String>> cacheTagsMap = new HashMap<>();

			for (Map.Entry<String, Map<Long, Boolean>> entry :
					addedMaps.entrySet()) {

				Map<Long, Boolean> addedMap = entry.getValue();

				for (Map.Entry<Long, Boolean> addedEntry :
						addedMap.entrySet()) {

					if (addedEntry.getValue()) {
						continue;
					}

					BaseModel<?> baseModel = _fetchBaseModel(
						entry.getKey(), addedEntry.getKey());

					if (baseModel == null) {
						continue;
					}

					GroupedModel groupedModel = (GroupedModel)baseModel;

					if (_isStagingGroup(groupedModel.getGroupId())) {
						continue;
					}

					_cdnPurgeManager.purge(baseModel);

					if (!(baseModel instanceof Layout) ||
						!_isNavigationLayout((Layout)baseModel)) {

						continue;
					}

					Set<String> cacheTags = cacheTagsMap.computeIfAbsent(
						groupedModel.getCompanyId(),
						companyId -> new LinkedHashSet<>());

					cacheTags.add(
						_cdnCacheTagBuilder.getGroupCacheTag(
							groupedModel.getCompanyId(),
							groupedModel.getGroupId()));
				}
			}

			for (Map.Entry<Long, Set<String>> entry : cacheTagsMap.entrySet()) {
				_cdnPurgeManager.purge(
					entry.getKey(),
					CDNPurgeRequest.builder(
					).tags(
						entry.getValue()
					).build());
			}
		}
		catch (Exception exception) {
			_log.error(
				"Unable to purge the models whose guest access changed",
				exception);
		}
	}

	private static final Log _log = LogFactoryUtil.getLog(
		ResourcePermissionModelListener.class);

	private static final ThreadLocal<Map<String, Map<Long, Boolean>>>
		_addedMaps = new CentralizedThreadLocal<>(
			ResourcePermissionModelListener.class + "._addedMaps");

	@Reference
	private BlogsEntryLocalService _blogsEntryLocalService;

	@Reference
	private CDNCacheTagBuilder _cdnCacheTagBuilder;

	@Reference
	private CDNPurgeManager _cdnPurgeManager;

	@Reference
	private DLFileEntryLocalService _dlFileEntryLocalService;

	@Reference
	private GroupLocalService _groupLocalService;

	private final Map<Long, Long> _guestRoleIds = new ConcurrentHashMap<>();

	@Reference
	private JournalArticleLocalService _journalArticleLocalService;

	@Reference
	private LayoutLocalService _layoutLocalService;

	@Reference
	private ObjectEntryLocalService _objectEntryLocalService;

	private final Map<Long, Long> _ownerRoleIds = new ConcurrentHashMap<>();

	@Reference
	private RoleLocalService _roleLocalService;

}