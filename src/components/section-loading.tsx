"use client";

import { t } from "@/lib/interface-language";

export function SectionLoading({ label = "Abrindo seu espaço de estudo…" }: { label?: string }) {
  return (
    <section className="section-loading" role="status" aria-live="polite" aria-busy="true">
      <span className="section-loading-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <p>{t(label)}</p>
    </section>
  );
}
