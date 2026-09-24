import Image from "next/image";
import { Check } from "lucide-react";
import type { MascotId } from "@/lib/rewards-shared";

export function LessonCompletionMascot({ mascot }: { mascot: MascotId }) {
  return (
    <div className="lesson-completion-mascot" aria-hidden="true" data-mascot={mascot}>
      <span className="lesson-completion-page" />
      <Image
        src={`/motion/lesson-complete-${mascot}.png`}
        alt=""
        fill
        priority
        sizes="(max-width: 600px) 80vw, 360px"
      />
      <span className="lesson-completion-seal"><Check size={26} strokeWidth={2.6} /></span>
    </div>
  );
}
