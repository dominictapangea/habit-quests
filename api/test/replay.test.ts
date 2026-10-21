// Replays all 68 recorded requests against our API, in order, with their
// X-Now header, and compares every status and body. The recording's ids
// (q1, c1, ...) are mapped to ours as they first appear.
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.ts";

interface Line {
  x_now: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  status: number;
  body?: unknown;
  response?: unknown;
}

const lines: Line[] = readFileSync(new URL("../../docs/reference_recording.jsonl", import.meta.url), "utf8")
  .split("\n")
  .filter((l) => l.trim())
  .map((l) => JSON.parse(l));

// Quest ids and completion ids are separate sequences, so each kind has its
// own map: recorded id <-> our id.
type Kind = "quest" | "completion";
const toOurs = { quest: new Map<string, string>(), completion: new Map<string, string>() };
const toRecorded = { quest: new Map<string, string>(), completion: new Map<string, string>() };

// Which kind of id sits under `key` in `obj` (completions have a quest_id).
function idKind(obj: object, key: string): Kind | null {
  if (key === "quest_id") return "quest";
  if (key === "id") return "quest_id" in obj ? "completion" : "quest";
  return null;
}

// Learn id pairs wherever both bodies have an id at the same place.
function learnIds(expected: unknown, actual: unknown): void {
  if (Array.isArray(expected) && Array.isArray(actual)) {
    expected.forEach((e, i) => learnIds(e, actual[i]));
  } else if (expected && actual && typeof expected === "object" && typeof actual === "object") {
    for (const [key, e] of Object.entries(expected)) {
      const a = (actual as Record<string, unknown>)[key];
      const kind = idKind(expected, key);
      if (kind && typeof e === "string" && typeof a === "string") {
        if (!toOurs[kind].has(e) && !toRecorded[kind].has(a)) {
          toOurs[kind].set(e, a);
          toRecorded[kind].set(a, e);
        }
      } else {
        learnIds(e, a);
      }
    }
  }
}

// Rewrite our ids to recorded ones so bodies can be compared directly.
function translate(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(translate);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => {
        const kind = idKind(value, k);
        if (kind && typeof v === "string") return [k, toRecorded[kind].get(v) ?? `unmapped:${v}`];
        return [k, translate(v)];
      }),
    );
  }
  return value;
}

const mapPath = (path: string) =>
  path
    .replace(/^\/quests\/([^/]+)/, (_m, id: string) => `/quests/${toOurs.quest.get(id) ?? id}`)
    .replace(/^\/completions\/([^/]+)/, (_m, id: string) => `/completions/${toOurs.completion.get(id) ?? id}`);

describe("replay of reference_recording.jsonl", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const dir = mkdtempSync(join(tmpdir(), "habit-quests-"));
    app = buildApp({ dbPath: join(dir, "replay.db") });
    const reset = await app.inject({ method: "POST", url: "/test/reset" });
    expect(reset.statusCode).toBe(204);
  });

  afterAll(async () => {
    await app.close();
  });

  lines.forEach((line, i) => {
    it(`line ${i + 1}: ${line.method} ${line.path} -> ${line.status}`, async () => {
      const res = await app.inject({
        method: line.method,
        url: mapPath(line.path),
        headers: { "x-now": line.x_now },
        ...(line.body !== undefined ? { payload: line.body as object } : {}),
      });

      expect(res.statusCode).toBe(line.status);
      if (line.response === undefined) {
        expect(res.body).toBe("");
        return;
      }
      const actual = res.json();
      learnIds(line.response, actual);
      expect(translate(actual)).toEqual(line.response);
    });
  });
});
