"use client";
import { t, localizeAttribute } from "@/lib/interface-language";

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
          <p className="eyebrow">{t("Inglês para falantes de português")}</p>
          <h1>{t("Seu curso")}</h1>
        </div>
        <span className="language-chip">
          {t(lessons.length)}{t(" lições ·")}{t(modules.length)}{t(" módulos")}</span>
      </div>
      <p className="page-description">{t("Escolha seu nível e continue a trilha, ou busque um assunto para praticar.")}</p>
      <button className="exam-entry secondary-button" onClick={onExams}>
        <ClipboardCheck size={20} aria-hidden="true" />
        <span>{t("Simulados · Preparação para intercâmbio")}</span>
        <ArrowRight size={17} aria-hidden="true" />
      </button>
      <div
        className="catalog-levels"
        role="group"
        aria-label={localizeAttribute("Filtrar por nível")}
      >
        {(["all", ...levels] as const).map((item) => (
          <button
            key={item}
            aria-pressed={selectedLevel === item}
            onClick={() => setSelectedLevel(item)}
          >
            <strong>{t(item === "all" ? "Todos" : item)}</strong>
            <span>
              {t(item === "all" ? "Trilha A1–C2" : levelDescriptions[item])}
            </span>
            <small>
              {
                t(lessons.filter(
                  (lesson) => item === "all" || lesson.level === item,
                ).length)
              }{t(" ")}{t("lições")}</small>
          </button>
        ))}
      </div>
      <div className="catalog-tools">
        <label className="catalog-search">
          <span>
            <Search size={16} />{t(" Buscar no curso")}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={localizeAttribute("Assunto, regra ou palavra em inglês")}
          />
        </label>
        <label>{t("Seu progresso")}<select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">{t("Todas as lições")}</option>
            <option value="remaining">{t("Ainda não concluídas")}</option>
            <option value="done">{t("Concluídas")}</option>
          </select>
        </label>
      </div>
      <p className="catalog-count" role="status">
        {t(found)} {t(found === 1 ? "lição encontrada" : "lições encontradas")}{t(" em")}{t(" ")}
        {t(results.length)} {t(results.length === 1 ? "módulo" : "módulos")}
      </p>
      {!results.length && (
        <section className="empty-state">
          <h2>{t("Nenhuma lição neste filtro")}</h2>
          <p>{t("Tente outro termo ou amplie o nível selecionado.")}</p>
          <button
            className="secondary-button"
            onClick={() => {
              setQuery("");
              setStatus("all");
              setSelectedLevel("all");
            }}
          >{t("Limpar filtros")}</button>
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
                  {t(String(module.order).padStart(2, "0"))}
                </span>
                <span className="catalog-module-title">
                  <span className="eyebrow">
                    {t(module.level)} · {t(original.lessons.length)}{t(" lições")}</span>
                  <span className="catalog-module-name">{t(module.title)}</span>
                  <span>{t(module.description)}</span>
                </span>
                <span className="catalog-module-progress">
                  {t(done)}/{t(original.lessons.length)}
                  <progress
                    max={original.lessons.length}
                    value={done}
                    aria-label={localizeAttribute(`Progresso em ${module.title}`)}
                  />
                </span>
              </summary>
              <div className="catalog-module-body">
                <p className="catalog-prerequisite">
                  {t(prerequisite
                    ? `Antes deste módulo, recomendamos: ${prerequisite.title}.`
                    : "Comece por aqui. Nenhum conhecimento prévio é necessário.")}{t(" ")}{t("Você também pode abrir as lições fora da ordem.")}</p>
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
                        <Check size={17} aria-label={localizeAttribute("Concluída")} />
                      ) : (
                        String(
                          original.lessons.findIndex(
                            (item) => item.id === lesson.id,
                          ) + 1,
                        ).padStart(2, "0")
                      )}
                    </span>
                    <span className="catalog-lesson-copy">
                      <strong>{t(lesson.title)}</strong>
                      <span>{t(lesson.experience.personality)} · {t(lesson.experience.mechanic)}</span>
                    </span>
                    <span className="catalog-duration">
                      {t(lesson.minutes)}{t(" min")}</span>
                    <ArrowRight size={16} />
                  </button>
                ))}
              </div>
            </details>
          );
        })}
      </div>
      <details className="curriculum-references">
        <summary>{t("Sobre o conteúdo e as referências")}</summary>
        <p>{t("Os níveis são orientativos: concluir a trilha não equivale a uma certificação.")}</p>
        <p>{t("162 lições autorais e 6 lições iniciais preservadas. Textos e exercícios próprios, com explicações em português brasileiro. Nas atividades de escrita, você cria e revisa seu texto, sem nota ou correção automática. A trilha atual não certifica compreensão oral nem pronúncia; os treinos oferecem prática e orientações por escrito.")}</p>
        <p>{t("As fontes abaixo orientaram a organização e a consulta de estruturas. Não há afiliação, certificação ou reprodução dos cursos dessas instituições.")}</p>
        <ul>
          {curriculumSources.map((source) => (
            <li key={source.id}>
              <a href={source.url} target="_blank" rel="noreferrer">
                {t(source.title)}
              </a>
              <p>{t(source.scope)}</p>
            </li>
          ))}
        </ul>
      </details>
    </>
  );
}
