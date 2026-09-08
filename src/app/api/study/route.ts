import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readSession, SESSION_COOKIE, sameOrigin, seal, unseal } from "@/lib/auth-session";
import { gradeAttempt, type StudyReceipt } from "@/lib/study";
import { accountKey, loadOnboarding } from "@/lib/onboarding-store";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "origin" }, { status: 403 });
  const user = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const text = await request.text();
    if (text.length > 12000) throw new Error("invalid-attempt");
    const body = JSON.parse(text);
    if (!body || typeof body.lessonId !== "string" || typeof body.review !== "boolean" ||
      typeof body.stepId !== "string" || typeof body.answer !== "string" ||
      typeof body.assisted !== "boolean" || (body.receipt && typeof body.receipt !== "string"))
      throw new Error("invalid-attempt");
    const previous = body.receipt ? await unseal(body.receipt, `study:${user.id}`) : null;
    if (body.receipt && !previous) throw new Error("study-expired");
    const profile = body.lessonId === "a1-1-1" && process.env.SPARKY_ONBOARDING_ENABLED === "true" ? (await loadOnboarding(accountKey(user.id))).profile : null;
    const result = gradeAttempt({ ...body, learnerName: profile?.name, previous: previous?.study as StudyReceipt | undefined });
    const receipt = await seal({ study: result.receipt }, `study:${user.id}`, 8 * 3600);
    return NextResponse.json({ ...result, receipt }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "invalid-attempt";
    const allowed = ["study-expired", "study-out-of-order", "lesson-not-found", "invalid-attempt"];
    return NextResponse.json({ error: allowed.includes(code) ? code : "invalid-attempt" }, { status: 400 });
  }
}
