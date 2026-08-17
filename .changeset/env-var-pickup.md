---
"@valtown/skills": patch
---

Updated the `third-party-integrations` skill to document that environment variables set via the Val Town API, SDK, or MCP tool are picked up on the next HTTP request against a warm isolate, while UI/settings changes may still require a redeploy.
