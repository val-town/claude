# @valtown/skills

Platform guidance for building on [Val Town](https://val.town) — the single
source of truth for the "how to write a val" knowledge used by Val Town's own
tools (Townie, the MCP server) and by AI coding tools like Claude Code.

Each skill is a short markdown guide covering one platform topic (HTTP vals,
cron/intervals, SQLite, email, OAuth, React UI, third-party integrations,
templates). This repo ships them two ways from one source:

- **As a Claude Code plugin** — install from this repo; Claude Code loads the
  skills natively and bundles the Val Town MCP server.
- **As an npm library** — `@valtown/skills` exports the skill content and a
  search function for embedding in other tools.

## Install as a Claude Code plugin

```
/plugin marketplace add val-town/claude
/plugin install vals@valtown
```

This makes the platform skills available to Claude and registers the hosted
Val Town MCP server (`https://api.val.town/v3/mcp`). On first use of an MCP tool,
Claude Code runs the OAuth flow in your browser.

## Use as a library

```ts
import { skills, skillList, searchSkills } from "@valtown/skills";

skills["http-endpoints"].body;        // the full guide
searchSkills("store data in a database"); // ranked matches, bodies inline
```

No filesystem access at runtime — the content is compiled into TypeScript at
build time, so it works in any runtime/bundler.

## Authoring skills

Skills live in `skills/<name>/SKILL.md` with YAML frontmatter:

```markdown
---
name: http-endpoints
description: Use when building an HTTP val — a web endpoint, API route, webhook...
triggers: [http, endpoint, webhook, api, request, response]
---

# HTTP Endpoints

...guide body...
```

- `name` (required) — must match the directory name; lowercase, hyphens, ≤64 chars.
- `description` (required) — written as "Use when…"; this is how Claude decides
  to load the skill. ≤1024 chars.
- `triggers` (optional) — keyword hints that boost `searchSkills` ranking;
  ignored by Claude Code's native loader.

Keep content **audience-neutral**: only platform knowledge true for every
consumer. No product-flow or chat-only advice.

Then build:

```
npm install
npm run build   # generate src/generated/skills.ts, then tsc
npm test        # build + smoke tests
```

`npm run generate` validates every skill against both our schema and Claude
Code's frontmatter constraints — a skill that wouldn't load in Claude Code
fails the build.

## Relationship to the Val Town monorepo

This package is the source of truth for skill content. The Val Town app and MCP
server consume it as a dependency rather than holding their own copy. See
`docs/SKILLS_PLUGIN.md` in the main repo for the full design.
