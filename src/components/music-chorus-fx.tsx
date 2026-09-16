import type { CSSProperties } from 'react';

/** Position particles from media time: pause, seek and slow playback stay aligned. */
export default function MusicChorusFx({ active, clock, energy }: { active: boolean; clock: number; energy: number }) {
  const time = Math.max(0, clock);
  return <div className="clip-chorus-fx" data-active={active} aria-hidden="true" style={{ '--chorus-light': .12 + energy * .18 } as CSSProperties}>
    {Array.from({ length: 18 }, (_, i) => {
      const phase = ((time * (.025 + i % 4 * .004) + i * .618) % 1);
      return <i key={i} style={{ left: `${(i * 37 + 11) % 100}%`, top: `${94 - phase * 88}%`, opacity: Math.sin(phase * Math.PI) * .55, transform: `translateX(${Math.sin(time * .25 + i) * 14}px) scale(${.6 + energy * .5})` }} />;
    })}
  </div>;
}
