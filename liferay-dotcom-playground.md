# Liferay Dotcom Playground

Plan, architecture, and local-instance execution results for the personal
Playground feature on liferay.com. Code lives in
`workspaces/liferay-dotcom-playground-workspace/`.

## Goal

Give every user covered by a future Playground User role/user-group a private
training site where they can practice Page Builder, fragments, master pages,
templates, and web content authoring without touching anything in production.
Each site is accessible only to the owner and Administrators, and the owner
holds Site Administrator inside their playground so they can exercise the
in-site Control Panel.

## Constraints

- No edits under `liferay-portal/modules/` — implementation must live entirely
  under `workspaces/`.
- Reuse the `liferay-dotcom-workspace` naming conventions; all new CXs use
  the `liferay-dotcom-playground-<type>` prefix.
- The existing `liferay-dotcom-site-initializer-*` CXs remain untouched.
- "Play-with" fragments, page templates, masters, style books, DDM structures,
  and DDM templates already live on the **Global** site in production (or
  will, before launch). Playground sites inherit them by being separate Sites
  in the same instance — no Global initializer is needed in v1.

## Architecture decisions

| Decision | Choice | Why |
|---|---|---|
| Provisioning trigger | Object Action on a `PlaygroundEnrollment` custom Object | Reliable `onAfterAdd` fire vs. unreliable role-assignment events on User Account. |
| Deprovisioning | Out of scope for v1 | Reduces v1 surface area. |
| URL-clone scope | Same-instance only | Realistic for v1; cross-instance OAuth2 is v2. |
| Admin scope inside playground | Built-in Site Administrator | Cleanest path to the page-builder training surface. |
| Site Initializer split | One CX (landing page + landing-only fragments + sample editable pages); play-with assets stay on Global | Mirrors the existing dotcom `-code`/`-content` split philosophy. |
| Trigger entity | Custom Object `PlaygroundEnrollment` | Object Action fires reliably on Create; auditable enrollment record. |
| URL-cloner UI | Separate `custom-element` CX | Cleaner JS tooling; lazy-loaded web component embedded by the `url-cloner` fragment. |
| Quotas (v1) | 100 MB / 20 pages / 20 articles | Sensible cap for a training space. |

## Components

| CX | Type | Role |
|---|---|---|
| `liferay-dotcom-playground-batch` | `batch` | Ships the `Playground Enrollment Status` picklist, the `PlaygroundEnrollment` Object definition, and the `ProvisionPlaygroundSite` Object Action wired to the Spring Boot webhook. |
| `liferay-dotcom-playground-site-initializer` | `siteInitializer` | Landing page (5 fragments), Sandbox content page, layout-set theme defaults, nav menu. Registers a reference site `liferayDotcomPlaygroundReference`. |
| `liferay-dotcom-playground-etc-spring-boot` | `etc-spring-boot` | Endpoints: `/ready`, `/object/action/enrollment`, `/clone-page`. Hosts `PlaygroundProvisioner`, `SiteService`, `EnrollmentService`, `PageCloner`, `HeadlessClient`. |
| `liferay-dotcom-playground-custom-element` | `customElement` | React + Vite web component `<liferay-dotcom-playground-custom-element>` rendered inside the `url-cloner` fragment. |

### PlaygroundEnrollment Object fields

`liferayUserId` (Long, required), `userScreenName`, `userEmailAddress`,
`enrollmentStatus` (picklist: pending / provisioning / provisioned / failed),
`liferaySiteId`, `siteFriendlyURL`, `failureReason`.

Reserved field names `userId`, `siteId`, and `status` were rejected by
Liferay's Object framework and renamed during the smoke test.

### Landing-page fragments

`welcome-card`, `shortcut-grid`, `training-modules`, `url-cloner`, `quota-status`,
plus a `missing-fragment` placeholder referenced by the page-cloner when the
source page references a fragment not visible in the playground.

All dynamic data (current user name, site path for shortcut hrefs, quota
totals) is rendered at runtime via JS using `window.Liferay.ThemeDisplay` and
Headless Delivery counts. The fragments contain no FreeMarker references to
`themeDisplay` because the fragment-validation context runs templates with
`themeDisplay == null` and rejects them on null-pointer evaluation regardless
of `(...)!""` guards.

## Local smoke test (2026-05-20, localhost:8080, admin `test@liferay.com:test`)

End-to-end flow exercised on a running portal:

1. `POST /o/c/playgroundenrollments` with `{liferayUserId: 75625, ...}` →
   enrollment id 75629.
2. Object Action `ProvisionPlaygroundSite` (`onAfterAdd`) fires →
   POST `localhost:58090/object/action/enrollment`.
3. Spring Boot receives the webhook (payload parsed by a tolerant recursive
   lookup of `liferayUserId` because Liferay's webhook body shape is
   `objectEntryDTOPlaygroundEnrollment.properties.liferayUserId` rather than
   the originally assumed `objectEntry.properties.liferayUserId`).
4. `LiferayOAuth2AccessTokenManager` acquires a fresh access token using the
   OAHS credentials Liferay auto-provisioned at
   `bundles/routes/default/liferay-dotcom-playground-etc-spring-boot/`.
5. `POST /o/headless-admin-site/v1.0/sites` creates a private site:
   `id=75641`, `externalReferenceCode=playground-75625`,
   `friendlyUrlPath=/playground-75625`.
6. `POST /o/headless-admin-user/v1.0/roles/by-external-reference-code/L_SITE_MEMBER/association/user-account/{userId}/site/{siteId}`
   adds the user as a member.
7. Same pattern with `L_SITE_ADMINISTRATOR` grants admin.
8. Listing members of site 75641 confirms the user is the sole member.

The reference site `liferayDotcomPlaygroundReference` (id 75474, friendly URL
`/liferay-dotcom-playground-reference`) was auto-created by the site
initializer at CX deploy time, with the Home + Sandbox pages and all five
landing-page fragments rendered correctly.

## Issues found and resolved during the smoke test

| # | Symptom | Root cause | Fix |
|---|---|---|---|
| 1 | `yarnInstall` fails with "Couldn't find a package.json" for `@clayui/autocomplete` | 7 empty cache dirs under `~/.cache/yarn/v6` for various `@clayui-* 3.x.x` packages | `rm -rf` the empty cache entries; rebuild |
| 2 | `gradlew deploy` lands the zip in `<workspace>/bundles/osgi/client-extensions/` instead of the running bundle | `liferay.workspace.home.dir` defaults to a sibling `bundles` dir of the workspace | Set `liferay.workspace.home.dir=/home/gianmarco/Projects/Liferay/bundles` in `gradle.properties` |
| 3 | Batch import fails: "List Type Definition class not found" | Wrong `className` in batch JSON | Use `com.liferay.headless.admin.list.type.dto.v1_0.ListTypeDefinition` (not `com.liferay.list.type.rest.dto.v1_0.ListTypeDefinition`) |
| 4 | Batch import fails: "Reserved name `userId` / `status`" | Liferay's Object framework reserves these field names | Renamed to `liferayUserId`, `liferaySiteId`, `enrollmentStatus`; updated Spring Boot consumers |
| 5 | Site initializer fails: "FreeMarker syntax is invalid — `themeDisplay`/`groupURL`/`firstName` evaluated to null" | Fragment validation runs the template with `themeDisplay == null`; `(...)!""` guards don't catch null-receiver method calls at validation time | Moved all dynamic logic to runtime JS using `window.Liferay.ThemeDisplay`; templates are now plain HTML |
| 6 | Spring Boot rejects webhook: "Enrollment N is missing liferayUserId" | Liferay's webhook body uses `objectEntryDTOPlaygroundEnrollment.properties.liferayUserId`, not the originally assumed `objectEntry.properties.liferayUserId` | Tolerant recursive lookup of the `liferayUserId` key at any depth |
| 7 | `addMember` fails: `405 Method Not Allowed from POST /o/headless-admin-user/v1.0/sites/{id}/user-accounts` | Endpoint doesn't exist in this DXP release | Switched to role-association: `POST /roles/by-external-reference-code/L_SITE_MEMBER/association/user-account/{userId}/site/{siteId}` |
| 8 | `grantSiteAdministrator` fails for the same reason | Same | Same role-association pattern with `L_SITE_ADMINISTRATOR` |
| 9 | `findByFriendlyUrl` returns the reference site instead of `null` | `filter=friendlyUrlPath eq '...'` not applied; the endpoint returns all sites | Switched to `GET /sites/by-external-reference-code/{erc}` for idempotency |
| 10 | `createWithInitializer` fails: `415 Unsupported Media Type from POST /sites/site-initializer` | That endpoint is for ZIP import, not initializer-key application — it expects `multipart/form-data` | Switched to plain `POST /sites`; per-site initializer replay deferred (see follow-ups) |

## Known follow-ups

- **Enrollment PATCH-back returns 400** — picklist field `enrollmentStatus`
  expects `{"key":"provisioned"}` object, not the raw string we send. One-line
  fix in `EnrollmentService`.
- **Per-site initializer replay** — Liferay's
  `PUT /o/headless-admin-site/v1.0/sites/{erc}/site-initializer` requires
  `multipart/form-data` (either a ZIP export or initializer key as form
  parts). v1 sites are created blank; the landing-page + Sandbox layout
  application from the initializer needs a multipart `WebClient` call once
  the contract for this DXP release is confirmed.
- **DL storage quota + `playgroundCreatedDate` custom-field stamp** — not
  surfaced through Headless; needs an OSGi configuration CX or portal-side
  contract.
- **Cross-instance URL clone** — v2.
- **TTL-based archival** — v2.

## Local Spring Boot bootstrap

Outside Liferay Cloud the Spring Boot jar isn't auto-launched. Bring it up
manually after deploy:

```bash
LIFERAY_ROUTES_CLIENT_EXTENSION=/home/gianmarco/Projects/Liferay/bundles/routes/default/liferay-dotcom-playground-etc-spring-boot \
LIFERAY_ROUTES_DXP=/home/gianmarco/Projects/Liferay/bundles/routes/default/dxp \
java -Dliferay.oauth.application.external.reference.codes=liferay-dotcom-playground-etc-spring-boot-oahs,liferay-dotcom-playground-etc-spring-boot-oaua \
  -jar workspaces/liferay-dotcom-playground-workspace/client-extensions/liferay-dotcom-playground-etc-spring-boot/build/libs/liferay-dotcom-playground-etc-spring-boot.jar
```

The OAuth2 client id/secret and DXP main domain/protocol are read from the
config trees Liferay auto-writes under `bundles/routes/default/` when each CX
deploys.
