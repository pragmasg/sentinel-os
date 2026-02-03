import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/auth/me/route";

describe("/api/auth/me", () => {
  it("returns 401 without session", async () => {
    const res = await GET(new Request("http://localhost/api/auth/me"));
    expect(res.status).toBe(401);
  });

  it("returns 401 with invalid token", async () => {
    const res = await GET(
      new Request("http://localhost/api/auth/me", {
        headers: { cookie: "sentinel_session=invalid" },
      }),
    );
    expect(res.status).toBe(401);
  });
});
