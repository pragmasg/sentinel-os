import { SESSION_COOKIE_NAME } from "./cookies";

export function getCookieFromRequest(request: Request, name: string): string | null {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;

  const parts = cookie.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (!part.startsWith(name + "=")) continue;
    return decodeURIComponent(part.slice(name.length + 1));
  }
  return null;
}

export function getSessionTokenFromRequest(request: Request): string | null {
  return getCookieFromRequest(request, SESSION_COOKIE_NAME);
}
