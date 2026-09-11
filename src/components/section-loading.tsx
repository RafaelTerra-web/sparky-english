"use client";

import { MotionLoader } from "./motion-pack";

export function SectionLoading({ label = "Abrindo seu espaço de estudo…" }: { label?: string }) {
  return <section className="section-loading"><MotionLoader label={label} /></section>;
}
