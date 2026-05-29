---
"@valtown/skills": patch
---

Fix broken example code surfaced by running every skill's examples on the platform:

- **email**: `std/email` exports `email` as the send function itself — the examples called the nonexistent `email.send(...)`. Now call `email({ ... })` and note there is no `.send` method.
- **sqlite-storage**: corrected the database-scope section — `std/sqlite/global.ts` is the *organization-scoped* DB (not "per-user") and returns keyed-object rows like `main.ts`, not `any[][]`; the legacy per-user DB is the separate `std/sqlite2`.
- **oauth**: logout is `POST /auth/logout` (a GET returns 405); the example now uses a POST `<form>` instead of an `<a href>` link.
- **third-party-integrations**: guide URLs don't follow a uniform `/guides/{service}/` slug and the bare `https://docs.val.town/guides/` index 404s; point at the docs site instead of guessing slugs.
