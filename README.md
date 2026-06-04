# Agent plugins for Val Town

Installs the Val Town MCP server and Skills for Claude Code, Codex, and Cursor.

Skills are markdown files with platform guidance for building on [Val Town](https://val.town).
Used by Val Town's own tools (Townie, the MCP server) and by AI coding agents.
Skills include HTTP vals, crons, SQLite, email, OAuth, frontend, and API integrations.

## Install

Installing the plugin makes platform skills available to your agent and registers
the hosted Val Town MCP server (`https://api.val.town/v3/mcp`). On first use of
an MCP tool, the agent runs the OAuth flow in your browser.

1. [Claude Code](#claude-code)
2. [Codex](#codex)
3. [Cursor](#cursor)

### Claude Code

Install the Val Town plugin by running:

```
claude plugin install valtown@claude-plugins-official
```

Alternatively, you can start `claude`, type `/plugin`, and search for `valtown` in the official Claude plugins marketplace.

### Codex

#### `codex` CLI

First, run:

```
codex plugin marketplace add val-town/plugins
```

Then fire up `codex` and run:

```
/plugins
```

Search for Val Town, hit install, and it'll take you through the OAuth path.

#### Codex desktop app

1. Click "Plugins" in the sidebar
2. In the dropdown that says "Built by OpenAI" click "Add more +"
3. Paste this GitHub repo's URL, `https://github.com/val-town/plugins`, and select "Add marketplace"

### Cursor

In Cursor Settings, copy-paste this GitHub repo's URL, `https://github.com/val-town/plugins`, in the search box, then select "Add to Cursor."

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

### Configuration

#### Claude Code

The official Claude plugin marketplace pulls from [`.plugins/marketplace.json`](./.plugins/marketplace.json).

#### Codex

Codex reads the native marketplace at `.agents/plugins/marketplace.json` (and
falls back to the Claude `.claude-plugin/marketplace.json` for compatibility).

#### Cursor

Cursor reads `.cursor-plugin/marketplace.json` and the per-plugin `plugin/.cursor-plugin/plugin.json`.
