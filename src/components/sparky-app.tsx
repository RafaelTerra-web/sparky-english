"use client";
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
import { readWorkspace, blankWorkspace } from "@/lib/learning-local";
const LessonPlayer = dynamic(() => import("./lesson-player"), { loading: () => <p role="status">Abrindo a lição…</p> });
const CourseCatalog = dynamic(() => import("./course-catalog").then(m => m.CourseCatalog));
const LearningNotebook = dynamic(() => import("./learning-notebook"));
import {
  MascotFigure,
  MascotStudio,
  type RewardAction,
} from "./mascot-studio";
import type { PublicRewardState } from "@/lib/rewards-shared";
import type { LearnerProfile } from "@/lib/onboarding-shared";
const Onboarding = dynamic(() => import('./onboarding'));
const EltisSimulator = dynamic(() => import('./eltis-simulator').then(m => m.EltisSimulator));

const voiceEnabled = process.env.NEXT_PUBLIC_VOICE_ENABLED !== "false";

type View = "today" | "course" | "review" | "exams" | "profile" | "notebook" | "shop";
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
  const [notice, setNotice] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [reward, setReward] = useState<PublicRewardState>(emptyRewards);
  const [rewardBusy, setRewardBusy] = useState(false);
  const [rewardAvailable, setRewardAvailable] = useState(true);
  const [workspace, setWorkspace] = useState(blankWorkspace);
  useEffect(() => {
    if (!user) return;
    const refresh = () => setWorkspace(readWorkspace(user.id));
    refresh(); window.addEventListener("storage", refresh); window.addEventListener("sparky-workspace", refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener("sparky-workspace", refresh); };
  }, [user]);
  const [today, setToday] = useState(() => new Date());

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
            const rewards = (await response.json()) as PublicRewardState;
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
        <p role="status">Abrindo seu espaço de estudo…</p>
      </main>
    );
  if (connectionError)
    return (
      <main className="loading-page">
        <Brand />
        <h1>Sem conexão no momento</h1>
        <p>Conecte-se à internet para validar sua sessão.</p>
        <button
          className="primary-button"
          onClick={() => window.location.reload()}
        >
          Tentar novamente
        </button>
      </main>
    );
  if (!user) return <LoginScreen />;
  if (needsOnboarding) return <Onboarding onCancel={() => void logout()} onComplete={profile => {
    setLearnerProfile(profile); setProgress(current => ({...current,level:profile.level}));
    setReward(current => ({...current,mascot:profile.mascot}));setNeedsOnboarding(false);
  }} />;

  const completed = Object.keys(progress.completed).length;
  const next =
    lessons.find(
      (lesson) =>
        lesson.level === progress.level && !progress.completed[lesson.id],
    ) ||
    lessons.find((lesson) => !progress.completed[lesson.id]) ||
    lessons[0];
  const studied = lessons
    .filter((lesson) => progress.completed[lesson.id])
    .sort((a, b) => Date.parse(progress.reviews[a.id] || "9999-01-01") - Date.parse(progress.reviews[b.id] || "9999-01-01"));
  const dueLessons = studied.filter((lesson) => Date.parse(progress.reviews[lesson.id]) <= today.getTime());
  const earlyLessons = studied.filter((lesson) => !dueLessons.some((item) => item.id === lesson.id));
  const due = dueLessons.length;
  const dueLabel = `${due} para hoje`;
  const resume = Object.values(workspace.checkpoints).filter(p => lessons.some(l => l.id === p.lessonId)).sort((a,b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0];
  const recommended = resume ? lessons.find(l => l.id === resume.lessonId)! : studied.find(l => Date.parse(progress.reviews[l.id]) <= today.getTime()) || next;
  const recommendedReview = resume ? resume.review : Boolean(progress.completed[recommended.id]);
  const open = (lesson: Lesson, review = false) => {
    setNotice("");
    setActive({ lesson: personalizeLesson(lesson, learnerProfile?.name), review });
  };
  async function editNamePronunciation() {
    try {
      const response = await fetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "pronunciation-start" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível abrir o ajuste.");
      setNeedsOnboarding(true);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Tente novamente."); }
  }

  return (
    <div className="app-frame">
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      <aside className="sidebar">
        <Brand />
        <nav aria-label="Navegação principal">
          {navigation.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "nav-item active" : "nav-item"}
              aria-current={view === item.id ? "page" : undefined}
              onClick={() => {
                setView(item.id);
                setNotice("");
              }}
            >
              <item.icon size={19} />
              {item.label}
              {item.id === "review" && due > 0 && (
                <span className="nav-count">{due}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-course">
          <Languages size={22} />
          <p>
            Seu idioma: <strong>Português</strong>
          </p>
          <p>
            Você está estudando <strong>Inglês</strong>
          </p>
          <span>
            PT-BR <ArrowRight size={13} /> EN
          </span>
        </div>
        <button className="logout-link" onClick={logout} disabled={signingOut}>
          <LogOut size={16} />
          {signingOut ? "Saindo…" : "Sair da conta"}
        </button>
      </aside>
      <main className="workspace" id="conteudo" tabIndex={-1} onClickCapture={event => {
        if (event.target instanceof Element) lessonOpener.current = event.target.closest('button');
      }}>
        <header className="workspace-header">
          <div className="mobile-brand">
            <Brand />
          </div>
          <p className="date-label">
            {new Intl.DateTimeFormat("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            }).format(new Date())}
          </p>
          <button
            className="account-chip profile-gear"
            onClick={() => setView("profile")}
            aria-label={`Abrir perfil de ${user.name}`}
          >
            <Settings size={21} aria-hidden="true" />
          </button>
          <ThemeQuickToggle userId={user.id} />
        </header>
        {notice && (
          <div className="notice" role="status">
            {notice}
            <button
              aria-label="Dispensar mensagem"
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
                <p className="eyebrow">Olá, {learnerProfile?.name ?? user.name}</p>
                <h1>Seu estudo <span>de hoje</span></h1>
              </div>
              <span className="language-chip">
                <Languages size={15} />
                Português <ArrowRight size={12} /> Inglês
              </span>
            </div>
            <div className="today-layout">
              <section className="next-lesson">
                <div className="lesson-copy">
                  <span className="lesson-label">
                    {resume ? "RETOMAR PRÁTICA" : recommendedReview ? "REVISÃO PARA HOJE" : "PRÓXIMA LIÇÃO"} <span>{recommended.level}</span>
                  </span>
                  <h2>{recommended.title}</h2>
                  {!recommendedReview && <p className="english-title" lang="en">{recommended.englishTitle}</p>}
                  <p className="lesson-description">{recommendedReview ? "Recupere o que aprendeu antes de consultar os exemplos." : `Na prática: ${recommended.experience.application}.`}</p>
                  <div className="lesson-meta">
                    <Clock3 size={15} />
                    {recommended.minutes} min<span>•</span>Explicação + prática
                  </div>
                  <button className="cream-button" onClick={() => open(recommended, recommendedReview)}>
                    {resume ? "Continuar de onde parei" : recommendedReview ? "Revisar agora" : "Começar a lição"}
                    <ArrowRight size={17} />
                  </button>
                </div>
                <MascotFigure
                  mascot={reward.mascot}
                  equipped={reward.equipped}
                  size="hero"
                />
                <div className="hero-caption">
                  {reward.mascot === "pinky" ? "PINKY" : "SPARKY"} / SEU GUIA DE ESTUDO
                </div>
              </section>
              <aside className="study-summary">
                <p className="eyebrow">Seu progresso no curso</p>
                <div className="summary-progress">
                <div className="progress-number">
                  {completed}
                  <span>/{lessons.length}</span>
                </div>
                <div className="summary-meter">
                <p>lições concluídas</p>
                <progress
                  value={completed}
                  max={lessons.length}
                  aria-label="Lições concluídas"
                />
                </div>
                </div>
                <div className="summary-stats">
                <div className="stat-row">
                  <span>Tentativas registradas</span>
                  <strong>{workspace.attempts.length}</strong>
                </div>
                <div className="stat-row">
                  <span>Revisões para hoje</span>
                  <strong>{due}</strong>
                </div>
                <div className="stat-row coin-stat">
                  <span>Moedas</span>
                  <strong><Coins size={16} /> {reward.coins}</strong>
                </div>
                </div>
                <button
                  className="text-button"
                  onClick={() => setView("review")}
                >
                  Abrir revisão <ArrowRight size={15} />
                </button>
              </aside>
            </div>
            {learnerProfile && voiceEnabled && !active && <PersonalSparkyMessage key={`${learnerProfile.name}-${learnerProfile.namePronunciation}`} profile={learnerProfile} occasion="welcome" onPronunciation={() => void editNamePronunciation()} />}
            <InstallAppPrompt />
            <section className="learning-note">
              <span className="note-icon">
                <Languages size={22} />
              </span>
              <div>
                <h2>Explicações em português. Prática em inglês.</h2>
                <p>
                  Ouça, tente entender e revele a frase para conferir. Depois
                  use a ideia em uma resposta sua. Nas revisões, tente lembrar antes de consultar.
                </p>
              </div>
            </section>
            <div className="section-heading">
              <div>
                <p className="eyebrow">Explore o curso</p>
                <h2>Outros assuntos</h2>
              </div>
              <button className="text-button" onClick={() => setView("course")}>
                Ver módulos <ArrowRight size={15} />
              </button>
            </div>
            <div className="lesson-cards">
              {lessons
                .filter(
                  (lesson) =>
                    lesson.id !== next.id &&
                    lesson.level === progress.level &&
                    !progress.completed[lesson.id],
                )
                .slice(0, 3)
                .map((lesson) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    number={
                      lessons.findIndex((item) => item.id === lesson.id) + 1
                    }
                    done={Boolean(progress.completed[lesson.id])}
                    onOpen={() => open(lesson)}
                  />
                ))}
            </div>
          </div>
        )}
        {view === "course" && (
          <>
          <CourseCatalog
            level={progress.level}
            completed={progress.completed}
            onOpen={open}
            onExams={() => setView("exams")}
          />
          </>
        )}
        {view === "review" && (
          <>
            <div className="page-heading">
              <div>
                <p className="eyebrow">Vocabulário e expressões</p>
                <h1>Revisão</h1>
              </div>
              <span className="language-chip">{dueLabel}</span>
            </div>
            {studied.length === 0 ? (
              <section className="empty-state">
                <RotateCcw size={32} />
                <h2>Sua revisão começa depois da primeira lição</h2>
                <p>
                  As expressões que você estudar aparecerão aqui para praticar
                  novamente.
                </p>
                <button className="primary-button" onClick={() => open(next)}>
                  Começar uma lição <ArrowRight size={16} />
                </button>
              </section>
            ) : (
              <>
                <section className="review-guidance" aria-label="Como usar a revisão">
                  <strong>{due ? `${due} ${due === 1 ? "revisão vence" : "revisões vencem"} hoje.` : "Nenhuma revisão vence hoje."}</strong>
                  <p>Leia o enunciado e tente responder. Se você consultar a explicação ou a tradução antes de verificar, a tentativa será marcada como “com ajuda”.</p>
                </section>
                {dueLessons.length > 0 ? (
                  <section className="review-section" aria-labelledby="due-review-heading">
                    <div className="review-section-heading">
                      <div>
                        <p className="eyebrow">Prioridade de hoje</p>
                        <h2 id="due-review-heading">Revisar agora</h2>
                      </div>
                      <span>{due} {due === 1 ? "lição" : "lições"}</span>
                    </div>
                    <div className="review-list">
                      {dueLessons.map((lesson) => (
                        <ReviewCard key={lesson.id} lesson={lesson} reviewAt={progress.reviews[lesson.id]} due onOpen={() => open(lesson, true)} />
                      ))}
                    </div>
                  </section>
                ) : (
                  <section className="review-empty" aria-labelledby="available-review-heading">
                    <h2 id="available-review-heading">Prática antecipada disponível</h2>
                    <p>Você pode praticar uma lição antes da próxima data sem alterar a ordem do curso.</p>
                  </section>
                )}
                {earlyLessons.length > 0 && (
                  <section className="review-section" aria-labelledby="early-review-heading">
                    <div className="review-section-heading">
                      <div>
                        <p className="eyebrow">Opcional</p>
                        <h2 id="early-review-heading">{due ? "Praticar antes da data" : "Revisões disponíveis"}</h2>
                      </div>
                      <span>{earlyLessons.length} {earlyLessons.length === 1 ? "lição" : "lições"}</span>
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
        {view === "notebook" && <LearningNotebook userId={user.id} workspace={workspace} onOpen={open} themeId={reward.notebookTheme} />}
        {view === "exams" && <><button className="text-button" onClick={() => setView("course")}>← Voltar ao Curso</button><EltisSimulator userId={user.id} /></>}
        {view === "shop" && <>
          <div className="page-heading"><div><p className="eyebrow">Suas conquistas</p><h1>Loja</h1></div></div>
          {rewardAvailable ? <MascotStudio reward={reward} busy={rewardBusy} userId={user.id} onAction={handleWardrobe} onStudy={() => setView(due ? "review" : "today")} /> : <p role="status">Conecte-se novamente para carregar seu saldo e sua loja.</p>}
        </>}
        {view === "profile" && (
          <>
            <div className="page-heading">
              <div>
                <p className="eyebrow">Sua conta</p>
                <h1>Perfil e preferências</h1>
              </div>
            </div>
            <div className="profile-layout">
              <section className="profile-card">
                <div className="profile-person">
                  <span className="avatar large">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <h2>{learnerProfile?.name ?? user.name}</h2>
                    <p>{user.email}</p>
                    <span className="verified-label">
                      <Check size={13} />
                      Conta Google conectada
                    </span>
                  </div>
                </div>
                <div className="profile-setting">
                  <span>Idioma das explicações</span>
                  <strong>Português (Brasil)</strong>
                </div>
                <div className="profile-setting">
                  <span>Idioma de estudo</span>
                  <strong>Inglês</strong>
                </div>
                <ThemePreferenceControl userId={user.id} />
                {onboardingEnabled && <button className="secondary-button" onClick={() => setNeedsOnboarding(true)}>Editar preferências · {learnerProfile?.level}</button>}
                {onboardingEnabled && learnerProfile?.onboardingCompleted && <button className="secondary-button" onClick={() => void editNamePronunciation()}>Corrigir pronúncia do meu nome</button>}
                {onboardingEnabled && <button className="secondary-button" onClick={async () => {
                  if(!window.confirm('Apagar seu nome, idade, diagnóstico e áudio personalizado? Suas lições e compras serão preservadas.')) return;
                  const response=await fetch('/api/onboarding',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'refuse'})});
                  if(response.ok){setLearnerProfile(null);setNeedsOnboarding(true);}else setNotice('Não foi possível apagar. Tente novamente.');
                }}>Apagar personalização</button>}
                {!onboardingEnabled && <label className="profile-setting" htmlFor="study-level">
                  <span>Nível para recomendar lições</span>
                  <select
                    id="study-level"
                    value={progress.level}
                    onChange={(event) =>
                      save({ ...progress, level: event.target.value as Level })
                    }
                  >
                    {levels.map(level => <option key={level} value={level}>{level} · {levelDescriptions[level]}</option>)}
                  </select>
                </label>}
                <button
                  className="secondary-button"
                  onClick={logout}
                  disabled={signingOut}
                >
                  <LogOut size={16} />
                  {signingOut ? "Saindo…" : "Sair da conta"}
                </button>
              </section>
              <aside className="profile-note">
                <Globe2 size={24} />
                <h2>Sobre seu progresso</h2>
                <p><strong>{reward.storage === "account" ? "Conclusões e recompensas sincronizadas na conta." : "Progresso salvo neste navegador."}</strong></p>
                <p>
                  {reward.storage === "account"
                    ? "Suas lições concluídas, revisões, moedas e compras são salvas na sua conta. Entre com o mesmo Google em outro aparelho para continuar."
                    : "Suas conclusões, revisões, moedas e compras estão salvas neste navegador. A sincronização com outros aparelhos está indisponível no momento."}
                </p>
                <p>Rascunhos e histórico de tentativas ficam neste dispositivo, separados por conta. Você pode exportá-los pelo Caderno. A aparência é sincronizada quando há conexão.</p>
                <p>
                  {voiceEnabled
                    ? "A prática de voz é opcional. O microfone só é solicitado ao iniciar a escuta. O navegador pode processar áudio em um serviço externo; o Sparky não armazena gravações."
                    : "Os recursos de voz estão desativados nesta versão."}
                </p>
                <a href="/privacidade">
                  Como seus dados são usados <ArrowRight size={14} />
                </a>
              </aside>
            </div>
            <button className="secondary-button" onClick={() => setView("shop")}><ShoppingBag size={18} /> Escolher mascote e abrir a loja</button>
            <InstallAppPrompt dismissible={false} />
          </>
        )}
      </main>
      <nav className="mobile-nav" aria-label="Navegação no celular">
        {navigation.filter(item => item.id !== "profile" && item.id !== "exams").map((item) => (
          <button
            key={item.id}
            aria-current={view === item.id || (view === "exams" && item.id === "course") ? "page" : undefined}
            className={view === item.id || (view === "exams" && item.id === "course") ? "active" : ""}
            onClick={() => { setView(item.id); setNotice(""); }}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
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
        <Image src="/icons/sparky-192-v2.png" alt="" width={44} height={44} />
      </span>
      <span>
        Sparky<span className="brand-english">English</span>
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
            <LockKeyhole size={14} />
            Acesso por convite
          </span>
        </header>
        <div className="login-layout">
          <section className="login-intro">
            <span className="language-chip">
              PT-BR <ArrowRight size={14} /> EN
            </span>
            <h1>
              Inglês para quem
              <br />
              fala português.
            </h1>
            <p className="login-description">
              Entenda a estrutura das frases, pratique conversas e revise o que
              aprendeu.
            </p>
            <div className="sample-scene">
              <div className="sample-note">
                <span>NA PRIMEIRA LIÇÃO</span>
                <p lang="en">Hi, I’m Ana.</p>
                <p>Oi, eu sou Ana.</p>
                <div>
                  <span lang="en">I’m</span>
                  <ArrowRight size={13} />
                  <span lang="en">I am</span>
                  <span>eu sou</span>
                </div>
              </div>
              <Image
                src="/visuals/sparky-panda.png"
                alt="Sparky, seu guia nas lições"
                width={280}
                height={280}
                priority
              />
            </div>
            <div className="login-levels">
              <span><strong>A1–A2</strong> Primeiras conversas</span>
              <span><strong>B1–B2</strong> Comunicação independente</span>
              <span><strong>C1–C2</strong> Precisão e nuance</span>
            </div>
          </section>
          <section className="login-island" aria-labelledby="login-heading">
            <span className="login-icon">
              <GraduationCap size={26} />
            </span>
            <h2 id="login-heading">Entre para estudar</h2>
            <p>Use a conta Google do e-mail que recebeu acesso ao Sparky.</p>
            <GoogleLogin />
            <div className="login-separator" />
            <div className="login-detail">
              <Languages size={18} />
              <p>
                Orientações e comentários em português, exemplos e exercícios em
                inglês.
              </p>
            </div>
            <div className="login-detail">
              <LockKeyhole size={18} />
              <p>Somente contas autorizadas podem entrar.</p>
            </div>
            <a href="/privacidade" className="privacy-link">
              Como seus dados são usados
            </a>
          </section>
        </div>
        <footer>
          <span>Sparky English</span>
          <span>Português (Brasil)</span>
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
    ? new Intl.DateTimeFormat("pt-BR", {
        day: "numeric",
        month: "short",
      }).format(new Date(reviewDate))
    : "Disponível agora";
  return (
    <section className="review-card" data-priority={due ? "due" : "early"}>
      <div>
        <span className="eyebrow">
          {lesson.level} · {lesson.title}
        </span>
        <p>Pratique a recuperação antes de consultar o modelo.</p>
        <span>{due ? "Venceu: " : "Próxima revisão: "}{schedule}</span>
      </div>
      <button
        className="secondary-button"
        onClick={onOpen}
        aria-label={`Praticar revisão de ${lesson.title}`}
      >
        Praticar <ArrowRight size={16} />
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
          {lesson.level} <span>·</span> {lesson.minutes} min{" "}
          {done && "· Concluída"}
        </span>
        <strong>{lesson.title}</strong>
        <span lang="en">{lesson.englishTitle}</span>
      </span>
      <ChevronRight size={18} />
    </button>
  );
}
