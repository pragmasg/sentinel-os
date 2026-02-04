// Edge runtime instrumentation hook.
// Keep this file edge-safe: do not import Node-only modules (fs, child_process, node-cron, Prisma, etc.).
// Next.js will use this file for the Edge bundle when present, avoiding bundling Node-only code.

export async function register() {
  // Intentionally no-op.
}
