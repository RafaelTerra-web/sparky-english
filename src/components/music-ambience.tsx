import { memo } from 'react';
import type { MusicLine } from '@/lib/music';

// Decorative transcript; accessible full lyrics remain in the Letra tab.
// Stable keyed rows move inside a clipped stage, never by scrolling the page.
export default memo(function MusicAmbience({ lines, index, visible }: { lines: MusicLine[]; index: number; visible: boolean }) {
  return <div className="clip-ambient" aria-hidden="true" data-visible={visible && index >= 0} data-line={index} lang="en">
    {lines.slice(Math.max(0, index - 2), index + 1).map((line, i, recent) =>
      <p key={line.id} style={{ transform: `translateY(${(i - recent.length + 1) * 100}%)` }}>{line.text}</p>,
    )}
  </div>;
});
