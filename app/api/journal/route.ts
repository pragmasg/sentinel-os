import { z } from "zod";
import { requireUser } from "@/src/auth/require-user";
import { listJournalEntries, updateJournalEntry } from "@/src/services/journal.service";
import { sanitizeText } from "@/src/utils/sanitize";
import { normalizeTags } from "@/src/utils/tags";
import { jsonError, jsonOk } from "@/src/utils/responses";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const entries = await listJournalEntries(auth.user.id);
  return jsonOk({ entries });
}

const postSchema = z.object({
  journal_id: z.string().min(1),
  thesis: z.string().optional().nullable(),
  tags: z.array(z.string().min(1)).default([]),
});

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const body = await request.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  const thesis = parsed.data.thesis ? sanitizeText(parsed.data.thesis) : null;
  const tags = normalizeTags(parsed.data.tags);

  const updated = await updateJournalEntry({
    userId: auth.user.id,
    journalEntryId: parsed.data.journal_id,
    thesis,
    tags,
  });

  if (!updated) return jsonError("Not found", 404);
  return jsonOk({ entry: updated });
}
