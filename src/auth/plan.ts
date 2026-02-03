import { PLAN_LIMITS, type PlanTier } from "@/src/config/billing";

export function canUseResearchQuery(plan: PlanTier, usedThisMonth: number) {
  const limit = PLAN_LIMITS[plan].researchQueriesPerMonth;
  if (!Number.isFinite(limit)) return { ok: true as const };
  return usedThisMonth < limit
    ? { ok: true as const }
    : { ok: false as const, reason: "Research query limit reached" };
}
