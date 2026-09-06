"use client";

import Image from "next/image";
import { useState } from "react";
import { Check, Coins, ShoppingBag } from "lucide-react";
import {
  cosmeticCatalog,
  type CosmeticCategory,
  type CosmeticSlot,
  type MascotId,
  type PublicRewardState,
} from "@/lib/rewards-shared";

export type RewardAction =
  | { action: "buy"; itemId: string }
  | { action: "select-mascot"; mascot: MascotId }
  | {
      action: "equip";
      mascot: MascotId;
      slot: CosmeticSlot;
      itemId: string | null;
    };

export function MascotFigure({
  mascot,
  equipped,
  size = "large",
  decorative = false,
}: {
  mascot: MascotId;
  equipped: PublicRewardState["equipped"];
  size?: "small" | "large" | "hero";
  decorative?: boolean;
}) {
  const activeItems = Object.values(equipped[mascot])
    .map((id) => cosmeticCatalog.find((entry) => entry.id === id))
    .filter((item): item is (typeof cosmeticCatalog)[number] => Boolean(item));
  const fullLook = activeItems.find(
    (item) => item.slot === "style" && item.assetPath,
  );
  const visibleLayers = fullLook
    ? []
    : activeItems.filter((item) => item.slot !== "style");
  const mascotName = mascot === "pinky" ? "Pinky" : "Sparky";
  return (
    <div
      className={`mascot-figure mascot-${mascot} mascot-${size}${fullLook ? " mascot-with-full-look" : ""}`}
    >
      <Image
        src={fullLook?.assetPath ?? (mascot === "pinky" ? "/visuals/pinky-mascot.png" : "/visuals/sparky-panda.png")}
        alt={decorative ? "" : fullLook ? `${mascotName} com ${fullLook.name}` : mascotName}
        width={512}
        height={512}
      />
      {visibleLayers.map((item) => (
        <span
          key={item.id}
          className={`cosmetic-layer ${item.className}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

const wardrobeFilters: Array<{ id: "all" | CosmeticCategory; label: string }> = [
  { id: "all", label: "Tudo" },
  { id: "looks", label: "Looks completos" },
  { id: "head", label: "Cabeça e rosto" },
  { id: "clothing", label: "Roupas e acessórios" },
];

export function MascotStudio({
  reward,
  busy,
  onAction,
}: {
  reward: PublicRewardState;
  busy: boolean;
  onAction: (action: RewardAction) => Promise<boolean>;
}) {
  const [confirmItem, setConfirmItem] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | CosmeticCategory>("all");
  const mascot = reward.mascot;
  const mascotName = mascot === "sparky" ? "Sparky" : "Pinky";
  const currentLook = cosmeticCatalog.find(
    (item) =>
      item.slot === "style" && reward.equipped[mascot].style === item.id,
  );
  const filteredItems = cosmeticCatalog.filter(
    (item) =>
      item.mascots.includes(mascot) && (filter === "all" || item.category === filter),
  );
  return (
    <section className="mascot-studio" aria-labelledby="mascot-studio-title">
      <header className="studio-header">
        <div>
          <p className="eyebrow">Guarda-roupa</p>
          <h2 id="mascot-studio-title">Seu companheiro de estudo</h2>
        </div>
        <span className="coin-balance" aria-label={`${reward.coins} moedas`}>
          <Coins size={18} /> {reward.coins}
        </span>
      </header>
      <div className="studio-main">
        <div className="mascot-preview">
          <MascotFigure mascot={mascot} equipped={reward.equipped} />
          <p>
            {mascot === "sparky"
              ? "Sparky estuda com calma e mantém o foco na próxima etapa."
              : "Pinky chegou para acompanhar suas práticas e revisões."}
          </p>
          {currentLook && (
            <p className="active-look-note" aria-live="polite">
              Look completo equipado: <strong>{currentLook.name}</strong>. Os acessórios
              individuais ficam guardados até você remover o look.
            </p>
          )}
        </div>
        <div className="mascot-selector" role="group" aria-label="Escolher mascote">
          {(["sparky", "pinky"] as const).map((choice) => (
            <button
              key={choice}
              type="button"
              className={mascot === choice ? "selected" : ""}
              aria-pressed={mascot === choice}
              disabled={busy}
              onClick={() => void onAction({ action: "select-mascot", mascot: choice })}
            >
              <MascotFigure
                mascot={choice}
                equipped={reward.equipped}
                size="small"
                decorative
              />
              <span>{choice === "sparky" ? "Sparky" : "Pinky"}</span>
              {mascot === choice && <Check size={16} />}
            </button>
          ))}
        </div>
      </div>
      <div className="reward-rules">
        <span><strong>+10</strong> primeira conclusão</span>
        <span><strong>+20</strong> módulo completo</span>
        <span><strong>+2</strong> revisão vencida · até 10/dia</span>
      </div>
      <div className="wardrobe-heading">
        <div>
          <p className="eyebrow">Monte do seu jeito</p>
          <h3>Looks prontos ou acessórios para combinar</h3>
          <p>Os itens são permanentes. Cada categoria mostra opções para {mascotName}.</p>
        </div>
        <span aria-live="polite">{filteredItems.length} opções</span>
      </div>
      <div className="wardrobe-filters" role="group" aria-label="Filtrar itens do guarda-roupa">
        {wardrobeFilters.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={filter === option.id}
            className={filter === option.id ? "selected" : ""}
            onClick={() => {
              setFilter(option.id);
              setConfirmItem(null);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="cosmetic-grid">
        {filteredItems.map((item) => {
          const owned = reward.owned.includes(item.id);
          const equipped = reward.equipped[mascot][item.slot] === item.id;
          const confirming = confirmItem === item.id;
          return (
            <article className={`cosmetic-card${item.assetPath ? " cosmetic-card-look" : ""}`} key={item.id}>
              {item.assetPath ? (
                <div className="cosmetic-look-thumbnail" aria-hidden="true">
                  <Image src={item.assetPath} alt="" width={160} height={160} sizes="80px" />
                </div>
              ) : (
                <div className={`cosmetic-swatch ${item.className}`} aria-hidden="true" />
              )}
              <div>
                <span className="cosmetic-category-label">
                  {item.category === "looks" ? "Look completo" : item.category === "head" ? "Cabeça e rosto" : "Acessório"}
                </span>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
              </div>
              {!owned ? (
                confirming ? (
                  <div className="purchase-confirmation">
                    <p>Usar {item.price} moedas?</p>
                    <button
                      type="button"
                      className="primary-button"
                      disabled={busy || reward.coins < item.price}
                      onClick={async () => {
                        if (await onAction({ action: "buy", itemId: item.id }))
                          setConfirmItem(null);
                      }}
                    >
                      Confirmar
                    </button>
                    <button type="button" className="text-button" onClick={() => setConfirmItem(null)}>
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={busy || reward.coins < item.price}
                    onClick={() => setConfirmItem(item.id)}
                  >
                    <ShoppingBag size={15} /> {item.price} moedas
                  </button>
                )
              ) : (
                <button
                  type="button"
                  className={equipped ? "secondary-button equipped" : "secondary-button"}
                  disabled={busy}
                  onClick={() =>
                    void onAction({
                      action: "equip",
                      mascot,
                      slot: item.slot,
                      itemId: equipped ? null : item.id,
                    })
                  }
                >
                  {equipped ? <><Check size={15} /> Remover</> : "Vestir"}
                </button>
              )}
            </article>
          );
        })}
      </div>
      <p className="wardrobe-note">
        Moedas são apenas virtuais, não expiram e não podem ser compradas ou transferidas.
      </p>
    </section>
  );
}
