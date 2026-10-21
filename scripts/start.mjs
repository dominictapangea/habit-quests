// One command without Docker: `npm start` in the repository root.
// Installs dependencies when missing, builds the UI, then runs the API on
// port 3001 and the UI on port 3000 until Ctrl+C.
import { spawn } from "node:child_process";
import { join } from "node:path";
import { checkNode, installIfMissing, root, run } from "./setup.mjs";

checkNode();
installIfMissing();
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
