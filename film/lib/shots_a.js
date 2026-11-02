// 家书 — cold open, prologue (757), title, chapter 1 (1861), chapter 2 (1911).
import { THREE, Stage, rng, clamp, lerp, sstep, inOut, sine, flicker, canvasTex, GLSL, paperMaterial } from "./world.js";
import { SIL, P, sheetMaterial, Hand, StrokeHand, FONTS, textTex } from "./kit.js";
import { inkOnly, addLamp, lampShot, shadowShot, letterShot, photoShot, sil, GRADE, setLight, lightUV } from "./shots_common.js";

const W = "#fff";

// ================================================================= COLD OPEN — a match, a candle, 见字如面
export function openPaper(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: GRADE.warm, fov: 30 });
    // 见字如面, written stroke by stroke in its real stroke order
    const hand = new StrokeHand({
      w: 1400,
      h: 1800,
      size: 300,
      vertical: true,
      lineGap: 1.3,
      margin: [0.36, 0.14],
      color: "#0d0907",
      // as in v3: the stroke data's own (kai, brush-written) outlines, each revealed along its own median —
      // shape and pen path come from the same source, so every stroke grows whole and in order
      brush: 150,
      bold: 26,
      bleed: 3,
      seed: 11,
      lines: [{ text: "见字如面", start: cfg.writeFrom, end: cfg.writeTo }],
    });
    const H = 4.7,
      Wd = H * (1400 / 1800);
    const mat = sheetMaterial({ ink: hand.tex, paper: 0xd9c7a2, inkColor: 0x120c08, aspect: 1400 / 1800, lightPos: [-0.45, 0.2], lightFall: 1.1, ambient: 0.0, age: 0.6, fiber: 0.07, folds: 1 });
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(Wd, H), mat);
    sheet.position.set(0.7, 0.0, 0);
    sheet.rotation.z = -0.03;
    st.add(sheet);
    st.timed.push(mat.uniforms);
    const [dw, dh] = st.fillSize(-0.5, 10, 1.6);
    const deskMat = sheetMaterial({ paper: 0x22170f, deckle: 0, folds: 0, age: 0, fiber: 0.14, aspect: dw / dh, lightPos: [0.36, 0.38], lightFall: 2.6, ambient: 0.0 });
    const desk = new THREE.Mesh(new THREE.PlaneGeometry(dw, dh), deskMat);
    desk.position.z = -0.5;
    st.add(desk);
    st.timed.push(deskMat.uniforms);
    const lamp = addLamp(st, { kind: "candle", x: -2.3, y: -0.95, z: 0.6, height: 1.7, seed: 4 });
    const wisp = null;
    st.onUpdate((t, dur, T) => {
      hand.draw(t);
      const strike = cfg.strikeAt;
      const on = sstep(strike + 0.15, strike + 1.1, t);
      const flare = Math.exp(-Math.pow((t - strike - 0.1) * 5, 2)) * 1.6;
      const f = flicker(T, 4);
      const k = on * f + flare;
      // the burning starts at the end: the flame leans toward the paper
      lamp.flame.userData.u.uOut.value = 1 - clamp(on + flare);
      lamp.flame.userData.u.uWind.value = 0.25 * sstep(cfg.burnFrom, cfg.burnFrom + 2, t);
      mat.uniforms.uLightAmt.value = 1.2 * k;
      deskMat.uniforms.uLightAmt.value = 1.0 * k;
      lamp.body.userData.u.uFlick.value = k;
      lamp.body.userData.u.uRim.value = 1.5 * k;
      const p = sine(t / dur);
      st.camera.position.set(lerp(-0.6, 0.0, p), lerp(-0.25, -0.05, p), lerp(10.2, 9.0, p));
      st.camera.lookAt(lerp(-0.3, 0.3, p), -0.15, 0);
    });
    return st;
  };
}

// ================================================================= PROLOGUE — Chang'an burning, AD 757
export function changan(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: GRADE.g757 });
    st.sky({ top: 0x090304, mid: 0x3a0f07, bot: 0x9a3a10, midY: 0.42, cloud: 0.95, cloudColor: 0x2c120b, cloudScale: 1.6, cloudSpeed: [0.012, 0.01], cloudY: [0.25, 1.1], glow: 1.1, glowColor: 0xff5a14, glowY: 0.12, glowX: [0.35, 0.75] });
    const far = st.layer({ tex: P.ridge({ base: 0.55, amp: 0.08, freq: 3, seed: 21, peaks: [{ x: 0.2, a: 0.08, s: 0.08 }, { x: 0.8, a: 0.05, s: 0.1 }] }), z: -60, tone: 0x1a0907, fog: 0.35, fogColor: 0x5a1c0a, lightAmt: 0.3, light: 0xff6a20, lightPos: [0.55, 0.0], lightFall: 2, rim: 0.4, rimDir: [0, 1] });
    const smokeBack = st.smoke({ z: -45, color: 0x2a1209, lit: 0x8a2a08, density: 0.9, scale: 1.4, speed: [0.01, 0.05], edge: [0.15, 0.4, 1.1, 0.85], seed: 2 });
    const fire = st.smoke({ z: -33, y: -1.2, color: 0x6a1a04, lit: 0xffa040, density: 1.0, scale: 3.0, speed: [0.0, 0.25], edge: [0.12, 0.2, 0.55, 0.3], seed: 7 });
    const city = sil(st, "fig_changan", { z: -30, w: 46, y: -3.8, tone: 0x070303, rim: 1.4, rimDir: [0, 1], rimW: 0.0035, light: 0xff7a2a, lightAmt: 0.25, lightPos: [0.5, 0.0], lightFall: 3, fiber: 0.03 });
    const embers = st.particles({ mode: 0, count: 520, box: [34, 18, 26], center: [0, -1, -16], size: 0.13, speed: 0.9, color: 0xff7224, opacity: 0.95, wind: 0.6, seed: 3 });
    const smokeFront = st.smoke({ z: -12, color: 0x1a0a06, lit: 0x5a1a06, density: 0.55, scale: 1.2, speed: [0.03, 0.04], edge: [0.0, 0.3, 1.0, 0.7], seed: 5 });
    const grass = st.layer({ tex: P.grass({ base: 0.75, height: 0.5, count: 1200, seed: 4 }), z: 1.5, y: -2.2, size: [st.fillSize(1.5)[0], 3.2], tone: 0x080303, rim: 0.9, rimDir: [0, 1], light: 0xff6a20, lightAmt: 0.0 });
    const branch = sil(st, "fig_peach_branch", { z: 2.0, w: 6.2, x: -4.2, y: 1.6, tone: 0x0b0405, rim: 1.0, rimDir: [0.4, 1], light: 0xff7a3a, lightAmt: 0.0, fiber: 0.02 });
    const petals = st.particles({ mode: 3, count: 60, box: [7, 5, 2], center: [-3.0, 0.6, 1.6], size: 0.06, color: 0xd88a8a, opacity: 0.85, wind: 1.0, seed: 8, additive: false });
    st.onUpdate((t, dur, T) => {
      const f = 0.9 + 0.1 * flicker(T * 0.6, 9);
      st.scene.children[0].userData.u.uFlick.value = f;
      city.userData.u.uFlick.value = f;
      const p = sine(t / dur);
      st.camera.position.set(lerp(-0.4, 0.5, p), lerp(-0.4, -0.1, p), lerp(10, 8.2, p));
      st.camera.lookAt(lerp(-0.2, 0.4, p), lerp(-0.5, -0.3, p), -20);
      branch.position.x = -4.2 + Math.sin(T * 0.6) * 0.02;
    });
    return st;
  };
}

// ================================================================= TITLE — an ink drop blooms into 家书
export function inkTitle(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: GRADE.warm, fov: 30 });
    const [w, h] = st.fillSize(0, 10, 1.05);
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(w, h), sheetMaterial({ paper: cfg.paper ?? 0xd9cdb4, aspect: w / h, lightPos: [0.5, 0.55], lightFall: 0.9, ambient: 0.35, age: 0.5, folds: 0, deckle: 0, fiber: 0.08 }));
    paper.position.z = -0.01;
    st.add(paper);
    st.timed.push(paper.material.uniforms);
    const hand = new StrokeHand({ w: 2048, h: 1024, size: 560, grid: 620, cols: 2, margin: [0.197, 0.2], color: "#0b0705", font: FONTS.brush, bleed: 5, seed: 3, lines: [{ text: cfg.text ?? "家书", start: -2, end: -1 }] });
    // no handwriting: the finished characters soak up through the paper like ink seen from the back
    const mat = inkOnly(hand.tex, 0x0b0705, 0);
    const inkFrom = cfg.inkFrom ?? 0.5, inkTo = cfg.inkTo ?? 4;
    const inkPlane = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 4.3), mat);
    inkPlane.position.set(0, 0.3, 0);
    st.add(inkPlane);
    st.timed.push(mat.uniforms);
    st.onUpdate((t, dur) => {
      hand.draw(t);
      const a = sstep(inkFrom, inkTo, t);
      mat.uniforms.uOpacity.value = 0.96 * a;
      inkPlane.scale.setScalar(lerp(0.985, 1, a));
      st.camera.position.set(0, 0, lerp(9.2, 8.5, sine(t / dur)));
      st.camera.lookAt(0, 0.1, 0);
    });
    return st;
  };
}

// ================================================================= CHAPTER 1 — 1861
export const c1Lamp = (o) => lampShot(Object.assign({ kind: "lantern", wall: 0xc2a77e, weave: 0.06, grade: GRADE.g1861, seed: 11 }, o));

export function c1Camp(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: GRADE.g1861 });
    const sky = st.sky({ top: 0x1a2032, mid: 0x86563a, bot: 0xe8a560, midY: 0.38, cloud: 0.55, cloudColor: 0x5a3a32, cloudScale: 1.3, cloudSpeed: [0.01, 0.0], cloudY: [0.45, 1.05], glow: 0.7, glowColor: 0xffa24a, glowY: 0.18, glowX: [0.6, 0.8] });
    const sun = [6, -1.2];
    const L = [];
    L.push(st.layer({ tex: P.ridge({ base: 0.52, amp: 0.05, freq: 2.5, seed: 31 }), z: -70, y: -3, tone: 0x6a4a42, fog: 0.55, fogColor: 0xc88a5a, rim: 0.6, rimDir: [0, 1], light: 0xffb060 }));
    const cap = sil(st, "fig_capitol", { z: -66, w: 9, x: 6.5, y: -0.6, tone: 0x6a4a42, fog: 0.58, fogColor: 0xc88a5a, rim: 0.5, rimDir: [0, 1], light: 0xffb060 });
    const tentDefs = [
      { z: -40, count: 38, size: 0.022, base: 0.58, tone: 0x7a5a48, fog: 0.36, group: 9 },
      { z: -22, count: 16, size: 0.042, base: 0.64, tone: 0x4a3328, fog: 0.17, group: 6 },
      { z: -9, count: 5, size: 0.1, base: 0.74, tone: 0x2a1c16, fog: 0.06, group: 3 },
    ];
    tentDefs.forEach((d, i) => {
      L.push(st.layer({ tex: P.tents({ size: d.size, base: d.base, amp: 0.05, seed: 40 + i, group: d.group }), z: d.z, y: -1.4 - i * 0.2, tone: d.tone, fog: d.fog, fogColor: 0xc88a5a, glow: 1, lightAmt: 0.55 - i * 0.1, light: 0xffc078, lightFall: 2.0, rim: 0.9, rimDir: [0, 1], rimW: 0.003 }));
    });
    // campfires among the tents
    const r = rng(5);
    const fires = [];
    for (let i = 0; i < 26; i++) {
      const layer = 1 + Math.floor(r() * 2);
      const d = tentDefs[layer - 1];
      const [fw] = st.fillSize(d.z, 10, 1.25);
      const x = (r() - 0.5) * fw * 0.9;
      const y = -1.4 - (layer - 1) * 0.2 + (0.5 - d.base) * st.fillSize(d.z, 10, 1.25)[1] - 0.02 * (10 - d.z);
      fires.push(st.flame({ x, y, z: d.z + 0.1, size: 0.25 + (10 - d.z) * -0.0 + 0.012 * (60 + d.z), seed: i, halo: 2.2 }));
    }
    const smoke = st.smoke({ z: -26, y: -1, color: 0x6a5048, lit: 0x3a2010, density: 0.35, scale: 2.4, speed: [0.02, 0.04], edge: [0.2, 0.35, 0.8, 0.6], seed: 3 });
    const grass = st.layer({ tex: P.grass({ base: 0.7, height: 0.55, count: 1000, seed: 6 }), z: 2.5, y: -2.4, size: [st.fillSize(2.5)[0], 3], tone: 0x120c0a, rim: 1.0, rimDir: [0, 1], light: 0xffa050 });
    st.onUpdate((t, dur, T) => {
      const p = sine(t / dur);
      st.camera.position.set(lerp(-1.2, 1.4, p), lerp(-0.2, 0.15, p), lerp(10, 9.2, p));
      st.camera.lookAt(lerp(-1.0, 1.6, p), -0.4, -20);
      for (const m of L) m.userData.u.uLightPos.value.set(...lightUV(m, sun[0] * (1 - m.position.z / 30), sun[1] - m.position.z * 0.05));
    });
    return st;
  };
}

export const c1Shadow = (o) =>
  shadowShot(Object.assign({ sil: "fig_ballou_writing", wall: 0xcdb48c, weave: 0.07, lamp: { kind: "lantern", x: -3.3, y: -1.15, h: 1.7, seed: 11 }, shadow: { cx: 0.6, cy: 0.47, s: 0.82 }, grade: GRADE.g1861 }, o));

export const c1Letter = (o) =>
  letterShot(Object.assign({ hand: { font: FONTS.pinyon, size: 78, lineGap: 1.45, w: 2048, h: 1500, margin: [0.11, 0.1], seed: 3 }, paper: 0xe9dcbc, inkColor: 0x2c1a0e, light: [0.02, 0.75], grade: GRADE.g1861, follow: 0.6 }, o));

// Sarah at the window; the curtain lifts when "a soft breeze" is spoken (cfg.breezeAt, local s)
export function c1Home(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: { lift: [0.012, 0.008, 0.0], gain: [1.08, 1.0, 0.88], gamma: 1.0, sat: 0.85 } });
    // daylight beyond: soft sky + far trees
    const night = !!cfg.night;
    if (night) st.sky({ z: -40, top: 0x03060e, mid: 0x0d1830, bot: 0x1a2a44, midY: 0.5, stars: 0.8, moon: [0.42, 0.7, 0.03], moonColor: 0xdfe8ff });
    else st.sky({ z: -40, top: 0xe8dcc4, mid: 0xf4e8cc, bot: 0xd8cca8, midY: 0.5, cloud: 0.35, cloudColor: 0xfff6e0, cloudScale: 1.5, cloudSpeed: [0.01, 0], cloudY: [0.4, 1.0] });
    st.layer({ tex: P.ridge({ base: 0.62, amp: 0.06, freq: 9, seed: 61, oct: 6 }), z: -30, y: -1.0, tone: night ? 0x0a1020 : 0xb8b090, fog: night ? 0.2 : 0.5, fogColor: night ? 0x1a2a44 : 0xf0e6cc });
    // interior wall with the window opening
    const wallTex = P.sheet({ w: 2048, h: 1152, hole: [0.29, 0.13, 0.27, 0.66] });
    const wall = st.layer({ tex: wallTex, z: -2, tone: night ? 0x0c0f16 : 0x3a2a20, lightAmt: night ? 0.3 : 0.55, light: night ? 0xa8bce0 : 0xffe0b0, lightPos: [0.42, 0.5], lightFall: 3.5, size: st.fillSize(-2, 10, 1.15) });
    const sash = st.layer({ tex: P.sash({ w: 1024, h: 1400 }), z: -2.1, x: -1.55, y: 0.35, w: 4.8, h: 6.1, tone: 0x2a1e18, rim: 0.8, light: 0xfff0d0, rimDir: [0, 0] });
    // sheer curtains: subdivided planes, displaced by a breeze that comes once
    const curtains = [];
    for (const side of [-1, 1]) {
      const geo = new THREE.PlaneGeometry(1.5, 6.2, 12, 30);
      const mat = paperMaterial({ tone: night ? 0x2a3040 : 0xe9dcc4, light: night ? 0x8090b0 : 0xfff2d8, lightAmt: night ? 0.25 : 0.8, lightPos: [0.5, 0.5], lightFall: 1.0, opacity: night ? 0.7 : 0.55, fiber: 0.05 });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(-1.55 + side * 2.35, 0.35, -1.6);
      m.userData.base = geo.attributes.position.array.slice();
      m.userData.side = side;
      st.add(m);
      st.timed.push(mat.uniforms);
      curtains.push(m);
    }
    const sarah = sil(st, "fig_sarah", { z: -0.6, h: 4.9, x: 1.55, y: -0.6, tone: 0x0a0a0e, rim: 1.2, rimDir: [-1, 0], light: night ? 0xbcd0ff : 0xfff0d0, lightAmt: 0.0 });
    const boys = sil(st, "fig_two_boys", { z: 1.2, h: 1.9, x: -2.6, y: -2.0, tone: 0x0e0907, rim: 0.9, rimDir: [-0.6, 0.8], light: 0xfff0d0, opacity: night ? 0 : 1 });
    const dust = st.particles({ mode: 4, count: 160, box: [5, 6, 3], center: [-1.2, 0.3, -0.5], size: 0.03, color: 0xfff0d0, opacity: 0.55, seed: 21 });
    st.onUpdate((t, dur, T) => {
      const b = cfg.breezeAt != null ? sstep(cfg.breezeAt - 0.4, cfg.breezeAt + 1.2, t) * (1 - sstep(cfg.breezeAt + 3.5, cfg.breezeAt + 6.5, t)) : 0;
      for (const m of curtains) {
        const a = m.geometry.attributes.position;
        const base = m.userData.base;
        for (let i = 0; i < a.count; i++) {
          const x = base[i * 3],
            y = base[i * 3 + 1];
          const hang = (3.1 - y) / 6.2; // 0 at top, 1 at bottom
          const sway = Math.sin(T * 0.9 + y * 0.8 + m.userData.side) * 0.05;
          const lift = b * hang * hang * (1.2 + 0.25 * Math.sin(T * 2.3 + y * 2 + x * 3));
          a.setX(i, x + sway + -m.userData.side * lift * 0.9);
          a.setZ(i, lift * 0.9 + 0.05 * Math.sin(T * 1.1 + x * 4 + y));
          a.setY(i, y + lift * 0.25 * hang);
        }
        a.needsUpdate = true;
      }
      sarah.position.y = -0.45 + Math.sin(T * 0.8) * 0.004;
      const p = sine(t / dur);
      st.camera.position.set(lerp(-0.8, 0.5, p), lerp(0.1, 0.0, p), lerp(10, 8.8, p));
      st.camera.lookAt(lerp(-0.6, 0.6, p), 0.0, -2);
    });
    return st;
  };
}

// Bull Run: the same wind becomes smoke; a line of paper soldiers advances
export function c1Battle(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: { lift: [0.02, 0.012, 0.004], gain: [1.05, 0.96, 0.86], gamma: 1.0, sat: 0.7 } });
    const sky = st.sky({ top: 0x6a6258, mid: 0xa8987c, bot: 0xd8c39c, midY: 0.45, cloud: 0.85, cloudColor: 0x7a7062, cloudScale: 1.2, cloudSpeed: [0.03, 0.005], cloudY: [0.2, 1.1], glow: 0.35, glowColor: 0xffa060, glowY: 0.1 });
    st.layer({ tex: P.ridge({ base: 0.55, amp: 0.05, freq: 3, seed: 71 }), z: -60, y: -2.5, tone: 0x6a6052, fog: 0.6, fogColor: 0xb8a888 });
    const lineFar = sil(st, "fig_union_line", { z: -34, w: 26, y: -2.4, tone: 0x3a342c, fog: 0.42, fogColor: 0xb8a888 });
    const smokeMid = st.smoke({ z: -28, color: 0x8a8070, lit: 0x000000, density: 0.85, scale: 1.6, speed: [0.05, 0.01], edge: [0.05, 0.25, 0.85, 0.55], seed: 9 });
    st.layer({ tex: P.ridge({ base: 0.68, amp: 0.04, freq: 2, seed: 72 }), z: -18, y: -2.2, tone: 0x3a3226, fog: 0.25, fogColor: 0xb8a888 });
    const line = sil(st, "fig_union_line", { z: -12, w: 17, y: -2.05, tone: 0x16120e, fog: 0.08, fogColor: 0xb8a888, rim: 0.5, rimDir: [0, 1], light: 0xfff0d0 });
    const smokeNear = st.smoke({ z: -6, color: 0x9a9080, density: 0.6, scale: 1.1, speed: [0.08, 0.01], edge: [0.0, 0.2, 0.75, 0.45], seed: 11 });
    const flashes = [];
    const r = rng(13);
    for (let i = 0; i < 7; i++) flashes.push({ x: (r() - 0.5) * 18, y: -2.4 + r() * 0.8, z: -24 - r() * 10, at: 0.8 + i * (cfg.dur ?? 8) / 8 + r() * 0.4 });
    const fl = flashes.map((f) => st.glow({ x: f.x, y: f.y, z: f.z, size: 5, color: 0xffb070 }));
    const grass = st.layer({ tex: P.grass({ base: 0.7, height: 0.6, count: 900, seed: 7 }), z: 3, y: -2.5, size: [st.fillSize(3)[0], 3], tone: 0x14100c });
    const ash = st.particles({ mode: 3, count: 120, box: [16, 8, 8], center: [0, 0.5, -4], size: 0.06, color: 0x3a3028, opacity: 0.7, wind: 1.6, seed: 17, additive: false });
    st.onUpdate((t, dur, T) => {
      line.position.x = lerp(-5.5, 1.2, t / dur);
      lineFar.position.x = lerp(-8, -3, t / dur);
      let shake = 0;
      flashes.forEach((f, i) => {
        const k = Math.exp(-Math.pow((t - f.at) * 7, 2));
        fl[i].userData.u.uAmt.value = k * 1.4;
        shake += k;
      });
      sky.userData.u.uGlow.value = 0.35 + shake * 0.6;
      const p = sine(t / dur);
      st.camera.position.set(lerp(-0.5, 0.6, p) + Math.sin(T * 40) * 0.02 * shake, lerp(-0.4, -0.2, p) + Math.cos(T * 37) * 0.02 * shake, lerp(10, 8.6, p));
      st.camera.lookAt(lerp(-0.6, 0.6, p), -0.8, -20);
    });
    return st;
  };
}

// ================================================================= CHAPTER 2 — 1911
export const c2Lamp = (o) => lampShot(Object.assign({ kind: "dish", wall: 0x9c8a70, grade: GRADE.g1911, seed: 21 }, o));

function waterMaterial(o) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uMoonX: { value: o.moonX ?? 0.7 }, uDeep: { value: new THREE.Color(o.deep ?? 0x04070e) }, uShine: { value: new THREE.Color(o.shine ?? 0xcfdcff) } },
    vertexShader: `varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: /* glsl */ `${GLSL}
      varying vec2 vUv; uniform float uTime,uMoonX; uniform vec3 uDeep,uShine;
      void main(){
        float y=vUv.y; // 1 at horizon, 0 at the bottom edge
        float persp=1./(1.05-y);
        vec2 p=vec2(vUv.x*6.*persp*.3, persp*2.);
        float waves=fbm(vec2(p.x*1.5+uTime*.05, p.y*6.-uTime*.4));
        float col=smoothstep(.28,.0,abs(vUv.x-uMoonX)*(1.4-y))*(.4+.6*y);
        float glit=smoothstep(.62,.8,waves)*col;
        vec3 c=uDeep*(.7+.6*y)+uShine*glit*1.4+uShine*col*.08;
        c+=uShine*.05*smoothstep(.85,1.,y);
        gl_FragColor=vec4(c,1.);
      }`,
  });
}

export function c2Harbor(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: GRADE.g1911 });
    st.sky({ top: 0x03050c, mid: 0x111b30, bot: 0x26354e, midY: 0.5, stars: 0.55, moon: [0.6, 0.62, 0.022], moonColor: 0xe8eeff, cloud: 0.35, cloudColor: 0x34445e, cloudScale: 1.4, cloudSpeed: [0.008, 0], cloudY: [0.55, 1.0] });
    st.layer({ tex: P.ridge({ base: 0.5, amp: 0.06, freq: 3, seed: 81, peaks: [{ x: 0.35, a: 0.14, s: 0.12 }, { x: 0.55, a: 0.09, s: 0.07 }] }), z: -60, y: 0.4, tone: 0x0b1222, fog: 0.25, fogColor: 0x2a3a56, rim: 0.12, rimDir: [0, 1], light: 0xbfd0ff });
    const lights = st.particles({ mode: 4, count: 140, box: [60, 0.8, 1], center: [0, -2.4, -55], size: 0.18, color: 0xffc070, opacity: 0.75, seed: 22 });
    const [sw, sh] = st.fillSize(-30, 10, 1.3);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh * 0.5), waterMaterial({ moonX: 0.6 }));
    water.position.set(0, -sh * 0.25 - 0.5, -30);
    st.add(water);
    st.timed.push(water.material.uniforms);
    const junks = sil(st, "fig_junks", { z: -18, w: 15, x: -1.5, y: -2.0, tone: 0x03050a, rim: 0.9, rimDir: [0.3, 1], light: 0xbfd0ff, rimW: 0.003 });
    const mist = st.smoke({ z: -24, y: -1.6, color: 0x5a6a86, density: 0.35, scale: 1.4, speed: [0.01, 0.0], edge: [0.2, 0.35, 0.6, 0.45], seed: 4 });
    st.onUpdate((t, dur, T) => {
      junks.position.y = -2.0 + Math.sin(T * 0.7) * 0.03;
      junks.rotation.z = Math.sin(T * 0.5) * 0.004;
      const p = sine(t / dur);
      st.camera.position.set(lerp(-1.0, 0.8, p), lerp(0.3, 0.0, p), lerp(10, 7.5, p));
      st.camera.lookAt(lerp(-0.6, 0.9, p), -0.4, -20);
    });
    return st;
  };
}

export const c2Shadow = (o) =>
  shadowShot(Object.assign({ sil: "fig_lin_writing", wall: 0xb4a084, lamp: { kind: "dish", x: -3.2, y: -1.3, h: 1.8, seed: 21 }, shadow: { cx: 0.6, cy: 0.46, s: 0.8 }, grade: GRADE.g1911 }, o));

// the handkerchief: white cloth, vertical brush calligraphy, tears that blot the ink
export const c2Letter = (o) =>
  letterShot(
    Object.assign(
      {
        hand: { font: FONTS.xing, size: 104, vertical: true, lineGap: 1.25, w: 1800, h: 1800, margin: [0.07, 0.07], seed: 9, bleed: 2.5, jitter: 0.03 },
        paper: 0xf1ede4,
        inkColor: 0x0c0a09,
        weave: 0.025,
        deckle: 0.15,
        folds: 0.35,
        age: 0.12,
        light: [0.0, 0.7],
        lightFall: 0.8,
        grade: GRADE.g1911,
        follow: 0.6,
        sheetH: 7.4,
      },
      o,
    ),
  );

// memory: a lattice window, plum shadows sifting moonlight; then the shadows become fire
export function c2Plum(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: GRADE.g1911 });
    const [ww, wh] = st.fillSize(-1.2, 10, 1.25);
    const plum = SIL.fig_plum_branch;
    const pa = plum.image.width / plum.image.height;
    const paneMat = sheetMaterial({ paper: 0xdfe6f2, deckle: 0, folds: 0, age: 0.15, fiber: 0.09, aspect: ww / wh, lightPos: [0.5, 0.55], lightFall: 0.9, ambient: 0.05, shadowMap: plum, shadowXf: [0.62, 0.62, (0.95 * pa) / (ww / wh), 0.95], shadowAmt: 0.85 });
    paneMat.uniforms.uLight.value.set(0xbfd2ff);
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), paneMat);
    pane.position.z = -1.2;
    st.add(pane);
    st.timed.push(paneMat.uniforms);
    const fire = st.smoke({ z: -1.15, color: 0x5a1a04, lit: 0xff8a2a, density: 0.0, scale: 2.4, speed: [0.0, 0.35], edge: [0.0, 0.1, 0.9, 0.5], seed: 31 });
    const lattice = st.layer({ tex: P.lattice({ w: 2048, h: 1152, cols: 6, rows: 4, frame: 0.04, bar: 0.012, ornament: false }), z: -1.0, tone: 0x0b0a0c, rim: 0.35, rimDir: [0, 0], light: 0xbfd2ff, size: [ww * 0.98, wh * 0.98] });
    const couple = sil(st, "fig_couple", { z: 0.8, h: 4.4, x: 0.6, y: -1.3, tone: 0x060508, rim: 1.0, rimDir: [0, 1], light: 0xbfd2ff, rimW: 0.004 });
    st.onUpdate((t, dur, T) => {
      const fireK = cfg.fireAt != null ? sstep(cfg.fireAt, cfg.fireAt + 2.5, t) : 0;
      const wob = fireK * 0.02;
      paneMat.uniforms.uShadowXf.value.set(0.62 + Math.sin(T * 0.4) * 0.006 + Math.sin(T * 9) * wob, 0.62 + Math.sin(T * 7.3) * wob, ((0.95 * pa) / (ww / wh)) * (1 + fireK * 0.15 * Math.sin(T * 5)), 0.95 * (1 + fireK * 0.25));
      paneMat.uniforms.uLight.value.setRGB(lerp(0.75, 1.0, fireK), lerp(0.82, 0.45, fireK), lerp(1.0, 0.12, fireK));
      paneMat.uniforms.uLightAmt.value = lerp(1.05, 1.8, fireK) * (fireK > 0 ? flicker(T * 2, 3) : 1);
      fire.userData.u.uDensity.value = fireK * 0.9;
      lattice.userData.u.uLight.value.copy(paneMat.uniforms.uLight.value);
      couple.userData.u.uLight.value.copy(paneMat.uniforms.uLight.value);
      couple.userData.u.uOpacity.value = 1 - sstep(cfg.fireAt ?? 1e9, (cfg.fireAt ?? 1e9) + 3, t);
      paneMat.uniforms.uBurn.value = cfg.burnAt != null ? lerp(-0.4, 1.1, sstep(cfg.burnAt, cfg.burnAt + 3, t)) - (t < cfg.burnAt ? 1 : 0) : -1;
      const p = sine(t / dur);
      st.camera.position.set(lerp(0.4, -0.3, p), lerp(-0.1, 0.1, p), lerp(9.0, 7.6, p));
      st.camera.lookAt(0, 0, -1);
    });
    return st;
  };
}

function townTex(seed) {
  return canvasTex(2048, 1024, (g, w, h) => {
    const r = rng(seed);
    g.fillStyle = W;
    let x = -40;
    while (x < w) {
      const bw = 150 + r() * 160,
        bh = (0.32 + r() * 0.25) * h;
      const top = h - bh;
      g.fillRect(x, top, bw, bh);
      // upturned eaves roof
      g.beginPath();
      g.moveTo(x - 30, top + 6);
      g.quadraticCurveTo(x + bw * 0.1, top - 6, x + bw * 0.5, top - 46 - r() * 20);
      g.quadraticCurveTo(x + bw * 0.9, top - 6, x + bw + 30, top + 6);
      g.lineTo(x + bw + 34, top - 10);
      g.lineTo(x + bw + 20, top + 14);
      g.lineTo(x - 20, top + 14);
      g.lineTo(x - 34, top - 10);
      g.fill();
      // balcony and vertical signboards
      if (r() < 0.6) g.fillRect(x + 10, top + bh * 0.35, bw - 20, 10);
      for (let k = 0; k < 2; k++) if (r() < 0.6) g.fillRect(x + 20 + r() * (bw - 40), top + bh * 0.4, 18, 90 + r() * 60);
      // window holes
      g.globalCompositeOperation = "destination-out";
      for (let k = 0; k < 3; k++) if (r() < 0.7) g.fillRect(x + 20 + k * (bw / 3), top + bh * 0.15, bw / 3 - 30, bh * 0.14);
      g.globalCompositeOperation = "source-over";
      x += bw + 10 + r() * 30;
    }
  });
}

export function c2Uprising(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: GRADE.g757 });
    const sky = st.sky({ top: 0x0a0304, mid: 0x30100a, bot: 0x8a2a0c, midY: 0.45, cloud: 0.85, cloudColor: 0x24100a, cloudScale: 1.6, cloudSpeed: [0.02, 0.02], cloudY: [0.3, 1.1], glow: 1.0, glowColor: 0xff5a14, glowY: 0.2 });
    const back = st.layer({ tex: townTex(5), z: -30, y: -3.5, tone: 0x120605, fog: 0.25, fogColor: 0x6a200a, rim: 0.9, rimDir: [0, 1], light: 0xff7a2a });
    const fire = st.smoke({ z: -31, y: -0.5, color: 0x7a2004, lit: 0xffa040, density: 1.0, scale: 2.6, speed: [0.0, 0.3], edge: [0.1, 0.2, 0.7, 0.4], seed: 2 });
    const embers = st.particles({ mode: 0, count: 380, box: [26, 14, 18], center: [0, -1, -14], size: 0.11, color: 0xff7a2a, wind: 0.4, seed: 7 });
    const front = st.layer({ tex: townTex(9), z: -10, y: -3.0, tone: 0x060203, rim: 1.2, rimDir: [0, 1], light: 0xff7a2a });
    const men = sil(st, "fig_revolutionaries", { z: -4, w: 9.5, y: -1.75, tone: 0x050203, rim: 1.4, rimDir: [-0.5, 0.5], light: 0xffa050, rimW: 0.003 });
    const smoke = st.smoke({ z: -2, color: 0x1a0805, lit: 0x5a1a06, density: 0.45, scale: 1.2, speed: [0.05, 0.06], edge: [0.0, 0.3, 1.0, 0.7], seed: 8 });
    const shots = [];
    const r = rng(19);
    for (let i = 0; i < 6; i++) shots.push({ at: 0.6 + i * 0.9 + r() * 0.3, x: (r() - 0.2) * 3 });
    const fl = shots.map((s) => st.glow({ x: s.x, y: -0.9, z: -3.9, size: 1.4, color: 0xffd090 }));
    st.onUpdate((t, dur, T) => {
      men.position.x = lerp(-7, 3.5, t / dur);
      shots.forEach((s, i) => {
        const k = Math.exp(-Math.pow((t - s.at) * 12, 2));
        fl[i].userData.u.uAmt.value = k * 1.5;
        fl[i].position.x = men.position.x + 3.2 + s.x * 0.3;
      });
      const f = flicker(T, 2);
      sky.userData.u.uFlick.value = f;
      const p = sine(t / dur);
      st.camera.position.set(lerp(-0.5, 0.5, p), -0.3, lerp(9.5, 8.6, p));
      st.camera.lookAt(lerp(-0.3, 0.6, p), -0.5, -10);
    });
    return st;
  };
}
