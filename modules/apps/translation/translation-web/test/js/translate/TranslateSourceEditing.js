/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '@testing-library/jest-dom';
import {act, cleanup, fireEvent, render} from '@testing-library/react';
import React from 'react';

import Translate from '../../../src/main/resources/META-INF/resources/js/translate/Translate';

// The CKEditor 5 source-editing <textarea> created by the mock is stored on
// `global` so the test can assert what the component writes into it (a
// jest.mock factory cannot reference other out-of-scope variables).

// Mock the editor so we can simulate a CKEditor 5 instance that is already in
// Source Editing mode (with a backing <textarea>), without loading real
// CKEditor in jsdom.

jest.mock('frontend-editor-ckeditor-web', () => {
	const ReactLib = require('react');

	return {
		CKEditor5ClassicEditor: ({data, onReady}) => {
			ReactLib.useEffect(() => {
				const textarea = global.document.createElement('textarea');
				textarea.value = data || '';

				const replacedRoot = global.document.createElement('div');
				replacedRoot.appendChild(textarea);

				global.__ckeditor5SourceTextarea = textarea;

				onReady({
					editing: {
						view: {
							domRoots: new Map([['main', {}]]),
						},
					},
					getData: () => textarea.value,
					plugins: {
						get: (name) =>
							name === 'SourceEditing'
								? {
										_replacedRoots: new Map([
											['main', replacedRoot],
										]),
										isSourceEditingMode: true,
										on: () => {},
									}
								: null,
					},
				});

				// eslint-disable-next-line react-hooks/exhaustive-deps
			}, []);

			return ReactLib.createElement(
				'div',
				{'data-testid': 'ckeditor5'},
				data
			);
		},
		ClassicEditor: () => ReactLib.createElement('div'),
	};
});

jest.mock('frontend-js-web', () => ({
	...jest.requireActual('frontend-js-web'),
	sub: jest.fn((langKey, arg) => langKey.replace('x', arg)),
}));

const baseProps = {
	additionalFields: {},
	autoTranslateEnabled: true,
	currentUrl: 'http://current-url',
	getAutoTranslateURL: 'http://translation-url/auto_translate',
	infoFieldSetEntries: [
		{
			fields: [
				{
					editorConfiguration: {editorConfig: {}},
					html: true,
					id: 'infoField--description--',
					label: 'Description',
					multiline: false,
					sourceContent: ['<p>mock summary</p>'],
					sourceContentDir: 'ltr',
					targetContent: ['<p>mock summary</p>'],
					targetContentDir: 'ltr',
					targetLanguageId: 'es_ES',
				},
			],
			legend: 'Basic Information',
		},
	],
	portletNamespace: '_mock_TranslationPortlet_',
	publishButtonDisabled: false,
	publishButtonLabel: 'Publish',
	redirectURL: 'http://redirect-url',
	saveButtonDisabled: false,
	saveButtonLabel: 'Save as Draft',
	sourceLanguageId: 'en_US',
	sourceLanguageIdTitle: 'en-US',
	targetLanguageId: 'es_ES',
	targetLanguageIdTitle: 'es-ES',
	translateLanguagesSelectorData: {
		sourceAvailableLanguages: ['en_US', 'es_ES'],
		sourceLanguageId: 'en_US',
		targetAvailableLanguages: ['en_US', 'es_ES'],
		targetLanguageId: 'es_ES',
	},
	translationPermission: true,
	updateTranslationPortletURL: 'http://update-url',
	workflowActions: {
		PUBLISH: '1',
		SAVE_DRAFT: '2',
	},
};

describe('Translate auto-translate with CKEditor 5 in Source Editing mode', () => {
	let previousFeatureFlag;

	beforeEach(() => {
		previousFeatureFlag = Liferay.FeatureFlags['LPD-11235'];

		// LPD-11235 disabled => CKEditor 5 is used as the rich text editor.

		Liferay.FeatureFlags['LPD-11235'] = false;

		global.__ckeditor5SourceTextarea = undefined;

		fetch.mockResponseOnce(
			JSON.stringify({
				fields: {
					'infoField--description--0': '<p>resumen simulado</p>',
				},
				sourceLanguageId: 'en_US',
				targetLanguageId: 'es_ES',
			})
		);
	});

	afterEach(() => {
		Liferay.FeatureFlags['LPD-11235'] = previousFeatureFlag;

		fetch.resetMocks();

		cleanup();
	});

	// LPP-64525

	it('refreshes the source editing textarea with the auto-translated content', async () => {
		const {getByText} = render(<Translate {...baseProps} />);

		// Sanity check: the textarea starts with the untranslated content.

		expect(global.__ckeditor5SourceTextarea.value).toBe(
			'<p>mock summary</p>'
		);

		const autoTranslateFieldButton = getByText(
			'auto-translate-Description-field'
		).closest('button');

		await act(async () => {
			fireEvent.click(autoTranslateFieldButton);
		});

		expect(global.__ckeditor5SourceTextarea.value).toBe(
			'<p>resumen simulado</p>'
		);
	});
});
