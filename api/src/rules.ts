// Pure game rules. Nothing here touches the database or the clock:
// callers pass in the completions, "today" and the time zone.
// XP, level and streak are never stored; they are recomputed from the
// live (not undone) completions on every request.

export type Difficulty = "easy" | "medium" | "hard";
export type Day = string; // calendar day, "yyyy-mm-dd"

export const BASE_XP: Record<Difficulty, number> = { easy: 10, medium: 25, hard: 50 };

export interface Me {
  timezone: string;
  xp: number;
  level: number;
  xp_into_level: number;
  xp_to_next_level: number;
  streak: number;
}

// The calendar day an instant falls on in a time zone (handles DST).
export function dayInZone(instant: Date, timeZone: string): Day {
  // en-CA formats dates as yyyy-mm-dd
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

export function addDays(day: Day, n: number): Day {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0, 10);
}

export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

// Late one-off quest (completed after its due date): half XP, rounded down.
// Completing on the due date itself is on time.
export function baseXp(difficulty: Difficulty, dueDate: Day | null, day: Day): number {
  const xp = BASE_XP[difficulty];
  return dueDate !== null && day > dueDate ? Math.floor(xp / 2) : xp;
}

// Bonus for a day with at least one completion: 2 x streak, capped at 14.
export function dailyBonus(streak: number): number {
  return Math.min(2 * streak, 14);
}

// Number of consecutive days with a completion, ending on `day`.
function streakEndingOn(days: Set<Day>, day: Day): number {
  let streak = 0;
  while (days.has(addDays(day, -streak))) streak++;
  return streak;
}

// Streak ending today, or ending yesterday if today has no completion yet.
export function currentStreak(days: Iterable<Day>, today: Day): number {
  const set = new Set(days);
  if (set.has(today)) return streakEndingOn(set, today);
  return streakEndingOn(set, addDays(today, -1));
}

export function totalXp(completions: { day: Day; base_xp: number }[]): number {
  const days = new Set(completions.map((c) => c.day));
  let xp = 0;
  for (const c of completions) xp += c.base_xp;
  for (const day of days) xp += dailyBonus(streakEndingOn(days, day));
  return xp;
}

// Leaving level n needs 100 x n XP, so level n starts at 100 x (1 + ... + (n-1)).
export function levelFor(xp: number): Pick<Me, "level" | "xp_into_level" | "xp_to_next_level"> {
  let level = 1;
  let levelStart = 0;
  while (xp >= levelStart + 100 * level) {
    levelStart += 100 * level;
    level++;
  }
  const xpIntoLevel = xp - levelStart;
  return { level, xp_into_level: xpIntoLevel, xp_to_next_level: 100 * level - xpIntoLevel };
}

export function computeMe(
  completions: { day: Day; base_xp: number }[],
  today: Day,
  timezone: string,
): Me {
  const xp = totalXp(completions);
  return {
    timezone,
    xp,
    ...levelFor(xp),
    streak: currentStreak(
      completions.map((c) => c.day),
      today,
    ),
  };
}

// One-off: done once it has a live completion. Daily: done if completed today.
export function isQuestDone(
  quest: { recurrence: "daily" | null },
  questCompletions: { day: Day }[],
  today: Day,
): boolean {
  if (quest.recurrence === "daily") return questCompletions.some((c) => c.day === today);
  return questCompletions.length > 0;
}
