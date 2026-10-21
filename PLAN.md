# Plan

Tick each item when done; add new items as they come up.

## 0. Setup

- [x] Read `docs/brief_task_2.md`, `docs/reference_recording.jsonl` and `CLAUDE.md`
- [x] Install UI and helper skills
- [x] `PRODUCT.md` (product context for design work)
- [x] Decide UI copy language: English
- [x] `git init`, `.gitignore`, `.gitattributes` (LF endings for Docker), first commit
- [x] Answer the open choices from `CLAUDE.md` (see Decisions below; copy them into the README)

## Decisions (neither the spec nor the recording settles these)

- XP exactly on a threshold: the level is reached (100 XP = level 2, 0/200).
  `xp_to_next_level` is never 0, as in the recording.
- Daily quest not completed today: `done: false` (never shown in the recording).
- Title: missing or not a string -> 400 `invalid title`; whitespace-only -> 400; length
  1-100 counted on the title as sent; stored unchanged (no trimming).
- `due_date`: must be `yyyy-mm-dd` and a real calendar date, else 400 `invalid due_date`.
  A past date is allowed (the quest is simply late). `null` means none.
- `recurrence`: only `"daily"` or `null`, else 400 `invalid recurrence`.
- Malformed `X-Now` (unparseable or without an offset): 400 `invalid X-Now`.
- Ids are SQLite integers sent as strings (`"1"`, `"2"`); quests and completions have separate
  sequences. Ids that are not integers (e.g. `q99`) are simply not found (404).
- Empty body with `Content-Type: application/json` is accepted; malformed JSON -> 400
  `invalid JSON`; unknown route -> 404 `not found`; `PUT /me` without a string `timezone`
  -> 400 `invalid timezone`.
- `POST /test/reset` also resets the time zone to `Europe/Bucharest` and the id sequences.
- UI fonts are self-hosted (`@fontsource-variable/archivo`) so the Docker build needs no
  Google Fonts download.
- Node >= 22.18 is required without Docker (type stripping and `node:sqlite` unflagged).
- Storage: Node's built-in `node:sqlite` (no native build on a clean machine; needs Node
  >= 22.13). Node runs the TypeScript files directly (type stripping), no build step.

## 1. Rules (`api/src/rules.ts`) + unit tests

- [x] Scaffold `api/` (TypeScript, test runner)
- [x] Day of a timestamp in a time zone (incl. DST, lines 63-64)
- [x] Base XP: difficulty values, late one-off = half rounded down (lines 15, 17, 25, 57)
- [x] Daily bonus: 2 x streak capped at 14, once per day (lines 9, 14, 16, 23, 24, 31)
- [x] Streak ending today or yesterday, else 0 (lines 13, 33, 34, 61)
- [x] Level thresholds 100 x n, `xp_into_level`, `xp_to_next_level` (lines 1, 17, 31)
- [x] `computeMe` from live completions; undo recomputes later bonuses (lines 45-46)
- [x] `done` for one-off vs daily (lines 12, 41, 53, 68)
- [x] Check every rule against the recording's numbers (`test/rules-recording.test.ts`, 68 lines)
- [x] Mutation check: breaking the bonus cap makes 33 recording lines fail

## 2. API (Fastify + SQLite)

- [x] SQLite schema: quests, completions (with undone flag), settings (time zone)
- [x] `X-Now` handling (400 `invalid X-Now` when malformed)
- [x] Input validation module (title, difficulty, due_date, recurrence) + unit tests
- [x] `POST /quests` with validation and exact error messages (lines 6, 7, 8)
- [x] `GET /quests` newest first with `done`
- [x] `POST /quests/:id/complete` 201 new / 200 existing / 404 (lines 9-11, 52)
- [x] `GET /completions` newest first; `DELETE /completions/:id` 204 / 404 (lines 37-39)
- [x] `GET /me`, `PUT /me` with IANA validation (line 50)
- [x] `POST /test/reset`
- [x] `created_at` as UTC with `Z`, no milliseconds
- [x] Data survives a restart
- [x] Replay test: all 68 recorded requests, mapping ids, comparing status and body (`test/replay.test.ts`)
- [x] Smoke test of the real server: CORS preflight with `X-Now`, data kept after restart
- [x] CORS for the UI

## 3. UI (Next.js, English copy)

- [x] Design direction: Playfield Scoring (pinball score reels, bonus ladder 2-14) + month lamp
      calendar; contract in `.impeccable/surfaces/web-app-page-tsx.md`
- [x] Scaffold `web/` (Next.js 16, CSS modules, self-hosted Archivo via fontsource)
- [x] Score header: XP on rolling reels, level badge, XP bar, bonus ladder 2-14 (live `/me`)
- [x] Show the API error state properly (styled banner, dismissable failure notices)
- [x] Level-up moment (page-wide lamp band ~1.5 s, never blocking, announced to screen readers)
- [x] Month lamp calendar from `/completions` (lit days, today ringed, current chain, older lit days pale, month nav)
- [x] Create-quest form (title, difficulty, no date / due date / daily; client checks + server errors)
- [x] Quest list: Complete, done state (grayscale), overdue flag, XP if completed today (half when late)
- [x] "Today" computed only in the browser (no clock read during server render)
- [x] Recent completions with Undo (last 8; undo reloads everything, later-day bonuses included)
- [x] Optimistic updates: view = server snapshot + pending actions; full reload once idle;
      failure rolls back with a notice; reload on tab focus and when the day changes
- [x] UI copy of the rules (`web/lib/rules.ts`) replayed against the recording (`web/test`)
- [ ] Responsive check (desktop first, phone works) and accessibility pass
- [ ] Finish review (impeccable reviewer) and DESIGN.md

## 4. Docker + README

- [x] Dockerfiles + `docker-compose.yml` (API 3001, UI 3000, persistent SQLite volume) - written
- [ ] Run `docker compose up` for real (Docker Desktop being installed)
- [x] One non-Docker command to start both: `npm start` in the root (installs if needed,
      builds the UI, runs both); tested in a clean copy with no node_modules
- [ ] README: install/run, rules with line numbers, choices, weakest points, AI line,
      things noticed and not fixed, half-page summary

## 5. Clean-machine check

- [ ] Clone into a new folder and follow the README exactly (`docker compose up`)
- [ ] Same with the non-Docker command
