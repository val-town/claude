// Syncs every plugin manifest version to the npm package version.
//
// Changesets only bumps package.json. This keeps the Claude, Codex, and Cursor
// plugin manifests (and the Cursor marketplace manifest) in lockstep so the
// published plugins and the npm package never drift. Run as part of the
// `version` script, so the bump lands in the "Version Packages" PR alongside
// the changelog.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PKG_FILE = join(ROOT, "package.json");

// Manifests that carry a version which must track the npm package version.
// `key` is the dotted path to the version field within each JSON file.
const TARGETS = [
  { file: join(ROOT, "plugin", ".claude-plugin", "plugin.json"), key: "version" },
  { file: join(ROOT, "plugin", ".codex-plugin", "plugin.json"), key: "version" },
  { file: join(ROOT, "plugin", ".cursor-plugin", "plugin.json"), key: "version" },
  { file: join(ROOT, ".cursor-plugin", "marketplace.json"), key: "metadata.version" },
];

const { version } = JSON.parse(readFileSync(PKG_FILE, "utf8"));
if (typeof version !== "string" || version.length === 0) {
  console.error("✗ Could not read version from package.json");
  process.exit(1);
}

const getAt = (obj, key) => key.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
const setAt = (obj, key, value) => {
  const path = key.split(".");
  const last = path.pop();
  const parent = path.reduce((o, k) => (o[k] ??= {}), obj);
  parent[last] = value;
};

let failed = false;
for (const { file, key } of TARGETS) {
  const rel = file.slice(ROOT.length + 1);
  let raw;
  try {
    raw = readFileSync(file, "utf8");
  } catch {
    console.error(`✗ Missing manifest: ${rel}`);
    failed = true;
    continue;
  }

  const manifest = JSON.parse(raw);
  const previous = getAt(manifest, key);

  if (previous === version) {
    console.log(`✓ ${rel} already in sync (${version})`);
    continue;
  }

  setAt(manifest, key, version);
  // Preserve trailing newline if the original had one.
  const trailing = raw.endsWith("\n") ? "\n" : "";
  writeFileSync(file, JSON.stringify(manifest, null, 2) + trailing);
  console.log(`✓ Synced ${rel} ${previous} -> ${version}`);
}

if (failed) process.exit(1);
