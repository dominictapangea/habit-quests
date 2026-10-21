"use client";

import { useCallback, useEffect, useState } from "react";
import { LampCalendar } from "@/components/LampCalendar";
import { QuestForm } from "@/components/QuestForm";
import { QuestList } from "@/components/QuestList";
import { RecentCompletions } from "@/components/RecentCompletions";
import { ScoreHeader } from "@/components/ScoreHeader";
import {
  completeQuest,
  createQuest,
  getCompletions,
  getMe,
  getQuests,
  undoCompletion,
  type Completion,
  type Me,
  type NewQuest,
  type Quest,
} from "@/lib/api";
import { todayIn } from "@/lib/dates";
import styles from "./page.module.css";

const without = (set: Set<string>, id: string) => {
  const next = new Set(set);
  next.delete(id);
  return next;
};

export default function Home() {
  const [me, setMe] = useState<Me | null>(null);
  const [quests, setQuests] = useState<Quest[] | null>(null);
  const [completions, setCompletions] = useState<Completion[] | null>(null);
  const [completing, setCompleting] = useState<Set<string>>(new Set());
  const [undoing, setUndoing] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // "Today" in the user's time zone. Only computed in the browser, after the
  // first load, so the server render never reads the clock.
  const [today, setToday] = useState<string | null>(null);

  // Reload everything from the server, the source of truth.
  const refresh = useCallback(async () => {
    try {
      const [nextMe, nextQuests, nextCompletions] = await Promise.all([getMe(), getQuests(), getCompletions()]);
      setMe(nextMe);
      setToday(todayIn(nextMe.timezone));
      setQuests(nextQuests);
      setCompletions(nextCompletions);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    // Fetch-on-mount: the page is a client component talking to the API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  async function onCreate(quest: NewQuest) {
    const created = await createQuest(quest);
    setQuests((qs) => [created, ...(qs ?? [])]);
  }

  async function onComplete(quest: Quest) {
    setCompleting((s) => new Set(s).add(quest.id));
    try {
      const res = await completeQuest(quest.id);
      setMe(res.me);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCompleting((s) => without(s, quest.id));
    }
  }

  async function onUndo(completion: Completion) {
    setUndoing((s) => new Set(s).add(completion.id));
    try {
      await undoCompletion(completion.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      // Undo can change bonuses of later days, so reload everything.
      await refresh();
      setUndoing((s) => without(s, completion.id));
    }
  }

  const ready = today !== null;

  return (
    <>
      <ScoreHeader me={me} />
      {error && (
        <p className={styles.alert} role="alert">
          Could not reach the API ({error}). Check that it is running on port 3001, then reload.
        </p>
      )}
      <main className={styles.main}>
        <section className="area" aria-labelledby="quests-tab">
          <h2 id="quests-tab" className="area-tab label">
            Quests
          </h2>
          <QuestForm today={today ?? ""} onCreate={onCreate} />
          <QuestList quests={ready ? quests : null} today={today ?? ""} completing={completing} onComplete={onComplete} />
        </section>

        <div className={styles.side}>
          <section className="area" aria-labelledby="calendar-tab">
            <h2 id="calendar-tab" className="area-tab label">
              Streak calendar
            </h2>
            {ready && <LampCalendar days={(completions ?? []).map((c) => c.day)} today={today} />}
          </section>

          <section className="area" aria-labelledby="recent-tab">
            <h2 id="recent-tab" className="area-tab label">
              Recent completions
            </h2>
            <RecentCompletions
              completions={ready ? completions : null}
              quests={quests ?? []}
              timezone={me?.timezone ?? "Europe/Bucharest"}
              undoing={undoing}
              onUndo={onUndo}
            />
          </section>
        </div>
      </main>
    </>
  );
}
