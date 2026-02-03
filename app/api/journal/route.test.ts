import { describe, expect, it, vi, beforeEach } from "vitest";

const requireUserMock = vi.fn();
vi.mock("@/src/auth/require-user", () => ({
  requireUser: (req: Request) => requireUserMock(req),
}));

const listJournalEntriesMock = vi.fn();
const updateJournalEntryMock = vi.fn();
vi.mock("@/src/services/journal.service", () => ({
  listJournalEntries: (...args: any[]) => listJournalEntriesMock(...args),
  updateJournalEntry: (...args: any[]) => updateJournalEntryMock(...args),
}));

describe("/api/journal", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    requireUserMock.mockResolvedValue({
      ok: true,
      user: { id: "userA", email: "a@example.com", role: "USER" },
    });

    listJournalEntriesMock.mockResolvedValue([]);

    updateJournalEntryMock.mockImplementation(async ({ journalEntryId, thesis, tags }: any) => {
      return { id: journalEntryId, thesis, tags };
    });
  });

  it("Muralla China (Ownership Isolation): returns 404 when journal_id is not owned", async () => {
    updateJournalEntryMock.mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/journal/route");

    const res = await POST(
      new Request("http://localhost/api/journal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ journal_id: "j-not-owned", thesis: "x", tags: [] }),
      }),
    );

    expect(res.status).toBe(404);
  });

  it("Sanitización de inputs: strips script tags from thesis before saving", async () => {
    const { POST } = await import("@/app/api/journal/route");

    const payload = {
      journal_id: "j1",
      thesis: "<script>alert('hack')</script> hello <b>world</b>",
      tags: ["<img src=x onerror=alert(1)>", "valid"],
    };

    const res = await POST(
      new Request("http://localhost/api/journal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();

    // Ensure sanitized in the service call (what gets persisted).
    expect(updateJournalEntryMock).toHaveBeenCalled();
    const args = updateJournalEntryMock.mock.calls[0]![0];
    expect(typeof args.thesis).toBe("string");
    expect(args.thesis).not.toContain("<script");
    expect(args.thesis).not.toContain("</script>");
    expect(args.thesis).not.toContain("<b>");

    // Ensure response reflects the sanitized thesis.
    expect(json?.entry?.thesis).toBe(args.thesis);

    // Tags are sanitized too.
    expect(args.tags).toContain("valid");
    expect(args.tags.join(" ")).not.toContain("<");
    expect(args.tags.join(" ")).not.toContain(">"
    );
  });

  it("Normalización de tags: lowercases, dedupes, trims, and strips HTML", async () => {
    const { POST } = await import("@/app/api/journal/route");

    const res = await POST(
      new Request("http://localhost/api/journal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          journal_id: "j1",
          thesis: "ok",
          tags: [" FOMO ", "fomo", "<b>FOMO</b>", "Long   Term", "<script>x</script>"],
        }),
      }),
    );

    expect(res.status).toBe(200);
    expect(updateJournalEntryMock).toHaveBeenCalled();
    const args = updateJournalEntryMock.mock.calls[0]![0];
    expect(args.tags).toEqual(["fomo", "long term"]);
  });
});
