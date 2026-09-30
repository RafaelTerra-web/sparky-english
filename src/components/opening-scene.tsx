"use client";

import SparkyLoadingMark from "./sparky-loading-mark";

export default function OpeningScene({ leaving }: { leaving: boolean }) {
  return (
    <section className={`opening-scene${leaving ? " is-leaving" : ""}`} aria-hidden={leaving}>
      <SparkyLoadingMark />
    </section>
  );
}
