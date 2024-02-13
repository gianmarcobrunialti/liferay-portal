/**
 * SPDX-FileCopyrightText: (c) 2024 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.portal.security;

import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.model.User;
import com.liferay.portal.kernel.security.auth.GuestOrUserUtil;

/**
 * @author Gianmarco Brunialti Masera
 */
public class CompanyViolationChecker {

	public static boolean check(long userId) throws PortalException {
		User currentUser = GuestOrUserUtil.getGuestOrUser();

		long currentCompanyId = currentUser.getCompanyId();

		User user = GuestOrUserUtil.getUser(userId);

		long companyId = user.getCompanyId();

		if (currentCompanyId == companyId) {
			return true;
		}

		return false;
	}

}