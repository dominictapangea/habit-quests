import { BASE_XP, type Quest } from "@/lib/api";
import { formatDay } from "@/lib/dates";
import styles from "./QuestList.module.css";

interface Props {
  quests: Quest[] | null;
  today: string;
  completing: Set<string>;
  onComplete: (quest: Quest) => void;
}

// XP the quest would earn if completed today (late one-off: half, rounded down).
const xpToday = (q: Quest, today: string) =>
  q.due_date !== null && q.due_date < today ? Math.floor(BASE_XP[q.difficulty] / 2) : BASE_XP[q.difficulty];

function when(q: Quest, today: string): { text: string; overdue?: boolean } {
  if (q.recurrence === "daily") return { text: q.done ? "Done today" : "Every day" };
  if (q.due_date === null) return { text: q.done ? "Done" : "No due date" };
  if (q.done) return { text: `Done · was due ${formatDay(q.due_date)}` };
  if (q.due_date < today) return { text: `Overdue · ${formatDay(q.due_date)}`, overdue: true };
  if (q.due_date === today) return { text: "Due today" };
  return { text: `Due ${formatDay(q.due_date)}` };
}

export function QuestList({ quests, today, completing, onComplete }: Props) {
  if (quests === null) {
    return <p className={styles.empty}>Loading quests…</p>;
  }
  if (quests.length === 0) {
    return <p className={styles.empty}>No quests yet. Add your first one above.</p>;
  }

  return (
    <ul className={styles.list}>
      {quests.map((q) => {
        const w = when(q, today);
        const busy = completing.has(q.id);
        return (
          <li key={q.id} className={`${styles.row} ${q.done ? styles.done : ""}`}>
            <span className={`${styles.dot} ${styles[q.difficulty]}`} aria-hidden />
            <div className={styles.main}>
              <span className={styles.title}>{q.title}</span>
              <span className={styles.sub}>
                <span className={styles.difficulty}>{q.difficulty}</span> · {q.recurrence === "daily" ? "daily" : "one-off"}
              </span>
            </div>
            <span className={w.overdue ? styles.overdue : styles.sub}>{w.text}</span>
            <span className={styles.xp} aria-label={`${xpToday(q, today)} XP`}>
              {xpToday(q, today)}
              <small> XP</small>
            </span>
            {q.done ? (
              <span className={`label ${styles.doneTag}`}>Done</span>
            ) : (
              <button className="btn btn-primary" onClick={() => onComplete(q)} disabled={busy}>
                {busy ? "Saving…" : "Complete"}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
