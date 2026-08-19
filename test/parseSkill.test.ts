import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSkill } from "../src/parseSkill.ts";

test("parses valid frontmatter and trims the body", () => {
  const skill = parseSkill(
    `---
name: weather-api
description: Fetch current weather
---

Use the weather API like this.
`,
  );
  assert.deepEqual(skill, {
    name: "weather-api",
    description: "Fetch current weather",
    triggers: [],
    body: "Use the weather API like this.",
  });
});

test("parses content with a leading BOM and CRLF line endings", () => {
  const skill = parseSkill(
    "\uFEFF---\r\nname: a\r\ndescription: b\r\n---\r\nbody\r\n",
  );
  assert.deepEqual(skill, {
    name: "a",
    description: "b",
    triggers: [],
    body: "body",
  });
});

test("normalizes a YAML list of triggers", () => {
  const skill = parseSkill(
    `---
name: a
description: b
triggers:
  - weather
  - forecast
---
body`,
  );
  assert.deepEqual(skill?.triggers, ["weather", "forecast"]);
});

test("normalizes a comma-separated triggers string", () => {
  const skill = parseSkill(
    `---
name: a
description: b
triggers: weather, forecast ,
---
body`,
  );
  assert.deepEqual(skill?.triggers, ["weather", "forecast"]);
});

test("treats a bare `triggers:` key (YAML null) as no triggers", () => {
  const skill = parseSkill(
    `---
name: a
description: b
triggers:
---
body`,
  );
  assert.deepEqual(skill?.triggers, []);
});

test("ignores unknown frontmatter keys", () => {
  const skill = parseSkill(
    `---
name: a
description: b
extra: ignored
---
body`,
  );
  assert.deepEqual(skill?.name, "a");
});

test("returns null when frontmatter is missing", () => {
  assert.strictEqual(parseSkill("# Just markdown, no frontmatter"), null);
});

test("returns null when name is missing", () => {
  assert.strictEqual(parseSkill("---\ndescription: b\n---\nbody"), null);
});

test("returns null when description is missing", () => {
  assert.strictEqual(parseSkill("---\nname: a\n---\nbody"), null);
});

test("returns null for a blank name", () => {
  assert.strictEqual(parseSkill("---\nname: '   '\ndescription: b\n---\nbody"), null);
});

test("returns null for unparseable YAML", () => {
  assert.strictEqual(parseSkill("---\nname: : :\n  - bad\n---\nbody"), null);
});
