import { test } from "node:test";
import assert from "node:assert/strict";

import { skills, skillList, searchSkills } from "../dist/index.js";

test("exposes the skill catalog", () => {
  assert.ok(skillList.length >= 8, "expected at least 8 skills");
  assert.ok(skills["http-endpoints"], "http-endpoints skill present");
  assert.equal(skills["http-endpoints"].name, "http-endpoints");
  assert.ok(skills["http-endpoints"].body.length > 0, "skill has a body");
});

test("search ranks the skill whose name/triggers match first", () => {
  // "sqlite" appears only in the sqlite-storage skill's name and triggers, so
  // it should rank first regardless of body-text overlap elsewhere.
  const results = searchSkills("sqlite table query", 3);
  assert.ok(results.length > 0, "expected matches");
  assert.equal(results[0].name, "sqlite-storage");

  // A term unique to one skill returns only that skill.
  const cron = searchSkills("cron schedule", 3);
  assert.equal(cron[0].name, "cron-and-intervals");
});
