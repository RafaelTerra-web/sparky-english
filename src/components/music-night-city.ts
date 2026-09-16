import type * as Three from 'three';

/** Instanced architecture and media-clock weather; no wall-clock simulation. */
export function createNightCity(THREE: typeof Three) {
  const group = new THREE.Group();
  const geometries: Three.BufferGeometry[] = [];
  const materials: Three.Material[] = [];
  const textures: Three.Texture[] = [];
  const geo = <T extends Three.BufferGeometry>(value: T) => { geometries.push(value); return value; };
  const mat = <T extends Three.Material>(value: T) => { materials.push(value); return value; };
  const box = geo(new THREE.BoxGeometry(1, 1, 1));
  const plane = geo(new THREE.PlaneGeometry(1, 1));
  const cyan = mat(new THREE.MeshBasicMaterial({ color: 0x42dce7, transparent: true, opacity: .6 }));
  const pink = mat(new THREE.MeshBasicMaterial({ color: 0xf35b9c, transparent: true, opacity: .65 }));
  const amber = mat(new THREE.MeshBasicMaterial({ color: 0xffc96c, transparent: true, opacity: .65 }));
  const lights = [cyan, pink, amber].map(material => new THREE.InstancedMesh(plane, material, 768));
  const counts = [0, 0, 0];
  const transform = new THREE.Object3D();
  function instance(mesh: Three.InstancedMesh, index: number, x: number, y: number, z: number, w: number, h: number, d = 1) {
    transform.position.set(x, y, z); transform.scale.set(w, h, d); transform.rotation.set(0, 0, 0); transform.updateMatrix();
    mesh.setMatrixAt(index, transform.matrix);
  }
  function light(color: number, x: number, y: number, z: number, w: number, h: number) {
    instance(lights[color], counts[color]++, x, y, z, w, h);
  }
  // Three districts: small distant windows, stepped middle towers and tall edges.
  for (let layer = 0; layer < 3; layer++) {
    const towers = new THREE.InstancedMesh(box, mat(new THREE.MeshBasicMaterial({ color: [0x172238, 0x101a2b, 0x0a1121][layer] })), 24);
    for (let i = 0; i < 24; i++) {
      const x = (i - 11.5) * .28 + (layer % 2) * .11;
      const side = Math.min(1, Math.abs(x) / 1.9);
      const h = .32 + ((i * 17 + layer * 7) % 19) * .055 + side * (.45 + layer * .45);
      const w = .13 + (i % 4) * .035, z = -3.5 + layer * 1.15;
      instance(towers, i, x, -1.58 + h / 2, z, w, h, .28);
      for (let row = 0; row < 11; row++) for (let col = 0; col < 3; col++) {
        if ((row * 13 + col * 7 + i * 3) % 5 < 2) continue;
        light((i + layer) % 3, x + (col - 1) * w * .23, -1.52 + h * (row + 1) / 12, z + .145, w * .11, .012 + layer * .003);
      }
      // Roof beacons, vertical signage and stepped crowns break up silhouettes.
      if (i % 4 === 0) {
        light(1, x + w * .42, -1.58 + h * .75, z + .15, .014, h * .44);
        light(2, x, -1.58 + h + .025, z + .15, w * .72, .012);
      }
    }
    group.add(towers);
  }
  lights.forEach((mesh, i) => { mesh.count = counts[i]; group.add(mesh); });

  // A split crown and antenna give the skyline a recognizable focal point.
  const landmark = new THREE.Group(); landmark.position.set(-1.24, -1.58, -1.6);
  const dark = mat(new THREE.MeshBasicMaterial({ color: 0x101526 }));
  for (const x of [-.12, .12]) {
    const tower = new THREE.Mesh(box, dark); tower.position.set(x, 1.31, 0); tower.scale.set(.18, 2.62, .32); landmark.add(tower);
    const trim = new THREE.Mesh(plane, cyan); trim.position.set(x, 1.42, .17); trim.scale.set(.012, 2.34, 1); landmark.add(trim);
  }
  const bridge = new THREE.Mesh(box, dark); bridge.position.y = 2.35; bridge.scale.set(.5, .17, .35); landmark.add(bridge);
  const antenna = new THREE.Mesh(box, pink); antenna.position.set(0, 2.75, 0); antenna.scale.set(.012, .72, .012); landmark.add(antenna);
  group.add(landmark);

  // Soft atmospheric light without bloom passes or full-resolution render targets.
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, '#ffffff'); gradient.addColorStop(.2, '#ffffff99'); gradient.addColorStop(1, '#ffffff00');
    context.fillStyle = gradient; context.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas); textures.push(texture);
    for (const [x, y, color, scale] of [[-1.3, -.1, 0x10cadb, 2.4], [1.6, .3, 0xe73782, 2.8], [0, -1.4, 0x5865ed, 3.4]]) {
      const glow = new THREE.Sprite(mat(new THREE.SpriteMaterial({ map: texture, color, opacity: .16, depthWrite: false, blending: THREE.AdditiveBlending })));
      glow.position.set(x, y, -2.8); glow.scale.set(scale, scale, 1); group.add(glow);
    }
  }
  const sun = new THREE.Mesh(geo(new THREE.CircleGeometry(.32, 48)), mat(new THREE.MeshBasicMaterial({ color: 0xfa706a, transparent: true, opacity: .42 })));
  sun.position.set(.8, .82, -4); group.add(sun);
  const sunLines: number[] = [];
  for (let i = 0; i < 7; i++) {
    const y = -.25 + i * .055, half = Math.sqrt(.32 ** 2 - y ** 2);
    sunLines.push(.8 - half, .82 + y, -3.99, .8 + half, .82 + y, -3.99);
  }
  group.add(new THREE.LineSegments(geo(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(sunLines, 3))), mat(new THREE.LineBasicMaterial({ color: 0x10182a }))));

  // Elevated transit and wet light reflections anchor the lower third.
  for (const y of [-1.22, -1.28]) {
    const rail = new THREE.Mesh(plane, pink); rail.position.set(0, y, -.6); rail.scale.set(7, .009, 1); group.add(rail);
  }
  const traffic = new THREE.InstancedMesh(plane, amber, 12); group.add(traffic);
  const reflections = new THREE.InstancedMesh(plane, mat(new THREE.MeshBasicMaterial({ color: 0x3690aa, transparent: true, opacity: .12, depthWrite: false })), 32);
  for (let i = 0; i < 32; i++) instance(reflections, i, (i - 15.5) * .17, -1.65 - (i % 5) * .09, -.5, .018 + i % 3 * .012, .1 + i % 4 * .12);
  group.add(reflections);
  const rainPositions = new Float32Array(96 * 6);
  const rainGeometry = geo(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(rainPositions, 3)));
  const rain = new THREE.LineSegments(rainGeometry, mat(new THREE.LineBasicMaterial({ color: 0xa3c6dc, transparent: true, opacity: .13, depthWrite: false }))); group.add(rain);

  return {
    group,
    resize(aspect: number) { group.scale.x = Math.max(.48, Math.min(1, aspect)); },
    update(time: number, energy: number, chorus: boolean) {
      cyan.opacity = .38 + energy * .22 + (chorus ? .15 : 0);
      pink.opacity = .42 + energy * .2 + (chorus ? .16 : 0);
      amber.opacity = .4 + energy * .18;
      group.position.x = Math.sin(time * .035) * .045;
      for (let i = 0; i < 12; i++) instance(traffic, i, ((i * .73 + time * (i % 2 ? .16 : -.12)) % 7 + 7) % 7 - 3.5, -1.245, -.58, .06 + i % 3 * .035, .013);
      traffic.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < 96; i++) {
        const x = Math.sin(i * 127.1) * 3.7, y = 2.1 - ((i * .137 + time * (.24 + i % 5 * .035)) % 4.5);
        rainPositions.set([x, y, -.1, x - .018, y - .065, -.1], i * 6);
      }
      rainGeometry.attributes.position.needsUpdate = true;
      rainGeometry.computeBoundingSphere();
    },
    dispose() {
      group.traverse(object => { if (object instanceof THREE.InstancedMesh) object.dispose(); });
      geometries.forEach(value => value.dispose()); materials.forEach(value => value.dispose()); textures.forEach(value => value.dispose());
    },
  };
}
