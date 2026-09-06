"use client";

import { useState } from "react";
import { ArrowRight, Check, Search } from "lucide-react";
import {
  lessons,
  modules,
  searchModules,
  type Lesson,
  type Level,
} from "@/lib/curriculum";
import { curriculumSources } from "@/lib/content/build";

export function CourseCatalog({
  level,
  completed,
  onOpen,
}: {
  level: Level;
  completed: Record<string, string>;
  onOpen: (lesson: Lesson) => void;
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
        Siga a ordem sugerida ou procure um assunto. Cada módulo reúne
        explicação, vocabulário, leitura e prática. Os níveis são orientativos:
        concluir a trilha não equivale a uma certificação.
      </p>
      <div
        className="catalog-levels"
        role="group"
        aria-label="Filtrar por nível"
      >
        {(["all", "A1", "A2", "B1"] as const).map((item) => (
          <button
            key={item}
            aria-pressed={selectedLevel === item}
            onClick={() => setSelectedLevel(item)}
          >
            <strong>{item === "all" ? "Todos" : item}</strong>
            <span>
              {item === "all"
                ? "Trilha completa"
                : item === "A1"
                  ? "Fundamentos"
                  : item === "A2"
                    ? "Situações cotidianas"
                    : "Ideias e autonomia"}
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
          Progresso nesta sessão
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
                      <span lang="en">{lesson.steps[1].english}</span>
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
        <p>
          114 lições novas e 6 lições iniciais preservadas. Textos e exercícios
          próprios, com explicações em PT-BR. A produção escrita é uma atividade
          de auto-revisão, sem nota ou correção automática. A trilha atual não
          avalia compreensão oral nem pronúncia.
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
