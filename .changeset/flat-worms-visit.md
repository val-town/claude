---
"@valtown/skills": minor
---

Generate and export `AGENTS.md` from plugin skills

- `npm run build` now also writes `AGENTS.md` at the repo root and exports `agentsMd` from the package.
- This lets the `vt` CLI and other consumers keep their agent instructions in sync with the latest skill guidance.
