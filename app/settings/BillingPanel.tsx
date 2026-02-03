"use client";

import { useState } from "react";

type Tier = "PRO" | "ELITE";

export default function BillingPanel() {
  const [busy, setBusy] = useState<Tier | "PORTAL" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(tier: Tier) {
    setBusy(tier);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Checkout failed");
      window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBusy(null);
    }
  }

  async function openPortal() {
    setBusy("PORTAL");
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Portal failed");
      window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Portal failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-white/10 bg-neutral-950 p-6">
      <h2 className="text-sm font-semibold text-white/80">Billing</h2>
      <p className="mt-2 text-sm text-white/60">
        Stripe Checkout + Customer Portal (webhook-based plan activation).
      </p>

      {error ? <div className="mt-3 text-sm text-orange-300">{error}</div> : null}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={() => startCheckout("PRO")}
          disabled={busy !== null}
          className="rounded-md border border-white/15 px-4 py-3 text-left hover:border-white/30 disabled:opacity-60"
        >
          <div className="text-xs text-white/50">PRO</div>
          <div className="mt-1 text-sm font-semibold">$19 / month</div>
          <div className="mt-1 text-xs text-white/60">Stress testing + Z-Score + 50 queries/mo</div>
        </button>

        <button
          onClick={() => startCheckout("ELITE")}
          disabled={busy !== null}
          className="rounded-md border border-white/15 px-4 py-3 text-left hover:border-white/30 disabled:opacity-60"
        >
          <div className="text-xs text-white/50">ELITE</div>
          <div className="mt-1 text-sm font-semibold">$49 / month</div>
          <div className="mt-1 text-xs text-white/60">Unlimited queries + vault + custom scenarios</div>
        </button>

        <button
          onClick={openPortal}
          disabled={busy !== null}
          className="rounded-md bg-white text-black px-4 py-3 text-left hover:bg-white/90 disabled:opacity-60"
        >
          <div className="text-xs opacity-70">Manage</div>
          <div className="mt-1 text-sm font-semibold">Customer Portal</div>
          <div className="mt-1 text-xs opacity-70">Upgrade/downgrade/cancel</div>
        </button>
      </div>

      <div className="mt-4 text-[11px] text-white/40">
        Note: plan changes become effective when Stripe webhooks update the database.
      </div>
    </section>
  );
}
