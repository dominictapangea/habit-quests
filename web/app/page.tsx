"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LampCalendar } from "@/components/LampCalendar";
import { LevelUp } from "@/components/LevelUp";
import { QuestForm } from "@/components/QuestForm";
import { QuestList } from "@/components/QuestList";
import { RecentCompletions } from "@/components/RecentCompletions";
import { ScoreHeader } from "@/components/ScoreHeader";
import { TimezoneSelect } from "@/components/TimezoneSelect";
import {
  completeQuest,
  createQuest,
  getCompletions,
  getMe,
  getQuests,
  setTimezone,
  undoCompletion,
  type Completion,
  type NewQuest,
  type Quest,
} from "@/lib/api";
import { todayIn } from "@/lib/dates";
import { applyCompleted, applyUndone, deriveView, predictCompletion, type Pending, type Snapshot } from "@/lib/view";
import styles from "./page.module.css";

const LEVEL_UP_MS = 1500;

export default function Home() {
  // Server truth, actions in flight, and whether the snapshot is fresh.
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [synced, setSynced] = useState(true);
  // "Today" in the user's time zone, only computed in the browser.
  const [today, setToday] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);

  const pendingRef = useRef(pending);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);
  const nextOp = useRef(0);

  // Reload everything from the server. A reload that finishes while actions
  // are still in flight is thrown away; the next idle moment reloads again.
  const refresh = useCallback(async () => {
    try {
      const [me, quests, completions] = await Promise.all([getMe(), getQuests(), getCompletions()]);
      if (pendingRef.current.length > 0) return;
      setSnapshot({ me, quests, completions });
      setToday(todayIn(me.timezone));
      setSynced(true);
      setLoadError(null);
    } catch (e) {
      setLoadError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    // Fetch-on-mount: the page is a client component talking to the API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  // Once every action has been answered, reconcile with a full reload.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (pending.length === 0 && !synced) refresh();
  }, [pending.length, synced, refresh]);

  // The page stays open all day: pick up a new day (and other tabs' changes)
  // when it becomes visible again, and check the date every 30 s.
  useEffect(() => {
    const timezone = snapshot?.me.timezone;
    if (!timezone) return;
    const check = () => {
      if (todayIn(timezone) !== today && pendingRef.current.length === 0) refresh();
    };
    const onVisible = () => document.visibilityState === "visible" && pendingRef.current.length === 0 && refresh();
    const timer = setInterval(check, 30_000);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [snapshot?.me.timezone, today, refresh]);

  const view = useMemo(
    () => (snapshot && today ? deriveView(snapshot, pending, synced, today) : null),
    [snapshot, pending, synced, today],
  );

  // Day of each quest's latest live completion (completions are newest first).
  const lastDone = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of view?.completions ?? []) if (!map.has(c.quest_id)) map.set(c.quest_id, c.day);
    return map;
  }, [view]);

  // The level-up moment, whenever the shown level goes up after the first load.
  const shownLevel = view?.me.level ?? null;
  const lastLevel = useRef<number | null>(null);
  useEffect(() => {
    if (shownLevel === null) return;
    if (lastLevel.current !== null && shownLevel > lastLevel.current) {
      setLevelUp(shownLevel);
      const timer = setTimeout(() => setLevelUp(null), LEVEL_UP_MS);
      lastLevel.current = shownLevel;
      return () => clearTimeout(timer);
    }
    lastLevel.current = shownLevel;
  }, [shownLevel]);

  const finish = (opId: string) => setPending((p) => p.filter((x) => x.opId !== opId));

  async function onCreate(quest: NewQuest) {
    const created = await createQuest(quest);
    setSnapshot((s) => s && { ...s, quests: [created, ...s.quests] });
  }

  async function onComplete(quest: Quest) {
    if (!view || !today || view.quests.find((q) => q.id === quest.id)?.done) return;
    const opId = String(nextOp.current++);
    setPending((p) => [...p, { kind: "complete", opId, completion: predictCompletion(quest, today, new Date(), opId) }]);
    setSynced(false);
    try {
      const res = await completeQuest(quest.id);
      setSnapshot((s) => s && applyCompleted(s, res.completion, res.me));
    } catch (e) {
      setNotice(`Could not complete “${quest.title}”: ${(e as Error).message}. Your score is back to what the server has.`);
    } finally {
      finish(opId);
    }
  }

  async function onUndo(completion: Completion) {
    const opId = String(nextOp.current++);
    setPending((p) => [...p, { kind: "undo", opId, completionId: completion.id }]);
    setSynced(false);
    try {
      await undoCompletion(completion.id);
      setSnapshot((s) => s && applyUndone(s, completion.id));
    } catch (e) {
      setNotice(`Could not undo: ${(e as Error).message}. The list is back to what the server has.`);
    } finally {
      finish(opId);
    }
  }

  // Changing the time zone changes "today", so reload everything afterwards.
  async function onTimezone(timezone: string) {
    try {
      await setTimezone(timezone);
    } catch (e) {
      setNotice(`Could not change the time zone: ${(e as Error).message}.`);
    }
    await refresh();
  }

  // Failure notices go away on their own.
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 8000);
    return () => clearTimeout(timer);
  }, [notice]);

  return (
    <>
      <ScoreHeader me={view?.me ?? null} />
      {loadError && (
        <p className={styles.alert} role="alert">
          Could not reach the API ({loadError}). Check that it is running on port 3001, then reload.
        </p>
      )}
      {notice && (
        <div className={styles.alert} role="alert">
          <span>{notice}</span>
          <button type="button" className="btn" onClick={() => setNotice(null)}>
            Dismiss
          </button>
        </div>
      )}
      <p className="visually-hidden" role="status">
        {levelUp !== null ? `Level up! You reached level ${levelUp}.` : ""}
      </p>
      {levelUp !== null && <LevelUp level={levelUp} />}

      <main className={styles.main}>
        <section className="area" aria-labelledby="quests-tab">
          <h2 id="quests-tab" className="area-tab label">
            Quests
          </h2>
          <QuestForm today={today ?? ""} onCreate={onCreate} />
          <QuestList quests={view?.quests ?? null} today={today ?? ""} lastDone={lastDone} onComplete={onComplete} />
        </section>

        <div className={styles.side}>
          <section className="area" aria-labelledby="calendar-tab">
            <h2 id="calendar-tab" className="area-tab label">
              Streak calendar
            </h2>
            {view && today && (
              <>
                <LampCalendar key={view.me.timezone} days={view.completions.map((c) => c.day)} today={today} />
                <TimezoneSelect timezone={view.me.timezone} disabled={pending.length > 0} onChange={onTimezone} />
              </>
            )}
          </section>

          <section className="area" aria-labelledby="recent-tab">
            <h2 id="recent-tab" className="area-tab label">
              Recent completions
            </h2>
            <RecentCompletions
              completions={view?.completions ?? null}
              quests={view?.quests ?? []}
              timezone={view?.me.timezone ?? "Europe/Bucharest"}
              onUndo={onUndo}
            />
          </section>
        </div>
      </main>
    </>
  );
}
