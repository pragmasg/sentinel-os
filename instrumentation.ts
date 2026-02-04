import { getEnv } from "@/src/config/env.server";
import { logger } from "@/src/utils/logger";

export async function register() {
  // Validate env on server startup (not at build time)
  void getEnv();

  try {
    // Scheduler is started by a separate worker process in local/prod.
  } catch (err) {
    logger.error({ err }, "scheduler init failed");
  }
}
