import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildApp } from "./app.ts";

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";
const dbPath = process.env.DB_PATH ?? fileURLToPath(new URL("../data/habit-quests.db", import.meta.url));

mkdirSync(dirname(dbPath), { recursive: true });
const app = buildApp({ dbPath, logger: true });

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    app.close().then(() => process.exit(0));
  });
}

await app.listen({ port, host });
