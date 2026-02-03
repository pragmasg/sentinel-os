import sanitizeHtml from "sanitize-html";

export function sanitizeText(text: string): string {
  return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} }).trim();
}

export function toJsonValue(value: unknown): unknown {
  // Ensure the value is JSON-serializable before persisting to Prisma Json columns.
  return JSON.parse(
    JSON.stringify(value, (_key, val) => (typeof val === "bigint" ? val.toString() : val)),
  );
}
