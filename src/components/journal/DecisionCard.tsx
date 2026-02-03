"use client";

import { useMemo, useState } from "react";

type DecisionCardProps = {
  entry: {
    id: string;
    createdAt: string;
    thesis: string | null;
    tags: string[];
    tradeEvent: {
      id: string;
      symbol: string;
      side: "BUY" | "SELL";
      size: string;
      price: string;
      fee_amount: string | null;
      fee_pct: string | null;
      net_amount: string | null;
      timestamp: string;
    };
    riskSnapshot: {
      id: string;
      var: string;
      beta: string;
      timestamp: string;
    } | null;
    relatedAlert: {
      id: string;
      type: string;
      title: string;
      message: string;
      created_at: string;
    } | null;
  };
};

export default function DecisionCard({ entry }: DecisionCardProps) {
  const [thesis, setThesis] = useState(entry.thesis ?? "");
  const [tagsText, setTagsText] = useState(entry.tags.join(", "));
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const feeAmount = entry.tradeEvent.fee_amount ? Number(entry.tradeEvent.fee_amount) : 0;
  const feePct = entry.tradeEvent.fee_pct ? Number(entry.tradeEvent.fee_pct) : 0;
  const varPost = entry.riskSnapshot?.var ? Number(entry.riskSnapshot.var) : null;

  const alertBadge = entry.relatedAlert ? "TRIGGERED BY VOLATILITY ALERT" : null;

  const tags = useMemo(() => {
    return tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }, [tagsText]);

  async function save() {
    setBusy(true);
    setSaved(false);
    setError(null);

    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          journal_id: entry.id,
          thesis: thesis.trim() ? thesis : null,
          tags,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Save failed");
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-neutral-950 p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-xs text-white/50">Decision</div>
          <div className="mt-1 text-lg font-semibold tracking-tight">
            {entry.tradeEvent.symbol} — {entry.tradeEvent.side === "BUY" ? "Logged Buy" : "Logged Sell"}
          </div>
          <div className="mt-1 text-xs text-white/50">
            Recorded post-trade • {new Date(entry.tradeEvent.timestamp).toLocaleString()}
          </div>
        </div>

        {alertBadge ? (
          <div className="inline-flex items-center rounded-md border border-[var(--accent-orange)]/40 bg-black px-3 py-1 text-xs text-[var(--accent-orange)]">
            {alertBadge}
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-white/10 bg-black p-3">
          <div className="text-[11px] text-white/50">Fees</div>
          <div className="mt-1 text-sm font-semibold">
            ${feeAmount.toFixed(2)} <span className="text-white/40">({(feePct * 100).toFixed(2)}%)</span>
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-black p-3">
          <div className="text-[11px] text-white/50">VaR (post-log)</div>
          <div className="mt-1 text-sm font-semibold">
            {varPost === null ? "—" : `$${varPost.toFixed(2)}`}
          </div>
          <div className="mt-1 text-[11px] text-white/40">
            Proxy from a deterministic sector stress test.
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-black p-3">
          <div className="text-[11px] text-white/50">Net Amount</div>
          <div className="mt-1 text-sm font-semibold">
            {entry.tradeEvent.net_amount ? `$${Number(entry.tradeEvent.net_amount).toFixed(2)}` : "—"}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="text-xs text-white/60">Your thesis (“Why”)</div>
        <textarea
          className="mt-2 w-full min-h-[96px] rounded-md bg-black border border-white/10 px-3 py-2 outline-none focus:border-[var(--accent-green)]"
          placeholder="Example: Reduced exposure due to systemic risk"
          value={thesis}
          onChange={(e) => setThesis(e.target.value)}
        />

        <div className="mt-3 text-xs text-white/60">Tags (comma-separated)</div>
        <input
          className="mt-2 w-full rounded-md bg-black border border-white/10 px-3 py-2 outline-none focus:border-[var(--accent-orange)]"
          placeholder="FOMO, Strategy A, Panic"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
        />

        {error ? <div className="mt-3 text-sm text-orange-300">{error}</div> : null}
        {saved ? <div className="mt-3 text-sm text-green-300">Saved</div> : null}

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-[11px] text-white/40">
            Pragmas OS is an analytics tool. We do not execute trades or provide financial advice.
          </div>
          <button
            onClick={save}
            disabled={busy}
            className="rounded-md bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save thesis"}
          </button>
        </div>
      </div>
    </div>
  );
}
