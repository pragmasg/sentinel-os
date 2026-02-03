# pragmas — Sentinel OS (Copilot Instructions)

- TypeScript only.
- Next.js App Router modular monolith.
- Respect domain modules: Portfolio, Risk, Journal, Research, Automation.
- Deterministic analytics must be implemented as Tools (no LLM execution).
- LLM use is limited to summarization/explanation/insight/journaling.
- Prefer `zod` for input validation and `pino` for logging.
- Keep API routes RESTful under `app/api/*`.
- Add unit tests for tools and route-handler tests for API routes.
