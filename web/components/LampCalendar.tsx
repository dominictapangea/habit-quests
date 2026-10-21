"use client";

import { useState } from "react";
import { addDays, streakDays } from "@/lib/dates";
import styles from "./LampCalendar.module.css";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Props {
  days: string[]; // days with at least one live completion
  today: string;
}

// "2026-10" -> its days, padded so the first one lands on its weekday (Monday first).
function monthCells(month: string): (string | null)[] {
  const first = `${month}-01`;
  const offset = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7;
  const cells: (string | null)[] = Array(offset).fill(null);
  for (let day = first; day.startsWith(month); day = addDays(day, 1)) cells.push(day);
  return cells;
}

function shiftMonth(month: string, n: number): string {
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + n);
  return date.toISOString().slice(0, 7);
}

const monthName = (month: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", year: "numeric" }).format(
    new Date(`${month}-01T00:00:00Z`),
  );

function Chevron({ flip }: { flip?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M5 2l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}

// A month of day lamps: lit on days with a completion, the current streak
// joined into a chain, today ringed.
export function LampCalendar({ days, today }: Props) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const lit = new Set(days);
  const chain = streakDays(lit, today);
  const litThisMonth = [...lit].filter((d) => d.startsWith(month)).length;

  return (
    <div className={styles.calendar}>
      <div className={styles.head}>
        <button type="button" className={styles.nav} onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month">
          <Chevron flip />
        </button>
        <h3 className={styles.month}>{monthName(month)}</h3>
        <button
          type="button"
          className={styles.nav}
          onClick={() => setMonth(shiftMonth(month, 1))}
          aria-label="Next month"
          disabled={month >= today.slice(0, 7)}
        >
          <Chevron />
        </button>
      </div>

      <div
        className={styles.grid}
        role="img"
        aria-label={`${monthName(month)}: ${litThisMonth} days with a completion, current chain ${chain.size} ${chain.size === 1 ? "day" : "days"}`}
      >
        {WEEKDAYS.map((w) => (
          <span key={w} className={`label ${styles.weekday}`} aria-hidden>
            {w}
          </span>
        ))}
        {monthCells(month).map((day, i) => {
          if (day === null) return <span key={`pad-${i}`} />;
          const isLit = lit.has(day);
          const inChain = chain.has(day);
          // Join to the previous lamp when both are in the chain and on the same row.
          const joinsLeft = inChain && chain.has(addDays(day, -1)) && i % 7 !== 0;
          const classes = [
            styles.day,
            isLit && styles.lit,
            inChain && styles.chain,
            joinsLeft && styles.joinsLeft,
            day === today && styles.today,
            day > today && styles.future,
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <span key={day} className={classes}>
              <span className={styles.lamp}>{Number(day.slice(8))}</span>
            </span>
          );
        })}
      </div>

      <p className={styles.legend}>
        <span>
          <b>{litThisMonth}</b> {litThisMonth === 1 ? "day" : "days"} lit this month
        </span>
        <span>
          Current chain <b>{chain.size}</b>
        </span>
      </p>
    </div>
  );
}
