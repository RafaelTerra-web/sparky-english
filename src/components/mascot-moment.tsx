import Image from 'next/image';
import type { MascotId } from '@/lib/rewards-shared';

export type MascotMood = 'invite' | 'listen' | 'celebrate';

export default function MascotMoment({ mascot, mood, className = '', alt = '', loading = 'eager' }: { mascot: MascotId; mood: MascotMood; className?: string; alt?: string; loading?: 'eager' | 'lazy' }) {
  return <Image
    className={className}
    src={`/visuals/expressions/${mascot}-${mood}.png`}
    alt={alt}
    width={1280}
    height={1280}
    sizes="(max-width: 700px) 144px, 220px"
    loading={loading}
  />;
}
