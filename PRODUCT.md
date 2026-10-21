# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences, weighted equally:

- **The daily user:** one person (no login, no other users) who turns everyday tasks into quests
  and comes back every day to complete them, keep a streak and level up.
- **The EndSpec reviewers:** they clone the repo, run it on a clean machine, replay recorded and
  unseen request logs against the API, and judge the UI on first impression and on how
  truthful the numbers stay.

Mostly used on a desktop or laptop browser; it must also work properly on a phone.

## Product Purpose

Habit Quests is a rebuild of a retired habit tracker. Finishing a quest earns XP, XP fills
levels, and completing something every day builds a streak with a daily bonus. Success means:
the API matches the old app exactly (`docs/reference_recording.jsonl`), and the UI makes
progress feel rewarding while every number on screen ends up equal to what the server says.

## Positioning

Numbers the user can trust: XP, level and streak never jump twice, never vanish on refresh and
never reset at the wrong midnight. The server recomputes everything from live completions, so
undo is exact; the UI reacts instantly but always reconciles with the server.

## Operating Context

- One page, Next.js, on top of a Fastify API (port 3001); UI on port 3000.
- Started with `docker compose up` or one non-Docker command from the README.
- Time can be simulated with the `X-Now` header; the user's time zone (default
  `Europe/Bucharest`) decides which calendar day a completion belongs to.

## Capabilities and Constraints

- Quests: title (1–100 chars), difficulty easy/medium/hard (10/25/50 XP), optional due date
  (one-off) or daily recurrence, never both.
- Required UI: XP bar with level, progress through the level and streak; create-quest form;
  quest list with Complete, done state and overdue flag on one-off quests; recent completions
  with Undo.
- The XP bar, the level-up moment and the streak are the heart of the experience. It must feel
  rewarding, not like an admin panel.
- Feedback is optimistic and instant, then reconciled with the server whatever happens to the
  request.
- Out of scope: auth, multiple users, deployment, a design system.
- UI copy is in English, matching the brief, the recorded data and the API's error messages.
- The other open product choices are listed in `CLAUDE.md`.

## Brand Commitments

- Name: Habit Quests.
- Voice: game vocabulary (quest, XP, level up, streak) used plainly and clearly, never
  over-the-top role-play.

## Evidence on Hand

- `docs/brief_task_2.md` (spec and API contract) and `docs/reference_recording.jsonl`
  (68 real requests with sample quests such as "Drink 2 litres of water").
- No logo, imagery, testimonials or other brand assets exist; do not invent any.

## Product Principles

1. Truth over flash: any animation must end on the server's numbers.
2. Reward the moment: completing a quest, levelling up and keeping a streak should be felt
   immediately.
3. Clear in seconds: a reviewer understands the page and its state at a glance.
4. Game words, plain meaning: playful vocabulary, never at the cost of clarity.
