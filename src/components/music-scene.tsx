"use client";

import { useEffect, useRef } from 'react';

/** Decorative only: never connects to or modifies the audio graph. */
export default function MusicScene({ playing, clock, tone = 'emerald', energy = .35, chorus = false }: { playing: boolean; clock?: number; tone?: 'emerald' | 'violet'; energy?: number; chorus?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const motion = useRef({ playing, clock, energy, chorus });
  const synchronize = useRef<(() => void) | null>(null);
  useEffect(() => { motion.current = { playing, clock, energy, chorus }; synchronize.current?.(); }, [playing, clock, energy, chorus]);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let cancelled = false;
    let dispose: (() => void) | undefined;
    void import('three').then(THREE => {
      if (cancelled) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' });
        if (!context) return;
        renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
      } catch { return; }
      const geometries: InstanceType<typeof THREE.BufferGeometry>[] = [];
      const materials: InstanceType<typeof THREE.Material>[] = [];
      const geometry = <T extends InstanceType<typeof THREE.BufferGeometry>>(value: T) => { geometries.push(value); return value; };
      const material = <T extends InstanceType<typeof THREE.Material>>(value: T) => { materials.push(value); return value; };
      const accent = tone === 'violet' ? 0xe9a0ff : 0x9ef9cd;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(36, 1, .1, 50);
      camera.position.z = 5;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setClearColor(0x000000, 0);
      element.appendChild(renderer.domElement);
      element.dataset.renderer = 'webgl';
      const disc = new THREE.Group();
      scene.add(disc);
      const body = new THREE.Mesh(geometry(new THREE.CylinderGeometry(1.06, 1.06, .055, 80)), material(new THREE.MeshStandardMaterial({ color: 0x121e25, metalness: .8, roughness: .27 })));
      body.rotation.x = Math.PI / 2;
      disc.add(body);
      const grooveMaterial = material(new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: .2 }));
      for (let r = .43; r < 1.04; r += .055) {
        const points = Array.from({ length: 96 }, (_, i) => new THREE.Vector3(Math.cos(i / 96 * Math.PI * 2) * r, Math.sin(i / 96 * Math.PI * 2) * r, .031));
        disc.add(new THREE.LineLoop(geometry(new THREE.BufferGeometry().setFromPoints(points)), grooveMaterial));
      }
      const label = new THREE.Mesh(geometry(new THREE.RingGeometry(.06, .36, 64)), material(new THREE.MeshStandardMaterial({ color: accent, metalness: .55, roughness: .35, side: THREE.DoubleSide })));
      label.position.z = .034;
      disc.add(label);
      const arc = new THREE.Mesh(geometry(new THREE.TorusGeometry(1.09, .012, 8, 100, Math.PI * 1.45)), material(new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: .8 })));
      disc.add(arc);
      const orbit = new THREE.Group();
      scene.add(orbit);
      const orbitMaterial = material(new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: .15 }));
      const orbitGeometry = geometry(new THREE.TorusGeometry(1.42, .006, 6, 100));
      for (let i = 0; i < 2; i++) { const ring = new THREE.Mesh(orbitGeometry, orbitMaterial); ring.rotation.set(.45 + i * .55, .15, i * .8); orbit.add(ring); }
      const positions = new Float32Array(120 * 3);
      for (let i = 0; i < 120; i++) {
        const angle = i * 2.399963, radius = 1.3 + (i % 13) / 10;
        positions.set([Math.cos(angle) * radius, Math.sin(angle) * radius, Math.sin(i * 17) * .6], i * 3);
      }
      const particleGeometry = geometry(new THREE.BufferGeometry());
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particles = new THREE.Points(particleGeometry, material(new THREE.PointsMaterial({ color: accent, size: .018, transparent: true, opacity: .55, depthWrite: false })));
      scene.add(particles);
      scene.add(new THREE.AmbientLight(0xffffff, 2));
      const key = new THREE.DirectionalLight(0xffffff, 4); key.position.set(-2, 3, 4); scene.add(key);
      const fill = new THREE.PointLight(accent, 12); fill.position.set(2, -1, 2); scene.add(fill);
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
      let visible = true, running = false, lost = false, lastFrame = 0;
      function draw(timestamp: number) {
        if (lost || cancelled) return;
        if (running && timestamp - lastFrame < 1000 / 30) return;
        lastFrame = timestamp;
        const time = reduced.matches ? 0 : (motion.current.clock ?? timestamp / 1000);
        const intensity = reduced.matches ? .35 : motion.current.energy;
        const refrain = motion.current.chorus ? .12 : 0;
        orbit.scale.setScalar(1 + intensity * .06 + refrain);
        orbitMaterial.opacity = .1 + intensity * .12 + refrain;
        particles.material.opacity = .25 + intensity * .3 + refrain;
        particles.material.size = .018 + (motion.current.chorus ? .018 : 0);
        fill.intensity = 8 + intensity * 6 + (motion.current.chorus ? 5 : 0);
        disc.rotation.set(.15 + Math.sin(time * .17) * .09, -.38, time * .09);
        orbit.rotation.z = -time * .035;
        particles.rotation.z = time * .014;
        renderer.render(scene, camera);
      }
      function sync() {
        const active = motion.current.playing && !document.hidden && visible && !reduced.matches && !lost;
        if (running !== active) { running = active; renderer.setAnimationLoop(active ? draw : null); }
        // A changing media clock must not redraw a static reduced-motion scene.
        if (!active && !document.hidden && visible && (!reduced.matches || lastFrame === 0)) draw(performance.now());
      }
      synchronize.current = sync;
      const resize = new ResizeObserver(() => {
        const { width, height } = element.getBoundingClientRect();
        if (width < 1 || height < 1) return;
        renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
        lastFrame = 0; draw(performance.now());
      });
      resize.observe(element);
      const visibility = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); });
      visibility.observe(element);
      const contextLost = () => { lost = true; renderer.setAnimationLoop(null); element.dataset.renderer = 'static'; };
      renderer.domElement.addEventListener('webglcontextlost', contextLost);
      document.addEventListener('visibilitychange', sync);
      reduced.addEventListener('change', sync);
      sync();
      dispose = () => {
        synchronize.current = null; renderer.setAnimationLoop(null); resize.disconnect(); visibility.disconnect();
        document.removeEventListener('visibilitychange', sync); reduced.removeEventListener('change', sync);
        renderer.domElement.removeEventListener('webglcontextlost', contextLost);
        geometries.forEach(value => value.dispose()); materials.forEach(value => value.dispose());
        renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
      };
    }).catch(() => { /* The CSS disc remains available without WebGL. */ });
    return () => { cancelled = true; dispose?.(); };
  }, [tone]);
  return <div ref={host} className="music-scene" data-tone={tone} data-renderer="static" aria-hidden="true"><div className="music-scene-fallback" /></div>;
}
