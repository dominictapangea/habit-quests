import { useEffect, useRef, useState } from "react";
import type { Me } from "@/lib/api";
import { ScoreReels } from "./ScoreReels";
import styles from "./ScoreHeader.module.css";

const FILL_MS = 900;

// The bar's shown fill. On a level-up it first fills to the end, then jumps
// back to empty without animating and fills to the new level's progress.
// Going down (an undo) or staying on the same level just animates.
function useBarFill(level: number | null, progress: number) {
  const [fill, setFill] = useState(progress);
  const [instant, setInstant] = useState(false);
  const lastLevel = useRef(level);

  useEffect(() => {
    const previous = lastLevel.current;
    lastLevel.current = level;
    if (previous === null || level === null || level <= previous) {
      setFill(progress);
      return;
    }
    setFill(1);
    // Timers, not animation frames: frames pause in a background tab and the
    // bar would stay empty until the tab came back.
    let restart: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(() => {
      setInstant(true);
      setFill(0);
      restart = setTimeout(() => {
        setInstant(false);
        setFill(progress);
      }, 50);
    }, FILL_MS);
    return () => {
      clearTimeout(timer);
      clearTimeout(restart);
    };
  }, [level, progress]);

  return { fill, instant };
}

const LADDER = [2, 4, 6, 8, 10, 12, 14];

// Same rule as the API: 2 x streak, capped at 14.
export const dailyBonus = (streak: number) => Math.min(2 * streak, 14);

// Until the first answer arrives the unit stays dark (blank reels, no numbers),
// so the page never shows made-up values.
export function ScoreHeader({ me }: { me: Me | null }) {
  const bonus = me ? dailyBonus(me.streak) : 0;
  const levelSize = me ? me.xp_into_level + me.xp_to_next_level : 1;
  const progress = me ? me.xp_into_level / levelSize : 0;
  const { fill, instant } = useBarFill(me?.level ?? null, progress);

  return (
    <header className={styles.unit} aria-busy={me === null}>
      <div className={styles.score}>
        <h1 className={`label ${styles.brand}`}>Habit Quests</h1>
        <ScoreReels value={me?.xp ?? null} unit="XP" />
      </div>

      <div className={styles.level}>
        <div className={styles.badge} aria-label={me ? `Level ${me.level}` : "Level loading"}>
          <span className="label">Level</span>
          <b>{me?.level ?? ""}</b>
        </div>
        <div className={styles.bar}>
          <div className={`label ${styles.meta}`}>
            <span>{me ? `Level ${me.level} → ${me.level + 1}` : " "}</span>
            <span>{me ? `${me.xp_into_level} / ${levelSize} XP` : ""}</span>
          </div>
          <div
            className={styles.track}
            role="progressbar"
            aria-label={me ? `Progress through level ${me.level}` : "Level progress loading"}
            aria-valuemin={0}
            aria-valuemax={levelSize}
            aria-valuenow={me?.xp_into_level ?? 0}
          >
            <div
              className={`${styles.fill} ${fill > 0 ? styles.filled : ""}`}
              style={{ width: `${fill * 100}%`, transition: instant ? "none" : undefined }}
            />
          </div>
          <div className={styles.meta}>
            <span>{me ? `${me.xp_to_next_level} XP to level ${me.level + 1}` : " "}</span>
          </div>
        </div>
      </div>

      <div className={styles.streak}>
        <div className={styles.streakCount}>
          <ScoreReels value={me?.streak ?? null} unit={me?.streak === 1 ? "day" : "days"} minReels={2} />
          <p className={`label ${styles.streakLabel}`}>
            {me ? (me.streak === 0 ? "No streak yet" : "Streak") : " "}
            <span>{me && me.streak > 0 ? `Daily bonus +${bonus} XP` : ""}</span>
          </p>
        </div>
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
