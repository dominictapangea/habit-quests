# Plan

Tick each item when done; add new items as they come up.

## 0. Setup

- [x] Read `docs/brief_task_2.md`, `docs/reference_recording.jsonl` and `CLAUDE.md`
- [x] Install UI and helper skills
- [x] `PRODUCT.md` (product context for design work)
- [x] Decide UI copy language: English
- [x] `git init`, `.gitignore`, `.gitattributes` (LF endings for Docker), first commit
- [ ] Answer the open choices from `CLAUDE.md` (XP on a threshold, title trimming / limits,
      invalid or past `due_date`, unknown recurrence, malformed `X-Now`)

## 1. Rules (`api/src/rules.ts`) + unit tests

- [ ] Scaffold `api/` (TypeScript, test runner)
- [ ] Day of a timestamp in a time zone (incl. DST, lines 63-64)
- [ ] Base XP: difficulty values, late one-off = half rounded down (lines 15, 17, 25, 57)
- [ ] Daily bonus: 2 x streak capped at 14, once per day (lines 9, 14, 16, 23, 24, 31)
- [ ] Streak ending today or yesterday, else 0 (lines 13, 33, 34, 61)
- [ ] Level thresholds 100 x n, `xp_into_level`, `xp_to_next_level` (lines 1, 17, 31)
- [ ] `computeMe` from live completions; undo recomputes later bonuses (lines 45-46)
- [ ] `done` for one-off vs daily (lines 12, 41, 53, 68)
- [ ] Check every rule against the recording's numbers

## 2. API (Fastify + SQLite)

- [ ] SQLite schema: quests, completions (with undone flag), settings (time zone)
- [ ] `X-Now` handling
- [ ] `POST /quests` with validation and exact error messages (lines 6, 7, 8)
- [ ] `GET /quests` newest first with `done`
- [ ] `POST /quests/:id/complete` 201 new / 200 existing / 404 (lines 9-11, 52)
- [ ] `GET /completions` newest first; `DELETE /completions/:id` 204 / 404 (lines 37-39)
- [ ] `GET /me`, `PUT /me` with IANA validation (line 50)
- [ ] `POST /test/reset`
- [ ] `created_at` as UTC with `Z`, no milliseconds
- [ ] Data survives a restart
- [ ] Replay test: all 68 recorded requests, mapping ids, comparing status and body
- [ ] CORS for the UI

## 3. UI (Next.js, English copy)

- [ ] Design direction (impeccable new-work, ui-ux-pro-max)
- [ ] XP bar: level, progress, streak
- [ ] Level-up moment
- [ ] Create-quest form (title, difficulty, due date or daily)
- [ ] Quest list: Complete, done state, overdue flag
- [ ] Recent completions with Undo
- [ ] Optimistic updates that always reconcile with the server (errors, refresh)
- [ ] Responsive check (desktop first, phone works) and accessibility pass

## 4. Docker + README

- [ ] Dockerfiles + `docker-compose.yml` (API 3001, UI 3000, persistent SQLite volume)
- [ ] One non-Docker command to start both
- [ ] README: install/run, rules with line numbers, choices, weakest points, AI line,
      things noticed and not fixed, half-page summary

## 5. Clean-machine check

- [ ] Clone into a new folder and follow the README exactly (`docker compose up`)
- [ ] Same with the non-Docker command
