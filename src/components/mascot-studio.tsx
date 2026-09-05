"use client";

import Image from "next/image";
import { useState } from "react";
import { Check, Coins, ShoppingBag } from "lucide-react";
import {
  cosmeticCatalog,
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
  const activeIds = Object.values(equipped[mascot]);
  return (
    <div className={`mascot-figure mascot-${mascot} mascot-${size}`}>
      <Image
        src={
          mascot === "pinky"
            ? "/visuals/pinky-mascot.png"
            : "/visuals/sparky-panda.png"
        }
        alt={decorative ? "" : mascot === "pinky" ? "Pinky" : "Sparky"}
        width={512}
        height={512}
      />
      {activeIds.map((id) => {
        const item = cosmeticCatalog.find((entry) => entry.id === id);
        return item ? (
          <span
            key={item.id}
            className={`cosmetic-layer ${item.className}`}
            aria-hidden="true"
          />
        ) : null;
      })}
    </div>
  );
}

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
  const mascot = reward.mascot;
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
      <div className="cosmetic-grid">
        {cosmeticCatalog.map((item) => {
          const owned = reward.owned.includes(item.id);
          const compatible = item.mascots.includes(mascot);
          const equipped = reward.equipped[mascot][item.slot] === item.id;
          const confirming = confirmItem === item.id;
          return (
            <article className="cosmetic-card" key={item.id}>
              <div className={`cosmetic-swatch ${item.className}`} aria-hidden="true" />
              <div>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
              </div>
              {!owned ? (
                confirming ? (
                  <div className="purchase-confirmation">
                    <p>Usar {item.price} moedas?</p>
                    <button
                      className="primary-button"
                      disabled={busy || reward.coins < item.price}
                      onClick={async () => {
                        if (await onAction({ action: "buy", itemId: item.id }))
                          setConfirmItem(null);
                      }}
                    >
                      Confirmar
                    </button>
                    <button className="text-button" onClick={() => setConfirmItem(null)}>
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    className="secondary-button"
                    disabled={busy || reward.coins < item.price}
                    onClick={() => setConfirmItem(item.id)}
                  >
                    <ShoppingBag size={15} /> {item.price} moedas
                  </button>
                )
              ) : !compatible ? (
                <span className="compatibility-note">Não serve em {mascot === "sparky" ? "Sparky" : "Pinky"}</span>
              ) : (
                <button
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
