"use client";

import { useCallback, useEffect, useState } from "react";
import { QuestForm } from "@/components/QuestForm";
import { QuestList } from "@/components/QuestList";
import { ScoreHeader } from "@/components/ScoreHeader";
import { completeQuest, createQuest, getMe, getQuests, type Me, type NewQuest, type Quest } from "@/lib/api";
import { todayIn } from "@/lib/dates";
import styles from "./page.module.css";

export default function Home() {
  const [me, setMe] = useState<Me | null>(null);
  const [quests, setQuests] = useState<Quest[] | null>(null);
  const [completing, setCompleting] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // "Today" in the user's time zone. Only computed in the browser, after the
  // first load, so the server render never reads the clock.
  const [today, setToday] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [nextMe, nextQuests] = await Promise.all([getMe(), getQuests()]);
      setMe(nextMe);
      setToday(todayIn(nextMe.timezone));
      setQuests(nextQuests);
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
      setCompleting((s) => {
        const next = new Set(s);
        next.delete(quest.id);
        return next;
      });
    }
  }

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
          <QuestList quests={today ? quests : null} today={today ?? ""} completing={completing} onComplete={onComplete} />
        </section>
      </main>
    </>
  );
}
