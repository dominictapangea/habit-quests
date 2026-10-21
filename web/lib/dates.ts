// Calendar days ("yyyy-mm-dd") in the user's time zone, like the API does.

export function todayIn(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function addDays(day: string, n: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0, 10);
}

// Days of the current streak: consecutive days with a completion ending
// today, or ending yesterday if today has none yet (same rule as the API).
export function streakDays(days: Set<string>, today: string): Set<string> {
  const chain = new Set<string>();
  let day = days.has(today) ? today : addDays(today, -1);
  while (days.has(day)) {
    chain.add(day);
    day = addDays(day, -1);
  }
  return chain;
}

// "2026-10-05T06:15:00Z" -> "09:15" in the user's time zone.
export function formatTime(instant: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit" }).format(new Date(instant));
}

// "2026-10-21" -> "Wed, Oct 21"
export function formatDay(day: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" }).format(
    new Date(`${day}T00:00:00Z`),
  );
}
