// The HTTP layer: reads X-Now, validates input, talks to the store and
// recomputes `me` with the pure rules on every request.
import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import { type CompletionRow, type QuestRow, Store } from "./db.ts";
import { baseXp, computeMe, dayInZone, isQuestDone, isValidTimeZone } from "./rules.ts";
import { parseNow, toCreatedAt, validateNewQuest } from "./validation.ts";

declare module "fastify" {
  interface FastifyRequest {
    now: Date;
  }
}

export interface AppOptions {
  dbPath: string;
  logger?: boolean;
  clock?: () => Date;
}

export function buildApp({ dbPath, logger = false, clock = () => new Date() }: AppOptions): FastifyInstance {
  const store = new Store(dbPath);
  const app = Fastify({ logger });

  app.register(cors, { origin: true, methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] });
  app.addHook("onClose", async () => store.close());

  // Accept an empty JSON body (e.g. POST /quests/:id/complete sent with a
  // Content-Type header) instead of Fastify's default 400.
  app.removeContentTypeParser("application/json");
  app.addContentTypeParser("application/json", { parseAs: "string" }, (_req, body, done) => {
    if (body === "") return done(null, undefined);
    try {
      done(null, JSON.parse(body as string));
    } catch {
      done(Object.assign(new Error("invalid JSON"), { statusCode: 400 }), undefined);
    }
  });

  // Any other content type: an empty body is fine (PowerShell's
  // Invoke-RestMethod sends a form type on a POST with no body); a non-empty
  // body that is not JSON is refused.
  app.addContentTypeParser("*", { parseAs: "string" }, (_req, body, done) => {
    if (body === "") return done(null, undefined);
    done(Object.assign(new Error("unsupported media type, send JSON"), { statusCode: 415 }), undefined);
  });

  app.decorateRequest("now", null as unknown as Date);
  app.addHook("onRequest", async (req, reply) => {
    const now = parseNow(req.headers["x-now"], clock());
    if (now === null) return reply.code(400).send({ error: "invalid X-Now" });
    req.now = now;
  });

  app.setErrorHandler((err: { statusCode?: number; message: string }, req, reply) => {
    const status = err.statusCode && err.statusCode < 500 ? err.statusCode : 500;
    if (status === 500) req.log.error(err);
    reply.code(status).send({ error: status === 500 ? "internal error" : err.message });
  });
  app.setNotFoundHandler((_req, reply) => reply.code(404).send({ error: "not found" }));

  const today = (now: Date) => dayInZone(now, store.getTimezone());
  const me = (now: Date) => computeMe(store.listLiveCompletions(), today(now), store.getTimezone());
  const questView = (q: QuestRow, live: CompletionRow[], day: string) => ({
    ...q,
    done: isQuestDone(
      q,
      live.filter((c) => c.quest_id === q.id),
      day,
    ),
  });

  app.post("/quests", async (req, reply) => {
    const input = validateNewQuest(req.body);
    if (!input.ok) return reply.code(400).send({ error: input.error });
    const quest = store.createQuest(input.value);
    return reply.code(201).send(questView(quest, [], today(req.now)));
  });

  app.get("/quests", async (req) => {
    const live = store.listLiveCompletions();
    const day = today(req.now);
    return store.listQuests().map((q) => questView(q, live, day));
  });

  app.post<{ Params: { id: string } }>("/quests/:id/complete", async (req, reply) => {
    const quest = store.getQuest(req.params.id);
    if (!quest) return reply.code(404).send({ error: "quest not found" });
    const day = today(req.now);

    // One-off: any live completion counts. Daily: only one made today, in
    // the current time zone (line 52).
    const existing = store
      .liveCompletionsOf(quest.id)
      .find((c) => quest.recurrence !== "daily" || c.day === day);
    if (existing) return reply.code(200).send({ completion: existing, me: me(req.now) });

    const completion = store.createCompletion({
      quest_id: quest.id,
      day,
      base_xp: baseXp(quest.difficulty, quest.due_date, day),
      created_at: toCreatedAt(req.now),
    });
    return reply.code(201).send({ completion, me: me(req.now) });
  });

  app.get("/completions", async () => store.listLiveCompletions());

  app.delete<{ Params: { id: string } }>("/completions/:id", async (req, reply) => {
    if (!store.undoCompletion(req.params.id)) return reply.code(404).send({ error: "completion not found" });
    return reply.code(204).send();
  });

  app.get("/me", async (req) => me(req.now));

  app.put("/me", async (req, reply) => {
    const timezone = (req.body as { timezone?: unknown } | undefined)?.timezone;
    if (typeof timezone !== "string" || !isValidTimeZone(timezone)) {
      return reply.code(400).send({ error: "invalid timezone" });
    }
    store.setTimezone(timezone);
    return me(req.now);
  });

  app.post("/test/reset", async (_req, reply) => {
    store.reset();
    return reply.code(204).send();
  });

  return app;
}
