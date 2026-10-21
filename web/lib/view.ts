// What the page shows = the last server snapshot + the actions still in flight.
// The snapshot is always the truth; pending actions are only a prediction
// laid on top of it, and they disappear when the server answers.
import type { Completion, Me, Quest } from "./api";
import { baseXp, computeMe, isQuestDone } from "./rules";

export interface Snapshot {
  me: Me;
  quests: Quest[];
  completions: Completion[]; // live ones, newest first
}

export type Pending =
  | { kind: "complete"; opId: string; completion: Completion } // completion has a temporary id
  | { kind: "undo"; opId: string; completionId: string };

export interface View extends Snapshot {
  predicted: boolean; // true while the numbers are a prediction, not the server's
}

const byNewest = (a: Completion, b: Completion) => b.created_at.localeCompare(a.created_at);

// A temporary completion for an optimistic Complete.
export function predictCompletion(quest: Quest, today: string, now: Date, opId: string): Completion {
  return {
    id: `pending-${opId}`,
    quest_id: quest.id,
    day: today,
    base_xp: baseXp(quest.difficulty, quest.due_date, today),
    created_at: now.toISOString().replace(/\.\d{3}Z$/, "Z"),
  };
}

export function deriveView(snapshot: Snapshot, pending: Pending[], synced: boolean, today: string): View {
  const undone = new Set(pending.flatMap((p) => (p.kind === "undo" ? [p.completionId] : [])));
  const added = pending.flatMap((p) => (p.kind === "complete" ? [p.completion] : []));
  const completions = [...added, ...snapshot.completions.filter((c) => !undone.has(c.id))].sort(byNewest);

  const quests = snapshot.quests.map((q) => ({
    ...q,
    done: isQuestDone(
      q,
      completions.filter((c) => c.quest_id === q.id),
      today,
    ),
  }));

  // In sync: show the server's own numbers. Otherwise predict them with the
  // same rules from the completions the user is looking at.
  const predicted = !synced || pending.length > 0;
  const me = predicted ? computeMe(completions, today, snapshot.me.timezone) : snapshot.me;
  return { me, quests, completions, predicted };
}

// Fold a successful Complete answer into the snapshot until the next reload.
export function applyCompleted(snapshot: Snapshot, completion: Completion, me: Me): Snapshot {
  const known = snapshot.completions.some((c) => c.id === completion.id);
  return {
    ...snapshot,
    me,
    completions: known ? snapshot.completions : [completion, ...snapshot.completions].sort(byNewest),
  };
}

export function applyUndone(snapshot: Snapshot, completionId: string): Snapshot {
  return { ...snapshot, completions: snapshot.completions.filter((c) => c.id !== completionId) };
}
