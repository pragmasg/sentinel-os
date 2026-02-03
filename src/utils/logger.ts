import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
  redact: {
    paths: ["req.headers.authorization", "password", "password_hash", "token"],
    remove: true,
  },
});
