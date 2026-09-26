"use client";

import Image from "next/image";
import { localizeAttribute, t } from "@/lib/interface-language";
import { missingPostcardScenes } from "@/lib/story-content";
import { useStoryProgress } from "@/lib/story-progress";
import styles from "./story.module.css";

export function StoryInvite({ userId, onOpen }: { userId: string; onOpen: () => void }) {
  const done = useStoryProgress(userId);

  return <section className={styles.invite} aria-labelledby="story-invite-heading">
    <Image src="/stories/missing-postcard/bookshop.png" alt="" width={1672} height={941} sizes="(max-width: 700px) 100vw, 38vw" loading="lazy" />
    <div className={styles.inviteCopy}>
      <p className="eyebrow">{t("HISTÓRIA INTERATIVA")} · A1–A2</p>
      <h2 id="story-invite-heading">{t("O cartão-postal perdido")}</h2>
      <p>{t("Sparky e Pinky encontram uma pista na livraria. Leia, escute e escolha como a história continua.")}</p>
      <div className={styles.inviteActions}>
        <button className="primary-button" onClick={onOpen}>{t(done ? done === missingPostcardScenes.length ? "Rever história" : "Continuar história" : "Abrir história")}<span aria-hidden="true">→</span></button>
        <span aria-label={localizeAttribute(`${done} de ${missingPostcardScenes.length} cenas concluídas`)}>{done}/{missingPostcardScenes.length} {t("cenas")}</span>
      </div>
    </div>
  </section>;
}
