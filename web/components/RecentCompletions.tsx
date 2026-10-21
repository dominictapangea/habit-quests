import type { Completion, Quest } from "@/lib/api";
import { formatDay, formatTime } from "@/lib/dates";
import styles from "./RecentCompletions.module.css";

interface Props {
  completions: Completion[] | null;
  quests: Quest[];
  timezone: string;
  onUndo: (completion: Completion) => void;
}

const SHOWN = 8;

export function RecentCompletions({ completions, quests, timezone, onUndo }: Props) {
  if (completions === null) return <p className={styles.empty}>Loading…</p>;
  if (completions.length === 0) {
    return <p className={styles.empty}>Nothing completed yet. Finished quests show up here, with Undo.</p>;
  }

  const titles = new Map(quests.map((q) => [q.id, q.title]));
  const hidden = completions.length - SHOWN;

  return (
    <>
      <ul className={styles.list}>
        {completions.slice(0, SHOWN).map((c) => (
          <li key={c.id} className={styles.row}>
            <div className={styles.main}>
              <span className={styles.title}>{titles.get(c.quest_id) ?? "Deleted quest"}</span>
              <span className={styles.sub}>
                {formatDay(c.day)} · {formatTime(c.created_at, timezone)}
              </span>
            </div>
            <span className={styles.xp}>+{c.base_xp}</span>
            {/* A completion the server has not confirmed yet has no id to undo. */}
            <button
              type="button"
              className="btn"
              onClick={() => onUndo(c)}
              disabled={c.id.startsWith("pending-")}
              aria-label={`Undo ${titles.get(c.quest_id) ?? "completion"}, ${formatDay(c.day)}`}
            >
              {c.id.startsWith("pending-") ? "Saving…" : "Undo"}
            </button>
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <p className={styles.more}>
          {hidden} older {hidden === 1 ? "completion" : "completions"} not shown
        </p>
      )}
    </>
  );
}
