import styles from "./ScoreReels.module.css";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

interface Props {
  value: number | null; // null: still loading, the drums show nothing
  unit: string;
  minReels?: number;
}

// A number on mechanical score reels: each drum holds 0-9 and rolls to its digit.
export function ScoreReels({ value, unit, minReels = 5 }: Props) {
  const digits = String(Math.max(0, value ?? 0)).padStart(minReels, "0").split("").map(Number);
  return (
    <div
      className={`${styles.reels} ${value === null ? styles.blank : ""}`}
      role="img"
      aria-label={value === null ? `${unit} loading` : `${value} ${unit}`}
    >
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
        {unit}
      </span>
    </div>
  );
}
