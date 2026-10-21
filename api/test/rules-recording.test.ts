// Walks the whole recording and checks that the pure rules reproduce every
// number the old app returned: completion day and base_xp, every `me`, and
// every quest's `done`. No API or database involved.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { baseXp, computeMe, dayInZone, isQuestDone, type Difficulty } from "../src/rules.js";

interface Line {
  x_now: string;
  method: string;
  path: string;
  status: number;
  body?: any;
  response?: any;
}

const lines: Line[] = readFileSync(new URL("../../docs/reference_recording.jsonl", import.meta.url), "utf8")
  .split("\n")
  .filter((l) => l.trim())
  .map((l) => JSON.parse(l));

interface Quest {
  difficulty: Difficulty;
  due_date: string | null;
  recurrence: "daily" | null;
}
interface Completion {
  id: string;
  quest_id: string;
  day: string;
  base_xp: number;
}

describe("rules against the recording", () => {
  const quests = new Map<string, Quest>();
  let live: Completion[] = [];
  let timezone = "Europe/Bucharest";

  lines.forEach((line, i) => {
    const n = i + 1;
    it(`line ${n}: ${line.method} ${line.path} -> ${line.status}`, () => {
      const now = new Date(line.x_now);
      const r = line.response;

      if (line.method === "POST" && line.path === "/quests" && line.status === 201) {
        quests.set(r.id, { difficulty: r.difficulty, due_date: r.due_date, recurrence: r.recurrence });
      }

      if (line.method === "PUT" && line.path === "/me" && line.status === 200) {
        timezone = r.timezone;
      }

      if (line.path.endsWith("/complete") && line.status === 201) {
        const c = r.completion;
        const quest = quests.get(c.quest_id)!;
        expect(c.day).toBe(dayInZone(now, timezone));
        expect(c.base_xp).toBe(baseXp(quest.difficulty, quest.due_date, c.day));
        live.push(c);
      }

      if (line.method === "DELETE" && line.status === 204) {
        const id = line.path.split("/").pop();
        live = live.filter((c) => c.id !== id);
      }

      const me = line.path === "/me" && line.status === 200 ? r : r?.me;
      if (me) {
        expect(computeMe(live, dayInZone(now, timezone), timezone)).toEqual(me);
      }

      if (line.method === "GET" && line.path === "/quests") {
        const today = dayInZone(now, timezone);
        for (const q of r) {
          const own = live.filter((c) => c.quest_id === q.id);
          expect(isQuestDone(quests.get(q.id)!, own, today), `quest ${q.id}`).toBe(q.done);
        }
      }
    });
  });
});
