import { z } from "zod";

export type SecurityLevel = "PUBLIC" | "USER" | "ADMIN";

export type ToolContext = {
  user?: {
    id: string;
    email: string;
    role: "USER" | "ADMIN";
  };
};

export type ToolDefinition<TInputSchema extends z.ZodTypeAny, TOutput> = {
  name: string;
  description: string;
  securityLevel: SecurityLevel;
  inputSchema: TInputSchema;
  execute: (input: z.infer<TInputSchema>, ctx: ToolContext) => Promise<TOutput>;
};

export type ToolRegistry = Record<string, ToolDefinition<z.ZodTypeAny, unknown>>;
