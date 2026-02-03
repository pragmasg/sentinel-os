import dynamic from "next/dynamic";
import type { WidgetDefinition } from "@/src/components/os/types";

export const WidgetRegistry = {
  PORTFOLIO_SUMMARY: {
    id: "portfolio-summary",
    title: "Portfolio",
    component: dynamic(() => import("@/src/components/os/widgets/PortfolioWidget"), {
      ssr: false,
      loading: () => null,
    }),
    defaultSize: { w: 6, h: 5 },
    minSize: { w: 4, h: 4 },
  },
  RISK_STRESS_TEST: {
    id: "risk-stress",
    title: "Risk",
    component: dynamic(() => import("@/src/components/os/widgets/RiskStressWidget"), {
      ssr: false,
      loading: () => null,
    }),
    defaultSize: { w: 6, h: 6 },
    minSize: { w: 4, h: 4 },
  },
  RESEARCH_VAULT: {
    id: "research-vault",
    title: "Research",
    component: dynamic(() => import("@/src/components/os/widgets/VaultWidget"), {
      ssr: false,
      loading: () => null,
    }),
    defaultSize: { w: 12, h: 7 },
    minSize: { w: 6, h: 4 },
  },
} as const satisfies Record<string, WidgetDefinition>;

export type WidgetKey = keyof typeof WidgetRegistry;
export type WidgetId = (typeof WidgetRegistry)[WidgetKey]["id"];

export function registryById(id: string): WidgetDefinition | null {
  for (const def of Object.values(WidgetRegistry)) {
    if (def.id === id) return def;
  }
  return null;
}
