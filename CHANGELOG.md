# @valtown/skills

## 0.3.0

### Minor Changes

- 39179a9: Add a `client-side-js` skill covering how to serve client-side JavaScript modules. Val Town has no build step, so this explains the actual mechanics agents otherwise have to reverse-engineer: `serveFile` transpiling `.ts`/`.tsx`/`.jsx` to browser-ready JS per request, loading a module with `<script type="module">`, how the browser resolves local imports (explicit extensions) and third-party deps (full ESM URLs), and the esm.town direct-serve alternative. Fills a gap between `react-ui` (JSX/styling conventions) and `http-endpoints` (handler/CORS), and is framework-agnostic.
- e6d1ac8: Add a `restricted-access` skill covering app access (`httpPrivacy`) — the axis that controls who can call a val's HTTP endpoints, independent of the `privacy` setting that controls who can read its code. Explains what agents can't infer from a failed request: access is granted to whole organizations (a viewer needs a grant _and_ membership in the granted org, rechecked on every request), so an unauthenticated caller gets a `302` to a login page rather than the val's response — which surfaces as `fetch_val_endpoint` refusing to follow a redirect, or an API client receiving login HTML where it expected JSON, neither of which is a bug in the val's code. Also covers project-scoped bypass tokens for webhooks and other machine callers, and the `X-Val-Town-User` → `GET /v3/val/viewer` exchange for identifying a human viewer inside a restricted val.

  The most consequential piece is disambiguation from `std/oauth`: both answer "make my app require a login," but restricted access gates at the platform edge before your code runs and admits organizations, while `std/oauth` runs inside the val and gives it its own logged-in users. Applying both to one val makes visitors authenticate twice. The `oauth` skill gains a reciprocal pointer, and `http-endpoints` no longer describes an endpoint URL as unconditionally public.

- cfd550a: Adds a skill for creating new skills
- 4715341: Remove the `templates` skill. Its catalog of official starters is now served live by the Val Town `find_templates` tool (which lists the public vals under the `templates` org), so a hand-maintained catalog in this package is no longer needed and would only drift. The remix/template guidance it carried lives in the app's system prompt and the `find_templates` tool description.

### Patch Changes

- d14627f: Teach the immutable asset-caching pattern (`serveImmutableFile` / `immutableFileUrl` from `std/utils`) in the `client-side-js`, `http-endpoints`, and `react-ui` skills: the never-cached HTML shell stamps `/__immutable/<version>/...` URLs, served with `Cache-Control: immutable`; publishing bumps the version, invalidating automatically (old-version URLs 404). Measured: repeat visits 665ms → 157ms with zero asset requests.

## 0.2.1

### Patch Changes

- d0e42bd: Add more details to OAuth skill
- 1e70508: Improve the title of the blobs skill

## 0.2.0

### Minor Changes

- 2154b59: Add instructions for using scoped blob storage

### Patch Changes

- e01069e: Version sync now updates every plugin manifest (Claude, Codex, and Cursor plugin.json plus the Cursor marketplace.json `metadata.version`), not just the Claude manifest — preventing the Codex/Cursor manifests from advertising a stale version on release.

## 0.1.2

### Patch Changes

- e335524: Fix broken example code surfaced by running every skill's examples on the platform:

  - **email**: `std/email` exports `email` as the send function itself — the examples called the nonexistent `email.send(...)`. Now call `email({ ... })` and note there is no `.send` method.
  - **sqlite-storage**: corrected the database-scope section — `std/sqlite/global.ts` is the _organization-scoped_ DB (not "per-user") and returns keyed-object rows like `main.ts`, not `any[][]`.
  - **oauth**: logout is `POST /auth/logout` (a GET returns 405); the example now uses a POST `<form>` instead of an `<a href>` link.
  - **third-party-integrations**: guide URLs don't follow a uniform `/guides/{service}/` slug and the bare `https://docs.val.town/guides/` index 404s; point agents at the docs sitemap to look up the exact slug instead of guessing.

- 4a9b7d0: Point templates skill at renamed templates-org vals (`react-hono-starter`, `basic-html-starter`, `telegram-bot-starter`) so `remix_val` targets resolve.

## 0.1.1

### Patch Changes

- f2f0086: Add IMAP as a trigger word for the email skill
