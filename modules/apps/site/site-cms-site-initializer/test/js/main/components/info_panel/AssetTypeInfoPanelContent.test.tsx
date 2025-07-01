/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '@testing-library/jest-dom/extend-expect';
import {act, cleanup, render, screen} from '@testing-library/react';
import React from 'react';
import {log, error, warn} from 'console';

import AssetTypeInfoPanelContent from '../../../../../src/main/resources/META-INF/resources/js/main/components/info_panel/AssetTypeInfoPanelContent';
import {DOCUMENT_OBJECT_ENTRY} from './mocks';
import {EVENTS} from '../../../../../src/main/resources/META-INF/resources/js/main/components/info_panel/util/constants';

describe('CMS Asset Type Info Panel', () => {
    const {Liferay: originalLiferay} = window;

    beforeEach(() => {
        window['Liferay'] = {
            ...originalLiferay,
            detach: (name, fn) => {
                window.removeEventListener(name, fn);
            },
            fire: (name, payload) => {
                const event = document.createEvent('CustomEvent');

                error('event name: ', name, 'event payload: ', payload);

                event.initCustomEvent(name);

                if (payload) {
                    Object.keys(payload).forEach((key) => {
                        event[key] = payload[key];
                    });
                }

                window.dispatchEvent(event);
            },
            on: (name, fn) => {
                error('===> mock Liferay.on called');

                window.addEventListener(name, fn);
            },
        };
    });

    afterEach(() => {
        cleanup();

        window.Liferay = originalLiferay;

        jest.resetAllMocks();
    });

    it('renders the component for Basic Web Content asset type', async () => {
        const {container} = render(<AssetTypeInfoPanelContent />);

        expect(container).toBeInTheDocument();

        await act(async () => {
            Liferay.fire(EVENTS.ASSET_DATA, {items: [DOCUMENT_OBJECT_ENTRY]});
        });

        expect(container.querySelector('.asset-title').innerHTML.includes('591.pdf')).toBe(true)
    });

    it.skip('renders the component for Basic Document asset type', () => {});

    it.skip('renders the component for Folder asset type', () => {});

    it.skip('renders the component with an empty state', () => {});

    it.skip('renders the component for multiple selected assets', () => {});
});