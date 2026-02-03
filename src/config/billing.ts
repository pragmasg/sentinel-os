export const PLAN_LIMITS = {
  FREE: {
    portfolios: 1,
    researchQueriesPerMonth: 3,
    schedulerCadence: "daily" as const,
  },
  PRO: {
    portfolios: Number.POSITIVE_INFINITY,
    researchQueriesPerMonth: 50,
    schedulerCadence: "4h" as const,
  },
  ELITE: {
    portfolios: Number.POSITIVE_INFINITY,
    researchQueriesPerMonth: Number.POSITIVE_INFINITY,
    schedulerCadence: "realtime" as const,
  },
};

export type PlanTier = keyof typeof PLAN_LIMITS;
