import { memo, useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { MusicLine } from '@/lib/music';
import { createMusifyEffectLookup } from '@/lib/music-runtime';

/** Decorative motion is sampled from audio time; pausing freezes every shape. */
export default memo(function MusifyIdentityFx({ id, lines, clock, active, energy }: {
  id: string; lines: MusicLine[]; clock: number; active: boolean; energy: number;
}) {
  const lookup = useMemo(() => createMusifyEffectLookup(id, lines), [id, lines]);
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const sync = () => setReduced(query.matches || connection?.saveData === true);
    sync(); query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  const effect = lookup(clock);
  if (!effect || !active || reduced) return null;
  const time = Math.max(0, clock);
  return <div className="musify-identity-fx" data-effect={effect} aria-hidden="true">
    {Array.from({ length: effect === 'wave' ? 22 : 10 }, (_, index) => {
      const phase = (time * (.018 + index % 3 * .004) + index * .618) % 1;
      const style = {
        left: `${(index * 37 + 7) % 100}%`, top: `${92 - phase * 80}%`,
        opacity: Math.sin(phase * Math.PI) * (effect === 'butterflies' ? .72 : .28),
        transform: `translateX(${Math.sin(time * .6 + index) * 22}px) rotate(${Math.sin(time * .32 + index) * 20}deg) scale(${.7 + energy * .4})`,
      } as CSSProperties;
      if (effect === 'wave') return <i key={index} className="musify-wave-bar" style={{ left: `${index / 22 * 100}%`, height: `${12 + Math.abs(Math.sin(time * .8 + index * .4)) * (35 + energy * 30)}%` }} />;
      return <svg key={index} className="musify-particle" style={style} viewBox="0 0 40 40" fill="none">
        {effect === 'butterflies' ? <>
          <g style={{ transformOrigin: '20px 20px', transform: `scaleX(${.55 + Math.abs(Math.sin(time * 5 + index)) * .45})` }}>
            <path d="M19 21C2 4 1 17 9 23C2 26 10 37 19 24M21 21C38 4 39 17 31 23C38 26 30 37 21 24" fill="currentColor" />
          </g><path d="M20 17v10m0-10-4-4m4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </> : effect === 'crown' ? <path d="m7 27-2-14 9 7 6-12 6 12 9-7-2 14H7Zm0 4h26" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          : effect === 'halo' ? <><circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth=".8" /><circle cx="20" cy="20" r="10" stroke="currentColor" strokeWidth=".6" strokeDasharray="2 5" /></>
          : effect === 'rain' ? <path d="M24 7 13 33" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          : effect === 'ribbon' ? <path d="M3 30C5 4 35 38 37 10M4 34C7 9 33 35 36 6" stroke="currentColor" strokeWidth="1" />
          : effect === 'storm' ? <path d="m24 4-15 19h11l-4 13 15-20H20l4-12Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          : effect === 'flowers' ? <><path d="M20 20C4 4 1 22 20 20C4 36 22 39 20 20C36 36 39 18 20 20C36 4 18 1 20 20Z" stroke="currentColor" strokeWidth="1.2" /><circle cx="20" cy="20" r="3" fill="currentColor" /></>
          : <path d="m20 4 4 12 12 4-12 4-4 12-4-12-12-4 12-4 4-12Z" fill="currentColor" />}
      </svg>;
    })}
  </div>;
});
