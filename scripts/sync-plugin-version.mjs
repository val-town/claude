// Syncs the Claude plugin manifest version to the npm package version.
//
// Changesets only bumps package.json. This keeps
// plugin/.claude-plugin/plugin.json in lockstep so the published plugin and
// the npm package never drift. Run as part of the `version` script, so the
// bump lands in the "Version Packages" PR alongside the changelog.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PKG_FILE = join(ROOT, "package.json");
const PLUGIN_FILE = join(ROOT, "plugin", ".claude-plugin", "plugin.json");

const { version } = JSON.parse(readFileSync(PKG_FILE, "utf8"));
if (typeof version !== "string" || version.length === 0) {
  console.error("✗ Could not read version from package.json");
  process.exit(1);
}

const raw = readFileSync(PLUGIN_FILE, "utf8");
const plugin = JSON.parse(raw);

if (plugin.version === version) {
  console.log(`✓ Plugin version already in sync (${version})`);
  process.exit(0);
}

const previous = plugin.version;
plugin.version = version;

// Preserve trailing newline if the original had one.
const trailing = raw.endsWith("\n") ? "\n" : "";
writeFileSync(PLUGIN_FILE, JSON.stringify(plugin, null, 2) + trailing);
console.log(`✓ Synced plugin version ${previous} -> ${version}`);
