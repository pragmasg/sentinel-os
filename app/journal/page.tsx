"use client";

import { useEffect, useState } from "react";
import DecisionCard from "@/src/components/journal/DecisionCard";

type JournalFeedEntry = Parameters<typeof DecisionCard>[0]["entry"];

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalFeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/journal", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error ?? "Failed to load journal");

        if (!cancelled) {
          setEntries(Array.isArray(json?.entries) ? json.entries : []);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load journal");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold tracking-tight">Journal</h1>
        <p className="mt-2 text-sm text-white/60">
          Post-trade reflection feed. This does not execute trades and is not financial advice.
        </p>

        {loading ? (
          <div className="mt-8 text-sm text-white/60">Loading…</div>
        ) : error ? (
          <div className="mt-8 text-sm text-orange-300">{error}</div>
        ) : entries.length === 0 ? (
          <div className="mt-8 rounded-lg border border-white/10 bg-neutral-950 p-6">
            <div className="text-sm text-white/70">No journal entries yet.</div>
            <div className="mt-2 text-xs text-white/50">
              Record a past trade via the Portfolio “Log Transaction” flow to create your first entry.
            </div>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-4">
            {entries.map((entry) => (
              <DecisionCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
