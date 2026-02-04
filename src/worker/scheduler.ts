import cron from "node-cron";
import { getEnv } from "@/src/config/env.server";
import { logger } from "@/src/utils/logger";
import { refreshPortfolioQuotes } from "@/src/services/market.service";
import { ingestNewsForAllUsers } from "@/src/services/news.service";

function start() {
  void getEnv();

  logger.info("scheduler worker initializing");

  cron.schedule("0 7 * * *", async () => {
    logger.info({ trigger: "daily-digest" }, "automation trigger");
  });

  cron.schedule("*/15 * * * *", async () => {
    logger.info({ trigger: "price-update" }, "automation trigger");
    const result = await refreshPortfolioQuotes({ ttlMs: 10 * 60 * 1000, maxSymbols: 8 });
    logger.info({ updated: result.quotes.length }, "price update completed");
  });

  cron.schedule("0 8 * * 1", async () => {
    logger.info({ trigger: "weekly-review" }, "automation trigger");
  });

  // News ingestion (free tier friendly) — hourly
  cron.schedule("5 * * * *", async () => {
    logger.info({ trigger: "news-ingest" }, "automation trigger");
    const res = await ingestNewsForAllUsers({ ttlMs: 10 * 60 * 1000, maxUsers: 10 });
    logger.info({ users: res.users }, "news ingest completed");
  });

  logger.info("scheduler worker started");

  // Kick once on boot for local dev convenience.
  void refreshPortfolioQuotes({ ttlMs: 10 * 60 * 1000, maxSymbols: 8 }).catch(() => null);
  void ingestNewsForAllUsers({ ttlMs: 10 * 60 * 1000, maxUsers: 10 }).catch(() => null);
}

start();
