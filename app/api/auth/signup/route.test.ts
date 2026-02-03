import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/auth/signup/route";

describe("/api/auth/signup", () => {
  it("returns 400 for invalid payload", async () => {
    const res = await POST(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "not-an-email", password: "short" }),
      }),
    );

    expect(res.status).toBe(400);
  });
});
