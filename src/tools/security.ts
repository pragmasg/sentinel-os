import type { SecurityLevel } from "@/src/tools/types";

export function assertToolPermission(
  required: SecurityLevel,
  ctx: { user?: { role: "USER" | "ADMIN" } },
) {
  if (required === "PUBLIC") return;
  if (!ctx.user) throw new Error("Unauthorized");
  if (required === "USER") return;
  if (required === "ADMIN" && ctx.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
}
