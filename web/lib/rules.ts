// The game rules, ported from api/src/rules.ts so the UI can predict the
// result of an action before the server answers. The server stays the source
// of truth: every prediction is replaced by its answer. test/rules.test.ts
// replays the recording against this copy to keep the two in step.
import type { Completion, Difficulty, Me, Quest } from "./api";
import { addDays } from "./dates";

const BASE_XP: Record<Difficulty, number> = { easy: 10, medium: 25, hard: 50 };

// Late one-off (completed after its due date): half XP, rounded down.
export function baseXp(difficulty: Difficulty, dueDate: string | null, day: string): number {
  const xp = BASE_XP[difficulty];
  return dueDate !== null && day > dueDate ? Math.floor(xp / 2) : xp;
}

export const dailyBonus = (streak: number) => Math.min(2 * streak, 14);

function streakEndingOn(days: Set<string>, day: string): number {
  let streak = 0;
  while (days.has(addDays(day, -streak))) streak++;
  return streak;
}

export function currentStreak(days: Set<string>, today: string): number {
  return days.has(today) ? streakEndingOn(days, today) : streakEndingOn(days, addDays(today, -1));
}

export function levelFor(xp: number): Pick<Me, "level" | "xp_into_level" | "xp_to_next_level"> {
  let level = 1;
  let levelStart = 0;
  while (xp >= levelStart + 100 * level) {
    levelStart += 100 * level;
    level++;
  }
  const into = xp - levelStart;
  return { level, xp_into_level: into, xp_to_next_level: 100 * level - into };
}

export function computeMe(completions: Pick<Completion, "day" | "base_xp">[], today: string, timezone: string): Me {
  const days = new Set(completions.map((c) => c.day));
  let xp = 0;
  for (const c of completions) xp += c.base_xp;
  for (const day of days) xp += dailyBonus(streakEndingOn(days, day));
  return { timezone, xp, ...levelFor(xp), streak: currentStreak(days, today) };
}

// One-off: done once it has a live completion. Daily: done if completed today.
export function isQuestDone(quest: Pick<Quest, "recurrence">, own: Pick<Completion, "day">[], today: string): boolean {
  return quest.recurrence === "daily" ? own.some((c) => c.day === today) : own.length > 0;
}
