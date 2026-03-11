/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

export default function isInViewport(
    element: HTMLElement,
    {
        bottomThreshold = 0,
        topThreshold = 0,
    } = {}) {
    if (!element) {
        return false;
    }

    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight ||
                           window.document.documentElement.clientHeight;

    const isAboveBottom = rect.top < (viewportHeight - bottomThreshold);
    const isBelowTop = rect.bottom > topThreshold;

    return isBelowTop && isAboveBottom;
}