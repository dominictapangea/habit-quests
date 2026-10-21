import { describe, expect, it } from "vitest";
import { isValidDay, parseNow, toCreatedAt, validateNewQuest } from "../src/validation.ts";

const error = (body: unknown) => {
  const r = validateNewQuest(body);
  return r.ok ? null : r.error;
};

describe("validateNewQuest", () => {
  it("accepts the recorded quests (lines 2-5)", () => {
    expect(validateNewQuest({ title: "Drink 2 litres of water", difficulty: "easy", recurrence: "daily" })).toEqual({
      ok: true,
      value: { title: "Drink 2 litres of water", difficulty: "easy", due_date: null, recurrence: "daily" },
    });
    expect(error({ title: "Pay the electricity bill", difficulty: "medium", due_date: "2026-10-07" })).toBeNull();
    expect(error({ title: "Call grandma", difficulty: "easy" })).toBeNull();
  });

  it("gives the recorded error messages (lines 6, 7, 8)", () => {
    expect(error({ title: "Book dentist", difficulty: "extreme" })).toBe("invalid difficulty");
    expect(error({ title: "Stretch", difficulty: "easy", due_date: "2026-10-09", recurrence: "daily" })).toBe(
      "a quest cannot have both due_date and recurrence",
    );
    expect(error({ title: "", difficulty: "easy" })).toBe("invalid title");
  });

  it("title: missing, not a string, whitespace-only or over 100 chars is invalid", () => {
    expect(error({ difficulty: "easy" })).toBe("invalid title");
    expect(error({ title: 42, difficulty: "easy" })).toBe("invalid title");
    expect(error({ title: "   ", difficulty: "easy" })).toBe("invalid title");
    expect(error({ title: "a".repeat(101), difficulty: "easy" })).toBe("invalid title");
    expect(error({ title: "a".repeat(100), difficulty: "easy" })).toBeNull();
    expect(error({ title: "🔥".repeat(100), difficulty: "easy" })).toBeNull();
    expect(error(undefined)).toBe("invalid title");
  });

  it("keeps the title as sent (no trimming)", () => {
    const r = validateNewQuest({ title: "  Run  ", difficulty: "easy" });
    expect(r.ok && r.value.title).toBe("  Run  ");
  });

  it("due_date must be a real yyyy-mm-dd day; past dates are allowed", () => {
    expect(error({ title: "x", difficulty: "easy", due_date: "2026-02-30" })).toBe("invalid due_date");
    expect(error({ title: "x", difficulty: "easy", due_date: "07/10/2026" })).toBe("invalid due_date");
    expect(error({ title: "x", difficulty: "easy", due_date: 20261007 })).toBe("invalid due_date");
    expect(error({ title: "x", difficulty: "easy", due_date: "2001-01-01" })).toBeNull();
    expect(error({ title: "x", difficulty: "easy", due_date: null })).toBeNull();
  });

  it("recurrence must be daily or null", () => {
    expect(error({ title: "x", difficulty: "easy", recurrence: "weekly" })).toBe("invalid recurrence");
    expect(error({ title: "x", difficulty: "easy", recurrence: null })).toBeNull();
  });
});

describe("isValidDay", () => {
  it("checks the calendar", () => {
    expect(isValidDay("2028-02-29")).toBe(true);
    expect(isValidDay("2026-02-29")).toBe(false);
    expect(isValidDay("2026-13-01")).toBe(false);
  });
});

describe("parseNow", () => {
  const real = new Date("2030-01-01T00:00:00Z");

  it("uses the real clock without X-Now", () => {
    expect(parseNow(undefined, real)).toBe(real);
  });

  it("parses ISO 8601 with an offset", () => {
    expect(parseNow("2026-10-05T09:15:00+03:00", real)?.toISOString()).toBe("2026-10-05T06:15:00.000Z");
    expect(parseNow("2026-10-19T20:30:00-04:00", real)?.toISOString()).toBe("2026-10-20T00:30:00.000Z");
    expect(parseNow("2026-10-05T06:15:00Z", real)?.toISOString()).toBe("2026-10-05T06:15:00.000Z");
  });

  it("rejects malformed values (our choice: 400)", () => {
    expect(parseNow("yesterday", real)).toBeNull();
    expect(parseNow("2026-10-05T09:15:00", real)).toBeNull(); // no offset
    expect(parseNow("2026-02-30T09:15:00+03:00", real)).toBeNull();
    expect(parseNow("", real)).toBeNull();
  });
});

describe("toCreatedAt", () => {
  it("is UTC with Z and no milliseconds", () => {
    expect(toCreatedAt(new Date("2026-10-05T09:15:00.123+03:00"))).toBe("2026-10-05T06:15:00Z");
  });
});
