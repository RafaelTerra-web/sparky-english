"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { Check, Coins, Compass, Eye, ShoppingBag } from "lucide-react";
import { cosmeticCatalog, storeCatalog, type CosmeticSlot, type MascotId, type PublicRewardState } from "@/lib/rewards-shared";
import { StorePractice } from "./store-practice";

export type RewardAction =
  | { action: "buy"; itemId: string }
  | { action: "select-mascot"; mascot: MascotId }
  | { action: "equip"; mascot: MascotId; slot: CosmeticSlot; itemId: string | null };

export function MascotFigure({ mascot, equipped, size = "large", decorative = false }: {
  mascot: MascotId; equipped: PublicRewardState["equipped"];
  size?: "small" | "large" | "hero"; decorative?: boolean;
}) {
  const look = cosmeticCatalog.find(item => item.id === equipped[mascot].style && item.slot === "style" && item.mascots.includes(mascot));
  const scene = cosmeticCatalog.find(item => item.id === equipped[mascot].scene && item.slot === "scene");
  const name = mascot === "pinky" ? "Pinky" : "Sparky";
  return <div className={`mascot-figure mascot-${mascot} mascot-${size} ${scene?.className ?? ""}`}>
    <Image src={look?.assetPath ?? (mascot === "pinky" ? "/visuals/pinky-v2.png" : "/visuals/sparky-panda.png")}
      alt={decorative ? "" : `${name}${look ? ` com ${look.name}` : ""}${scene ? ` em ${scene.name}` : ""}`}
      width={640} height={640} sizes={size === "small" ? "86px" : "(max-width: 700px) 260px, 300px"} />
  </div>;
}

export function MascotStudio({ reward, busy, userId, onAction, onStudy }: {
  reward: PublicRewardState; busy: boolean; userId: string;
  onAction: (action: RewardAction) => Promise<boolean>; onStudy: () => void;
}) {
  const [filter, setFilter] = useState<"looks" | "scenes" | "missions" | "owned">("looks");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [pack, setPack] = useState<string | null>(null);
  const previewHeading = useRef<HTMLHeadingElement>(null);
  const purchaseConfirmation = useRef<HTMLElement>(null);
  const mascot = reward.mascot;
  const name = mascot === "pinky" ? "Pinky" : "Sparky";
  const preview = cosmeticCatalog.find(item => item.id === previewId && item.mascots.includes(mascot));
  const previewEquipped = preview ? { ...reward.equipped, [mascot]: { ...reward.equipped[mascot], [preview.slot]: preview.id } } : reward.equipped;
  const items = storeCatalog.filter(item => {
    const cosmetic = "slot" in item;
    if (cosmetic && !item.mascots.includes(mascot)) return false;
    return filter === "owned" ? reward.owned.includes(item.id) : filter === "missions" ? !cosmetic : cosmetic && item.category === filter;
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
  return <section className="mascot-studio shop-v2" aria-labelledby="mascot-studio-title">
    <header className="studio-header"><div><p className="eyebrow">Aprenda · conquiste · escolha</p><h2 id="mascot-studio-title">Loja de descobertas</h2></div><span className="coin-balance" aria-label={`${reward.coins} moedas`}><Coins size={20} /> {reward.coins}</span></header>
    <p className="shop-intro">Seu estudo vira novas possibilidades: um look, um cenário ou uma missão extra para usar o inglês.</p>
    {!!reward.wardrobeRefund && <details className="shop-refund"><summary>{reward.wardrobeRefund} moedas devolvidas pelos acessórios antigos</summary><p>Os oito acessórios sobrepostos foram substituídos por looks completos. Devolvemos integralmente as compras retiradas. Seus looks Academia e Ateliê continuam no inventário.</p></details>}
    <div className="studio-main">
      <div className="mascot-preview"><h3 ref={previewHeading} tabIndex={-1}>{preview ? `Experimentando: ${preview.name}` : `Seu visual: ${name}`}</h3>
        <MascotFigure mascot={mascot} equipped={previewEquipped} />
        <p aria-live="polite">{preview ? "Esta é uma prévia. Suas moedas e seu visual continuam iguais até você confirmar." : "Combine um look completo com um cenário. As roupas já fazem parte do desenho."}</p>
        {preview && <div className="preview-actions">
          {reward.owned.includes(preview.id) ? <button className="primary-button" disabled={busy} onClick={async () => { if (await onAction({ action: "equip", mascot, slot: preview.slot, itemId: preview.id })) clearPreview(); }}>Usar este visual</button>
            : <button className="primary-button" disabled={busy || reward.coins < preview.price} onClick={() => requestPurchase(preview.id)}>Comprar por {preview.price} moedas</button>}
          <button className="text-button" disabled={busy} onClick={clearPreview}>Sair da prévia</button>
        </div>}
      </div>
      <div className="shop-companion-panel"><div className="mascot-selector" role="group" aria-label="Escolher mascote">
        {(["sparky", "pinky"] as const).map(choice => <button key={choice} className={choice === mascot ? "selected" : ""} aria-pressed={choice === mascot} disabled={busy} onClick={async () => { if (await onAction({ action: "select-mascot", mascot: choice })) clearPreview(); }}>
          <MascotFigure mascot={choice} equipped={reward.equipped} size="small" decorative /><span>{choice === "pinky" ? "Pinky" : "Sparky"}</span>{choice === mascot && <Check size={16} />}
        </button>)}
      </div><div className="shop-earning"><h3>Um próximo objetivo</h3><p>Com 30 moedas você já escolhe um cenário. Com 40, desbloqueia duas missões do cotidiano ou o look Pinky em foco.</p>
        <div className="reward-rules"><span><strong>+10</strong> primeira conclusão</span><span><strong>+20</strong> módulo completo</span><span><strong>+2</strong> por revisão vencida · até 10 revisões/dia</span></div>
        <button className="secondary-button" disabled={busy} onClick={onStudy}>Praticar para ganhar moedas <Compass size={16} /></button>
        <p>Errar faz parte: corrija e continue. As moedas não compram respostas, notas ou conclusão de lições.</p>
      </div></div>
    </div>
    {confirmId && (() => { const item = storeCatalog.find(entry => entry.id === confirmId); if (!item) return null; return <section ref={purchaseConfirmation} tabIndex={-1} className="shop-confirm" role="region" aria-label="Confirmar compra">
      <h3>Adquirir {item.name}?</h3><p>Preço: {item.price} moedas · Saldo depois da compra: {Math.max(0, reward.coins - item.price)} moedas. Compra permanente.</p>
      <button className="primary-button" disabled={busy || reward.coins < item.price} onClick={async () => { if (await onAction({ action: "buy", itemId: item.id })) { setConfirmId(null); setFilter("owned"); } }}>Confirmar compra</button>
      <button className="text-button" disabled={busy} onClick={() => setConfirmId(null)}>Cancelar compra</button>
    </section>; })()}
    <div className="wardrobe-filters" role="group" aria-label="Categorias da loja">
      {([ ["looks", "Looks"], ["scenes", "Cenários"], ["missions", "Missões extras"], ["owned", "Meus itens"] ] as const).map(([id, label]) => <button key={id} aria-pressed={filter === id} onClick={() => { setFilter(id); setConfirmId(null); }}>{label}</button>)}
    </div>
    {filter === "missions" && <p className="shop-explanation">Cada pacote inclui duas situações, quatro decisões com explicação e duas propostas de escrita com modelo. Você compra uma vez e pratica quando quiser. O curso A1–C2 continua acessível.</p>}
    {items.length === 0 && <p className="shop-empty">Seu inventário para {name} ainda está vazio. Experimente um look ou veja as missões extras.</p>}
    <div className="shop-grid">{items.map(item => {
      const cosmetic = "slot" in item;
      const owned = reward.owned.includes(item.id);
      const equipped = cosmetic && reward.equipped[mascot][item.slot] === item.id;
      const shortfall = Math.max(0, item.price - reward.coins);
      const shown = cosmetic ? { ...reward.equipped, [mascot]: { ...reward.equipped[mascot], [item.slot]: item.id } } : reward.equipped;
      return <article className="shop-card" key={item.id} data-item={item.id}>
        <div className="shop-card-art">{cosmetic ? <MascotFigure mascot={mascot} equipped={shown} decorative /> : <><Compass size={46} /><strong>{item.level}</strong><span>2 missões de prática</span></>}</div>
        <div className="shop-card-copy"><p className="eyebrow">{owned ? equipped ? "Em uso" : "Adquirido" : cosmetic ? item.category === "looks" ? "Look completo" : "Cenário" : "Pacote permanente"}</p><h3>{item.name}</h3><p>{item.description}</p></div>
        <div className="shop-card-actions">
          {cosmetic && <button className="text-button" disabled={busy} onClick={() => tryItem(item.id)}><Eye size={16} /> Experimentar</button>}
          {owned ? cosmetic ? <button className="secondary-button" disabled={busy} onClick={async () => { if (await onAction({ action: "equip", mascot, slot: item.slot, itemId: equipped ? null : item.id })) clearPreview(); }}>{equipped ? "Remover" : "Usar"}</button>
            : <button className="primary-button" onClick={() => setPack(item.id)}>Abrir missões</button>
            : <><span className="shop-price"><Coins size={16} /> {item.price} moedas</span>
              {shortfall > 0 ? <><p className="shop-shortfall">Faltam {shortfall} moedas</p><button className="secondary-button" disabled={busy} onClick={onStudy}>Continuar estudando</button></> : <button className="secondary-button" disabled={busy} onClick={() => requestPurchase(item.id)}><ShoppingBag size={16} /> Adquirir</button>}
            </>}
        </div>
      </article>;
    })}</div>
    <p className="wardrobe-note">Moedas virtuais, sem compra com dinheiro, prazo de validade ou sorteios. Cenários funcionam com ambos os mascotes; looks respeitam o personagem indicado.</p>
    {pack && reward.owned.includes(pack) && <StorePractice key={pack} packId={pack} userId={userId} onClose={() => setPack(null)} />}
  </section>;
}
