"use client";
import { t, localizeAttribute } from "@/lib/interface-language";
import Image from "next/image";
import { useRef, useState } from "react";
import { BookOpen, Check, Coins, Compass, Eye, ShoppingBag } from "lucide-react";
import { cosmeticCatalog, notebookThemeCatalog, storeCatalog, type CosmeticSlot, type MascotId, type PublicRewardState } from "@/lib/rewards-shared";
import { StorePractice } from "./store-practice";

export type RewardAction =
  | { action: "buy"; itemId: string }
  | { action: "notebook-theme"; itemId: string | null }
  | { action: "select-mascot"; mascot: MascotId }
  | { action: "equip"; mascot: MascotId; slot: CosmeticSlot; itemId: string | null };

export function MascotFigure({ mascot, equipped, size = "large", decorative = false }: {
  mascot: MascotId; equipped: PublicRewardState["equipped"];
  size?: "small" | "large" | "hero"; decorative?: boolean;
}) {
  const look = cosmeticCatalog.find(item => item.id === equipped[mascot].style && item.slot === "style" && item.mascots.includes(mascot));
  const scene = cosmeticCatalog.find(item => item.id === equipped[mascot].scene && item.slot === "scene");
  const name = mascot === "pinky" ? "Pinky" : "Sparky";
  return <div className={`mascot-figure mascot-${mascot} mascot-${size} ${scene?.className ?? ""} ${scene?.sceneAssets ? "has-illustrated-scene" : ""}`}>
    {scene?.sceneAssets && <span aria-hidden="true" className="mascot-scenery" style={{ backgroundImage: `image-set(url("${scene.sceneAssets.small}") 1x, url("${scene.sceneAssets.large}") 2x)` }} />}
    <Image src={look?.assetPath ?? (mascot === "pinky" ? "/visuals/pinky-v2.png" : "/visuals/sparky-panda.png")}
      alt={localizeAttribute(decorative ? "" : `${name}${look ? ` com ${look.name}` : ""}${scene ? ` em ${scene.name}` : ""}`)}
      width={640} height={640} loading={size === "hero" ? "eager" : "lazy"} sizes={size === "small" ? "86px" : "(max-width: 700px) 260px, 300px"} />
  </div>;
}

export function MascotStudio({ reward, busy, userId, onAction, onStudy }: {
  reward: PublicRewardState; busy: boolean; userId: string;
  onAction: (action: RewardAction) => Promise<boolean>; onStudy: () => void;
}) {
  const [filter, setFilter] = useState<"looks" | "scenes" | "missions" | "themes" | "owned">("looks");
  const [themePreview, setThemePreview] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [pack, setPack] = useState<string | null>(null);
  const previewHeading = useRef<HTMLHeadingElement>(null);
  const purchaseConfirmation = useRef<HTMLElement>(null);
  const notebookPreview = useRef<HTMLElement>(null);
  const mascot = reward.mascot;
  const name = mascot === "pinky" ? "Pinky" : "Sparky";
  const preview = cosmeticCatalog.find(item => item.id === previewId && item.mascots.includes(mascot));
  const previewEquipped = preview ? { ...reward.equipped, [mascot]: { ...reward.equipped[mascot], [preview.slot]: preview.id } } : reward.equipped;
  const items = storeCatalog.filter(item => {
    const cosmetic = "slot" in item;
    if (cosmetic && !item.mascots.includes(mascot)) return false;
    return filter === "owned" ? reward.owned.includes(item.id) : filter === "missions" ? item.kind === "practice-pack" : filter === "themes" ? item.kind === "notebook-theme" : cosmetic && item.category === filter;
  });
  function clearPreview() { setPreviewId(null); setConfirmId(null); }
  function requestPurchase(id: string) {
    setConfirmId(id);
    requestAnimationFrame(() => {
      purchaseConfirmation.current?.focus({ preventScroll: true });
      purchaseConfirmation.current?.scrollIntoView({ block: "center" });
    });
  }
  function tryItem(id: string) {
    setPreviewId(id); setConfirmId(null);
    previewHeading.current?.scrollIntoView({ block: "start", behavior: "instant" });
    previewHeading.current?.focus({ preventScroll: true });
  }
  function tryTheme(id: string) {
    setThemePreview(id);
    requestAnimationFrame(() => {
      notebookPreview.current?.focus({ preventScroll: true });
      notebookPreview.current?.scrollIntoView({ block: "center" });
    });
  }
  return <section className="mascot-studio shop-v2" aria-labelledby="mascot-studio-title">
    <header className="studio-header"><div><p className="eyebrow">{t("Aprenda · conquiste · escolha")}</p><h2 id="mascot-studio-title">{t("Loja de descobertas")}</h2></div><span className="coin-balance" aria-label={localizeAttribute(`${reward.coins} moedas`)}><Coins size={20} /> {t(reward.coins)}</span></header>
    <p className="shop-intro">{t("Seu estudo vira novas possibilidades: um look, um cenário, um tema de caderno ou uma missão extra para usar o inglês.")}</p>
    {!!reward.wardrobeRefund && <details className="shop-refund"><summary>{t(reward.wardrobeRefund)}{t(" moedas devolvidas pelos acessórios antigos")}</summary><p>{t("Os oito acessórios sobrepostos foram substituídos por looks completos. Devolvemos integralmente as compras retiradas. Seus looks Academia e Ateliê continuam no inventário.")}</p></details>}
    <div className="studio-main">
      <div className="mascot-preview"><h3 ref={previewHeading} tabIndex={-1}>{t(preview ? `Experimentando: ${preview.name}` : `Seu visual: ${name}`)}</h3>
        <MascotFigure mascot={mascot} equipped={previewEquipped} />
        <p aria-live="polite">{t(preview ? "Esta é uma prévia. Suas moedas e seu visual continuam iguais até você confirmar." : "Combine um look completo com um cenário. As roupas já fazem parte do desenho.")}</p>
        {preview && <div className="preview-actions">
          {reward.owned.includes(preview.id) ? <button className="primary-button" disabled={busy} onClick={async () => { if (await onAction({ action: "equip", mascot, slot: preview.slot, itemId: preview.id })) clearPreview(); }}>{t("Usar este visual")}</button>
            : <button className="primary-button" disabled={busy || reward.coins < preview.price} onClick={() => requestPurchase(preview.id)}>{t("Comprar por")}{t(preview.price)}{t(" moedas")}</button>}
          <button className="text-button" disabled={busy} onClick={clearPreview}>{t("Sair da prévia")}</button>
        </div>}
      </div>
      <div className="shop-companion-panel"><div className="mascot-selector" role="group" aria-label={localizeAttribute("Escolher mascote")}>
        {(["sparky", "pinky"] as const).map(choice => <button key={choice} className={choice === mascot ? "selected" : ""} aria-pressed={choice === mascot} disabled={busy} onClick={async () => { if (await onAction({ action: "select-mascot", mascot: choice })) clearPreview(); }}>
          <MascotFigure mascot={choice} equipped={reward.equipped} size="small" decorative /><span>{t(choice === "pinky" ? "Pinky" : "Sparky")}</span>{choice === mascot && <Check size={16} />}
        </button>)}
      </div><div className="shop-earning"><h3>{t("Um próximo objetivo")}</h3><p>{t("Com 30 moedas você já escolhe um cenário. Com 40, desbloqueia duas missões do cotidiano ou o look Pinky em foco.")}</p>
        <div className="reward-rules"><span><strong>+10</strong>{t(" primeira conclusão")}</span><span><strong>+20</strong>{t(" módulo completo")}</span><span><strong>+2</strong>{t(" por revisão vencida · até 10 revisões/dia")}</span></div>
        <button className="secondary-button" disabled={busy} onClick={onStudy}>{t("Praticar para ganhar moedas")}<Compass size={16} /></button>
        <p>{t("Errar faz parte: corrija e continue. As moedas não compram respostas, notas ou conclusão de lições.")}</p>
      </div></div>
    </div>
    {confirmId && (() => { const item = storeCatalog.find(entry => entry.id === confirmId); if (!item) return null; return <section ref={purchaseConfirmation} tabIndex={-1} className="shop-confirm" role="region" aria-label={localizeAttribute("Confirmar compra")}>
      <h3>{t("Adquirir")}{t(item.name)}?</h3><p>{t("Preço:")}{t(item.price)}{t(" moedas · Saldo depois da compra:")}{t(Math.max(0, reward.coins - item.price))}{t(" moedas. Compra permanente.")}</p>
      <button className="primary-button" disabled={busy || reward.coins < item.price} onClick={async () => { if (await onAction({ action: "buy", itemId: item.id })) { setConfirmId(null); setFilter("owned"); } }}>{t("Confirmar compra")}</button>
      <button className="text-button" disabled={busy} onClick={() => setConfirmId(null)}>{t("Cancelar compra")}</button>
    </section>; })()}
    <div className="wardrobe-filters" role="group" aria-label={localizeAttribute("Categorias da loja")}>
      {([ ["looks", "Looks"], ["scenes", "Cenários"], ["missions", "Missões extras"], ["themes", "Cadernos"], ["owned", "Meus itens"] ] as const).map(([id, label]) => <button key={id} aria-pressed={filter === id} onClick={() => { setFilter(id); setConfirmId(null); setThemePreview(null); }}>{t(label)}</button>)}
    </div>
    {filter === "themes" && <p className="shop-explanation">{t("Os temas mudam as cores do seu Caderno. Seus textos, frases e atividades continuam disponíveis em qualquer tema, incluindo o original gratuito.")}</p>}
    {themePreview && (() => { const theme = notebookThemeCatalog.find(item => item.id === themePreview); if (!theme) return null; return <section ref={notebookPreview} tabIndex={-1} className={`notebook-theme-preview ${theme.className}`} aria-label={localizeAttribute(`Prévia: ${theme.name}`)}>
      <p className="eyebrow">{t("Prévia gratuita")}</p><h3>{t(theme.name)}</h3><p lang="en">{t("Small steps today. Clearer ideas tomorrow.")}</p><p>{t("Suas frases, suas novas versões e um espaço para aprender com os erros.")}</p>
      <button className="secondary-button" onClick={() => setThemePreview(null)}>{t("Fechar prévia do caderno")}</button>
    </section>; })()}
    {filter === "missions" && <p className="shop-explanation">{t("Cada pacote inclui duas situações, quatro decisões com explicação e duas propostas de escrita com modelo. Você compra uma vez e pratica quando quiser. O curso A1–C2 continua acessível.")}</p>}
    {items.length === 0 && <p className="shop-empty">{t("Seu inventário para")}{t(name)}{t(" ainda está vazio. Experimente um look ou veja as missões extras.")}</p>}
    <div className="shop-grid">{items.map(item => {
      const cosmetic = "slot" in item;
      const owned = reward.owned.includes(item.id);
      const theme = item.kind === "notebook-theme";
      const equipped = cosmetic ? reward.equipped[mascot][item.slot] === item.id : theme && reward.notebookTheme === item.id;
      const shortfall = Math.max(0, item.price - reward.coins);
      const shown = cosmetic ? { ...reward.equipped, [mascot]: { ...reward.equipped[mascot], [item.slot]: item.id } } : reward.equipped;
      return <article className="shop-card" key={item.id} data-item={item.id}>
        <div className={`shop-card-art ${theme ? `notebook-theme-art ${item.className}` : ""}`}>{cosmetic ? <MascotFigure mascot={mascot} equipped={shown} decorative /> : theme ? <><BookOpen size={48} aria-hidden="true" /><strong>{t("My English notebook")}</strong><span>{t("Frases · ideias · novas versões")}</span></> : <><Compass size={46} /><strong>{t(item.level)}</strong><span>{t("2 missões de prática")}</span></>}</div>
        <div className="shop-card-copy"><p className="eyebrow">{t(owned ? equipped ? "Em uso" : "Adquirido" : cosmetic ? item.category === "looks" ? "Look completo" : "Cenário" : theme ? "Tema de caderno" : "Pacote permanente")}</p><h3>{t(item.name)}</h3><p>{t(item.description)}</p></div>
        <div className="shop-card-actions">
          {cosmetic && <button className="text-button" disabled={busy} onClick={() => tryItem(item.id)}><Eye size={16} />{t(" Experimentar")}</button>}
          {theme && <button className="text-button" onClick={() => tryTheme(item.id)}><Eye size={16} />{t(" Ver prévia do caderno")}</button>}
          {owned ? cosmetic ? <button className="secondary-button" disabled={busy} onClick={async () => { if (await onAction({ action: "equip", mascot, slot: item.slot, itemId: equipped ? null : item.id })) clearPreview(); }}>{t(equipped ? "Remover" : "Usar")}</button>
            : theme ? <button className="secondary-button" disabled={busy} onClick={() => onAction({ action: "notebook-theme", itemId: equipped ? null : item.id })}>{t(equipped ? "Voltar ao tema original" : "Usar no caderno")}</button>
            : <button className="primary-button" onClick={() => setPack(item.id)}>{t("Abrir missões")}</button>
            : <><span className="shop-price"><Coins size={16} /> {t(item.price)}{t(" moedas")}</span>
              {shortfall > 0 ? <><p className="shop-shortfall">{t("Faltam")}{t(shortfall)}{t(" moedas")}</p><button className="secondary-button" disabled={busy} onClick={onStudy}>{t("Continuar estudando")}</button></> : <button className="secondary-button" disabled={busy} onClick={() => requestPurchase(item.id)}><ShoppingBag size={16} />{t(" Adquirir")}</button>}
            </>}
        </div>
      </article>;
    })}</div>
    <p className="wardrobe-note">{t("Moedas virtuais, sem compra com dinheiro, prazo de validade ou sorteios. Cenários funcionam com ambos os mascotes; looks respeitam o personagem indicado.")}</p>
    {pack && reward.owned.includes(pack) && <StorePractice key={pack} packId={pack} userId={userId} onClose={() => setPack(null)} />}
  </section>;
}
