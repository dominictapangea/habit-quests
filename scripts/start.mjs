// One command without Docker: `npm start` in the repository root.
// Installs dependencies when missing, builds the UI, then runs the API on
// port 3001 and the UI on port 3000 until Ctrl+C.
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Node runs the API's TypeScript directly and uses its built-in SQLite:
// both work without flags from Node 22.18 on.
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 18)) {
  console.error(`Node ${process.versions.node} is too old: Habit Quests needs Node 22.18 or newer (24 LTS recommended).`);
  process.exit(1);
}

// npm is a script on Windows (npm.cmd), so it runs through the shell; each
// command is one fixed string with no user input in it.
function run(dir, command) {
  console.log(`\n> ${dir}: ${command}`);
  const result = spawnSync(command, { cwd: join(root, dir), stdio: "inherit", shell: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

for (const dir of ["api", "web"]) {
  if (!existsSync(join(root, dir, "node_modules"))) run(dir, "npm ci");
}
run("web", "npm run build");

const children = [
  spawn("npm start", { cwd: join(root, "api"), stdio: "inherit", shell: true }),
  spawn("npm start", { cwd: join(root, "web"), stdio: "inherit", shell: true }),
];
console.log("\nHabit Quests: UI on http://localhost:3000, API on http://localhost:3001 (Ctrl+C to stop)\n");

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
  setTimeout(() => process.exit(code), 500);
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
// If either server dies, stop the other one too.
for (const child of children) child.on("exit", (code) => stop(code ?? 1));
