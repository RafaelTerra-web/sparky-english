"use client";
import { savePersonalRecord, type PracticeResult } from "@/lib/quick-practice";
import { getInterfaceLocale, getSupportLocale, t, supportT, localizeAttribute } from "@/lib/interface-language";
import { useInterfaceLanguage } from "@/lib/interface-language";
import { LearningLanguagePreferences } from "./learning-language-preferences";
import { nextInTrail, lessonMetadata } from "@/lib/course-guide";
import { interfaceSoundEnabled, playInterfaceSound, setInterfaceSoundEnabled, subscribeInterfaceSound } from "@/lib/interface-sound";
import { disciplines, type Discipline } from "@/lib/course-metadata";
import { planReviews, studyDay } from "@/lib/review-plan";
import { updateWorkspace } from "@/lib/learning-local";
import { personalizeLesson } from "@/lib/personalized-lesson";

import Image from "next/image";
import { CoinIcon } from "./coin-icon";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  ArrowRight,
  Check,
  Clock3,
  Compass,
  Globe2,
  GraduationCap,
  Languages,
  LockKeyhole,
  LogOut,
  RotateCcw,
  Settings,
  X,
} from "lucide-react";
import type { SparkyUser } from "@/lib/auth-session";
import { ThemePreferenceControl, AppearanceSync, resetAppearanceSession } from "./theme-preference";
import { MotionTransition, StreakBadge, StreakCelebration } from "./motion-pack";
import SparkyLoadingMark from "./sparky-loading-mark";
import { rememberOpeningMascot, resetOpeningMascot } from "@/lib/opening-mascot";
import { LevelUpCelebration } from "./level-up-celebration";
import { levels, levelDescriptions } from "@/lib/levels";
import {
  lessons,
  type Lesson,
  type Level,
} from "@/lib/curriculum";
import { GoogleLogin } from "./google-login";
import { InstallAppPrompt } from "./install-app-prompt";

import dynamic from "next/dynamic";
import { SectionLoading } from "./section-loading";
import { readWorkspace, blankWorkspace } from "@/lib/learning-local";
import LessonPlayer from "./lesson-player";
import PushNotifications, { disablePushForCurrentDevice } from "./push-notifications";
import { useNotificationCenter, NotificationBell, NotificationPanel, NotificationSettings, NotificationDestinationPrompt } from './notification-center';
import type { NotificationDestination } from '@/lib/notifications-shared';
import MascotMoment from "./mascot-moment";
import { LessonCompletionCelebration, type CompletionMoment } from "./lesson-completion-celebration";
import NativeRefresh from "./native-refresh";

import { TodayIcon, CourseIcon, ReviewIcon, MusicIcon, ProfileIcon } from "./original-nav-icons";
const CourseCatalog = dynamic(() => import("./course-catalog").then(m => m.CourseCatalog), { loading: () => <SectionLoading /> });
const MusicLibrary = dynamic(() => import("./music-library"), { loading: () => <SectionLoading /> });
const ExpeditionShop = dynamic(() => import("./expedition-shop").then(m => m.ExpeditionShop), { loading: () => <SectionLoading label="Preparando descobertas…" /> });
const StoryExperience = dynamic(() => import("./story-experience"), { loading: () => <SectionLoading /> });
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

const callEnabled = process.env.NEXT_PUBLIC_SPARKY_CALL_ENABLED === "true";

const EnglishClassroom = dynamic(() => import("./english-classroom"), { loading: () => <SectionLoading /> });
type View = "practice" | "call" | "classroom" | "today" | "story" | "course" | "review" | "exams" | "profile" | "music" | "shop";
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
  mascot: "sparky",
  equipped: { sparky: {}, pinky: {} },
  streak: { count: 0, longest: 0, lastDay: null },
};
const navigation = [
  { id: "today" as View, label: "Hoje", icon: TodayIcon },
  { id: "course" as View, label: "Trilha", icon: CourseIcon },
  { id: "practice" as View, label: "Praticar", icon: ReviewIcon },
  { id: "profile" as View, label: "Perfil", icon: ProfileIcon },
];

type AppHistoryEntry = { view: View; depth: number; session: string; lessonId?: string; review?: boolean; mode?: "guided" | "practice" };
const historyKey = "sparkyNavigationV1";
const historySession = Math.random().toString(36).slice(2);
const appViews: View[] = ["today", "course", "practice", "profile", "review", "call", "classroom", "story", "music", "exams", "shop"];

function readAppHistory(): AppHistoryEntry | null {
  const entry = window.history.state?.[historyKey];
  if (!entry || entry.session !== historySession || !appViews.includes(entry.view) || !Number.isSafeInteger(entry.depth) || entry.depth < 0) return null;
  return entry as AppHistoryEntry;
}

function writeAppHistory(entry: Omit<AppHistoryEntry, "session">, replace = false) {
  const state = window.history.state;
  const next = { ...(state && typeof state === "object" ? state : {}), [historyKey]: { ...entry, session: historySession } };
  window.history[replace ? "replaceState" : "pushState"](next, "", window.location.href);
}

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
      if (key.startsWith("sparky-") && key !== "sparky-opening-seen-v4" && !key.startsWith("sparky-learning:") && !key.startsWith("sparky-progress:") && !key.startsWith("sparky-record:")) storage.removeItem(key);
  }
}

export default function SparkyApp({ onReady }: { onReady?: () => void }) {
  const [onboardingEnabled, setOnboardingEnabled] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile|null>(null);
  const [user, setUser] = useState<SparkyUser | null>(null);
  const interfaceLanguage = useInterfaceLanguage(user?.id);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [view, setView] = useState<View>('today');
  useEffect(() => {
    if (["call", "music", "exams", "classroom", "story"].includes(view)) document.documentElement.dataset.sparkyActivity = view;
    else delete document.documentElement.dataset.sparkyActivity;
    return () => { delete document.documentElement.dataset.sparkyActivity; };
  }, [view]);
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
  const completionInFlight = useRef(false);
  const [completionMoment, setCompletionMoment] = useState<CompletionMoment | null>(null);
  const interfaceSounds = useSyncExternalStore(subscribeInterfaceSound, interfaceSoundEnabled, () => true);
  const [rewardAvailable, setRewardAvailable] = useState(true);
  const [workspace, setWorkspace] = useState(blankWorkspace);
  const [notificationDestination, setNotificationDestination] = useState<NotificationDestination | null>(null);
  const notifications = useNotificationCenter(user?.id, !loading && !needsOnboarding, interfaceLanguage === 'en' ? 'en' : 'pt', setNotificationDestination);
  const historyReady = useRef(false);
  useEffect(() => {
    if (loading || !user || needsOnboarding) { historyReady.current = false; return; }
    const restore = (entry: AppHistoryEntry) => {
      setNotice("");
      setCompletionMoment(null);
      setNotificationDestination(null);
      setView(entry.view);
      const lesson = entry.lessonId && lessons.find(item => item.id === entry.lessonId);
      setActive(lesson ? { lesson: personalizeLesson(lesson, learnerProfile?.name), review: Boolean(entry.review) } : null);
      if (entry.mode) setStudyMode(entry.mode);
    };
    if (!historyReady.current) {
      historyReady.current = true;
      const depth = readAppHistory()?.depth ?? 0;
      // A fresh load starts at Hoje; saved lesson checkpoints remain available there.
      writeAppHistory({ view: "today", depth }, true);
      if (view !== "today") writeAppHistory({ view, depth: depth + 1 });
    }
    const onPopState = () => {
      const entry = readAppHistory();
      if (entry) restore(entry);
      else if (window.history.state?.[historyKey]) {
        writeAppHistory({ view: "today", depth: 0 }, true);
        restore({ view: "today", depth: 0, session: historySession });
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [loading, user, needsOnboarding, learnerProfile?.name, view]);
  function navigate(nextView: View) {
    setNotice("");
    setCompletionMoment(null);
    const current = readAppHistory();
    if (nextView === "today" && current && current.depth > 0) {
      window.history.go(-current.depth);
      return;
    }
    if (nextView === view) return;
    if (historyReady.current) writeAppHistory({ view: nextView, depth: (current?.depth ?? 0) + 1 });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setView(nextView);
      return;
    }
    setTransitioning(true);
    setView(nextView);
    if (transitionTimer.current) window.clearTimeout(transitionTimer.current);
    transitionTimer.current = window.setTimeout(() => setTransitioning(false), 180);
  }
  function goBack(fallback: View) {
    if ((readAppHistory()?.depth ?? 0) > 0) window.history.back();
    else navigate(fallback);
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
          try { if (localStorage.getItem(`sparky-music:active:${session.user.id}`)) setView('music'); } catch { /* Restore is optional. */ }
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
            rememberOpeningMascot(rewards.mascot);
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
          resetOpeningMascot();
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setConnectionError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          onReady?.();
        }
      });
    if ("serviceWorker" in navigator)
      void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => undefined);
    return () => controller.abort();
  }, [onReady]);

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

  async function refreshAppData() {
    setToday(new Date());
    try {
      const response = await fetch('/api/rewards', { cache: 'no-store' });
      if (response.ok) {
        const fresh = await response.json() as PublicRewardState;
        setReward(fresh);
        rememberOpeningMascot(fresh.mascot);
        setProgress(current => ({ ...current, completed: fresh.completed, reviews: fresh.reviews }));
      }
    } finally { window.dispatchEvent(new Event('sparky:refresh')); }
  }

  async function logout() {
    setSigningOut(true);
    setNotice("");
    try {
      await disablePushForCurrentDevice().catch(() => undefined);
      const response = await fetch("/api/session", { method: "DELETE" });
      if (!response.ok) throw new Error("logout");
      try {
        clearPrivateStorage();
      } catch {
        /* Private data is also removed from memory below. */
      }
      resetOpeningMascot();
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
      setCompletionMoment(null);
      setView("today");
    } catch {
      setNotice(
        "Não foi possível encerrar a sessão. Verifique a conexão e tente novamente.",
      );
    } finally {
      setSigningOut(false);
    }
  }

  async function rewardRequest(action: RewardAction | { action: "complete"; lessonId: string; review: boolean; receipt: string; activeMs?: number }) {
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
      if (data.mascot === "sparky" || data.mascot === "pinky") rememberOpeningMascot(data.mascot);
      save({
        level: progress.level,
        completed: data.completed,
        reviews: data.reviews,
      });
      setRewardAvailable(true);
      return data as PublicRewardState & { earned?: number; spent?: number; reason?: string; independent?: boolean };
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
          : `${action.mascot === "pinky" ? "Pinky" : "Sparky"} agora acompanha suas lições.`,
    );
    return true;
  }

  async function finish(receipt: string, practice?: PracticeResult): Promise<boolean> {
    if (!active || rewardBusy || completionInFlight.current) return false;
    completionInFlight.current = true;
    const now = new Date();
    setToday(now);
    try {
      const result = await rewardRequest({
        action: "complete",
        lessonId: active.lesson.id,
        review: active.review,
        receipt,
        activeMs: practice?.activeMs ?? 0,
      });
      if (result) {
        updateWorkspace(user!.id, current => ({...current, studyDay: studyDay(now), newLessonsToday: (current.studyDay === studyDay(now) ? current.newLessonsToday : 0) + (!active.review && !progress.completed[active.lesson.id] ? 1 : 0), dailyActiveMs: (current.studyDay === studyDay(now) ? current.dailyActiveMs : 0) + (practice && !current.goalSessions.includes(practice.sessionId) ? practice.activeMs : 0), goalSessions: practice ? [...current.goalSessions.filter(id => id !== practice.sessionId), practice.sessionId].slice(-100) : current.goalSessions }));
        const record = practice?.recordEligible ? savePersonalRecord(user!.id, active.lesson.id, { score: practice.score, activeMs: practice.activeMs, completedAt: now.toISOString() }) : null;
        setCompletionMoment({
          lessonId: active.lesson.id,
          score: practice?.mode === "challenge" ? practice.score : undefined,
          activeMs: practice?.activeMs, newRecord: record?.best,
          mascot: result.mascot,
          review: active.review,
          earned: result.earned ?? 0,
          independent: result.independent === true,
          outcome: lessonMetadata[active.lesson.id]?.outcome ?? active.lesson.experience.application,
          nextReview: result.reviews?.[active.lesson.id],
          nextTitle: nextInTrail(progress.level, result.completed)?.title ?? "Revisar o que aprendi",
        });
        setNotice("");
        playInterfaceSound("complete");
        const current = readAppHistory();
        if (historyReady.current && current?.lessonId) writeAppHistory({ view: "today", depth: current.depth }, true);
        setView("today");
        setActive(null);
        void notifications.refresh().catch(() => {});
        return true;
      }
      return false;
    } finally {
      completionInFlight.current = false;
    }
  }

  if (loading)
    return (
      <main className="loading-page loading-page--brand" role="status" aria-label="Carregando o Sparky English">
        <SparkyLoadingMark />
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
    setReward(current => ({...current,mascot:profile.mascot}));rememberOpeningMascot(profile.mascot);setNeedsOnboarding(false);
  }} />;

  const completed = Object.keys(progress.completed).length;
  const trailNext = nextInTrail(progress.level, progress.completed);
  const next = trailNext || lessons.find(l=>l.level===progress.level)!;

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
  const dailyGoalMs = Math.min(workspace.minutes * 60000, notifications.dailyActiveMs ?? (workspace.studyDay === studyDay(today) ? workspace.dailyActiveMs : 0));
  const dailyGoalMinutes = Math.floor(dailyGoalMs / 60000);
  const menuView: View = ["review", "call", "classroom", "story", "music", "exams"].includes(view) ? "practice" : view === "shop" ? "profile" : view;
  const open = (lesson: Lesson, review = false, mode: "guided"|"practice" = "guided") => {
    setStudyMode(mode);
    setNotice("");
    if (review && (dailyDone >= 3 || !dueLessons.some(item => item.id === lesson.id))) { setNotice("Você já concluiu as três revisões de hoje. Continue com uma lição nova."); return; }
    setCompletionMoment(null);
    playInterfaceSound("start");
    const current = readAppHistory();
    if (historyReady.current) writeAppHistory({ view, depth: (current?.depth ?? 0) + 1, lessonId: lesson.id, review, mode });
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
      <AppearanceSync userId={user.id}/>
      <NativeRefresh onRefresh={refreshAppData} />
      <NotificationPanel center={notifications} locale={interfaceLanguage === 'en' ? 'en' : 'pt'}/>
      {notificationDestination && !active && !completionMoment && <NotificationDestinationPrompt
        restart={notificationDestination.view === 'lesson' && !Object.values(workspace.checkpoints).some(p => p.lessonId === notificationDestination.lessonId && !p.review && p.receipt && today.getTime() - (p.startedAt ?? 0) < 8 * 3600000 && today.getTime() - Date.parse(p.updatedAt) < 7 * 3600000)}
        onClose={() => setNotificationDestination(null)} onOpen={() => {
          const destination = notificationDestination;
          setNotificationDestination(null);
          if (destination.view === 'lesson') {
            const lesson = lessons.find(item => item.id === destination.lessonId);
            if (lesson) open(lesson); else navigate('today');
          } else navigate(destination.view);
        }}/>}
      {completionMoment && <LessonCompletionCelebration moment={completionMoment} userId={user.id} textOnly={learnerProfile?.namePronunciationStatus === "text-only"} onClose={() => setCompletionMoment(null)} onNext={() => { setCompletionMoment(null); const following = nextInTrail(progress.level, progress.completed); if (following) open(following); else navigate("course"); }} />}
      {streakCelebration && view === 'today' && <StreakCelebration {...streakCelebration} onClose={() => setStreakCelebration(null)} />}
      <LevelUpCelebration userId={user.id} currentLevel={progress.level} completed={progress.completed} learnerName={learnerProfile?.name} mascot={reward.mascot} />
      <aside className="sidebar">
        <Brand />
        <nav aria-label={localizeAttribute("Navegação principal")}>
          {navigation.map((item) => (
            <button
              key={item.id}
              className={menuView === item.id ? "nav-item active" : "nav-item"}
              aria-current={menuView === item.id ? "page" : undefined}
              onClick={() => {
                navigate(item.id);
              }}
            >
              <item.icon size={19} />
              {t(item.label)}
              {item.id === "practice" && due > 0 && (
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
            <Brand showMascot={false} />
          </div>
          <p className="date-label">
            {t(new Intl.DateTimeFormat(getInterfaceLocale(), {
              weekday: "long",
              day: "numeric",
              month: "long",
            }).format(new Date()))}
          </p>
          <button className="account-chip wallet-chip" onClick={() => navigate("shop")} aria-label={localizeAttribute("Abrir loja e saldo de moedas") + ": " + new Intl.NumberFormat(getInterfaceLocale()).format(reward.coins)}>
            <CoinIcon size={24}/><strong>{new Intl.NumberFormat(getInterfaceLocale(), reward.coins >= 10000 ? { notation:"compact", maximumFractionDigits:1 } : {}).format(reward.coins)}</strong>
          </button>
          <NotificationBell center={notifications}/>
          <button type="button" className="account-chip profile-gear" onClick={() => navigate("profile")} aria-label={localizeAttribute("Abrir configurações")}><Settings size={21} aria-hidden="true"/></button>
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
        {notifications.clickError && <p className="notice" role="status">{t(notifications.clickError)}<button onClick={notifications.dismissClickError} aria-label={localizeAttribute('Dispensar mensagem')}><X size={16}/></button></p>}
        {view === 'today' && !active && !notificationDestination && <PushNotifications userId={user.id} mascot={reward.mascot} onEnabled={() => void notifications.refresh().catch(() => {})} />}
        {view === "today" && <div className="today-overview quick-today">
          <div className="page-heading"><div><p className="eyebrow">{t("Olá,")} {learnerProfile?.name ?? user.name}</p><h1>{t("Vamos praticar?")}</h1></div></div>
          {workspace.restartNotice && <p className="notice" role="status">{t("As lições ganharam seis questões rápidas. A prática pendente vai recomeçar; seus rascunhos foram preservados.")}</p>}
          <section className="next-lesson">
            <div className="lesson-card-topline">
              <span className="lesson-label">{t(resume ? "RETOMAR PRÁTICA" : recommendedReview ? "REVISÃO PARA HOJE" : "PRÓXIMA LIÇÃO")} <span>{recommended.level}</span></span>
              <StreakBadge count={reward.streak?.count ?? 0} longest={reward.streak?.longest ?? 0}/>
            </div>
            <div className="lesson-copy">
              <h2>{t(recommended.title)}</h2>
              <p className="lesson-quick-meta"><span>{recommendedReview ? 3 : 6} {t("questões")}</span><span><Clock3 size={14} aria-hidden="true"/>{t(recommendedReview ? "1–2 min" : "2–4 min")}</span></p>
              <button className="cream-button lesson-start-button" onClick={() => open(recommended, recommendedReview)}>{t(resume ? "Continuar de onde parei" : recommendedReview ? "Revisar agora" : "Começar lição")}<ArrowRight size={18} /></button>
              <div className="lesson-daily-goal">
                <span>{t("Meta diária:")}</span><span>{dailyGoalMinutes}/{workspace.minutes} {t("min")}</span>
                <progress max={workspace.minutes * 60000} value={dailyGoalMs} aria-label={localizeAttribute("Progresso da meta diária")} aria-valuetext={`${dailyGoalMinutes} ${localizeAttribute("de")} ${workspace.minutes} ${localizeAttribute("min")}`} />
              </div>
            </div>
            <MascotFigure mascot={reward.mascot} equipped={reward.equipped} size="hero" />
          </section>
          <div className="quick-home-links">
            <button className="secondary-button" onClick={() => { setCourseMode("guided"); navigate("course"); }}>{t("Ver minha trilha")} <span>{completed}/{lessons.length}</span><ArrowRight size={16} /></button>
            <button className="secondary-button" onClick={() => navigate("practice")}>{t("Explorar práticas")}<span>{due > 0 ? due + " " + t("revisões") : ""}</span><ArrowRight size={16} /></button>
          </div>
          <InstallAppPrompt />
        </div>}
        {view === "practice" && <section className="quick-practice-hub">
          <div className="page-heading"><div><p className="eyebrow">{t("Escolha uma prática")}</p><h1>{t("Praticar")}</h1></div></div>
          <div className="quick-practice-grid">
            <button className="quick-practice-card" onClick={() => navigate("review")}><RotateCcw size={26} /><strong>{t("Revisão diária")}</strong><span>{t("3 questões · 1–2 min")} · {due} {t("para hoje")}</span></button>
            {callEnabled && <button className="quick-practice-card" onClick={() => navigate("call")}><Languages size={26} /><strong>{t("Conversação")}</strong><span>{t("Uma situação real · 10 min")}</span></button>}
            <button className="quick-practice-card" onClick={() => navigate("classroom")}><GraduationCap size={26} /><strong>{t("Aulas em inglês")}</strong><span>{t("Ouça e pratique uma ideia.")}</span></button>
            <button className="quick-practice-card" onClick={() => navigate("story")}><Globe2 size={26} /><strong>{t("Histórias")}</strong><span>{t("Inglês em pequenas histórias.")}</span></button>
            <button className="quick-practice-card" onClick={() => navigate("shop")}><Compass size={26} /><strong>{t("Expedições")}</strong><span>{t("Use moedas para abrir descobertas.")}</span></button>
            <button className="quick-practice-card" onClick={() => navigate("music")}><MusicIcon size={26} /><strong>{t("Músicas")}</strong><span>{t("Escute, descubra e cante.")}</span></button>
            <button className="quick-practice-card" onClick={() => navigate("exams")}><GraduationCap size={26} /><strong>{t("Simulados")}</strong><span>{t("Prepare-se para o ELTiS.")}</span></button>
            <button className="quick-practice-card" onClick={() => { setCourseMode("practice"); navigate("course"); }}><CourseIcon size={26} /><strong>{t("Por assunto")}</strong><span>{t("Busque uma habilidade na trilha.")}</span></button>
          </div>
          <p className="quick-challenge-note">{t("Quer um desafio? Escolha Desafio antes de começar uma lição.")}</p>
        </section>}
        {view === "course" && (
          <>
          <CourseCatalog
            level={progress.level}
            completed={progress.completed}
            competencies={reward.competencies ?? {}}
            workspace={workspace}
            dueIds={dueLessons.map(l=>l.id)}
            mode={courseMode}
            onMode={setCourseMode}
            onOpen={open}
            onExams={() => navigate("exams")}
          />
          </>
        )}
        {["review", "classroom", "music", "exams", "shop"].includes(view) && <button className="text-button" onClick={() => goBack(view === "shop" ? "profile" : "practice")}>{t("Voltar")}</button>}
        {view === "call" && <CallExperience learnerName={learnerProfile?.name ?? user.name} initialLevel={progress.level} mascot={reward.mascot} storageKey={user.id} onBack={() => goBack("practice")} />}
        {view === "story" && <StoryExperience userId={user.id} mascot={reward.mascot} onBack={() => goBack("practice")} />}
        {false && <section className="review-guidance"><strong>{t("Aulas em inglês com Sparky")}</strong><p>{t("Escute uma aula curta, acompanhe o visual e pratique uma ideia por vez.")}</p><button className="secondary-button" onClick={()=>navigate("classroom")}>{t("Entrar na sala de aula")}<ArrowRight size={16}/></button></section>}
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
                <MascotMoment mascot={reward.mascot} mood="invite" className="review-mascot" />
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
                    <MascotMoment mascot={reward.mascot} mood="celebrate" className="review-mascot" />
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
        {view === "music" && <MusicLibrary userId={user.id} level={progress.level} mascot={reward.mascot} />}
        {view === "exams" && <><EltisSimulator userId={user.id} mascot={reward.mascot} level={progress.level} completed={progress.completed} onOpen={lesson=>open(lesson,false,"practice")} /></>}
        {view === "shop" && <>
          <div className="page-heading"><div><p className="eyebrow">{t("Suas conquistas")}</p><h1>{t("Loja")}</h1></div></div>
          {rewardAvailable && <ExpeditionShop level={progress.level} hasNewLessons={completed < lessons.length} onBalanceChange={coins => setReward(current => ({ ...current, coins }))} />}
          {rewardAvailable ? <MascotStudio reward={reward} busy={rewardBusy} userId={user.id} onAction={handleWardrobe} onStudy={() => navigate(due ? "review" : "today")} /> : <p role="status">{t("Conecte-se novamente para carregar seu saldo e sua loja.")}</p>}
        </>}
        {view === "profile" && (
          <>
            <div className="page-heading"><div><p className="eyebrow">{t("Seu espaço")}</p><h1>{t("Configurações")}</h1></div></div>
            <section className="settings-account" aria-label={localizeAttribute("Sua conta")}>
              <div className="profile-person">
                <span className="avatar large">{user.name.charAt(0).toUpperCase()}</span>
                <div><h2>{learnerProfile?.name ?? user.name}</h2><p>{user.email}</p><span className="verified-label"><Check size={13}/>{t("Conta Google conectada")}</span></div>
              </div>
              <button className="secondary-button settings-shop" onClick={() => navigate("shop")}><CoinIcon size={28}/><span><strong>{new Intl.NumberFormat(getInterfaceLocale()).format(reward.coins)}</strong><small>{t("Loja e mascotes")}</small></span><ArrowRight size={18}/></button>
            </section>
            <div className="settings-grid">
              <section className="settings-card settings-appearance"><ThemePreferenceControl userId={user.id}/></section>
              <section className="settings-card" aria-labelledby="settings-learning-title">
                <header className="settings-card-heading"><Languages size={22}/><div><h2 id="settings-learning-title">{t("Aprendizado")}</h2><p>{t("Seu nível e o apoio que combina com você.")}</p></div></header>
                <LearningLanguagePreferences userId={user.id}/>
                {onboardingEnabled ? <div className="settings-button-group">
                  <button className="secondary-button" onClick={() => void editNamePronunciation("preferences-start")}><GraduationCap size={18}/>{t("Nível recomendado")} · {learnerProfile?.level}</button>
                  <button className="text-button" onClick={() => void editNamePronunciation("placement-start")}>{t("Fazer nivelamento")}<ArrowRight size={16}/></button>
                </div> : <label className="settings-field" htmlFor="study-level"><span>{t("Nível para recomendar lições")}</span><select id="study-level" value={progress.level} onChange={event => save({ ...progress, level: event.target.value as Level })}>{levels.map(level => <option key={level} value={level}>{level} · {t(levelDescriptions[level])}</option>)}</select></label>}
              </section>
              <section className="settings-card" aria-labelledby="settings-routine-title">
                <header className="settings-card-heading"><Clock3 size={22}/><div><h2 id="settings-routine-title">{t("Rotina de estudo")}</h2><p>{t("Uma meta leve para voltar todos os dias.")}</p></div></header>
                <fieldset className="settings-goal"><legend>{t("Meta diária")}</legend><div>{[5,10,15,20].map(minutes => <button key={minutes} type="button" aria-pressed={workspace.minutes === minutes} disabled={notifications.saving} onClick={() => {
                  if (notifications.enabled) void notifications.changePreferences({ goalMinutes: minutes });
                  else updateWorkspace(user.id, current => ({ ...current, minutes }));
                }}><strong>{minutes}</strong><span>{t("min")}</span></button>)}</div></fieldset>
                {notifications.settingsError && <p role="alert">{t('Não foi possível salvar. Tente novamente.')}</p>}
                <label className="settings-field"><span>{t("Recomendação de estudo")}</span><select value={workspace.recommendation} onChange={event => updateWorkspace(user.id, current => ({ ...current, recommendation: event.target.value as "balanced"|"new" }))}><option value="balanced">{t("Intercalar lições e revisões")}</option><option value="new">{t("Priorizar lições novas")}</option></select></label>
                <label className="settings-field"><span>{t("Disciplina preferida")}</span><select value={workspace.discipline} onChange={event => updateWorkspace(user.id,current => ({ ...current, discipline:event.target.value as Discipline|"all" }))}><option value="all">{t("Equilibrar disciplinas")}</option>{Object.entries(disciplines).map(([id,label]) => <option key={id} value={id}>{t(label)}</option>)}</select></label>
              </section>
              <NotificationSettings center={notifications}/>
              <section className="settings-card" aria-labelledby="settings-sound-title">
                <header className="settings-card-heading"><Settings size={22}/><div><h2 id="settings-sound-title">{t("Som e personalização")}</h2><p>{t("Pequenos detalhes do seu Sparky.")}</p></div></header>
                <label className="settings-switch"><span><strong>{t("Sons de interface")}</strong><small>{t("Toques suaves ao começar e concluir lições")}</small></span><input type="checkbox" role="switch" checked={interfaceSounds} onChange={event => setInterfaceSoundEnabled(event.target.checked)}/><span className="settings-switch-track" aria-hidden="true"/></label>
                {onboardingEnabled && learnerProfile?.onboardingCompleted && <button className="secondary-button" onClick={() => void editNamePronunciation()}>{t("Corrigir pronúncia do meu nome")}<ArrowRight size={16}/></button>}
                <p className="settings-caption">{t("As animações respeitam a preferência de movimento do aparelho.")}</p>
              </section>
              <section className="settings-card" aria-labelledby="settings-progress-title">
                <header className="settings-card-heading"><Globe2 size={22}/><div><h2 id="settings-progress-title">{t("Progresso e conta")}</h2><p>{t("Suas conquistas continuam com você.")}</p></div></header>
                <div className="settings-status"><Check size={18}/><p lang={getSupportLocale()}>{supportT(reward.storage === "account" ? "Conclusões e recompensas sincronizadas na conta." : "Progresso salvo neste navegador.")}</p></div>
                <div className="settings-record"><span>{t("Maior sequência")}</span><strong>{reward.streak?.longest ?? 0} {t((reward.streak?.longest ?? 0) === 1 ? "dia" : "dias")}</strong></div>
                <details className="settings-privacy"><summary>{t("Dados e privacidade")}</summary>
                  <p lang={getSupportLocale()}>{supportT("Rascunhos e histórico de tentativas ficam neste dispositivo, separados por conta. A aparência é sincronizada quando há conexão.")}</p>
                  <a href="/privacidade">{t("Como seus dados são usados")}<ArrowRight size={16}/></a>
                  {onboardingEnabled && <button className="text-button settings-danger" onClick={async () => {
                    if(!window.confirm(t("Apagar seu nome, idade, diagnóstico e áudio personalizado? Suas lições e compras serão preservadas."))) return;
                    const response=await fetch("/api/onboarding",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"refuse"})});
                    if(response.ok){setLearnerProfile(null);setNeedsOnboarding(true);}else setNotice("Não foi possível apagar. Tente novamente.");
                  }}>{t("Apagar personalização")}</button>}
                </details>
                <button className="text-button" onClick={logout} disabled={signingOut}><LogOut size={17}/>{t(signingOut ? "Saindo…" : "Sair da conta")}</button>
              </section>
            </div>
            <InstallAppPrompt dismissible={false}/>
          </>
        )}
      </main>
      {view !== "call" && <nav className="mobile-nav" aria-label={localizeAttribute("Navegação no celular")}>
        {navigation.map((item) => (
          <button
            key={item.id}
            aria-current={menuView === item.id ? "page" : undefined}
            className={menuView === item.id ? "active" : ""}
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
          notificationPending={Boolean(notificationDestination)}
          openerRef={lessonOpener}
          studyMode={studyMode}
          nextLesson={nextInTrail(progress.level,{...progress.completed,[active.lesson.id]:'completed'})}
          onClose={() => { if (readAppHistory()?.lessonId) goBack(view); else setActive(null); }}
          onFinish={finish}
        />
      )}
    </div>
  );
}

function Brand({ showMascot = true }: { showMascot?: boolean }) {
  return (
    <div className="brand">
      {showMascot && <span className="brand-mark"><Image src="/icons/sparky-192-v2.png" alt={localizeAttribute("")} width={44} height={44} /></span>}
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
              <MascotMoment mascot="sparky" mood="invite" alt={localizeAttribute("Sparky, seu guia nas lições")} loading="eager" />
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
