// 家书 — reusable shot builders: lamps, the writer's shadow on a wall, the letter close-up, old photographs.
import { THREE, Stage, rng, clamp, lerp, sstep, inOut, sine, flicker, canvasTex, blurredTex, paperMaterial } from "./world.js";
import { SIL, P, sheetMaterial, Hand, StrokeHand, FONTS, textTex } from "./kit.js";

const W = "#fff";

// ---------------------------------------------------------------- lamp bodies (white = paper cut)
// returns {tex, wick:[u,v]} — wick position in uv of the lamp texture (v up)
export function lampTex(kind) {
  const w = 512,
    h = 768;
  let wick = [0.5, 0.5];
  const tex = canvasTex(w, h, (g) => {
    g.fillStyle = W;
    g.strokeStyle = W;
    if (kind === "lantern") {
      // brass hurricane lantern
      g.fillRect(150, 640, 212, 70); // fount
      g.fillRect(130, 700, 252, 26);
      g.beginPath();
      g.ellipse(256, 640, 106, 22, 0, 0, Math.PI * 2);
      g.fill();
      g.lineWidth = 9;
      g.beginPath(); // globe outline
      g.ellipse(256, 470, 120, 170, 0, 0, Math.PI * 2);
      g.stroke();
      g.lineWidth = 7; // guard wires
      for (const dx of [-70, 0, 70]) {
        g.beginPath();
        g.moveTo(256 + dx * 1.2, 640);
        g.quadraticCurveTo(256 + dx * 2.1, 470, 256 + dx * 1.0, 300);
        g.stroke();
      }
      g.fillRect(170, 270, 172, 34); // cap
      g.beginPath();
      g.moveTo(180, 270);
      g.lineTo(256, 205);
      g.lineTo(332, 270);
      g.fill();
      g.lineWidth = 10; // bail handle
      g.beginPath();
      g.arc(256, 205, 120, Math.PI * 1.05, Math.PI * 1.95);
      g.stroke();
      g.fillRect(232, 560, 48, 80); // burner
      wick = [0.5, 1 - 560 / h];
    } else if (kind === "dish") {
      // Chinese oil-dish lamp on a turned stand
      g.beginPath();
      g.ellipse(256, 730, 150, 26, 0, 0, Math.PI * 2);
      g.fill();
      g.fillRect(236, 470, 40, 260);
      for (const y of [520, 600, 680]) {
        g.beginPath();
        g.ellipse(256, y, 46, 14, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.beginPath(); // dish
      g.moveTo(130, 440);
      g.quadraticCurveTo(256, 520, 382, 440);
      g.lineTo(372, 432);
      g.lineTo(140, 432);
      g.fill();
      g.lineWidth = 8; // wick lying over the rim
      g.beginPath();
      g.moveTo(240, 455);
      g.quadraticCurveTo(300, 440, 318, 420);
      g.stroke();
      wick = [318 / w, 1 - 418 / h];
    } else if (kind === "candle") {
      g.beginPath(); // tin lid
      g.ellipse(256, 735, 170, 22, 0, 0, Math.PI * 2);
      g.fill();
      g.fillRect(96, 700, 320, 36);
      g.fillRect(196, 520, 120, 190); // stub
      g.beginPath(); // drips + melted crown
      g.moveTo(196, 525);
      for (let x = 196; x <= 316; x += 10) g.lineTo(x, 520 - Math.sin(x * 0.17) * 8 - (x > 230 && x < 290 ? 6 : 0));
      g.lineTo(316, 560);
      g.fill();
      for (const [x, l] of [[204, 70], [300, 110], [250, 40]]) g.fillRect(x - 6, 520, 12, l);
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(256, 516);
      g.lineTo(258, 496);
      g.stroke();
      wick = [0.5, 1 - 494 / h];
    } else if (kind === "kerosene") {
      g.beginPath(); // base and fount
      g.ellipse(256, 735, 140, 22, 0, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.moveTo(150, 730);
      g.quadraticCurveTo(120, 600, 210, 560);
      g.lineTo(302, 560);
      g.quadraticCurveTo(392, 600, 362, 730);
      g.fill();
      g.fillRect(206, 530, 100, 34); // collar
      g.lineWidth = 8; // chimney outline
      g.beginPath();
      g.moveTo(214, 530);
      g.bezierCurveTo(150, 470, 170, 400, 226, 360);
      g.lineTo(226, 220);
      g.moveTo(298, 530);
      g.bezierCurveTo(362, 470, 342, 400, 286, 360);
      g.lineTo(286, 220);
      g.stroke();
      wick = [0.5, 1 - 520 / h];
    }
  });
  return { tex, wick, aspect: w / h };
}

// place a lamp (body + flame + glow light) in a stage. Returns handles.
export function addLamp(st, o) {
  const L = lampTex(o.kind);
  const hgt = o.height ?? 3.2;
  const wdt = hgt * L.aspect;
  const body = st.layer({
    tex: L.tex,
    z: o.z ?? 0,
    x: o.x ?? 0,
    y: o.y ?? 0,
    w: wdt,
    h: hgt,
    tone: o.tone ?? 0x0d0907,
    light: 0xffb25a,
    rim: o.rim ?? 1.6,
    rimDir: [0, -1],
    rimW: 0.006,
    lightAmt: 0.6,
    lightPos: L.wick,
    lightFall: 30,
    fiber: 0.03,
  });
  const fx = (o.x ?? 0) + (L.wick[0] - 0.5) * wdt;
  const fy = (o.y ?? 0) + (L.wick[1] - 0.5) * hgt;
  const fs = o.flame ?? hgt * 0.26;
  const flame = st.flame({ x: fx, y: fy + fs * 0.32, z: (o.z ?? 0) + 0.02, size: fs, seed: o.seed ?? 1, halo: o.halo ?? 1 });
  return { body, flame, fx, fy, L };
}

// smoke wisp rising from an extinguished wick
export function addWisp(st, x, y, z, o = {}) {
  const m = st.smoke({ x, y: y + 1.0, z, w: o.w ?? 0.9, h: o.h ?? 2.6, color: o.color ?? 0x8a8580, density: 0.0, scale: 3.2, speed: [0.0, 0.12], edge: [0.0, 0.1, 1.0, 0.6], seed: o.seed ?? 3 });
  m.userData.u.uLit.value.set(0x000000);
  return m;
}

// ---------------------------------------------------------------- 1. LAMP close-up (opens each chapter, and goes out at the end)
// cfg: {kind, wall: hex, weave, outAt (local s) or null, lightAt (local s) for strike-on, rain, push}
export function lampShot(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: cfg.grade });
    const wallMat = sheetMaterial({ paper: cfg.wall ?? 0x7a6650, lightPos: [0.5, 0.42], lightFall: 2.2, ambient: 0.03, aspect: 16 / 9, weave: cfg.weave ?? 0, folds: 0, deckle: 0, age: 0.2, fiber: 0.08 });
    const [ww, wh] = st.fillSize(-4, 10, 1.3);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), wallMat);
    wall.position.z = -4;
    st.add(wall);
    st.timed.push(wallMat.uniforms);
    const lamp = addLamp(st, { kind: cfg.kind, x: cfg.x ?? 0, y: cfg.y ?? -1.3, z: 0, height: cfg.height ?? 3.6, seed: cfg.seed ?? 2 });
    // light position on the wall in uv
    const lu = [0.5 + lamp.fx / ww, 0.5 + lamp.fy / wh + 0.04];
    wallMat.uniforms.uLightPos.value.set(...lu);
    const wisp = addWisp(st, lamp.fx, lamp.fy, 0.05);
    const dust = st.particles({ mode: 4, count: 90, box: [8, 4.5, 3], center: [lamp.fx, lamp.fy + 0.8, 1], size: 0.025, color: 0xffd9a0, opacity: 0.5, seed: 9 });
    let rain = null;
    if (cfg.rain) rain = st.particles({ mode: 1, count: 900, box: [14, 9, 6], center: [0, 0, 2], size: 0.5, speed: 1.0, color: 0x8fa0b0, opacity: 0.35, wind: 0.6, seed: 4, additive: true });
    st.onUpdate((t, dur, T) => {
      const f = flicker(T, cfg.seed ?? 2);
      let on = 1;
      if (cfg.lightAt != null) on = sstep(cfg.lightAt, cfg.lightAt + 0.35, t);
      let out = 0;
      if (cfg.outAt != null) out = sstep(cfg.outAt, cfg.outAt + 0.7, t);
      const life = on * (1 - out);
      lamp.flame.userData.u.uOut.value = 1 - life;
      lamp.flame.scale.setScalar(0.25 + 0.75 * on);
      const k = life * f;
      wallMat.uniforms.uLightAmt.value = 1.25 * k;
      wallMat.uniforms.uFlick.value = 1;
      lamp.body.userData.u.uFlick.value = k;
      lamp.body.userData.u.uRim.value = 1.6 * k + 0.05;
      dust.userData.u.uOpacity.value = 0.5 * k;
      wisp.userData.u.uDensity.value = 0.55 * sstep(cfg.outAt ?? 1e9, (cfg.outAt ?? 1e9) + 0.4, t) * (1 - sstep((cfg.outAt ?? 1e9) + 2.5, (cfg.outAt ?? 1e9) + 5, t));
      const p = sine(t / dur);
      st.camera.position.set(lerp(0.0, 0.0, p), lerp(-0.6, -0.75, p), lerp(cfg.push ? 7.6 : 7.0, cfg.push ? 6.6 : 6.9, p));
      st.camera.lookAt(lamp.fx * 0.3, lamp.fy * 0.55, 0);
    });
    return st;
  };
}

// ---------------------------------------------------------------- 2. the writer's shadow on a wall
// cfg: {sil, wall, weave, stripes, lamp:{kind,x,y}, shadow:{cx,cy,sx,sy,flip}, desk, rain, grade}
export function shadowShot(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: cfg.grade });
    const z = -3;
    const [ww, wh] = st.fillSize(z, 10, 1.25);
    const sil = SIL[cfg.sil];
    const sblur = blurredTex(sil, cfg.blur ?? 7);
    const aspect = ww / wh;
    const sh = cfg.shadow;
    const silAsp = sil.image.width / sil.image.height;
    const wallMat = sheetMaterial({
      paper: cfg.wall ?? 0x9a8468,
      weave: cfg.weave ?? 0,
      folds: 0,
      deckle: 0,
      age: 0.25,
      fiber: 0.09,
      aspect,
      ambient: cfg.ambient ?? 0.05,
      lightFall: 1.6,
      shadowMap: sblur,
      shadowXf: [sh.cx, sh.cy, (sh.s * silAsp) / aspect, sh.s],
      shadowAmt: 0.86,
      shadowFlip: sh.flip,
    });
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), wallMat);
    wall.position.z = z;
    st.add(wall);
    st.timed.push(wallMat.uniforms);
    const lc = cfg.lamp;
    const lamp = addLamp(st, { kind: lc.kind, x: lc.x, y: lc.y, z: lc.z ?? 1.2, height: lc.h ?? 1.6, seed: lc.seed ?? 3 });
    // desk silhouette band
    const desk = st.layer({
      tex: P.ridge({ w: 2048, h: 512, base: 0.62, amp: 0.004, freq: 2, seed: 4 }),
      z: 1.6,
      y: -1.9,
      size: [st.fillSize(1.6)[0], 1.6],
      tone: 0x0b0806,
      rim: 0.6,
      rimDir: [0, -1],
      lightAmt: 0.0,
    });
    const dust = st.particles({ mode: 4, count: 120, box: [10, 5, 3], center: [lc.x, 0.3, 0.5], size: 0.022, color: 0xffd9a0, opacity: 0.45, seed: 12 });
    let rain = null;
    if (cfg.rain) rain = st.particles({ mode: 1, count: 500, box: [12, 8, 2], center: [0, 0, 3.5], size: 0.45, color: 0x8796a6, opacity: 0.18, wind: 0.5, seed: 5 });
    const lu = [0.5 + lamp.fx / ww, 0.5 + lamp.fy / wh];
    st.onUpdate((t, dur, T) => {
      const f = flicker(T, lc.seed ?? 3);
      let life = 1;
      if (cfg.outAt != null) life = 1 - sstep(cfg.outAt, cfg.outAt + 0.6, t);
      lamp.flame.userData.u.uOut.value = 1 - life;
      const k = f * life;
      // the shadow breathes with the flame: when the flame leans, the shadow leans the other way
      const lean = Math.sin(T * 1.7 + 1) * 0.004 + (f - 1) * 0.12;
      wallMat.uniforms.uShadowXf.value.set(sh.cx + lean, sh.cy, ((sh.s * silAsp) / aspect) * (1 + (f - 1) * 0.6), sh.s * (1 + (f - 1) * 0.9));
      wallMat.uniforms.uLightPos.value.set(lu[0], lu[1] + 0.05);
      wallMat.uniforms.uLightAmt.value = 1.15 * k;
      if (cfg.stripes) wallMat.uniforms.uStripes.value.set(cfg.stripes.amt, cfg.stripes.period, T * cfg.stripes.speed, cfg.stripes.angle ?? 0.0);
      lamp.body.userData.u.uFlick.value = k;
      desk.userData.u.uRim.value = 0.7 * k;
      dust.userData.u.uOpacity.value = 0.45 * k;
      const p = sine(t / dur);
      st.camera.position.set(lerp(cfg.cam?.[0] ?? -0.4, cfg.cam?.[1] ?? 0.2, p), lerp(0.1, 0.0, p), lerp(9.6, 8.6, p));
      st.camera.lookAt(lerp(-0.2, 0.25, p), -0.1, 0);
    });
    return st;
  };
}

// ---------------------------------------------------------------- 3. the letter close-up, written in sync with the voice
// cfg: {hand:{...Hand opts}, paper, inkColor, weave, deckle, light:[u,v], stripes, rain, vertical, grade, follow}
export function letterShot(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: cfg.grade, fov: 30 });
    const hand = cfg.stroke ? new StrokeHand(Object.assign({ lines: shot.lines || [], blots: cfg.blots }, cfg.hand)) : new Hand(Object.assign({ lines: shot.lines || [], blots: cfg.blots }, cfg.hand));
    const asp = hand.o.w / hand.o.h;
    const H = cfg.sheetH ?? 7.0;
    const Wd = H * asp;
    const mat = sheetMaterial({
      ink: hand.tex,
      pencil: cfg.pencil ?? 0,
      paper: cfg.paper ?? 0xe4d6b8,
      inkColor: cfg.inkColor ?? 0x1b120b,
      weave: cfg.weave ?? 0,
      deckle: cfg.deckle ?? 1,
      folds: cfg.folds ?? 1,
      age: cfg.age ?? 0.4,
      aspect: asp,
      lightPos: cfg.light ?? [0.05, 0.85],
      lightFall: cfg.lightFall ?? 0.9,
      ambient: cfg.ambient ?? 0.1,
      fiber: cfg.fiber ?? 0.06,
    });
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(Wd, H, 40, 40), mat);
    // gentle curl
    const pos = sheet.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) / Wd,
        y = pos.getY(i) / H;
      pos.setZ(i, 0.12 * Math.cos(x * 3.0) + 0.05 * Math.sin(y * 4 + 1));
    }
    sheet.geometry.computeVertexNormals();
    sheet.rotation.z = cfg.rot ?? -0.035;
    st.add(sheet);
    st.timed.push(mat.uniforms);
    // dark desk under the sheet
    const [dw, dh] = st.fillSize(-0.6, 10, 1.6);
    const deskMat = sheetMaterial({ paper: cfg.desk ?? 0x2a1d14, deckle: 0, folds: 0, age: 0, fiber: 0.12, aspect: dw / dh, lightPos: [0.15, 0.8], lightFall: 1.2, ambient: 0.05 });
    const desk = new THREE.Mesh(new THREE.PlaneGeometry(dw, dh), deskMat);
    desk.position.z = -0.6;
    st.add(desk);
    st.timed.push(deskMat.uniforms);
    let rain = null;
    if (cfg.rain) rain = st.particles({ mode: 1, count: 300, box: [12, 8, 2], center: [0, 0, 4], size: 0.35, color: 0x9aa8b6, opacity: 0.12, wind: 0.4, seed: 8 });
    const dust = st.particles({ mode: 4, count: 60, box: [9, 5, 2], center: [0, 0, 2], size: 0.02, color: 0xffe2b0, opacity: 0.35, seed: 31 });
    // pen position (sheet-local, in units) at time t: the glyph being written
    const penAt = (t) => {
      let last = null;
      for (const q of hand.glyphs) {
        if (q.t0 <= t) last = q;
        else break;
      }
      if (!last) last = hand.glyphs[0];
      if (!last) return [0, 0];
      return [(last.x / hand.o.w - 0.5) * Wd, (0.5 - last.y / hand.o.h) * H];
    };
    st.onUpdate((t, dur, T) => {
      hand.draw(t);
      const f = flicker(T, 5);
      mat.uniforms.uLightAmt.value = (cfg.lightAmt ?? 1.3) * f;
      deskMat.uniforms.uLightAmt.value = 0.6 * f;
      if (cfg.stripes) mat.uniforms.uStripes.value.set(cfg.stripes.amt, cfg.stripes.period, T * cfg.stripes.speed, cfg.stripes.angle ?? 0.3);
      if (cfg.stripes) deskMat.uniforms.uStripes.value.set(cfg.stripes.amt * 0.6, cfg.stripes.period * 0.8, T * cfg.stripes.speed, cfg.stripes.angle ?? 0.3);
      // camera follows the pen, smoothed over the last ~2 s (pure function of t)
      let ax = 0,
        ay = 0,
        n = 0;
      for (let k = 0; k < 9; k++) {
        const [px, py] = penAt(t - k * 0.25);
        ax += px;
        ay += py;
        n++;
      }
      ax /= n;
      ay /= n;
      // horizontal scripts: follow the line down the page, keep the full width in view;
      // vertical scripts: follow the column across, keep the full height in view
      const vertical = !!hand.o.vertical;
      const zoom = lerp(cfg.zFrom ?? (vertical ? H * 1.25 : Wd * 1.0), cfg.zTo ?? (vertical ? H * 1.12 : Wd * 0.92), sine(t / dur));
      const viewH = 2 * zoom * Math.tan((30 * Math.PI) / 360) * (816 / 1080);
      const viewW = viewH * (1920 / 816);
      const follow = cfg.follow ?? 1;
      let cx = vertical ? ax * follow : 0,
        cy = ay * follow * (vertical ? 0.8 : 1);
      const mx = Math.max(0, Wd / 2 - viewW / 2 + 0.3),
        my = Math.max(0, H / 2 - viewH / 2 + 0.25);
      cx = clamp(cx, -mx, mx);
      cy = clamp(cy, -my, my);
      const c = Math.cos(sheet.rotation.z),
        s = Math.sin(sheet.rotation.z);
      const wx = cx * c - cy * s,
        wy = cx * s + cy * c;
      st.camera.position.set(wx + 0.15, wy - 0.15, zoom);
      st.camera.lookAt(wx, wy, 0);
    });
    return st;
  };
}

// ---------------------------------------------------------------- 4. an old photograph (paper-cut figures inside a deckled card)
export function photoShot(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: cfg.grade, fov: 30 });
    const sil = SIL[cfg.sil];
    const H = 4.6,
      Wd = H * (cfg.aspect ?? 0.78);
    const card = new THREE.Mesh(
      new THREE.PlaneGeometry(Wd, H),
      sheetMaterial({ paper: 0xd8c39c, deckle: 0.6, folds: 0.4, age: 0.85, aspect: Wd / H, lightPos: [0.3, 0.8], lightFall: 0.7, ambient: 0.3, fiber: 0.08 }),
    );
    card.rotation.z = cfg.rot ?? 0.04;
    st.add(card);
    st.timed.push(card.material.uniforms);
    // the print area: darker sepia with the figures cut from the paper
    const inner = new THREE.Mesh(
      new THREE.PlaneGeometry(Wd * 0.84, H * 0.78),
      sheetMaterial({ paper: 0xb08d5c, deckle: 0, folds: 0.4, age: 1.0, aspect: (Wd * 0.84) / (H * 0.78), lightPos: [0.3, 0.8], lightFall: 0.5, ambient: 0.35, fiber: 0.1 }),
    );
    inner.position.set(0, H * 0.05, 0.01);
    inner.rotation.z = card.rotation.z;
    st.add(inner);
    st.timed.push(inner.material.uniforms);
    const silAsp = sil.image.width / sil.image.height;
    const fh = H * 0.72;
    const fig = st.layer({ tex: sil, z: 0.02, y: H * 0.03, w: fh * silAsp, h: fh, tone: 0x2a1b10, rim: 0.0, fiber: 0.04, opacity: 0.92 });
    fig.rotation.z = card.rotation.z;
    const [dw, dh] = st.fillSize(-0.3, 10, 1.6);
    const desk = new THREE.Mesh(new THREE.PlaneGeometry(dw, dh), sheetMaterial({ paper: cfg.desk ?? 0x1e140d, deckle: 0, folds: 0, age: 0, fiber: 0.12, aspect: dw / dh, lightPos: [0.35, 0.75], lightFall: 1.6, ambient: 0.04 }));
    desk.position.z = -0.3;
    st.add(desk);
    st.timed.push(desk.material.uniforms);
    st.onUpdate((t, dur, T) => {
      const f = flicker(T, 7);
      card.material.uniforms.uLightAmt.value = 1.0 * f;
      inner.material.uniforms.uLightAmt.value = 0.9 * f;
      desk.material.uniforms.uLightAmt.value = 0.8 * f;
      const p = sine(t / dur);
      st.camera.position.set(lerp(0.3, -0.1, p), lerp(-0.2, 0.1, p), lerp(9.5, 8.4, p));
      st.camera.lookAt(0, 0, 0);
    });
    return st;
  };
}

// ---------------------------------------------------------------- 5. black (cards are drawn in HTML on top)
export function blackShot() {
  return (world) => new Stage(world);
}

// ---------------------------------------------------------------- silhouette layer sized by height (or width), keeping aspect
export function sil(st, name, o) {
  const t = SIL[name];
  const asp = t.image.width / t.image.height;
  const h = o.h ?? o.w / asp;
  const w = o.w ?? h * asp;
  return st.layer(Object.assign({ tex: t, w, h }, o));
}

export const GRADE = {
  g757: { lift: [0.02, 0.004, 0], gain: [1.1, 0.95, 0.84], gamma: 1.0, sat: 1.05 },
  g1861: { lift: [0.014, 0.008, 0.0], gain: [1.06, 0.98, 0.86], gamma: 1.0, sat: 0.88 },
  g1911: { lift: [0.0, 0.006, 0.02], gain: [0.96, 1.0, 1.08], gamma: 1.0, sat: 0.85 },
  g1914: { lift: [0.0, 0.006, 0.014], gain: [0.94, 0.98, 1.03], gamma: 1.0, sat: 0.62 },
  g1936: { lift: [0.01, 0.012, 0.008], gain: [0.99, 1.0, 0.93], gamma: 1.0, sat: 0.55 },
  g1942: { lift: [0.014, 0.008, 0.0], gain: [1.05, 0.98, 0.9], gamma: 1.0, sat: 0.8 },
  gEpi: { lift: [0.004, 0.008, 0.014], gain: [1.0, 1.0, 1.03], gamma: 1.0, sat: 0.7 },
  warm: { lift: [0.01, 0.005, 0.0], gain: [1.05, 0.98, 0.9], gamma: 1.0, sat: 0.9 },
};

// ---------------------------------------------------------------- helper: light position of a world point on a layer, in its uv
export function lightUV(mesh, x, y) {
  const g = mesh.geometry.parameters;
  return [(x - mesh.position.x) / g.width + 0.5, (y - mesh.position.y) / g.height + 0.5];
}
export function setLight(meshes, x, y) {
  for (const m of meshes) m.userData.u.uLightPos.value.set(...lightUV(m, x, y));
}

// ink only (no paper): a canvas's alpha drawn as ink with a little grain
export function inkOnly(tex, color = 0x0b0705, opacity = 0.96) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uMap: { value: tex }, uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec2 vUv; uniform sampler2D uMap; uniform vec3 uColor; uniform float uOpacity;
      float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      void main(){ float a=texture2D(uMap,vUv).a; float g=.88+.12*h(floor(vUv*900.)); gl_FragColor=vec4(uColor*g, a*uOpacity); }`,
  });
}
