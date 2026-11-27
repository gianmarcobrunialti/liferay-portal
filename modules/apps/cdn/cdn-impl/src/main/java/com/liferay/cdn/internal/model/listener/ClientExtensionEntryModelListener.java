/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.cdn.internal.model.listener;

import com.liferay.cdn.purge.CDNPurgeManager;
import com.liferay.client.extension.model.ClientExtensionEntry;
import com.liferay.portal.kernel.model.BaseModelListener;
import com.liferay.portal.kernel.model.ModelListener;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

/**
 * Purges every guest page of the company when a client extension created
 * from the UI or the headless APIs changes. Pages reference client extensions
 * by external reference code, so even adding one can change the pages that
 * already reference that code.
 *
 * @author Gianmarco Brunialti Masera
 */
@Component(service = ModelListener.class)
public class ClientExtensionEntryModelListener
	extends BaseModelListener<ClientExtensionEntry> {

	@Override
	public void onAfterCreate(ClientExtensionEntry clientExtensionEntry) {
		_cdnPurgeManager.purge(clientExtensionEntry);
	}

	@Override
	public void onAfterRemove(ClientExtensionEntry clientExtensionEntry) {
		_cdnPurgeManager.purge(clientExtensionEntry);
	}

	@Override
	public void onAfterUpdate(
		ClientExtensionEntry originalClientExtensionEntry,
		ClientExtensionEntry clientExtensionEntry) {

		_cdnPurgeManager.purge(clientExtensionEntry);
	}

	@Reference
	private CDNPurgeManager _cdnPurgeManager;

}