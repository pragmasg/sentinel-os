"use client";

import { useMemo, useState } from "react";
import { useOSBus } from "@/src/state/os-bus";

export default function PortfolioWidget() {
  const bumpPortfolio = useOSBus((s) => s.bumpPortfolio);
  const requestedSymbol = useOSBus((s) => s.logSymbol);

  const [portfolioId, setPortfolioId] = useState("");
  const [symbol, setSymbol] = useState(requestedSymbol ?? "AAPL");
  const [direction, setDirection] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState(10);
  const [price, setPrice] = useState(100);
  const [sector, setSector] = useState("Tech");
  const [feeAmount, setFeeAmount] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const payload = useMemo(() => {
    const fee = feeAmount.trim() ? Number(feeAmount) : undefined;
    return {
      portfolio_id: portfolioId.trim(),
      symbol: symbol.trim(),
      direction,
      quantity,
      price,
      sector,
      asset_class: "Equity",
      ...(typeof fee === "number" && Number.isFinite(fee) ? { fee_amount: fee } : {}),
    };
  }, [direction, feeAmount, portfolioId, price, quantity, sector, symbol]);

  async function logTrade() {
    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/portfolio/log-entry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Log entry failed");
      setResult(json);
      bumpPortfolio();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Log entry failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-sm">
      <div className="text-xs text-white/50">
        Record past transactions only. No execution. No advice.
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2">
        <input
          className="w-full rounded-md bg-black border border-white/10 px-3 py-2 text-sm outline-none focus:border-[var(--accent-green)]"
          placeholder="Portfolio ID"
          value={portfolioId}
          onChange={(e) => setPortfolioId(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-2">
          <input
            className="w-full rounded-md bg-black border border-white/10 px-3 py-2 text-sm outline-none focus:border-[var(--accent-green)]"
            placeholder="Symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          />
          <select
            className="w-full rounded-md bg-black border border-white/10 px-3 py-2 text-sm outline-none focus:border-[var(--accent-green)]"
            value={direction}
            onChange={(e) => setDirection(e.target.value as any)}
          >
            <option value="BUY">Logged Buy</option>
            <option value="SELL">Logged Sell</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            className="w-full rounded-md bg-black border border-white/10 px-3 py-2 text-sm outline-none focus:border-[var(--accent-orange)]"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
          <input
            type="number"
            className="w-full rounded-md bg-black border border-white/10 px-3 py-2 text-sm outline-none focus:border-[var(--accent-orange)]"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            className="w-full rounded-md bg-black border border-white/10 px-3 py-2 text-sm outline-none"
            placeholder="Sector"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
          />
          <input
            type="number"
            className="w-full rounded-md bg-black border border-white/10 px-3 py-2 text-sm outline-none"
            placeholder="Fee amount (optional)"
            value={feeAmount}
            onChange={(e) => setFeeAmount(e.target.value)}
          />
        </div>

        <button
          onClick={logTrade}
          disabled={busy}
          className="rounded-md bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90 disabled:opacity-60"
        >
          {busy ? "Logging…" : "Log Transaction"}
        </button>

        {error ? <div className="text-sm text-orange-300">{error}</div> : null}
        {result ? (
          <pre className="mt-2 text-xs text-white/60 whitespace-pre-wrap break-words border border-white/10 rounded-md bg-black p-3">
            {JSON.stringify(result, null, 2)}
          </pre>
        ) : null}
      </div>
    </div>
  );
}
