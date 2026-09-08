"use client";

import { useState } from "react";
import { ArrowRight, Check, ClipboardCheck, Search } from "lucide-react";
import {
  lessons,
  modules,
  searchModules,
  type Lesson,
  type Level,
} from "@/lib/curriculum";
import { curriculumSources } from "@/lib/content/build";
import { levels, levelDescriptions } from "@/lib/levels";

export function CourseCatalog({
  level,
  completed,
  onOpen,
  onExams,
}: {
  level: Level;
  completed: Record<string, string>;
  onOpen: (lesson: Lesson) => void;
  onExams: () => void;
}) {
  const [selectedLevel, setSelectedLevel] = useState<Level | "all">(level);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const results = searchModules(selectedLevel, query)
    .map((module) => ({
      ...module,
      lessons: module.lessons.filter(
        (lesson) =>
          status === "all" ||
          (status === "done"
            ? Boolean(completed[lesson.id])
            : !completed[lesson.id]),
      ),
    }))
    .filter((module) => module.lessons.length);
  const found = results.reduce(
    (total, module) => total + module.lessons.length,
    0,
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Inglês para falantes de português</p>
          <h1>Seu curso</h1>
        </div>
        <span className="language-chip">
          {lessons.length} lições · {modules.length} módulos
        </span>
      </div>
      <p className="page-description">
        Escolha seu nível e continue a trilha, ou busque um assunto para praticar.
      </p>
      <button className="exam-entry secondary-button" onClick={onExams}>
        <ClipboardCheck size={20} aria-hidden="true" />
        <span>Simulados · Preparação para intercâmbio</span>
        <ArrowRight size={17} aria-hidden="true" />
      </button>
      <div
        className="catalog-levels"
        role="group"
        aria-label="Filtrar por nível"
      >
        {(["all", ...levels] as const).map((item) => (
          <button
            key={item}
            aria-pressed={selectedLevel === item}
            onClick={() => setSelectedLevel(item)}
          >
            <strong>{item === "all" ? "Todos" : item}</strong>
            <span>
              {item === "all" ? "Trilha A1–C2" : levelDescriptions[item]}
            </span>
            <small>
              {
                lessons.filter(
                  (lesson) => item === "all" || lesson.level === item,
                ).length
              }{" "}
              lições
            </small>
          </button>
        ))}
      </div>
      <div className="catalog-tools">
        <label className="catalog-search">
          <span>
            <Search size={16} /> Buscar no curso
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Assunto, regra ou palavra em inglês"
          />
        </label>
        <label>
          Seu progresso
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">Todas as lições</option>
            <option value="remaining">Ainda não concluídas</option>
            <option value="done">Concluídas</option>
          </select>
        </label>
      </div>
      <p className="catalog-count" role="status">
        {found} {found === 1 ? "lição encontrada" : "lições encontradas"} em{" "}
        {results.length} {results.length === 1 ? "módulo" : "módulos"}
      </p>
      {!results.length && (
        <section className="empty-state">
          <h2>Nenhuma lição neste filtro</h2>
          <p>Tente outro termo ou amplie o nível selecionado.</p>
          <button
            className="secondary-button"
            onClick={() => {
              setQuery("");
              setStatus("all");
              setSelectedLevel("all");
            }}
          >
            Limpar filtros
          </button>
        </section>
      )}
      <div className="catalog-modules">
        {results.map((module, index) => {
          const original = modules.find((item) => item.id === module.id)!;
          const done = original.lessons.filter(
            (lesson) => completed[lesson.id],
          ).length;
          const prerequisite = modules.find(
            (item) => item.id === module.prerequisiteId,
          );
          return (
            <details
              className="catalog-module"
              key={module.id}
              open={Boolean(query.trim()) || index === 0}
            >
              <summary>
                <span className="module-number">
                  {String(module.order).padStart(2, "0")}
                </span>
                <span className="catalog-module-title">
                  <span className="eyebrow">
                    {module.level} · {original.lessons.length} lições
                  </span>
                  <span className="catalog-module-name">{module.title}</span>
                  <span>{module.description}</span>
                </span>
                <span className="catalog-module-progress">
                  {done}/{original.lessons.length}
                  <progress
                    max={original.lessons.length}
                    value={done}
                    aria-label={`Progresso em ${module.title}`}
                  />
                </span>
              </summary>
              <div className="catalog-module-body">
                <p className="catalog-prerequisite">
                  {prerequisite
                    ? `Antes deste módulo, recomendamos: ${prerequisite.title}.`
                    : "Comece por aqui. Nenhum conhecimento prévio é necessário."}{" "}
                  Você também pode abrir as lições fora da ordem.
                </p>
                {module.lessons.map((lesson) => (
                  <button
                    className="catalog-lesson"
                    key={lesson.id}
                    onClick={() => onOpen(lesson)}
                  >
                    <span
                      className={`catalog-lesson-number ${completed[lesson.id] ? "done" : ""}`}
                    >
                      {completed[lesson.id] ? (
                        <Check size={17} aria-label="Concluída" />
                      ) : (
                        String(
                          original.lessons.findIndex(
                            (item) => item.id === lesson.id,
                          ) + 1,
                        ).padStart(2, "0")
                      )}
                    </span>
                    <span className="catalog-lesson-copy">
                      <strong>{lesson.title}</strong>
                      <span>{lesson.experience.personality} · {lesson.experience.mechanic}</span>
                    </span>
                    <span className="catalog-duration">
                      {lesson.minutes} min
                    </span>
                    <ArrowRight size={16} />
                  </button>
                ))}
              </div>
            </details>
          );
        })}
      </div>
      <details className="curriculum-references">
        <summary>Sobre o conteúdo e as referências</summary>
        <p>Os níveis são orientativos: concluir a trilha não equivale a uma certificação.</p>
        <p>
          162 lições autorais e 6 lições iniciais preservadas. Textos e exercícios
          próprios, com explicações em PT-BR. A produção escrita é uma atividade
          de auto-revisão, sem nota ou correção automática. A trilha atual não
          certifica compreensão oral nem pronúncia; os microtreinos oferecem prática e feedback textual.
        </p>
        <p>
          As fontes abaixo orientaram a organização e a consulta de estruturas.
          Não há afiliação, certificação ou reprodução dos cursos dessas
          instituições.
        </p>
        <ul>
          {curriculumSources.map((source) => (
            <li key={source.id}>
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.title}
              </a>
              <p>{source.scope}</p>
            </li>
          ))}
        </ul>
      </details>
    </>
  );
}
