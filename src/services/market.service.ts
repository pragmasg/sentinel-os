import { prisma } from "@/src/core/db/prisma";
import { getEnv } from "@/src/config/env.server";

export type MarketQuote = {
  symbol: string;
  price: string; // Decimal as string
  currency: string | null;
  provider: "yahoo" | "alphavantage";
  fetchedAt: string;
};

const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes

function normalizeSymbol(input: string) {
  const s = input.trim().toUpperCase();
  if (!s) return s;

  // Common convenience: allow BTC/ETH shortcuts.
  if (s === "BTC") return "BTC-USD";
  if (s === "ETH") return "ETH-USD";
  return s;
}

function nowIso() {
  return new Date().toISOString();
}

function decimalString(n: number) {
  // Keep a stable representation; DB stores Decimal.
  return Number.isFinite(n) ? n.toFixed(8) : "0.00000000";
}

async function getCachedQuote(symbol: string, provider: string, ttlMs: number) {
  const row = await prisma.marketQuote.findUnique({
    where: { symbol_provider: { symbol, provider } },
  });

  if (!row) return null;
  const ageMs = Date.now() - row.fetched_at.getTime();
  if (ageMs < ttlMs) return row;
  return null;
}

async function saveQuote(params: {
  symbol: string;
  provider: string;
  currency: string | null;
  price: string;
  fetchedAt: Date;
  raw: unknown;
}) {
  return prisma.marketQuote.upsert({
    where: { symbol_provider: { symbol: params.symbol, provider: params.provider } },
    create: {
      symbol: params.symbol,
      provider: params.provider,
      currency: params.currency,
      price: params.price,
      fetched_at: params.fetchedAt,
      raw_json: params.raw as any,
    },
    update: {
      currency: params.currency,
      price: params.price,
      fetched_at: params.fetchedAt,
      raw_json: params.raw as any,
    },
  });
}

async function fetchYahooQuote(symbol: string) {
  const url = new URL("https://query1.finance.yahoo.com/v7/finance/quote");
  url.searchParams.set("symbols", symbol);

  const res = await fetch(url.toString(), {
    headers: {
      accept: "application/json",
      // Some environments block requests without a UA.
      "user-agent": "sentinel-os/0.1 (local-dev)",
    },
  });

  if (!res.ok) throw new Error(`Yahoo quote error: ${res.status}`);

  const json: any = await res.json();
  const result = json?.quoteResponse?.result?.[0];

  const price =
    typeof result?.regularMarketPrice === "number"
      ? result.regularMarketPrice
      : typeof result?.postMarketPrice === "number"
        ? result.postMarketPrice
        : typeof result?.preMarketPrice === "number"
          ? result.preMarketPrice
          : NaN;

  const currency = typeof result?.currency === "string" ? result.currency : null;
  const fetchedAt = new Date();

  if (!Number.isFinite(price)) {
    throw new Error(`Could not resolve price for symbol ${symbol}`);
  }

  return {
    provider: "yahoo" as const,
    symbol,
    currency,
    price: decimalString(price),
    fetchedAt,
    raw: json,
  };
}

// Alpha Vantage is optional. We keep it as a fallback if MARKET_API_KEY is set.
async function fetchAlphaVantageQuote(symbol: string, apiKey: string) {
  // Use GLOBAL_QUOTE for stocks/ETFs.
  const url = new URL("https://www.alphavantage.co/query");
  url.searchParams.set("function", "GLOBAL_QUOTE");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("apikey", apiKey);

  const res = await fetch(url.toString(), {
    headers: { "accept": "application/json" },
  });
  if (!res.ok) throw new Error(`Alpha Vantage error: ${res.status}`);
  const json: any = await res.json();

  const quote = json?.["Global Quote"];
  const rawPrice = quote?.["05. price"];
  const price = typeof rawPrice === "string" ? Number(rawPrice) : NaN;

  if (!Number.isFinite(price)) {
    throw new Error("Alpha Vantage: missing price");
  }

  return {
    provider: "alphavantage" as const,
    symbol,
    currency: null,
    price: decimalString(price),
    fetchedAt: new Date(),
    raw: json,
  };
}

export async function getMarketQuote(params: { symbol: string; ttlMs?: number }): Promise<MarketQuote> {
  const env = getEnv();
  const symbol = normalizeSymbol(params.symbol);
  const ttlMs = params.ttlMs ?? DEFAULT_TTL_MS;

  const provider = env.MARKET_API_KEY ? "alphavantage" : "yahoo";

  const cached = await getCachedQuote(symbol, provider, ttlMs);
  if (cached) {
    return {
      symbol: cached.symbol,
      price: cached.price.toString(),
      currency: cached.currency,
      provider: cached.provider as any,
      fetchedAt: cached.fetched_at.toISOString(),
    };
  }

  const fetched =
    provider === "alphavantage"
      ? await fetchAlphaVantageQuote(symbol, env.MARKET_API_KEY)
      : await fetchYahooQuote(symbol);

  await saveQuote({
    symbol: fetched.symbol,
    provider: fetched.provider,
    currency: fetched.currency,
    price: fetched.price,
    fetchedAt: fetched.fetchedAt,
    raw: fetched.raw,
  });

  return {
    symbol: fetched.symbol,
    price: fetched.price,
    currency: fetched.currency,
    provider: fetched.provider,
    fetchedAt: fetched.fetchedAt.toISOString(),
  };
}

export async function refreshPortfolioQuotes(params: {
  ttlMs?: number;
  maxSymbols?: number;
}) {
  const ttlMs = params.ttlMs ?? DEFAULT_TTL_MS;
  const maxSymbols = params.maxSymbols ?? 8;

  const symbols = await prisma.position.findMany({
    distinct: ["symbol"],
    select: { symbol: true },
    take: maxSymbols,
  });

  const results: MarketQuote[] = [];
  for (const row of symbols) {
    try {
      const q = await getMarketQuote({ symbol: row.symbol, ttlMs });
      results.push(q);
    } catch {
      // keep going
    }
  }

  return { updatedAt: nowIso(), quotes: results };
}
