import { getEnv } from "@/src/config/env.server";
import { initScheduler } from "@/src/scheduler";
import { logger } from "@/src/utils/logger";

export async function register() {
  // Validate env on server startup (not at build time)
  void getEnv();

  try {
    initScheduler();
  } catch (err) {
    logger.error({ err }, "scheduler init failed");
  }
}
