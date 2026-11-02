// 家书 — epilogue: "the same words". One letter being written in Chinese; the camera pulls back and every
// sheet around it — French, German, Russian, Arabic, Hebrew, Japanese, Korean, Vietnamese … each headed with
// a battlefield and a year — writes the same three lines at the same moment. Then the candles go out.
import { THREE, Stage, rng, clamp, lerp, sstep, flicker, canvasTex } from "./world.js";
import { sheetMaterial, StrokeHand, FONTS } from "./kit.js";

const SCRIPT = '"Segoe Script"',
  PRINT = '"Segoe Print"',
  INK = '"Ink Free"',
  LUCIDA = '"Lucida Handwriting"',
  UI = '"Segoe UI"',
  TIMES = '"Times New Roman"';

// [lang, fonts for the two variants, rtl, [I love you, I miss you, don't grieve for me], [place · year ×2]]
const LANGS = [
  ["en", [FONTS.spencer, FONTS.cedar], 0, ["I love you", "I miss you", "Do not mourn for me"], ["Virginia, 1861", "Normandy, 1944"]],
  ["fr", [FONTS.aurore, SCRIPT], 0, ["Je t'aime", "Tu me manques", "Ne pleure pas pour moi"], ["Verdun, 1916", "Điện Biên Phủ, 1954"]],
  ["de", [SCRIPT, FONTS.pinyon], 0, ["Ich liebe dich", "Ich vermisse dich", "Weine nicht um mich"], ["Somme, 1916", "Stalingrad, 1942"]],
  ["ru", [SCRIPT, PRINT], 0, ["Я тебя люблю", "Я скучаю по тебе", "Не плачь обо мне"], ["Сталинград, 1942", "Грозный, 1995"]],
  ["uk", [PRINT, INK], 0, ["Я тебе кохаю", "Я сумую за тобою", "Не плач за мною"], ["Харків, 1943", "Бахмут, 2023"]],
  ["ja", [FONTS.kai, FONTS.kai], 0, ["愛している", "会いたい", "悲しまないで"], ["硫黄島　1945", "レイテ　1944"]],
  ["ko", ['"Malgun Gothic"', '"Malgun Gothic"'], 0, ["사랑해", "보고 싶어", "슬퍼하지 마"], ["낙동강 1950", "장진호 1950"]],
  ["zh", [FONTS.xing, FONTS.kai], 0, ["我爱你。", "我想你。", "别为我难过。"], ["台儿庄　1938", "上甘岭　1952"]],
  ["vi", [PRINT, INK], 0, ["Anh yêu em", "Anh nhớ em", "Đừng buồn vì anh"], ["Khe Sanh, 1968", "Quảng Trị, 1972"]],
  ["ar", [UI, TIMES], 1, ["أحبكِ", "اشتقت إليكِ", "لا تحزني عليّ"], ["سيناء ١٩٧٣", "حلب ٢٠١٦"]],
  ["he", [UI, TIMES], 1, ["אני אוהב אותך", "אני מתגעגע אלייך", "אל תבכי עליי"], ["ירושלים 1948", "סיני 1973"]],
  ["es", [FONTS.cedar, LUCIDA], 0, ["Te quiero", "Te echo de menos", "No llores por mí"], ["Madrid, 1937", "Ebro, 1938"]],
  ["it", [FONTS.pinyon, FONTS.aurore], 0, ["Ti amo", "Mi manchi", "Non piangere per me"], ["Isonzo, 1917", "El Alamein, 1942"]],
  ["pl", [SCRIPT, INK], 0, ["Kocham cię", "Tęsknię za tobą", "Nie płacz po mnie"], ["Warszawa, 1944", "Monte Cassino, 1944"]],
  ["tr", [PRINT, SCRIPT], 0, ["Seni seviyorum", "Seni özledim", "Benim için üzülme"], ["Gelibolu, 1915", "Kore, 1951"]],
  ["fa", [UI, TIMES], 1, ["دوستت دارم", "دلم برایت تنگ شده", "برای من غصه نخور"], ["خرمشهر ۱۳۶۱", "آبادان ۱۳۵۹"]],
  ["hi", ['"Nirmala UI"', '"Nirmala UI"'], 0, ["मैं तुमसे प्यार करता हूँ", "मुझे तुम्हारी याद आती है", "मेरे लिए दुखी मत होना"], ["कोहिमा, 1944", "कारगिल, 1999"]],
  ["sr", [INK, LUCIDA], 0, ["Volim te", "Nedostaješ mi", "Ne tuguj za mnom"], ["Sarajevo, 1993", "Vukovar, 1991"]],
  ["hu", [SCRIPT, PRINT], 0, ["Szeretlek", "Hiányzol", "Ne sírj értem"], ["Doberdó, 1916", "Don-kanyar, 1943"]],
  ["sw", [LUCIDA, FONTS.cedar], 0, ["Nakupenda", "Nakukumbuka", "Usinililie"], ["Tanga, 1914", "Kampala, 1979"]],
];
// the thin, small-bodied script faces need a larger size to read at the same weight
const FONT_SCALE = { [FONTS.spencer]: 1.5, [FONTS.aurore]: 1.2, [FONTS.cedar]: 1.15, [FONTS.pinyon]: 1.3 };
const LINE_Y = [0.4, 0.58, 0.76]; // line centres, from the top of a sheet
const CW = 768,
  CH = 576,
  COLS = 8,
  ROWS = 5; // 40 cells: 20 languages × 2 hands

function atlasTex() {
  return canvasTex(CW * COLS, CH * ROWS, (g) => {
    LANGS.forEach(([, fonts, rtl, lines, places], li) => {
      for (let v = 0; v < 2; v++) {
        const cell = li * 2 + v;
        const x0 = (cell % COLS) * CW,
          y0 = Math.floor(cell / COLS) * CH;
        const r = rng(cell * 13 + 5);
        const font = fonts[v];
        const fam = `${font}, ${UI}, sans-serif`;
        g.save();
        g.beginPath();
        g.rect(x0, y0, CW, CH);
        g.clip();
        g.translate(x0, y0);
        g.fillStyle = "#fff";
        g.direction = rtl ? "rtl" : "ltr";
        g.textAlign = rtl ? "right" : "left";
        g.textBaseline = "middle";
        const xa = rtl ? CW * 0.9 : CW * 0.1;
        // the place and the year, small, top corner
        g.globalAlpha = 0.72;
        g.font = `${CH * 0.058 * Math.min(FONT_SCALE[font] || 1, 1.25)}px ${fam}`;
        g.fillText(places[v], xa, CH * 0.15);
        g.globalAlpha = 1;
        lines.forEach((text, k) => {
          let fs = CH * 0.1 * (FONT_SCALE[font] || 1);
          g.font = `${fs}px ${fam}`;
          const w = g.measureText(text).width;
          if (w > CW * 0.8) {
            fs *= (CW * 0.8) / w;
            g.font = `${fs}px ${fam}`;
          }
          g.save();
          g.translate(xa + (r() - 0.5) * CW * 0.03, CH * LINE_Y[k]);
          g.rotate((r() - 0.5) * 0.04);
          g.fillText(text, 0, 0);
          g.restore();
        });
        g.restore();
      }
    });
  });
}

const sheetVS = `
  attribute float aCell, aSeed, aDelay, aOut, aRtl, aOn;
  uniform float uTime;
  varying vec2 vUv; varying float vCell, vSeed, vDelay, vOut, vRtl, vDepth, vOn;
  void main(){
    vUv = uv; vCell = aCell; vSeed = aSeed; vDelay = aDelay; vOut = aOut; vRtl = aRtl; vOn = aOn;
    vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.);
    wp.y += sin(uTime * 0.35 + aSeed * 40.) * 0.04;
    vec4 mv = viewMatrix * wp;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;

const sheetFS = `
  uniform sampler2D uAtlas; uniform vec2 uGrid; uniform float uT, uTime, uWrite; uniform vec3 uBeats;
  varying vec2 vUv; varying float vCell, vSeed, vDelay, vOut, vRtl, vDepth, vOn;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main(){
    vec2 uv = vUv;
    float col = mod(vCell, uGrid.x), row = floor(vCell / uGrid.x + 0.001);
    float ink = texture2D(uAtlas, vec2((col + uv.x) / uGrid.x, 1. - (row + 1. - uv.y) / uGrid.y)).a;
    // the three lines are written one after another, each wiping in along its own direction
    float yy = 1. - uv.y, x = vRtl > .5 ? 1. - uv.x : uv.x, m = 1.;
    if (yy > .24) {
      float b = yy < .49 ? uBeats.x : (yy < .67 ? uBeats.y : uBeats.z);
      float e = mix(.06, .95, clamp((uT - b - vDelay) / uWrite, 0., 1.));
      m = 1. - smoothstep(e - .012, e + .012, x);
      if (uT < b + vDelay) m = 0.;
    }
    float s2 = fract(vSeed * 7.13);
    vec3 paper = mix(vec3(.80, .72, .56), vec3(.93, .87, .74), s2);
    paper *= .94 + .06 * h(floor(uv * vec2(320., 240.)) + vSeed);
    float d = min(min(uv.x, 1. - uv.x), min(uv.y, 1. - uv.y));
    paper *= mix(.62, 1., smoothstep(0., .14, d));
    // its own candle, just below the sheet
    vec2 q = (uv - vec2(.5 + (s2 - .5) * .5, -.28)) * vec2(1.1, 1.);
    float L = .1 + 1.15 * exp(-dot(q, q) * 1.5);
    float fl = .9 + .1 * sin(uTime * 9. + vSeed * 50.) * sin(uTime * 3.7 + vSeed * 20.);
    // its candle is lit (a wave spreading out from the first letter) and, at the end, goes out
    float on = smoothstep(vOn, vOn + .35, uT) * (1. - smoothstep(vOut, vOut + .22, uT));
    float flare = 1. + .4 * exp(-pow((uT - vOut + .1) / .07, 2.)) + .5 * exp(-pow((uT - vOn - .12) / .1, 2.));
    vec3 c = paper * vec3(1., .74, .46) * L * fl * flare;
    c = mix(c, vec3(.05, .03, .02) * L, ink * m * .93);
    c *= mix(.015, 1., on);
    c *= .25 + .75 * exp(-vDepth / 80.);
    gl_FragColor = vec4(c, 1.);
  }`;

const glowFS = `
  uniform float uT, uTime;
  varying vec2 vUv; varying float vSeed, vOut, vDepth, vOn;
  void main(){
    vec2 q = vUv - .5;
    float fl = .85 + .15 * sin(uTime * 9. + vSeed * 50.) * sin(uTime * 3.7 + vSeed * 20.);
    float on = smoothstep(vOn, vOn + .35, uT) * (1. - smoothstep(vOut, vOut + .22, uT));
    float flare = 1. + .8 * exp(-pow((uT - vOut + .1) / .07, 2.)) + 1.2 * exp(-pow((uT - vOn - .1) / .1, 2.));
    float halo = exp(-dot(q, q) * 22.) * .32;
    float core = exp(-(q.x * q.x / .00035 + (q.y - .015) * (q.y - .015) / .0016));
    // far away the flame is below a pixel: keep a warm point so the field reads as a sky of small lights
    float far = smoothstep(20., 90., vDepth);
    vec3 c = vec3(1., .58, .24) * halo * fl * (1. + far * 1.6) + vec3(1., .86, .62) * core * 1.5;
    gl_FragColor = vec4(c * on * flare * (.35 + .65 * exp(-vDepth / 110.)), 1.);
  }`;

export function eSea(cfg) {
  return (world, shot) => {
    const st = new Stage(world, { grade: { lift: [0.006, 0.004, 0.004], gain: [1.03, 1.0, 0.96], gamma: 1.0, sat: 0.85 }, fov: 30 });
    const beats = cfg.beats || [1.0, 4.2, 7.4];
    const SW = 1.333,
      SH = 1.0;
    // ---------------------------------------------------------------- placements
    const r = rng(cfg.seed ?? 2024);
    const items = []; // {pos:[x,y,z], rot:[x,y,z], cell, out}
    const add = (lang, v, x, y, z, rs = 1) => {
      const li = LANGS.findIndex((L) => L[0] === lang);
      items.push({ pos: [x, y, z], rot: [(r() - 0.5) * 0.16 * rs, (r() - 0.5) * 0.4 * rs, (r() - 0.5) * 0.14 * rs], cell: li * 2 + v, rtl: LANGS[li][2] });
    };
    // the first ring: what the pull-back reveals one by one
    const ring = [
      ["en", 0, -2.15, 0.1, -0.6], ["fr", 0, 2.2, -0.15, -0.7], ["de", 1, -0.3, 1.3, -1.3], ["ru", 0, 0.5, -1.32, -1.1],
      ["ar", 0, 2.6, 1.25, -1.9], ["ja", 0, -2.5, -1.3, -1.7], ["ko", 0, -4.0, 1.0, -2.7], ["he", 1, 4.3, -0.9, -2.6],
      ["vi", 0, 0.9, 2.75, -3.2], ["uk", 1, -1.3, -2.8, -3.0], ["es", 0, 4.9, 2.5, -4.2], ["tr", 0, -5.2, -2.3, -4.4],
      ["it", 1, -2.4, 3.0, -4.6], ["pl", 0, 3.0, -3.0, -4.8], ["hi", 0, 6.4, 0.4, -5.4], ["fa", 0, -6.6, 0.3, -5.6],
      ["sr", 0, 1.6, 4.2, -6.2], ["hu", 1, -3.4, -4.3, -6.4], ["sw", 0, 6.0, -3.6, -7.0], ["zh", 1, -6.4, 3.8, -7.2],
    ];
    ring.forEach(([l, v, x, y, z]) => add(l, v, x, y, z));
    // the sea: fills the final view, deep into the dark and also out past the camera's start, so sheets keep
    // sliding in from the edges as it pulls back
    const N = cfg.count ?? 1500;
    let guard = 0;
    while (items.length < N + ring.length && guard++ < 20000) {
      const z = lerp(62, -170, Math.pow(r(), 0.8));
      const d = 78 - z; // distance from the final camera position
      const x = (r() * 2 - 1) * d * 0.52,
        y = (r() * 2 - 1) * d * 0.31 + 2.0;
      if (z > -8 && Math.hypot(x, y) < 3.2 + Math.max(0, z) * 0.12) continue; // keep the axis clear in front of the camera
      if (z > -8 && z < 2 && Math.abs(x) < 7 && Math.abs(y) < 4.5) continue; // the first ring is hand-placed
      const li = Math.floor(r() * LANGS.length);
      add(LANGS[li][0], Math.floor(r() * 2), x, y, z, 2.2);
    }
    // writing waves out from the first letter; candles go out at random, the first letter's last
    const heroOut = cfg.heroOut ?? 13.1;
    items.forEach((it) => {
      const dist = Math.hypot(...it.pos);
      it.delay = Math.min(dist * 0.012, 1.6) + r() * 0.45;
      it.out = lerp(10.2, 12.9, Math.pow(r(), 0.85)) - Math.min(dist, 30) * 0.004;
      it.seed = r();
      it.on = beats[0] - 0.7 + Math.min(dist * 0.016, 2.4) + r() * 0.5;
      it.delay = Math.max(it.delay, it.on - beats[0] + 0.35); // no one writes in the dark
    });
    // ---------------------------------------------------------------- the sheets (instanced)
    const atlas = atlasTex();
    const n = items.length;
    const mk = (geo, mat) => {
      const m = new THREE.InstancedMesh(geo, mat, n);
      const dummy = new THREE.Object3D();
      items.forEach((it, i) => {
        dummy.position.set(...it.pos);
        dummy.rotation.set(...it.rot);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
      });
      m.frustumCulled = false;
      const A = (k, f) => geo.setAttribute(k, new THREE.InstancedBufferAttribute(new Float32Array(items.map(f)), 1));
      A("aCell", (it) => it.cell);
      A("aSeed", (it) => it.seed);
      A("aDelay", (it) => it.delay);
      A("aOut", (it) => it.out);
      A("aRtl", (it) => it.rtl);
      A("aOn", (it) => it.on);
      return m;
    };
    const uS = { uAtlas: { value: atlas }, uGrid: { value: new THREE.Vector2(COLS, ROWS) }, uT: { value: 0 }, uTime: { value: 0 }, uWrite: { value: cfg.write ?? 1.3 }, uBeats: { value: new THREE.Vector3(...beats) } };
    const sheets = mk(new THREE.PlaneGeometry(SW, SH), new THREE.ShaderMaterial({ uniforms: uS, vertexShader: sheetVS, fragmentShader: sheetFS, side: THREE.DoubleSide }));
    st.add(sheets);
    st.timed.push(uS);
    // each sheet's candle: a small flame and its halo, below and in front of the page
    const glowGeo = new THREE.PlaneGeometry(1.5, 1.5);
    glowGeo.translate(0, -0.66, 0.22);
    const uG = { uT: uS.uT, uTime: { value: 0 } };
    const glows = mk(glowGeo, new THREE.ShaderMaterial({ uniforms: uG, vertexShader: sheetVS, fragmentShader: glowFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    st.add(glows);
    st.timed.push(uG);
    // ---------------------------------------------------------------- the first letter: Chinese, written stroke by stroke
    const hand = new StrokeHand({
      w: 1600,
      h: 1200,
      size: 205,
      lineGap: 1.42,
      margin: [0.13, 0.2],
      color: "#000",
      // the same hand as 见字如面: the stroke data's own kai outlines, written stroke by stroke
      brush: 150,
      bold: 20,
      join: "miter",
      dry: true,
      bleed: 3,
      seed: 5,
      lines: ["我爱你。", "我想你。", "别为我难过。"].map((text, k) => ({ text, start: beats[k], end: beats[k] + (k === 2 ? 2.0 : 1.4) })),
    });
    const hm = sheetMaterial({ ink: hand.tex, paper: 0xe2d4b4, inkColor: 0x140d08, aspect: SW / SH, lightPos: [0.5, -0.05], lightFall: 1.25, ambient: 0.06, age: 0.55, fiber: 0.08, folds: 0.6 });
    const hero = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), hm);
    st.add(hero);
    st.timed.push(hm.uniforms);
    const heroGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 1.5).translate(0, -0.66, 0.22),
      new THREE.ShaderMaterial({
        uniforms: { uT: uS.uT, uTime: uG.uTime, uHeroOut: { value: heroOut } },
        vertexShader: `uniform float uTime; varying vec2 vUv; varying float vSeed, vOut, vDepth, vOn; uniform float uHeroOut;
          void main(){ vUv = uv; vSeed = .37; vOut = uHeroOut; vOn = -10.; vec4 mv = modelViewMatrix * vec4(position, 1.); vDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: glowFS,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    st.add(heroGlow);
    // embers and dust drifting through the candlelight
    st.particles({ mode: 0, count: 260, box: [26, 14, 30], center: [0, 0, -8], size: 0.045, color: 0xffa050, opacity: 0.5, seed: 9 });
    st.onUpdate((t, dur, T) => {
      uS.uT.value = t;
      hand.draw(t);
      const f = flicker(T, 4);
      const on = 1 - sstep(heroOut, heroOut + 0.22, t);
      const flare = 1 + 0.4 * Math.exp(-Math.pow((t - heroOut + 0.1) / 0.07, 2));
      hm.uniforms.uLightAmt.value = 1.05 * f * on * flare;
      hm.uniforms.uAmbient.value = 0.06 * on + 0.004;
      // pull back: slow at first (one letter), then faster and faster (all of them)
      const e = sstep(cfg.pullFrom ?? 0.9, cfg.pullTo ?? 12.6, t);
      const cz = 2.4 * Math.pow(78 / 2.4, e);
      // the first letter stays at the centre of the frame until it is one light among many
      const e2 = e * e * e;
      st.camera.position.set(lerp(0.0, -2.0, e2), lerp(-0.02, 3.2, e2), cz);
      st.camera.lookAt(lerp(0, -0.8, e2), lerp(-0.02, 0.6, e2), lerp(0, -30, e2));
    });
    return st;
  };
}
