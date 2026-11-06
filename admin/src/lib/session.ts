import { SignJWT, jwtVerify } from "jose";

/**
 * Session token helpers. Kept free of any database or Node-only import so the
 * proxy (edge runtime) can verify a cookie without pulling in Prisma.
 */

export const SESSION_COOKIE = "rpm_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: "ADMIN" | "EDITOR";
};

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET must be set to at least 32 characters. Generate one with: openssl rand -base64 32",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email, name: payload.name, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const role = payload.role === "ADMIN" ? "ADMIN" : "EDITOR";
    if (typeof payload.sub !== "string") return null;
    return {
      sub: payload.sub,
      email: typeof payload.email === "string" ? payload.email : "",
      name: typeof payload.name === "string" ? payload.name : "",
      role,
    };
  } catch {
    return null;
  }
}
