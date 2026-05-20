# liferay-dotcom-playground-etc-spring-boot

Spring Boot client extension hosting the playground orchestration endpoints.

## Endpoints

| Path | Method | Caller | Purpose |
|---|---|---|---|
| `/ready` | GET | LCP probes | Liveness / readiness |
| `/object/action/enrollment` | POST | PlaygroundEnrollment `onAfterAdd` Object Action | Creates the per-user playground site, runs the site initializer, grants Site Administrator, applies quotas |
| `/clone-page` | POST | URL Cloner custom element on the landing page | Clones a same-instance Liferay page into the calling user's playground |

## Config

Default config in `application-default.properties`:

- `playground.site.initializer.key` — registered key of the site initializer CX
- `playground.site.administrator.role` — role name granted within each playground
- `playground.quota.documents.bytes` — DL storage hard quota (100 MB default)
- `playground.quota.pages` / `playground.quota.articles` — soft caps surfaced on the landing page

## Local bootstrap

```bash
LIFERAY_ROUTES_CLIENT_EXTENSION=/path/to/bundles/routes/default/liferay-dotcom-playground-etc-spring-boot \
LIFERAY_ROUTES_DXP=/path/to/bundles/routes/default/dxp \
java -Dliferay.oauth.application.external.reference.codes=liferay-dotcom-playground-etc-spring-boot-oahs,liferay-dotcom-playground-etc-spring-boot-oaua \
  -jar build/libs/liferay-dotcom-playground-etc-spring-boot.jar
```
