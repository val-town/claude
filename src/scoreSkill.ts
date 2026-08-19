import type { Skill } from "./types.js";

/**
 * Case-insensitive token scorer mirroring `@valtown/skills`' `searchSkills`:
 * name/description/triggers matches weigh more than body matches. Kept local so
 * official and personal skills rank on a single comparable scale when merged in
 * find_val_town_skills. A deliberately simple starting point — see
 * docs/USER_SKILLS.md for the plan to upstream a shared scorer into the package.
 */
export function scoreSkill(skill: Skill, query: string): number {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
  if (tokens.length === 0) return 0;

  const name = skill.name.toLowerCase();
  const description = skill.description.toLowerCase();
  const triggers = skill.triggers.join(" ").toLowerCase();
  const body = skill.body.toLowerCase();

  let score = 0;
  for (const token of tokens) {
    if (name.includes(token)) score += 10;
    if (description.includes(token)) score += 5;
    if (triggers.includes(token)) score += 5;
    if (body.includes(token)) score += 1;
  }
  return score;
}
