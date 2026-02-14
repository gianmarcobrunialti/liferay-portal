/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.site.dsr.site.initializer.internal.model.listener;

import com.liferay.depot.constants.DepotRolesConstants;
import com.liferay.depot.model.DepotEntry;
import com.liferay.depot.service.DepotEntryGroupRelLocalServiceUtil;
import com.liferay.depot.service.DepotEntryLocalService;
import com.liferay.layout.util.LayoutServiceContextHelper;
import com.liferay.object.constants.ObjectDefinitionConstants;
import com.liferay.object.model.ObjectDefinition;
import com.liferay.object.model.ObjectEntry;
import com.liferay.object.rest.filter.factory.FilterFactory;
import com.liferay.object.rest.manager.v1_0.ObjectEntryManager;
import com.liferay.object.service.ObjectDefinitionLocalService;
import com.liferay.object.service.ObjectEntryLocalService;
import com.liferay.petra.function.transform.TransformUtil;
import com.liferay.petra.sql.dsl.expression.Predicate;
import com.liferay.portal.events.ServicePreAction;
import com.liferay.portal.events.ThemeServicePreAction;
import com.liferay.portal.kernel.dao.orm.QueryUtil;
import com.liferay.portal.kernel.exception.ModelListenerException;
import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.json.JSONUtil;
import com.liferay.portal.kernel.model.BaseModelListener;
import com.liferay.portal.kernel.model.Company;
import com.liferay.portal.kernel.model.Group;
import com.liferay.portal.kernel.model.GroupConstants;
import com.liferay.portal.kernel.model.ModelListener;
import com.liferay.portal.kernel.model.ResourceAction;
import com.liferay.portal.kernel.model.ResourceConstants;
import com.liferay.portal.kernel.model.Role;
import com.liferay.portal.kernel.model.User;
import com.liferay.portal.kernel.model.role.RoleConstants;
import com.liferay.portal.kernel.security.permission.ActionKeys;
import com.liferay.portal.kernel.service.CompanyLocalService;
import com.liferay.portal.kernel.service.GroupLocalService;
import com.liferay.portal.kernel.service.GroupLocalServiceUtil;
import com.liferay.portal.kernel.service.ResourceActionLocalService;
import com.liferay.portal.kernel.service.ResourcePermissionLocalService;
import com.liferay.portal.kernel.service.RoleLocalService;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.service.ServiceContextFactory;
import com.liferay.portal.kernel.service.ServiceContextThreadLocal;
import com.liferay.portal.kernel.service.UserLocalService;
import com.liferay.portal.kernel.servlet.DummyHttpServletResponse;
import com.liferay.portal.kernel.theme.ThemeDisplay;
import com.liferay.portal.kernel.util.HashMapBuilder;
import com.liferay.portal.kernel.util.LocaleUtil;
import com.liferay.portal.kernel.util.MapUtil;
import com.liferay.portal.kernel.util.StringUtil;

import java.io.Serializable;

import java.util.Arrays;
import java.util.List;
import java.util.Objects;

import com.liferay.portal.kernel.util.WebKeys;
import com.liferay.portal.liveusers.LiveUsers;
import com.liferay.portal.security.permission.PermissionCacheUtil;
import com.liferay.portal.vulcan.dto.converter.DefaultDTOConverterContext;
import com.liferay.site.initializer.SiteInitializer;
import com.liferay.site.initializer.SiteInitializerRegistry;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

/**
 * @author Stefano Motta
 */
@Component(service = ModelListener.class)
public class ObjectEntryModelListener extends BaseModelListener<ObjectEntry> {

	@Override
	public void onAfterCreate(ObjectEntry objectEntry)
		throws ModelListenerException {

		try {
			_onAfterCreate(objectEntry);
		}
		catch (Exception exception) {
			throw new ModelListenerException(exception);
		}
	}

	@Override
	public void onAfterRemove(ObjectEntry objectEntry)
		throws ModelListenerException {

		try {
			//_updateProjectCompletionRate(objectEntry);
		}
		catch (Exception exception) {
			throw new ModelListenerException(exception);
		}
	}

	@Override
	public void onAfterUpdate(
			ObjectEntry originalObjectEntry, ObjectEntry objectEntry)
		throws ModelListenerException {

		try {
			//_updateProjectCompletionRate(objectEntry);
		}
		catch (Exception exception) {
			throw new ModelListenerException(exception);
		}
	}


	private void _onAfterCreate(ObjectEntry objectEntry)
		throws Exception {
		ObjectDefinition objectDefinition = objectEntry.getObjectDefinition();

		if (!Objects.equals(objectDefinition.getExternalReferenceCode(), "L_DSR_ROOM")) {
			return;
		}

		DepotEntry depotEntry = _depotEntryLocalService.getGroupDepotEntry(objectEntry.getGroupId());

		System.out.println(depotEntry.getType());
		System.out.println(depotEntry.getGroup().getFriendlyURL());

		SiteInitializer siteInitializer =
			_siteInitializerRegistry.getSiteInitializer("com.liferay.site.initializer.masterclass");

		if (siteInitializer == null) {
			throw new IllegalArgumentException(
				"No site initializer was found for site template key " +
				"com.liferay.site.initializer.masterclass");
		}

		Company company = _companyLocalService.getCompany(objectEntry.getCompanyId());
		User user = _userLocalService.getUser(objectEntry.getUserId());

		try (AutoCloseable autoCloseable =
				 _layoutServiceContextHelper.getServiceContextAutoCloseable(
					 company, user)) {

			Group group = _groupLocalService.addGroup(
				null, user.getUserId(),
				GroupConstants.DEFAULT_PARENT_GROUP_ID, objectDefinition.getClassName(), objectEntry.getObjectEntryId(),
				GroupConstants.DEFAULT_LIVE_GROUP_ID,
				HashMapBuilder.put(
					LocaleUtil.getDefault(), StringUtil.randomString()
				).build(),
				HashMapBuilder.put(
					LocaleUtil.getDefault(), "bb"
				).build(),
				GroupConstants.TYPE_SITE_RESTRICTED, null, true,
				GroupConstants.DEFAULT_MEMBERSHIP_RESTRICTION, "/cc",
				true, false, true, _getServiceContext(company.getCompanyId(), user.getUserId()));

			LiveUsers.joinGroup(
				group.getCompanyId(), group.getGroupId(),
				user.getUserId());


			DepotEntryGroupRelLocalServiceUtil.addDepotEntryGroupRel(depotEntry.getDepotEntryId(), group.getGroupId());

			siteInitializer.initialize(group.getGroupId());

		}
		catch (Exception exception) {

			// LPS-169057

			PermissionCacheUtil.clearCache(objectEntry.getUserId());

			throw exception;
		}
		finally {
			ServiceContextThreadLocal.popServiceContext();
		}
	}

	private ServiceContext _getServiceContext(long companyId, long userId) throws PortalException {
		ServiceContext serviceContext = new ServiceContext();

			serviceContext.setCompanyId(companyId);
			serviceContext.setUserId(userId);


		ServiceContextThreadLocal.pushServiceContext(serviceContext);

		return serviceContext;
	}

	@Reference
	private GroupLocalService _groupLocalService;


	@Reference
	private CompanyLocalService _companyLocalService;

	@Reference
	private UserLocalService _userLocalService;


	@Reference
	private LayoutServiceContextHelper _layoutServiceContextHelper;


	@Reference
	private SiteInitializerRegistry _siteInitializerRegistry;


	@Reference
	private DepotEntryLocalService _depotEntryLocalService;

	@Reference(
		target = "(filter.factory.key=" + ObjectDefinitionConstants.STORAGE_TYPE_DEFAULT + ")"
	)
	private FilterFactory<Predicate> _filterFactory;

	@Reference
	private ObjectDefinitionLocalService _objectDefinitionLocalService;

	@Reference
	private ObjectEntryLocalService _objectEntryLocalService;

	@Reference
	private ResourceActionLocalService _resourceActionLocalService;

	@Reference
	private ResourcePermissionLocalService _resourcePermissionLocalService;

	@Reference
	private RoleLocalService _roleLocalService;

}