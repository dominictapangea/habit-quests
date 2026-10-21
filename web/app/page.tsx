"use client";

import { useEffect, useState } from "react";
import { ScoreHeader } from "@/components/ScoreHeader";
import { getMe, type Me } from "@/lib/api";

export default function Home() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMe()
      .then(setMe)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <>
      <ScoreHeader me={me} />
      {error && (
        <p role="alert" style={{ padding: "24px 56px", color: "var(--red-dark)" }}>
          Could not reach the API: {error}. Is it running on port 3001?
        </p>
      )}
    </>
  );
}
