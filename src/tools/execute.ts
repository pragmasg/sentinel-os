import { prisma } from "@/src/core/db/prisma";
import { logger } from "@/src/utils/logger";
import { toJsonValue } from "@/src/utils/sanitize";
import type { ToolDefinition, ToolContext } from "@/src/tools/types";
import { assertToolPermission } from "@/src/tools/security";

export async function executeTool<TInput, TOutput>(
  tool: ToolDefinition<any, TOutput>,
  input: TInput,
  ctx: ToolContext,
): Promise<TOutput> {
  assertToolPermission(tool.securityLevel, ctx);

  const logBase = {
    tool_name: tool.name,
    security_level: tool.securityLevel,
    user_id: ctx.user?.id ?? null,
  };

  const created = await prisma.toolExecutionLog
    .create({
      data: {
        user_id: ctx.user?.id,
        tool_name: tool.name,
        security_level: tool.securityLevel,
        input_json: toJsonValue(input) as any,
        status: "started",
      },
      select: { id: true },
    })
    .catch((err: unknown) => {
      logger.warn({ err, ...logBase }, "tool log create failed");
      return null;
    });

  logger.info({ ...logBase }, "tool execution started");

  try {
    const parsed = tool.inputSchema.parse(input);
    const output = await tool.execute(parsed, ctx);

    if (created) {
      await prisma.toolExecutionLog
        .update({
          where: { id: created.id },
          data: {
            status: "succeeded",
            output_json: toJsonValue(output) as any,
          },
        })
        .catch((err: unknown) =>
          logger.warn({ err, ...logBase }, "tool log update failed"),
        );
    }

    logger.info({ ...logBase }, "tool execution succeeded");
    return output;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (created) {
      await prisma.toolExecutionLog
        .update({
          where: { id: created.id },
          data: { status: "failed", error_message: message },
        })
        .catch((e: unknown) =>
          logger.warn({ err: e, ...logBase }, "tool log update failed"),
        );
    }

    logger.error({ err, ...logBase }, "tool execution failed");
    throw err;
  }
}
