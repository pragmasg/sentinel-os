import { z } from "zod";
import { requireUser } from "@/src/auth/require-user";
import { createPortfolio, listPortfolios } from "@/src/services/portfolio.service";
import { jsonCreated, jsonError, jsonOk } from "@/src/utils/responses";

const createSchema = z.object({
  base_currency: z.string().min(3).max(8).default("USD"),
  risk_profile: z.string().min(1).default("balanced"),
});

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const portfolios = await listPortfolios(auth.user.id);
  return jsonOk({ portfolios });
}

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  const portfolio = await createPortfolio({
    userId: auth.user.id,
    baseCurrency: parsed.data.base_currency,
    riskProfile: parsed.data.risk_profile,
  });

  return jsonCreated({ portfolio });
}
