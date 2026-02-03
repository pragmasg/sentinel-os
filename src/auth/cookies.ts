export const SESSION_COOKIE_NAME = "sentinel_session";

export function buildSessionCookie(token: string): string {
  const isProd = process.env.NODE_ENV === "production";
  const maxAgeSeconds = 60 * 60 * 24 * 7;

  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${maxAgeSeconds}`,
  ];

  if (isProd) parts.push("Secure");

  return parts.join("; ");
}

export function buildLogoutCookie(): string {
  const isProd = process.env.NODE_ENV === "production";
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=0`,
  ];
  if (isProd) parts.push("Secure");
  return parts.join("; ");
}
