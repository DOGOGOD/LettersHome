// 家书 — chapter 3 (1914), chapter 4 (1936), chapter 5 (1942), epilogue.
import { THREE, Stage, rng, clamp, lerp, sstep, inOut, sine, flicker, canvasTex, GLSL, paperMaterial } from "./world.js";
import { SIL, P, sheetMaterial, Hand, FONTS, textTex } from "./kit.js";
import { addLamp, lampShot, shadowShot, letterShot, photoShot, sil, GRADE, setLight, lightUV } from "./shots_common.js";

const W = "#fff";

// ================================================================= CHAPTER 3 — 1914
export const c3Lamp = (o) => lampShot(Object.assign({ kind: "candle", wall: 0x5a4634, grade: GRADE.g1914, rain: true, seed: 31 }, o));

// no man's land under a falling flare, in rain
export function c3Nomans(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: GRADE.g1914 });
    const sky = st.sky({ top: 0x05070a, mid: 0x111820, bot: 0x1e262c, midY: 0.5, cloud: 0.7, cloudColor: 0x1a2128, cloudScale: 1.4, cloudSpeed: [0.02, 0], cloudY: [0.35, 1.1] });
    const flareCol = 0xe6f2ff;
    const layers = [
      st.layer({ tex: P.ridge({ base: 0.62, amp: 0.025, freq: 3, seed: 91 }), z: -60, y: -2.6, tone: 0x0a0e12, fog: 0.2, fogColor: 0x26303a, rim: 0.6, rimDir: [0, 1], light: flareCol, lightAmt: 0.0 }),
      st.layer({ tex: P.stumps({ base: 0.7, count: 7, seed: 92 }), z: -40, y: -1.8, tone: 0x06090c, fog: 0.12, fogColor: 0x26303a, rim: 0.8, rimDir: [0, 1], light: flareCol }),
      st.layer({ tex: P.wire({ base: 0.75, stakes: 22, seed: 93 }), z: -26, y: -2.3, tone: 0x05070a, fog: 0.06, fogColor: 0x26303a, rim: 0.45, rimDir: [0, 1], light: flareCol, rimW: 0.002 }),
      st.layer({ tex: P.craters({ base: 0.68, count: 8, seed: 94 }), z: -16, y: -2.6, tone: 0x070a0d, fog: 0.1, fogColor: 0x26303a, rim: 0.9, rimDir: [0, 1], light: flareCol }),
      st.layer({ tex: P.wire({ base: 0.72, stakes: 9, seed: 95 }), z: -6, y: -2.2, tone: 0x040608, rim: 0.5, rimDir: [0, 1], light: flareCol, rimW: 0.002 }),
      st.layer({ tex: P.sandbags({ top: 0.7, rows: 3, seed: 96 }), z: 2.5, y: -2.0, size: [st.fillSize(2.5)[0], 3.6], tone: 0x030405, rim: 0.9, rimDir: [0, 1], light: flareCol }),
    ];
    const flare = st.glow({ x: 2, y: 3, z: -30, size: 7, color: 0xdcecff, amt: 1 });
    const flareSky = st.glow({ x: 2, y: 3, z: -59, size: 70, core: 0, color: 0x6a7a8a, amt: 1 });
    const fog = st.smoke({ z: -20, y: -1.5, color: 0x2a343e, lit: 0x000000, density: 0.4, scale: 1.3, speed: [0.02, 0.0], edge: [0.1, 0.25, 0.6, 0.4], seed: 6 });
    const rain = st.particles({ mode: 1, count: 1800, box: [26, 14, 18], center: [0, 0, -6], size: 0.55, speed: 1.1, color: 0xa8b8c8, opacity: 0.3, wind: 0.5, seed: 7 });
    st.onUpdate((t, dur, T) => {
      const k = clamp(t / dur);
      const fx = lerp(1.5, 3.8, k),
        fy = lerp(4.2, 1.2, k);
      flare.position.set(fx, fy, -30);
      flareSky.position.set(fx * 2, fy * 1.6, -59);
      const fl = 0.85 + 0.15 * flicker(T * 3, 7);
      const bright = (1 - 0.35 * k) * fl;
      flare.userData.u.uAmt.value = 1.1 * bright;
      flareSky.userData.u.uAmt.value = 0.9 * bright;
      for (const m of layers) {
        m.userData.u.uLightPos.value.set(...lightUV(m, fx * (1 + (m.position.z + 30) / 60), fy));
        m.userData.u.uLightAmt.value = 0.1 * bright;
        m.userData.u.uLightFall.value = 0.8;
        m.userData.u.uFlick.value = bright;
      }
      sky.userData.u.uMid.value.setRGB(0.07 + 0.08 * bright, 0.09 + 0.1 * bright, 0.12 + 0.11 * bright);
      rain.userData.u.uOpacity.value = 0.18 + 0.2 * bright;
      const p = sine(t / dur);
      st.camera.position.set(lerp(-0.6, 0.4, p), lerp(-0.6, -0.4, p), lerp(10, 8.8, p));
      st.camera.lookAt(lerp(-0.4, 0.4, p), -0.6, -20);
    });
    return st;
  };
}

export const c3Shadow = (o) =>
  shadowShot(Object.assign({ sil: "fig_floch_writing", wall: 0x6e5a46, rain: true, lamp: { kind: "candle", x: -3.2, y: -1.4, h: 1.3, seed: 31 }, shadow: { cx: 0.6, cy: 0.46, s: 0.82 }, grade: GRADE.g1914 }, o));
// the mirror: the German soldier, composed as Floch's shot flipped left-right
export const c3Mirror = (o) =>
  shadowShot(Object.assign({ sil: "fig_german_writing", wall: 0x6a5846, rain: false, lamp: { kind: "candle", x: 3.2, y: -1.4, h: 1.3, seed: 37 }, shadow: { cx: 0.4, cy: 0.46, s: 0.82, flip: true }, cam: [0.4, -0.2], grade: GRADE.g1914 }, o));

export const c3Letter = (o) =>
  letterShot(Object.assign({ hand: { font: FONTS.cedar, size: 76, lineGap: 1.5, w: 2048, h: 1500, margin: [0.1, 0.1], seed: 13, jitter: 0.07 }, paper: 0xd6c9aa, inkColor: 0x1f1d22, light: [0.0, 0.3], age: 0.55, rain: true, grade: GRADE.g1914, follow: 0.6 }, o));

// dawn, fog, six stakes; the volley at cfg.volleyAt
export function c3Dawn(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: { lift: [0.02, 0.025, 0.03], gain: [0.92, 0.96, 1.0], gamma: 1.0, sat: 0.35 } });
    const fogC = 0x9aa3aa;
    st.sky({ top: 0x6a737a, mid: 0x8c959c, bot: 0xa8b0b4, midY: 0.5, cloud: 0.3, cloudColor: 0xa0a8ae, cloudY: [0.3, 1.0] });
    st.layer({ tex: P.stumps({ base: 0.72, count: 9, seed: 101 }), z: -50, y: -1.8, tone: 0x5a6268, fog: 0.75, fogColor: fogC });
    st.smoke({ z: -36, color: 0xa0a8ae, density: 0.7, scale: 1.0, speed: [0.01, 0], edge: [0.0, 0.2, 0.9, 0.5], seed: 1 });
    const stakes = canvasTex(2048, 1024, (g, w, h) => {
      g.fillStyle = W;
      g.fillRect(0, h * 0.86, w, h);
      for (let i = 0; i < 6; i++) {
        const x = w * (0.18 + i * 0.13);
        g.fillRect(x - 10, h * 0.42, 20, h * 0.46);
        g.fillRect(x - 13, h * 0.42, 26, 10);
      }
    });
    st.layer({ tex: stakes, z: -22, y: -1.2, tone: 0x2a3034, fog: 0.4, fogColor: fogC });
    st.smoke({ z: -15, color: 0xa8b0b6, density: 0.5, scale: 1.2, speed: [0.015, 0], edge: [0.0, 0.2, 0.7, 0.4], seed: 2 });
    const squad = sil(st, "fig_firing_squad", { z: -6, w: 10.5, x: -3.0, y: -1.55, tone: 0x14181b, fog: 0.08, fogColor: fogC });
    st.layer({ tex: P.ridge({ base: 0.8, amp: 0.01, freq: 2, seed: 102 }), z: 2, y: -2.0, size: [st.fillSize(2)[0], 3], tone: 0x1a1e20 });
    const flashes = [];
    for (let i = 0; i < 7; i++) flashes.push(st.glow({ x: -8.25 + (0.215 + 0.122 * i) * 10.5, y: -1.02, z: -5.9, size: 0.9, color: 0xfff0c0 }));
    const crows = st.particles({ mode: 3, count: 40, box: [10, 5, 4], center: [3, 2.5, -14], size: 0.14, color: 0x101214, opacity: 0.0, wind: -1.6, speed: 6, seed: 3, additive: false });
    st.onUpdate((t, dur, T) => {
      const v = cfg.volleyAt ?? dur * 0.7;
      const k = Math.exp(-Math.pow((t - v) * 14, 2));
      flashes.forEach((f) => (f.userData.u.uAmt.value = k * 1.6));
      crows.userData.u.uOpacity.value = sstep(v + 0.1, v + 0.6, t) * 0.9;
      crows.userData.u.uTime.value = Math.max(0, t - v) + 2;
      const p = sine(t / dur);
      st.camera.position.set(lerp(0.4, -0.2, p) + k * 0.03, -0.2, lerp(9.8, 9.2, p));
      st.camera.lookAt(lerp(0.6, 0.2, p), -0.4, -10);
    });
    return st;
  };
}

function treeTex() {
  return canvasTex(256, 384, (g, w, h) => {
    g.fillStyle = W;
    for (let i = 0; i < 4; i++) {
      const y0 = h * (0.15 + i * 0.18),
        ww = w * (0.18 + i * 0.1);
      g.beginPath();
      g.moveTo(w / 2, y0 - h * 0.08);
      g.lineTo(w / 2 + ww, y0 + h * 0.14);
      g.lineTo(w / 2 - ww, y0 + h * 0.14);
      g.fill();
    }
    g.fillRect(w * 0.46, h * 0.8, w * 0.08, h * 0.2);
  });
}

// Christmas Eve truce: candles on the parapet, stars, men meeting in the middle
export function c3Truce(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: { lift: [0.0, 0.006, 0.02], gain: [0.96, 0.98, 1.06], gamma: 1.0, sat: 0.7 } });
    st.sky({ top: 0x02040b, mid: 0x0a1428, bot: 0x18243a, midY: 0.45, stars: 1.2 });
    st.layer({ tex: P.ridge({ base: 0.62, amp: 0.02, freq: 3, seed: 111 }), z: -60, y: -2.4, tone: 0x0a1020, fog: 0.3, fogColor: 0x1a2640 });
    const parapet = st.layer({ tex: P.sandbags({ top: 0.55, rows: 3, seed: 112 }), z: -24, y: -3.4, tone: 0x070a12, rim: 0.8, rimDir: [0, 1], light: 0xffb25a, lightAmt: 0.0 });
    const [pw] = st.fillSize(-24, 10, 1.25);
    const candles = [];
    const trees = [];
    const r = rng(7);
    const tt = treeTex();
    for (let i = 0; i < 16; i++) {
      const x = (i / 15 - 0.5) * pw * 0.85 + (r() - 0.5) * 0.6;
      const y = -3.4 + (0.5 - 0.55) * st.fillSize(-24, 10, 1.25)[1] + 0.05;
      if (i % 3 === 1) {
        const tr = st.layer({ tex: tt, z: -23.9, x, y: y + 0.55, w: 0.75, h: 1.1, tone: 0x060a10, rim: 0.7, rimDir: [0, 0], light: 0xffb25a });
        trees.push(tr);
      }
      candles.push(st.flame({ x, y: y + 0.25 + (i % 3 === 1 ? 0.75 : 0), z: -23.8, size: 0.32, seed: i, halo: 2.6 }));
    }
    const frost = st.layer({ tex: P.craters({ base: 0.6, count: 6, seed: 113 }), z: -14, y: -3.0, tone: 0x1a2232, rim: 0.5, rimDir: [0, 1], light: 0xbcd0ff });
    const men = sil(st, "fig_truce", { z: -8, w: 11.5, y: -1.9, tone: 0x05070c, rim: 0.9, rimDir: [0, 1], light: 0xd8e4ff, rimW: 0.003 });
    const breath = st.particles({ mode: 4, count: 60, box: [8, 0.6, 1], center: [0, -0.1, -7.6], size: 0.16, color: 0xc8d4e8, opacity: 0.25, seed: 9 });
    const snow = st.particles({ mode: 2, count: 500, box: [24, 12, 14], center: [0, 1, -6], size: 0.06, color: 0xdfe8ff, opacity: 0.6, seed: 10 });
    st.layer({ tex: P.wire({ base: 0.8, stakes: 8, seed: 114 }), z: 3, y: -2.4, size: [st.fillSize(3)[0], 3.5], tone: 0x020306, rim: 0.4, rimDir: [0, 1], light: 0xbcd0ff });
    st.onUpdate((t, dur, T) => {
      candles.forEach((c, i) => {
        const outAt = cfg.outFrom != null ? cfg.outFrom + i * ((cfg.outTo - cfg.outFrom) / candles.length) : 1e9;
        c.userData.u.uOut.value = sstep(outAt, outAt + 0.4, t);
      });
      const lit = 1 - (cfg.outFrom != null ? sstep(cfg.outFrom, cfg.outTo, t) : 0);
      parapet.userData.u.uRim.value = 0.8 * lit + 0.1;
      men.userData.u.uOpacity.value = cfg.menOut != null ? 1 - sstep(cfg.menOut, cfg.menOut + 2.5, t) : 1;
      breath.userData.u.uOpacity.value = 0.25 * men.userData.u.uOpacity.value;
      const p = sine(t / dur);
      st.camera.position.set(lerp(-0.8, 0.6, p), lerp(-0.3, -0.1, p), lerp(10, 8.8, p));
      st.camera.lookAt(lerp(-0.4, 0.4, p), -0.6, -14);
    });
    return st;
  };
}

// ================================================================= CHAPTER 4 — 1936
// light through the slats of a moving boxcar; cfg.outAt → the train enters darkness
export function c4Slats(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: GRADE.g1936 });
    const [ww, wh] = st.fillSize(-2, 10, 1.25);
    const boards = canvasTex(2048, 1152, (g, w, h) => {
      g.fillStyle = W;
      g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = "destination-out";
      const r = rng(3);
      for (let x = 60; x < w; x += 150 + r() * 30) g.fillRect(x, 0, 6 + r() * 6, h);
    });
    const wallMat = sheetMaterial({ ink: boards, inkColor: 0x2e2216, paper: 0x6a5238, deckle: 0, folds: 0, age: 0.3, fiber: 0.16, aspect: ww / wh, ambient: 0.04, lightAmt: 0.0 });
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), wallMat);
    wall.position.z = -2.05;
    st.add(wall);
    st.timed.push(wallMat.uniforms);
    const dust = st.particles({ mode: 4, count: 200, box: [10, 5, 3], center: [0, 0, -0.5], size: 0.025, color: 0xfff0d0, opacity: 0.5, seed: 4 });
    st.onUpdate((t, dur, T) => {
      const dark = cfg.outAt != null ? sstep(cfg.outAt, cfg.outAt + 1.6, t) : 0;
      const sweep = (T * 0.35) % 1;
      wallMat.uniforms.uStripes.value.set(1.6 * (1 - dark), 9, T * 1.4, -0.6);
      dust.userData.u.uOpacity.value = 0.5 * (1 - dark);
      const shake = Math.sin(T * 23) * 0.006 + Math.sin(T * 7.1) * 0.01;
      st.camera.position.set(lerp(-0.3, 0.3, t / dur), shake, 8.5);
      st.camera.lookAt(0, 0, -2);
    });
    return st;
  };
}

export function c4Train(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: GRADE.g1936 });
    const sky = st.sky({ top: 0x14181a, mid: 0x3c423e, bot: 0x8c8c74, midY: 0.32, cloud: 0.95, cloudColor: 0x1e2224, cloudScale: 1.3, cloudSpeed: [0.03, 0.0], cloudY: [0.28, 1.1] });
    st.layer({ tex: P.ridge({ base: 0.7, amp: 0.008, freq: 2, seed: 121 }), z: -60, y: -2.0, tone: 0x3a3e36, fog: 0.55, fogColor: 0x7a7c68 });
    const sorgFar = st.layer({ tex: P.sorghum({ base: 0.8, count: 420, height: 0.14, seed: 122 }), z: -36, y: -2.3, tone: 0x2a2c24, fog: 0.4, fogColor: 0x7a7c68 });
    const [tw] = st.fillSize(-26, 10, 1.25);
    const train = sil(st, "fig_locomotive", { z: -26, w: 13, y: -1.45, tone: 0x0c0d0c, fog: 0.15, fogColor: 0x7a7c68, rim: 0.4, rimDir: [0, 1], light: 0xd8d4c0 });
    const steam = st.smoke({ z: -26.2, w: 14, h: 4, color: 0x4a4846, density: 0.55, scale: 2.6, speed: [0.25, 0.05], edge: [0.0, 0.4, 1.0, 0.6], seed: 4 });
    const rails = st.layer({ tex: P.ridge({ base: 0.86, amp: 0.002, freq: 1, seed: 1 }), z: -25.9, y: -1.7, tone: 0x0c0d0c, fog: 0.15, fogColor: 0x7a7c68 });
    const sorgMid = st.layer({ tex: P.sorghum({ base: 0.86, count: 240, height: 0.18, seed: 123 }), z: -12, y: -2.3, tone: 0x14160f, fog: 0.15, fogColor: 0x7a7c68 });
    const sorgNear = st.layer({ tex: P.sorghum({ base: 0.9, count: 70, height: 0.42, seed: 124 }), z: 2, y: -2.2, size: [st.fillSize(2)[0], 4.5], tone: 0x070806, rim: 0.4, rimDir: [0, 1], light: 0xd8d4c0 });
    st.onUpdate((t, dur, T) => {
      const x = lerp(12, -8, t / dur);
      train.position.x = x;
      rails.position.x = 0;
      steam.position.set(x + 3.6, 0.9, -26.2);
      sorgNear.position.x = Math.sin(T * 0.9) * 0.08;
      sorgMid.position.x = Math.sin(T * 0.9 + 1) * 0.05;
      const lightning = Math.exp(-Math.pow((t - (cfg.flashAt ?? 1e9)) * 9, 2)) + Math.exp(-Math.pow((t - (cfg.flashAt ?? 1e9) - 0.25) * 12, 2)) * 0.6;
      sky.userData.u.uLightning.value = lightning * 0.5;
      const p = sine(t / dur);
      st.camera.position.set(lerp(-1.0, 1.2, p), -0.5, lerp(10, 9.2, p));
      st.camera.lookAt(lerp(-0.8, 1.4, p), -0.9, -20);
    });
    return st;
  };
}

export const c4Shadow = (o) =>
  shadowShot(
    Object.assign(
      { sil: "fig_zhao_writing", wall: 0x9a8064, ambient: 0.32, lamp: { kind: "candle", x: -30, y: -30, h: 0.1, seed: 41 }, shadow: { cx: 0.58, cy: 0.47, s: 0.82 }, stripes: { amt: 1.0, period: 7, speed: 1.4, angle: -0.6 }, blur: 4, grade: GRADE.g1936 },
      o,
    ),
  );

export const c4Letter = (o) =>
  letterShot(
    Object.assign(
      { hand: { font: FONTS.kai, size: 66, lineGap: 1.6, w: 2048, h: 1450, margin: [0.1, 0.1], seed: 17, jitter: 0.05 }, paper: 0xcfc4a6, inkColor: 0x3a3a3c, light: [0.5, 0.5], lightFall: 0.3, lightAmt: 0.7, ambient: 0.15, age: 0.5, stripes: { amt: 0.9, period: 5, speed: 1.4, angle: -0.6 }, grade: GRADE.g1936, follow: 0.6 },
      o,
    ),
  );

export const c4Photo = (o) => photoShot(Object.assign({ sil: "fig_mother_child", aspect: 0.72, grade: GRADE.g1936 }, o));

export function c4Boy(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: { lift: [0.012, 0.01, 0.004], gain: [1.04, 1.0, 0.9], gamma: 1.0, sat: 0.6 } });
    st.sky({ top: 0xcfc6ae, mid: 0xe6dcc0, bot: 0xd2c4a0, midY: 0.5 });
    st.layer({ tex: P.ridge({ base: 0.55, amp: 0.02, freq: 2, seed: 131 }), z: -20, y: -1.5, tone: 0x9a8e74, fog: 0.4, fogColor: 0xe0d4b8 });
    const boy = sil(st, "fig_boy_doorstep", { z: -1, h: 5.4, x: -0.6, y: -0.3, tone: 0x120d09, rim: 0.9, rimDir: [1, 0], light: 0xfff0d0 });
    const leaves = st.particles({ mode: 3, count: 20, box: [10, 5, 3], center: [1, 0, 0], size: 0.08, color: 0x4a3a24, opacity: 0.8, wind: 1.2, seed: 5, additive: false });
    st.onUpdate((t, dur, T) => {
      const p = sine(t / dur);
      st.camera.position.set(lerp(0.6, 0.1, p), -0.1, lerp(10, 8.9, p));
      st.camera.lookAt(lerp(0.4, 0.0, p), 0, -1);
    });
    return st;
  };
}

// ================================================================= CHAPTER 5 — 1942
export const c5Lamp = (o) => lampShot(Object.assign({ kind: "kerosene", wall: 0xa88a64, grade: GRADE.g1942, seed: 51 }, o));

export function c5Taihang(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: GRADE.g1942 });
    st.sky({ top: 0x182030, mid: 0x6a5a5a, bot: 0xe0a060, midY: 0.32, cloud: 0.35, cloudColor: 0x8a6a62, cloudY: [0.5, 1.0], glow: 0.6, glowColor: 0xffa050, glowY: 0.25, glowX: [0.3, 0.5] });
    const defs = [
      { z: -80, base: 0.42, amp: 0.1, tone: 0x5a5868, fog: 0.62, seed: 141 },
      { z: -58, base: 0.48, amp: 0.12, tone: 0x46465a, fog: 0.48, seed: 142 },
      { z: -38, base: 0.5, amp: 0.13, tone: 0x30303e, fog: 0.32, seed: 143 },
      { z: -22, base: 0.55, amp: 0.12, tone: 0x1c1a22, fog: 0.16, seed: 144 },
      { z: -9, base: 0.62, amp: 0.1, tone: 0x0d0b0e, fog: 0.04, seed: 145 },
    ];
    const clouds = [];
    defs.forEach((d, i) => {
      st.layer({ tex: P.cliffs({ base: d.base, amp: d.amp * 1.6, seed: d.seed, crevices: 30 + i * 10 }), z: d.z, y: -1.2 - i * 0.15, tone: d.tone, fog: d.fog, fogColor: 0xb89a88, rim: 0.7, rimDir: [-0.5, 1], light: 0xffb070, rimW: 0.0025 });
      if (i < 4) clouds.push(st.smoke({ z: d.z + 3, y: -2.2 - i * 0.2, color: 0xd8c8c0, lit: 0x302020, density: 0.75, scale: 1.1, speed: [0.03 - i * 0.004, 0.0], edge: [0.1, 0.3, 0.55, 0.38], seed: 20 + i }));
    });
    const column = sil(st, "fig_soldier_column", { z: -21.8, w: 6, x: -2, y: 0.25, tone: 0x1c1a22, fog: 0.16, fogColor: 0xb89a88 });
    const birds = st.particles({ mode: 3, count: 12, box: [6, 2, 2], center: [1, 2, -30], size: 0.18, color: 0x1a1a20, opacity: 0.8, wind: 2.0, speed: 1.5, seed: 9, additive: false });
    st.onUpdate((t, dur, T) => {
      column.position.x = lerp(-3, 1, t / dur);
      const p = sine(t / dur);
      st.camera.position.set(lerp(-1.2, 1.0, p), lerp(0.4, 0.0, p), lerp(10, 8.5, p));
      st.camera.lookAt(lerp(-0.8, 0.8, p), -0.4, -30);
    });
    return st;
  };
}

export const c5Shadow = (o) =>
  shadowShot(Object.assign({ sil: "fig_zuo_writing", wall: 0xb4956c, lamp: { kind: "kerosene", x: -3.1, y: -1.3, h: 1.8, seed: 51 }, shadow: { cx: 0.6, cy: 0.47, s: 0.82 }, grade: GRADE.g1942 }, o));

// 左权 writes with a brush: a bold brush-kai hand, black ink (赵一曼's pencil, 林觉民's running brush and the son's
// fountain pen each have their own)
export const c5Letter = (o) =>
  letterShot(Object.assign({ stroke: true, hand: { size: 92, grid: 104, w: 2048, h: 1400, margin: [0.1, 0.14], seed: 19, jitter: 0.05, font: FONTS.brush, punctFont: FONTS.brush, color: "#000" }, paper: 0xdccfae, inkColor: 0x140e0a, light: [0.02, 0.7], grade: GRADE.g1942, follow: 0.6 }, o));

export const c5Photo = (o) => photoShot(Object.assign({ sil: "fig_family_photo", aspect: 0.8, grade: GRADE.g1942 }, o));

function planeTex() {
  return canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = W;
    g.beginPath();
    g.ellipse(w * 0.5, h * 0.5, w * 0.42, h * 0.07, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(w * 0.4, h * 0.5);
    g.lineTo(w * 0.62, h * 0.5);
    g.lineTo(w * 0.52, h * 0.95);
    g.lineTo(w * 0.46, h * 0.95);
    g.fill();
    g.beginPath();
    g.moveTo(w * 0.12, h * 0.5);
    g.lineTo(w * 0.2, h * 0.5);
    g.lineTo(w * 0.1, h * 0.25);
    g.fill();
  });
}

export function c5Battle(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: GRADE.g1942 });
    const sky = st.sky({ top: 0x1a1414, mid: 0x5a3a2a, bot: 0xa85a2a, midY: 0.4, cloud: 0.8, cloudColor: 0x3a2a24, cloudScale: 1.4, cloudSpeed: [0.03, 0.01], cloudY: [0.3, 1.1], glow: 0.7, glowColor: 0xff7030, glowY: 0.2 });
    st.layer({ tex: P.cliffs({ base: 0.45, amp: 0.18, seed: 151 }), z: -50, y: -1.8, tone: 0x3a2a26, fog: 0.4, fogColor: 0x8a5a3a });
    const ridge = st.layer({ tex: P.cliffs({ base: 0.56, amp: 0.14, seed: 152 }), z: -24, y: -2.0, tone: 0x140e0c, fog: 0.12, fogColor: 0x8a5a3a, rim: 0.8, rimDir: [0, 1], light: 0xff8a40 });
    const blasts = [];
    const r = rng(23);
    for (let i = 0; i < 6; i++) {
      const at = 0.8 + i * ((cfg.dur ?? 7) / 6.5) + r() * 0.4;
      const x = (r() - 0.5) * 16;
      blasts.push({ at, x, fl: st.glow({ x, y: -0.4, z: -24.5, size: 9, color: 0xffa050 }), sm: st.smoke({ z: -25, x, y: 1.6, w: 7, h: 9, color: 0x2a2220, lit: 0x7a3010, density: 0, scale: 2.0, speed: [0.0, 0.08], edge: [0.0, 0.15, 1.0, 0.6], seed: 30 + i }) });
    }
    const pt = planeTex();
    const planes = [0, 1, 2].map((i) => st.layer({ tex: pt, z: -30, w: 2.0, h: 1.0, tone: 0x0e0a0a, fog: 0.2, fogColor: 0x8a5a3a }));
    st.layer({ tex: P.ridge({ base: 0.7, amp: 0.03, freq: 3, seed: 153 }), z: 2, y: -2.3, size: [st.fillSize(2)[0], 3.4], tone: 0x070505, rim: 0.6, rimDir: [0, 1], light: 0xff8a40 });
    const ash = st.particles({ mode: 0, count: 260, box: [24, 12, 14], center: [0, -1, -12], size: 0.1, color: 0xff7a2a, wind: 0.5, seed: 8 });
    st.onUpdate((t, dur, T) => {
      let glow = 0;
      for (const b of blasts) {
        const k = Math.exp(-Math.pow((t - b.at) * 6, 2));
        b.fl.userData.u.uAmt.value = k * 1.5;
        b.sm.userData.u.uDensity.value = 0.8 * sstep(b.at, b.at + 0.5, t);
        b.sm.position.y = 1.6 + Math.max(0, t - b.at) * 0.25;
        glow += k;
      }
      sky.userData.u.uGlow.value = 0.7 + glow * 0.8;
      planes.forEach((p, i) => {
        p.position.set(lerp(-14 - i * 2.5, 16 - i * 2.5, t / dur), 3.2 + i * 0.5, -30);
      });
      const p = sine(t / dur);
      st.camera.position.set(lerp(-0.6, 0.5, p) + Math.sin(T * 40) * 0.03 * glow, -0.4 + Math.cos(T * 33) * 0.03 * glow, lerp(10, 9, p));
      st.camera.lookAt(0, -0.6, -20);
    });
    return st;
  };
}

// ================================================================= EPILOGUE
// a street of paper houses at night; five windows light up one by one (cfg.at: local times)
export function eWindows(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: GRADE.gEpi });
    st.sky({ top: 0x03050a, mid: 0x0a1020, bot: 0x141c2c, midY: 0.5, stars: 0.6 });
    const houses = canvasTex(4096, 1024, (g, w, h) => {
      const r = rng(17);
      g.fillStyle = W;
      for (let i = 0; i < 5; i++) {
        const cx = w * ((i + 0.5) / 5),
          bw = w / 5 - 40,
          top = h * 0.5;
        g.fillRect(cx - bw / 2, top, bw, h - top);
        g.beginPath();
        g.moveTo(cx - bw / 2 - 30, top + 4);
        g.lineTo(cx, top - h * (0.16 + r() * 0.06));
        g.lineTo(cx + bw / 2 + 30, top + 4);
        g.fill();
        g.globalCompositeOperation = "destination-out";
        g.fillRect(cx - 120, 614, 240, 260);
        g.globalCompositeOperation = "source-over";
        g.fillRect(cx - 4, 614, 8, 260);
        g.fillRect(cx - 120, 740, 240, 8);
      }
    });
    const [hw] = st.fillSize(-6, 10, 1.25);
    const rowW = hw * 1.05,
      rowH = rowW * 0.25;
    const row = st.layer({ tex: houses, z: -6, w: rowW, h: rowH, y: -1.0, tone: 0x070910, rim: 0.4, rimDir: [0, 1], light: 0x8090b0 });
    const glows = [];
    for (let i = 0; i < 5; i++) {
      const gx = ((i + 0.5) / 5 - 0.5) * rowW;
      const gy = -1.0 + (0.5 - 744 / 1024) * rowH;
      glows.push(st.layer({ z: -6.05, x: gx, y: gy, w: (260 / 4096) * rowW, h: (280 / 1024) * rowH, tone: 0xffb25a, opacity: 0 }));
    }
    // transparent layers are sorted by distance to the camera: as it pans, an end window's glow would count as
    // nearer than the row's centre and draw over the house (a bare lit square). The glow is always behind.
    glows.forEach((g) => (g.renderOrder = -1));
    row.renderOrder = 1;
    const snow = st.particles({ mode: 2, count: 600, box: [26, 12, 12], center: [0, 1, -3], size: 0.05, color: 0xe6eeff, opacity: 0.55, seed: 4 });
    st.layer({ tex: P.ridge({ base: 0.7, amp: 0.01, freq: 2, seed: 161 }), z: 1, y: -2.3, size: [st.fillSize(1)[0], 3], tone: 0xc8d0dc, lightAmt: 0.0, fog: 0.2, fogColor: 0x101828 });
    st.onUpdate((t, dur, T) => {
      glows.forEach((g, i) => {
        const at = cfg.at?.[i] ?? 1 + i * 1.2;
        g.userData.u.uOpacity.value = sstep(at, at + 0.8, t) * (0.92 + 0.08 * flicker(T, i));
      });
      const p = sine(t / dur);
      st.camera.position.set(lerp(-1.5, 1.5, p), lerp(-0.2, 0.0, p), lerp(10, 9.3, p));
      st.camera.lookAt(lerp(-1.3, 1.3, p), -0.6, -6);
    });
    return st;
  };
}

export const eWords = (o) =>
  letterShot(Object.assign({ hand: { font: FONTS.kai, size: 150, lineGap: 1.5, w: 1800, h: 1300, margin: [0.2, 0.18], seed: 23, jitter: 0.03 }, paper: 0xdccfb0, inkColor: 0x15100c, light: [0.1, 0.7], grade: GRADE.gEpi, follow: 0.3, zFrom: 8.6, zTo: 8.0, folds: 0.5 }, o));

// the field: thousands of paper graves to the horizon; letters fall like snow; the camera rises
export function eGraves(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: { lift: [0.01, 0.012, 0.016], gain: [1.0, 1.0, 1.02], gamma: 1.0, sat: 0.55 }, fov: 40 });
    const horizon = new THREE.Color(0xc7cdd2);
    st.scene.fog = new THREE.Fog(horizon, 6, 120);
    const sky = st.sky({ z: -200, top: 0x6a7682, mid: 0xb8c0c6, bot: 0xd8d8d0, midY: 0.48, glow: 0.35, glowColor: 0xffd8a8, glowY: 0.42, glowX: [0.6, 0.75], cloud: 0.35, cloudColor: 0xa8b0b8, cloudY: [0.5, 1.0] });
    sky.material.fog = false;
    const groundMat = new THREE.MeshBasicMaterial({ color: 0x8e9396 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.6;
    st.add(ground);
    const kinds = [0, 1, 2, 3].map((k) => P.marker(k));
    const r = rng(77);
    const per = [];
    for (let k = 0; k < 4; k++) per.push([]);
    const rows = 70,
      cols = 46;
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const x = (i - cols / 2) * 2.2 + (j % 2) * 1.1 + (r() - 0.5) * 0.3;
        const z = 4 - j * 2.6 + (r() - 0.5) * 0.4;
        const kind = Math.floor(r() * 4);
        per[kind].push([x, z, 0.92 + r() * 0.18, (r() - 0.5) * 0.25]);
      }
    const dummy = new THREE.Object3D();
    kinds.forEach((tex, k) => {
      const mat = new THREE.MeshBasicMaterial({ map: tex, color: 0xeee8dc, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
      const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.0, 1.5), mat, per[k].length);
      per[k].forEach(([x, z, s, ry], i) => {
        dummy.position.set(x, -1.6 + 0.75 * s, z);
        dummy.rotation.set(0, ry, 0);
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        im.setMatrixAt(i, dummy.matrix);
      });
      st.add(im);
    });
    // falling letters
    const N = 900;
    const envTex = P.envelope();
    const lm = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.42, 0.3), new THREE.MeshBasicMaterial({ map: envTex, side: THREE.DoubleSide, transparent: true, color: 0xf4efe4 }), N);
    lm.frustumCulled = false;
    st.add(lm);
    const seeds = Array.from({ length: N }, () => [r(), r(), r(), r(), r()]);
    st.onUpdate((t, dur, T) => {
      const begin = cfg.lettersFrom ?? 1;
      const count = Math.floor(N * sstep(begin, begin + dur * 0.55, t));
      for (let i = 0; i < N; i++) {
        const [a, b, c, d, e] = seeds[i];
        const born = begin + (i / N) * dur * 0.6;
        const age = t - born;
        if (i >= count || age < 0) {
          dummy.position.set(0, -100, 0);
          dummy.updateMatrix();
          lm.setMatrixAt(i, dummy.matrix);
          continue;
        }
        const fall = Math.min(age * (0.55 + c * 0.35), 14);
        const y = 12 - fall;
        const landed = y <= -1.55;
        dummy.position.set((a - 0.5) * 70 + Math.sin(age * 0.8 + e * 9) * 0.8, Math.max(y, -1.55), 6 - b * 60);
        if (landed) dummy.rotation.set(-Math.PI / 2, 0, e * 6.28);
        else dummy.rotation.set(age * (1 + d) + e * 5, age * 0.7 * (0.5 + c) + a * 3, Math.sin(age * 2 + d * 9) * 0.6);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        lm.setMatrixAt(i, dummy.matrix);
      }
      lm.instanceMatrix.needsUpdate = true;
      const p = inOut(clamp(t / dur));
      st.camera.position.set(0, lerp(0.2, 9.0, p), lerp(9.0, 10.0, p));
      st.camera.lookAt(0, lerp(-0.2, -1.6, p), lerp(-10, -40, p));
    });
    return st;
  };
}

// the house at the end of the road, its one window lit, snow
export function eWindow(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: GRADE.gEpi });
    st.sky({ top: 0x020308, mid: 0x0a0f1e, bot: 0x18203a, midY: 0.45, stars: 0.9 });
    st.layer({ tex: P.ridge({ base: 0.6, amp: 0.04, freq: 2, seed: 171 }), z: -40, y: -1.8, tone: 0x0c1220, fog: 0.3, fogColor: 0x1a2440 });
    const house = sil(st, "fig_window_home", { z: -3, h: 4.6, x: 0.4, y: -0.55, tone: 0x06070b, rim: 0.5, rimDir: [0, 1], light: 0xffb25a });
    st.layer({ tex: P.sheet({ w: 1024, h: 840, hole: [0.203, 0.235, 0.255, 0.3] }), z: -3.02, x: 0.056, y: -1.102, w: 3.03, h: 2.48, tone: 0x0a0b10 });
    const glow = st.layer({ z: -3.06, x: -0.459, y: -0.817, w: 0.9, h: 0.86, tone: 0xffb25a, opacity: 1 });
    const flameIn = st.flame({ x: -0.459, y: -0.93, z: -3.04, size: 0.32, seed: 3, halo: 1.2 });
    const snowGround = st.layer({ tex: P.ridge({ base: 0.62, amp: 0.02, freq: 2, seed: 172 }), z: -1, y: -2.6, size: [st.fillSize(-1)[0], 3], tone: 0xaab4c8, fog: 0.3, fogColor: 0x0a0f1e });
    const snow = st.particles({ mode: 2, count: 900, box: [16, 9, 10], center: [0, 0.5, -1], size: 0.05, color: 0xeaf0ff, opacity: 0.7, seed: 6 });
    st.onUpdate((t, dur, T) => {
      glow.userData.u.uOpacity.value = 0.9 + 0.1 * flicker(T, 5);
      const p = sine(t / dur);
      st.camera.position.set(lerp(0.4, 0.05, p), lerp(-0.2, -0.05, p), lerp(10, 7.2, p));
      st.camera.lookAt(lerp(0.2, -0.2, p), lerp(-0.4, -0.25, p), -3);
    });
    return st;
  };
}
