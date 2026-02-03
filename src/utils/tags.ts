import { sanitizeText } from "@/src/utils/sanitize";

export function normalizeTags(input: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const raw of input) {
    const cleaned = sanitizeText(raw)
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    if (!cleaned) continue;
    if (cleaned.length > 32) continue;

    if (!seen.has(cleaned)) {
      seen.add(cleaned);
      out.push(cleaned);
    }

    if (out.length >= 12) break;
  }

  return out;
}
