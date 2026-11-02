// 家书 — the scale of war: battlefields that fill the horizon, and the field of graves.
// Same paper-cut medium, more depth: ranks of figures on 8–12 layers, smoke banks between them,
// bursts that light the smoke, light breaking through, a camera that rises to show how far it goes.
import { THREE, Stage, rng, clamp, lerp, sstep, inOut, sine, flicker, canvasTex, GLSL } from "./world.js";
import { SIL, P, armyTex } from "./kit.js";
import { sil, GRADE, lightUV } from "./shots_common.js";

// bursts scattered over time and depth; each lights the smoke around it
function bursts(st, n, o) {
  const r = rng(o.seed ?? 5);
  const list = [];
  for (let i = 0; i < n; i++) {
    const z = lerp(o.z0, o.z1, r());
    const [fw] = st.fillSize(z, 10, 1.2);
    const b = { at: o.t0 + r() * (o.t1 - o.t0), x: (r() - 0.5) * fw * 0.9, y: o.y + (r() - 0.5) * (o.yj ?? 0.6), z, size: (o.size ?? 6) * (10 - z) / 40 };
    b.g = st.glow({ x: b.x, y: b.y, z: b.z + 0.1, size: b.size, color: o.color ?? 0xffb070 });
    list.push(b);
  }
  return {
    list,
    update(t) {
      let total = 0;
      for (const b of list) {
        const k = Math.exp(-Math.pow((t - b.at) * (o.sharp ?? 6), 2)) + 0.25 * Math.exp(-Math.max(0, t - b.at) * 2.5) * (t > b.at ? 1 : 0);
        b.g.userData.u.uAmt.value = k * (o.amt ?? 1.4);
        total += k;
      }
      return total;
    },
  };
}

// ================================================================= BULL RUN, 1861
export function c1BattleEpic(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: { lift: [0.02, 0.012, 0.004], gain: [1.06, 0.96, 0.84], gamma: 1.0, sat: 0.72 } });
    const sky = st.sky({ z: -110, top: 0x3a2e28, mid: 0x9a7650, bot: 0xe8b070, midY: 0.42, moon: [0.63, 0.47, 0.03], moonColor: 0xfff0c8, cloud: 0.8, cloudColor: 0x6a5240, cloudScale: 1.1, cloudSpeed: [0.03, 0.006], cloudY: [0.35, 1.1], glow: 0.6, glowColor: 0xffa060, glowY: 0.25 });
    const g = sky.geometry.parameters;
    st.rays({ z: -100, src: [0.63, 0.47], color: 0xffd8a0, amt: 0.32, seed: 3 });
    const fog = 0xc89a70;
    st.layer({ tex: P.ridge({ base: 0.55, amp: 0.05, freq: 2.5, seed: 501 }), z: -95, y: -4.5, tone: 0x6a5446, fog: 0.62, fogColor: fog });
    const L = [];
    L.push(st.layer({ tex: armyTex("fig_union_line", { height: 0.5, seed: 1 }), z: -80, y: -4.2, w: 150, h: 150 * 0.1875, tone: 0x4a3c32, fog: 0.55, fogColor: fog }));
    st.smoke({ z: -72, color: 0xb8a080, density: 0.75, scale: 1.0, speed: [0.03, 0.01], edge: [0.0, 0.22, 0.8, 0.45], seed: 1 });
    L.push(st.layer({ tex: armyTex("fig_battery", { height: 0.55, step: 1.3, gap: 0.6, seed: 2 }), z: -62, y: -3.6, w: 120, h: 120 * 0.1875, tone: 0x3a2e26, fog: 0.42, fogColor: fog }));
    st.smoke({ z: -55, color: 0xa89070, lit: 0x000000, density: 0.85, scale: 1.2, speed: [0.05, 0.015], edge: [0.0, 0.2, 0.85, 0.5], seed: 2 });
    L.push(st.layer({ tex: armyTex(["fig_union_line", "fig_union_line", "fig_cavalry"], { height: 0.6, seed: 3 }), z: -44, y: -3.1, w: 95, h: 95 * 0.1875, tone: 0x2a2018, fog: 0.3, fogColor: fog }));
    const smokeMid = st.smoke({ z: -36, color: 0x8a745a, lit: 0x000000, density: 0.95, scale: 1.0, speed: [0.06, 0.02], edge: [0.0, 0.18, 0.75, 0.45], seed: 3 });
    const cav = sil(st, "fig_cavalry", { z: -26, w: 26, y: -2.6, tone: 0x1c150f, fog: 0.18, fogColor: fog, rim: 0.6, rimDir: [0, 1], light: 0xffd090 });
    const line = st.layer({ tex: armyTex("fig_union_line", { height: 0.75, seed: 4, step: 0.98 }), z: -16, y: -2.3, w: 44, h: 44 * 0.1875, tone: 0x120d09, fog: 0.08, fogColor: fog, rim: 0.7, rimDir: [0, 1], light: 0xffd090 });
    const smokeNear = st.smoke({ z: -9, color: 0x8a7860, density: 0.7, scale: 0.9, speed: [0.09, 0.02], edge: [0.0, 0.2, 0.6, 0.35], seed: 4 });
    const fallen = sil(st, "fig_fallen", { z: 1.5, w: 12, x: -0.5, y: -2.2, tone: 0x080605, rim: 0.6, rimDir: [0, 1], light: 0xffc080 });
    st.layer({ tex: P.grass({ base: 0.75, height: 0.5, count: 1300, seed: 9 }), z: 3, y: -2.6, size: [st.fillSize(3)[0], 3], tone: 0x0a0806 });
    const ash = st.particles({ mode: 3, count: 220, box: [24, 12, 16], center: [0, 1, -8], size: 0.06, color: 0x2a2018, opacity: 0.7, wind: 1.6, seed: 17, additive: false });
    const embers = st.particles({ mode: 0, count: 200, box: [30, 10, 24], center: [0, -2, -24], size: 0.09, color: 0xffa050, opacity: 0.8, wind: 0.6, seed: 18 });
    const B = bursts(st, 34, { t0: 0.3, t1: shot.dur - 0.3, z0: -64, z1: -12, y: -2.4, size: 18, seed: 7, amt: 2.2 });
    st.onUpdate((t, dur, T) => {
      const k = t / dur;
      cav.position.x = lerp(-18, 10, k);
      line.position.x = lerp(-4, 3, k);
      L[2].position.x = lerp(-2, 2, k);
      const flash = B.update(t);
      smokeMid.userData.u.uLit.value.setRGB(0.6 * Math.min(flash, 1.5), 0.32 * Math.min(flash, 1.5), 0.1 * Math.min(flash, 1.5));
      smokeNear.userData.u.uLit.value.setRGB(0.3 * Math.min(flash, 1.5), 0.16 * Math.min(flash, 1.5), 0.05 * Math.min(flash, 1.5));
      const p = inOut(clamp(k));
      const sh = Math.min(flash, 1.2) * 0.012;
      st.camera.position.set(lerp(-0.8, 0.6, p) + Math.sin(T * 41) * sh, lerp(-1.4, 1.6, p) + Math.cos(T * 37) * sh, lerp(10, 7.5, p));
      st.camera.lookAt(lerp(-0.4, 0.4, p), lerp(-1.0, -2.0, p), -40);
    });
    return st;
  };
}

// ================================================================= THE WESTERN FRONT AT NIGHT, 1914
export function c3Front(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: GRADE.g1914 });
    const sky = st.sky({ z: -110, top: 0x04060a, mid: 0x141c24, bot: 0x3a2e2a, midY: 0.5, cloud: 0.85, cloudColor: 0x1e262e, cloudScale: 1.2, cloudSpeed: [0.02, 0], cloudY: [0.3, 1.1], glow: 0.0, glowColor: 0xff9050, glowY: 0.12 });
    const fog = 0x26303a;
    st.layer({ tex: P.ridge({ base: 0.6, amp: 0.02, freq: 3, seed: 601 }), z: -95, y: -4.4, tone: 0x0c1014, fog: 0.3, fogColor: fog });
    const village = sil(st, "fig_ruined_village", { z: -78, w: 70, x: 8, y: -3.6, tone: 0x080b0e, fog: 0.25, fogColor: fog, rim: 0.4, rimDir: [0, 1], light: 0xffb070 });
    const layers = [];
    const defs = [
      { tex: P.wire({ base: 0.75, stakes: 30, seed: 611 }), z: -62, y: -3.9 },
      { tex: P.sandbags({ top: 0.7, rows: 2, seed: 612 }), z: -50, y: -3.9 },
      { tex: P.stumps({ base: 0.72, count: 9, seed: 613 }), z: -40, y: -2.8 },
      { tex: P.wire({ base: 0.75, stakes: 22, seed: 614 }), z: -30, y: -3.0 },
      { tex: P.craters({ base: 0.66, count: 9, seed: 615 }), z: -20, y: -3.0 },
      { tex: P.sandbags({ top: 0.68, rows: 3, seed: 616 }), z: -11, y: -2.7 },
      { tex: P.wire({ base: 0.72, stakes: 8, seed: 617 }), z: 1.5, y: -2.4 },
    ];
    for (const d of defs) layers.push(st.layer(Object.assign({ tone: 0x05070a, fog: Math.max(0, -d.z / 140), fogColor: fog, rim: 0.6, rimDir: [0, 1], light: 0xe6f0ff, rimW: 0.0025, lightAmt: 0.0 }, d)));
    const charge = st.layer({ tex: armyTex("fig_over_top", { height: 0.7, seed: 9 }), z: -34, y: -2.7, w: 70, h: 70 * 0.1875, tone: 0x05070a, fog: 0.22, fogColor: fog, rim: 0.7, rimDir: [0, 1], light: 0xe6f0ff, opacity: 0 });
    // flares hanging over the whole front
    const r = rng(11);
    const flares = [];
    for (let i = 0; i < 6; i++) {
      const z = -24 - r() * 66;
      const [fw] = st.fillSize(z, 10, 1.0);
      flares.push({ x: (r() - 0.5) * fw * 0.9, y0: 3 + r() * 6, z, t0: r() * 6, g: st.glow({ x: 0, y: 0, z, size: (10 - z) / 11, color: 0xe2eeff }) });
    }
    const arty = bursts(st, 30, { t0: 0.2, t1: shot.dur, z0: -92, z1: -70, y: -3.4, size: 26, color: 0xffa060, seed: 21, sharp: 9 });
    const rain = st.particles({ mode: 1, count: 2200, box: [30, 14, 22], center: [0, 0, -8], size: 0.55, color: 0xa8b8c8, opacity: 0.28, wind: 0.5, seed: 7 });
    st.onUpdate((t, dur, T) => {
      let light = 0;
      for (const f of flares) {
        const ph = ((t + f.t0) % 9) / 9;
        f.g.position.set(f.x + ph * 0.6, f.y0 - ph * 3.5, f.z);
        const a = sstep(0, 0.08, ph) * (1 - sstep(0.8, 1, ph));
        f.g.userData.u.uAmt.value = a * (0.9 + 0.1 * flicker(T * 3, f.x));
        light += a;
      }
      const flash = arty.update(t);
      sky.userData.u.uGlow.value = Math.min(flash, 2) * 0.6;
      for (const m of layers) {
        m.userData.u.uLightAmt.value = 0.04 * light;
        m.userData.u.uFlick.value = 1;
      }
      charge.userData.u.uOpacity.value = cfg.chargeAt != null ? sstep(cfg.chargeAt, cfg.chargeAt + 1.5, t) : 0;
      charge.position.x = cfg.chargeAt != null ? Math.max(0, t - cfg.chargeAt) * 1.4 - 6 : 0;
      const p = inOut(clamp(t / dur));
      st.camera.position.set(lerp(-1, 1, p), lerp(-1.6, -0.6, p), lerp(10, 5.5, p));
      st.camera.lookAt(lerp(-0.6, 0.6, p), lerp(-1.2, -1.6, p), -50);
    });
    return st;
  };
}

// ================================================================= TAIHANG, MAY 1942
export function c5BattleEpic(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: GRADE.g1942 });
    const sky = st.sky({ z: -110, top: 0x1a1214, mid: 0x6a3a2a, bot: 0xd0702a, midY: 0.42, moon: [0.3, 0.42, 0.028], moonColor: 0xffb070, cloud: 0.85, cloudColor: 0x3a2420, cloudScale: 1.2, cloudSpeed: [0.03, 0.01], cloudY: [0.3, 1.1], glow: 0.9, glowColor: 0xff6a2a, glowY: 0.2 });
    st.rays({ z: -100, src: [0.3, 0.42], color: 0xff9a50, amt: 0.4, seed: 5 });
    const fog = 0x8a4a2a;
    const cl = [];
    [-92, -74, -56, -40, -26].forEach((z, i) => cl.push(st.layer({ tex: P.cliffs({ base: 0.42 + i * 0.05, amp: 0.16, seed: 700 + i, crevices: 40 }), z, y: -2.4 - i * 0.2, tone: [0x4a3030, 0x3a2422, 0x2a1a18, 0x1a1010, 0x0e0808][i], fog: [0.55, 0.42, 0.3, 0.18, 0.08][i], fogColor: fog, rim: 0.8, rimDir: [-0.4, 1], light: 0xffa060, rimW: 0.0025 })));
    // tall smoke columns from the shelling
    const cols = [];
    const r = rng(31);
    for (let i = 0; i < 6; i++) {
      const z = -30 - r() * 50;
      const x = (r() - 0.5) * st.fillSize(z, 10, 1)[0] * 0.8;
      cols.push({ at: 0.6 + i * ((shot.dur - 2) / 6) + r() * 0.5, m: st.smoke({ z: z - 0.5, x, y: 2, w: 9 * (10 - z) / 40, h: 26 * (10 - z) / 50, color: 0x2a1c18, lit: 0xc85a18, density: 0, scale: 1.6, speed: [0.01, 0.12], edge: [0.0, 0.08, 1.0, 0.7], seed: 40 + i }), b: st.glow({ x, y: -2.0 - (z + 30) * 0.03, z, size: 14 * (10 - z) / 40, color: 0xffa050 }) });
    }
    const bombers = sil(st, "fig_bombers", { z: -48, w: 34, x: -30, y: 6, tone: 0x140c0c, fog: 0.35, fogColor: fog });
    const fight = st.layer({ tex: armyTex("fig_ridge_fight", { height: 0.7, seed: 4, step: 1.2, gap: 0.8 }), z: -18, y: -1.7, w: 50, h: 50 * 0.1875, tone: 0x0c0606, fog: 0.06, fogColor: fog, rim: 0.8, rimDir: [0, 1], light: 0xffa060 });
    st.layer({ tex: P.cliffs({ base: 0.5, amp: 0.1, seed: 790, crevices: 30 }), z: -14, y: -3.2, tone: 0x080404, rim: 0.7, rimDir: [0, 1], light: 0xffa060 });
    const embers = st.particles({ mode: 0, count: 360, box: [30, 12, 24], center: [0, -1, -16], size: 0.1, color: 0xff7a2a, wind: 0.5, seed: 8 });
    st.onUpdate((t, dur, T) => {
      let glow = 0;
      for (const c of cols) {
        const k = Math.exp(-Math.pow((t - c.at) * 5, 2));
        c.b.userData.u.uAmt.value = k * 2.6 + 0.35 * sstep(c.at, c.at + 0.3, t) * Math.exp(-Math.max(0, t - c.at) * 0.4);
        c.m.userData.u.uDensity.value = 0.85 * sstep(c.at, c.at + 1.0, t);
        c.m.position.y = 2 + Math.max(0, t - c.at) * 0.35;
        glow += k;
      }
      sky.userData.u.uGlow.value = 0.9 + glow * 0.7;
      bombers.position.x = lerp(-34, 30, t / dur);
      const p = inOut(clamp(t / dur));
      st.camera.position.set(lerp(-1.2, 1.2, p) + Math.sin(T * 40) * 0.02 * glow, lerp(-0.6, 0.8, p), lerp(10, 8, p));
      st.camera.lookAt(lerp(-0.6, 0.6, p), lerp(-0.4, -0.8, p), -40);
    });
    return st;
  };
}

// ================================================================= GUANGZHOU BURNING (behind the handkerchief)
export function townTexW(seed) {
  return canvasTex(4096, 1024, (g, w, h) => {
    const r = rng(seed);
    g.fillStyle = "#fff";
    let x = -40;
    while (x < w) {
      const bw = 140 + r() * 180,
        bh = (0.3 + r() * 0.3) * h;
      const top = h - bh;
      g.fillRect(x, top, bw, bh);
      g.beginPath();
      g.moveTo(x - 30, top + 6);
      g.quadraticCurveTo(x + bw * 0.1, top - 6, x + bw * 0.5, top - 46 - r() * 24);
      g.quadraticCurveTo(x + bw * 0.9, top - 6, x + bw + 30, top + 6);
      g.lineTo(x + bw + 34, top - 10);
      g.lineTo(x + bw + 20, top + 14);
      g.lineTo(x - 20, top + 14);
      g.lineTo(x - 34, top - 10);
      g.fill();
      if (r() < 0.3) g.fillRect(x + bw * 0.4, top - 160, 24, 160);
      g.globalCompositeOperation = "destination-out";
      for (let k = 0; k < 3; k++) if (r() < 0.7) g.fillRect(x + 20 + k * (bw / 3), top + bh * 0.15, bw / 3 - 30, bh * 0.12);
      g.globalCompositeOperation = "source-over";
      x += bw + 6 + r() * 30;
    }
  });
}

// ================================================================= THE FIELD OF GRAVES AT DAWN
export function eGravesEpic(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: { lift: [0.012, 0.012, 0.016], gain: [1.02, 1.0, 1.0], gamma: 1.0, sat: 0.62 }, fov: 42 });
    const horizon = new THREE.Color(0xe6d6be);
    st.scene.fog = new THREE.Fog(horizon, 26, 330);
    st.camera.far = 900;
    st.camera.updateProjectionMatrix();
    const sky = st.sky({ z: -600, over: 2.2, top: 0x5a6878, mid: 0xd0c8bc, bot: 0xe6d6be, midY: 0.5, moon: [0.62, 0.465, 0.02], moonColor: 0xfff4dc, glow: 0.9, glowColor: 0xffd090, glowY: 0.44, glowX: [0.5, 0.75], cloud: 0.5, cloudColor: 0xb0b4b8, cloudScale: 1.2, cloudY: [0.52, 1.0] });
    sky.material.fog = false;
    const rays = st.rays({ z: -560, over: 2.2, src: [0.62, 0.465], color: 0xffe2b0, amt: 0.0, seed: 9 });
    rays.material.fog = false;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshLambertMaterial({ color: 0x6e7664 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.6;
    st.add(ground);
    // stones with thickness, lit low from the rising sun: rounded headstones, crosses, steles with caps, low slabs
    const shapes = (() => {
      const head = new THREE.Shape();
      head.moveTo(-0.32, 0);
      head.lineTo(-0.32, 0.72);
      head.absarc(0, 0.72, 0.32, Math.PI, 0, true);
      head.lineTo(0.32, 0);
      head.lineTo(-0.32, 0);
      const cross = new THREE.Shape();
      [[-0.07, 0], [-0.07, 0.72], [-0.3, 0.72], [-0.3, 0.86], [-0.07, 0.86], [-0.07, 1.14], [0.07, 1.14], [0.07, 0.86], [0.3, 0.86], [0.3, 0.72], [0.07, 0.72], [0.07, 0]].forEach(([x, y], i) => (i ? cross.lineTo(x, y) : cross.moveTo(x, y)));
      const stele = new THREE.Shape();
      [[-0.26, 0], [-0.26, 0.9], [-0.36, 0.9], [-0.36, 0.98], [0, 1.1], [0.36, 0.98], [0.36, 0.9], [0.26, 0.9], [0.26, 0]].forEach(([x, y], i) => (i ? stele.lineTo(x, y) : stele.moveTo(x, y)));
      const slab = new THREE.Shape();
      slab.moveTo(-0.36, 0);
      slab.lineTo(-0.36, 0.44);
      slab.quadraticCurveTo(0, 0.56, 0.36, 0.44);
      slab.lineTo(0.36, 0);
      return [head, cross, stele, slab].map((sh, i) => {
        const geo = new THREE.ExtrudeGeometry(sh, { depth: i === 1 ? 0.12 : 0.16, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 1, curveSegments: 8 });
        geo.translate(0, 0, -0.08);
        return geo;
      });
    })();
    st.scene.add(new THREE.HemisphereLight(0xf4ece0, 0x5a5e56, 2.0));
    const sun = new THREE.DirectionalLight(0xffd8a8, 1.6);
    sun.position.set(40, 18, -120);
    st.scene.add(sun);
    const r = rng(77);
    const per = [[], [], [], []];
    const rows = 210,
      cols = 110;
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const x = (i - cols / 2) * 2.3 + (j % 2) * 1.15 + (r() - 0.5) * 0.2;
        const z = 6 - j * 2.7 + (r() - 0.5) * 0.25;
        const kind = r() < 0.4 ? 0 : r() < 0.55 ? 1 : r() < 0.6 ? 2 : 3;
        per[kind].push([x, z, 0.95 + r() * 0.15, (r() - 0.5) * 0.12, (r() - 0.5) * 0.06]);
      }
    const dummy = new THREE.Object3D();
    shapes.forEach((geo, kk) => {
      const im = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: 0xffffff }), per[kk].length);
      per[kk].forEach(([x, z, s, ry, tilt], i) => {
        dummy.position.set(x, -1.6, z);
        dummy.rotation.set(tilt, ry, tilt * 0.5);
        dummy.scale.setScalar(s * 1.15);
        dummy.updateMatrix();
        im.setMatrixAt(i, dummy.matrix);
        const v = 0.78 + 0.18 * (((i * 2654435761) % 1000) / 1000);
        im.setColorAt(i, new THREE.Color(v, v * 0.98, v * 0.95));
      });
      st.add(im);
    });
    // low mist banks drifting between the rows
    const mists = [];
    for (let i = 0; i < 6; i++) {
      const z = -20 - i * 38;
      const m = st.smoke({ z, y: -0.6, w: 400, h: 6, color: 0xf2e6d4, density: 0.32, scale: 6, speed: [0.01 + i * 0.002, 0], edge: [0.0, 0.25, 0.9, 0.35], seed: 60 + i });
      m.material.fog = false;
      mists.push(m);
    }
    // letters falling like snow
    const N = 2400;
    const lm = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.42, 0.3), new THREE.MeshBasicMaterial({ map: P.envelope(), side: THREE.DoubleSide, transparent: true, color: 0xfaf4e8 }), N);
    lm.frustumCulled = false;
    st.add(lm);
    const seeds = Array.from({ length: N }, () => [r(), r(), r(), r(), r()]);
    const birds = st.particles({ mode: 3, count: 26, box: [40, 6, 10], center: [10, 22, -120], size: 0.9, color: 0x3a3a40, opacity: 0.0, wind: -1.4, speed: 1.4, seed: 4, additive: false });
    st.onUpdate((t, dur, T) => {
      const begin = cfg.lettersFrom ?? 1;
      for (let i = 0; i < N; i++) {
        const [a, b, c, d, e] = seeds[i];
        const born = begin + (i / N) * dur * 0.7;
        const age = t - born;
        if (age < 0) {
          dummy.position.set(0, -100, 0);
          dummy.scale.setScalar(0.001);
          dummy.updateMatrix();
          lm.setMatrixAt(i, dummy.matrix);
          continue;
        }
        const fall = Math.min(age * (0.6 + c * 0.4), 40);
        const y0 = 14 + b * 24;
        const y = y0 - fall;
        const zz = 8 - b * b * 180;
        dummy.position.set((a - 0.5) * (40 + b * 160) + Math.sin(age * 0.8 + e * 9) * 0.8, Math.max(y, -1.55), zz);
        if (y <= -1.55) dummy.rotation.set(-Math.PI / 2, 0, e * 6.28);
        else dummy.rotation.set(age * (1 + d) + e * 5, age * 0.7 * (0.5 + c) + a * 3, Math.sin(age * 2 + d * 9) * 0.6);
        dummy.scale.setScalar(1 + b * 2.2);
        dummy.updateMatrix();
        lm.setMatrixAt(i, dummy.matrix);
      }
      lm.instanceMatrix.needsUpdate = true;
      const p = inOut(clamp(t / dur));
      rays.userData.u.uAmt.value = 0.35 + 0.85 * sstep(0.3, 0.8, t / dur);
      sky.userData.u.uGlow.value = 0.6 + 0.4 * sstep(0.3, 0.8, t / dur);
      birds.userData.u.uOpacity.value = sstep(0.4, 0.6, t / dur) * 0.8;
      // from among the stones, rising until the field fills the earth
      st.camera.position.set(lerp(1.15, 0, p), lerp(0.9, 34, p), lerp(9.5, 28, p));
      st.camera.lookAt(lerp(1.15, 0, p), lerp(-0.2, -8, p), lerp(-20, -170, p));
    });
    return st;
  };
}

// ================================================================= TODAY — a ruined room, a candle, a phone (the phone itself is HTML on top)
import { addLamp } from "./shots_common.js";
export function eRuins(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: { lift: [0.004, 0.006, 0.012], gain: [1.0, 0.98, 1.0], gamma: 1.0, sat: 0.7 } });
    const sky = st.sky({ z: -60, top: 0x04060c, mid: 0x0e1220, bot: 0x2a1610, midY: 0.4, cloud: 0.6, cloudColor: 0x141824, cloudY: [0.35, 1.0], glow: 0.5, glowColor: 0xff6a2a, glowY: 0.18 });
    st.layer({ tex: P.ridge({ base: 0.62, amp: 0.05, freq: 6, seed: 911, after: (g, w, h) => { const r = rng(5); g.fillStyle = "#fff"; for (let i = 0; i < 14; i++) { const x = r() * w, bw = 40 + r() * 120, bh = 80 + r() * 260; g.fillRect(x, h * 0.62 - bh, bw, bh); } } }), z: -40, y: -2.4, tone: 0x06070a, fog: 0.2, fogColor: 0x2a1610, rim: 0.4, rimDir: [0, 1], light: 0xff7a3a });
    // the broken wall of the room, with a torn opening
    const wall = canvasTex(2048, 1152, (g, w, h) => {
      g.fillStyle = "#fff";
      g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = "destination-out";
      g.beginPath();
      const r = rng(41);
      const pts = [];
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2;
        const rr = 0.24 + r() * 0.08;
        pts.push([w * (0.33 + Math.cos(a) * rr * 0.9), h * (0.4 + Math.sin(a) * rr * 1.1)]);
      }
      pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.fill();
      g.globalCompositeOperation = "source-over";
      g.fillRect(w * 0.12, h * 0.37, w * 0.42, 14); // a bent rebar
    });
    const wallM = st.layer({ tex: wall, z: -3, tone: 0x14110e, fiber: 0.14, fiberScale: 200, lightAmt: 0.0, light: 0xffb25a, lightPos: [0.8, 0.2], lightFall: 2.5, rim: 0.6, rimDir: [0, 0], size: st.fillSize(-3, 10, 1.2) });
    const rubble = st.layer({ tex: P.craters({ base: 0.6, count: 5, seed: 913 }), z: 0.5, y: -2.6, size: [st.fillSize(0.5)[0], 3.5], tone: 0x0a0806, lightAmt: 0.0, light: 0xffb25a, lightPos: [0.82, 0.8], lightFall: 3, rim: 0.5, rimDir: [0, 1] });
    const lamp = addLamp(st, { kind: "candle", x: 3.9, y: -1.45, z: 1.0, height: 0.9, seed: 9 });
    const ash = st.particles({ mode: 2, count: 260, box: [16, 9, 8], center: [0, 0.5, -1], size: 0.04, color: 0x8a8580, opacity: 0.55, seed: 4, additive: false });
    const r = rng(3);
    const flashes = [];
    for (let i = 0; i < 6; i++) flashes.push({ at: 2 + i * (shot.dur / 6) + r() * 2, x: -8 + r() * 10 });
    const fg = flashes.map((f) => st.glow({ x: f.x, y: -1.4, z: -38, size: 22, color: 0xff9050 }));
    st.onUpdate((t, dur, T) => {
      const f = flicker(T, 9);
      wallM.userData.u.uLightAmt.value = 0.5 * f;
      rubble.userData.u.uLightAmt.value = 0.8 * f;
      lamp.body.userData.u.uFlick.value = f;
      let g = 0;
      flashes.forEach((fl, i) => {
        const k = Math.exp(-Math.pow((t - fl.at) * 4, 2));
        fg[i].userData.u.uAmt.value = k * 1.4;
        g += k;
      });
      sky.userData.u.uGlow.value = 0.5 + g * 0.6;
      const p = sine(t / dur);
      st.camera.position.set(lerp(-0.2, 0.2, p), lerp(-0.1, 0.0, p), lerp(9.6, 9.0, p));
      st.camera.lookAt(0, -0.3, -3);
    });
    return st;
  };
}
