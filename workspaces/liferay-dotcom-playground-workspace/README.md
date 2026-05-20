# liferay-dotcom-playground-workspace

Workspace hosting the personal Playground feature for liferay.com — a set of
client extensions that provision per-user playground sites where users learn
the Page Builder, fragments, masters, templates, and web content authoring on
a safe, isolated copy of the production toolset.

## Client Extensions

| CX | Purpose |
|---|---|
| `liferay-dotcom-playground-batch` | Defines the `PlaygroundEnrollment` custom Object and the `onAfterAdd` Object Action that triggers provisioning |
| `liferay-dotcom-playground-site-initializer` | Per-user site template: landing page, 5 landing-page fragments, Sandbox content page, navigation |
| `liferay-dotcom-playground-etc-spring-boot` | Spring Boot service hosting `/object/action/enrollment` (called by Object Action) and `/clone-page` (called by URL Cloner UI) |
| `liferay-dotcom-playground-custom-element` | React + Vite web component rendered by the `url-cloner` fragment to clone same-instance pages |

## Flow

```
Admin creates PlaygroundEnrollment(liferayUserId=N)
        │
        ▼  (Object Action onAfterAdd → webhook)
liferay-dotcom-playground-etc-spring-boot /object/action/enrollment
        │
        ▼  (async)
PlaygroundProvisioner
  ├─ Headless Admin Site: POST /sites  (ERC: playground-N, friendlyUrl: /playground-N)
  ├─ Apply site initializer → landing page + fragments  (see follow-ups below)
  ├─ Add user as Site Member via role association (L_SITE_MEMBER)
  ├─ Grant Site Administrator via role association (L_SITE_ADMINISTRATOR)
  └─ PATCH PlaygroundEnrollment: status=provisioned, liferaySiteId, siteFriendlyURL
        │
        ▼
User visits /web/playground-N/home
  ├─ Welcome / shortcuts / training cards / quota gauges
  └─ URL Cloner → POST /o/playground/clone-page
                       │
                       ▼
                  PageCloner: fetch source page-definition via
                  Headless Delivery, swap missing fragments,
                  POST into playground site
```

## Quotas (v1)

- 1 playground site per user (enforced by ERC idempotency check)
- 100 MB Document Library storage (planned; not yet wired)
- 20 pages, 20 web content articles (soft, surfaced in landing-page gauges)

## Deploy order

1. `liferay-dotcom-playground-batch` — must come first so the
   `PlaygroundEnrollment` Object exists before the Spring Boot CX registers
   its Object Action endpoint
2. `liferay-dotcom-playground-etc-spring-boot`
3. `liferay-dotcom-playground-custom-element`
4. `liferay-dotcom-playground-site-initializer`

## Plan and execution notes

See [../../liferay-dotcom-playground.md](../../liferay-dotcom-playground.md)
at the repo root for the design plan, brainstorming decisions, and the
local-instance smoke-test results that drove the v1 implementation.
