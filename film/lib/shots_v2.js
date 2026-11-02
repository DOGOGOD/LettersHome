// 家书 — second cut: each letter gets its own medium.
//   1861 wind: words written on the sky, a flight across a paper country to Sarah's window
//   1911 ink: the handkerchief itself, brush strokes in real order, ink blooming into memory, then fire
//   1914 cross-section: a cutaway of the front line, French dugout ↔ German dugout, the truce in the middle
//   1936 copybook: the son copying in a grid book; the mother's pencil on rough paper on the train
//   1942 the reader: a sunlit cave dwelling in Yan'an, a letter being read
import { THREE, Stage, rng, clamp, lerp, sstep, inOut, sine, flicker, canvasTex, GLSL, paperMaterial } from "./world.js";
import { SIL, INK, P, sheetMaterial, Hand, StrokeHand, FONTS } from "./kit.js";
import { addLamp, sil, GRADE, lightUV, inkOnly } from "./shots_common.js";
import { townTexW } from "./shots_epic.js";

const W = "#fff";
// camera keyframes [[t, x, y, z, lx, ly, lz]] → eased position
function camPath(keys, t) {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const a = keys[i - 1],
        b = keys[i];
      const k = inOut(clamp((t - a[0]) / (b[0] - a[0])));
      return a.slice(1).map((v, j) => lerp(v, b[j + 1], k));
    }
  }
  return keys[keys.length - 1].slice(1);
}

// ================================================================= 1861 — WIND
const DUSK = { top: 0x1a2032, mid: 0x86563a, bot: 0xe8a560, midY: 0.38, cloud: 0.55, cloudColor: 0x5a3a32, cloudScale: 1.3, cloudSpeed: [0.012, 0.0], cloudY: [0.45, 1.05], glow: 0.7, glowColor: 0xffa24a, glowY: 0.18, glowX: [0.6, 0.8] };

function tentFrameTex() {
  return canvasTex(2048, 1152, (g, w, h) => {
    g.fillStyle = W;
    g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = "destination-out";
    g.beginPath();
    g.moveTo(w * 0.08, h);
    g.quadraticCurveTo(w * 0.3, h * 0.45, w * 0.47, h * 0.06);
    g.lineTo(w * 0.53, h * 0.06);
    g.quadraticCurveTo(w * 0.72, h * 0.45, w * 0.97, h);
    g.closePath();
    g.fill();
    g.globalCompositeOperation = "source-over";
    // tied-back flap and seams
    g.lineWidth = 6;
    g.strokeStyle = W;
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(w * (0.5 + s * 0.03), h * 0.06);
      g.quadraticCurveTo(w * (0.5 + s * 0.2), h * 0.5, w * (0.5 + s * 0.42), h * 0.98);
      g.stroke();
    }
  });
}

// Ballou in the mouth of his tent at dusk; his words rise into the sky and the wind carries them east
export function c1Sky(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: GRADE.g1861 });
    st.sky(DUSK);
    st.layer({ tex: P.ridge({ base: 0.52, amp: 0.05, freq: 2.5, seed: 31 }), z: -70, y: -3, tone: 0x6a4a42, fog: 0.55, fogColor: 0xc88a5a });
    st.layer({ tex: P.tents({ size: 0.022, base: 0.6, amp: 0.05, seed: 41, group: 9 }), z: -40, y: -1.6, tone: 0x7a5a48, fog: 0.36, fogColor: 0xc88a5a, lightAmt: 0.4, light: 0xffc078 });
    st.layer({ tex: P.tents({ size: 0.045, base: 0.66, amp: 0.05, seed: 42, group: 6 }), z: -20, y: -1.9, tone: 0x4a3328, fog: 0.17, fogColor: 0xc88a5a, rim: 0.8, rimDir: [0, 1], light: 0xffb060 });
    const r = rng(9);
    for (let i = 0; i < 12; i++) st.flame({ x: (r() - 0.5) * 30, y: -2.4 - r() * 0.6, z: -20 - r() * 15, size: 0.45, seed: i, halo: 2.4 });
    const hand = new Hand({ w: 2048, h: 1024, font: FONTS.pinyon, size: 104, lineGap: 1.3, margin: [0.12, 0.12], color: "#000", seed: 3, lines: shot.lines || [], fade: { after: 2.2, dur: 4.5, drift: 260, rise: 40 } });
    const words = new THREE.Mesh(new THREE.PlaneGeometry(21, 10.5), inkOnly(hand.tex, 0xffe6c2, 0.95));
    words.position.set(-0.4, 2.2, -26);
    st.add(words);
    const flecks = st.particles({ mode: 3, count: 90, box: [16, 7, 6], center: [0, 1.2, -6], size: 0.06, color: 0xe8c8a0, opacity: 0.75, wind: 2.2, speed: 1.6, seed: 5, additive: false });
    const frame = st.layer({ tex: tentFrameTex(), z: 3.2, size: st.fillSize(3.2, 10, 1.08), tone: 0x1c130d, rim: 1.1, rimDir: [0, 0.6], light: 0xffb060, lightAmt: 0.25, lightPos: [0.5, 0.3], lightFall: 3 });
    const man = sil(st, "fig_ballou_writing", { z: 2.4, h: 3.0, x: 1.75, y: -1.25, tone: 0x0f0a07, rim: 1.0, rimDir: [-1, 0.3], light: 0xffb878 });
    st.onUpdate((t, dur, T) => {
      hand.draw(t);
      const p = sine(t / dur);
      st.camera.position.set(lerp(-0.3, 0.3, p), lerp(-0.2, 0.1, p), lerp(10, 8.6, p));
      st.camera.lookAt(lerp(-0.2, 0.2, p), lerp(0.2, 0.7, p), -20);
    });
    return st;
  };
}

// the flight: eastward over a country of folded paper, toward one lit window
export function c1Flight(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: GRADE.g1861 });
    st.sky({ z: -260, top: 0x101628, mid: 0x5a4058, bot: 0xd8905a, midY: 0.36, cloud: 0.5, cloudColor: 0x4a3240, cloudScale: 1.4, cloudSpeed: [0.03, 0], cloudY: [0.4, 1.05], glow: 0.55, glowColor: 0xffa050, glowY: 0.15, stars: 0.25 });
    const N = 15;
    const layers = [];
    for (let i = 0; i < N; i++) {
      const z = -6 - i * 12;
      const far = i / (N - 1);
      const river = i % 5 === 3;
      const tex = river
        ? P.ridge({ base: 0.74, amp: 0.006, freq: 1, seed: 200 + i })
        : P.ridge({
            base: 0.58 + (i % 3) * 0.03,
            amp: 0.05 + 0.03 * ((i * 7) % 3),
            freq: 2.5 + (i % 4),
            seed: 200 + i,
            after: (g, w, h, f) => {
              const rr = rng(300 + i);
              g.fillStyle = W;
              for (let k = 0; k < 7; k++) {
                const u = rr();
                const y = (0.58 + (i % 3) * 0.03 + (f(u * (2.5 + (i % 4))) - 0.5) * 2 * (0.05 + 0.03 * ((i * 7) % 3))) * h;
                const x = u * w;
                if (rr() < 0.5) {
                  // a tree
                  g.beginPath();
                  g.ellipse(x, y - 60, 34 + rr() * 20, 52 + rr() * 30, 0, 0, Math.PI * 2);
                  g.fill();
                  g.fillRect(x - 4, y - 30, 8, 34);
                } else {
                  // a farmhouse
                  g.fillRect(x - 40, y - 46, 80, 50);
                  g.beginPath();
                  g.moveTo(x - 50, y - 44);
                  g.lineTo(x, y - 84);
                  g.lineTo(x + 50, y - 44);
                  g.fill();
                }
              }
            },
          });
      const m = st.layer({ tex, z, y: -2.6 - far * 0.6, tone: river ? 0x3a4a62 : new THREE.Color().lerpColors(new THREE.Color(0x1a120e), new THREE.Color(0x7a5a5a), far * 0.8).getHex(), fog: far * 0.5, fogColor: 0xc08060, rim: 0.8, rimDir: [0, 1], light: 0xffb070, rimW: 0.003 });
      layers.push(m);
    }
    // the window at the end of the road
    const endZ = -6 - N * 12 + 4;
    const house = sil(st, "fig_farmhouse", { z: endZ, h: 10, x: 1.0, y: -1.6, tone: 0x0c0a0c, rim: 0.6, rimDir: [0, 1], light: 0xffb070 });
    // warm light behind the house shows only through its cut-out windows
    const win = st.layer({ z: endZ - 0.05, x: 1.0, y: -1.6, w: 10 * (SIL.fig_farmhouse.image.width / SIL.fig_farmhouse.image.height) * 0.62, h: 10 * 0.6, tone: 0xffc070, opacity: 1 });
    const flecks = st.particles({ mode: 3, count: 160, box: [14, 6, 24], center: [0, 0, 0], size: 0.05, color: 0xf0d0a8, opacity: 0.7, wind: 2.5, speed: 1.8, seed: 7, additive: false });
    st.onUpdate((t, dur, T) => {
      const k = inOut(clamp(t / dur));
      const cz = lerp(10, endZ + 11, k);
      st.camera.position.set(Math.sin(T * 0.3) * 0.25 + lerp(0, 0.8, k), lerp(0.6, -0.2, k) + Math.sin(T * 0.7) * 0.05, cz);
      st.camera.lookAt(lerp(0, 0.9, k), lerp(0.1, -0.6, k), cz - 20);
      flecks.userData.u.uCenter.value.set(0, 0.2, cz - 12);
      for (const m of layers) m.visible = m.position.z < cz - 0.5;
    });
    return st;
  };
}

// ================================================================= 1911 — INK
// a painting blooms into the cloth like wet ink, and later runs like tears
function inkPaintMaterial(tex) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uMap: { value: tex }, uReveal: { value: 0 }, uBlur: { value: 0 }, uCloth: { value: new THREE.Color(0xf1ede4) }, uSeed: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: /* glsl */ `${GLSL}
      varying vec2 vUv; uniform sampler2D uMap; uniform float uReveal,uBlur,uSeed; uniform vec3 uCloth;
      void main(){
        vec2 q=vec2(vUv.x*1.76,vUv.y);
        vec2 off=vec2(fbm(q*3.+uSeed),fbm(q*3.+7.+uSeed))-.5;
        vec2 uv=vUv+off*uBlur*.05+vec2(0.,-uBlur*.03*fbm(q*6.));
        vec3 c=texture2D(uMap,uv).rgb;
        if(uBlur>0.){ vec3 acc=c; for(int i=0;i<6;i++){ float a=float(i)*1.047; acc+=texture2D(uMap,uv+vec2(cos(a),sin(a))*uBlur*.012).rgb; } c=acc/7.; }
        float lum=dot(c,vec3(.3,.59,.11));
        float ink=pow(clamp(1.-lum,0.,1.),.9);
        float d=length((vUv-.5)*vec2(1.76,1.));
        float front=uReveal*1.5-d-fbm(q*4.+uSeed)*.45;
        float mask=smoothstep(0.,.14,front);
        float wetEdge=smoothstep(.0,.05,front)*(1.-smoothstep(.05,.16,front));
        vec3 col=mix(uCloth,c,.94)*(1.-wetEdge*.25);
        float alpha=mask*(1.-uBlur*.75);
        gl_FragColor=vec4(col,alpha);
      }`,
  });
}

export function c2Cloth(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: { lift: [0.01, 0.01, 0.012], gain: [1.02, 1.0, 0.97], gamma: 1.0, sat: 0.9 }, fov: 30 });
    const hand = new StrokeHand({ w: 2400, h: 1800, size: 96, vertical: true, lineGap: 1.25, margin: [0.07, 0.07], color: "#0a0807", font: FONTS.xing, mask: 320, bleed: 2.5, seed: 9, lines: shot.lines || [], blots: cfg.blots || [] });
    const H = 7.4,
      Wd = H * (2400 / 1800);
    const cloth = sheetMaterial({ ink: hand.tex, paper: 0xf1ede4, inkColor: 0x0a0807, weave: 0.025, deckle: 0.12, folds: 0.3, age: 0.1, aspect: Wd / H, lightPos: [0.15, 0.85], lightFall: 0.5, ambient: 0.5, lightAmt: 0.6, fiber: 0.04 });
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(Wd, H), cloth);
    sheet.rotation.z = -0.02;
    st.add(sheet);
    st.timed.push(cloth.uniforms);
    const [dw, dh] = st.fillSize(-0.6, 10, 1.8);
    const desk = new THREE.Mesh(new THREE.PlaneGeometry(dw, dh), sheetMaterial({ paper: 0x2a1d14, deckle: 0, folds: 0, age: 0, fiber: 0.14, aspect: dw / dh, lightPos: [0.3, 0.8], lightFall: 1.0, ambient: 0.12 }));
    desk.position.z = -0.6;
    st.add(desk);
    st.timed.push(desk.material.uniforms);
    // fire waiting behind the cloth, seen through the burned holes
    const fireSky = st.sky({ z: -12, top: 0x0a0304, mid: 0x30100a, bot: 0x9a3a10, midY: 0.45, cloud: 0.8, cloudColor: 0x24100a, cloudSpeed: [0.02, 0.03], glow: 1.1, glowColor: 0xff5a14, glowY: 0.3 });
    // Guangzhou burning, in paper: three streets of houses, flames between them, the young men running through
    const city = [];
    city.push(st.layer({ tex: townTexW(11), z: -30, y: -6.5, w: 90, h: 22.5, tone: 0x140605, fog: 0.3, fogColor: 0x7a2a0c, rim: 1.0, rimDir: [0, 1], light: 0xff7a2a }));
    const fire = st.smoke({ z: -31, y: -1, color: 0x7a2004, lit: 0xffa040, density: 1.0, scale: 2.2, speed: [0, 0.3], edge: [0.0, 0.15, 0.75, 0.4], seed: 2 });
    const fire2 = st.smoke({ z: -19, y: -2, color: 0x6a1a04, lit: 0xff9030, density: 0.9, scale: 2.6, speed: [0, 0.35], edge: [0.0, 0.12, 0.6, 0.32], seed: 3 });
    city.push(st.layer({ tex: townTexW(12), z: -18, y: -6.0, w: 60, h: 15, tone: 0x0a0303, fog: 0.12, fogColor: 0x7a2a0c, rim: 1.1, rimDir: [0, 1], light: 0xff7a2a }));
    const men = sil(st, "fig_revolutionaries", { z: -8, w: 11, y: -2.9, tone: 0x050203, rim: 1.4, rimDir: [-0.5, 0.5], light: 0xffa050, rimW: 0.003 });
    city.push(men);
    city.push(st.layer({ tex: townTexW(13), z: -4, y: -5.6, w: 36, h: 9, tone: 0x050202, rim: 1.2, rimDir: [0, 1], light: 0xff7a2a }));
    const smokeF = st.smoke({ z: -3, color: 0x1a0805, lit: 0x5a1a06, density: 0.5, scale: 1.2, speed: [0.05, 0.06], edge: [0.0, 0.3, 1.0, 0.7], seed: 8 });
    const embers = st.particles({ mode: 0, count: 420, box: [30, 14, 26], center: [0, -1, -14], size: 0.11, color: 0xff7a2a, wind: 0.4, seed: 5 });
    const muzzle = [0, 1, 2, 3, 4].map(() => st.glow({ x: 0, y: -2.2, z: -7.9, size: 1.6, color: 0xffd090 }));
    // the ink drop that opens the chapter (matching the moon of the previous shot)
    const drop = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 3),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uR: { value: 0 }, uA: { value: 1 } },
        vertexShader: `varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: /* glsl */ `${GLSL} varying vec2 vUv; uniform float uR,uA;
          void main(){ float d=length(vUv-.5)*2.; float n=fbm(vUv*9.)*.18; float a=smoothstep(uR+.02,uR-.02,d+n*uR);
            float rim=smoothstep(uR-.12,uR,d+n*uR)*a; gl_FragColor=vec4(vec3(.04,.03,.03)*(1.-rim*.5),a*(.92-.5*rim)*uA); }`,
      }),
    );
    drop.position.set(0, 0, 0.01);
    st.add(drop);
    const paints = (cfg.paints || []).map((p) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(Wd * 0.96, (Wd * 0.96) / 1.76), inkPaintMaterial(INK[p.tex]));
      m.position.z = 0.02;
      m.rotation.z = sheet.rotation.z;
      m.material.uniforms.uSeed.value = p.seed ?? 1;
      st.add(m);
      return { m, p };
    });
    const toWorld = ([px, py]) => [(px / 2400 - 0.5) * Wd, (0.5 - py / 1800) * H];
    st.onUpdate((t, dur, T) => {
      hand.draw(t);
      // drop
      const dk = cfg.dropAt != null ? sstep(cfg.dropAt, cfg.dropAt + 1.6, t) : 1;
      drop.material.uniforms.uR.value = 0.15 + 0.85 * Math.sqrt(dk);
      drop.material.uniforms.uA.value = 1 - sstep((cfg.dropAt ?? -10) + 2.2, (cfg.dropAt ?? -10) + 4.5, t);
      // paintings
      let pk = 0;
      for (const { m, p } of paints) {
        const rev = sstep(p.from, p.from + (p.grow ?? 3.5), t);
        const blur = sstep(p.blurFrom ?? p.to, (p.blurFrom ?? p.to) + 2.5, t);
        const gone = sstep(p.to, p.to + 1.2, t);
        m.material.uniforms.uReveal.value = rev;
        m.material.uniforms.uBlur.value = Math.max(blur, gone);
        m.visible = rev > 0 && gone < 1;
        pk = Math.max(pk, rev * (1 - gone));
      }
      // burning
      const bk = cfg.burnAt != null ? sstep(cfg.burnAt, cfg.burnAt + 5, t) : 0;
      cloth.uniforms.uBurn.value = bk > 0 ? lerp(-0.45, 1.25, bk) : -1;
      for (const { m } of paints) if (bk > 0) m.visible = false;
      drop.visible = bk === 0;
      fire.visible = fire2.visible = embers.visible = fireSky.visible = smokeF.visible = bk > 0;
      for (const c of city) c.visible = bk > 0;
      const after = cfg.burnAt != null ? t - cfg.burnAt : -1;
      men.position.x = lerp(-9, 6, clamp(after / 16));
      muzzle.forEach((m, i) => { const at = 3 + i * 2.1; m.position.x = men.position.x + 3.5; m.userData.u.uAmt.value = after > 0 ? Math.exp(-Math.pow((after - at) * 12, 2)) * 1.5 : 0; });
      desk.visible = bk < 0.02;
      // camera: follow the brush, pull back for paintings, then back off as it burns
      let ax = 0,
        ay = 0;
      [ax, ay] = toWorld(hand.penSmooth(t, 1.8)); // glides with the writing, no steps between characters
      const close = [ax * 0.85, ay * 0.6, 7.6];
      const wide = [0, 0, 13.6];
      const opening = 1 - sstep(cfg.writeFrom ?? 0, (cfg.writeFrom ?? 0) + 2.5, t);
      const w = Math.max(pk, bk, opening);
      const cx = lerp(close[0], wide[0], w),
        cy = lerp(close[1], wide[1], w),
        cz = lerp(close[2], wide[2], w) - opening * 6;
      st.camera.position.set(cx + 0.1, cy - 0.1, cz);
      st.camera.lookAt(cx, cy, 0);
    });
    return st;
  };
}

// the harbour, ending close on the moon (it becomes the ink drop)
export function c2Moon(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: GRADE.g1911 });
    const sky = st.sky({ top: 0x03050c, mid: 0x111b30, bot: 0x26354e, midY: 0.5, stars: 0.55, moon: [0.6, 0.62, 0.022], moonColor: 0xe8eeff, cloud: 0.3, cloudColor: 0x34445e, cloudScale: 1.4, cloudSpeed: [0.008, 0], cloudY: [0.55, 1.0] });
    st.layer({ tex: P.ridge({ base: 0.5, amp: 0.06, freq: 3, seed: 81, peaks: [{ x: 0.35, a: 0.14, s: 0.12 }, { x: 0.55, a: 0.09, s: 0.07 }] }), z: -60, y: 0.4, tone: 0x0b1222, fog: 0.25, fogColor: 0x2a3a56, rim: 0.12, rimDir: [0, 1], light: 0xbfd0ff });
    st.particles({ mode: 4, count: 140, box: [60, 0.8, 1], center: [0, -2.4, -55], size: 0.18, color: 0xffc070, opacity: 0.75, seed: 22 });
    const junks = sil(st, "fig_junks", { z: -18, w: 15, x: -1.5, y: -2.0, tone: 0x03050a, rim: 0.9, rimDir: [0.3, 1], light: 0xbfd0ff, rimW: 0.003 });
    st.smoke({ z: -24, y: -1.6, color: 0x5a6a86, density: 0.35, scale: 1.4, speed: [0.01, 0.0], edge: [0.2, 0.35, 0.6, 0.45], seed: 4 });
    const g = sky.geometry.parameters;
    const mx = (0.6 - 0.5) * g.width,
      my = (0.62 - 0.5) * g.height;
    st.onUpdate((t, dur, T) => {
      junks.position.y = -2.0 + Math.sin(T * 0.7) * 0.03;
      const k = inOut(sstep(dur * 0.35, dur, t));
      st.camera.fov = lerp(35, 4.2, k);
      st.camera.updateProjectionMatrix();
      st.camera.position.set(lerp(-0.6, 0, k), lerp(0.2, 0, k), 10);
      st.camera.lookAt(lerp(0, mx, k), lerp(-0.4, my, k), lerp(-20, -80, k));
    });
    return st;
  };
}

// ================================================================= 1914 — CROSS-SECTION
// world units: x across the front (French left, German right), ground surface at y = 0.4
const SURF = 0.4;
function earthTex() {
  // 48 x 9 units → 4096 x 768 px; transparent = dug out
  return canvasTex(4096, 768, (g, w, h) => {
    const X = (x) => ((x + 24) / 48) * w,
      Y = (y) => ((SURF - y) / 9) * h;
    const f = rng(17);
    g.fillStyle = W;
    g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = "destination-out";
    for (const s of [-1, 1]) {
      const c = 8.5 * s;
      g.fillRect(X(c - 0.9), Y(SURF + 1), X(c + 0.9) - X(c - 0.9), Y(-1.5) - Y(SURF + 1)); // trench
      g.fillRect(X(c - (s < 0 ? 3.0 : 0.6)), Y(-1.3), X(c + (s < 0 ? 0.6 : 3.0)) - X(c - (s < 0 ? 3.0 : 0.6)), Y(-3.6) - Y(-1.3)); // dugout
      // shell craters on the surface
    }
    for (let i = 0; i < 6; i++) {
      const x = -5 + i * 2 + (f() - 0.5);
      g.beginPath();
      g.ellipse(X(x), Y(SURF), 40 + f() * 50, 18 + f() * 14, 0, 0, Math.PI);
      g.fill();
    }
    g.globalCompositeOperation = "source-over";
    // timber props and ceiling beams inside each dugout
    for (const s of [-1, 1]) {
      const c = 8.5 * s;
      const x0 = c - (s < 0 ? 3.0 : 0.6),
        x1 = c + (s < 0 ? 0.6 : 3.0);
      g.fillRect(X(x0), Y(-1.3), X(x1) - X(x0), 10);
      for (const x of [x0 + 0.1, x1 - 0.2, (x0 + x1) / 2]) g.fillRect(X(x), Y(-1.3), 12, Y(-3.6) - Y(-1.3));
    }
    // strata seams
    g.globalCompositeOperation = "destination-out";
    g.lineWidth = 2;
    for (let k = 0; k < 6; k++) {
      g.beginPath();
      for (let x = 0; x <= w; x += 16) g.lineTo(x, Y(-4.2 - k * 0.7) + Math.sin(x * 0.004 + k) * 8 + (f() - 0.5) * 3);
      g.stroke();
    }
    g.globalCompositeOperation = "source-over";
  });
}
function surfaceTex(truce) {
  // objects standing on the ground line: 48 x 3 units → 4096 x 256
  return canvasTex(4096, 256, (g, w, h) => {
    const X = (x) => ((x + 24) / 48) * w,
      Y = (y) => ((SURF + 2.6 - y) / 3) * h;
    const r = rng(23);
    g.fillStyle = W;
    g.strokeStyle = W;
    for (const s of [-1, 1]) {
      for (const side of [-1.4, 1.2]) {
        const cx = 8.5 * s + side;
        for (let k = 0; k < 4; k++) {
          g.beginPath();
          g.ellipse(X(cx - 0.8 + k * 0.42), Y(SURF + 0.16), 22, 12, 0, 0, Math.PI * 2);
          g.fill();
          if (k < 3) {
            g.beginPath();
            g.ellipse(X(cx - 0.6 + k * 0.42), Y(SURF + 0.36), 22, 12, 0, 0, Math.PI * 2);
            g.fill();
          }
        }
      }
    }
    // stakes and wire across no man's land
    g.lineWidth = 3;
    for (let x = -5.5; x <= 5.5; x += 1.1) {
      g.beginPath();
      g.moveTo(X(x), Y(SURF));
      g.lineTo(X(x + (r() - 0.5) * 0.2), Y(SURF + 0.8 + r() * 0.3));
      g.stroke();
    }
    g.lineWidth = 1.4;
    for (let k = 0; k < 2; k++) {
      g.beginPath();
      for (let x = X(-5.6); x < X(5.6); x += 3) g.lineTo(x + Math.cos(x * 0.09) * 6, Y(SURF + 0.3 + k * 0.32) + Math.sin(x * 0.09 + k) * 7);
      g.stroke();
    }
    // a shattered tree
    g.lineWidth = 8;
    g.beginPath();
    g.moveTo(X(2.4), Y(SURF));
    g.lineTo(X(2.5), Y(SURF + 2.0));
    g.moveTo(X(2.48), Y(SURF + 1.3));
    g.lineTo(X(3.1), Y(SURF + 1.9));
    g.stroke();
    if (truce) {
      // small Christmas trees on the German parapet
      for (const x of [7.0, 9.9, 11.6]) {
        g.beginPath();
        g.moveTo(X(x), Y(SURF + 1.1));
        g.lineTo(X(x + 0.3), Y(SURF + 0.5));
        g.lineTo(X(x - 0.3), Y(SURF + 0.5));
        g.fill();
      }
    }
  });
}

export function c3Section(cfg) {
  return (world, shot) => {
    const mode = cfg.mode || "night";
    const truce = mode === "truce",
      dawn = mode === "dawn";
    const st = new Stage(world, { grade: truce ? { lift: [0, 0.006, 0.02], gain: [0.96, 0.98, 1.06], gamma: 1, sat: 0.72 } : GRADE.g1914 });
    st.sky(truce ? { z: -60, top: 0x02040b, mid: 0x0a1428, bot: 0x18243a, midY: 0.6, stars: 1.2 } : dawn ? { z: -60, top: 0x5a636a, mid: 0x8c959c, bot: 0xa8b0b4, midY: 0.6 } : { z: -60, top: 0x05070a, mid: 0x111820, bot: 0x1e262c, midY: 0.6, cloud: 0.7, cloudColor: 0x1a2128, cloudY: [0.45, 1.1] });
    st.layer({ tex: P.ridge({ base: 0.55, amp: 0.02, freq: 3, seed: 91 }), z: -40, y: SURF - 0.3, tone: truce ? 0x0a1020 : 0x0a0e12, fog: 0.25, fogColor: truce ? 0x1a2640 : 0x26303a });
    // dugout back walls, lit by their candles
    const walls = [];
    for (const s of [-1, 1]) {
      const c = 8.5 * s;
      const cx = c + (s < 0 ? -1.2 : 1.2);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 4.6), sheetMaterial({ paper: 0x6e5844, deckle: 0, folds: 0, age: 0.2, fiber: 0.12, aspect: 5.6 / 4.6, ambient: 0.04, lightFall: 2.0, lightPos: [0.5, 0.35] }));
      m.position.set(cx, -1.6, -3.4);
      st.add(m);
      st.timed.push(m.material.uniforms);
      walls.push(m);
    }
    const figs = [sil(st, "fig_floch_writing", { z: -3.2, h: 1.95, x: -9.6, y: -2.62, tone: 0x0a0806, rim: 0.9, rimDir: [-1, 0.4], light: 0xffb25a }), sil(st, "fig_german_writing", { z: -3.2, h: 1.95, x: 9.6, y: -2.62, flipX: true, tone: 0x0a0806, rim: 0.9, rimDir: [1, 0.4], light: 0xffb25a })];
    const candles = [st.flame({ x: -10.35, y: -2.75, z: -3.15, size: 0.3, seed: 1, halo: 1.6 }), st.flame({ x: 10.35, y: -2.75, z: -3.15, size: 0.3, seed: 2, halo: 1.6 })];
    const earth = st.layer({ tex: earthTex(), z: -3.0, w: 48, h: 9, y: SURF - 4.5, tone: 0x241b13, fiber: 0.1, fiberScale: 260, lightAmt: 0.35, light: 0x8a96a8, lightPos: [0.5, 1.0], lightFall: 9, rim: 0.9, rimDir: [0, 1], light: truce ? 0xbcd0ff : 0xe0ecff });
    const surf = st.layer({ tex: surfaceTex(truce), z: -2.95, w: 48, h: 3, y: SURF + 1.1, tone: 0x0a0b0d, rim: 0.4, rimDir: [0, 1], light: truce ? 0xbcd0ff : 0xe0ecff });
    let men = null,
      parapet = [];
    if (truce) {
      men = sil(st, "fig_truce", { z: -2.9, w: 8.5, x: 0, y: SURF + 1.45, tone: 0x05070c, rim: 0.9, rimDir: [0, 1], light: 0xd8e4ff });
      for (const x of [6.4, 7.3, 8.0, 9.6, 10.4, 11.2, -10.2, -9.4, -7.6, -6.8]) parapet.push(st.flame({ x, y: SURF + 0.62, z: -2.9, size: 0.22, seed: x, halo: 2.2 }));
      st.particles({ mode: 2, count: 400, box: [26, 8, 6], center: [0, 3.5, -2], size: 0.05, color: 0xdfe8ff, opacity: 0.6, seed: 10 });
    }
    let rain = null,
      flare = null;
    if (!truce) {
      rain = st.particles({ mode: 1, count: 1400, box: [30, 6.6, 3], center: [0, SURF + 3.3, -2.6], size: 0.4, color: 0xa8b8c8, opacity: dawn ? 0.18 : 0.32, wind: 0.4, seed: 7 });
      if (!dawn) flare = st.glow({ x: 0, y: 4.2, z: -20, size: 8, color: 0xdcecff, amt: 1 });
    }
    st.onUpdate((t, dur, T) => {
      for (let i = 0; i < 2; i++) {
        const f = flicker(T, i + 1);
        const out = cfg.outAt?.[i] != null ? sstep(cfg.outAt[i], cfg.outAt[i] + 0.6, t) : 0;
        candles[i].userData.u.uOut.value = out;
        walls[i].material.uniforms.uLightAmt.value = (1 - out) * 1.3 * f + 0.04;
        walls[i].material.uniforms.uLightPos.value.set(i === 0 ? 0.5 - 0.15 : 0.5 + 0.15, 0.38);
        figs[i].userData.u.uFlick.value = (1 - out) * f;
      }
      if (flare) {
        const fx = lerp(-3, 3, (t % 18) / 18),
          fy = lerp(4.6, 2.6, (t % 18) / 18);
        flare.position.set(fx, fy, -20);
        flare.userData.u.uAmt.value = 0.9 * (0.85 + 0.15 * flicker(T * 3, 7));
        earth.userData.u.uRim.value = 0.6;
      }
      if (truce) {
        figs[0].visible = figs[1].visible = false;
        parapet.forEach((c, i) => {
          const at = cfg.parapetOut != null ? cfg.parapetOut + i * 0.45 : 1e9;
          c.userData.u.uOut.value = sstep(at, at + 0.4, t);
        });
        const meet = cfg.meetAt != null ? sstep(cfg.meetAt, cfg.meetAt + 4, t) : 1;
        men.userData.u.uOpacity.value = meet * (cfg.menOut != null ? 1 - sstep(cfg.menOut, cfg.menOut + 2.5, t) : 1);
        men.position.y = SURF + 1.45 - (1 - meet) * 0.4;
      }
      const [x, y, z, lx, ly, lz] = camPath(cfg.cam || [[0, 0, -0.6, 22, 0, -0.6, -3]], t);
      st.camera.position.set(x, y, z);
      st.camera.lookAt(lx, ly, lz);
    });
    return st;
  };
}

// ================================================================= 1936 — COPYBOOK
function gridTex(w, h, cell, mx, my, cols, rows) {
  return canvasTex(w, h, (g) => {
    g.strokeStyle = W;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const x = mx + c * cell,
          y = my + r * cell;
        g.lineWidth = 3;
        g.strokeRect(x, y, cell, cell);
        g.lineWidth = 1.2;
        g.setLineDash([8, 8]);
        g.beginPath();
        g.moveTo(x + cell / 2, y);
        g.lineTo(x + cell / 2, y + cell);
        g.moveTo(x, y + cell / 2);
        g.lineTo(x + cell, y + cell / 2);
        g.stroke();
        g.setLineDash([]);
      }
  });
}

// who: "son" (grid copybook, fountain-pen blue-black, a desk lamp) or "mother" (rough paper, pencil, light moving with the train)
export function c4Book(cfg) {
  return (world, shot) => {
    const son = cfg.who === "son";
    const st = new Stage(world, { grade: son ? { lift: [0.01, 0.01, 0.012], gain: [1.02, 1.0, 0.95], gamma: 1, sat: 0.7 } : GRADE.g1936, fov: 30 });
    const w = 2048,
      h = 1600;
    const cell = son ? 132 : 118;
    const cols = Math.floor((w * 0.82) / cell),
      rows = Math.floor((h * 0.82) / cell);
    const mx = (w - cols * cell) / 2,
      my = (h - rows * cell) / 2;
    // two hands: the son (宁儿) copies in a quick fountain-pen script; the mother (赵一曼) writes a neat pencil hand
    const hand = new StrokeHand({ w, h, size: cell * 0.84, grid: cell, cols, rows, margin: [mx / w, my / h], color: "#000",
      font: son ? FONTS.cang : FONTS.yozai, punctFont: son ? FONTS.cang : FONTS.yozai, fontScale: son ? 1.08 : 1.0, seed: son ? 41 : 43, lines: shot.lines || [], jitter: son ? 0.06 : 0.09 });
    const H = 7.2,
      Wd = H * (w / h);
    const mat = sheetMaterial({
      ink: hand.tex,
      paper: son ? 0xeae2cf : 0xc9bc98,
      inkColor: son ? 0x1b2a4c : 0x1c1c1e,
      grid: son ? gridTex(w, h, cell, mx, my, cols, rows) : null,
      gridColor: 0x3f8a5a,
      pencil: son ? 0 : 0.55,
      deckle: son ? 0.0 : 0.9,
      folds: son ? 0 : 0.7,
      age: son ? 0.15 : 0.6,
      aspect: w / h,
      lightPos: son ? [0.25, 0.9] : [0.7, 0.75],
      lightFall: son ? 0.7 : 1.4,
      ambient: son ? 0.3 : 0.22,
      fiber: son ? 0.04 : 0.1,
    });
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(Wd, H), mat);
    sheet.rotation.z = son ? -0.015 : 0.03;
    st.add(sheet);
    st.timed.push(mat.uniforms);
    if (son) {
      // the copybook's binding edge and the page beneath
      const spine = st.layer({ z: -0.02, x: -Wd / 2 - 0.15, w: 0.5, h: H * 1.02, tone: 0x5a3a2a });
    }
    // the name, written large at the end
    let name = null;
    if (cfg.name) {
      // written stroke by stroke in the same hand as 见字如面 (the stroke data's own outlines)
      name = new StrokeHand({ w: 2048, h: 700, size: 520, grid: 620, cols: 3, margin: [(2048 - 1860) / 2 / 2048, 0.07], color: "#000", brush: 150, bold: 14, join: "miter", seed: 47, lines: [cfg.name] });
      const nm = new THREE.Mesh(new THREE.PlaneGeometry(Wd * 0.8, (Wd * 0.8 * 700) / 2048), inkOnly(name.tex, 0x162244, 0.95));
      nm.position.set(0, -H * 0.06, 0.02);
      nm.rotation.z = sheet.rotation.z;
      st.add(nm);
    }
    const [dw, dh] = st.fillSize(-0.4, 10, 1.6);
    const desk = new THREE.Mesh(new THREE.PlaneGeometry(dw, dh), sheetMaterial({ paper: son ? 0x2a1c12 : 0x241a12, deckle: 0, folds: 0, age: 0, fiber: 0.14, aspect: dw / dh, lightPos: [0.3, 0.7], lightFall: 1.2, ambient: 0.06 }));
    desk.position.z = -0.4;
    st.add(desk);
    st.timed.push(desk.material.uniforms);
    const dust = st.particles({ mode: 4, count: 60, box: [9, 5, 2], center: [0, 0, 2], size: 0.02, color: 0xfff0d0, opacity: 0.35, seed: 31 });
    const toWorld = ([px, py]) => [(px / w - 0.5) * Wd, (0.5 - py / h) * H];
    st.onUpdate((t, dur, T) => {
      hand.draw(t);
      if (name) name.draw(t);
      if (son) {
        const f = flicker(T, 3);
        mat.uniforms.uLightAmt.value = 1.0 * f;
        desk.material.uniforms.uLightAmt.value = 0.7 * f;
      } else {
        // a soft patch of daylight from the boxcar's small window slides slowly across the page
        const u = 0.5 + 0.35 * Math.sin(T * 0.23 + 1.0),
          v = 0.6 + 0.12 * Math.sin(T * 0.31);
        mat.uniforms.uLightPos.value.set(u, v);
        mat.uniforms.uLightAmt.value = 1.05 + 0.08 * Math.sin(T * 5.1);
        desk.material.uniforms.uLightAmt.value = 0.5;
      }
      let ay = 0;
      ay = toWorld(hand.penSmooth(t, 1.8))[1];
      // with the name: hold the whole page — both copied rows above and the name below — in frame
      const zoom = name ? lerp(cfg.zFrom ?? 13.8, cfg.zTo ?? 13.0, sine(t / dur)) : lerp(cfg.zFrom ?? Wd * 1.12, cfg.zTo ?? Wd * 1.04, sine(t / dur));
      const viewH = 2 * zoom * Math.tan((30 * Math.PI) / 360) * (816 / 1080);
      const my2 = Math.max(0, H / 2 - viewH / 2 + 0.2);
      const cy = name ? 0.68 : clamp(ay, -my2, my2);
      // the train's rhythm: a small, irregular shiver (mother's page only)
      const shiver = son ? 0 : 0.012 * Math.sin(T * 47) * (0.5 + 0.5 * Math.sin(T * 2.3)) + 0.006 * Math.sin(T * 13);
      st.camera.position.set(0.1 + shiver, cy - 0.12 + shiver * 0.6, zoom);
      st.camera.lookAt(shiver * 0.5, cy, 0);
    });
    return st;
  };
}

// ================================================================= 1942 — THE READER
function caveFrontTex() {
  // front wall seen from inside: an arched window, a door on the right
  return canvasTex(2048, 1152, (g, w, h) => {
    g.fillStyle = W;
    g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = "destination-out";
    // window: arch + rectangle
    const x0 = w * 0.18,
      x1 = w * 0.62,
      top = h * 0.3,
      bot = h * 0.66;
    g.beginPath();
    g.moveTo(x0, bot);
    g.lineTo(x0, top);
    g.ellipse((x0 + x1) / 2, top, (x1 - x0) / 2, h * 0.22, 0, Math.PI, 0);
    g.lineTo(x1, bot);
    g.closePath();
    g.fill();
    g.fillRect(w * 0.7, h * 0.28, w * 0.13, h * 0.72); // door
    g.globalCompositeOperation = "source-over";
  });
}

export function c5Yanan(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: { lift: [0.012, 0.008, 0.0], gain: [1.06, 1.0, 0.88], gamma: 1.0, sat: 0.85 } });
    const winCx = (0.4 - 0.5) * 16.6,
      winCy = 0.0;
    // daylight outside
    st.sky({ z: -10, top: 0xf6ecd2, mid: 0xfff6e0, bot: 0xe8d8b0, midY: 0.5 });
    // the window paper: glowing, with the magpie paper-cut pasted in the middle pane
    const [fw, fh] = st.fillSize(-3, 10, 1.15);
    const panes = st.layer({ z: -3.12, tone: 0xfff2d8, size: [fw * 0.5, fh * 0.6], x: winCx, y: 0.6, opacity: 0.92 });
    const lattice = st.layer({ tex: P.lattice({ w: 1600, h: 1200, cols: 5, rows: 4, frame: 0.02, bar: 0.012 }), z: -3.08, x: winCx, y: 0.6, w: fw * 0.48, h: fh * 0.58, tone: 0x2a1c12, rim: 0.4, rimDir: [0, 0], light: 0xfff0d0 });
    const flower = sil(st, "fig_chuanghua", { z: -3.05, h: 2.3, x: winCx, y: 0.75, tone: 0xa8322a, opacity: 0.88 });
    const front = st.layer({ tex: caveFrontTex(), z: -3.0, size: [fw, fh], tone: 0x5a4430, fiber: 0.1, lightAmt: 0.5, light: 0xffe0b0, lightPos: [0.4, 0.5], lightFall: 2.5 });
    // light shafts and dust in the beam
    const beam = st.glow({ x: winCx + 1.5, y: -0.8, z: -1.5, size: 9, color: 0xffe2b0, amt: 0.35, core: 0 });
    const dust = st.particles({ mode: 4, count: 220, box: [5, 4, 2.5], center: [winCx + 1.2, 0, -1.5], size: 0.025, color: 0xfff0d0, opacity: 0.6, seed: 21 });
    // the kang and the two figures
    const kang = st.layer({ tex: P.ridge({ base: 0.72, amp: 0.0, freq: 1, seed: 3 }), z: -1.0, y: -1.8, size: [st.fillSize(-1)[0], 4], tone: 0x2a1d14, lightAmt: 0.4, light: 0xffe0b0, lightPos: [0.4, 0.8], lightFall: 2 });
    const woman = sil(st, "fig_zhilan_reading", { z: -0.8, h: 3.2, x: -1.4, y: -0.95, tone: 0x140d09, rim: 1.0, rimDir: [-1, 0.4], light: 0xfff0d0 });
    const child = sil(st, "fig_toddler", { z: -0.6, h: 1.75, x: 2.6, y: -1.55, tone: 0x140d09, rim: 0.9, rimDir: [-1, 0.3], light: 0xfff0d0 });
    st.onUpdate((t, dur, T) => {
      const dusk = cfg.duskAt != null ? sstep(cfg.duskAt, cfg.duskAt + 6, t) : 0;
      panes.userData.u.uTone.value.setRGB(lerp(1.0, 0.95, dusk), lerp(0.95, 0.62, dusk), lerp(0.85, 0.36, dusk));
      front.userData.u.uLightAmt.value = lerp(0.5, 0.28, dusk);
      beam.userData.u.uAmt.value = lerp(0.35, 0.12, dusk);
      dust.userData.u.uOpacity.value = lerp(0.6, 0.25, dusk);
      // the child plays: the pinwheel arm bobs
      child.rotation.z = Math.sin(T * 2.2) * 0.02;
      child.position.y = -1.55 + Math.abs(Math.sin(T * 2.2)) * 0.03;
      const p = sine(t / dur);
      st.camera.position.set(lerp(cfg.cx0 ?? -0.6, cfg.cx1 ?? 0.4, p), lerp(-0.2, -0.05, p), lerp(cfg.z0 ?? 10, cfg.z1 ?? 8.8, p));
      st.camera.lookAt(lerp((cfg.cx0 ?? -0.6) * 0.6, (cfg.cx1 ?? 0.4) * 0.6, p), -0.2, -3);
    });
    return st;
  };
}

// ================================================================= THE ENDING — the first letter, healed and answered
// The burned 见字如面 sheet from the opening: the char runs backwards into paper, the candle lights itself,
// then the brush adds the words still written in wars today, and another hand answers them.
export function eReturn(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: GRADE.warm, fov: 30 });
    const hand = new StrokeHand({ w: 1400, h: 1800, size: 200, vertical: true, lineGap: 1.32, margin: [0.11, 0.06], color: "#0d0907", font: FONTS.brush, mask: 320, bleed: 3, seed: 11, lines: shot.lines || [] });
    const reply = new StrokeHand({ w: 1400, h: 1800, size: 200, vertical: true, lineGap: 1.32, margin: [0.11 + (2 * 200 * 1.32) / 1400, 0.1], color: "#0d0907", font: FONTS.kai, mask: 280, bleed: 1.5, seed: 29, lines: cfg.reply ? [cfg.reply] : [] });
    const H = 5.4,
      Wd = H * (1400 / 1800);
    const mat = sheetMaterial({ ink: hand.tex, paper: 0xd9c7a2, inkColor: 0x120c08, aspect: 1400 / 1800, lightPos: [-0.45, 0.2], lightFall: 1.0, ambient: 0.16, age: 0.6, fiber: 0.07, folds: 1 });
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(Wd, H), mat);
    sheet.position.set(0.5, 0.0, 0);
    sheet.rotation.z = -0.03;
    st.add(sheet);
    st.timed.push(mat.uniforms);
    const second = new THREE.Mesh(new THREE.PlaneGeometry(Wd, H), inkOnly(reply.tex, 0x15182a, 0.92));
    second.position.set(0.5, 0.0, 0.002);
    second.rotation.z = -0.03;
    st.add(second);
    const [dw, dh] = st.fillSize(-0.5, 10, 1.6);
    const deskMat = sheetMaterial({ paper: 0x22170f, deckle: 0, folds: 0, age: 0, fiber: 0.14, aspect: dw / dh, lightPos: [0.36, 0.38], lightFall: 2.6, ambient: 0.06 });
    const desk = new THREE.Mesh(new THREE.PlaneGeometry(dw, dh), deskMat);
    desk.position.z = -0.5;
    st.add(desk);
    st.timed.push(deskMat.uniforms);
    const lamp = addLamp(st, { kind: "candle", x: -2.6, y: -0.95, z: 0.6, height: 1.7, seed: 4 });
    // a little ash still rising from the healed edge
    const ash = st.particles({ mode: 0, count: 40, box: [4, 3, 1], center: [0.5, -0.6, 0.3], size: 0.05, color: 0xff8a3a, opacity: 0.6, seed: 13 });
    st.onUpdate((t, dur, T) => {
      hand.draw(t);
      reply.draw(t);
      const heal = sstep(cfg.healFrom ?? 0, cfg.healTo ?? 6, t);
      mat.uniforms.uBurn.value = heal < 1 ? lerp(0.85, -0.5, heal) : -1;
      ash.userData.u.uOpacity.value = 0.6 * (1 - heal);
      const on = sstep(cfg.lightAt ?? 7, (cfg.lightAt ?? 7) + 1.2, t);
      const f = flicker(T, 4);
      lamp.flame.userData.u.uOut.value = 1 - on;
      lamp.flame.scale.setScalar(0.3 + 0.7 * on);
      const k = on * f;
      mat.uniforms.uLightAmt.value = 1.15 * k;
      deskMat.uniforms.uLightAmt.value = 1.0 * k;
      lamp.body.userData.u.uFlick.value = k;
      lamp.body.userData.u.uRim.value = 1.4 * k + 0.1;
      const p = sine(t / dur);
      st.camera.position.set(lerp(0.3, -0.4, p), lerp(0.05, 0.0, p), lerp(12.2, 13.4, p));
      st.camera.lookAt(lerp(0.4, -0.1, p), 0.05, 0);
    });
    return st;
  };
}
