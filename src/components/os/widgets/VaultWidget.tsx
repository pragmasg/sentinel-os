"use client";

import { useEffect, useState } from "react";
import { useOSBus } from "@/src/state/os-bus";

export default function VaultWidget() {
  const querySignal = useOSBus((s) => s.researchQuery);
  const setQuerySignal = useOSBus((s) => s.setResearchQuery);

  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (querySignal === null) return;
    setQ(querySignal);
    if (querySignal.trim()) void run(querySignal);
    setQuerySignal(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [querySignal]);

  async function run(query: string) {
    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/research?q=${encodeURIComponent(query)}`, {
        method: "GET",
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Search failed");
      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-sm">
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md bg-black border border-white/10 px-3 py-2 text-sm outline-none focus:border-[var(--accent-green)]"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Query"
        />
        <button
          onClick={() => run(q)}
          disabled={busy}
          className="rounded-md bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90 disabled:opacity-60"
        >
          {busy ? "…" : "Search"}
        </button>
      </div>

      {error ? <div className="mt-2 text-sm text-orange-300">{error}</div> : null}
      {result ? (
        <pre className="mt-3 text-xs text-white/60 whitespace-pre-wrap break-words border border-white/10 rounded-md bg-black p-3">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}

      <div className="mt-3 text-[11px] text-white/40">
        Tip: Ctrl+K → <span className="text-white/60">research your query</span>
      </div>
    </div>
  );
}
