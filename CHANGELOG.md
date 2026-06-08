# @valtown/skills

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
