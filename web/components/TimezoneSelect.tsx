"use client";

import { useMemo, useState } from "react";
import styles from "./TimezoneSelect.module.css";

interface Props {
  timezone: string;
  disabled: boolean;
  onChange: (timezone: string) => Promise<void>;
}

// Every IANA zone the browser knows, so any zone the API accepts can be picked.
function allZones(current: string): string[] {
  const zones = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
  return zones.includes(current) ? zones : [current, ...zones];
}

// The day a completion belongs to follows this zone (rule: the zone at the
// moment of completing). Changing it never moves past completions.
export function TimezoneSelect({ timezone, disabled, onChange }: Props) {
  const zones = useMemo(() => allZones(timezone), [timezone]);
  const [saving, setSaving] = useState(false);

  return (
    <label className={styles.zone}>
      <span className="label">Time zone</span>
      <select
        className="field"
        value={timezone}
        disabled={disabled || saving}
        onChange={async (e) => {
          setSaving(true);
          try {
            await onChange(e.target.value);
          } finally {
            setSaving(false);
          }
        }}
      >
        {zones.map((z) => (
          <option key={z} value={z}>
            {z.replaceAll("_", " ")}
          </option>
        ))}
      </select>
      <span className={styles.hint}>Decides which day your completions count for.</span>
    </label>
  );
}
