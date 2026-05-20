# liferay-dotcom-playground-custom-element

Tiny React + Vite custom element that renders the **Clone a Liferay page**
form on the playground landing page.

## How it's used

The site-initializer's `url-cloner` fragment embeds this element:

```html
<liferay-dotcom-playground-custom-element></liferay-dotcom-playground-custom-element>
```

Liferay registers the element via the `customElement` CX type. The form calls
the `clone-endpoint` property (configured in `client-extension.yaml`, defaults
to `/o/playground/clone-page`) which proxies to the Spring Boot service.

## Build / dev

```
yarn install
yarn dev      # vite dev server on http://localhost:3001
yarn build    # outputs into build/static
```
