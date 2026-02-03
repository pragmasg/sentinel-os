"use client";

import { useEffect, useState } from "react";
import { useOSBus } from "@/src/state/os-bus";

export default function RiskStressWidget() {
  const portfolioTick = useOSBus((s) => s.portfolioTick);
  const scenarioSignal = useOSBus((s) => s.stressScenario);

  const [sector, setSector] = useState("Tech");
  const [shockPct, setShockPct] = useState(-0.1);
  const [positionsJson, setPositionsJson] = useState(
    JSON.stringify([{ symbol: "AAPL", sector: "Tech", marketValue: 1000 }], null, 2),
  );
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scenarioSignal) return;
    setSector(scenarioSignal.sector);
    setShockPct(scenarioSignal.shockPct);
  }, [scenarioSignal]);

  useEffect(() => {
    // Portfolio updated signal: re-run if we already have a result.
    if (!result) return;
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolioTick]);

  async function run() {
    setBusy(true);
    setError(null);

    try {
      const positions = JSON.parse(positionsJson);
      const res = await fetch("/api/risk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "stressTest",
          input: { positions, scenario: { sector, shockPct } },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Stress test failed");
      setResult(json.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Stress test failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-sm">
      <div className="grid grid-cols-2 gap-2">
        <input
          className="w-full rounded-md bg-black border border-white/10 px-3 py-2 text-sm outline-none"
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          placeholder="Sector"
        />
        <input
          className="w-full rounded-md bg-black border border-white/10 px-3 py-2 text-sm outline-none"
          value={shockPct}
          onChange={(e) => setShockPct(Number(e.target.value))}
          placeholder="Shock %"
          type="number"
          step={0.01}
        />
      </div>

      <div className="mt-2 text-xs text-white/50">Positions JSON</div>
      <textarea
        className="mt-2 w-full min-h-[120px] rounded-md bg-black border border-white/10 px-3 py-2 text-xs outline-none"
        value={positionsJson}
        onChange={(e) => setPositionsJson(e.target.value)}
      />

      <button
        onClick={run}
        disabled={busy}
        className="mt-3 rounded-md bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90 disabled:opacity-60"
      >
        {busy ? "Running…" : "Run stress test"}
      </button>

      {error ? <div className="mt-2 text-sm text-orange-300">{error}</div> : null}
      {result ? (
        <pre className="mt-2 text-xs text-white/60 whitespace-pre-wrap break-words border border-white/10 rounded-md bg-black p-3">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
