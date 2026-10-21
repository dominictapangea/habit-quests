# Habit Quests

A rebuild of a retired habit tracker: everyday tasks become quests, finishing one earns XP, XP
fills levels, and completing something every day builds a streak with a daily bonus.

- **`api/`**: Fastify + TypeScript, SQLite storage, port **3001**. Matches the old app on all
  68 recorded requests.
- **`web/`**: Next.js, one page, port **3000**. Shows the score as rolling pinball reels, a bonus
  ladder, a month calendar of lit days, the quest list and recent completions with Undo.

## Run it

### With Docker (recommended)

Needs Docker with Compose (Docker Desktop on Windows/macOS).

```bash
git clone <this repository> habit-quests
cd habit-quests
docker compose up
```

The first run builds both images (a few minutes). Then open **http://localhost:3000**; the API is
on **http://localhost:3001**. Data lives in the Docker volume `habit-data`, so it survives
`docker compose down` / `up` and rebuilds. `Ctrl+C` stops both.

### Without Docker (one command)

Needs **Node.js 22.18 or newer** (24 LTS recommended) and npm. Nothing else: SQLite is built into
Node.

```bash
npm start
```

Run it in the repository root. It installs dependencies when they are missing, builds the UI,
then starts the API (3001) and the UI (3000). `Ctrl+C` stops both. The database file is
`api/data/habit-quests.db`.

### Tests

```bash
npm test
```

Runs, in the root:

- **API (174 tests):**
  - `api/test/replay.test.ts` replays all 68 recorded requests in order, with their `X-Now`
    header, against the real Fastify app on a fresh database. It maps the recording's ids
    (`q1`, `c1`) to ours as they appear, and compares every status and every body exactly.
  - `api/test/rules-recording.test.ts` checks the pure rules alone against every number in
    the recording.
  - The rest are unit tests for rules and validation, plus API tests for restarts, our own
    choices and edge cases.
- **UI (75 tests):** the UI's copy of the rules is replayed against the recording too, plus
  tests for the optimistic-update logic.

## How it works

The API stores only facts: quests, completions (with an `undone` flag) and the time zone. XP,
level and streak are **never stored**. Every request recomputes them from the live completions
with the pure functions in [`api/src/rules.ts`](api/src/rules.ts). That makes undo exact: undoing
a completion recomputes the bonuses of every later day too (rule 5).

The UI is optimistic but truthful:

- **What it shows:** the last server snapshot plus the actions still in flight
  ([`web/lib/view.ts`](web/lib/view.ts)).
- **Complete / Undo:** the click moves the reels, the bar, the bonus ladder and the calendar
  immediately, predicted with the same rules
  ([`web/lib/rules.ts`](web/lib/rules.ts), replayed against the recording in `web/test`).
- **When the server answers:** the prediction is replaced. Once nothing is in flight, the page
  reloads everything and shows the server's own numbers.
- **On failure:** the prediction disappears, the page falls back to the server's state and
  shows a notice.
- **New day:** the page also reloads when the tab becomes visible again and when the day
  changes.

## Rules found in the recording

Line numbers refer to `docs/reference_recording.jsonl`.

| # | Rule (not stated, or not fully stated, in the spec) | Lines |
| --- | --- | --- |
| 1 | Completing a one-off quest **after** its due date earns **half the base XP, rounded down**, however late (25 → 12, 10 → 5). Completing **on** the due date is on time. | 17, 25 (late); 15, 57 (on the due date) |
| 2 | **Daily bonus = 2 × streak, capped at 14** (from a 7-day streak on). It is earned once per day that has at least one completion; later completions that day get no bonus. | 9, 14, 16, 17, 23, 24, 31; no second bonus: 15, 18, 25, 29, 36, 66 |
| 3 | Leaving **level n needs 100 × n XP**, so levels start at 0, 100, 300, 600, … XP. `xp_into_level` and `xp_to_next_level` are measured inside the current level. | 1, 17, 31 |
| 4 | **Streak** = consecutive days with a completion ending today, or ending yesterday if today has none yet; otherwise 0. | 13, 33 (yesterday still counts), 34 (broken: 0), 35, 61 (restarts at 1) |
| 5 | **Undo recomputes everything**, including the bonuses of later days: undoing day 17 breaks the chain, so day 18's bonus drops from 6 to 2 (357 → 339). | 45, 46 (also 38–40) |
| 6 | "Once per day" for a daily quest uses the calendar day in the **current** time zone: after switching to New York, 20:30 on Oct 19 in New York (already Oct 20 in Bucharest) still returns the Oct 19 completion. | 51, 52, 53 |
| 7 | A completion's **day is fixed when it is made**: changing the time zone later does not move it (`c22` stays on Oct 21). | 57, 59, 60 |
| 8 | `done`: a one-off quest is done once it has a live completion (late or not); a daily quest is done only if completed today. | 12, 41, 53, 68 |
| 9 | Completing again returns the existing completion with **200** and the current `me`, awarding nothing. After an undo, completing again creates a **new** completion (201). | 10, 48, 52; 38 then 47 |
| 10 | Quests are listed **newest first**; completions **newest first by `created_at`**. | 12, 41; 37, 60 |
| 11 | Exact error messages: `invalid difficulty`, `a quest cannot have both due_date and recurrence`, `invalid title`, `quest not found`, `completion not found` (also for an already undone one), `invalid timezone`. | 6, 7, 8, 11, 39, 50 |
| 12 | `created_at` is UTC with a `Z` and no milliseconds; `day` is `yyyy-mm-dd`. | 9 and every completion |
| 13 | Days follow the zone's real calendar across the DST change (offset +03:00 → +02:00 on Oct 25). | 62, 63, 64 |
| 14 | `PUT /me` answers with the full `me`; changing the time zone does not change XP. | 51, 59 |

## Choices where neither the spec nor the recording decides

- **XP exactly on a threshold:** the level is reached (100 XP = level 2 with 0 / 200). With this,
  `xp_to_next_level` is never 0, as in the recording.
- **Daily quest not completed today:** `done: false`.
- **Title:** missing, not a string, or only whitespace → 400 `invalid title`. Length 1–100 is
  counted in characters (code points) on the title as sent. The title is stored unchanged (no
  trimming).
- **`due_date`:** must be `yyyy-mm-dd` and a real calendar date, else 400 `invalid due_date`. A
  date in the past is allowed (the quest is simply late). `null` means no due date.
- **`recurrence`:** only `"daily"` or `null`, else 400 `invalid recurrence`.
- **Malformed `X-Now`** (unparseable, or without an offset): 400 `invalid X-Now` instead of
  silently using the real clock.
- **Ids** are SQLite integers sent as strings (`"1"`). Quests and completions have separate
  sequences. A non-integer id such as `q99` is simply not found (404).
- **Other requests:**
  - an empty body sent with `Content-Type: application/json` is accepted;
  - malformed JSON → 400 `invalid JSON`;
  - unknown route → 404 `not found`;
  - `PUT /me` without a string `timezone` → 400 `invalid timezone`.
- **`POST /test/reset`** also resets the time zone to `Europe/Bucharest` and restarts the id
  sequences.
- **Storage:** Node's built-in `node:sqlite`, so there is no native module to compile on a clean
  machine. Node runs the API's TypeScript directly (type stripping), so the API has no build step.
- **UI:**
  - The copy is in English.
  - XP shown on a quest is what it would earn if completed today, so overdue quests show half.
  - "Today" is computed in the browser with the user's time zone; the UI does not send `X-Now`.
  - The page lists open quests first, then done ones, keeping the API's newest-first order inside
    each group, so a Complete button is always near the top. The API order itself is unchanged.
  - On a phone the create form folds behind a "New quest" button, so the list comes first.

## Summary: what I did, how I verified it, what I left out

I first worked the rules out of the recording and wrote them as pure functions with unit tests.
A test walks all 68 lines and recomputes every `day`, `base_xp`, `me` and `done` from the
completions alone. Then I built the Fastify API on SQLite with an end-to-end replay of the
whole recording, which matches every status and body. The UI is one Next.js page in a
"pinball scoring" look: XP on rolling reels, a 2-4-…-14 bonus ladder that is literally the
daily-bonus rule, a calendar of lit days that shows the current streak as a chain, and a short
page-wide level-up band. Complete and Undo are optimistic and always end on the server's numbers.

How I verified it:

- **Automated tests:** `npm test`, all green.
- **Failure cases in a real browser:**
  - a slow API (the XP moved within 150 ms, then the server confirmed the same value);
  - a failing API (the prediction rolled back with a notice);
  - an undo in the middle of a streak (the UI and the API both went 233 → 165);
  - a level-up.
- **Clean-machine runs:** a fresh `git clone` run with both `docker compose up` and `npm start`,
  including a restart to check that data persists.

**Deliberately not done:** auth, multiple users, deployment, and a design system, as the brief
asks. Editing or deleting quests is not in the API contract. There is no time-zone picker in the
UI (the API supports `PUT /me`, but the brief does not ask the page for it). There is no
pagination; the page shows the last 8 completions.

## Where the solution is weakest

- **The rules exist twice.** They live in `api/src/rules.ts` and are copied in
  `web/lib/rules.ts` for the optimistic prediction. Both copies are tested against the
  recording, but a future rule change must be made in both places.
- **Unseen recordings may disagree with my choices.** EndSpec will also replay recordings I have
  not seen. Any case they cover that is listed under "Choices" above could differ, most likely:
  - malformed `X-Now`;
  - title length with emoji (code points versus UTF-16);
  - validation order when several fields are invalid at once.
- **`node:sqlite` is still marked experimental by Node.** The warning is silenced in `npm start`
  and in Docker.
- **The UI has no component or end-to-end tests in the repository.** Its behaviour (optimism,
  rollback, level-up) was checked by hand with browser automation, not by a committed test.
- **The UI's "today" comes from the browser clock.** If that clock is badly wrong, a prediction
  can briefly differ until the server's answer replaces it.
- **The API address is built into the UI bundle** (`NEXT_PUBLIC_API_URL`, default
  `http://localhost:3001`). Moving the API to another port or host needs a rebuild.
- **Small UI gap:** on level-up the XP bar jumps straight to the new level's start instead of
  filling up first.
- **One flaky run:** once, right after a Docker build, one API test failed (one of 174). Twelve
  reruns all passed and I could not reproduce it. I suspect a timeout while the machine was busy.

## Use of AI

I used AI (Claude Code) to write most of the code, tests and this README step by step, under my
direction. I reviewed every step, decided every open choice myself, and checked the rules against
the recording's numbers and the clean-clone runs by hand.

## Things I noticed outside the task and did not fix

- `npm audit` in `web/` reports high-severity advisories in `braces`, which comes in through
  ESLint, a development dependency. It is not part of the shipped app.
- `create-next-app` installs ESLint 9, which npm reports as deprecated.
- `create-next-app` added an `AGENTS.md` to `web/`. I kept it because `next dev` re-creates it.
- The brief says completions are "newest first" but does not say how to order two completions
  with the same `created_at`. I order those by id, newest first.
- The written spec says a completion "belongs to the calendar day it was made on, in the user's
  time zone at that moment". The recording also shows (line 52) that "already completed today"
  is judged in the **current** time zone, which the spec does not say.
