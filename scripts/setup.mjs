// Shared by `npm start` and `npm test`: check Node, install what is missing.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Node runs the API's TypeScript directly and uses its built-in SQLite:
// both work without flags from Node 22.18 on.
export function checkNode() {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 18)) {
    console.error(`Node ${process.versions.node} is too old: Habit Quests needs Node 22.18 or newer (24 LTS recommended).`);
    process.exit(1);
  }
}

// npm is a script on Windows (npm.cmd), so it runs through the shell; each
// command is one fixed string with no user input in it.
export function run(dir, command) {
  console.log(`\n> ${dir}: ${command}`);
  const result = spawnSync(command, { cwd: join(root, dir), stdio: "inherit", shell: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

export function installIfMissing() {
  for (const dir of ["api", "web"]) {
    if (!existsSync(join(root, dir, "node_modules"))) run(dir, "npm ci");
  }
}
