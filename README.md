# Val Town for AI coding agents

Build and deploy on [Val Town](https://val.town) from any AI coding agent.

This package gives your agent two things:

- **The Val Town MCP server** — tools to create, edit, run, and deploy vals,
  query SQLite and blob storage, read logs and traces, and more. It speaks the
  [Model Context Protocol](https://modelcontextprotocol.io), an open standard,
  so it works with any MCP-compatible client.
- **Platform skills** — short markdown guides covering one Val Town topic each
  (HTTP vals, cron/intervals, SQLite, email, OAuth, React UI, third-party
  integrations, templates). These are the single source of truth for "how to
  write a val," shared by Val Town's own tools (Townie, the MCP server) and
  external agents alike.

The MCP server is hosted at `https://api.val.town/v3/mcp` and serves both the
tools and the skill content (via its `find_val_town_skills` tool), so any agent
that connects gets the full experience. It's a remote MCP server with OAuth —
connecting grants the agent the same access as your Val Town account, and it
runs an OAuth flow in your browser on first use.

## Connect

### Claude Code

The richest setup: the plugin bundles the MCP server and pre-loads the skills as
native Claude Code skills. Start a `claude` session, then run:

```
/plugin marketplace add val-town/plugins
/plugin install vals@valtown
```

### Codex CLI

```bash
codex mcp add valtown --url https://api.val.town/v3/mcp
```

Codex detects OAuth support and opens your browser to authorize on first use.

### Cursor

Add to your project's `.cursor/mcp.json` (or the global one):

```json
{
  "mcpServers": {
    "valtown": {
      "url": "https://api.val.town/v3/mcp"
    }
  }
}
```

Cursor shows a `Needs login` prompt — click it to authorize.

### VS Code (Copilot)

Run **MCP: Add Server** from the Command Palette, choose **HTTP**, and enter:

- **Name:** `valtown`
- **URL:** `https://api.val.town/v3/mcp`

### Any other MCP client

Point it at the streamable HTTP endpoint and follow your client's instructions
for adding a remote MCP server:

```
https://api.val.town/v3/mcp
```

## Use the skills as a library

The skills are also published to npm as `@valtown/skills`, so you can embed the
same guidance in your own tools:

```bash
npm install @valtown/skills
```

```ts
import { getSkills, searchSkills } from "@valtown/skills";

const all = getSkills();                         // the full catalog
const hits = searchSkills("how do I store data in a val?"); // ranked matches
```

## Contributing

### Authoring skills

Skills live in `plugin/skills/<name>/SKILL.md` with YAML frontmatter:

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
- `description` (required) — written as "Use when…"; this is how an agent decides
  to load the skill. ≤1024 chars.
- `triggers` (optional) — keyword hints that boost `searchSkills` ranking.

Keep content **agent-neutral**: only platform knowledge true for every consumer.
No product-flow or single-tool-only advice.

Then build:

```
npm install
npm run build   # generate src/generated/skills.ts, then tsc
npm test        # build + smoke tests
```

`npm run generate` validates every skill against both our schema and the
frontmatter constraints of supported clients — a skill that wouldn't load fails
the build.

### Relationship to the Val Town monorepo

This package is the source of truth for skill content. The Val Town app and MCP
server consume it as a dependency rather than holding their own copy. See
`docs/SKILLS_PLUGIN.md` in the main repo for the full design.

### Versioning

This repository uses [Changesets](https://github.com/changesets/changesets)
for publishing. See their documentation for more information.

- For each change that should trigger a new version, you should run `npx @changesets/cli`
  and fill out the interactive prompts to describe the changes. This will generate
  a new changeset in the `.changesets` directory.
- Each change in that directory will prompt the `release.yml` GitHub action
  to create a new release PR.
- Merging a release PR will automatically publish a new version of this module.
