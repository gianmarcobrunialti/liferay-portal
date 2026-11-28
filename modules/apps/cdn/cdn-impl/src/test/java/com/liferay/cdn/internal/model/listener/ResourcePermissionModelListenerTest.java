/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.cdn.internal.model.listener;

import com.liferay.blogs.service.BlogsEntryLocalService;
import com.liferay.cdn.cache.tag.CDNCacheTagBuilder;
import com.liferay.cdn.purge.CDNPurgeManager;
import com.liferay.cdn.purge.CDNPurgeRequest;
import com.liferay.document.library.kernel.model.DLFileEntry;
import com.liferay.document.library.kernel.service.DLFileEntryLocalService;
import com.liferay.journal.model.JournalArticle;
import com.liferay.journal.service.JournalArticleLocalService;
import com.liferay.object.service.ObjectEntryLocalService;
import com.liferay.portal.kernel.model.Group;
import com.liferay.portal.kernel.model.Layout;
import com.liferay.portal.kernel.model.ResourceConstants;
import com.liferay.portal.kernel.model.ResourcePermission;
import com.liferay.portal.kernel.model.Role;
import com.liferay.portal.kernel.model.role.RoleConstants;
import com.liferay.portal.kernel.service.GroupLocalService;
import com.liferay.portal.kernel.service.LayoutLocalService;
import com.liferay.portal.kernel.service.RoleLocalService;
import com.liferay.portal.kernel.test.ReflectionTestUtil;
import com.liferay.portal.kernel.test.util.RandomTestUtil;
import com.liferay.portal.kernel.util.SetUtil;
import com.liferay.portal.test.rule.LiferayUnitTestRule;

import org.junit.Assert;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Test;

import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

/**
 * @author Gianmarco Brunialti Masera
 */
public class ResourcePermissionModelListenerTest {

	@ClassRule
	public static final LiferayUnitTestRule liferayUnitTestRule =
		LiferayUnitTestRule.INSTANCE;

	@Before
	public void setUp() {
		Mockito.when(
			_cdnCacheTagBuilder.getCompanyCacheTag(_COMPANY_ID)
		).thenReturn(
			"c" + _COMPANY_ID
		);

		Mockito.when(
			_cdnCacheTagBuilder.getGroupCacheTag(_COMPANY_ID, _GROUP_ID)
		).thenReturn(
			"s" + _GROUP_ID
		);

		Mockito.when(
			_cdnPurgeManager.isEnabled(_COMPANY_ID)
		).thenReturn(
			true
		);

		Mockito.when(
			_layout.getCompanyId()
		).thenReturn(
			_COMPANY_ID
		);

		Mockito.when(
			_layout.getGroupId()
		).thenReturn(
			_GROUP_ID
		);

		Mockito.when(
			_layoutLocalService.fetchLayout(_PLID)
		).thenReturn(
			_layout
		);

		_mockRole(_GUEST_ROLE_ID, RoleConstants.GUEST);
		_mockRole(_OWNER_ROLE_ID, RoleConstants.OWNER);

		ReflectionTestUtil.setFieldValue(
			_resourcePermissionModelListener, "_blogsEntryLocalService",
			Mockito.mock(BlogsEntryLocalService.class));
		ReflectionTestUtil.setFieldValue(
			_resourcePermissionModelListener, "_cdnCacheTagBuilder",
			_cdnCacheTagBuilder);
		ReflectionTestUtil.setFieldValue(
			_resourcePermissionModelListener, "_cdnPurgeManager",
			_cdnPurgeManager);
		ReflectionTestUtil.setFieldValue(
			_resourcePermissionModelListener, "_dlFileEntryLocalService",
			Mockito.mock(DLFileEntryLocalService.class));
		ReflectionTestUtil.setFieldValue(
			_resourcePermissionModelListener, "_groupLocalService",
			_groupLocalService);
		ReflectionTestUtil.setFieldValue(
			_resourcePermissionModelListener, "_journalArticleLocalService",
			_journalArticleLocalService);
		ReflectionTestUtil.setFieldValue(
			_resourcePermissionModelListener, "_layoutLocalService",
			_layoutLocalService);
		ReflectionTestUtil.setFieldValue(
			_resourcePermissionModelListener, "_objectEntryLocalService",
			Mockito.mock(ObjectEntryLocalService.class));
		ReflectionTestUtil.setFieldValue(
			_resourcePermissionModelListener, "_roleLocalService",
			_roleLocalService);
	}

	@Test
	public void testOnAfterCreate() {

		// Granting the Guest role View on a page purges the page and its site

		_resourcePermissionModelListener.onAfterCreate(
			_getResourcePermission(
				Layout.class.getName(), _PLID, _GUEST_ROLE_ID,
				ResourceConstants.SCOPE_INDIVIDUAL, true));

		_assertPurgeLayout();

		Mockito.clearInvocations(_cdnPurgeManager);

		// The owner permission marks a new page, which nothing shows yet

		_resourcePermissionModelListener.onAfterCreate(
			_getResourcePermission(
				Layout.class.getName(), _PLID, _OWNER_ROLE_ID,
				ResourceConstants.SCOPE_INDIVIDUAL, true));

		_assertNoPurge();
	}

	@Test
	public void testOnAfterRemove() {
		_resourcePermissionModelListener.onAfterRemove(
			_getResourcePermission(
				Layout.class.getName(), _PLID, _GUEST_ROLE_ID,
				ResourceConstants.SCOPE_INDIVIDUAL, true));

		_assertPurgeLayout();
	}

	@Test
	public void testOnAfterUpdate() {
		_resourcePermissionModelListener.onAfterUpdate(
			_getResourcePermission(
				Layout.class.getName(), _PLID, _GUEST_ROLE_ID,
				ResourceConstants.SCOPE_INDIVIDUAL, true),
			_getResourcePermission(
				Layout.class.getName(), _PLID, _GUEST_ROLE_ID,
				ResourceConstants.SCOPE_INDIVIDUAL, false));

		_assertPurgeLayout();

		Mockito.clearInvocations(_cdnPurgeManager);

		// Web content permissions are set on the resource primary key

		JournalArticle journalArticle = Mockito.mock(JournalArticle.class);

		Mockito.when(
			journalArticle.getCompanyId()
		).thenReturn(
			_COMPANY_ID
		);

		Mockito.when(
			journalArticle.getGroupId()
		).thenReturn(
			_GROUP_ID
		);

		long resourcePrimKey = RandomTestUtil.randomLong();

		Mockito.when(
			_journalArticleLocalService.fetchLatestArticle(
				Mockito.eq(resourcePrimKey), Mockito.anyInt())
		).thenReturn(
			journalArticle
		);

		_resourcePermissionModelListener.onAfterUpdate(
			_getResourcePermission(
				JournalArticle.class.getName(), resourcePrimKey, _GUEST_ROLE_ID,
				ResourceConstants.SCOPE_INDIVIDUAL, false),
			_getResourcePermission(
				JournalArticle.class.getName(), resourcePrimKey, _GUEST_ROLE_ID,
				ResourceConstants.SCOPE_INDIVIDUAL, true));

		Mockito.verify(
			_cdnPurgeManager
		).purge(
			journalArticle
		);
	}

	@Test
	public void testOnAfterUpdateWithCompanyScope() {

		// Granting the Guest role View on every page of the company purges
		// the company

		_resourcePermissionModelListener.onAfterUpdate(
			_getResourcePermission(
				Layout.class.getName(), _COMPANY_ID, _GUEST_ROLE_ID,
				ResourceConstants.SCOPE_COMPANY, false),
			_getResourcePermission(
				Layout.class.getName(), _COMPANY_ID, _GUEST_ROLE_ID,
				ResourceConstants.SCOPE_COMPANY, true));

		_assertPurge("c" + _COMPANY_ID);

		Mockito.verifyNoInteractions(_groupLocalService, _layoutLocalService);
	}

	@Test
	public void testOnAfterUpdateWithGroupScope() {
		Group group = Mockito.mock(Group.class);

		Mockito.when(
			_groupLocalService.fetchGroup(_GROUP_ID)
		).thenReturn(
			group
		);

		// Revoking the Guest role View on every page of a site purges the
		// site

		_resourcePermissionModelListener.onAfterUpdate(
			_getResourcePermission(
				Layout.class.getName(), _GROUP_ID, _GUEST_ROLE_ID,
				ResourceConstants.SCOPE_GROUP, true),
			_getResourcePermission(
				Layout.class.getName(), _GROUP_ID, _GUEST_ROLE_ID,
				ResourceConstants.SCOPE_GROUP, false));

		_assertPurge("s" + _GROUP_ID);

		Mockito.clearInvocations(_cdnPurgeManager);

		// Documents are downloaded without the site cache tag, so their site
		// permission purges the company

		_resourcePermissionModelListener.onAfterRemove(
			_getResourcePermission(
				DLFileEntry.class.getName(), _GROUP_ID, _GUEST_ROLE_ID,
				ResourceConstants.SCOPE_GROUP, true));

		_assertPurge("c" + _COMPANY_ID);

		Mockito.clearInvocations(_cdnPurgeManager);

		// Every site can show the web content of the global site, so its site
		// permission purges the company

		Mockito.when(
			group.isCompany()
		).thenReturn(
			true
		);

		_resourcePermissionModelListener.onAfterCreate(
			_getResourcePermission(
				JournalArticle.class.getName(), _GROUP_ID, _GUEST_ROLE_ID,
				ResourceConstants.SCOPE_GROUP, true));

		_assertPurge("c" + _COMPANY_ID);

		Mockito.clearInvocations(_cdnPurgeManager);

		// Guests do not see a staging site

		Mockito.when(
			group.isStagingGroup()
		).thenReturn(
			true
		);

		_resourcePermissionModelListener.onAfterRemove(
			_getResourcePermission(
				Layout.class.getName(), _GROUP_ID, _GUEST_ROLE_ID,
				ResourceConstants.SCOPE_GROUP, true));

		_assertNoPurge();
	}

	@Test
	public void testOnAfterUpdateWithStagingGroup() {
		Group group = Mockito.mock(Group.class);

		Mockito.when(
			group.isStagingGroup()
		).thenReturn(
			true
		);

		Mockito.when(
			_groupLocalService.fetchGroup(_GROUP_ID)
		).thenReturn(
			group
		);

		_resourcePermissionModelListener.onAfterUpdate(
			_getResourcePermission(
				Layout.class.getName(), _PLID, _GUEST_ROLE_ID,
				ResourceConstants.SCOPE_INDIVIDUAL, true),
			_getResourcePermission(
				Layout.class.getName(), _PLID, _GUEST_ROLE_ID,
				ResourceConstants.SCOPE_INDIVIDUAL, false));

		_assertNoPurge();
	}

	@Test
	public void testOnAfterUpdateWithoutGuestViewChange() {

		// A change that keeps the View action does not read anything

		_resourcePermissionModelListener.onAfterUpdate(
			_getResourcePermission(
				Layout.class.getName(), _PLID, _GUEST_ROLE_ID,
				ResourceConstants.SCOPE_INDIVIDUAL, true),
			_getResourcePermission(
				Layout.class.getName(), _PLID, _GUEST_ROLE_ID,
				ResourceConstants.SCOPE_INDIVIDUAL, true));

		// A model without a cache tag does not read anything

		_resourcePermissionModelListener.onAfterUpdate(
			_getResourcePermission(
				RandomTestUtil.randomString(), _PLID, _GUEST_ROLE_ID,
				ResourceConstants.SCOPE_INDIVIDUAL, true),
			_getResourcePermission(
				RandomTestUtil.randomString(), _PLID, _GUEST_ROLE_ID,
				ResourceConstants.SCOPE_INDIVIDUAL, false));

		// A permission on the sites of a site role does not read anything

		_resourcePermissionModelListener.onAfterUpdate(
			_getResourcePermission(
				Layout.class.getName(), 0, _GUEST_ROLE_ID,
				ResourceConstants.SCOPE_GROUP_TEMPLATE, true),
			_getResourcePermission(
				Layout.class.getName(), 0, _GUEST_ROLE_ID,
				ResourceConstants.SCOPE_GROUP_TEMPLATE, false));

		// A company permission that keeps the View action does not read
		// anything

		_resourcePermissionModelListener.onAfterUpdate(
			_getResourcePermission(
				Layout.class.getName(), _COMPANY_ID, _GUEST_ROLE_ID,
				ResourceConstants.SCOPE_COMPANY, false),
			_getResourcePermission(
				Layout.class.getName(), _COMPANY_ID, _GUEST_ROLE_ID,
				ResourceConstants.SCOPE_COMPANY, false));

		// A permission inside a publication does not read anything

		ResourcePermission resourcePermission = _getResourcePermission(
			Layout.class.getName(), _PLID, _GUEST_ROLE_ID,
			ResourceConstants.SCOPE_INDIVIDUAL, false);

		Mockito.when(
			resourcePermission.getCtCollectionId()
		).thenReturn(
			RandomTestUtil.randomLong()
		);

		_resourcePermissionModelListener.onAfterUpdate(
			_getResourcePermission(
				Layout.class.getName(), _PLID, _GUEST_ROLE_ID,
				ResourceConstants.SCOPE_INDIVIDUAL, true),
			resourcePermission);

		Mockito.verifyNoInteractions(
			_cdnPurgeManager, _layoutLocalService, _roleLocalService);

		// Another role's View change only reads the role

		_resourcePermissionModelListener.onAfterUpdate(
			_getResourcePermission(
				Layout.class.getName(), _PLID, RandomTestUtil.randomLong(),
				ResourceConstants.SCOPE_INDIVIDUAL, true),
			_getResourcePermission(
				Layout.class.getName(), _PLID, RandomTestUtil.randomLong(),
				ResourceConstants.SCOPE_INDIVIDUAL, false));

		_resourcePermissionModelListener.onAfterUpdate(
			_getResourcePermission(
				Layout.class.getName(), _COMPANY_ID,
				RandomTestUtil.randomLong(), ResourceConstants.SCOPE_COMPANY,
				true),
			_getResourcePermission(
				Layout.class.getName(), _COMPANY_ID,
				RandomTestUtil.randomLong(), ResourceConstants.SCOPE_COMPANY,
				false));

		Mockito.verifyNoInteractions(
			_cdnPurgeManager, _groupLocalService, _layoutLocalService);
	}

	private void _assertNoPurge() {
		Mockito.verify(
			_cdnPurgeManager, Mockito.never()
		).purge(
			Mockito.any()
		);

		Mockito.verify(
			_cdnPurgeManager, Mockito.never()
		).purge(
			Mockito.anyLong(), Mockito.any()
		);
	}

	private void _assertPurge(String cacheTag) {
		ArgumentCaptor<CDNPurgeRequest> argumentCaptor =
			ArgumentCaptor.forClass(CDNPurgeRequest.class);

		Mockito.verify(
			_cdnPurgeManager
		).purge(
			Mockito.eq(_COMPANY_ID), argumentCaptor.capture()
		);

		CDNPurgeRequest cdnPurgeRequest = argumentCaptor.getValue();

		Assert.assertEquals(
			SetUtil.fromArray(cacheTag), cdnPurgeRequest.getTags());
	}

	private void _assertPurgeLayout() {
		Mockito.verify(
			_cdnPurgeManager
		).purge(
			_layout
		);

		_assertPurge("s" + _GROUP_ID);
	}

	private ResourcePermission _getResourcePermission(
		String name, long primKeyId, long roleId, int scope,
		boolean viewActionId) {

		ResourcePermission resourcePermission = Mockito.mock(
			ResourcePermission.class);

		Mockito.when(
			resourcePermission.getCompanyId()
		).thenReturn(
			_COMPANY_ID
		);

		Mockito.when(
			resourcePermission.getName()
		).thenReturn(
			name
		);

		Mockito.when(
			resourcePermission.getPrimKeyId()
		).thenReturn(
			primKeyId
		);

		Mockito.when(
			resourcePermission.getRoleId()
		).thenReturn(
			roleId
		);

		Mockito.when(
			resourcePermission.getScope()
		).thenReturn(
			scope
		);

		Mockito.when(
			resourcePermission.isViewActionId()
		).thenReturn(
			viewActionId
		);

		return resourcePermission;
	}

	private void _mockRole(long roleId, String name) {
		Role role = Mockito.mock(Role.class);

		Mockito.when(
			role.getRoleId()
		).thenReturn(
			roleId
		);

		Mockito.when(
			_roleLocalService.fetchRole(_COMPANY_ID, name)
		).thenReturn(
			role
		);
	}

	private static final long _COMPANY_ID = RandomTestUtil.randomLong();

	private static final long _GROUP_ID = RandomTestUtil.randomLong();

	private static final long _GUEST_ROLE_ID = RandomTestUtil.randomLong();

	private static final long _OWNER_ROLE_ID = RandomTestUtil.randomLong();

	private static final long _PLID = RandomTestUtil.randomLong();

	private final CDNCacheTagBuilder _cdnCacheTagBuilder = Mockito.mock(
		CDNCacheTagBuilder.class);
	private final CDNPurgeManager _cdnPurgeManager = Mockito.mock(
		CDNPurgeManager.class);
	private final GroupLocalService _groupLocalService = Mockito.mock(
		GroupLocalService.class);
	private final JournalArticleLocalService _journalArticleLocalService =
		Mockito.mock(JournalArticleLocalService.class);
	private final Layout _layout = Mockito.mock(Layout.class);
	private final LayoutLocalService _layoutLocalService = Mockito.mock(
		LayoutLocalService.class);
	private final ResourcePermissionModelListener
		_resourcePermissionModelListener =
			new ResourcePermissionModelListener();
	private final RoleLocalService _roleLocalService = Mockito.mock(
		RoleLocalService.class);

}