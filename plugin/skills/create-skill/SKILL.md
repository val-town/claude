---
name: create-skill
description: Use when the user wants to persist a preference, skill, or knowledge. Use when it would aid future val development to store a memory of how best to build something.
---

In any val, a user can create a `/skills/<name>/SKILL.md` file, e.g. `/skills/design/SKILL.md`. 
Townie and the Val Town MCP server index skills with that directory/file structure across all of a user's vals. 
Any agent can make use of Val Town skills to write idiomatic vals and respect user preferences.
A user may chose to centralize their skills in one val or co-locate skills across multiple vals.

## Frontmatter

A skill markdown file must have frontmatter:

1. `name`: typically matches the subdir name slug
2. `description`: helps the agent decide when the skill is relevant
3. `triggers`: (optional) is a list of keywords to tip off the agent

The `description` and `trigger` fields enable skill discovery, i.e. tells the user's AI agent (e.g. Claude Code, Codex, Cursor) when to use it. 
The more specific the better, including key terms that should trigger use (which can also be enumerated in `triggers`). 
Skills without frontmatter will be silently skipped, so Townie/MCP will not be able to access them.

## Best practices

The [Claude Platform Docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) offer skill authoring best practices, including:

- Be concise. The context window is a public good
- Always write in third person
- Default assumption: AI agents are already very smart
- Be as specific as possible (e.g. code is better than plain english where possible)
- Improve skills based on usage and testing

## Remixing skills

To adopt another user’s skills, a user or AI agent can remix the val and customize the `SKILL.md` file.
There is a remix button in the val.town UI, and a `remix_val` tool in the Val Town MCP server.
It is trivially easy to remix a skill, and customizing skills is powerful because they can be personalized based on a user's specific knowledge and preferences.
