"use client";
import { getInterfaceLocale, getSupportLocale, t, supportT, targetText, localizeAttribute } from "@/lib/interface-language";
import { useInterfaceLanguage } from "@/lib/interface-language";
import { LearningLanguagePreferences } from "./learning-language-preferences";
import { nextInTrail, complementaryPractice, recommendationReason, moduleObjective } from "@/lib/course-guide";
import { disciplines, type Discipline } from "@/lib/course-metadata";
import { planReviews, studyDay } from "@/lib/review-plan";
import { updateWorkspace } from "@/lib/learning-local";
import { personalizeLesson } from "@/lib/personalized-lesson";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  ClipboardCheck,
  Coins,
  Globe2,
  GraduationCap,
  Headphones,
  Home,
  Languages,
  LockKeyhole,
  LogOut,
  RotateCcw,
  Settings2,
  Settings,
  ShoppingBag,
  X,
} from "lucide-react";
import type { SparkyUser } from "@/lib/auth-session";
import { ThemePreferenceControl, ThemeQuickToggle, resetAppearanceSession } from "./theme-preference";
import { MotionLoader, MotionTransition, StreakBadge, StreakCelebration } from "./motion-pack";
import { LevelUpCelebration } from "./level-up-celebration";
import { levels, levelDescriptions } from "@/lib/levels";
import {
  lessons,
  type Lesson,
  type Level,
} from "@/lib/curriculum";
import { GoogleLogin } from "./google-login";
import { InstallAppPrompt } from "./install-app-prompt";
import { PersonalSparkyMessage } from "./personal-sparky-message";
import dynamic from "next/dynamic";
import { SectionLoading } from "./section-loading";
import { readWorkspace, blankWorkspace } from "@/lib/learning-local";
const LessonPlayer = dynamic(() => import("./lesson-player"), { loading: () => <SectionLoading label="Abrindo a lição…" /> });
const CourseCatalog = dynamic(() => import("./course-catalog").then(m => m.CourseCatalog), { loading: () => <SectionLoading /> });
const LearningNotebook = dynamic(() => import("./learning-notebook"), { loading: () => <SectionLoading /> });
import {
  MascotFigure,
  MascotStudio,
  type RewardAction,
} from "./mascot-studio";
import type { PublicRewardState } from "@/lib/rewards-shared";
import type { LearnerProfile } from "@/lib/onboarding-shared";
const Onboarding = dynamic(() => import('./onboarding'), { loading: () => <SectionLoading /> });
const EltisSimulator = dynamic(() => import('./eltis-simulator').then(m => m.EltisSimulator), { loading: () => <SectionLoading label="Preparando o simulado…" /> });
const CallExperience = dynamic(() => import("./call").then(m => m.CallExperience), { loading: () => <SectionLoading label="Preparando a conversa…" /> });

const voiceEnabled = process.env.NEXT_PUBLIC_VOICE_ENABLED !== "false";
const callEnabled = process.env.NEXT_PUBLIC_SPARKY_CALL_ENABLED === "true";

const EnglishClassroom = dynamic(() => import("./english-classroom"), { loading: () => <SectionLoading /> });
type View = "call" | "classroom" | "today" | "course" | "review" | "exams" | "profile" | "notebook" | "shop";
type Progress = {
  completed: Record<string, string>;
  reviews: Record<string, string>;
  level: Level;
};
const emptyProgress: Progress = { completed: {}, reviews: {}, level: "A1" };
const emptyRewards: PublicRewardState = {
  coins: 0,
  completed: {},
  reviews: {},
  owned: [],
  notebookTheme: null,
  mascot: "sparky",
  equipped: { sparky: {}, pinky: {} },
  streak: { count: 0, longest: 0, lastDay: null },
};
const navigation = [
  { id: "today" as View, label: "Hoje", icon: Home },
  { id: "course" as View, label: "Curso", icon: BookOpen },
  { id: "review" as View, label: "Revisão", icon: RotateCcw },
  { id: "exams" as View, label: "Simulados", icon: ClipboardCheck },
  { id: "notebook" as View, label: "Caderno", icon: GraduationCap },
  { id: "shop" as View, label: "Loja", icon: ShoppingBag },
  { id: "profile" as View, label: "Perfil", icon: Settings2 },
];

function readProgress(userId: string): Progress {
  try {
    const saved = JSON.parse(
      localStorage.getItem(`sparky-progress:${userId}`) || sessionStorage.getItem(`sparky-progress:${userId}`) || "null",
    );
    if (!saved || !saved.completed || !saved.reviews) return emptyProgress;
    const clean = (record: Record<string, unknown>, allowLegacyMarker = false) =>
      Object.fromEntries(
        Object.entries(record).filter(
          ([id, date]) =>
            lessons.some((lesson) => lesson.id === id) &&
            typeof date === "string" &&
            ((allowLegacyMarker && date === "completed") || Number.isFinite(Date.parse(date))),
        ),
      );
    return {
      completed: clean(saved.completed, true),
      reviews: clean(saved.reviews),
      level: levels.includes(saved.level) ? saved.level : "A1",
    } as Progress;
  } catch {
    return emptyProgress;
  }
}

function clearPrivateStorage() {
  for (const storage of [sessionStorage, localStorage]) {
    for (const key of Object.keys(storage))
      if (key.startsWith("sparky-") && !key.startsWith("sparky-learning:") && !key.startsWith("sparky-progress:")) storage.removeItem(key);
  }
}

export default function SparkyApp() {
  const [onboardingEnabled, setOnboardingEnabled] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile|null>(null);
  const [user, setUser] = useState<SparkyUser | null>(null);
  const interfaceLanguage = useInterfaceLanguage(user?.id);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [view, setView] = useState<View>("today");
  const lessonOpener = useRef<HTMLElement | null>(null);
  const lastView = useRef(view);
  useEffect(() => {
    if (lastView.current === view) return;
    lastView.current = view;
    document.getElementById("conteudo")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [view]);
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [active, setActive] = useState<{
    lesson: Lesson;
    review: boolean;
  } | null>(null);
  const [courseMode, setCourseMode] = useState<"guided"|"practice">("guided");
  const [studyMode, setStudyMode] = useState<"guided"|"practice">("guided");
  const [notice, setNotice] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [reward, setReward] = useState<PublicRewardState>(emptyRewards);
  const [streakCelebration, setStreakCelebration] = useState<{ count: number; milestone: boolean; earned: number } | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const transitionTimer = useRef<number | null>(null);
  const [rewardBusy, setRewardBusy] = useState(false);
  const [rewardAvailable, setRewardAvailable] = useState(true);
  const [workspace, setWorkspace] = useState(blankWorkspace);
  function navigate(nextView: View) {
    setNotice("");
    if (nextView === view) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setView(nextView);
      return;
    }
    setTransitioning(true);
    setView(nextView);
    if (transitionTimer.current) window.clearTimeout(transitionTimer.current);
    transitionTimer.current = window.setTimeout(() => setTransitioning(false), 480);
  }
  useEffect(() => () => {
    if (transitionTimer.current) window.clearTimeout(transitionTimer.current);
  }, []);
  useEffect(() => {
    if (!user) return;
    const refresh = () => { if (!active) setWorkspace(readWorkspace(user.id)); };
    refresh(); window.addEventListener("storage", refresh); window.addEventListener("sparky-workspace", refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener("sparky-workspace", refresh); };
  }, [user, active]);
  const [today, setToday] = useState(() => new Date());
  useEffect(() => { const tick = setInterval(() => setToday(new Date()), 60000); return () => clearInterval(tick); }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/session", { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("session");
        return response.json();
      })
      .then(async (session) => {
        if (session.authenticated && session.user) {
          setUser(session.user);
          const local = readProgress(session.user.id);
          try {
            const response = await fetch("/api/rewards", { cache: "no-store" });
            if (!response.ok) throw new Error("rewards");
            let rewards = (await response.json()) as PublicRewardState;
            const checkInResponse = await fetch("/api/rewards", {
              method: "POST",
              signal: controller.signal,
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ action: "check-in" }),
            });
            if (checkInResponse.ok) {
              const checked = await checkInResponse.json() as PublicRewardState & { streakAdvanced?: boolean; streakMilestone?: boolean; earned?: number };
              rewards = checked;
              if (checked.streakAdvanced && checked.streak)
                setStreakCelebration({ count: checked.streak.count, milestone: Boolean(checked.streakMilestone), earned: checked.earned ?? 0 });
            } else if (checkInResponse.status === 409) {
              const latestResponse = await fetch("/api/rewards", { cache: "no-store", signal: controller.signal });
              if (latestResponse.ok) rewards = await latestResponse.json() as PublicRewardState;
            }
            setReward(rewards);
            setProgress({
              level: local.level,
              completed: rewards.completed,
              reviews: rewards.reviews,
            });
          } catch {
            setRewardAvailable(false);
            setProgress(local);
          }
          const profileResponse = await fetch('/api/onboarding', {cache:'no-store', signal:controller.signal});
          if (!profileResponse.ok) throw new Error('profile');
          const onboarding = await profileResponse.json();
          setOnboardingEnabled(onboarding.enabled);
          if (onboarding.enabled) {
            setLearnerProfile(onboarding.profile);
            setNeedsOnboarding(!onboarding.profile?.onboardingCompleted || Boolean(onboarding.draft));
            if (onboarding.profile) setProgress(current => ({...current, level:onboarding.profile.level}));
          }
        } else {
          try {
            clearPrivateStorage();
          } catch {
            /* Storage may be blocked by the browser. */
          }
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setConnectionError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    if ("serviceWorker" in navigator)
      void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!user) return;
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (tool: object, options: object) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context) return;
    const lifecycle = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: "start_sparky_lesson",
          title: "Abrir uma lição",
          description: "Abre uma lição publicada para o usuário conectado.",
          inputSchema: {
            type: "object",
            properties: { lessonId: { type: "string" } },
            required: ["lessonId"],
            additionalProperties: false,
          },
          execute(input: { lessonId: string }) {
            const lesson = lessons.find((item) => item.id === input.lessonId);
            if (!lesson) throw new Error("Lição não disponível");
            setActive({ lesson, review: false });
            return { title: lesson.title };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);
    return () => lifecycle.abort();
  }, [user]);

  function save(next: Progress) {
    setProgress(next);
    if (user)
      try {
        localStorage.setItem(
          `sparky-progress:${user.id}`,
          JSON.stringify(next),
        );
      } catch {
        setNotice("O navegador não permitiu salvar o progresso desta sessão.");
      }
  }

  async function logout() {
    setSigningOut(true);
    setNotice("");
    try {
      const response = await fetch("/api/session", { method: "DELETE" });
      if (!response.ok) throw new Error("logout");
      try {
        clearPrivateStorage();
      } catch {
        /* Private data is also removed from memory below. */
      }
      try {
        if ("caches" in window)
          await Promise.all(
            (await caches.keys())
              .filter((key) => key.startsWith("sparky-"))
              .map((key) => caches.delete(key)),
          );
      } catch {
        /* Cache availability must not prevent logout. */
      }
      window.google?.accounts?.id?.disableAutoSelect();
      resetAppearanceSession();
      setUser(null);
      setLearnerProfile(null);
      setNeedsOnboarding(false);
      setProgress(emptyProgress);
      setReward(emptyRewards);
      setActive(null);
      setView("today");
    } catch {
      setNotice(
        "Não foi possível encerrar a sessão. Verifique a conexão e tente novamente.",
      );
    } finally {
      setSigningOut(false);
    }
  }

  async function rewardRequest(action: RewardAction | { action: "complete"; lessonId: string; review: boolean; receipt: string }) {
    if (rewardBusy) return null;
    setRewardBusy(true);
    try {
      const send = () => fetch("/api/rewards", {
        method: "POST",
        signal: AbortSignal.timeout(15000),
        headers: { "content-type": "application/json" },
        body: JSON.stringify(action),
      });
      const response = navigator.locks ? await navigator.locks.request("sparky-account-update", send) : await send();
      const data = await response.json();
      if (!response.ok) {
        if (action.action === "complete") throw new Error(data.error || "progress-unavailable");
        if (data.error === "insufficient-coins")
          setNotice("Você ainda não tem moedas suficientes para esse item.");
        else setNotice("Não foi possível atualizar a loja agora. Tente novamente.");
        return null;
      }
      setReward(data);
      save({
        level: progress.level,
        completed: data.completed,
        reviews: data.reviews,
      });
      setRewardAvailable(true);
      return data as PublicRewardState & { earned?: number; spent?: number; reason?: string };
    } catch (error) {
      setNotice("Não foi possível salvar essa mudança. Verifique a conexão.");
      if (action.action === "complete") throw error;
      return null;
    } finally {
      setRewardBusy(false);
    }
  }

  async function handleWardrobe(action: RewardAction) {
    const result = await rewardRequest(action);
    if (!result) return false;
    setNotice(
      action.action === "buy"
        ? result.spent
          ? `Item adquirido por ${result.spent} moedas.`
          : "Esse item já estava no seu inventário."
          : action.action === "buy-and-equip"
            ? result.spent ? `Item adquirido por ${result.spent} moedas e colocado em uso.` : "Item colocado em uso."
          : action.action === "reset-look"
            ? "Visual básico restaurado. Seus itens continuam no inventário."
          : action.action === "equip"
          ? "Visual atualizado."
          : action.action === "notebook-theme"
            ? "Tema do caderno atualizado. Seus textos foram preservados."
          : `${action.mascot === "pinky" ? "Pinky" : "Sparky"} agora acompanha suas lições.`,
    );
    return true;
  }

  async function finish(receipt: string): Promise<boolean> {
    if (!active || rewardBusy) return false;
    const now = new Date();
    setToday(now);
    const result = await rewardRequest({
      action: "complete",
      lessonId: active.lesson.id,
      review: active.review,
      receipt,
    });
    if (result) {
      if (!active.review && !progress.completed[active.lesson.id]) updateWorkspace(user!.id, current => ({...current,studyDay:studyDay(now),newLessonsToday:(current.studyDay===studyDay(now)?current.newLessonsToday:0)+1}));
      const earned = result.earned ?? 0;
      setNotice(
        active.review
          ? earned
            ? `Revisão concluída. +${earned} moedas; confira a próxima data na revisão.`
            : "Revisão concluída. Esta prática não gerou uma nova recompensa."
          : earned
            ? `Lição concluída. +${earned} moedas.`
            : "Lição concluída novamente. A recompensa da primeira conclusão já foi recebida.",
      );
      setActive(null);
      return true;
    }
    return false;
  }

  if (loading)
    return (
      <main className="loading-page">
        <Brand />
        <MotionLoader label="Abrindo seu espaço de estudo…" />
      </main>
    );
  if (connectionError)
    return (
      <main className="loading-page">
        <Brand />
        <h1>{t("Sem conexão no momento")}</h1>
        <p>{t("Conecte-se à internet para validar sua sessão.")}</p>
        <button
          className="primary-button"
          onClick={() => window.location.reload()}
        >{t("Tentar novamente")}</button>
      </main>
    );
  if (!user) return <LoginScreen />;
  if (needsOnboarding) return <Onboarding editing={Boolean(learnerProfile?.onboardingCompleted)} onCancel={() => { if (!learnerProfile?.onboardingCompleted) { void logout(); return; } void fetch("/api/onboarding", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"cancel-edit"})}).then(r=>{if(r.ok)setNeedsOnboarding(false);else setNotice("Não foi possível fechar o ajuste.");}); }} onComplete={profile => {
    setLearnerProfile(profile); setProgress(current => ({...current,level:profile.level}));
    setReward(current => ({...current,mascot:profile.mascot}));setNeedsOnboarding(false);
  }} />;

  const completed = Object.keys(progress.completed).length;
  const trailNext = nextInTrail(progress.level, progress.completed);
  const next = trailNext || lessons.find(l=>l.level===progress.level)!;
  const complementary = complementaryPractice(progress.level, progress.completed, workspace);
  const studied = lessons
    .filter((lesson) => progress.completed[lesson.id])
    .sort((a, b) => Date.parse(progress.reviews[a.id] || "9999-01-01") - Date.parse(progress.reviews[b.id] || "9999-01-01"));
  const dailyDone = reward.dailyReviews?.day === studyDay(today) ? reward.dailyReviews.count : 0;
  const reviewPlan = planReviews(studied, progress.reviews, progress.level, dailyDone, today);
  const dueLessons = reviewPlan.due;
  const earlyLessons: Lesson[] = [];
  const due = dueLessons.length;
  const dueLabel = `${due} para hoje`;
  const resume = Object.values(workspace.checkpoints).filter(p => today.getTime() - Date.parse(p.updatedAt) < 7 * 3600000 && (!p.review || dueLessons.some(l=>l.id===p.lessonId)) && lessons.some(l => l.id === p.lessonId)).sort((a,b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0];
  const newLessonsToday = workspace.studyDay === studyDay(today) ? workspace.newLessonsToday : 0;
  const interleaved = newLessonsToday > dailyDone && workspace.recommendation !== "new";
  const recommended = resume ? lessons.find(l => l.id === resume.lessonId)! : (interleaved ? dueLessons[0] : undefined) || next;
  const recommendedReview = resume ? resume.review : dueLessons.some(l=>l.id===recommended.id);
  const remainingInLevel = lessons.filter(lesson => lesson.level === recommended.level && !progress.completed[lesson.id]).length;
  const followingLevel = levels[levels.indexOf(recommended.level) + 1];
  const levelProgressText = (remainingInLevel === 0
    ? t("Lições de {level} concluídas")
    : followingLevel
      ? t(remainingInLevel === 1 ? "{level} · Falta 1 lição para {next}" : "{level} · Faltam {count} lições para {next}")
      : t(remainingInLevel === 1 ? "Falta 1 lição para concluir o C2" : "Faltam {count} lições para concluir o C2"))
    .replace("{level}", recommended.level).replace("{next}", followingLevel ?? "").replace("{count}", String(remainingInLevel));
  const plannedReview = workspace.recommendation !== "new" ? dueLessons.find(l=>l.id!==recommended.id) : undefined;
  const planMinutes = (recommendedReview ? 2 + (trailNext?.minutes ?? 0) : recommended.minutes) + (plannedReview && !recommendedReview ? 2 : 0);
  const open = (lesson: Lesson, review = false, mode: "guided"|"practice" = "guided") => {
    setStudyMode(mode);
    setNotice("");
    if (review && (dailyDone >= 3 || !dueLessons.some(item => item.id === lesson.id))) { setNotice("Você já concluiu as três revisões de hoje. Continue com uma lição nova."); return; }
    setActive({ lesson: personalizeLesson(lesson, learnerProfile?.name), review });
  };
  async function editNamePronunciation(action = "pronunciation-start") {
    try {
      const response = await fetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível abrir o ajuste.");
      setNeedsOnboarding(true);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Tente novamente."); }
  }

  return (
    <div className="app-frame">
      <a href="#conteudo" className="skip-link">{t("Pular para o conteúdo")}</a>
      <MotionTransition active={transitioning} />
      {streakCelebration && <StreakCelebration {...streakCelebration} onClose={() => setStreakCelebration(null)} />}
      <LevelUpCelebration userId={user.id} currentLevel={progress.level} completed={progress.completed} learnerName={learnerProfile?.name} />
      <aside className="sidebar">
        <Brand />
        <nav aria-label={localizeAttribute("Navegação principal")}>
          {navigation.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "nav-item active" : "nav-item"}
              aria-current={view === item.id ? "page" : undefined}
              onClick={() => {
                navigate(item.id);
              }}
            >
              <item.icon size={19} />
              {t(item.label)}
              {item.id === "review" && due > 0 && (
                <span className="nav-count">{t(due)}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-course">
          <Languages size={22} />
          <p>{t("Seu idioma: ")}<strong>{t(interfaceLanguage === "en" ? "English" : "Português")}</strong>
          </p>
          <p>{t("Você está estudando ")}<strong>{t("Inglês")}</strong>
          </p>
          <span>{t("PT-BR ")}<ArrowRight size={13} />{t(" EN")}</span>
        </div>
        <button className="logout-link" onClick={logout} disabled={signingOut}>
          <LogOut size={16} />
          {t(signingOut ? "Saindo…" : "Sair da conta")}
        </button>
      </aside>
      <main className="workspace" id="conteudo" tabIndex={-1} onClickCapture={event => {
        if (event.target instanceof Element) lessonOpener.current = event.target.closest('button');
      }}>
        {view !== "call" && <header className="workspace-header">
          <div className="mobile-brand">
            <Brand />
          </div>
          <p className="date-label">
            {t(new Intl.DateTimeFormat(getInterfaceLocale(), {
              weekday: "long",
              day: "numeric",
              month: "long",
            }).format(new Date()))}
          </p>
          <button
            className="account-chip profile-gear"
            onClick={() => navigate("profile")}
            aria-label={localizeAttribute(`Abrir perfil de ${user.name}`)}
          >
            <Settings size={21} aria-hidden="true" />
          </button>
          <StreakBadge count={reward.streak?.count ?? 0} longest={reward.streak?.longest ?? 0} />
          <ThemeQuickToggle userId={user.id} />
        </header>}
        {notice && (
          <div className="notice" role="status">
            {supportT(notice)}
            <button
              aria-label={localizeAttribute("Dispensar mensagem")}
              onClick={() => setNotice("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {view === "today" && (
          <div className="today-overview">
            <div className="page-heading">
              <div>
                <p className="eyebrow">{t("Olá,")} {learnerProfile?.name ?? user.name}</p>
                <h1>{t("Seu estudo de hoje")}</h1>
              </div>
              <span className="language-chip">
                <Languages size={15} />{t("Português ")}<ArrowRight size={12} />{t(" Inglês")}</span>
            </div>
            <div className="today-layout">
              <section className="next-lesson">
                <div className="lesson-copy">
                  <span className="lesson-label">
                    {t(resume ? "RETOMAR PRÁTICA" : recommendedReview ? "REVISÃO PARA HOJE" : "PRÓXIMA LIÇÃO")} <span>{t(recommended.level)}</span>
                  </span>
                  <h2>{t(recommended.title)}</h2>
                  <div className="lesson-meta">
                    <Clock3 size={15} />
                    {t(recommendedReview ? 2 : recommended.minutes)} {t("min")}<span>·</span>{t(recommendedReview ? "Revisão" : "Explicação + prática")}</div>
                  <button className="cream-button" onClick={() => open(recommended, recommendedReview)}>
                    {t(resume ? "Continuar de onde parei" : "Começar meu plano")}
                    <ArrowRight size={17} />
                  </button>
                  <p className="level-progress-note" role="status">{levelProgressText}</p>
                  <details className="daily-plan-details">
                    <summary>{t("Detalhes do plano")}</summary>
                    <p>{t(!trailNext && !resume && !recommendedReview ? "Você concluiu a trilha do nível recomendado. Esta é uma prática opcional." : recommendationReason(Boolean(resume),recommendedReview))}</p>
                    <p>{t("Meta diária:")} {workspace.minutes} {t("min")} · {t("Lições novas hoje:")} {newLessonsToday}</p>
                    {plannedReview && !recommendedReview && <p><strong>{t("Depois, uma revisão curta:")}</strong> {t(plannedReview.title)}</p>}
                    {recommendedReview && trailNext && <p><strong>{t("Depois, continue a trilha:")}</strong> {t(trailNext.title)}</p>}
                    {planMinutes > workspace.minutes && <p>{t("A lição pode passar da sua meta de tempo. Você pode pausar e retomar de onde parou.")}</p>}
                  </details>
                </div>
                <MascotFigure
                  mascot={reward.mascot}
                  equipped={reward.equipped}
                  size="hero"
                />
                <div className="hero-caption">
                  {t(reward.mascot === "pinky" ? "PINKY" : "SPARKY")}{t(" / SEU GUIA DE ESTUDO")}</div>
              </section>
              <aside className="study-summary">
                <p className="eyebrow">{t("Seu progresso no curso")}</p>
                <div className="summary-progress">
                <div className="progress-number">
                  {t(completed)}
                  <span>/{t(lessons.length)}</span>
                </div>
                <div className="summary-meter">
                <p>{t("lições concluídas")}</p>
                <progress
                  value={completed}
                  max={lessons.length}
                  aria-label={localizeAttribute("Lições concluídas")}
                />
                </div>
                </div>
                <div className="summary-stats">
                <div className="stat-row streak-stat">
                  <span>{t("Sequência diária")}</span>
                  <strong><Image className="streak-inline-flame" src="/motion/streak-flame-96.png" width={18} height={18} alt="" /> {reward.streak?.count ?? 0} {t((reward.streak?.count ?? 0) === 1 ? "dia" : "dias")}</strong>
                </div>
                <div className="stat-row">
                  <span>{t("Revisões para hoje")}</span>
                  <strong>{t(due)}</strong>
                </div>
                <div className="stat-row coin-stat">
                  <span>{t("Moedas")}</span>
                  <strong><Coins size={16} /> {t(reward.coins)}</strong>
                </div>
                </div>
                <button
                  className="text-button"
                  onClick={() => navigate("review")}
                >{t("Abrir revisão ")}<ArrowRight size={15} />
                </button>
              </aside>
            </div>
            {learnerProfile && voiceEnabled && !active && <PersonalSparkyMessage key={`${learnerProfile.name}-${learnerProfile.namePronunciation}`} profile={learnerProfile} occasion="welcome" onPronunciation={() => void editNamePronunciation()} />}
            <InstallAppPrompt />
            {callEnabled && <section className="call-invite">
              <span className="call-invite-icon" aria-hidden="true"><Headphones size={24} /></span>
              <div><p className="eyebrow">{t("CALL DE CONVERSAÇÃO · 10 MIN")}</p><h2>{t(`Fale com ${reward.mascot === "pinky" ? "a Pinky" : "o Sparky"}`)}</h2><p>{t("Pratique uma situação real no seu nível e receba feedback ao terminar.")}</p></div>
              <button className="primary-button" onClick={() => navigate("call")}>{t("Praticar conversação")}<ArrowRight size={17}/></button>
            </section>}
            <section className="learning-note"><span className="note-icon"><Languages size={22}/></span><div><h2>{t('Objetivo do módulo')}</h2><p>{supportT(moduleObjective(next.moduleId!))}.</p><button className="text-button" onClick={()=>{setCourseMode('guided');navigate('course');}}>{t('Ver minha trilha')}<ArrowRight size={15}/></button></div></section>
            <section className="complementary-practice"><div className="section-heading"><div><p className="eyebrow">{t('Opcional')}</p><h2>{t('Treino complementar')}</h2></div><button className="text-button" onClick={()=>{setCourseMode('practice');navigate('course');}}>{t('Treinar por disciplina')}<ArrowRight size={15}/></button></div>
             <p>{t('Escolha uma prática extra sem perder o próximo passo do curso.')}</p>
             <div className="lesson-cards">{complementary.map(({lesson,reason})=><div key={lesson.id}><LessonCard lesson={lesson} number={lessons.findIndex(l=>l.id===lesson.id)+1} done={Boolean(progress.completed[lesson.id])} onOpen={()=>open(lesson,false,'practice')}/><p className="recommendation-reason">{t(reason)}</p></div>)}</div>
            </section>
          </div>
        )}
        {view === "course" && (
          <>
          <CourseCatalog
            level={progress.level}
            completed={progress.completed}
            workspace={workspace}
            dueIds={dueLessons.map(l=>l.id)}
            mode={courseMode}
            onMode={setCourseMode}
            onOpen={open}
            onExams={() => navigate("exams")}
          />
          </>
        )}
        {view === "call" && <CallExperience learnerName={learnerProfile?.name ?? user.name} initialLevel={progress.level} mascot={reward.mascot} storageKey={user.id} onBack={() => navigate("today")} />}
        {(view === "course" || view === "today") && <section className="review-guidance"><strong>{t("Aulas em inglês com Sparky")}</strong><p>{t("Escute uma aula curta, acompanhe o visual e pratique uma ideia por vez.")}</p><button className="secondary-button" onClick={()=>navigate("classroom")}>{t("Entrar na sala de aula")}<ArrowRight size={16}/></button></section>}
        {view === "review" && (
          <>
            <div className="page-heading">
              <div>
                <p className="eyebrow">{t("Vocabulário e expressões")}</p>
                <h1>{t("Revisão")}</h1>
              </div>
              <span className="language-chip">{t(dueLabel)}</span>
            </div>
            {studied.length === 0 ? (
              <section className="empty-state">
                <RotateCcw size={32} />
                <h2>{t("Sua revisão começa depois da primeira lição")}</h2>
                <p>{t("As expressões que você estudar aparecerão aqui para praticar novamente.")}</p>
                <button className="primary-button" onClick={() => open(next)}>{t("Começar uma lição ")}<ArrowRight size={16} />
                </button>
              </section>
            ) : (
              <>
                <section className="review-guidance" aria-label={localizeAttribute("Como usar a revisão")}>
                  <strong>{t(due ? `${due} ${due === 1 ? "revisão vence" : "revisões vencem"} hoje.` : "Nenhuma revisão vence hoje.")}</strong>
                  <p>{t("Leia o enunciado e tente responder. Se você consultar a explicação ou a tradução antes de verificar, a tentativa será marcada como “com ajuda”.")}</p>
                </section>
                {dueLessons.length > 0 ? (
                  <section className="review-section" aria-labelledby="due-review-heading">
                    <div className="review-section-heading">
                      <div>
                        <p className="eyebrow">{t("Prioridade de hoje")}</p>
                        <h2 id="due-review-heading">{t("Revisar agora")}</h2>
                      </div>
                      <span>{t(due)} {t(due === 1 ? "lição" : "lições")}</span>
                    </div>
                    <div className="review-list">
                      {dueLessons.map((lesson) => (
                        <ReviewCard key={lesson.id} lesson={lesson} reviewAt={progress.reviews[lesson.id]} due onOpen={() => open(lesson, true)} />
                      ))}
                    </div>
                  </section>
                ) : (
                  <section className="review-empty" aria-labelledby="available-review-heading">
                    <h2 id="available-review-heading">{t("Nenhuma revisão pendente agora")}</h2>
                    <p>{t("Continue com uma lição nova. As próximas revisões aparecerão aqui.")}</p>
                  </section>
                )}
                {earlyLessons.length > 0 && (
                  <section className="review-section" aria-labelledby="early-review-heading">
                    <div className="review-section-heading">
                      <div>
                        <p className="eyebrow">{t("Opcional")}</p>
                        <h2 id="early-review-heading">{t(due ? "Praticar antes da data" : "Revisões disponíveis")}</h2>
                      </div>
                      <span>{t(earlyLessons.length)} {t(earlyLessons.length === 1 ? "lição" : "lições")}</span>
                    </div>
                    <div className="review-list">
                      {earlyLessons.map((lesson) => (
                        <ReviewCard key={lesson.id} lesson={lesson} reviewAt={progress.reviews[lesson.id]} onOpen={() => open(lesson, true)} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </>
        )}
        {view === "classroom" && <EnglishClassroom level={progress.level} />}
        {view === "notebook" && <LearningNotebook userId={user.id} workspace={workspace} onOpen={open} themeId={reward.notebookTheme} />}
        {view === "exams" && <><button className="text-button" onClick={() => navigate("course")}>{t("← Voltar ao Curso")}</button><EltisSimulator userId={user.id} mascot={reward.mascot} level={progress.level} completed={progress.completed} onOpen={lesson=>open(lesson,false,"practice")} /></>}
        {view === "shop" && <>
          <div className="page-heading"><div><p className="eyebrow">{t("Suas conquistas")}</p><h1>{t("Loja")}</h1></div></div>
          {rewardAvailable ? <MascotStudio reward={reward} busy={rewardBusy} userId={user.id} onAction={handleWardrobe} onStudy={() => navigate(due ? "review" : "today")} /> : <p role="status">{t("Conecte-se novamente para carregar seu saldo e sua loja.")}</p>}
        </>}
        {view === "profile" && (
          <>
            <div className="page-heading">
              <div>
                <p className="eyebrow">{t("Sua conta")}</p>
                <h1>{t("Perfil e preferências")}</h1>
              </div>
            </div>
            <div className="profile-layout">
              <section className="profile-card">
                <div className="profile-person">
                  <span className="avatar large">
                    {t(user.name.charAt(0).toUpperCase())}
                  </span>
                  <div>
                    <h2>{learnerProfile?.name ?? user.name}</h2>
                    <p>{user.email}</p>
                    <span className="verified-label">
                      <Check size={13} />{t("Conta Google conectada")}</span>
                  </div>
                </div>
                <LearningLanguagePreferences userId={user.id} />
                <div className="profile-setting">
                  <span>{t("Idioma de estudo")}</span>
                  <strong>{t("Inglês")}</strong>
                </div>
                <div className="profile-setting">
                  <span>{t("Maior sequência")}</span>
                  <strong>{reward.streak?.longest ?? 0} {t((reward.streak?.longest ?? 0) === 1 ? "dia" : "dias")}</strong>
                </div>
                {onboardingEnabled && <><button className="secondary-button" onClick={() => void editNamePronunciation("placement-start")}>{t("Fazer nivelamento")}</button><button className="secondary-button" onClick={() => void editNamePronunciation("preferences-start")}>{t("Nível das lições recomendadas ·")}{t(learnerProfile?.level)}</button></>}
                <label className="profile-setting">{t("Recomendação de estudo")}<select value={workspace.recommendation} onChange={e=>updateWorkspace(user.id,current=>({...current,recommendation:e.target.value as "balanced"|"new"}))}><option value="balanced">{t("Intercalar lições e revisões")}</option><option value="new">{t("Priorizar lições novas")}</option></select></label>
                <label className="profile-setting">{t('Disciplina preferida')}<select aria-label={localizeAttribute("Disciplina preferida")} value={workspace.discipline} onChange={e=>updateWorkspace(user.id,current=>({...current,discipline:e.target.value as Discipline|'all'}))}><option value="all">{t('Equilibrar disciplinas')}</option>{Object.entries(disciplines).map(([id,label])=><option key={id} value={id}>{t(label)}</option>)}</select></label>
                <label className="profile-setting">{t("Tempo de estudo por dia")}<select value={workspace.minutes} onChange={e=>updateWorkspace(user.id,current=>({...current,minutes:Number(e.target.value)}))}>{[5,10,15,20].map(n=><option key={n} value={n}>{t(n)}{t(" min")}</option>)}</select></label>
                <ThemePreferenceControl userId={user.id} />
                {onboardingEnabled && learnerProfile?.onboardingCompleted && <button className="secondary-button" onClick={() => void editNamePronunciation()}>{t("Corrigir pronúncia do meu nome")}</button>}
                {onboardingEnabled && <button className="secondary-button" onClick={async () => {
                  if(!window.confirm('Apagar seu nome, idade, diagnóstico e áudio personalizado? Suas lições e compras serão preservadas.')) return;
                  const response=await fetch('/api/onboarding',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'refuse'})});
                  if(response.ok){setLearnerProfile(null);setNeedsOnboarding(true);}else setNotice('Não foi possível apagar. Tente novamente.');
                }}>{t("Apagar personalização")}</button>}
                {!onboardingEnabled && <label className="profile-setting" htmlFor="study-level">
                  <span>{t("Nível para recomendar lições")}</span>
                  <select
                    id="study-level"
                    value={progress.level}
                    onChange={(event) =>
                      save({ ...progress, level: event.target.value as Level })
                    }
                  >
                    {levels.map(level => <option key={level} value={level}>{t(level)} · {t(levelDescriptions[level])}</option>)}
                  </select>
                </label>}
                <button
                  className="secondary-button"
                  onClick={logout}
                  disabled={signingOut}
                >
                  <LogOut size={16} />
                  {t(signingOut ? "Saindo…" : "Sair da conta")}
                </button>
              </section>
              <aside className="profile-note">
                <Globe2 size={24} />
                <h2>{supportT("Sobre seu progresso")}</h2>
                <p lang={getSupportLocale()}><strong>{supportT(reward.storage === "account" ? "Conclusões e recompensas sincronizadas na conta." : "Progresso salvo neste navegador.")}</strong></p>
                <p lang={getSupportLocale()}>
                  {supportT(reward.storage === "account"
                    ? "Suas lições concluídas, sequência, revisões, moedas e compras são salvas na sua conta. Entre com o mesmo Google em outro aparelho para continuar."
                    : "Suas conclusões, sequência, revisões, moedas e compras estão salvas neste navegador. A sincronização com outros aparelhos está indisponível no momento.")}
                </p>
                <p lang={getSupportLocale()}>{supportT("Rascunhos e histórico de tentativas ficam neste dispositivo, separados por conta. Você pode exportá-los pelo Caderno. A aparência é sincronizada quando há conexão.")}</p>
                <p lang={getSupportLocale()}>
                  {supportT(voiceEnabled
                    ? "A prática de voz é opcional. O microfone só é solicitado ao iniciar a escuta. O navegador pode processar áudio em um serviço externo; o Sparky não armazena gravações."
                    : "Os recursos de voz estão desativados nesta versão.")}
                </p>
                <a href="/privacidade">{supportT("Como seus dados são usados ")}<ArrowRight size={14} />
                </a>
              </aside>
            </div>
            <button className="secondary-button" onClick={() => navigate("shop")}><ShoppingBag size={18} />{t(" Escolher mascote e abrir a loja")}</button>
            <InstallAppPrompt dismissible={false} />
          </>
        )}
      </main>
      {view !== "call" && <nav className="mobile-nav" aria-label={localizeAttribute("Navegação no celular")}>
        {navigation.filter(item => item.id !== "profile" && item.id !== "exams").map((item) => (
          <button
            key={item.id}
            aria-current={view === item.id || (view === "exams" && item.id === "course") ? "page" : undefined}
            className={view === item.id || (view === "exams" && item.id === "course") ? "active" : ""}
            onClick={() => navigate(item.id)}
          >
            <item.icon size={20} />
            <span>{t(item.label)}</span>
          </button>
        ))}
      </nav>}
      {active && (
        <LessonPlayer
          key={`${active.lesson.id}-${active.review}`}
          userId={user.id}
          lesson={active.lesson}
          review={active.review}
          mascot={reward.mascot}
          equipped={reward.equipped}
          saving={rewardBusy}
          learnerProfile={learnerProfile}
          openerRef={lessonOpener}
          studyMode={studyMode}
          nextLesson={nextInTrail(progress.level,{...progress.completed,[active.lesson.id]:'completed'})}
          onClose={() => setActive(null)}
          onFinish={finish}
        />
      )}
    </div>
  );
}

function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <Image src="/icons/sparky-192-v2.png" alt={localizeAttribute("")} width={44} height={44} />
      </span>
      <span>{t("Sparky")}<span className="brand-english">{t("English")}</span>
      </span>
    </div>
  );
}

function LoginScreen() {
  return (
    <main className="login-page">
      <div className="login-shell">
        <header>
          <Brand />
          <span className="private-label">
            <LockKeyhole size={14} />{t("Acesso por convite")}</span>
        </header>
        <div className="login-layout">
          <section className="login-intro">
            <span className="language-chip">{t("PT-BR ")}<ArrowRight size={14} />{t(" EN")}</span>
            <h1>{t("Inglês para quem")}<br />{t("fala português.")}</h1>
            <p className="login-description">{t("Entenda a estrutura das frases, pratique conversas e revise o que aprendeu.")}</p>
            <div className="sample-scene">
              <div className="sample-note">
                <span>{t("NA PRIMEIRA LIÇÃO")}</span>
                <p lang="en">{t("Hi, I’m Ana.")}</p>
                <p>{t("Oi, eu sou Ana.")}</p>
                <div>
                  <span lang="en">{t("I’m")}</span>
                  <ArrowRight size={13} />
                  <span lang="en">{t("I am")}</span>
                  <span>{t("eu sou")}</span>
                </div>
              </div>
              <Image
                src="/visuals/sparky-panda.png"
                alt={localizeAttribute("Sparky, seu guia nas lições")}
                width={280}
                height={280}
                priority
              />
            </div>
            <div className="login-levels">
              <span><strong>{t("A1–A2")}</strong>{t(" Primeiras conversas")}</span>
              <span><strong>{t("B1–B2")}</strong>{t(" Comunicação independente")}</span>
              <span><strong>{t("C1–C2")}</strong>{t(" Precisão e nuance")}</span>
            </div>
          </section>
          <section className="login-island" aria-labelledby="login-heading">
            <span className="login-icon">
              <GraduationCap size={26} />
            </span>
            <h2 id="login-heading">{t("Entre para estudar")}</h2>
            <p>{t("Use a conta Google do e-mail que recebeu acesso ao Sparky.")}</p>
            <GoogleLogin />
            <div className="login-separator" />
            <div className="login-detail">
              <Languages size={18} />
              <p>{t("Orientações e comentários em português, exemplos e exercícios em inglês.")}</p>
            </div>
            <div className="login-detail">
              <LockKeyhole size={18} />
              <p>{t("Somente contas autorizadas podem entrar.")}</p>
            </div>
            <a href="/privacidade" className="privacy-link">{t("Como seus dados são usados")}</a>
          </section>
        </div>
        <footer>
          <span>{t("Sparky English")}</span>
          <span>{t("Português (Brasil)")}</span>
        </footer>
      </div>
    </main>
  );
}

function ReviewCard({
  lesson,
  reviewAt,
  due = false,
  onOpen,
}: {
  lesson: Lesson;
  reviewAt?: string;
  due?: boolean;
  onOpen: () => void;
}) {
  const reviewDate = Date.parse(reviewAt || "");
  const schedule = Number.isFinite(reviewDate)
    ? new Intl.DateTimeFormat(getInterfaceLocale(), {
        day: "numeric",
        month: "short",
      }).format(new Date(reviewDate))
    : "Disponível agora";
  return (
    <section className="review-card" data-priority={due ? "due" : "early"}>
      <div>
        <span className="eyebrow">
          {t(lesson.level)} · {t(lesson.title)}
        </span>
        <p>{t("Pratique a recuperação antes de consultar o modelo.")}</p>
        <span>{t(due ? "Venceu: " : "Próxima revisão: ")}{t(schedule)}</span>
      </div>
      <button
        className="secondary-button"
        onClick={onOpen}
        aria-label={localizeAttribute(`Praticar revisão de ${lesson.title}`)}
      >{t("Praticar ")}<ArrowRight size={16} />
      </button>
    </section>
  );
}

function LessonCard({
  lesson,
  number,
  done,
  onOpen,
}: {
  lesson: Lesson;
  number: number;
  done: boolean;
  onOpen: () => void;
}) {
  return (
    <button className={`lesson-card ${done ? "done" : ""}`} onClick={onOpen}>
      <span className="card-number">
        {done ? <Check size={19} /> : String(number).padStart(2, "0")}
      </span>
      <span className="card-copy">
        <span className="card-meta">
          {t(lesson.level)} <span>·</span> {t(lesson.minutes)}{t(" min")}{t(" ")}
          {t(done && "· Concluída")}
        </span>
        <strong>{t(lesson.title)}</strong>
        <span lang="en">{targetText(lesson.englishTitle)}</span>
      </span>
      <ChevronRight size={18} />
    </button>
  );
}
