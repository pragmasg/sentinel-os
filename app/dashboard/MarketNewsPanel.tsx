"use client";

import { useEffect, useMemo, useState } from "react";

type Quote = {
  symbol: string;
  price: string;
  currency: string | null;
  provider: string;
  fetchedAt: string;
};

type NewsItem = {
  id: string;
  title: string;
  ticker: string | null;
  url: string | null;
  published_at: string | null;
  created_at: string;
};

export function MarketNewsPanel() {
  const [symbol, setSymbol] = useState("AAPL");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsTicker, setNewsTicker] = useState("AAPL");

  const canFetchNews = useMemo(() => true, []);

  async function fetchQuote(s: string) {
    setQuoteError(null);
    setQuote(null);
    const res = await fetch(`/api/market/quote?symbol=${encodeURIComponent(s)}`);
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setQuoteError(json?.error ?? "Quote unavailable");
      return;
    }
    setQuote(json.quote);
  }

  async function fetchNews(ticker: string) {
    const res = await fetch(`/api/news?ticker=${encodeURIComponent(ticker)}&limit=3`);
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setNews([]);
      return;
    }
    setNews(json.items ?? []);
  }

  useEffect(() => {
    void fetchNews(newsTicker);
  }, [newsTicker]);

  return (
    <section className="rounded-xl border border-white/10 bg-neutral-950 p-6">
      <h2 className="text-sm font-semibold text-white/80">Real Data (Free Tier)</h2>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2">
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="AAPL / BTC / BTC-USD"
              className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/30"
            />
            <button
              onClick={() => void fetchQuote(symbol)}
              className="rounded-lg bg-white text-black px-3 py-2 text-sm font-medium"
            >
              Quote
            </button>
          </div>

          <div className="mt-3 text-sm text-white/70">
            {quoteError ? (
              <p className="text-red-300">{quoteError}</p>
            ) : quote ? (
              <div className="space-y-1">
                <div className="text-white">
                  <span className="font-semibold">{quote.symbol}</span> {quote.price}
                  {quote.currency ? ` ${quote.currency}` : ""}
                </div>
                <div className="text-white/50">
                  provider: {quote.provider} · fetched: {new Date(quote.fetchedAt).toLocaleString()}
                </div>
              </div>
            ) : (
              <p className="text-white/50">Fetch a real quote.</p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <input
              value={newsTicker}
              onChange={(e) => setNewsTicker(e.target.value)}
              placeholder="News ticker (AAPL/BTC)"
              className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/30"
            />
            <button
              onClick={() => void fetchNews(newsTicker)}
              className="rounded-lg bg-white/10 text-white px-3 py-2 text-sm font-medium border border-white/10"
              disabled={!canFetchNews}
            >
              Refresh
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {news.length === 0 ? (
              <p className="text-sm text-white/50">
                No news yet. Configure <code className="text-white/70">NEWS_API_KEY</code> and let the worker ingest.
              </p>
            ) : (
              news.map((n) => (
                <a
                  key={n.id}
                  href={n.url ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-lg border border-white/10 bg-black/30 px-3 py-2 hover:border-white/20"
                >
                  <div className="text-sm text-white/90 line-clamp-2">{n.title}</div>
                  <div className="mt-1 text-xs text-white/50">
                    {n.ticker ? `${n.ticker} · ` : ""}
                    {n.published_at ? new Date(n.published_at).toLocaleString() : ""}
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
