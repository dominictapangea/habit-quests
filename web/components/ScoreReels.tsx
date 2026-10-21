import styles from "./ScoreReels.module.css";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

// XP on mechanical score reels: each drum holds 0-9 and rolls to its digit.
export function ScoreReels({ value, minReels = 5 }: { value: number; minReels?: number }) {
  const digits = String(Math.max(0, value)).padStart(minReels, "0").split("").map(Number);
  return (
    <div className={styles.reels} role="img" aria-label={`${value} XP`}>
      {digits.map((digit, i) => (
        <span className={styles.window} key={digits.length - i}>
          <span className={styles.drum} style={{ transform: `translateY(${-digit * 10}%)` }}>
            {DIGITS.map((d) => (
              <span className={styles.digit} key={d}>
                {d}
              </span>
            ))}
          </span>
        </span>
      ))}
      <span className={`label ${styles.unit}`} aria-hidden>
        XP
      </span>
    </div>
  );
}
