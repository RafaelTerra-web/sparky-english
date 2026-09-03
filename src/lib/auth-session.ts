import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { EncryptJWT, jwtDecrypt } from "jose";

export type SparkyUser = { id: string; email: string; name: string };
export const SESSION_SECONDS = 60 * 60 * 24 * 7;
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
export const SESSION_COOKIE =
  process.env.NODE_ENV === "production"
    ? "__Host-sparky_session"
    : "sparky_session";
export const CHALLENGE_COOKIE =
  process.env.NODE_ENV === "production"
    ? "__Host-sparky_challenge"
    : "sparky_challenge";

function key() {
  const secret = process.env.SPARKY_SESSION_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("Session secret is not configured");
  return createHash("sha256").update(secret).digest();
}
export function googleConfigured() {
  return Boolean(
    process.env.SPARKY_GOOGLE_CLIENT_ID &&
    (process.env.SPARKY_SESSION_SECRET?.length ?? 0) >= 32 &&
    process.env.SPARKY_ALLOWED_EMAILS?.trim(),
  );
}
export function emailAllowed(email: string) {
  const allowed = (process.env.SPARKY_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}
export async function seal(
  payload: Record<string, unknown>,
  audience: string,
  seconds: number,
) {
  return new EncryptJWT(payload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setIssuer("sparky-english")
    .setAudience(audience)
    .setExpirationTime(`${seconds}s`)
    .encrypt(key());
}
export async function unseal(token: string | undefined, audience: string) {
  if (!token || token.length > 8000) return null;
  try {
    const { payload } = await jwtDecrypt(token, key(), {
      issuer: "sparky-english",
      audience,
      keyManagementAlgorithms: ["dir"],
      contentEncryptionAlgorithms: ["A256GCM"],
    });
    return payload;
  } catch {
    return null;
  }
}
export async function readSession(token?: string): Promise<SparkyUser | null> {
  const payload = await unseal(token, "session");
  if (
    !payload ||
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.name !== "string" ||
    !emailAllowed(payload.email)
  )
    return null;
  return { id: payload.sub, email: payload.email, name: payload.name };
}
export function makeNonce() {
  return randomBytes(32).toString("base64url");
}
export function sameValue(a: unknown, b: unknown): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const left = Buffer.from(a),
    right = Buffer.from(b);
  return (
    left.length >= 20 &&
    left.length === right.length &&
    timingSafeEqual(left, right)
  );
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV !== "production"
      ? new URL(request.url).origin
      : "https://sparky-english-iota.vercel.app");
  return origin === new URL(expected).origin;
}
