import cron from "node-cron";
import { getEnv } from "@/src/config/env.server";
import { logger } from "@/src/utils/logger";

function start() {
  void getEnv();

  logger.info("scheduler worker initializing");

  cron.schedule("0 7 * * *", async () => {
    logger.info({ trigger: "daily-digest" }, "automation trigger");
  });

  cron.schedule("*/15 * * * *", async () => {
    logger.info({ trigger: "risk-monitoring" }, "automation trigger");
  });

  cron.schedule("0 8 * * 1", async () => {
    logger.info({ trigger: "weekly-review" }, "automation trigger");
  });

  logger.info("scheduler worker started");
}

start();
