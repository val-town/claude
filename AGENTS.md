# Val Town Agent Instructions

This file is auto-generated from the Val Town plugin skills. It contains the current platform guidance for building on Val Town.


---

# Blob Storage

Val Town provides built-in key/value blob storage via the `std/blob` module. Reach for it whenever a val needs to persist simple values — JSON documents, cached API responses, uploaded files, or binary assets — keyed by a string. For relational or structured data you query with SQL, prefer `std/sqlite` instead.

## Scoping: account-global or per-val depending on import

There are two exports of the blob utility: `global.ts`, which is scoped to the user account, and `main.ts`, which is scoped to the val itself. Prefer the `main.ts` interface and val scoping for new vals.

Here is the scoped import:

```ts
/**
 * Importing from `main.ts` provides an interface to val-scoped blobs.
 */
import { blob } from "https://esm.town/v/std/blob/main.ts";
```

Here are the global imports:

```ts
/**
 * Importing from `global.ts` provides a blob interface that is scoped
 * to your account.
 */
import { blob } from "https://esm.town/v/std/blob/global.ts";
/**
 * This entrypoint is also available as `v/std/blob`. This is common
 * in older vals.
 */
import { blob } from "https://esm.town/v/std/blob";
```

The scoped & global `blob` interfaces have the same methods.

Scoped & global blobs are stored separately: you cannot access global blobs with the scoped interface or vice versa.

## Basic usage (JSON)

```ts
import { blob } from "https://esm.town/v/std/blob/main.ts";

await blob.setJSON("config", { theme: "dark", count: 0 });

const config = await blob.getJSON("config");
// config = { theme: "dark", count: 0 }, or undefined if the key doesn't exist
```

`getJSON` returns `undefined` when the key is missing, so guard before using the result:

```ts
const config = (await blob.getJSON("config")) ?? { theme: "light", count: 0 };
```

## Raw and binary data

Use `set`/`get` for strings, binary, or any `BodyInit`. `get` returns a standard `Response`, so use its body helpers (`.text()`, `.json()`, `.arrayBuffer()`, `.blob()`):

```ts
await blob.set("logo.png", imageBytes); // string | BodyInit (Blob, ArrayBuffer, ReadableStream, …)

const res = await blob.get("logo.png");
const bytes = await res.arrayBuffer();
```

Unlike `getJSON`, `get` **throws** `ValTownBlobNotFoundError` if the key doesn't exist — wrap it in `try/catch` when the key may be absent.

## Listing, deleting, copying

```ts
const entries = await blob.list("user_"); // optional key prefix filter
// entries = [{ key, size, lastModified }, …]

for (const { key } of entries) {
  await blob.delete(key);
}

await blob.copy("config", "config.bak"); // duplicate under a new key
await blob.move("draft", "published");   // rename / relocate
```

`list(prefix?)` returns an array of `{ key: string; size: number; lastModified: string }` — objects, not bare key strings.


## Limits

- **Key length:** up to 512 characters.
- **Total storage:** 10 MB on the free plan, 1 GB on Pro — shared across all blobs in the account.
- Store large or structured datasets in `std/sqlite` rather than as one giant blob.

## Reading/writing blobs via tools

When using the `storeBlob`, `readBlob`, `listBlobs`, or `deleteBlob` tools against a val owned by an organization (not your personal account), pass the org handle as the `org` parameter so the call hits that organization's blob storage. Example: `{ key: "myapp:config", org: "some-org" }`. This only matters for the tool calls — code inside the val reads and writes its owning account's storage automatically. Note `storeBlob` accepts UTF-8 text up to 100 KB; write larger or binary blobs from code with `blob.set`.

## Rules

- Treat keys as a flat namespace. Use prefixes (`feature:subkey`) for organization and to scope `list`.
- `getJSON` returns `undefined` for missing keys; `get` throws `ValTownBlobNotFoundError`. Handle the absent case accordingly.
- Don't store secrets in blobs — use environment variables for credentials.

## Reference

Full API docs: https://docs.val.town/std/blob/

---

# Client-side JavaScript

Val Town has **no build step and no bundler**. A client-side module is just a file
in your val that you serve over HTTP; Val Town transpiles it per request. You point
a `<script type="module">` at a route that returns the file, and the browser runs
it. There is nothing to configure (no webpack/vite/esbuild).

## Serving a module

`serveFile` from `std/utils` reads a file and serves it with the correct
`Content-Type`. For `.ts`, `.tsx`, and `.jsx` it **transpiles to JavaScript** —
strips types, compiles JSX — and serves `text/javascript`. You serve the source
file; the browser receives runnable JS.

```ts
import { serveFile } from "https://esm.town/v/std/utils/index.ts";

// in any HTTP handler — serve a client module at some URL path
app.get("/app.tsx", (c) => serveFile("/app.tsx"));
```

Then load it from your HTML:

```html
<script type="module" src="/app.tsx"></script>
```

The path you serve at and the file's location are up to you. A common shortcut is a
wildcard that serves a whole directory of modules and assets:

```ts
app.get("/client/**/*", (c) => serveFile(c.req.path));
```

`serveFile` defaults to the current val. If you call it from a non-entrypoint file
and paths don't resolve, pass `import.meta.url` as the second argument.

## Default: versioned, immutably cached modules

`serveImmutableFile` makes your val's frontend faster by letting browsers cache
files immutably; publishing bumps the val's version, which invalidates
automatically. Measured: repeat visits **665ms → 157ms with zero asset requests**.

```ts
import { immutableFileUrl, serveImmutableFile } from "https://esm.town/v/std/utils/index.ts";

app.get("/__immutable/*", (c) => serveImmutableFile(c.req.path));
```

In the never-cached HTML shell, stamp the entry module:
`immutableFileUrl("/frontend/index.tsx")` → `/__immutable/42/frontend/index.tsx`
(42 = the val's current version). Relative imports resolve under the same prefix,
so only the entry needs stamping — one route and one stamped URL cover the whole
client graph.

- Old-version URLs 404 after a publish (like Next.js build assets); a reload
  picks up the new version.
- Retrofitting an existing val without touching its shell? Also point its old
  file route at `serveImmutableFile` — bare paths then 302 into versioned space,
  at one redirect per page view.

### Alternative: serve directly from esm.town

Every val file already has a public esm.town URL that transpiles on demand, so you
can skip `serveFile` and point a script straight at it:

```html
<script type="module" src="https://esm.town/v/youruser/yourval/app.tsx"></script>
```

`serveFile` is usually preferred because the module is served same-origin from a
path you control, and you don't have to hardcode your own val URL.

## How imports resolve in the browser

The transpiler does not bundle or rewrite imports — it only strips types and JSX.
So every import in a client module must be something the **browser** can fetch as a
URL:

- **Local imports need explicit extensions.** `import { x } from "./util.ts"`
  resolves to `/util.ts` (or relative to the served path) and must be served too —
  by the same route or a wildcard. Omitting the extension (`./util`) 404s.
- **Third-party deps need full ESM URLs.** Bare specifiers like `import React from
  "react"` don't resolve in the browser. Import from a CDN such as esm.sh, with
  versions pinned:

  ```ts
  import { createRoot } from "https://esm.sh/react-dom@18.2.0/client";
  ```

  An [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap)
  in the HTML is an option if you want bare specifiers in client code.

The same model works for any client code — React, vanilla DOM scripts, a canvas
game loop, Alpine, htmx. Only the imports differ; for a plain `.ts` module with no
dependencies there's nothing to load from a CDN at all.

## React specifics

Pin all React-family imports to the same version (18.2.0) and pass
`?deps=react@18.2.0,react-dom@18.2.0` on libraries that depend on React. Mismatched
copies cause `Cannot read properties of null (reading 'useState')`. See the
`react-ui` skill for JSX and styling conventions.

## What not to do

- **No app logic in inline `<script>` blobs or template-string HTML.** Put client
  code in real `.ts`/`.tsx` files so it's typed, linted, and reviewable. A few lines
  of inline bootstrap are fine; the app is not.
- **No bundler / build command.** There is no build step to add.
- **`serveStatic` from Hono does not work** on Val Town — use `serveFile`.

## Verifying changes

Fetch the module's URL (e.g. `/app.tsx`) and confirm it returns `text/javascript`,
not HTML or an error. Add `https://esm.town/v/std/catch` to the HTML shell to pipe
browser errors into `get_logs`, then load the page and check the logs. Don't report
the change as done without both.

---

Skills in Val Town instruct Townie and other AI agents using the Val Town MCP server how to write idiomatic vals that respect a user's preferences and knowledge.

In any val, a user can create a `/skills/<name>/SKILL.md` file, e.g. `/skills/design/SKILL.md`. 
Townie and the Val Town MCP server index skills with that directory/file structure across all of a user's vals. 
A user may choose to centralize their skills in one val or co-locate skills across multiple vals.

## Frontmatter

A skill markdown file must have frontmatter:

- `name`: kebab-case name of the skill; contains lowercase letters, numbers, and hyphens
- `description`: helps the agent decide when the skill is relevant. **A good skill description is critical for agent discovery**
- `triggers`: (optional) is a list of keywords to tip off the agent

The `description` and `triggers` fields enable skill discovery, i.e. tells the user's AI agent (e.g. Claude Code, Codex, Cursor) when to use it. 
The more specific the better, including key terms that should trigger use (which can also be enumerated in `triggers`). 
Skills without frontmatter will be silently skipped, so Townie/MCP will not be able to access them.

## Best practices

The [Claude Platform Docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) offer skill authoring best practices, including:

- Be concise. The context window is a public good
- Always write in third person
- Default assumption: AI agents are already very smart
- Be as specific as possible (e.g. code is better than plain english where possible)
- Improve skills based on usage and testing

## Example

```md
---
name: design
description: Use when styling a val's UI. Use for frontend vals that return JSX or HTML
triggers: [css, styling, layout, theme]
---

- Use `.css` files, avoid inline styles and Tailwind
- Locate React components in a `/components` directory, one component per file
- Use a sans-serif web-native font stack, no external fonts
- ...
```

## Remixing

A new skill can be created by remixing another user’s skill and customizing the `SKILL.md` file.
There is a remix button in the val.town UI, and a `remix_val` tool in the Val Town MCP server to do so.

---

# Cron / Interval Vals

Interval vals (`fileType: "interval"`) run on a recurring schedule defined by a cron expression. Use them for polling external APIs, sending reminders, running cleanups, generating reports, or any work that should happen on a clock rather than in response to a request.

## Basic handler

```ts
// Learn more: https://docs.val.town/vals/cron/
export default async function (interval: Interval) {
  // interval.lastRunAt: Date | undefined
  console.log(interval);
}
```

The file must have an `export` — `export default` for the handler.

## Timezone

**Cron expressions run in UTC.** Convert any human-readable schedule (e.g. "9am Eastern") to UTC before writing the cron expression. Daylight savings is not handled — pick a UTC time that's close enough year-round.

## The `lastRunAt` pattern

`interval.lastRunAt` is the timestamp of the previous successful run (or `undefined` on the first run). Use it to fetch only items created since the last run, instead of re-scanning everything:

```ts
export default async function (interval: Interval) {
  const since = interval.lastRunAt ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
  const newItems = await fetchItemsSince(since);
  for (const item of newItems) {
    await handle(item);
  }
}
```

This makes the val idempotent against missed runs and avoids reprocessing.

## Reading and updating the schedule

- `read_interval_settings` — fetch the current cron expression and active state of an interval file.
- `write_interval_settings` — change the cron expression or pause/resume an interval.

## When to skip a template

For simple scheduled jobs, create a new val with a single `interval`-type file directly — no template needed. Templates are for more complex shapes (dashboards, AI agents, webhook + UI combos).

## Verifying changes

After editing an interval val, use `run_file` to invoke the handler manually instead of waiting for the next scheduled run.

---

# Email

Val Town supports both directions: vals can be **triggered by** incoming mail (email-type vals) and can **send** mail via `std/email`.

## Receiving email — email-type vals

Email vals (`fileType: "email"`) run when a message is delivered to the val's assigned address.

```ts
// Learn more: https://docs.val.town/vals/email/
// Email type: {
//   from: string,
//   to: string[],
//   subject?: string,
//   text?: string,
//   html?: string,
//   attachments: File[],
//   headers: Record<string, string>
// }
export default async function (e: Email) {
  console.log(e.from, e.subject, e.text);
}
```

The file must have an `export` — `export default` for the handler.

**Maximum 30MB per message**, including attachments. Larger messages will be rejected.

### Reading the assigned address

When you list files or create an email-type file, the response includes `links.email` — the address that triggers this val. **Always read this from the API response. Never construct an email address yourself** — the format is owned by the platform and may change.

## Sending email — `std/email`

For outgoing mail, import from `std/email`:

```ts
import { email } from "https://esm.town/v/std/email";

await email({
  to: "user@example.com",
  subject: "Hello",
  text: "Message body",
});
```

`std/email` exports `email` as the send function itself — call it directly (`email({ ... })`); there is no `email.send` method. It accepts the shape you'd expect: `to`, `subject`, `text`, `html`, plus `from`, `cc`, `bcc`, `replyTo`, `attachments`, and `headers`. If no `to` field is specified, it defaults to sending mail to the val owner's address.

## Replying to an incoming message

Combine the two — read the inbound `from` in an email-type handler, then call `email` to reply:

```ts
import { email } from "https://esm.town/v/std/email";

export default async function (e: Email) {
  await email({
    to: e.from,
    subject: `Re: ${e.subject ?? ""}`,
    text: "Got it, thanks!",
  });
}
```

## Verifying changes

After editing an email-type val, use `run_file` with a sample `Email` payload to invoke the handler manually instead of waiting for a real incoming message. For send-only vals, run the script the same way and check `get_logs` for delivery errors.

---

# HTTP Endpoints

HTTP vals (`fileType: "http"`) export a request handler and run on every incoming HTTP request. Each HTTP file is assigned a live URL — never construct it yourself; read `links.endpoint` from `list_files` or `create_file` responses, or call `fetch_val_endpoint`.

That URL is open to anyone unless the val's app access (`httpPrivacy`) is `restricted`, in which case unauthenticated callers get a `302` to a login page instead of your response — see the `restricted-access` skill.

## Basic handler

```ts
// Learn more: https://docs.val.town/vals/http/
export default async function (req: Request): Promise<Response> {
  return Response.json({ ok: true });
}
```

The file must have an `export` — `export default` for the handler.

## Hono

When using Hono, export `app.fetch` (not `app`):

```ts
import { Hono } from "npm:hono";
import { parseVal, serveImmutableFile } from "https://esm.town/v/std/utils/index.ts";

const app = new Hono();

app.get("/", (c) => c.text("hello"));

// Immutable asset caching (see the client-side-js skill): serves the
// current-version URLs your HTML shell stamps with immutableFileUrl()
app.get("/__immutable/*", (c) => serveImmutableFile(c.req.path));

// View source redirect
app.get("/source", (c) => c.redirect(parseVal().links.self.val));

// Always add this for full stack traces on errors:
app.onError((err) => Promise.reject(err));

export default app.fetch;
```

Hono's `serveStatic` does **not** work on Val Town. Use `serveFile` / `staticHTTPServer` from `std/utils` for static files. For the full `std/utils` API (`readFile`, `serveFile`, `staticHTTPServer`, `listFiles`, `listFilesByPath`, `httpEndpoint`, `parseVal`, …), fetch `https://utilities.val.run/docs.md`.

## CORS

Val Town adds permissive CORS headers by default (`Access-Control-Allow-Origin: *`), so in 99% of cases, you should never need to do anything with CORS. Using Hono's `cors` middleware is almost always unnecessary. 

If you set **any** CORS header yourself, Val Town stops adding **all** default headers — so either handle CORS completely yourself or don't touch it at all.

## Redirects

`Response.redirect` is broken on Val Town. Use one of:

```ts
return new Response(null, { status: 302, headers: { Location: "/path" } });
// or, with Hono:
return c.redirect("/path");
```

## What's not available

- **WebSockets**: Val Town does not accept incoming WebSocket connections. Use polling, long polling, or server-sent events instead.
- **Filesystem access**: see the platform constraints. For persistent state, use `std/sqlite` or `std/blob`.

## Surfacing client-side errors

For HTML responses, add this script tag to send browser errors back to val logs (visible via `get_logs`):

```html
<script src="https://esm.town/v/std/catch"></script>
```

## Verifying changes

After editing an HTTP val, fetch it to confirm it returns the expected HTTP response. Do not report a change as done without this step.

---

# OAuth (std/oauth)

Val Town provides zero-config "Log in with Val Town" via `std/oauth`. No database setup, no provider config — wrap your Hono fetch handler and you get login, logout, and session management for free. Sessions are stored in encrypted cookies and last 30 days.

This is for **Val Town account login only**. For Google / GitHub / Slack / etc. OAuth, see the `third-party-integrations` skill — those flows are documented per-service.

If the goal is to keep an app internal to a team rather than to give it its own logged-in users, restricting the val's app access is the simpler answer — the platform gates the endpoint before your code runs, and you write no auth code. See the `restricted-access` skill. Don't apply both to one val: a restricted val that also runs `oauthMiddleware` makes visitors authenticate twice.

## Imports

```ts
import {
  getOAuthUserData,
  oauthMiddleware,
} from "https://esm.town/v/std/oauth/middleware.ts";
```

## Wrapping your app

`oauthMiddleware(handler)` takes your Hono fetch handler and returns a wrapped handler that injects three auto-managed routes:

- `GET /auth/login` — starts the login flow
- `GET /auth/callback` — completes the login flow
- `POST /auth/logout` — clears the session

Export the wrapped handler as the val's default:

```ts
import { Hono } from "npm:hono";
import { oauthMiddleware } from "https://esm.town/v/std/oauth/middleware.ts";

const app = new Hono();
app.onError((err) => Promise.reject(err));

app.get("/", (c) => c.text("hello"));

export default oauthMiddleware(app.fetch);
```

You don't write the `/auth/*` routes yourself — the middleware adds them. Don't shadow them in your own app.

## Reading the current user

Call `getOAuthUserData(rawRequest)` from any route. In Hono, `rawRequest` is `c.req.raw`. It returns the session data if the request is authenticated, or `null` otherwise.

```ts
interface SessionData {
  user: {
    id: string;
    username: string | null;
    email: string | null;
    bio: string | null;
    tier: "free" | "pro" | null;
    type: "user" | "org";
    url: string;
    links: {
      self: string;
      profileImageUrl: string | null;
    };
  };
  accessToken: string; // Val Town API token (act on behalf of the user)
  refreshToken?: string;
  idToken?: string;
  expiresAt: number; // Unix timestamp (ms)
  isOrgMember?: boolean; // true if user belongs to this val's org
}
```

```ts
app.get("/", async (c) => {
  const session = await getOAuthUserData(c.req.raw);
  if (session?.user) {
    return c.html(
      `<p>Logged in as ${session.user.username}</p>` +
      `<form method="POST" action="/auth/logout"><button>Log out</button></form>`
    );
  }
  return c.html(`<a href="/auth/login">Log in with Val Town</a>`);
});
```

## Gating routes

There's no built-in "require login" helper — gate routes by checking `getOAuthUserData` and returning a 401 or redirecting to `/auth/login` when the session is missing:

```ts
app.get("/dashboard", async (c) => {
  const session = await getOAuthUserData(c.req.raw);
  if (!session?.user) return c.redirect("/auth/login");
  return c.html(`<h1>Welcome ${session.user.username}</h1>`);
});
```

## What you don't need to configure

- No env vars — credentials and redirect URLs are handled by the platform.
- No callback URL setup — `/auth/callback` is wired automatically.
- No session store — sessions live in encrypted cookies.

## Verifying changes

After adding OAuth, call `fetch_val_endpoint` on a gated route to confirm it redirects or 401s when unauthenticated. The full login flow requires a real browser session and can't be exercised by `fetch_val_endpoint` alone — share the live URL and have the user try logging in.

---

# React UI

For any val that renders a UI, prefer to build it with React components in `.tsx` files, unless the user states otherwise. The `templates/react-hono-starter` template is set up for this — start there with `remix_val` instead of building from scratch.

## File conventions

Put markup, styles, and scripts in real files — avoid template literal strings (e.g. `new Response(\`<html>...</html>\`)`). Code in template strings has no syntax highlighting, no linting, no type checking, and is unreviewable.

- `.tsx` — React/JSX components, any UI with logic or interactivity
- `.html` — purely static markup
- `.ts` — server code and scripts

Build UI **component by component** in `.tsx` files. Compose small components rather than rendering one giant page.

## Styling: Twind + Tailwind

Prefer Twind to apply Tailwind utility classes at runtime — no build step required. Add the script to your HTML shell:

```html
<script src="https://cdn.twind.style" crossorigin></script>
```

Then use Tailwind classes directly in JSX:

```tsx
<div className="flex items-center gap-4 p-6 rounded-lg bg-white shadow">
  <h1 className="text-2xl font-bold">Hello</h1>
</div>
```

Avoid inline `<style>` tags, CSS-in-JS objects, or separate `.css` files, unless the user says otherwise.

## Serving assets: versioned + immutable

Serve client modules with `serveImmutableFile` from `std/utils` — browsers cache
them immutably, and publishing bumps the val's version, which invalidates
automatically (full pattern: the `client-side-js` skill). A never-cached
`frontend/root.tsx` shell (hono/jsx) stamps the entry and favicon with
`immutableFileUrl`:

```tsx
// frontend/root.tsx — in the Root() HTML shell:
<script src={immutableFileUrl("/frontend/index.tsx")} type="module" />

// index.ts:
app.get("/", (c) => c.html(Root()));
app.get("/__immutable/*", (c) => serveImmutableFile(c.req.path));
```

## View source link

Every UI val should expose a way for users to see and remix its source. Both parts are required:

1. Backend route:
   ```ts
   import { parseVal } from "https://esm.town/v/std/utils/index.ts";
   app.get("/source", (c) => c.redirect(parseVal().links.self.val));
   ```
2. Visible link in the frontend:
   ```tsx
   <a href="/source">view source</a>
   ```

## React version pinning

A common error — `"Cannot read properties of null (reading 'useState')"` — means a React sub-dependency is loading a different React version. Pin all React-related imports to 18.2.0:

```ts
import SomeLib from "https://esm.sh/some-lib?deps=react@18.2.0,react-dom@18.2.0";
```

## Assets

Do not use external images or hosted assets that may break. Prefer:

- Emojis or unicode symbols
- Inline SVG
- Icon fonts via CDN (Lucide, Font Awesome)

## Surfacing client-side errors

To send browser errors back to val logs (visible via `get_logs`), include this script in your HTML shell:

```html
<script src="https://esm.town/v/std/catch"></script>
```

## Verifying changes

After editing a UI val, call `fetch_val_endpoint` to confirm the page renders without error, then check `get_logs` for any client-side errors. Don't report the change as done without both.

---

# Restricted App Access

A val has two independent access settings. Changing one does not change the other:

- **Code** (`privacy`: `public` / `unlisted` / `private`) — who can read the source on val.town.
- **App access** (`httpPrivacy`: `public` / `restricted`) — who can call the val's HTTP endpoints.

A val can have private code and a wide-open endpoint, or public code and a locked-down endpoint. `update_val`'s `privacy` field only moves the first one; app access is changed with `set_http_privacy`.

Restricted app access is available to organizations that have the feature enabled. Vals created in such an org may default to `restricted` — always read `httpPrivacy` off a `get_val_detail`, `list_vals`, `create_val`, or `remix_val` response rather than assuming a new val's URL is open.

## Is this the right tool?

Two different things both sound like "make my app require a login":

- **Restricted app access** (this skill) gates the endpoint at the platform edge, before your code runs. Requests from people without access never reach the val. You write no auth code. Access is granted to whole organizations, not to individuals.
- **`std/oauth`** (see the `oauth` skill) runs *inside* your val: you wrap your handler, and anyone with a Val Town account can log in. You control the session and can build per-user features.

Pick restricted access for an internal tool that only your team should reach. Pick `std/oauth` when any Val Town user may sign in and the app needs its own notion of a logged-in user.

Don't stack them by accident. Adding `oauthMiddleware` to an already-restricted val means the visitor authenticates twice — once at the gate, once in your code. If a restricted val needs to know *who* is viewing, use the identity header below instead of adding OAuth.

## Who gets through

Access is granted to **organizations**, not individual people. A viewer gets in when the val has a grant to an org *and* that viewer is a member of it. Removing either one revokes access on the very next request — nothing is cached for the length of a session.

Grants come from:

- **Direct grants** — `add_allowed_user` grants an org, `list_allowed_users` shows current grants, `remove_allowed_user` revokes one.
- **Domain rules** — a val can admit everyone with an email address at a given domain. These appear in `list_allowed_users` alongside direct grants.
- **Invitations** — someone outside a granted org can be invited by email and gains access when they accept.
- **Bypass tokens** — a project-scoped secret for machines; see below.

## What everyone else sees

An unauthenticated request does **not** reach the val. The platform answers with a `302` redirect to a Val Town login or authorization page. This is the single most common source of confusion when debugging a restricted val:

- `fetch_val_endpoint` reports a redirect it won't follow.
- `curl` shows a `302` to `val.town` instead of your response.
- An API client gets HTML from a login page where it expected JSON.
- A visitor without access who *is* logged in gets a `403` explaining they need access to their organization.

None of these mean the val's code is broken. Check `httpPrivacy` first — if it's `restricted`, the gate is doing its job. Make the val public with `set_http_privacy`, grant the caller's org, or use a bypass token.

## Automation and webhooks

Machines can't complete a login redirect, so a restricted val that receives webhooks (Stripe, GitHub, a cron job in another val) needs a **bypass token** — a secret scoped to that one val.

Create it with `create_bypass_token`; the secret is shown once and cannot be retrieved again. Manage tokens with `list_bypass_tokens` and `revoke_bypass_token`.

Present it either way:

```ts
// Header (preferred — keeps the secret out of logs and referrers)
await fetch(url, { headers: { "X-Val-Town-Access": Deno.env.get("MY_BYPASS_TOKEN")! } });

// Query param (for services that only accept a URL, e.g. some webhook configs)
await fetch(`${url}?val_town_access=${Deno.env.get("MY_BYPASS_TOKEN")}`);
```

The platform strips the header and the query param before your handler runs, so your code never sees them. A bypass-token request carries **no viewer identity** — it is an anonymous machine caller.

## Identifying the viewer

For a human viewer who came in through the gate, the platform forwards a short-lived signed `X-Val-Town-User` header. It is not the identity itself — exchange it for the viewer's profile using the val's own API token, which Val Town injects as the `valtown` environment variable:

```ts
const IDENTITY_HEADER = "X-Val-Town-User";

/** Returns the viewer's public profile, or null when there isn't one. */
async function getViewer(req: Request) {
  const signed = req.headers.get(IDENTITY_HEADER);
  if (!signed) return null;

  const res = await fetch("https://api.val.town/v3/val/viewer", {
    headers: {
      Authorization: `Bearer ${Deno.env.get("valtown")}`,
      [IDENTITY_HEADER]: signed,
    },
  });
  if (!res.ok) return null;

  // { id, username, type, bio, profileImageUrl, url, links }
  return await res.json();
}
```

Rules that matter:

- **Always treat the viewer as optional.** There is none on a public val or a bypass-token request. Never `!`-assert it or index into a null result.
- **Resolve it server-side, on each request.** The credential is short-lived and tied to your val — don't persist it, hand it to the browser, or attempt the lookup from client-side code.
- **Only public profile fields come back** — handle, bio, avatar, profile URL. No email address, no billing tier. Don't build a val that depends on those.

The transport above (`X-Val-Town-User` plus the `/v3/val/viewer` exchange) is how this works today and may change; the three rules hold regardless.

## Managing app access

| Task | Tool |
| --- | --- |
| Check the current setting | `get_val_detail` (`httpPrivacy` field) |
| Make an endpoint public or restricted | `set_http_privacy` |
| See who has access | `list_allowed_users` |
| Grant / revoke an org | `add_allowed_user` / `remove_allowed_user` |
| Create / list / revoke automation secrets | `create_bypass_token` / `list_bypass_tokens` / `revoke_bypass_token` |

Restricted vals can only be iframed by val.town, so an embed of one on an external site will be blocked by the browser regardless of who's logged in.

---

# SQLite Storage

Val Town provides built-in SQLite via the `std/sqlite` module. Reach for it whenever a val needs relational or structured persistent data. For simple key/value data, prefer `std/blob` instead.

## Basic usage

```ts
import { sqlite } from "https://esm.town/v/std/sqlite/main.ts";

await sqlite.execute(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE
)`);

await sqlite.execute({
  sql: "INSERT INTO users (name, email) VALUES (?, ?)",
  args: ["Alice", "alice@example.com"],
});

const result = await sqlite.execute("SELECT * FROM users");
// result.rows = [{ id: 1, name: "Alice", email: "alice@example.com" }]
```

## Transactions

Use `sqlite.batch` for atomic multi-statement transactions — all succeed or all roll back:

```ts
await sqlite.batch([
  { sql: "INSERT INTO users (name, email) VALUES (?, ?)", args: ["Bob", "bob@example.com"] },
  { sql: "UPDATE users SET name = ? WHERE id = ?", args: ["Robert", 2] },
]);
```

## Per-val vs organization databases

The import path determines which database you get. Both expose the same `@libsql/client` API (`execute`, `batch`) and return rows as keyed objects (`Record<string, unknown>[]`):

- `std/sqlite/main.ts` — **val-scoped** database, isolated to this val. The default for new vals, and what you almost always want.
- `std/sqlite/global.ts` — **organization-scoped** database, shared across every val owned by the same account. (Your personal account counts as its own organization here, so this database is shared across all of your vals.)

Do not switch an existing val between these import paths — it changes which database the val reads and writes.

## Querying org-owned vals via tools

When using the `sqlite_execute` or `sqlite_batch` tools to query a val owned by an organization (not your personal account), pass the org handle as the `org` parameter so the call hits the right database. Example: `{ sql: "SELECT * FROM users", org: "some-org" }`. This only matters for the tool calls — code inside the val itself reads from its own database automatically.

## Rules

- Always use parameterized queries (the `args` field) for any value derived from user input. Never interpolate strings into SQL.
- Use `CREATE TABLE IF NOT EXISTS` so schema setup is idempotent across val restarts.
- Schema migrations: add new columns with `ALTER TABLE ... ADD COLUMN`. Wrap in `try/catch` if the migration may run against an already-updated table.

## Reference

Full API docs: https://docs.val.town/reference/std/sqlite/usage/

---

# Third-Party Integrations

When a val uses any external service, follow this order — do not skip steps and do not write integration code from training-data memory alone. Val Town's guides have platform-specific patterns and required workarounds that won't be in your training data.

## Workflow

1. **Fetch the Val Town guide first.** Guides live under `https://docs.val.town/guides/`, but the slug isn't always just the service name — some are grouped under a category (e.g. `databases/neon-postgres/`, `browser-automation/kernel/`) or live on a sub-page (`slack/agent/`). Don't guess the URL: fetch the docs sitemap at `https://docs.val.town/sitemap-0.xml` (it lists every docs URL), find the `guides/…` entry that matches the service, and fetch that page before writing any integration code.
2. **Help the user get credentials.** Provide direct links to create API keys or step-by-step OAuth setup instructions. Don't make the user hunt.
3. **Test the connection** with a minimal script (a single fetch / SDK call that returns one record) before building features on top. This isolates auth/setup problems from feature bugs.
4. **Store secrets in env vars.** Use `Deno.env.get("KEY_NAME")` to read them, and document the required env vars in the README so the user (or anyone remixing the val) knows what to set. Whenever you reference an env var the user needs to set, show the raw, full URL to the prefilled Val Town env var editor on its own line, in this exact format: `👉 Add KEY_NAME here: https://www.val.town/x/HANDLE/VAL_NAME/environment-variables?key=KEY_NAME`. Keep the URL visible (not hidden behind link text) — it's the call-to-action.

## Available guides

Services with dedicated guides today — not exhaustive, so use the sitemap from step 1 as the current source of truth:

- **Messaging / chat:** Slack, Discord, Telegram
- **Payments:** Stripe
- **Email:** Gmail (for sending via a user's account; for built-in mail use `std/email` instead — see the `email` skill)
- **Google:** Google Sheets
- **External databases:** Neon Postgres, Supabase, Upstash (for SQLite use built-in `std/sqlite` instead — see the `sqlite-storage` skill)
- **Browser automation:** Kernel (recommended for Playwright), Browserbase, Steel, Browserless
- **Source control / webhooks:** GitHub (including webhooks)
- **Content / output:** RSS feeds, PDF generation, web scraping
- **Notifications:** push notifications
- **Auth:** OAuth providers (for logging in with a Val Town account use `std/oauth` instead)

## Why this matters

Integration code is the most common place models hallucinate. APIs change, auth flows get reworked, and platform constraints (no filesystem, no subprocess) break naive approaches. The Val Town guide is the source of truth for what currently works on the platform.
