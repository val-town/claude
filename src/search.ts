import type { Skill, SkillSearchResult } from "./types.js";
import { skillList } from "./generated/skills.js";

/** Return the full skill catalog. */
export function getSkills(): Skill[] {
  return skillList;
}

/**
 * Rank skills against a free-text query. Name/description/triggers matches score
 * higher than body matches, so descriptions are the primary discovery signal.
 * Case-insensitive token matching — a deliberately simple starting point that
 * can be swapped for embeddings later without changing call sites.
 */
export function searchSkills(query: string, limit = 5): SkillSearchResult[] {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1);
  if (tokens.length === 0) return [];

  const results: SkillSearchResult[] = [];
  for (const skill of skillList) {
    const meta =
      `${skill.name} ${skill.description} ${skill.triggers.join(" ")}`.toLowerCase();
    const body = skill.body.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (meta.includes(token)) score += 3;
      if (body.includes(token)) score += 1;
    }
    if (score > 0) results.push({ ...skill, score });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}
