import type { Me } from "@/lib/api";
import { ScoreReels } from "./ScoreReels";
import styles from "./ScoreHeader.module.css";

const LADDER = [2, 4, 6, 8, 10, 12, 14];

// Same rule as the API: 2 x streak, capped at 14.
export const dailyBonus = (streak: number) => Math.min(2 * streak, 14);

export function ScoreHeader({ me }: { me: Me | null }) {
  const level = me?.level ?? 1;
  const into = me?.xp_into_level ?? 0;
  const toNext = me?.xp_to_next_level ?? 100;
  const levelSize = into + toNext;
  const streak = me?.streak ?? 0;
  const bonus = dailyBonus(streak);

  return (
    <header className={styles.unit} aria-busy={me === null}>
      <div className={styles.score}>
        <h1 className={`label ${styles.brand}`}>Habit Quests</h1>
        <ScoreReels value={me?.xp ?? 0} />
      </div>

      <div className={styles.level}>
        <div className={styles.badge} aria-label={`Level ${level}`}>
          <span className="label">Level</span>
          <b>{level}</b>
        </div>
        <div className={styles.bar}>
          <div className={`label ${styles.meta}`}>
            <span>
              Level {level} → {level + 1}
            </span>
            <span>
              {into} / {levelSize} XP
            </span>
          </div>
          <div
            className={styles.track}
            role="progressbar"
            aria-label={`Progress through level ${level}`}
            aria-valuemin={0}
            aria-valuemax={levelSize}
            aria-valuenow={into}
          >
            <div className={styles.fill} style={{ transform: `scaleX(${into / levelSize})` }} />
          </div>
          <div className={styles.meta}>
            <span>
              {toNext} XP to level {level + 1}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.ladder}>
        <p className="label">
          {streak === 0 ? "No streak yet" : `${streak}-day streak · bonus +${bonus} XP a day`}
        </p>
        <ol className={styles.inserts} aria-label={`Daily bonus ladder, ${bonus} of 14 lit`}>
          {LADDER.map((step) => (
            <li key={step} className={step <= bonus ? styles.lit : undefined}>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </header>
  );
}
