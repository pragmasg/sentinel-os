import type { ToolRegistry } from "@/src/tools/types";
import { portfolioAllocationTool } from "@/src/tools/portfolio/allocation.tool";
import { portfolioFeeImpactTool } from "@/src/tools/portfolio/fee-impact.tool";
import { portfolioCurrencyNormalizationTool } from "@/src/tools/portfolio/currency-normalization.tool";
import { riskStressTestTool } from "@/src/tools/risk/stress-test.tool";
import { riskZScoreAnomalyTool } from "@/src/tools/risk/zscore-anomaly.tool";

export const toolRegistry: ToolRegistry = {
  [portfolioAllocationTool.name]: portfolioAllocationTool,
  [portfolioFeeImpactTool.name]: portfolioFeeImpactTool,
  [portfolioCurrencyNormalizationTool.name]: portfolioCurrencyNormalizationTool,
  [riskStressTestTool.name]: riskStressTestTool,
  [riskZScoreAnomalyTool.name]: riskZScoreAnomalyTool,
};
