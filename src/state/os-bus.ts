import { create } from "zustand";

type StressScenario = { sector: string; shockPct: number };

type OSBusState = {
  portfolioTick: number;
  researchQuery: string | null;
  stressScenario: StressScenario | null;
  logSymbol: string | null;

  bumpPortfolio: () => void;
  setResearchQuery: (q: string | null) => void;
  setStressScenario: (s: StressScenario | null) => void;
  requestLog: (symbol: string | null) => void;
};

export const useOSBus = create<OSBusState>((set) => ({
  portfolioTick: 0,
  researchQuery: null,
  stressScenario: null,
  logSymbol: null,

  bumpPortfolio: () => set((s) => ({ portfolioTick: s.portfolioTick + 1 })),
  setResearchQuery: (q) => set({ researchQuery: q }),
  setStressScenario: (s) => set({ stressScenario: s }),
  requestLog: (symbol) => set({ logSymbol: symbol }),
}));
