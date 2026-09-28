import { cookies } from "next/headers";
import { put } from "@vercel/blob";
import { readSession, SESSION_COOKIE, sameOrigin, unseal } from "@/lib/auth-session";
import { readBoundedJson } from "@/lib/bounded-json";
import { accountKey } from "@/lib/onboarding-store";
import { validateStudySession, verifyCompletion, type StudyReceipt } from "@/lib/study";

const headers = { "Cache-Control": "private, no-store" };
const kinds = ["start", "attempt", "help", "abandon", "complete", "timeout"];
/** Private operational snapshots. No response text, name, email or microphone data. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "origin" }, { status: 403, headers });
  const user = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401, headers });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return Response.json({ saved: false }, { headers });
  try {
    const body = await readBoundedJson(request);
    if (typeof body.receipt !== "string" || !kinds.includes(String(body.kind)) ||
      typeof body.sequence !== "number" || !Number.isSafeInteger(body.sequence) || body.sequence < 1 || body.sequence > 1000 ||
      typeof body.index !== "number" || !Number.isSafeInteger(body.index) || body.index < 0 || body.index > 5 ||
      typeof body.mode !== "string" || !["normal", "challenge"].includes(body.mode) || typeof body.activeMs !== "number" || !Number.isSafeInteger(body.activeMs) ||
      body.activeMs < 0 || body.activeMs > 8 * 3600000) throw new Error("invalid-event");
    const proof = await unseal(body.receipt, "study:" + user.id);
    const study = proof?.study as StudyReceipt | undefined;
    if (!study) throw new Error("invalid-event");
    validateStudySession(study);
    if (body.index >= study.exerciseIds.length) throw new Error("invalid-event");
    if (body.kind === "complete") verifyCompletion(study, study.lessonId, study.review);
    const account = accountKey(user.id);
    const environment = process.env.VERCEL_ENV === "production" ? "production" : process.env.VERCEL_ENV === "preview" ? "preview" : "local";
    const event = { version: 1, environment, account, sessionId: study.sessionId, lessonId: study.lessonId,
      contentVersion: study.contentVersion, review: study.review, kind: body.kind, mode: body.mode,
      sequence: body.sequence, index: body.index, questionId: study.exerciseIds[body.index],
      activeMs: body.activeMs, passed: study.passed, failed: study.failed, assisted: study.assisted,
      createdAt: new Date().toISOString() };
    await put("learning-v1/" + environment + "/" + account + "/" + study.sessionId + "-" + body.sequence + ".json",
      JSON.stringify(event), { access: "private", addRandomSuffix: false, allowOverwrite: false,
        contentType: "application/json", cacheControlMaxAge: 60 });
    return Response.json({ saved: true }, { headers });
  } catch (error) {
    if (error instanceof Error && /already exists/i.test(error.message)) return Response.json({ saved: true }, { headers });
    return Response.json({ saved: false }, { status: 400, headers });
  }
}
