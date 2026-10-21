import styles from "./LevelUp.module.css";

const LAMPS = 18;

// The level-up moment: a lit band across the page with chasing lamps, like a
// pinball backglass special. Never blocks the page (pointer-events: none);
// the parent unmounts it after about 1.5 s.
export function LevelUp({ level }: { level: number }) {
  const lamps = Array.from({ length: LAMPS }, (_, i) => (
    <span key={i} style={{ animationDelay: `${(i % 6) * 70}ms` }} />
  ));
  return (
    <div className={styles.overlay} aria-hidden>
      <div className={styles.band}>
        <div className={styles.lamps}>{lamps}</div>
        <p className={styles.text}>Level {level}</p>
        <div className={styles.lamps}>{lamps}</div>
      </div>
    </div>
  );
}
