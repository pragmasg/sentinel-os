import Link from "next/link";
import { MarketNewsPanel } from "./MarketNewsPanel";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Sentinel OS</h1>
            <p className="mt-1 text-sm text-white/60">AI Investment Intelligence Operating System</p>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link className="text-white/70 hover:text-white" href="/portfolio">Portfolio</Link>
            <Link className="text-white/70 hover:text-white" href="/risk">Risk</Link>
            <Link className="text-white/70 hover:text-white" href="/journal">Journal</Link>
            <Link className="text-white/70 hover:text-white" href="/ai">AI</Link>
            <Link className="text-white/70 hover:text-white" href="/settings">Settings</Link>
          </nav>
        </header>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <MarketNewsPanel />
          </div>
          <section className="rounded-xl border border-white/10 bg-neutral-950 p-6">
            <h2 className="text-sm font-semibold text-white/80">Portfolio Command Center</h2>
            <p className="mt-2 text-sm text-white/60">
              Allocation view, performance charts, and positions table live under Portfolio.
            </p>
          </section>
          <section className="rounded-xl border border-white/10 bg-neutral-950 p-6">
            <h2 className="text-sm font-semibold text-white/80">AI Insights Feed</h2>
            <p className="mt-2 text-sm text-white/60">
              Daily digest, risk alerts, and research summaries (human-in-the-loop).
            </p>
          </section>
          <section className="rounded-xl border border-white/10 bg-neutral-950 p-6">
            <h2 className="text-sm font-semibold text-white/80">Journal Timeline</h2>
            <p className="mt-2 text-sm text-white/60">
              Auditable narratives and strategy tagging per trade event.
            </p>
          </section>
          <section className="rounded-xl border border-white/10 bg-neutral-950 p-6">
            <h2 className="text-sm font-semibold text-white/80">Automations</h2>
            <p className="mt-2 text-sm text-white/60">
              Internal scheduler triggers daily/weekly monitoring (no workers, no Redis).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
