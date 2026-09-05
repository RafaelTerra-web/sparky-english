"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Coins,
  Globe2,
  GraduationCap,
  Home,
  Languages,
  LockKeyhole,
  LogOut,
  RotateCcw,
  Settings2,
  X,
} from "lucide-react";
import type { SparkyUser } from "@/lib/auth-session";
import {
  correctAnswer,
  lessons,
  type Lesson,
  type Level,
  type Step,
} from "@/lib/curriculum";
import { GoogleLogin } from "./google-login";
import { CourseCatalog } from "./course-catalog";
import { SpeechPractice } from "./speech-practice";
import {
  MascotFigure,
  MascotStudio,
  type RewardAction,
} from "./mascot-studio";
import type { PublicRewardState } from "@/lib/rewards-shared";

const voiceEnabled = process.env.NEXT_PUBLIC_VOICE_ENABLED !== "false";

type View = "today" | "course" | "review" | "profile";
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
};
const navigation = [
  { id: "today" as View, label: "Hoje", icon: Home },
  { id: "course" as View, label: "Curso", icon: BookOpen },
  { id: "review" as View, label: "Revisão", icon: RotateCcw },
  { id: "profile" as View, label: "Perfil", icon: Settings2 },
];

function readProgress(userId: string): Progress {
  try {
    const saved = JSON.parse(
      sessionStorage.getItem(`sparky-progress:${userId}`) || "null",
    );
    if (!saved || !saved.completed || !saved.reviews) return emptyProgress;
    const clean = (record: Record<string, unknown>) =>
      Object.fromEntries(
        Object.entries(record).filter(
          ([id, date]) =>
            lessons.some((lesson) => lesson.id === id) &&
            typeof date === "string" &&
            Number.isFinite(Date.parse(date)),
        ),
      );
    return {
      completed: clean(saved.completed),
      reviews: clean(saved.reviews),
      level: ["A1", "A2", "B1"].includes(saved.level) ? saved.level : "A1",
    } as Progress;
  } catch {
    return emptyProgress;
  }
}

function clearPrivateStorage() {
  for (const storage of [sessionStorage, localStorage]) {
    for (const key of Object.keys(storage))
      if (key.startsWith("sparky-")) storage.removeItem(key);
  }
}

export default function SparkyApp() {
  const [user, setUser] = useState<SparkyUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [view, setView] = useState<View>("today");
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
      void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
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
        sessionStorage.setItem(
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
      setUser(null);
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

  async function rewardRequest(action: RewardAction | { action: "complete"; lessonId: string; review: boolean }) {
    if (rewardBusy) return null;
    setRewardBusy(true);
    try {
      const response = await fetch("/api/rewards", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(action),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.error === "insufficient-coins")
          setNotice("Você ainda não tem moedas suficientes para esse item.");
        else setNotice("Não foi possível atualizar o guarda-roupa agora.");
        return null;
      }
      setReward(data);
      setProgress((current) => ({
        level: current.level,
        completed: data.completed,
        reviews: data.reviews,
      }));
      setRewardAvailable(true);
      return data as PublicRewardState & { earned?: number; spent?: number; reason?: string };
    } catch {
      setNotice("Não foi possível salvar essa mudança. Verifique a conexão.");
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
        : action.action === "equip"
          ? "Visual atualizado."
          : `${action.mascot === "pinky" ? "Pinky" : "Sparky"} agora acompanha suas lições.`,
    );
    return true;
  }

  async function finish() {
    if (!active || rewardBusy) return;
    const now = new Date();
    setToday(now);
    const result = await rewardRequest({
      action: "complete",
      lessonId: active.lesson.id,
      review: active.review,
    });
    if (result) {
      const earned = result.earned ?? 0;
      setNotice(
        active.review
          ? earned
            ? `Revisão concluída. +${earned} moedas; próxima revisão em 3 dias.`
            : "Revisão concluída. Esta prática não gerou uma nova recompensa."
          : earned
            ? `Lição concluída. +${earned} moedas.`
            : "Lição concluída novamente. A recompensa da primeira conclusão já foi recebida.",
      );
      setActive(null);
    }
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

  const completed = Object.keys(progress.completed).length;
  const next =
    lessons.find(
      (lesson) =>
        lesson.level === progress.level && !progress.completed[lesson.id],
    ) ||
    lessons.find((lesson) => !progress.completed[lesson.id]) ||
    lessons[0];
  const due = Object.entries(progress.reviews).filter(
    ([, date]) => Date.parse(date) <= today.getTime(),
  ).length;
  const studied = lessons.filter((lesson) => progress.completed[lesson.id]);
  const open = (lesson: Lesson, review = false) => {
    setNotice("");
    setActive({ lesson, review });
  };

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
      <main className="workspace" id="conteudo">
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
            className="account-chip"
            onClick={() => setView("profile")}
            aria-label={`Abrir perfil de ${user.name}`}
          >
            <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
            <span>{user.name}</span>
            <ChevronRight size={15} />
          </button>
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
          <>
            <div className="page-heading">
              <div>
                <p className="eyebrow">Olá, {user.name}</p>
                <h1>Seu estudo de hoje</h1>
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
                    PRÓXIMA LIÇÃO <span>{next.level}</span>
                  </span>
                  <h2>{next.title}</h2>
                  <p className="english-title" lang="en">
                    {next.englishTitle}
                  </p>
                  <p className="lesson-description">{next.steps[0].body}</p>
                  <div className="lesson-meta">
                    <Clock3 size={15} />
                    {next.minutes} min<span>•</span>Explicação + prática
                  </div>
                  <button className="cream-button" onClick={() => open(next)}>
                    {completed ? "Continuar o curso" : "Começar a lição"}
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
                <p className="eyebrow">Nesta sessão</p>
                <div className="progress-number">
                  {completed}
                  <span>/{lessons.length}</span>
                </div>
                <p>lições concluídas</p>
                <progress
                  value={completed}
                  max={lessons.length}
                  aria-label="Lições concluídas"
                />
                <div className="stat-row">
                  <span>XP acumulado</span>
                  <strong>{completed * 20}</strong>
                </div>
                <div className="stat-row">
                  <span>Revisões para hoje</span>
                  <strong>{due}</strong>
                </div>
                <div className="stat-row coin-stat">
                  <span>Moedas</span>
                  <strong><Coins size={16} /> {reward.coins}</strong>
                </div>
                <button
                  className="text-button"
                  onClick={() => setView("review")}
                >
                  Abrir revisão <ArrowRight size={15} />
                </button>
              </aside>
            </div>
            <section className="learning-note">
              <span className="note-icon">
                <Languages size={22} />
              </span>
              <div>
                <h2>Explicações em português. Prática em inglês.</h2>
                <p>
                  Leia o exemplo, consulte a tradução e teste o que entendeu. O
                  feedback explica o motivo de cada resposta.
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
          </>
        )}
        {view === "course" && (
          <CourseCatalog
            level={progress.level}
            completed={progress.completed}
            onOpen={open}
          />
        )}
        {view === "review" && (
          <>
            <div className="page-heading">
              <div>
                <p className="eyebrow">Vocabulário e expressões</p>
                <h1>Revisão</h1>
              </div>
              <span className="language-chip">{due} para hoje</span>
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
              <div className="review-list">
                {studied.map((lesson) => (
                  <section className="review-card" key={lesson.id}>
                    <div>
                      <span className="eyebrow">
                        {lesson.level} · {lesson.title}
                      </span>
                      <p lang="en">{lesson.steps[1].english}</p>
                      <span>
                        Revisão:{" "}
                        {new Intl.DateTimeFormat("pt-BR", {
                          day: "numeric",
                          month: "short",
                        }).format(new Date(progress.reviews[lesson.id]))}
                      </span>
                    </div>
                    <button
                      className="secondary-button"
                      onClick={() => open(lesson, true)}
                    >
                      Praticar <ArrowRight size={16} />
                    </button>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
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
                    <h2>{user.name}</h2>
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
                <label className="profile-setting" htmlFor="study-level">
                  <span>Nível para recomendar lições</span>
                  <select
                    id="study-level"
                    value={progress.level}
                    onChange={(event) =>
                      save({ ...progress, level: event.target.value as Level })
                    }
                  >
                    <option value="A1">A1 · Iniciante</option>
                    <option value="A2">A2 · Básico</option>
                    <option value="B1">B1 · Intermediário</option>
                  </select>
                </label>
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
                <p>
                  Conclusões, revisões, moedas e roupas ficam em um cookie
                  criptografado ligado à sua conta neste navegador. Fechar a
                  aba ou sair não apaga esses dados. A sincronização entre
                  dispositivos ainda não está disponível.
                </p>
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
            {rewardAvailable ? (
              <MascotStudio
                reward={reward}
                busy={rewardBusy}
                onAction={handleWardrobe}
              />
            ) : (
              <section className="profile-note reward-offline">
                <Coins size={24} />
                <h2>Moedas indisponíveis</h2>
                <p>Conecte-se novamente para carregar seu saldo e guarda-roupa.</p>
              </section>
            )}
          </>
        )}
      </main>
      <nav className="mobile-nav" aria-label="Navegação no celular">
        {navigation.map((item) => (
          <button
            key={item.id}
            aria-current={view === item.id ? "page" : undefined}
            className={view === item.id ? "active" : ""}
            onClick={() => setView(item.id)}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      {active && (
        <LessonPlayer
          key={`${active.lesson.id}-${active.review}`}
          lesson={active.lesson}
          review={active.review}
          mascot={reward.mascot}
          equipped={reward.equipped}
          saving={rewardBusy}
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
        <BookOpen size={23} strokeWidth={1.8} />
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
                <p>Oi, eu sou a Ana.</p>
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
              <span>
                <strong>A1</strong> Primeiras conversas
              </span>
              <span>
                <strong>A2</strong> Situações do dia a dia
              </span>
              <span>
                <strong>B1</strong> Ideias e opiniões
              </span>
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
                Orientações e feedback em português, exemplos e exercícios em
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

function isExercise(step: Step) {
  return ["choice", "complete_sentence", "order_words"].includes(step.kind);
}

function LessonPlayer({
  lesson,
  review,
  mascot,
  equipped,
  saving,
  onClose,
  onFinish,
}: {
  lesson: Lesson;
  review: boolean;
  mascot: PublicRewardState["mascot"];
  equipped: PublicRewardState["equipped"];
  saving: boolean;
  onClose: () => void;
  onFinish: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [tokens, setTokens] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [translation, setTranslation] = useState(false);
  const [draft, setDraft] = useState("");
  const steps = review
    ? lesson.steps.filter((step) => isExercise(step) || step.kind === "summary")
    : lesson.steps;
  const step = steps[index];
  const selected =
    step.kind === "order_words"
      ? tokens.map((token) => step.options![token]).join(" ")
      : answer;
  const correct = correctAnswer(step, selected);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  useEffect(() => {
    heading.current?.focus();
  }, [index]);
  function next() {
    if (isExercise(step) && !checked) {
      setChecked(true);
      return;
    }
    if (isExercise(step) && !correct) {
      setChecked(false);
      setAnswer("");
      setTokens([]);
      return;
    }
    if (index === steps.length - 1) {
      onFinish();
      return;
    }
    setIndex((value) => value + 1);
    setAnswer("");
    setTokens([]);
    setChecked(false);
    setTranslation(false);
    setDraft("");
  }
  return (
    <dialog
      ref={dialog}
      className="lesson-dialog"
      onCancel={onClose}
      aria-labelledby="lesson-title"
    >
      <header>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Fechar lição"
        >
          <X size={20} />
        </button>
        <div>
          <p>{review ? "Revisão" : lesson.title}</p>
          <progress
            value={index + 1}
            max={steps.length}
            aria-label="Etapas da lição"
          />
        </div>
        <span>
          {index + 1}/{steps.length}
        </span>
      </header>
      <div className="lesson-body">
        {(index === 0 || step.kind === "summary") && (
          <MascotFigure mascot={mascot} equipped={equipped} size="small" decorative />
        )}
        <p className="eyebrow">
          {step.kind === "teach"
            ? "Entenda primeiro"
            : step.kind === "summary"
              ? "Resumo da lição"
              : step.kind === "production"
                ? "Escrita e auto-revisão"
                : step.kind === "vocabulary"
                  ? "Palavras em contexto"
                  : isExercise(step)
                    ? "Sua vez"
                    : "Observe o exemplo"}
        </p>
        <h2 id="lesson-title" ref={heading} tabIndex={-1}>
          {step.title}
        </h2>
        <p className="step-explanation">{step.body}</p>
        {step.kind === "production" && (
          <div className="production-workspace">
            <label htmlFor="lesson-draft">Seu rascunho (opcional)</label>
            <textarea
              id="lesson-draft"
              lang="en"
              rows={7}
              maxLength={4000}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Escreva sua resposta em inglês…"
            />
            <p>
              Não há correção automática ou nota. O rascunho fica apenas nesta
              etapa e é apagado ao avançar ou fechar a lição.
            </p>
            <strong>Antes de continuar, confira:</strong>
            <ul>
              <li>Respondi a todas as partes da proposta?</li>
              <li>Usei a estrutura e o vocabulário estudados?</li>
              <li>Sujeito, verbo e referência de tempo estão coerentes?</li>
              <li>
                Meu texto comunica a ideia sem depender de uma tradução palavra
                por palavra?
              </li>
            </ul>
          </div>
        )}
        {isExercise(step) && (
          <details className="lesson-notes">
            <summary>Consultar explicação e vocabulário</summary>
            {lesson.steps
              .filter(
                (item) => item.kind === "teach" || item.kind === "vocabulary",
              )
              .map((item, noteIndex) => (
                <section key={noteIndex}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </section>
              ))}
          </details>
        )}
        {step.english && (
          <div
            className={`english-example ${step.kind === "dialogue" ? "dialogue-example" : ""}`}
            lang="en"
          >
            {step.english}
          </div>
        )}
        {step.translation && (
          <div className="translation-block">
            <button
              className="text-button"
              onClick={() => setTranslation(!translation)}
              aria-expanded={translation}
            >
              <Languages size={16} />
              {translation ? "Ocultar tradução" : "Ver tradução"}
            </button>
            {translation && <p>{step.translation}</p>}
          </div>
        )}
        {voiceEnabled && step.english && step.kind === "example" && (
          <SpeechPractice key={`${lesson.id}-${index}`} text={step.english} />
        )}
        {step.kind === "order_words" ? (
          <div className="word-exercise">
            <div className="word-answer" aria-label="Frase montada">
              {tokens.length ? (
                tokens.map((token) => (
                  <button
                    key={token}
                    disabled={checked}
                    onClick={() =>
                      setTokens(tokens.filter((value) => value !== token))
                    }
                    lang="en"
                  >
                    {step.options![token]} <X size={12} />
                  </button>
                ))
              ) : (
                <span>Toque nas palavras abaixo para montar a frase.</span>
              )}
            </div>
            <div className="word-bank">
              {step.options!.map((word, token) => (
                <button
                  key={token}
                  disabled={tokens.includes(token) || checked}
                  onClick={() => setTokens([...tokens, token])}
                  lang="en"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        ) : (
          isExercise(step) && (
            <div
              className="answer-options"
              role="group"
              aria-label="Opções de resposta"
            >
              {step.options!.map((option, optionIndex) => (
                <button
                  key={option}
                  disabled={checked}
                  aria-pressed={answer === option}
                  className={answer === option ? "selected" : ""}
                  onClick={() => setAnswer(option)}
                >
                  <span>{String.fromCharCode(65 + optionIndex)}</span>
                  <span lang="en">{option}</span>
                  {answer === option && <Check size={17} />}
                </button>
              ))}
            </div>
          )
        )}
        {checked && (
          <div
            className={`answer-feedback ${correct ? "correct" : "retry"}`}
            role="status"
          >
            <strong>
              {correct ? "Resposta correta." : "Vamos rever essa resposta."}
            </strong>
            <p>{step.explanation}</p>
            {!correct && (
              <p>
                Resposta: <span lang="en">{step.answer}</span>
              </p>
            )}
          </div>
        )}
      </div>
      <footer>
        <span>
          {review ? "Prática de revisão" : "Você pode consultar as explicações"}
        </span>
        <button
          className="primary-button"
          disabled={saving || (isExercise(step) && !selected)}
          onClick={next}
        >
          {saving
            ? "Salvando…"
            : isExercise(step) && !checked
            ? "Verificar"
            : checked && !correct
              ? "Tentar novamente"
              : index === steps.length - 1
                ? "Concluir"
                : "Continuar"}
          <ArrowRight size={16} />
        </button>
      </footer>
    </dialog>
  );
}
