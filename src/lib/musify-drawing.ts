/** Lightweight, deterministic choreography. Every position comes from media time. */
export type MusifySceneDefinition = {
  scene: string;
  accent: string;
  secondary: string;
  background: string;
  semanticConcepts: readonly string[];
};

export const musifySceneDefinitions: Record<string, MusifySceneDefinition> = {
  'still-into-you': { scene: 'butterfly-ribbons', accent: '#ffa9d0', secondary: '#ffe18b', background: '#211426', semanticConcepts: ['butterfly'] },
  'do-i-wanna-know': { scene: 'midnight-duet', accent: '#9edbe8', secondary: '#617cad', background: '#0c1724', semanticConcepts: [] },
  'she-knows': { scene: 'secret-shutters', accent: '#ef9baf', secondary: '#9f3557', background: '#1d111b', semanticConcepts: [] },
  'made-for-loving-you': { scene: 'disco-convergence', accent: '#f0ca7c', secondary: '#e295cf', background: '#241527', semanticConcepts: [] },
  'savage': { scene: 'assertive-cutouts', accent: '#ffb1ec', secondary: '#e448a0', background: '#26142c', semanticConcepts: [] },
  'out-of-order': { scene: 'magnetic-orbits', accent: '#c4b4ff', secondary: '#8267db', background: '#14182c', semanticConcepts: [] },
  'king-for-a-day': { scene: 'fractured-panels', accent: '#edb397', secondary: '#d95748', background: '#171925', semanticConcepts: [] },
  'perfect-local': { scene: 'paired-waltz', accent: '#edbd82', secondary: '#82a9cf', background: '#110d0c', semanticConcepts: [] },
  'heartless-local': { scene: 'changing-mirrors', accent: '#839cdf', secondary: '#edbbad', background: '#090c13', semanticConcepts: [] },
  'stay-at-your-house-local': { scene: 'distant-windows', accent: '#71e7ed', secondary: '#ed79c4', background: '#090e1e', semanticConcepts: [] },
  'buttercup-local': { scene: 'elastic-doodles', accent: '#e0ad46', secondary: '#b6c577', background: '#110d15', semanticConcepts: ['flower', 'buttercup'] },
};

const fallback: MusifySceneDefinition = { scene: 'quiet-orbits', accent: '#79d9bd', secondary: '#a4cbe1', background: '#10261e', semanticConcepts: [] };

export function musifySceneDefinition(id: string): MusifySceneDefinition {
  return musifySceneDefinitions[id] ?? fallback;
}

export function musifyConcept(value: string): string {
  const word = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
  if (['butterflies', 'butterfly', 'borboletas', 'borboleta'].includes(word)) return 'butterfly';
  if (['flowers', 'flower', 'flores', 'flor'].includes(word)) return 'flower';
  if (['buttercups', 'buttercup'].includes(word)) return 'buttercup';
  return word;
}

export function musifySemanticSuppressed(id: string, hiddenConcepts: readonly string[]): boolean {
  const concepts = musifySceneDefinition(id).semanticConcepts;
  return hiddenConcepts.some(value => concepts.includes(musifyConcept(value)));
}

export type MusifyProtectedRect = { x: number; y: number; width: number; height: number };

/** Clip protected rectangles to the drawing surface, including text safety space. */
export function musifyProtectedRect(
  item: { left: number; top: number; width: number; height: number },
  stage: { left: number; top: number; width: number; height: number },
  padding = 8,
): MusifyProtectedRect | null {
  if (item.width <= 0 || item.height <= 0 || stage.width <= 0 || stage.height <= 0) return null;
  const x = Math.max(0, item.left - stage.left - padding);
  const y = Math.max(0, item.top - stage.top - padding);
  const right = Math.min(stage.width, item.left - stage.left + item.width + padding);
  const bottom = Math.min(stage.height, item.top - stage.top + item.height + padding);
  return right > x && bottom > y ? { x, y, width: right - x, height: bottom - y } : null;
}

export type MusifyDrawingFrame = {
  id: string;
  time: number;
  duration: number;
  transformationAt?: number;
  width: number;
  height: number;
  beat: number;
  section: { kind: string; intensity: number } | null;
  cue: string | null;
  answering: boolean;
  quality: 'normal' | 'low';
  reduced: boolean;
  static?: boolean;
  hiddenConcepts: readonly string[];
};

export function musifyMotionSample(time: number, index: number, speed = 1): number {
  return Math.sin((Number.isFinite(time) ? Math.max(0, time) : 0) * speed + index * 2.399963229728653);
}

export function musifyDrawingIntensity(frame: Pick<MusifyDrawingFrame, 'section' | 'answering' | 'reduced'>): number {
  const authored = frame.section?.intensity ?? .42;
  const intensity = Number.isFinite(authored) ? Math.max(.16, Math.min(1, authored)) : .42;
  return intensity * (frame.answering ? .5 : 1) * (frame.reduced ? .38 : 1);
}

type Point = [number, number];
function path(ctx: CanvasRenderingContext2D, points: readonly Point[], color: string, alpha: number, width = 1.2, fill = false) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.globalAlpha = alpha;
  if (fill) { ctx.closePath(); ctx.fillStyle = color; ctx.fill(); }
  else { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke(); }
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, alpha: number, fill = true) {
  ctx.beginPath(); ctx.arc(x, y, Math.max(.1, radius), 0, Math.PI * 2);
  ctx.globalAlpha = alpha;
  if (fill) { ctx.fillStyle = color; ctx.fill(); }
  else { ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.stroke(); }
}

function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rotation: number, color: string, alpha: number) {
  ctx.beginPath(); ctx.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rotation, 0, Math.PI * 2);
  ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.globalAlpha = alpha; ctx.stroke();
}

function butterfly(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, angle: number, flap: number, color: string, alpha: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(size, size);
  ctx.globalAlpha = alpha; ctx.fillStyle = color;
  ctx.scale(.45 + .5 * Math.abs(flap), 1);
  ctx.beginPath();
  ctx.moveTo(0, 1); ctx.bezierCurveTo(-20, -23, -22, -3, -7, 3); ctx.bezierCurveTo(-20, 12, -8, 19, 0, 5);
  ctx.bezierCurveTo(8, 19, 20, 12, 7, 3); ctx.bezierCurveTo(22, -3, 20, -23, 0, 1);
  ctx.fill(); ctx.restore();
}

/** No randomness, text, WebGL, shaders or DOM layout work occurs in this renderer. */
export function drawMusifyScene(ctx: CanvasRenderingContext2D, frame: MusifyDrawingFrame): void {
  const { width: w, height: h } = frame;
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return;
  const identity = musifySceneDefinition(frame.id);
  const t = frame.static ? 0 : Number.isFinite(frame.time) ? Math.max(0, frame.time) * (frame.reduced ? .35 : 1) : 0;
  const intensity = musifyDrawingIntensity(frame);
  const chorus = frame.section?.kind === 'chorus';
  const beat = frame.reduced ? 0 : Math.max(0, Math.min(1, Number.isFinite(frame.beat) ? frame.beat : 0));
  const alpha = (.18 + intensity * .46) * (frame.reduced ? .65 : 1);
  const count = frame.quality === 'low' || frame.reduced ? 5 : chorus ? 11 : 8;
  const { accent: a, secondary: b } = identity;
  const scale = Math.min(w / 390, h / 650, 1.7);
  const blocked = musifySemanticSuppressed(frame.id, frame.hiddenConcepts);
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  switch (identity.scene) {
    case 'butterfly-ribbons': {
      // The ribbons interlock; butterflies are lyric cues, never background clues.
      for (let side = 0; side < 2; side++) {
        ctx.beginPath();
        for (let i = 0; i <= 48; i++) {
          const y = h * i / 48;
          const spread = chorus ? .21 : .13;
          const x = w * (.5 + Math.sin(i * .15 + t * .17 + side * Math.PI) * spread);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = side ? b : a; ctx.globalAlpha = alpha * .62; ctx.lineWidth = (1.3 + beat * 1.1) * scale; ctx.stroke();
      }
      if (frame.cue === 'butterflies' && !blocked && !frame.reduced) {
        for (let i = 0; i < count; i++) {
          const p = (t * .044 + i * .6180339) % 1;
          const x = w * (.5 + Math.sin(p * Math.PI * 2 + i) * (.31 + (chorus ? .08 : 0)));
          const y = h * (.87 - p * .75);
          butterfly(ctx, x, y, (.58 + beat * .13) * scale, Math.sin(t * .8 + i) * .38, Math.sin(t * 5 + i), i % 3 ? a : b, alpha * Math.sin(p * Math.PI));
        }
      }
      for (let i = 0; i < (chorus ? 5 : 3); i++) {
        const angle = t * .16 + i * 2.1;
        circle(ctx, w * (.5 + Math.cos(angle) * .42), h * (.5 + Math.sin(angle) * .42), (2 + beat * 2) * scale, b, alpha * .45);
      }
      break;
    }
    case 'midnight-duet': {
      // Two independently phrased signals almost meet, then drift apart again.
      for (let voice = 0; voice < 2; voice++) {
        ctx.beginPath();
        for (let i = 0; i <= 72; i++) {
          const x = w * i / 72;
          const envelope = Math.sin(i / 72 * Math.PI);
          const separation = (frame.cue === 'connection' ? .06 : .12) + Math.sin(t * .09) * .035;
          const y = h * (.5 + (voice ? separation : -separation)) + Math.sin(i * .24 - t * (.7 + voice * .09)) * envelope * (18 + intensity * 28 + beat * 10) * scale;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = voice ? b : a; ctx.lineWidth = (chorus ? 2.2 : 1.3) * scale; ctx.globalAlpha = alpha; ctx.stroke();
      }
      for (let i = 0; i < 4; i++) ellipse(ctx, w * (.08 + i * .29), h * .66, (10 + beat * 5) * scale, (32 + i * 8) * scale, t * .015, a, alpha * .15);
      break;
    }
    case 'secret-shutters': {
      const blades = frame.quality === 'low' ? 6 : 10;
      for (let i = 0; i < blades; i++) {
        const y = h * (i + .5) / blades;
        const openness = (1 + Math.sin(t * .22 + i * .8)) / 2;
        const tilt = (chorus ? 21 : 9) * scale;
        const slit = (2 + openness * (chorus || frame.cue === 'secrets' ? 12 : 6) + beat * 2) * scale;
        path(ctx, [[-20, y - tilt], [w + 20, y + tilt], [w + 20, y + tilt + slit], [-20, y - tilt + slit]], i % 2 ? b : a, alpha * (.35 + openness * .35), 1, true);
      }
      const opening = .1 + (.5 + Math.sin(t * .13) * .5) * .35;
      path(ctx, [[0, h * .22], [w * opening, h * .03], [w * opening * .42, h * .6]], a, alpha * .18, 1, true);
      path(ctx, [[w, h * .75], [w * (1 - opening), h * .26], [w * (1 - opening * .35), h]], b, alpha * .2, 1, true);
      break;
    }
    case 'disco-convergence': {
      const horizon = h * .58;
      const convergence = w * (.5 + Math.sin(t * .12) * .08);
      const columns = frame.quality === 'low' ? 5 : 8;
      const rows = frame.quality === 'low' ? 4 : 6;
      for (let row = 0; row < rows; row++) {
        const near = (row / rows) ** 2;
        const far = ((row + 1) / rows) ** 2;
        for (let column = 0; column < columns; column++) {
          const left = (column / columns - .5) * w * 1.55;
          const right = ((column + 1) / columns - .5) * w * 1.55;
          const lit = .22 + Math.max(0, Math.sin(t * 1.4 + column * 1.7 + row * .6)) * .45 + beat * .1;
          path(ctx, [[convergence + left * near, horizon + (h - horizon) * near], [convergence + right * near, horizon + (h - horizon) * near], [convergence + right * far, horizon + (h - horizon) * far], [convergence + left * far, horizon + (h - horizon) * far]], (row + column) % 2 ? a : b, alpha * lit * .45, 1, true);
        }
      }
      for (let i = 0; i < 2; i++) {
        const source = i ? w * .94 : w * .06;
        const center = w * (.5 + Math.sin(t * .18 + i * Math.PI) * (chorus || frame.cue === 'spotlight' ? .1 : .22));
        path(ctx, [[source, 0], [center - w * .17, h * .88], [center + w * .17, h * .88]], i ? b : a, alpha * .14, 1, true);
        ellipse(ctx, center, h * .88, w * .17, 13 * scale, 0, a, alpha * .5);
      }
      break;
    }
    case 'assertive-cutouts': {
      const step = Math.floor(t * .7);
      const settle = Math.min(1, (t * .7 - step) * 5);
      for (let i = 0; i < count; i++) {
        const side = i % 2 ? 1 : -1;
        const y = h * (.1 + i / count * .82);
        const reach = w * (.08 + intensity * .08 + beat * (frame.cue === 'strike' ? .05 : .025));
        const offset = musifyMotionSample(step, i, .83) * 14 * scale * settle;
        const edge = side > 0 ? w : 0;
        const tip = edge - side * reach;
        path(ctx, [[edge, y - 26 * scale + offset], [tip, y - 13 * scale + offset], [tip - side * 16 * scale, y + 17 * scale + offset], [edge, y + 8 * scale + offset]], i % 3 ? a : b, alpha * .25, 1, true);
        path(ctx, [[edge - side * 4, y - 28 * scale + offset], [tip - side * 8, y - 14 * scale + offset]], a, alpha * .8, (1.8 + beat * 1.2) * scale);
      }
      path(ctx, [[w * .13, h * .93], [w * .36, h * .83], [w * .65, h * .86], [w * .86, h * .74]], b, alpha * .32, 2 * scale);
      break;
    }
    case 'magnetic-orbits': {
      const tug = .05 * Math.sin(t * .34);
      const cx = w * (.5 + tug);
      const cy = h * .54;
      const orbits = frame.quality === 'low' ? 3 : chorus ? 7 : 4;
      for (let i = 0; i < orbits; i++) {
        const angle = i * .43 + Math.sin(t * .07 + i) * .15;
        const rx = w * ((frame.cue === 'magnet' ? .18 : .22) + i * .035 + beat * .012);
        const ry = h * (.09 + i * .022);
        ellipse(ctx, cx, cy, rx, ry, angle, i % 2 ? b : a, alpha * (.6 - i * .04));
        const travel = t * (.19 + i * .029) + i * 2.4;
        const x = cx + Math.cos(travel) * rx * Math.cos(angle) - Math.sin(travel) * ry * Math.sin(angle);
        const y = cy + Math.cos(travel) * rx * Math.sin(angle) + Math.sin(travel) * ry * Math.cos(angle);
        circle(ctx, x, y, (2.2 + beat * 1.3) * scale, a, alpha);
      }
      const spread = w * ((frame.cue === 'tension' ? .34 : .27) - Math.sin(t * .2) * .065);
      for (let i = 0; i < 3; i++) {
        const angle = t * .1 + i * Math.PI * 2 / 3;
        const x = cx + Math.cos(angle) * spread;
        const y = cy + Math.sin(angle) * h * .23;
        path(ctx, [[cx, cy], [x, y]], b, alpha * .25);
        circle(ctx, x, y, (5 + beat * 2) * scale, a, alpha * .7, false);
      }
      break;
    }
    case 'fractured-panels': {
      const seams = frame.quality === 'low' ? 4 : chorus ? 9 : 6;
      for (let i = 0; i < seams; i++) {
        const side = i % 2 ? 1 : -1;
        const x = side > 0 ? w : 0;
        const y = h * (.12 + i / seams * .75);
        const split = (5 + intensity * 16 + beat * (frame.cue === 'rupture' ? 15 : 8)) * scale;
        const reach = w * (.16 + (chorus ? .1 : 0));
        const displacement = Math.sin(t * .12 + i) * 5 * scale;
        const points: Point[] = [[x, y], [x - side * reach * .36, y + 18 * scale], [x - side * reach * .48, y - 8 * scale], [x - side * reach * .7, y + 24 * scale], [x - side * reach, y + displacement]];
        path(ctx, points.map(([px, py]) => [px, py + split] as Point), b, alpha * .23, 2.5 * scale);
        path(ctx, points, a, alpha * .88, (1 + beat * 1.8) * scale);
        path(ctx, [[x, y - 42 * scale], [x - side * reach * .28, y - 18 * scale], [x - side * reach * .4, y - 39 * scale]], b, alpha * .32, 1.1 * scale);
      }
      break;
    }
    case 'paired-waltz': {
      const phase = t * (frame.cue === 'dance' ? .3 : .24);
      const turns = frame.quality === 'low' ? 2 : 4;
      for (let i = 0; i < turns; i++) {
        const rx = w * (.26 + i * .025);
        const ry = h * (.27 - i * .02);
        ellipse(ctx, w * .5, h * .52, rx, ry, -.22 + Math.sin(t * .02) * .12, i % 2 ? b : a, alpha * .2);
      }
      for (let partner = 0; partner < 2; partner++) {
        const orbit = phase + partner * Math.PI;
        for (let trail = frame.quality === 'low' ? 4 : 9; trail >= 0; trail--) {
          const angle = orbit - trail * .07;
          const x = w * (.5 + Math.cos(angle) * (.31 + Math.sin(phase * .5) * .025));
          const y = h * (.52 + Math.sin(angle) * .29);
          circle(ctx, x, y, (trail === 0 ? 4 + beat * 1.3 : 1.7) * scale, partner ? b : a, alpha * (1 - trail / 12));
        }
      }
      if (chorus) for (let i = 0; i < count; i++) circle(ctx, w * (.5 + musifyMotionSample(t, i, .05) * .44), h * (.52 + musifyMotionSample(t, i + 3, .06) * .42), (1 + .7 * Math.sin(t * .3 + i) ** 2) * scale, a, alpha * .4);
      break;
    }
    case 'changing-mirrors': {
      // The latter choruses turn the formerly warm reflections cold and angular.
      const storyTime = Number.isFinite(frame.time) ? Math.max(0, frame.time) : 0;
      const transformed = storyTime >= (frame.transformationAt ?? frame.duration * .8);
      const color = transformed ? a : b;
      const shards = frame.quality === 'low' ? 5 : 9;
      const opening = (chorus ? 12 : 4) * scale + beat * 6 * scale;
      for (let i = 0; i < shards; i++) {
        const side = i % 2 ? 1 : -1;
        const x = side > 0 ? w - opening : opening;
        const y = h * (.08 + i / shards * .88);
        const reach = w * (.14 + (transformed ? .05 : 0));
        const drift = Math.sin(t * .15 + i) * 7 * scale;
        const polygon: Point[] = [[x, y - 30 * scale], [x - side * reach, y - 5 * scale + drift], [x - side * reach * .7, y + 34 * scale], [x, y + 22 * scale]];
        path(ctx, polygon, color, alpha * .14, 1, true);
        path(ctx, [...polygon, polygon[0]], color, alpha * .7, (transformed ? 1.7 : .8) * scale);
        path(ctx, [[x - side * 4 * scale, y - 18 * scale], [x - side * reach * .62, y + 15 * scale]], transformed ? b : a, alpha * .25);
      }
      if (frame.section?.kind === 'narrative') {
        ellipse(ctx, w * .22, h * .48, w * .16, h * .21, -.2, b, alpha * .32);
        ellipse(ctx, w * .78, h * .48, w * .16, h * .21, .2, a, alpha * .32);
      }
      break;
    }
    case 'distant-windows': {
      const skyline = h * .68;
      const buildings = frame.quality === 'low' ? 6 : 11;
      for (let i = 0; i < buildings; i++) {
        const x = w * i / buildings;
        const bw = w / buildings * .76;
        const height = h * (.09 + (Math.sin(i * 1.9) + 1) * .085);
        path(ctx, [[x, skyline], [x, skyline - height], [x + bw, skyline - height], [x + bw, skyline]], i % 2 ? b : a, alpha * .28);
        for (let row = 0; row < 4; row++) {
          const light = .2 + Math.max(0, Math.sin(i * 2.2 + row + t * .12)) * .6;
          ctx.fillStyle = (i + row) % 3 ? a : b; ctx.globalAlpha = alpha * light;
          ctx.fillRect(x + bw * .24, skyline - height + row * height / 5 + 4, Math.max(1, bw * .18), 2 * scale);
        }
      }
      const perspective = chorus || frame.cue === 'neon' ? .44 : .32;
      for (let i = 0; i < (frame.quality === 'low' ? 4 : 8); i++) {
        const p = (t * .045 + i / 8) % 1;
        const side = i % 2 ? 1 : -1;
        const x = w * (.5 + side * perspective * p ** 1.5);
        const y = skyline + (h - skyline) * p ** 2;
        path(ctx, [[x, y], [x + side * 15 * scale * p, y + 5 * scale]], i % 3 ? a : b, alpha * p, (1 + beat) * scale);
      }
      for (let i = 0; i < 2; i++) path(ctx, [[w * (i ? .9 : .1), h * .16], [w * (i ? .8 : .2), h * .29]], i ? b : a, alpha * .38, 1.5 * scale);
      break;
    }
    case 'elastic-doodles': {
      const blobs = frame.quality === 'low' ? 4 : chorus ? 9 : 6;
      for (let i = 0; i < blobs; i++) {
        const x = w * (.09 + i % 3 * .4 + Math.sin(t * .18 + i) * .04);
        const y = h * (.18 + Math.floor(i / 3) * .28 + Math.cos(t * .2 + i) * .045);
        const r = (12 + i % 3 * 5 + beat * 3) * scale;
        ctx.beginPath();
        for (let k = 0; k <= 40; k++) {
          const angle = k / 40 * Math.PI * 2;
          // A masked flower becomes a neutral elastic oval, not a visible synonym.
          const lobes = blocked ? 1 : frame.cue === 'flowers' ? 4 : 2;
          const radius = r * (1 + Math.sin(angle * lobes + t * .6 + i) * (blocked ? .12 : .28));
          const px = x + Math.cos(angle) * radius;
          const py = y + Math.sin(angle) * radius * (.78 + .13 * Math.sin(t * .4 + i));
          if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = i % 2 ? a : b; ctx.globalAlpha = alpha * .65; ctx.lineWidth = 1.6 * scale; ctx.stroke();
        if (!blocked && frame.cue === 'flowers') circle(ctx, x, y, 2.2 * scale, a, alpha * .5);
      }
      break;
    }
    default: {
      for (let i = 0; i < 3; i++) ellipse(ctx, w * .5, h * .53, w * (.2 + i * .04), h * (.12 + i * .035), t * .03 + i * .4, a, alpha * .4);
    }
  }
  ctx.restore();
}
