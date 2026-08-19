import { parse } from "yaml";
import { z } from "zod";
import type { Skill } from "./types.js";

/**
 * Matches a leading `---`-delimited YAML frontmatter block and captures the
 * frontmatter source (group 1) and the remaining markdown body (group 2).
 * Input is normalized (BOM stripped, CRLF \u2192 LF) before matching, so this only
 * has to deal with `\n`.
 */
const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;

/**
 * Validates a skill's frontmatter against the `@valtown/skills` `Skill` shape.
 * `name` and `description` are required; `triggers` is optional and normalized
 * to `string[]` (accepts a YAML list or a comma-separated string). Unknown keys
 * are ignored so author additions don't fail validation.
 */
const SkillFrontmatterSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  triggers: z
    .union([z.array(z.coerce.string()), z.coerce.string()])
    .nullish()
    .transform((value) => {
      // `null` (a bare `triggers:` key) must be treated as absent, not coerced
      // to the literal trigger "null".
      if (value === undefined || value === null) return [] as string[];
      const parts = Array.isArray(value) ? value : value.split(",");
      return parts.map((part) => part.trim()).filter(Boolean);
    }),
});

/**
 * Parse a user-authored `SKILL.md` into a `Skill`. Returns `null` for any file
 * that lacks frontmatter, has unparseable YAML, or fails validation — callers
 * skip those rather than surfacing an error, so one malformed skill can't break
 * a request. Validation is deliberately the same `Skill` shape official skills
 * use, keeping user and official content one format.
 */
export function parseSkill(content: string): Skill | null {
  // Strip a leading BOM and normalize CRLF so the regex only deals with `\n`.
  const normalized = content.replace(/^\uFEFF/, "").replaceAll("\r\n", "\n");
  const match = normalized.match(FRONTMATTER_RE);
  if (!match) return null;

  const [, frontmatterYaml, body] = match;

  let data: unknown;
  try {
    data = parse(frontmatterYaml);
  } catch {
    return null;
  }

  const result = SkillFrontmatterSchema.safeParse(data);
  if (!result.success) return null;

  return {
    name: result.data.name,
    description: result.data.description,
    triggers: result.data.triggers,
    body: body.trim(),
  };
}
