"use client";
import { t, localizeAttribute, translate, supportT, getSupportLocale } from "@/lib/interface-language";
import Image from "next/image";
import { useRef, useState } from "react";
import { BookOpen, Check, Coins, Compass, Eye, RotateCcw, ShoppingBag } from "lucide-react";
import {
  accessoryCatalog,
  cosmeticCatalog,
  isCompatibleCosmetic,
  isCosmeticItem,
  notebookThemeCatalog,
  outfitCatalog,
  storeCatalog,
  wardrobeBaseAssets,
  type AccessorySlot,
  type CosmeticSlot,
  type MascotId,
  type PublicRewardState,
} from "@/lib/rewards-shared";
import { StorePractice } from "./store-practice";

export type RewardAction =
  | { action: "buy"; itemId: string }
  | { action: "buy-and-equip"; mascot: MascotId; itemId: string }
  | { action: "notebook-theme"; itemId: string | null }
  | { action: "select-mascot"; mascot: MascotId }
  | { action: "reset-look"; mascot: MascotId }
  | { action: "equip"; mascot: MascotId; slot: CosmeticSlot; itemId: string | null };

const accessorySlots: AccessorySlot[] = ["head", "face", "neck", "back"];
const slotLabels: Record<CosmeticSlot, string> = {
  outfit: "Traje",
  head: "Cabeça",
  face: "Rosto",
  neck: "Pescoço",
  back: "Bolsas",
};

export function MascotFigure({ mascot, equipped, size = "large", decorative = false }: {
  mascot: MascotId;
  equipped: PublicRewardState["equipped"];
  size?: "small" | "large" | "hero";
  decorative?: boolean;
}) {
  const outfit = outfitCatalog.find((item) => item.id === equipped[mascot].outfit && item.mascots.includes(mascot));
  const accessories = accessorySlots.flatMap((slot) => {
    const item = accessoryCatalog.find((entry) => entry.id === equipped[mascot][slot] && entry.slot === slot && isCompatibleCosmetic(entry, mascot, outfit?.id));
    return item ? [item] : [];
  });
  const name = mascot === "pinky" ? "Pinky" : "Sparky";
  const description = [outfit?.name, ...accessories.map((item) => item.name)].filter(Boolean).map((item) => translate(item!)).join(", ");
  const base = outfit?.assetPath ?? wardrobeBaseAssets[mascot];
  return <div className={`mascot-figure mascot-${mascot} mascot-${size}`}>
    {accessories.map((item) => item.assets[mascot].back && <Image key={`${item.id}-back`} className="wardrobe-layer wardrobe-back" src={item.assets[mascot].back!} alt="" width={640} height={640} sizes="(max-width: 700px) 260px, 300px" />)}
    <Image className="mascot-base" src={base} alt={decorative ? "" : `${name}${description ? ` ${translate("usando")} ${description}` : ""}`} width={640} height={640} loading={size === "hero" ? "eager" : "lazy"} sizes={size === "small" ? "86px" : "(max-width: 700px) 260px, 300px"} />
    {accessories.filter((item) => item.assets[mascot].front).map((item) => <Image key={item.id} className={`wardrobe-layer wardrobe-${item.slot === "back" ? "front" : item.slot}`} src={item.assets[mascot].front} alt="" width={640} height={640} sizes="(max-width: 700px) 260px, 300px" />)}
  </div>;
}

export function MascotStudio({ reward, busy, userId, onAction, onStudy }: {
  reward: PublicRewardState;
  busy: boolean;
  userId: string;
  onAction: (action: RewardAction) => Promise<boolean>;
  onStudy: () => void;
}) {
  const [filter, setFilter] = useState<"outfits" | "accessories" | "missions" | "themes" | "owned">("outfits");
  const [accessoryFilter, setAccessoryFilter] = useState<AccessorySlot | "all">("all");
  const [themePreview, setThemePreview] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [pack, setPack] = useState<string | null>(null);
  const previewHeading = useRef<HTMLHeadingElement>(null);
  const purchaseConfirmation = useRef<HTMLElement>(null);
  const notebookPreview = useRef<HTMLElement>(null);
  const mascot = reward.mascot;
  const name = mascot === "pinky" ? "Pinky" : "Sparky";
  const currentOutfit = reward.equipped[mascot].outfit;
  const preview = cosmeticCatalog.find((item) => item.id === previewId && isCompatibleCosmetic(item, mascot, currentOutfit));
  const previewEquipped = preview ? { ...reward.equipped, [mascot]: { ...reward.equipped[mascot], [preview.slot]: preview.id } } : reward.equipped;
  const items = storeCatalog.filter((item) => {
    if (isCosmeticItem(item) && !item.mascots.includes(mascot)) return false;
    if (filter === "owned") return reward.owned.includes(item.id);
    if (filter === "missions") return item.kind === "practice-pack";
    if (filter === "themes") return item.kind === "notebook-theme";
    if (filter === "outfits") return item.kind === "outfit";
    return item.kind === "accessory" && (accessoryFilter === "all" || item.slot === accessoryFilter);
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
    setPreviewId(id);
    setConfirmId(null);
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
    <header className="studio-header"><div><p className="eyebrow">{t("Aprenda · conquiste · combine")}</p><h2 id="mascot-studio-title">{t("Loja de descobertas")}</h2></div><span className="coin-balance" aria-label={localizeAttribute(`${reward.coins} moedas`)}><Coins size={20} /> {reward.coins}</span></header>
    <p lang={getSupportLocale()} className="shop-intro">{supportT("Transforme seu estudo em trajes, acessórios, temas de caderno e novas missões. Cada peça é ajustada separadamente para Sparky e Pinky.")}</p>
    {!!reward.sceneRefund && <details className="shop-refund"><summary>{reward.sceneRefund}{t(" moedas devolvidas pelos cenários retirados")}</summary><p lang={getSupportLocale()}>{supportT("Os cenários foram descontinuados. Todas as compras foram reembolsadas integralmente uma única vez.")}</p></details>}
    {!!reward.wardrobeRefund && <details className="shop-refund"><summary>{reward.wardrobeRefund}{t(" moedas devolvidas pela atualização anterior")}</summary><p lang={getSupportLocale()}>{supportT("Esse reembolso já foi incluído no seu saldo. Você pode combinar os novos acessórios com os trajes disponíveis.")}</p></details>}

    <div className="studio-main">
      <div className="mascot-preview"><h3 ref={previewHeading} tabIndex={-1}>{preview ? <>{t("Experimentando:")}{t(preview.name)}</> : <>{t("Visual de")}{t(name)}</>}</h3>
        <MascotFigure mascot={mascot} equipped={previewEquipped} />
        <p lang={getSupportLocale()} aria-live="polite">{supportT(preview ? "Prévia ativa. A compra e o visual só mudam quando você confirmar." : "Combine um traje com até quatro acessórios independentes.")}</p>
        {preview && <div className="preview-actions">
          {reward.owned.includes(preview.id)
            ? <button className="primary-button" disabled={busy} onClick={async () => { if (await onAction({ action: "equip", mascot, slot: preview.slot, itemId: preview.id })) clearPreview(); }}>{t("Usar este item")}</button>
            : <button className="primary-button" disabled={busy || reward.coins < preview.price} onClick={() => requestPurchase(preview.id)}>{t("Comprar por")} {preview.price}{t(" moedas")}</button>}
          <button className="text-button" disabled={busy} onClick={clearPreview}>{t("Sair da prévia")}</button>
        </div>}
        <div className="equipped-slots" aria-label={localizeAttribute("Itens usados atualmente")}>
          {(["outfit", ...accessorySlots] as CosmeticSlot[]).map((slot) => <span key={slot}><strong>{t(slotLabels[slot])}</strong>{t(cosmeticCatalog.find((item) => item.id === reward.equipped[mascot]?.[slot])?.name ?? (slot === "outfit" ? "Básico" : "Sem acessório"))}
            {reward.equipped[mascot][slot] && <button className="text-button" aria-label={localizeAttribute(`${translate("Remover")} ${translate(slotLabels[slot]).toLowerCase()}`)} disabled={busy} onClick={async () => { if (await onAction({ action: "equip", mascot, slot, itemId: null })) clearPreview(); }}>{t("Remover")}</button>}
          </span>)}
        </div>
        <button className="text-button reset-look" disabled={busy || !Object.keys(reward.equipped[mascot]).length} onClick={async () => { if (await onAction({ action: "reset-look", mascot })) clearPreview(); }}><RotateCcw size={15} /> {t("Restaurar visual básico")}</button>
      </div>
      <div className="shop-companion-panel"><div className="mascot-selector" role="group" aria-label={localizeAttribute("Escolher mascote")}>
        {(["sparky", "pinky"] as const).map((choice) => <button key={choice} className={choice === mascot ? "selected" : ""} aria-pressed={choice === mascot} disabled={busy} onClick={async () => { if (await onAction({ action: "select-mascot", mascot: choice })) clearPreview(); }}>
          <MascotFigure mascot={choice} equipped={reward.equipped} size="small" decorative /><span>{t(choice === "pinky" ? "Pinky" : "Sparky")}</span>{choice === mascot && <Check size={16} />}
        </button>)}
      </div><div className="shop-earning"><h3>{t("Seu próximo item")}</h3><p lang={getSupportLocale()}>{supportT("Com 40 moedas você já desbloqueia acessórios ou duas missões do cotidiano. Trajes especiais começam em 90 moedas.")}</p>
        <div className="reward-rules"><span><strong>+10</strong>{t(" primeira conclusão")}</span><span><strong>+20</strong>{t(" módulo completo")}</span><span><strong>+2</strong>{t(" por revisão vencida · até 10 por dia")}</span></div>
        <button className="secondary-button" disabled={busy} onClick={onStudy}>{t("Praticar para ganhar moedas")} <Compass size={16} /></button>
        <p lang={getSupportLocale()}>{supportT("As moedas não compram respostas, notas ou conclusão de lições.")}</p>
      </div></div>
    </div>

    {confirmId && (() => {
      const item = storeCatalog.find((entry) => entry.id === confirmId);
      if (!item) return null;
      const cosmetic = isCosmeticItem(item);
      return <section ref={purchaseConfirmation} tabIndex={-1} className="shop-confirm" role="region" aria-label={localizeAttribute("Confirmar compra")}>
        <h3>{t("Adquirir")}{t(item.name)}?</h3><p lang={getSupportLocale()}>{supportT("Preço:")}{item.price}{supportT(" moedas · Saldo depois da compra:")}{Math.max(0, reward.coins - item.price)}{supportT(" moedas. Compra permanente.")}</p>
        {cosmetic && <button className="primary-button" disabled={busy || reward.coins < item.price} onClick={async () => { if (await onAction({ action: "buy-and-equip", mascot, itemId: item.id })) clearPreview(); }}>{t("Comprar e usar")}</button>}
        <button className={cosmetic ? "secondary-button" : "primary-button"} disabled={busy || reward.coins < item.price} onClick={async () => { if (await onAction({ action: "buy", itemId: item.id })) { setConfirmId(null); setFilter("owned"); } }}>{t("Só comprar")}</button>
        <button className="text-button" aria-label={localizeAttribute("Cancelar compra")} disabled={busy} onClick={() => setConfirmId(null)}>{t("Cancelar")}</button>
      </section>;
    })()}

    <div className="wardrobe-filters" role="group" aria-label={localizeAttribute("Categorias da loja")}>
      {([ ["outfits", "Trajes"], ["accessories", "Acessórios"], ["missions", "Missões"], ["themes", "Cadernos"], ["owned", "Meus itens"] ] as const).map(([id, label]) => <button key={id} aria-pressed={filter === id} onClick={() => { setFilter(id); setConfirmId(null); setThemePreview(null); }}>{t(label)}</button>)}
    </div>
    {filter === "accessories" && <div className="accessory-filters" role="group" aria-label={localizeAttribute("Tipos de acessório")}>
      {([ ["all", "Todos"], ["head", "Cabeça"], ["face", "Rosto"], ["neck", "Pescoço"], ["back", "Bolsas"] ] as const).map(([id, label]) => <button key={id} aria-pressed={accessoryFilter === id} onClick={() => setAccessoryFilter(id)}>{t(label)}</button>)}
    </div>}
    {filter === "themes" && <p lang={getSupportLocale()} className="shop-explanation">{supportT("Os temas mudam as cores do Caderno sem alterar seus textos ou atividades.")}</p>}
    {themePreview && (() => { const theme = notebookThemeCatalog.find((item) => item.id === themePreview); if (!theme) return null; return <section ref={notebookPreview} tabIndex={-1} className={`notebook-theme-preview ${theme.className}`} aria-label={localizeAttribute(`${translate("Prévia")}: ${translate(theme.name)}`)}>
      <p className="eyebrow">{t("Prévia gratuita")}</p><h3>{t(theme.name)}</h3><p lang="en">Small steps today. Clearer ideas tomorrow.</p><p lang={getSupportLocale()}>{supportT("Suas frases, novas versões e um espaço para aprender com os erros.")}</p>
      <button className="secondary-button" onClick={() => setThemePreview(null)}>{t("Fechar prévia")}</button>
    </section>; })()}
    {filter === "missions" && <p lang={getSupportLocale()} className="shop-explanation">{supportT("Cada pacote inclui situações, decisões explicadas e propostas de escrita. O curso A1–C2 continua acessível sem compras.")}</p>}
    {items.length === 0 && <p lang={getSupportLocale()} className="shop-empty">{supportT("Nenhum item desta categoria está disponível para")}{supportT(name)}.</p>}
    <div className="shop-grid">{items.map((item) => {
      const cosmetic = isCosmeticItem(item);
      const owned = reward.owned.includes(item.id);
      const theme = item.kind === "notebook-theme";
      const equipped = cosmetic ? reward.equipped[mascot][item.slot] === item.id : theme && reward.notebookTheme === item.id;
      const shortfall = Math.max(0, item.price - reward.coins);
      const compatible = !cosmetic || isCompatibleCosmetic(item, mascot, currentOutfit);
      const shown = cosmetic ? { ...reward.equipped, [mascot]: { ...reward.equipped[mascot], [item.slot]: item.id } } : reward.equipped;
      return <article className="shop-card" key={item.id} data-item={item.id}>
        <div className={`shop-card-art ${theme ? `notebook-theme-art ${item.className}` : ""}`}>{cosmetic ? <MascotFigure mascot={mascot} equipped={shown} decorative /> : theme ? <><BookOpen size={48} aria-hidden="true" /><strong>{t("My English notebook")}</strong><span>{t("Frases · ideias · novas versões")}</span></> : <><Compass size={46} /><strong>{item.level}</strong><span>{t("2 missões de prática")}</span></>}</div>
        <div className="shop-card-copy"><p className="eyebrow">{t(owned ? equipped ? "Em uso" : "Adquirido" : cosmetic ? slotLabels[item.slot] : theme ? "Tema de caderno" : "Pacote permanente")}</p><h3>{t(item.name)}</h3><p lang={getSupportLocale()}>{supportT(item.description)}</p></div>
        <div className="shop-card-actions">
          {!compatible && <p lang={getSupportLocale()}>{supportT("Esta peça não combina com o traje atual. Troque o traje para experimentar.")}</p>}
          {cosmetic && <button className="text-button" disabled={busy || !compatible} onClick={() => tryItem(item.id)}><Eye size={16} /> {t(compatible ? "Experimentar" : "Incompatível")}</button>}
          {theme && <button className="text-button" onClick={() => tryTheme(item.id)}><Eye size={16} /> {t("Ver prévia")}</button>}
          {owned ? cosmetic ? <button className="secondary-button" disabled={busy || !compatible} onClick={async () => { if (await onAction({ action: "equip", mascot, slot: item.slot, itemId: equipped ? null : item.id })) clearPreview(); }}>{t(equipped ? "Remover" : "Usar")}</button>
            : theme ? <button className="secondary-button" disabled={busy} onClick={() => onAction({ action: "notebook-theme", itemId: equipped ? null : item.id })}>{t(equipped ? "Usar tema original" : "Usar no caderno")}</button>
            : <button className="primary-button" onClick={() => setPack(item.id)}>{t("Abrir missões")}</button>
            : <><span className="shop-price"><Coins size={16} /> {item.price}{t(" moedas")}</span>
              {shortfall > 0 ? <><p lang={getSupportLocale()} className="shop-shortfall">{supportT("Faltam")}{shortfall}{supportT(" moedas")}</p><button className="secondary-button" disabled={busy} onClick={onStudy}>{t("Continuar estudando")}</button></> : <button className="secondary-button" disabled={busy || !compatible} onClick={() => requestPurchase(item.id)}><ShoppingBag size={16} /> {t("Adquirir")}</button>}
            </>}
        </div>
      </article>;
    })}</div>
    <p lang={getSupportLocale()} className="wardrobe-note">{supportT("Moedas virtuais, sem compra com dinheiro, validade ou sorteios. Cada acessório inclui uma versão ajustada para Sparky e outra para Pinky.")}</p>
    {pack && reward.owned.includes(pack) && <StorePractice key={pack} packId={pack} userId={userId} onClose={() => setPack(null)} />}
  </section>;
}
