import { SignJWT, jwtVerify } from "jose";

export type SessionTokenPayload = {
  sub: string;
  email: string;
  role: "USER" | "ADMIN";
};

const encoder = new TextEncoder();

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return encoder.encode(secret);
}

export async function signSessionToken(payload: SessionTokenPayload) {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret(), {
    algorithms: ["HS256"],
  });

  if (typeof payload.sub !== "string") throw new Error("Invalid token sub");
  const email = payload.email;
  const role = payload.role;
  if (typeof email !== "string") throw new Error("Invalid token email");
  if (role !== "USER" && role !== "ADMIN") throw new Error("Invalid token role");

  return { sub: payload.sub, email, role } as SessionTokenPayload;
}
