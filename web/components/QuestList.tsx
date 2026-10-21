import { BASE_XP, type Quest } from "@/lib/api";
import { formatDay } from "@/lib/dates";
import styles from "./QuestList.module.css";

interface Props {
  quests: Quest[] | null;
  today: string;
  lastDone: Map<string, string>; // quest id -> day of its latest live completion
  onComplete: (quest: Quest) => void;
}

// XP the quest would earn if completed today (late one-off: half, rounded down).
const xpToday = (q: Quest, today: string) =>
  q.due_date !== null && q.due_date < today ? Math.floor(BASE_XP[q.difficulty] / 2) : BASE_XP[q.difficulty];

function when(q: Quest, today: string, doneOn: string | undefined): { text: string; overdue?: boolean } {
  if (q.recurrence === "daily") return { text: q.done ? "Done today" : "Every day" };
  if (q.done) {
    const late = q.due_date !== null && doneOn !== undefined && doneOn > q.due_date;
    return { text: doneOn ? `Done ${formatDay(doneOn)}${late ? " · late" : ""}` : "Done" };
  }
  if (q.due_date === null) return { text: "No due date" };
  if (q.due_date < today) return { text: `Overdue · ${formatDay(q.due_date)}`, overdue: true };
  if (q.due_date === today) return { text: "Due today" };
  return { text: `Due ${formatDay(q.due_date)}` };
}

export function QuestList({ quests, today, lastDone, onComplete }: Props) {
  if (quests === null) {
    return <p className={styles.empty}>Loading quests…</p>;
  }
  if (quests.length === 0) {
    return <p className={styles.empty}>No quests yet. Add your first one above.</p>;
  }

  // Open quests first, so a Complete button is always near the top; within each
  // group the API's order (newest first) is kept. The API itself is unchanged.
  const ordered = [...quests.filter((q) => !q.done), ...quests.filter((q) => q.done)];

  return (
    <ul className={styles.list}>
      {ordered.map((q) => {
        const w = when(q, today, lastDone.get(q.id));
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
            <span className={styles.xp}>
              {xpToday(q, today)}
              <small> XP</small>
            </span>
            {q.done ? (
              <span className={`label ${styles.doneTag}`}>Done</span>
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => onComplete(q)} aria-label={`Complete ${q.title}`}>
                Complete
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
