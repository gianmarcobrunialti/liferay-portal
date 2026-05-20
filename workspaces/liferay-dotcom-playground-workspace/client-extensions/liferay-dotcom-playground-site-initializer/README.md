# liferay-dotcom-playground-site-initializer

Site Initializer CX that defines the template for every personal playground
site. The provisioner (`liferay-dotcom-playground-etc-spring-boot`) invokes
this initializer against each freshly-created `playground-{userId}` site.

## Contents

- `site-initializer/layouts/01_home` — the landing page composed of the five
  `playground-landing` fragments
- `site-initializer/layouts/02_sandbox` — an empty editable content page
- `site-initializer/fragments/group/playground-landing` — landing-only
  fragments: `welcome-card`, `shortcut-grid`, `training-modules`,
  `url-cloner`, `quota-status`, plus `missing-fragment` placeholder for the
  page cloner's fallback
- `site-initializer/site-navigation-menus.json` — Home + Sandbox main nav
- `site-initializer/layout-set/public/metadata.json` — Classic theme defaults
