import React from 'react';
import {createRoot} from 'react-dom/client';

import {UrlCloner} from './UrlCloner';
import './main.css';

class PlaygroundUrlClonerElement extends HTMLElement {
	private _root?: ReturnType<typeof createRoot>;

	connectedCallback() {
		const cloneEndpoint =
			this.getAttribute('clone-endpoint') ?? '/o/playground/clone-page';

		const mount = document.createElement('div');
		this.appendChild(mount);

		this._root = createRoot(mount);
		this._root.render(<UrlCloner cloneEndpoint={cloneEndpoint} />);
	}

	disconnectedCallback() {
		this._root?.unmount();
	}
}

if (!customElements.get('liferay-dotcom-playground-custom-element')) {
	customElements.define(
		'liferay-dotcom-playground-custom-element',
		PlaygroundUrlClonerElement
	);
}
