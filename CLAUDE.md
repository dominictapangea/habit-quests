# Habit quests: rebuild of a retired app (EndSpec take-home, task 2)

The full brief is `docs/brief_task_2.md`; the recording is `docs/reference_recording.jsonl`
(68 requests, line numbers below refer to it). Read both before writing code.

## How I want to work

- I'm Dominic, a student. I must understand and explain everything I send, so:
  **explain each step to me in Romanian**, short and concrete, before or after the code.
- At the very start, create `PLAN.md` with every step to do as a checklist. After each
  thing you finish, tick it in `PLAN.md` and add anything new you found to do.
- Small steps. After each step: tell me in Romanian what you did and why, run the tests,
  show me the result, propose a short commit message (English), and wait for me before
  the next step.
- When neither the spec nor the recording settles something, **ask me**, don't decide
  silently. I write every choice in the README.
- Don't invent behaviour. If the recording and a rule disagree, the recording is right.

## Stack and scope

- `api/`: Fastify + TypeScript, SQLite (data must survive a restart), port 3001.
- `web/`: Next.js, one page, port 3000. Design matters a lot: XP bar, level-up moment
  and streak are the heart of it. Feedback must be instant (optimistic) but always end
  up matching the server.
- `docker compose up` starts both. Also one non-Docker command in the README.
- No auth, no multiple users, no deployment, no design system.
- Any request may carry `X-Now` (ISO 8601 with offset): treat it as the current time.

## Rules found in the recording (verify each one against the data before relying on it)

1. Late one-off quest (completion day > due_date): half base XP, rounded down, however
   late. On the due date itself is on time. Lines 15, 17 (25 -> 12), 25 (10 -> 5), 57.
2. Daily bonus: 2 x streak, capped at 14 (streak >= 7), once per day with at least one
   completion. Lines 9, 14, 16, 23, 24, 31; no second bonus same day: 15, 18, 25, 29, 36, 66.
3. Level n needs 100 x n XP (thresholds 100, 300, 600, ...). Lines 1, 17, 31.
4. Streak: consecutive days with a completion ending today, or ending yesterday if today
   has none yet; else 0. Lines 13, 33, 34, 61.
5. Undo recomputes everything from scratch, including bonuses of later days.
   Lines 45-46 (357 -> 339).
6. "Once per day" for daily quests uses the day in the current time zone. Line 52.
7. A completion's day is fixed when it is made; changing time zone later does not move it.
   Lines 57, 60.
8. done: one-off = has a live completion; daily = completed today. Lines 12, 41, 53, 68.
9. Quests newest first; completions newest first by created_at. Lines 12, 37, 60.
   Error messages: lines 6, 7, 8, 11, 39, 50. Undo then complete again = new completion:
   lines 38, 47. created_at is UTC with `Z`, no milliseconds. DST: lines 63-64.

## Architecture decision

Do not store XP, level or streak. Store quests, completions (with an undone flag) and the
time zone. Recompute `me` from live completions on every request with pure functions in
`api/src/rules.ts`. This is what makes rule 5 correct.

## Open choices (ask me before deciding)

- XP exactly on a threshold (e.g. 100): level 2 with 0, or level 1 with 100/100?
- Daily quest not completed today: done false (assumed, never shown in the recording).
- Title: trim spaces? Whitespace-only? Over 100 characters?
- Invalid or past due_date at creation; unknown recurrence values.
- Malformed X-Now header.

## Order of work

1. `rules.ts` as pure functions + unit tests.
2. Fastify API + SQLite + a replay test that runs all 68 recorded requests (mapping
   their ids to ours) and compares every status and body.
3. Next.js UI.
4. Docker, README (rules with line numbers, choices, weakest points, AI line, findings).
5. Clean-machine check: clone the repo into a new folder and follow the README step by
   step (`docker compose up`, and the non-Docker command). EndSpec will do exactly this.
   The task is not done until this works.
