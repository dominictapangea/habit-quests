// Replays the recording against the UI's copy of the rules: every `me` the old
// app returned must equal what the UI would predict from the same completions.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Completion, Quest } from "../lib/api";
import { todayIn } from "../lib/dates";
import { baseXp, computeMe, isQuestDone } from "../lib/rules";

interface Line {
  x_now: string;
  method: string;
  path: string;
  status: number;
  response?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const lines: Line[] = readFileSync(new URL("../../docs/reference_recording.jsonl", import.meta.url), "utf8")
  .split("\n")
  .filter((l) => l.trim())
  .map((l) => JSON.parse(l));

describe("UI rules against the recording", () => {
  const quests = new Map<string, Quest>();
  let live: Completion[] = [];
  let timezone = "Europe/Bucharest";

  lines.forEach((line, i) => {
    it(`line ${i + 1}`, () => {
      const now = new Date(line.x_now);
      const r = line.response;
      if (line.method === "POST" && line.path === "/quests" && line.status === 201) quests.set(r.id, r);
      if (line.method === "PUT" && line.status === 200) timezone = r.timezone;
      if (line.path.endsWith("/complete") && line.status === 201) {
        const q = quests.get(r.completion.quest_id)!;
        expect(r.completion.base_xp).toBe(baseXp(q.difficulty, q.due_date, r.completion.day));
        live.push(r.completion);
      }
      if (line.method === "DELETE" && line.status === 204) {
        live = live.filter((c) => c.id !== line.path.split("/").pop());
      }
      const today = todayIn(timezone, now);
      const me = line.path === "/me" && line.status === 200 ? r : r?.me;
      if (me) expect(computeMe(live, today, timezone)).toEqual(me);
      if (line.method === "GET" && line.path === "/quests") {
        for (const q of r) {
          const own = live.filter((c) => c.quest_id === q.id);
          expect(isQuestDone(q, own, today)).toBe(q.done);
        }
      }
    });
  });
});
