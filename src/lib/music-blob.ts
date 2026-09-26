import "server-only";
import { get, issueSignedToken, presignUrl } from "@vercel/blob";

const prefix = "reviewed-v1/";
const signedTokens = new Map<string, {
  validUntil: number;
  value: Promise<Awaited<ReturnType<typeof issueSignedToken>>>;
}>();

function credential() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("Private music storage is unavailable");
  return token;
}

export function hasReviewedMusicStore() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function readReviewedMusicManifest(name: string) {
  const result = await get(`${prefix}${name}`, { access: "private", token: credential() });
  if (!result || result.statusCode !== 200) throw new Error("Reviewed music manifest is unavailable");
  return new Response(result.stream).text();
}

export async function reviewedMusicRedirect(name: string) {
  const pathname = `${prefix}${name}`;
  const now = Date.now();
  let cached = signedTokens.get(pathname);
  if (!cached || cached.validUntil <= now + 5 * 60_000) {
    const validUntil = now + 60 * 60_000;
    const value = issueSignedToken({
      pathname,
      operations: ["get"],
      validUntil,
      token: credential(),
    }).catch(error => {
      signedTokens.delete(pathname);
      throw error;
    });
    cached = { validUntil, value };
    signedTokens.set(pathname, cached);
  }
  const { presignedUrl } = await presignUrl(await cached.value, {
    operation: "get",
    pathname,
    access: "private",
    validUntil: now + 30 * 60_000,
  });
  return new Response(null, { status: 307, headers: {
    Location: presignedUrl,
    "Cache-Control": "private, no-store",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  } });
}
