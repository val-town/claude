---
"@valtown/skills": patch
---

Version sync now updates every plugin manifest (Claude, Codex, and Cursor plugin.json plus the Cursor marketplace.json `metadata.version`), not just the Claude manifest — preventing the Codex/Cursor manifests from advertising a stale version on release.
