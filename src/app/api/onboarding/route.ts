import { NextRequest, NextResponse } from "next/server";
import { readBoundedJson } from '@/lib/bounded-json';
import { readSession, SESSION_COOKIE, sameOrigin } from "@/lib/auth-session";
import {
  accountKey,
  onboardingDB,
  loadOnboarding,
  ensureDraft,
  saveDraft,
  deleteNameAudio,
  nameHash,
} from "@/lib/onboarding-store";
import {
  validateName,
  validateAge,
  onboardingLevels,
  onboardingSteps,
  type LearnerProfile,
} from "@/lib/onboarding-shared";
import {
  startPlacement,
  answerPlacement,
  publicPlacement,
  estimate,
} from "@/lib/placement";
const headers = { "Cache-Control": "private, no-store" };
async function snapshot(key: string) {
  const { profile, session } = await loadOnboarding(key);
  const draft = session?.data;
  return {
    enabled: true,
    profile,
    revision: session?.revision ?? null,
    draft: draft ? { ...draft, placement: undefined } : null,
    placement: draft?.placement ? publicPlacement(draft.placement) : null,
  };
}
export async function GET(request: NextRequest) {
  const user = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user)
    return NextResponse.json(
      { error: "Faça login novamente." },
      { status: 401, headers },
    );
  if (process.env.SPARKY_ONBOARDING_ENABLED !== "true")
    return NextResponse.json({ enabled: false }, { headers });
  try {
    return NextResponse.json(await snapshot(accountKey(user.id)), { headers });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível carregar seu perfil." },
      { status: 503, headers },
    );
  }
}
export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Origem inválida." },
      { status: 403, headers },
    );
  const user = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user)
    return NextResponse.json(
      { error: "Faça login novamente." },
      { status: 401, headers },
    );
  if (process.env.SPARKY_ONBOARDING_ENABLED !== "true")
    return NextResponse.json(
      { error: "Onboarding indisponível." },
      { status: 503, headers },
    );
  try {
    const body = await readBoundedJson(request),
      key = accountKey(user.id),
      db = onboardingDB();
    const slot = await db.rpc("sparky_take_onboarding_slot", {
      p_account: key,
    });
    if (slot.error) throw new Error("Serviço indisponível.");
    if (!slot.data)
      return NextResponse.json(
        { error: "Espere um minuto antes de tentar novamente." },
        { status: 429, headers },
      );
    const loaded = await loadOnboarding(key);
    if (body.action === "start") {
      await ensureDraft(key, loaded.profile);
      return NextResponse.json(await snapshot(key), { headers });
    }
    if (body.action === "refuse") {
      // Delete the session first so an in-flight generation cannot publish into it.
      const removed = await db
        .from("sparky_onboarding_sessions")
        .delete()
        .eq("account_key", key);
      if (removed.error) throw new Error("Falha ao apagar sessão.");
      const erased = await db
        .from("sparky_learner_profiles")
        .delete()
        .eq("account_key", key);
      if (erased.error) throw new Error("Falha ao apagar perfil.");
      await deleteNameAudio(key);
      return NextResponse.json({ refused: true }, { headers });
    }
    const session = loaded.session;
    if (!session || body.revision !== session.revision)
      throw new Error("conflict");
    const draft = { ...session.data };
    if (body.action === "name") {
      const valid = validateName(body.name);
      Object.assign(draft, valid, { step: "age" });
      await saveDraft(key, draft, session.revision);
      await deleteNameAudio(key, nameHash(valid.name));
      return NextResponse.json(await snapshot(key), { headers });
    } else if (body.action === "age") {
      Object.assign(draft, validateAge(body.age));
      if (draft.age! < 13 && body.guardianConsent !== true)
        throw new Error("Um responsável precisa confirmar para continuar.");
      Object.assign(draft, {
        guardianConsent: body.guardianConsent === true,
        consentVersion: "onboarding-v1",
        step: "mascot",
      });
    } else if (body.action === "mascot") {
      if (!["sparky", "pinky"].some(mascot=>mascot===body.mascot))
        throw new Error("Escolha um mascote.");
      Object.assign(draft, { mascot: body.mascot, step: "level" });
    } else if (body.action === "level") {
      if (!onboardingLevels.some(level=>level===body.level))
        throw new Error("Escolha um nível.");
      Object.assign(draft, {
        level: body.level,
        levelMethod: "self-assessment",
        score: null,
        confidence: null,
        placement: undefined,
        step: "finish",
      });
    } else if (body.action === "test") {
      if (!draft.placement) draft.placement = startPlacement();
      draft.step = "test";
    } else if (body.action === "answer") {
      if (!draft.placement) throw new Error("Inicie o teste.");
      draft.placement = answerPlacement(draft.placement, body.id, body.answer);
      const result = estimate(draft.placement);
      if (result.complete)
        Object.assign(draft, {
          level: result.level,
          levelMethod: "placement",
          score: result.score,
          confidence: result.confidence,
          step: "finish",
        });
    } else if (body.action === "back") {
      const current = onboardingSteps.indexOf(draft.step);
      draft.step = onboardingSteps[Math.max(0, current - 1)];
      if (draft.step === "test") draft.step = "level";
    } else if (body.action === "next" && draft.step === "welcome") {
      draft.step = "name";
    } else if (body.action === "finish") {
      const valid = validateName(draft.name),
        age = validateAge(draft.age);
      if (
        !draft.mascot ||
        !draft.level ||
        !onboardingLevels.includes(draft.level) ||
        !["placement", "self-assessment"].includes(draft.levelMethod ?? "") ||
        (age.age < 13 && !draft.guardianConsent)
      )
        throw new Error("Complete as etapas anteriores.");
      if (
        draft.levelMethod === "placement" &&
        (!draft.placement || !estimate(draft.placement).complete)
      )
        throw new Error("Conclua o teste ou escolha um nível.");
      const profile: LearnerProfile = {
        ...valid,
        ...age,
        mascot: draft.mascot,
        level: draft.level,
        levelMethod: draft.levelMethod!,
        score: draft.score ?? null,
        confidence: draft.confidence ?? null,
        onboardingCompleted: true,
        guardianConsent: !!draft.guardianConsent,
      };
      const saved = await db.rpc("sparky_finish_onboarding", {
        p_account: key,
        p_revision: session.revision,
        p_profile: {
          ...profile,
          consentVersion: "onboarding-v1",
          consentedAt: new Date().toISOString(),
          placementVersion:
            draft.levelMethod === "placement" ? "placement-v1" : null,
        },
        p_hash: nameHash(valid.name),
      });
      if (saved.error)
        throw new Error(
          "Não foi possível concluir. Seu progresso foi preservado.",
        );
      if (!saved.data) throw new Error("conflict");
      return NextResponse.json(await snapshot(key), { headers });
    } else throw new Error("Ação inválida.");
    await saveDraft(key, draft, session.revision);
    return NextResponse.json(await snapshot(key), { headers });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível salvar.";
    return NextResponse.json(
      {
        error:
          message === "conflict"
            ? "Seu perfil mudou em outra aba. Atualize para continuar."
            : message,
      },
      { status: message === "conflict" ? 409 : 400, headers },
    );
  }
}
