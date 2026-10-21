// Types and calls for the Habit Quests API (see docs/brief_task_2.md).

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface Me {
  timezone: string;
  xp: number;
  level: number;
  xp_into_level: number;
  xp_to_next_level: number;
  streak: number;
}

export type Difficulty = "easy" | "medium" | "hard";

export interface Quest {
  id: string;
  title: string;
  difficulty: Difficulty;
  due_date: string | null;
  recurrence: "daily" | null;
  done: boolean;
}

export interface Completion {
  id: string;
  quest_id: string;
  day: string;
  base_xp: number;
  created_at: string;
}

export interface NewQuest {
  title: string;
  difficulty: Difficulty;
  due_date?: string;
  recurrence?: "daily";
}

export const BASE_XP: Record<Difficulty, number> = { easy: 10, medium: 25, hard: 50 };

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: init?.body ? { "content-type": "application/json", ...init.headers } : init?.headers,
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.error ?? `request failed (${res.status})`);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export const getMe = () => request<Me>("/me");
export const getQuests = () => request<Quest[]>("/quests");
export const createQuest = (quest: NewQuest) =>
  request<Quest>("/quests", { method: "POST", body: JSON.stringify(quest) });
export const getCompletions = () => request<Completion[]>("/completions");
export const undoCompletion = (id: string) =>
  request<void>(`/completions/${encodeURIComponent(id)}`, { method: "DELETE" });
export const completeQuest =(id: string) =>
  request<{ completion: Completion; me: Me }>(`/quests/${encodeURIComponent(id)}/complete`, { method: "POST" });
