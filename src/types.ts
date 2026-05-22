/**
 * Frontmatter fields for a skill, plus its markdown body.
 * `name` and `description` are required; `triggers` is a list of keyword hints
 * that boost search relevance (ignored by Claude Code's native skill loader).
 */
export interface Skill {
  name: string;
  description: string;
  triggers: string[];
  body: string;
}

/** A skill with a relevance score, returned from `searchSkills`. */
export interface SkillSearchResult extends Skill {
  score: number;
}
