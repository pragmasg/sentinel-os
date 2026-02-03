import { executeTool } from "@/src/tools/execute";
import { toolRegistry } from "@/src/tools/registry";

export class PortfolioSkill {
  async allocation(
    input: unknown,
    ctx: { user: { id: string; email: string; role: "USER" | "ADMIN" } },
  ) {
    const tool = toolRegistry["portfolio.allocation"];
    if (!tool) throw new Error("Tool not found");
    return executeTool(tool, input, ctx);
  }
}
