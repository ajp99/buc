// On Windows a lowercase drive letter in the cwd ("c:\") makes vitest load two
// copies of itself and every test fails with "reading 'config'". Re-run vitest
// from the canonical path so the casing is consistent.
import { spawnSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { join } from "node:path";

const root = realpathSync.native(process.cwd());
const cli = join(root, "node_modules", "vitest", "vitest.mjs");
const { status } = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], {
  cwd: root,
  stdio: "inherit",
});
process.exit(status ?? 1);
