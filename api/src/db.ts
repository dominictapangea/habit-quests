// SQLite storage through Node's built-in node:sqlite (no native build step).
// We store only facts: quests, completions (with an undone flag) and the
// time zone. XP, level and streak are always recomputed in rules.ts.
import { DatabaseSync } from "node:sqlite";
import type { Day, Difficulty } from "./rules.ts";
import type { NewQuest } from "./validation.ts";

export interface QuestRow {
  id: string;
  title: string;
  difficulty: Difficulty;
  due_date: Day | null;
  recurrence: "daily" | null;
}

export interface CompletionRow {
  id: string;
  quest_id: string;
  day: Day;
  base_xp: number;
  created_at: string;
}

const DEFAULT_TIMEZONE = "Europe/Bucharest";

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS quests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    due_date TEXT,
    recurrence TEXT
  );
  CREATE TABLE IF NOT EXISTS completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quest_id INTEGER NOT NULL REFERENCES quests(id),
    day TEXT NOT NULL,
    base_xp INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    undone INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS completions_quest ON completions(quest_id, undone);
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`;

// SQLite ids are integers; the API exposes them as strings.
const COMPLETION_COLUMNS = "CAST(id AS TEXT) AS id, CAST(quest_id AS TEXT) AS quest_id, day, base_xp, created_at";
const QUEST_COLUMNS = "CAST(id AS TEXT) AS id, title, difficulty, due_date, recurrence";

export class Store {
  private db: DatabaseSync;

  constructor(path: string) {
    this.db = new DatabaseSync(path);
    this.db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    this.db.exec(SCHEMA);
  }

  close(): void {
    this.db.close();
  }

  getTimezone(): string {
    const row = this.db.prepare("SELECT value FROM settings WHERE key = 'timezone'").get() as
      | { value: string }
      | undefined;
    return row?.value ?? DEFAULT_TIMEZONE;
  }

  setTimezone(timezone: string): void {
    this.db
      .prepare("INSERT INTO settings (key, value) VALUES ('timezone', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
      .run(timezone);
  }

  createQuest(q: NewQuest): QuestRow {
    const { lastInsertRowid } = this.db
      .prepare("INSERT INTO quests (title, difficulty, due_date, recurrence) VALUES (?, ?, ?, ?)")
      .run(q.title, q.difficulty, q.due_date, q.recurrence);
    return this.getQuest(String(lastInsertRowid))!;
  }

  getQuest(id: string): QuestRow | undefined {
    return this.db.prepare(`SELECT ${QUEST_COLUMNS} FROM quests WHERE id = ?`).get(toInt(id)) as QuestRow | undefined;
  }

  // Newest first (line 12).
  listQuests(): QuestRow[] {
    return this.db.prepare(`SELECT ${QUEST_COLUMNS} FROM quests ORDER BY id DESC`).all() as unknown as QuestRow[];
  }

  // Live completions, newest first by created_at (lines 37, 60).
  listLiveCompletions(): CompletionRow[] {
    return this.db
      .prepare(`SELECT ${COMPLETION_COLUMNS} FROM completions WHERE undone = 0 ORDER BY created_at DESC, id DESC`)
      .all() as unknown as CompletionRow[];
  }

  liveCompletionsOf(questId: string): CompletionRow[] {
    return this.db
      .prepare(`SELECT ${COMPLETION_COLUMNS} FROM completions WHERE undone = 0 AND quest_id = ? ORDER BY id`)
      .all(toInt(questId)) as unknown as CompletionRow[];
  }

  createCompletion(c: Omit<CompletionRow, "id">): CompletionRow {
    const { lastInsertRowid } = this.db
      .prepare("INSERT INTO completions (quest_id, day, base_xp, created_at) VALUES (?, ?, ?, ?)")
      .run(toInt(c.quest_id), c.day, c.base_xp, c.created_at);
    return { id: String(lastInsertRowid), ...c };
  }

  // Marks a live completion as undone. False if unknown or already undone.
  undoCompletion(id: string): boolean {
    const { changes } = this.db.prepare("UPDATE completions SET undone = 1 WHERE id = ? AND undone = 0").run(toInt(id));
    return changes > 0;
  }

  reset(): void {
    this.db.exec(`
      DELETE FROM completions;
      DELETE FROM quests;
      DELETE FROM settings;
      DELETE FROM sqlite_sequence;
    `);
  }
}

// Ids that are not plain integers ("q99", "abc") match nothing.
function toInt(id: string): number {
  return /^\d+$/.test(id) ? Number(id) : -1;
}
