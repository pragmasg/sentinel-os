import { prisma } from "@/src/core/db/prisma";
import { getEnv } from "@/src/config/env.server";

const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes

function normalizeSymbol(input: string) {
  const s = input.trim().toUpperCase();
  if (!s) return s;
  if (s === "BTC") return "BTC";
  if (s === "ETH") return "ETH";
  // Strip common quote suffix for news queries.
  if (s.endsWith("-USD")) return s.slice(0, -4);
  return s;
}

function compactText(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

export async function ingestNewsForUser(params: {
  userId: string;
  symbols: string[];
  ttlMs?: number;
  maxSymbols?: number;
  perSymbolLimit?: number;
}) {
  const env = getEnv();
  if (!env.NEWS_API_KEY) {
    return { ok: false as const, reason: "NEWS_API_KEY not configured" };
  }

  const ttlMs = params.ttlMs ?? DEFAULT_TTL_MS;
  const maxSymbols = params.maxSymbols ?? 4;
  const perSymbolLimit = params.perSymbolLimit ?? 3;

  const symbols = params.symbols
    .map(normalizeSymbol)
    .filter(Boolean)
    .slice(0, maxSymbols);

  const created: { ticker: string; count: number }[] = [];

  for (const ticker of symbols) {
    const last = await prisma.researchDocument.findFirst({
      where: { user_id: params.userId, source: "newsapi", ticker },
      orderBy: { created_at: "desc" },
      select: { created_at: true },
    });

    if (last && Date.now() - last.created_at.getTime() < ttlMs) {
      continue;
    }

    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("q", ticker);
    url.searchParams.set("language", "en");
    url.searchParams.set("pageSize", String(perSymbolLimit));
    url.searchParams.set("sortBy", "publishedAt");

    const res = await fetch(url.toString(), {
      headers: { "X-Api-Key": env.NEWS_API_KEY, accept: "application/json" },
    });

    if (!res.ok) {
      continue;
    }

    const json: any = await res.json();
    const articles: any[] = Array.isArray(json?.articles) ? json.articles : [];

    let count = 0;
    for (const a of articles) {
      const articleUrl = typeof a?.url === "string" ? a.url : null;
      if (!articleUrl) continue;

      const title = typeof a?.title === "string" ? a.title : `News: ${ticker}`;
      const description = typeof a?.description === "string" ? a.description : "";
      const content = typeof a?.content === "string" ? a.content : "";
      const sourceName = typeof a?.source?.name === "string" ? a.source.name : "NewsAPI";
      const publishedAt = typeof a?.publishedAt === "string" ? new Date(a.publishedAt) : null;

      const body = compactText(`${description}\n\n${content}`) || compactText(description) || "";
      if (!body) continue;

      try {
        await prisma.researchDocument.create({
          data: {
            user_id: params.userId,
            title,
            source: "newsapi",
            kind: "news",
            ticker,
            url: articleUrl,
            published_at: publishedAt,
            content: `Source: ${sourceName}\nURL: ${articleUrl}\n\n${body}`,
            chunks: {
              createMany: {
                data: [{ idx: 0, content: body.slice(0, 1200) }],
              },
            },
          },
        });
        count++;
      } catch {
        // likely duplicate on (user_id,url)
      }
    }

    if (count > 0) created.push({ ticker, count });
  }

  return { ok: true as const, created };
}

export async function ingestNewsForAllUsers(params?: {
  ttlMs?: number;
  maxUsers?: number;
}) {
  const maxUsers = params?.maxUsers ?? 10;
  const users = await prisma.user.findMany({
    select: { id: true },
    take: maxUsers,
    orderBy: { created_at: "desc" },
  });

  for (const u of users) {
    const positions = await prisma.position.findMany({
      where: { portfolio: { user_id: u.id } },
      distinct: ["symbol"],
      select: { symbol: true },
      take: 6,
    });

    await ingestNewsForUser({
      userId: u.id,
      symbols: positions.map((p) => p.symbol),
      ttlMs: params?.ttlMs,
    });
  }

  return { ok: true as const, users: users.length };
}

export async function listLatestNews(params: {
  userId: string;
  ticker?: string;
  limit?: number;
}) {
  return prisma.researchDocument.findMany({
    where: {
      user_id: params.userId,
      kind: "news",
      ...(params.ticker ? { ticker: normalizeSymbol(params.ticker) } : null),
    },
    orderBy: { created_at: "desc" },
    take: params.limit ?? 3,
    select: {
      id: true,
      title: true,
      source: true,
      ticker: true,
      url: true,
      published_at: true,
      created_at: true,
    },
  });
}
