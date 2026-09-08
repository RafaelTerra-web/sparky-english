import { NextRequest, NextResponse } from "next/server";
import { readBoundedJson } from "@/lib/bounded-json";
import { readSession, sameOrigin, seal, SESSION_COOKIE, unseal } from "@/lib/auth-session";
import { eltisBank, publicEltisItem } from "@/lib/eltis-bank";
import type { EltisReport, EltisSkill } from "@/lib/eltis-shared";

const version = "eltis-practice-2026-09-v1";
const headers = { "Cache-Control": "private, no-store" };
type Attempt = { version: string; index: number; answers: string[]; startedAt: number };

function report(attempt: Attempt): EltisReport {
  const skills = Object.fromEntries(
    (["listening", "reading", "vocabulary", "grammar"] as EltisSkill[]).map((skill) => {
      const indices = eltisBank.map((item, index) => ({ item, index })).filter(({ item }) => item.skill === skill);
      const correct = indices.filter(({ item, index }) => attempt.answers[index] === item.answer).length;
      return [skill, { correct, total: indices.length, percent: Math.round((correct / indices.length) * 100) }];
    }),
  ) as EltisReport["skills"];
  const correct = eltisBank.filter((item, index) => attempt.answers[index] === item.answer).length;
  const percent = Math.round((correct / eltisBank.length) * 100);
  const weak = Object.entries(skills).filter(([, score]) => score.percent < 70).map(([skill]) => skill as EltisSkill);
  const labels: Record<EltisSkill, string> = { listening: "listening de sala de aula", reading: "compreensão de textos", vocabulary: "vocabulário acadêmico", grammar: "gramática em contexto" };
  return {
    total: eltisBank.length,
    correct,
    percent,
    band: percent >= 85 ? "Prática avançada" : percent >= 70 ? "Base funcional" : percent >= 50 ? "Em desenvolvimento" : "Base em formação",
    skills,
    recommendations: weak.length ? weak.map((skill) => `Reforce ${labels[skill]}.`) : ["Mantenha contato frequente com aulas, textos e instruções em inglês."],
    completedAt: new Date().toISOString(),
  };
}

async function tokenFor(userId: string, attempt: Attempt) {
  return seal({ mock: attempt }, `mock:eltis:${userId}`, 7 * 86400);
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403, headers });
  const user = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Faça login novamente." }, { status: 401, headers });
  try {
    const body = await readBoundedJson(request);
    if (body.action === "start") {
      const attempt: Attempt = { version, index: 0, answers: [], startedAt: Date.now() };
      return NextResponse.json({ token: await tokenFor(user.id, attempt), question: publicEltisItem(eltisBank[0]), index: 0, total: eltisBank.length }, { headers });
    }
    const payload = await unseal(typeof body.token === "string" ? body.token : undefined, `mock:eltis:${user.id}`);
    const attempt = payload?.mock as Attempt | undefined;
    if (!attempt || attempt.version !== version || !Number.isInteger(attempt.index) || !Array.isArray(attempt.answers) || Date.now() - attempt.startedAt > 7 * 86400000)
      return NextResponse.json({ error: "Este simulado expirou. Comece uma nova tentativa." }, { status: 409, headers });
    if (body.action === "resume") {
      if (attempt.index >= eltisBank.length) return NextResponse.json({ report: report(attempt), finished: true }, { headers });
      return NextResponse.json({ token: body.token, question: publicEltisItem(eltisBank[attempt.index]), index: attempt.index, total: eltisBank.length }, { headers });
    }
    if (body.action !== "answer" || typeof body.answer !== "string" || attempt.index >= eltisBank.length || !eltisBank[attempt.index].options.includes(body.answer))
      return NextResponse.json({ error: "Resposta inválida." }, { status: 400, headers });
    const next: Attempt = { ...attempt, index: attempt.index + 1, answers: [...attempt.answers, body.answer] };
    if (next.index === eltisBank.length)
      return NextResponse.json({ finished: true, report: report(next), token: await tokenFor(user.id, next) }, { headers });
    return NextResponse.json({ token: await tokenFor(user.id, next), question: publicEltisItem(eltisBank[next.index]), index: next.index, total: eltisBank.length }, { headers });
  } catch {
    return NextResponse.json({ error: "Não foi possível continuar o simulado." }, { status: 503, headers });
  }
}

