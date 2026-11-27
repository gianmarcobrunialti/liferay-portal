/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.cdn.internal.model.listener;

import com.liferay.cdn.purge.CDNPurgeManager;
import com.liferay.portal.kernel.model.BaseModelListener;
import com.liferay.portal.kernel.model.ModelListener;
import com.liferay.portal.kernel.model.VirtualHost;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

/**
 * Purges a site when its virtual hosts change. Saving a site's virtual hosts
 * writes the virtual host rows without updating the layout set row, so the
 * layout set model listener is not called.
 *
 * @author Gianmarco Brunialti Masera
 */
@Component(service = ModelListener.class)
public class VirtualHostModelListener extends BaseModelListener<VirtualHost> {

	@Override
	public void onAfterCreate(VirtualHost virtualHost) {
		_cdnPurgeManager.purge(null, virtualHost);
	}

	@Override
	public void onAfterRemove(VirtualHost virtualHost) {
		_cdnPurgeManager.purge(virtualHost, null);
	}

	@Override
	public void onAfterUpdate(
		VirtualHost originalVirtualHost, VirtualHost virtualHost) {

		_cdnPurgeManager.purge(originalVirtualHost, virtualHost);
	}

	@Reference
	private CDNPurgeManager _cdnPurgeManager;

}