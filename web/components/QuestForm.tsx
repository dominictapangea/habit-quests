"use client";

import { useState, type FormEvent } from "react";
import { BASE_XP, type Difficulty, type NewQuest } from "@/lib/api";
import styles from "./QuestForm.module.css";

type Schedule = "none" | "due" | "daily";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const SCHEDULES: { value: Schedule; label: string }[] = [
  { value: "none", label: "No date" },
  { value: "due", label: "Due date" },
  { value: "daily", label: "Daily" },
];

interface Props {
  today: string;
  onCreate: (quest: NewQuest) => Promise<void>;
}

export function QuestForm({ today, onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [schedule, setSchedule] = useState<Schedule>("none");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // On a phone the form folds away behind a button: the page is used all day
  // to complete quests, so the list comes first. Always open on wider screens.
  const [open, setOpen] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (title.trim() === "") return setError("Give the quest a title.");
    if (schedule === "due" && !dueDate) return setError("Pick a due date, or choose No date.");
    setError(null);
    setSaving(true);
    try {
      await onCreate({
        title,
        difficulty,
        ...(schedule === "due" ? { due_date: dueDate } : {}),
        ...(schedule === "daily" ? { recurrence: "daily" as const } : {}),
      });
      setTitle("");
      setOpen(false);
    } catch (err) {
      setError(`Could not add the quest: ${(err as Error).message}.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={`btn ${styles.toggle}`}
        aria-expanded={open}
        aria-controls="quest-form"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "Close" : "New quest"}
      </button>
      <form id="quest-form" className={`${styles.form} ${open ? styles.open : ""}`} onSubmit={submit} noValidate>
        <label className={styles.title}>
          <span className="label">New quest</span>
          <input
            className="field"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError(null);
            }}
            maxLength={100}
            placeholder="e.g. Drink 2 litres of water"
            aria-invalid={error !== null && title.trim() === ""}
          />
        </label>

        <fieldset className={styles.group}>
          <legend className="label">Difficulty</legend>
          <div className={styles.segments}>
            {DIFFICULTIES.map((d) => (
              <label key={d} className={styles.segment}>
                <input type="radio" name="difficulty" checked={difficulty === d} onChange={() => setDifficulty(d)} />
                <span>
                  {d[0].toUpperCase() + d.slice(1)} <b>{BASE_XP[d]}</b>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className="label">When</legend>
          <div className={styles.segments}>
            {SCHEDULES.map((s) => (
              <label key={s.value} className={styles.segment}>
                <input
                  type="radio"
                  name="schedule"
                  checked={schedule === s.value}
                  onChange={() => {
                    setSchedule(s.value);
                    if (s.value === "due" && !dueDate) setDueDate(today);
                  }}
                />
                <span>{s.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {schedule === "due" && (
          <label className={styles.date}>
            <span className="label">Due</span>
            <input className="field" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
        )}

        <button className={`btn btn-primary ${styles.submit}`} disabled={saving}>
          {saving ? "Adding…" : "Add quest"}
        </button>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </form>
    </>
  );
}
