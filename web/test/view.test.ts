import { describe, expect, it } from "vitest";
import type { Quest } from "../lib/api";
import { applyCompleted, applyUndone, deriveView, predictCompletion, type Snapshot } from "../lib/view";

const water: Quest = { id: "1", title: "Water", difficulty: "easy", due_date: null, recurrence: "daily", done: false };
const fridge: Quest = { id: "2", title: "Fridge", difficulty: "easy", due_date: "2026-10-10", recurrence: null, done: false };

const snapshot: Snapshot = {
  me: { timezone: "Europe/Bucharest", xp: 92, level: 1, xp_into_level: 92, xp_to_next_level: 8, streak: 1 },
  quests: [fridge, water],
  completions: [{ id: "c1", quest_id: "1", day: "2026-10-20", base_xp: 10, created_at: "2026-10-20T06:00:00Z" }],
};

describe("deriveView", () => {
  it("shows the server's numbers when in sync with nothing pending", () => {
    const view = deriveView(snapshot, [], true, "2026-10-21");
    expect(view.me).toBe(snapshot.me);
    expect(view.predicted).toBe(false);
  });

  it("predicts a Complete immediately: XP, streak, done", () => {
    const completion = predictCompletion(water, "2026-10-21", new Date("2026-10-21T09:00:00Z"), "a");
    const view = deriveView(snapshot, [{ kind: "complete", opId: "a", completion }], true, "2026-10-21");
    expect(view.predicted).toBe(true);
    expect(view.me).toMatchObject({ xp: 12 + 14, streak: 2 });
    expect(view.quests.find((q) => q.id === "1")!.done).toBe(true);
    expect(view.completions[0].id).toBe("pending-a");
  });

  it("predicts the late penalty", () => {
    const completion = predictCompletion(fridge, "2026-10-21", new Date(), "b");
    expect(completion.base_xp).toBe(5);
  });

  it("predicts an Undo, later bonuses included", () => {
    const view = deriveView(snapshot, [{ kind: "undo", opId: "u", completionId: "c1" }], true, "2026-10-21");
    expect(view.me).toMatchObject({ xp: 0, streak: 0, level: 1 });
    expect(view.completions).toEqual([]);
  });

  it("a failed action just disappears: the view falls back to the snapshot", () => {
    expect(deriveView(snapshot, [], true, "2026-10-21").me.xp).toBe(92);
  });
});

describe("applying server answers", () => {
  it("adds a confirmed completion once and takes the server's me", () => {
    const c = { id: "c2", quest_id: "1", day: "2026-10-21", base_xp: 10, created_at: "2026-10-21T06:00:00Z" };
    const me = { ...snapshot.me, xp: 116 };
    const once = applyCompleted(snapshot, c, me);
    const twice = applyCompleted(once, c, me);
    expect(twice.completions.map((x) => x.id)).toEqual(["c2", "c1"]);
    expect(twice.me.xp).toBe(116);
  });

  it("removes an undone completion", () => {
    expect(applyUndone(snapshot, "c1").completions).toEqual([]);
  });
});
