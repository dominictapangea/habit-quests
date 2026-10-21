// API behaviour the recording does not cover: restart, our choices, edge cases.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.ts";

const freshDbPath = () => join(mkdtempSync(join(tmpdir(), "habit-quests-")), "test.db");
const NOW = { "x-now": "2026-10-05T09:15:00+03:00" };

describe("persistence", () => {
  it("keeps quests, completions and the time zone across a restart", async () => {
    const dbPath = freshDbPath();
    const first = buildApp({ dbPath });
    const quest = (
      await first.inject({ method: "POST", url: "/quests", headers: NOW, payload: { title: "Run", difficulty: "hard" } })
    ).json();
    await first.inject({ method: "POST", url: `/quests/${quest.id}/complete`, headers: NOW });
    await first.inject({ method: "PUT", url: "/me", headers: NOW, payload: { timezone: "America/New_York" } });
    await first.close();

    const second = buildApp({ dbPath });
    const quests = (await second.inject({ method: "GET", url: "/quests", headers: NOW })).json();
    const me = (await second.inject({ method: "GET", url: "/me", headers: NOW })).json();
    expect(quests).toEqual([{ ...quest, done: true }]);
    expect(me).toMatchObject({ timezone: "America/New_York", xp: 52, streak: 1 });
    await second.close();
  });
});

describe("X-Now", () => {
  it("rejects a malformed header with 400 (our choice)", async () => {
    const app = buildApp({ dbPath: freshDbPath() });
    for (const value of ["yesterday", "2026-10-05T09:15:00", "2026-02-30T09:15:00+03:00"]) {
      const res = await app.inject({ method: "GET", url: "/me", headers: { "x-now": value } });
      expect(res.statusCode).toBe(400);
      expect(res.json()).toEqual({ error: "invalid X-Now" });
    }
    await app.close();
  });

  it("uses the real clock without the header", async () => {
    const app = buildApp({ dbPath: freshDbPath(), clock: () => new Date("2026-10-05T23:30:00Z") });
    const quest = (await app.inject({ method: "POST", url: "/quests", payload: { title: "x", difficulty: "easy" } })).json();
    const res = (await app.inject({ method: "POST", url: `/quests/${quest.id}/complete` })).json();
    // 23:30 UTC is already the 6th in Bucharest
    expect(res.completion).toMatchObject({ day: "2026-10-06", created_at: "2026-10-05T23:30:00Z" });
    await app.close();
  });
});

describe("request edge cases", () => {
  it("accepts an empty body sent with a JSON content type", async () => {
    const app = buildApp({ dbPath: freshDbPath() });
    const quest = (
      await app.inject({ method: "POST", url: "/quests", headers: NOW, payload: { title: "x", difficulty: "easy" } })
    ).json();
    const res = await app.inject({
      method: "POST",
      url: `/quests/${quest.id}/complete`,
      headers: { ...NOW, "content-type": "application/json" },
      payload: "",
    });
    expect(res.statusCode).toBe(201);
    await app.close();
  });

  it("answers bad JSON and unknown routes with an error body", async () => {
    const app = buildApp({ dbPath: freshDbPath() });
    const bad = await app.inject({
      method: "POST",
      url: "/quests",
      headers: { ...NOW, "content-type": "application/json" },
      payload: "{not json",
    });
    expect(bad.statusCode).toBe(400);
    expect(bad.json()).toEqual({ error: "invalid JSON" });
    const missing = await app.inject({ method: "GET", url: "/nope", headers: NOW });
    expect(missing.statusCode).toBe(404);
    expect(missing.json()).toEqual({ error: "not found" });
    await app.close();
  });

  it("PUT /me without a timezone is 400", async () => {
    const app = buildApp({ dbPath: freshDbPath() });
    const res = await app.inject({ method: "PUT", url: "/me", headers: NOW, payload: {} });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: "invalid timezone" });
    await app.close();
  });

  it("reset deletes everything and restores the default time zone", async () => {
    const app = buildApp({ dbPath: freshDbPath() });
    await app.inject({ method: "POST", url: "/quests", headers: NOW, payload: { title: "x", difficulty: "easy" } });
    await app.inject({ method: "PUT", url: "/me", headers: NOW, payload: { timezone: "Asia/Tokyo" } });
    expect((await app.inject({ method: "POST", url: "/test/reset", headers: NOW })).statusCode).toBe(204);
    expect((await app.inject({ method: "GET", url: "/quests", headers: NOW })).json()).toEqual([]);
    expect((await app.inject({ method: "GET", url: "/me", headers: NOW })).json()).toMatchObject({
      timezone: "Europe/Bucharest",
      xp: 0,
    });
    await app.close();
  });
});
