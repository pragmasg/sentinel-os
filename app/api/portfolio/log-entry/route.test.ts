import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUserMock = vi.fn();
vi.mock("@/src/auth/require-user", () => ({
  requireUser: (req: Request) => requireUserMock(req),
}));

const prismaMock = {
  portfolio: {
    findFirst: vi.fn(),
  },
  $transaction: vi.fn(),
  toolExecutionLog: {
    create: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock("@/src/core/db/prisma", () => ({
  prisma: prismaMock,
}));

const applyTradeToPositionMock = vi.fn();
vi.mock("@/src/services/portfolio-ledger.service", () => ({
  applyTradeToPosition: (...args: any[]) => applyTradeToPositionMock(...args),
}));

const createRiskSnapshotMock = vi.fn();
const sectorExposureFromPositionsMock = vi.fn();
vi.mock("@/src/services/risk-snapshot.service", () => ({
  createRiskSnapshot: (...args: any[]) => createRiskSnapshotMock(...args),
  sectorExposureFromPositions: (...args: any[]) => sectorExposureFromPositionsMock(...args),
}));

describe("/api/portfolio/log-entry", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    requireUserMock.mockResolvedValue({
      ok: true,
      user: { id: "userA", email: "a@example.com", role: "USER" },
    });

    prismaMock.toolExecutionLog.create.mockResolvedValue({ id: "log1" });
    prismaMock.toolExecutionLog.update.mockResolvedValue({ id: "log1" });

    sectorExposureFromPositionsMock.mockReturnValue({ bySector: {}, total: 0 });
    createRiskSnapshotMock.mockResolvedValue({ id: "rs1" });

    prismaMock.$transaction.mockImplementation(async (fn: any) => {
      const tx = {
        tradeEvent: {
          create: vi.fn().mockResolvedValue({ id: "t1" }),
        },
        position: {
          findMany: vi.fn().mockResolvedValue([]),
        },
        alert: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
        journalEntry: {
          create: vi.fn().mockResolvedValue({ id: "j1" }),
        },
      };
      return fn(tx);
    });
  });

  it("Muralla China (Ownership Isolation): 403/404 when portfolio is not owned; no writes happen", async () => {
    prismaMock.portfolio.findFirst.mockResolvedValue(null);

    const { POST } = await import("@/app/api/portfolio/log-entry/route");

    const res = await POST(
      new Request("http://localhost/api/portfolio/log-entry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          portfolio_id: "portfolioB",
          symbol: "AAPL",
          direction: "BUY",
          quantity: 10,
          price: 100,
          sector: "Tech",
          asset_class: "Equity",
        }),
      }),
    );

    expect([403, 404]).toContain(res.status);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("Validación de tipos (Zod): negative quantity/price returns 400 before touching DB", async () => {
    const { POST } = await import("@/app/api/portfolio/log-entry/route");

    const res = await POST(
      new Request("http://localhost/api/portfolio/log-entry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          portfolio_id: "p1",
          symbol: "AAPL",
          direction: "BUY",
          quantity: -10,
          price: -1,
          sector: "Tech",
          asset_class: "Equity",
        }),
      }),
    );

    expect(res.status).toBe(400);
    expect(prismaMock.portfolio.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("Cálculo pasivo: creates TradeEvent, estimates fees when omitted, executes FeeImpactTool, and makes no external calls", async () => {
    const fetchSpy = vi.fn();
    // @ts-expect-error - override for tests
    globalThis.fetch = fetchSpy;

    prismaMock.portfolio.findFirst.mockResolvedValue({ id: "p1" });

    let createdTradeData: any = null;
    prismaMock.$transaction.mockImplementation(async (fn: any) => {
      const tx = {
        tradeEvent: {
          create: vi.fn().mockImplementation(async ({ data }: any) => {
            createdTradeData = data;
            return { id: "t1", ...data };
          }),
        },
        position: {
          findMany: vi.fn().mockResolvedValue([]),
        },
        alert: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
        journalEntry: {
          create: vi.fn().mockResolvedValue({ id: "j1" }),
        },
      };
      return fn(tx);
    });

    const { POST } = await import("@/app/api/portfolio/log-entry/route");

    const res = await POST(
      new Request("http://localhost/api/portfolio/log-entry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          portfolio_id: "p1",
          symbol: "AAPL",
          direction: "BUY",
          quantity: 10,
          price: 100,
          sector: "Tech",
          asset_class: "Equity",
        }),
      }),
    );

    expect(res.status).toBe(201);

    // Deterministic fee estimate: default 10 bps => 1000 * 0.001 = 1
    expect(createdTradeData).toBeTruthy();
    expect(Number(createdTradeData.fee_amount)).toBeCloseTo(1, 8);
    expect(Number(createdTradeData.fee_pct)).toBeCloseTo(0.001, 8);
    expect(Number(createdTradeData.net_amount)).toBeCloseTo(999, 8);

    expect(prismaMock.toolExecutionLog.create).toHaveBeenCalled();
    const toolNames = prismaMock.toolExecutionLog.create.mock.calls.map((c) => c[0]?.data?.tool_name);
    expect(toolNames).toContain("portfolio.feeImpact");

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
