import { describe, expect, it } from "vitest";
import {
  addDays,
  baseXp,
  computeMe,
  currentStreak,
  dailyBonus,
  dayInZone,
  isQuestDone,
  isValidTimeZone,
  levelFor,
  totalXp,
} from "../src/rules.js";

describe("dayInZone", () => {
  it("uses the calendar day of the given time zone", () => {
    // 23:40 in Bucharest is still the same day (line 15)
    expect(dayInZone(new Date("2026-10-06T23:40:00+03:00"), "Europe/Bucharest")).toBe("2026-10-06");
    // 02:30 UTC on the 22nd is the 21st in New York (line 57)
    expect(dayInZone(new Date("2026-10-22T02:30:00Z"), "America/New_York")).toBe("2026-10-21");
    expect(dayInZone(new Date("2026-10-22T02:30:00Z"), "Europe/Bucharest")).toBe("2026-10-22");
  });

  it("handles the DST change in Bucharest (lines 63-64)", () => {
    expect(dayInZone(new Date("2026-10-25T08:00:00+02:00"), "Europe/Bucharest")).toBe("2026-10-25");
    expect(dayInZone(new Date("2026-10-25T00:30:00+03:00"), "Europe/Bucharest")).toBe("2026-10-25");
  });
});

describe("addDays", () => {
  it("moves across months and back", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("isValidTimeZone", () => {
  it("accepts IANA names and rejects others (line 50)", () => {
    expect(isValidTimeZone("America/New_York")).toBe(true);
    expect(isValidTimeZone("Europe/Bucharest")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus_Mons")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
  });
});

describe("baseXp", () => {
  it("is 10/25/50 by difficulty", () => {
    expect(baseXp("easy", null, "2026-10-05")).toBe(10);
    expect(baseXp("medium", null, "2026-10-05")).toBe(25);
    expect(baseXp("hard", null, "2026-10-05")).toBe(50);
  });

  it("is full on or before the due date (lines 15, 57)", () => {
    expect(baseXp("hard", "2026-10-06", "2026-10-06")).toBe(50);
    expect(baseXp("hard", "2026-10-21", "2026-10-20")).toBe(50);
  });

  it("is half, rounded down, when late, however late (lines 17, 25)", () => {
    expect(baseXp("medium", "2026-10-07", "2026-10-08")).toBe(12);
    expect(baseXp("easy", "2026-10-10", "2026-10-12")).toBe(5);
    expect(baseXp("hard", "2026-10-10", "2027-05-01")).toBe(25);
  });
});

describe("dailyBonus", () => {
  it("is 2 x streak, capped at 14", () => {
    expect(dailyBonus(1)).toBe(2);
    expect(dailyBonus(4)).toBe(8);
    expect(dailyBonus(7)).toBe(14);
    expect(dailyBonus(10)).toBe(14);
  });
});

describe("currentStreak", () => {
  const days = ["2026-10-12", "2026-10-13", "2026-10-14"];

  it("counts consecutive days ending today", () => {
    expect(currentStreak(days, "2026-10-14")).toBe(3);
  });

  it("still counts when today has no completion yet (line 33)", () => {
    expect(currentStreak(days, "2026-10-15")).toBe(3);
  });

  it("is 0 when the last completion is older than yesterday (line 34)", () => {
    expect(currentStreak(days, "2026-10-16")).toBe(0);
  });

  it("is 0 with no completions (line 1)", () => {
    expect(currentStreak([], "2026-10-05")).toBe(0);
  });
});

describe("totalXp", () => {
  it("adds one bonus per day, with the streak as of that day (lines 9, 14, 15)", () => {
    expect(
      totalXp([
        { day: "2026-10-05", base_xp: 10 },
        { day: "2026-10-06", base_xp: 10 },
        { day: "2026-10-06", base_xp: 50 },
      ]),
    ).toBe(10 + 2 + 10 + 4 + 50);
  });

  it("recomputes later bonuses when a day disappears (lines 45-46)", () => {
    const before = [
      { day: "2026-10-16", base_xp: 10 },
      { day: "2026-10-17", base_xp: 10 },
      { day: "2026-10-18", base_xp: 10 },
    ];
    expect(totalXp(before)).toBe(12 + 14 + 16);
    const after = before.filter((c) => c.day !== "2026-10-17");
    expect(totalXp(after)).toBe(12 + 12);
  });
});

describe("levelFor", () => {
  it("starts at level 1 (line 1)", () => {
    expect(levelFor(0)).toEqual({ level: 1, xp_into_level: 0, xp_to_next_level: 100 });
  });

  it("needs 100 x n XP to leave level n (lines 17, 31)", () => {
    expect(levelFor(112)).toEqual({ level: 2, xp_into_level: 12, xp_to_next_level: 188 });
    expect(levelFor(315)).toEqual({ level: 3, xp_into_level: 15, xp_to_next_level: 285 });
    expect(levelFor(599)).toEqual({ level: 3, xp_into_level: 299, xp_to_next_level: 1 });
  });

  it("reaches the level exactly on the threshold (our choice)", () => {
    expect(levelFor(100)).toEqual({ level: 2, xp_into_level: 0, xp_to_next_level: 200 });
    expect(levelFor(600)).toEqual({ level: 4, xp_into_level: 0, xp_to_next_level: 400 });
  });
});

describe("computeMe", () => {
  it("combines xp, level and streak", () => {
    expect(computeMe([{ day: "2026-10-05", base_xp: 10 }], "2026-10-05", "Europe/Bucharest")).toEqual({
      timezone: "Europe/Bucharest",
      xp: 12,
      level: 1,
      xp_into_level: 12,
      xp_to_next_level: 88,
      streak: 1,
    });
  });
});

describe("isQuestDone", () => {
  it("one-off: done once it has any live completion", () => {
    expect(isQuestDone({ recurrence: null }, [], "2026-10-05")).toBe(false);
    expect(isQuestDone({ recurrence: null }, [{ day: "2026-10-01" }], "2026-10-05")).toBe(true);
  });

  it("daily: done only if completed today (lines 12, 53; false is our choice)", () => {
    expect(isQuestDone({ recurrence: "daily" }, [{ day: "2026-10-05" }], "2026-10-05")).toBe(true);
    expect(isQuestDone({ recurrence: "daily" }, [{ day: "2026-10-04" }], "2026-10-05")).toBe(false);
  });
});
