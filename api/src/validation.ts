// Input checks for request bodies and the X-Now header. Pure, like rules.ts.
import type { Day, Difficulty } from "./rules.ts";

export interface NewQuest {
  title: string;
  difficulty: Difficulty;
  due_date: Day | null;
  recurrence: "daily" | null;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const DIFFICULTIES = ["easy", "medium", "hard"];

// "yyyy-mm-dd" that is a real calendar day (rejects 2026-02-30).
export function isValidDay(value: unknown): value is Day {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// Checks are in this order so the recorded cases get the recorded message
// (lines 6, 7, 8).
export function validateNewQuest(body: unknown): Result<NewQuest> {
  const b = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const dueDate = b.due_date ?? null;
  const recurrence = b.recurrence ?? null;

  // Length counts characters (code points), so an emoji is 1, not 2.
  if (typeof b.title !== "string" || b.title.trim() === "" || [...b.title].length > 100) {
    return { ok: false, error: "invalid title" };
  }
  if (typeof b.difficulty !== "string" || !DIFFICULTIES.includes(b.difficulty)) {
    return { ok: false, error: "invalid difficulty" };
  }
  if (dueDate !== null && recurrence !== null) {
    return { ok: false, error: "a quest cannot have both due_date and recurrence" };
  }
  if (dueDate !== null && !isValidDay(dueDate)) {
    return { ok: false, error: "invalid due_date" };
  }
  if (recurrence !== null && recurrence !== "daily") {
    return { ok: false, error: "invalid recurrence" };
  }
  return {
    ok: true,
    value: {
      title: b.title,
      difficulty: b.difficulty as Difficulty,
      due_date: dueDate as Day | null,
      recurrence: recurrence as "daily" | null,
    },
  };
}

const ISO_WITH_OFFSET =
  /^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d(\.\d+)?)?(Z|[+-]([01]\d|2[0-3]):[0-5]\d)$/;

// The current time for a request: X-Now when present, else the real clock.
// Returns null when X-Now is present but not ISO 8601 with an offset.
export function parseNow(header: string | string[] | undefined, realNow: Date): Date | null {
  if (header === undefined) return realNow;
  if (typeof header !== "string") return null;
  const match = ISO_WITH_OFFSET.exec(header.trim());
  if (!match || !isValidDay(match[1])) return null;
  const date = new Date(header.trim());
  return Number.isNaN(date.getTime()) ? null : date;
}

// UTC with "Z" and no milliseconds, e.g. "2026-10-05T06:15:00Z".
export function toCreatedAt(instant: Date): string {
  return instant.toISOString().replace(/\.\d{3}Z$/, "Z");
}
