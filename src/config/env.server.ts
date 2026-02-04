import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AI_PROVIDER_KEY: z.string().optional().default(""),
  MARKET_API_KEY: z.string().optional().default(""),
  NEWS_API_KEY: z.string().optional().default(""),
  JWT_SECRET: z.string().min(32),
  APP_URL: z.string().url().optional().default("http://localhost:3000"),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_PRO: z.string().optional(),
  STRIPE_PRICE_ELITE: z.string().optional(),

  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    AI_PROVIDER_KEY: process.env.AI_PROVIDER_KEY,
    MARKET_API_KEY: process.env.MARKET_API_KEY,
    NEWS_API_KEY: process.env.NEWS_API_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    APP_URL: process.env.APP_URL,

    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO,
    STRIPE_PRICE_ELITE: process.env.STRIPE_PRICE_ELITE,

    NODE_ENV: process.env.NODE_ENV,
  });

  if (!parsed.success) {
    // Throw only when actually accessed at runtime.
    throw parsed.error;
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
