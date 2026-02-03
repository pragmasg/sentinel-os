import cron from "node-cron";
import { logger } from "@/src/utils/logger";

declare global {
  // eslint-disable-next-line no-var
  var __schedulerStarted: boolean | undefined;
}

export function initScheduler() {
  if (globalThis.__schedulerStarted) return;
  globalThis.__schedulerStarted = true;

  logger.info("scheduler initializing");

  // Daily Intelligence Digest — 07:00
  cron.schedule("0 7 * * *", async () => {
    logger.info({ trigger: "daily-digest" }, "automation trigger");
  });

  // Risk Monitoring — every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    logger.info({ trigger: "risk-monitoring" }, "automation trigger");
  });

  // Weekly Performance Review — Monday 08:00
  cron.schedule("0 8 * * 1", async () => {
    logger.info({ trigger: "weekly-review" }, "automation trigger");
  });

  logger.info("scheduler started");
}
