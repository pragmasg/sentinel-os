import { describe, expect, it } from "vitest";
import { GET, POST } from "@/app/api/portfolio/route";

describe("/api/portfolio", () => {
  it("GET returns 401 without session", async () => {
    const res = await GET(new Request("http://localhost/api/portfolio"));
    expect(res.status).toBe(401);
  });

  it("POST returns 401 without session", async () => {
    const res = await POST(
      new Request("http://localhost/api/portfolio", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ base_currency: "USD", risk_profile: "balanced" }),
      }),
    );
    expect(res.status).toBe(401);
  });
});
