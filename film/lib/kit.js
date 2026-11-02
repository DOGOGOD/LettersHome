// 家书 — procedural paper-cut painters, silhouettes, handwriting and lit sheets.
import { THREE, rng, canvasTex, GLSL, clamp, sstep } from "./world.js";
import HANZI from "./hanzi_data.js";

// ---------------------------------------------------------------- assets
export const SIL = {};
export const INK = {};
const SIL_NAMES = [
  "fig_ballou_writing", "fig_sarah_window", "fig_two_boys", "fig_union_line", "fig_lin_writing", "fig_couple",
  "fig_revolutionaries", "fig_floch_writing", "fig_german_writing", "fig_firing_squad", "fig_truce", "fig_zhao_writing",
  "fig_mother_child", "fig_boy_doorstep", "fig_zuo_writing", "fig_family_photo", "fig_locomotive", "fig_junks",
  "fig_changan", "fig_peach_branch", "fig_plum_branch", "fig_capitol", "fig_soldier_column", "fig_window_home", "fig_zhilan_reading", "fig_toddler", "fig_chuanghua", "fig_farmhouse", "fig_sarah", "fig_battery", "fig_cavalry", "fig_fallen", "fig_ruined_village", "fig_over_top", "fig_bombers", "fig_ridge_fight",
];
export const FONTS = {
  serif: '"Noto Serif SC"',
  brush: '"Ma Shan Zheng"',
  xing: '"Zhi Mang Xing"',
  kai: '"Letters Kai"', // subset of LXGW WenKai (renamed: Reserved Font Name)
  cang: '"Long Cang"', // everyday fountain-pen handwriting
  yozai: '"Yozai"', // a neat, upright pencil hand
  pinyon: '"Pinyon Script"',
  spencer: '"Letters Spencer"', // subset of Mrs Saint Delafield (renamed: Reserved Font Name)
  aurore: '"La Belle Aurore"',
  cedar: '"Cedarville Cursive"',
  garamond: '"EB Garamond"',
};
export async function loadAssets(base = "assets/sil/") {
  const loader = new THREE.TextureLoader();
  await Promise.all(
    SIL_NAMES.map(
      (n) =>
        new Promise((res) => {
          loader.load(
            base + n + ".png",
            (t) => {
              t.colorSpace = THREE.NoColorSpace;
              t.anisotropy = 4;
              t.userData.keep = true;
              SIL[n] = t;
              res();
            },
            undefined,
            () => res(),
          );
        }),
    ),
  );
  await Promise.all(
    ["ink_plum", "ink_city"].map(
      (n) =>
        new Promise((res) =>
          loader.load("assets/ink/" + n + ".jpg", (t) => {
            t.colorSpace = THREE.NoColorSpace;
            t.userData.keep = true;
            INK[n] = t;
            res();
          }, undefined, () => res()),
        ),
    ),
  );
  await Promise.all(
    [FONTS.serif, FONTS.brush, FONTS.xing, FONTS.kai, FONTS.cang, FONTS.yozai, FONTS.pinyon, FONTS.cedar, FONTS.garamond, FONTS.spencer, FONTS.aurore].map((f) =>
      document.fonts.load(`64px ${f}`, "家书见字如面永不消亡abc").catch(() => null),
    ),
  );
}

// ---------------------------------------------------------------- 1D noise for silhouettes
export function noise1(seed) {
  const r = rng(seed);
  const v = Array.from({ length: 512 }, r);
  return (x) => {
    const i = Math.floor(x),
      f = x - i;
    const a = v[((i % 512) + 512) % 512],
      b = v[(((i + 1) % 512) + 512) % 512];
    const u = f * f * (3 - 2 * f);
    return a + (b - a) * u;
  };
}
export function fbm1(seed, oct = 5) {
  const ns = Array.from({ length: oct }, (_, i) => noise1(seed + i * 101));
  return (x) => {
    let s = 0,
      a = 0.5,
      f = 1;
    for (const n of ns) {
      s += a * n(x * f);
      f *= 2.03;
      a *= 0.5;
    }
    return s;
  };
}

// ---------------------------------------------------------------- painters (white = paper, transparent = cut away)
const W = "#fff";
export const P = {
  // a noise ridge filling everything below it. y values are fractions of h measured from the top.
  ridge(o) {
    return canvasTex(o.w ?? 2048, o.h ?? 1024, (g, w, h) => {
      const f = fbm1(o.seed ?? 1, o.oct ?? 6);
      g.fillStyle = W;
      g.beginPath();
      g.moveTo(0, h);
      for (let x = 0; x <= w; x += 2) {
        const u = x / w;
        let y = o.base + (f(u * (o.freq ?? 4)) - 0.5) * 2 * o.amp;
        if (o.peaks) for (const p of o.peaks) y -= p.a * Math.exp(-Math.pow((u - p.x) / p.s, 2));
        g.lineTo(x, y * h);
      }
      g.lineTo(w, h);
      g.closePath();
      g.fill();
      if (o.after) o.after(g, w, h, f);
    });
  },
  // Taihang-style escarpments: steep faces alternating with long tilted slopes
  cliffs(o) {
    return canvasTex(o.w ?? 2048, o.h ?? 1024, (g, w, h) => {
      const r = rng(o.seed ?? 3);
      const f = fbm1((o.seed ?? 3) + 7, 6);
      const pts = [];
      let x = 0,
        y = o.base + (r() - 0.5) * o.amp;
      pts.push([0, y]);
      while (x < 1.05) {
        const steep = r() < 0.45;
        const dx = steep ? 0.004 + r() * 0.012 : 0.04 + r() * 0.12;
        const dy = steep ? (r() - 0.5) * 2 * o.amp * 1.1 : (r() - 0.5) * o.amp * 0.5;
        x += dx;
        y = clamp(y + dy, o.base - o.amp, o.base + o.amp);
        pts.push([x, y]);
      }
      const at = (u) => {
        for (let i = 1; i < pts.length; i++)
          if (pts[i][0] >= u) {
            const [x0, y0] = pts[i - 1],
              [x1, y1] = pts[i];
            return y0 + (y1 - y0) * ((u - x0) / (x1 - x0 || 1));
          }
        return pts[pts.length - 1][1];
      };
      g.fillStyle = W;
      g.beginPath();
      g.moveTo(0, h);
      for (let px = 0; px <= w; px += 2) {
        const u = px / w;
        g.lineTo(px, (at(u) + (f(u * 40) - 0.5) * 0.012) * h);
      }
      g.lineTo(w, h);
      g.closePath();
      g.fill();
      g.globalCompositeOperation = "destination-out";
      for (let i = 0; i < (o.crevices ?? 30); i++) {
        const u = r(),
          top = at(u) + 0.02 + r() * 0.1;
        g.fillRect(u * w, top * h, 1.5 + r() * 2, 20 + r() * 90);
      }
      g.globalCompositeOperation = "source-over";
    });
  },
  // rows of A-frame tents on a slope, grouped in company streets with gaps
  tents(o) {
    return canvasTex(o.w ?? 2048, o.h ?? 1024, (g, w, h) => {
      const r = rng(o.seed ?? 5);
      const f = fbm1(o.seed ?? 5, 4);
      g.fillStyle = W;
      const ground = (u) => o.base + (f(u * 2) - 0.5) * o.amp;
      g.beginPath();
      g.moveTo(0, h);
      for (let x = 0; x <= w; x += 4) g.lineTo(x, ground(x / w) * h);
      g.lineTo(w, h);
      g.fill();
      let u = r() * 0.05;
      while (u < 1.02) {
        const group = 2 + Math.floor(r() * (o.group ?? 6));
        for (let k = 0; k < group && u < 1.02; k++) {
          const s = (o.size ?? 0.06) * (0.7 + r() * 0.6);
          const x = u * w,
            y = ground(u) * h + 2 + (r() - 0.5) * s * w * 0.15;
          const tw = s * w,
            th = s * w * (0.55 + r() * 0.2);
          g.beginPath();
          g.moveTo(x - tw / 2, y);
          g.quadraticCurveTo(x - tw * 0.3, y - th * 0.55, x - tw * 0.06, y - th);
          g.lineTo(x + tw * 0.06, y - th);
          g.quadraticCurveTo(x + tw * 0.3, y - th * 0.55, x + tw / 2, y);
          g.closePath();
          g.fill();
          g.fillRect(x - 1.5, y - th - tw * 0.1, 3, tw * 0.1);
          if (r() < 0.6) {
            g.globalCompositeOperation = "destination-out";
            g.beginPath();
            g.moveTo(x + tw * 0.02, y);
            g.lineTo(x - tw * 0.03, y - th * 0.6);
            g.lineTo(x + tw * 0.12, y);
            g.fill();
            g.globalCompositeOperation = "source-over";
          }
          u += s * (1.05 + r() * 0.5);
        }
        u += (o.size ?? 0.06) * (1.5 + r() * 4);
      }
    });
  },
  // trench: sandbag parapet + duckboards from the side
  sandbags(o) {
    return canvasTex(o.w ?? 2048, o.h ?? 1024, (g, w, h) => {
      const r = rng(o.seed ?? 7);
      g.fillStyle = W;
      g.fillRect(0, o.top * h + (o.rows ?? 4) * 0.06 * h, w, h);
      for (let row = 0; row < (o.rows ?? 4); row++) {
        const y = o.top * h + row * 0.06 * h;
        let x = -r() * 120;
        while (x < w) {
          const bw = 110 + r() * 60;
          g.beginPath();
          g.ellipse(x + bw / 2, y + 0.03 * h, bw / 2 + 4, 0.034 * h, (r() - 0.5) * 0.12, 0, Math.PI * 2);
          g.fill();
          x += bw - 6;
        }
      }
    });
  },
  // barbed wire entanglement: stakes + coils, barbs sitting on the coils
  wire(o) {
    return canvasTex(o.w ?? 2048, o.h ?? 1024, (g, w, h) => {
      const r = rng(o.seed ?? 9);
      g.strokeStyle = W;
      g.fillStyle = W;
      const base = o.base * h;
      const n = o.stakes ?? 14;
      for (let i = 0; i < n; i++) {
        const x = (i + r() * 0.6) * (w / n);
        const sh = (0.1 + r() * 0.07) * h;
        const lean = (r() - 0.5) * 0.25;
        g.lineWidth = 7;
        g.beginPath();
        g.moveTo(x, base + 20);
        g.lineTo(x + lean * sh, base - sh);
        g.stroke();
      }
      const coil = (k, x) => {
        const ph = x * 0.045 + k * 2;
        return [x + Math.cos(ph) * 10, base - (0.03 + k * 0.035) * h + Math.sin(ph) * 0.022 * h * (0.6 + 0.4 * Math.sin(x * 0.003 + k))];
      };
      g.lineWidth = 2.2;
      for (let k = 0; k < 3; k++) {
        g.beginPath();
        for (let x = 0; x <= w; x += 3) g.lineTo(...coil(k, x));
        g.stroke();
      }
      g.lineWidth = 1.6;
      for (let k = 0; k < 3; k++)
        for (let x = 6; x < w; x += 16 + r() * 10) {
          const [px, py] = coil(k, x);
          g.beginPath();
          g.moveTo(px - 4, py - 4);
          g.lineTo(px + 4, py + 4);
          g.moveTo(px + 4, py - 4);
          g.lineTo(px - 4, py + 4);
          g.stroke();
        }
      g.fillRect(0, base, w, h - base);
    });
  },
  // shattered tree stumps
  stumps(o) {
    return canvasTex(o.w ?? 2048, o.h ?? 1024, (g, w, h) => {
      const r = rng(o.seed ?? 11);
      g.fillStyle = W;
      g.strokeStyle = W;
      const base = o.base * h;
      g.fillRect(0, base, w, h);
      for (let i = 0; i < (o.count ?? 6); i++) {
        const x = (0.05 + r() * 0.9) * w;
        const th = (0.15 + r() * 0.35) * h;
        const tw = 14 + r() * 26;
        g.beginPath();
        g.moveTo(x - tw, base + 4);
        g.lineTo(x - tw * 0.6, base - th * 0.7);
        g.lineTo(x - tw * 0.2, base - th);
        g.lineTo(x + tw * 0.05, base - th * 0.82);
        g.lineTo(x + tw * 0.3, base - th * 0.95);
        g.lineTo(x + tw * 0.55, base - th * 0.6);
        g.lineTo(x + tw, base + 4);
        g.fill();
        // a few broken branches
        for (let b = 0; b < 3; b++) {
          const by = base - th * (0.35 + r() * 0.45);
          const dir = r() < 0.5 ? -1 : 1;
          g.lineWidth = 4 + r() * 5;
          g.beginPath();
          g.moveTo(x, by);
          g.lineTo(x + dir * (30 + r() * 90), by - 20 - r() * 60);
          g.stroke();
        }
      }
    });
  },
  // shell craters: ground with elliptic bowls cut out as rims
  craters(o) {
    return canvasTex(o.w ?? 2048, o.h ?? 1024, (g, w, h) => {
      const r = rng(o.seed ?? 13);
      const f = fbm1(o.seed ?? 13, 4);
      g.fillStyle = W;
      g.beginPath();
      g.moveTo(0, h);
      for (let x = 0; x <= w; x += 4) {
        let y = o.base + (f(x / w * 6) - 0.5) * 0.03;
        g.lineTo(x, y * h);
      }
      g.lineTo(w, h);
      g.fill();
      for (let i = 0; i < (o.count ?? 9); i++) {
        const x = r() * w,
          y = (o.base + 0.02 + r() * (1 - o.base) * 0.7) * h;
        const rw = 60 + r() * 160;
        g.beginPath();
        g.ellipse(x, y - rw * 0.05, rw * 1.1, rw * 0.22, 0, Math.PI, 0);
        g.fill();
        g.globalCompositeOperation = "destination-out";
        g.beginPath();
        g.ellipse(x, y, rw * 0.85, rw * 0.13, 0, 0, Math.PI * 2);
        g.fill();
        g.globalCompositeOperation = "source-over";
      }
    });
  },
  // tall sorghum stalks with drooping heads; sway handled in shader by offsetting layers
  sorghum(o) {
    return canvasTex(o.w ?? 2048, o.h ?? 1024, (g, w, h) => {
      const r = rng(o.seed ?? 15);
      g.fillStyle = W;
      g.strokeStyle = W;
      const base = o.base * h;
      g.fillRect(0, base, w, h - base);
      const n = o.count ?? 220;
      for (let i = 0; i < n; i++) {
        const x = r() * w;
        const sh = (o.height ?? 0.35) * h * (0.75 + r() * 0.4);
        const lean = (r() - 0.5) * 0.15 + (o.lean ?? 0.05);
        const tx = x + lean * sh,
          ty = base - sh;
        g.lineWidth = 2 + r() * 2;
        g.beginPath();
        g.moveTo(x, base);
        g.quadraticCurveTo(x + lean * sh * 0.3, base - sh * 0.5, tx, ty);
        g.stroke();
        // leaves
        for (let k = 0; k < 4; k++) {
          const ly = base - sh * (0.2 + k * 0.17);
          const lx = x + lean * sh * (0.2 + k * 0.17);
          const d = r() < 0.5 ? -1 : 1;
          g.lineWidth = 2;
          g.beginPath();
          g.moveTo(lx, ly);
          g.quadraticCurveTo(lx + d * 30, ly - 22, lx + d * (50 + r() * 30), ly + 10 + r() * 10);
          g.stroke();
        }
        // grain head
        g.beginPath();
        g.ellipse(tx + 6, ty + 14, 7 + r() * 3, 20 + r() * 6, lean + 0.3, 0, Math.PI * 2);
        g.fill();
      }
    });
  },
  grass(o) {
    return canvasTex(o.w ?? 2048, o.h ?? 512, (g, w, h) => {
      const r = rng(o.seed ?? 17);
      g.strokeStyle = W;
      g.fillStyle = W;
      const base = o.base * h;
      g.fillRect(0, base, w, h - base);
      for (let i = 0; i < (o.count ?? 900); i++) {
        const x = r() * w,
          bh = (o.height ?? 0.4) * h * (0.3 + r() * 0.7);
        g.lineWidth = 1 + r() * 2.5;
        g.beginPath();
        g.moveTo(x, base + 2);
        g.quadraticCurveTo(x + (r() - 0.5) * 20, base - bh * 0.6, x + (r() - 0.3) * 40, base - bh);
        g.stroke();
      }
    });
  },
  // Chinese lattice window frame (white = wood), with paper panes cut away
  lattice(o) {
    return canvasTex(o.w ?? 1024, o.h ?? 1024, (g, w, h) => {
      g.fillStyle = W;
      g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = "destination-out";
      const m = o.frame ?? 0.07;
      const cols = o.cols ?? 4,
        rows = o.rows ?? 5,
        bar = o.bar ?? 0.012;
      const iw = w * (1 - 2 * m),
        ih = h * (1 - 2 * m);
      for (let i = 0; i < cols; i++)
        for (let j = 0; j < rows; j++) {
          const x = w * m + (i * iw) / cols + bar * w * 0.5,
            y = h * m + (j * ih) / rows + bar * h * 0.5;
          g.fillRect(x, y, iw / cols - bar * w, ih / rows - bar * h);
        }
      g.globalCompositeOperation = "source-over";
      if (o.ornament) {
        // corner fret ornaments
        g.lineWidth = bar * w * 0.6;
        g.strokeStyle = W;
        for (let i = 0; i < cols; i++)
          for (let j = 0; j < rows; j++) {
            const cx = w * m + ((i + 0.5) * iw) / cols,
              cy = h * m + ((j + 0.5) * ih) / rows;
            const s = Math.min(iw / cols, ih / rows) * 0.18;
            g.strokeRect(cx - s, cy - s, s * 2, s * 2);
          }
      }
    });
  },
  // western sash window with frame (white = frame), panes open
  sash(o) {
    return canvasTex(o.w ?? 1024, o.h ?? 1024, (g, w, h) => {
      g.fillStyle = W;
      g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = "destination-out";
      const fx = 0.16 * w,
        fy = 0.12 * h,
        ww = w - 2 * fx,
        hh = h - 2 * fy;
      const bar = 0.018 * w;
      for (let i = 0; i < 2; i++)
        for (let j = 0; j < 3; j++) g.fillRect(fx + (i * ww) / 2 + bar / 2, fy + (j * hh) / 3 + bar / 2, ww / 2 - bar, hh / 3 - bar);
      g.globalCompositeOperation = "source-over";
    });
  },
  // a solid rectangle sheet (e.g. a wall), optionally with an arch cut (cave) or window hole
  sheet(o) {
    return canvasTex(o.w ?? 1024, o.h ?? 1024, (g, w, h) => {
      g.fillStyle = W;
      g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = "destination-out";
      if (o.arch) {
        const [cx, cy, rw, rh] = o.arch;
        g.beginPath();
        g.moveTo((cx - rw) * w, h);
        g.lineTo((cx - rw) * w, cy * h);
        g.ellipse(cx * w, cy * h, rw * w, rh * h, 0, Math.PI, 0);
        g.lineTo((cx + rw) * w, h);
        g.fill();
      }
      if (o.hole) {
        const [x, y, hw, hh] = o.hole;
        g.fillRect(x * w, y * h, hw * w, hh * h);
      }
      g.globalCompositeOperation = "source-over";
    });
  },
  // grave markers row (crosses, steles, mounds) for the finale's paper cut-outs
  marker(kind) {
    return canvasTex(256, 384, (g, w, h) => {
      g.fillStyle = W;
      if (kind === 0) {
        g.fillRect(w * 0.42, h * 0.12, w * 0.16, h * 0.88);
        g.fillRect(w * 0.18, h * 0.3, w * 0.64, h * 0.11);
      } else if (kind === 1) {
        g.beginPath();
        g.moveTo(w * 0.2, h);
        g.lineTo(w * 0.2, h * 0.32);
        g.quadraticCurveTo(w * 0.5, h * 0.14, w * 0.8, h * 0.32);
        g.lineTo(w * 0.8, h);
        g.fill();
      } else if (kind === 2) {
        g.fillRect(w * 0.26, h * 0.22, w * 0.48, h * 0.78);
        g.fillRect(w * 0.18, h * 0.16, w * 0.64, h * 0.08);
      } else {
        g.beginPath();
        g.ellipse(w * 0.5, h, w * 0.48, h * 0.35, 0, Math.PI, 0);
        g.fill();
        g.fillRect(w * 0.44, h * 0.42, w * 0.12, h * 0.4);
      }
    });
  },
  // a letter / envelope cut-out for the falling letters
  envelope() {
    return canvasTex(256, 180, (g, w, h) => {
      g.fillStyle = "#efe6d3";
      g.fillRect(0, 0, w, h);
      g.strokeStyle = "rgba(90,70,50,.45)";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(w / 2, h * 0.55);
      g.lineTo(w, 0);
      g.stroke();
      g.fillStyle = "rgba(60,40,30,.35)";
      for (let i = 0; i < 4; i++) g.fillRect(w * 0.3, h * (0.68 + i * 0.07), w * (0.35 - i * 0.05), 3);
    });
  },
};

// ---------------------------------------------------------------- lit sheet (paper / cloth / wall) with ink overlay
export function sheetMaterial(o = {}) {
  const u = {
    uInk: { value: o.ink || null },
    uHasInk: { value: o.ink ? 1 : 0 },
    uPaper: { value: new THREE.Color(o.paper ?? 0xe6dac0) },
    uInkColor: { value: new THREE.Color(o.inkColor ?? 0x1a120c) },
    uLight: { value: new THREE.Color(o.light ?? 0xffb25a) },
    uLightPos: { value: new THREE.Vector2(...(o.lightPos || [0.1, 0.9])) },
    uLightAmt: { value: o.lightAmt ?? 1.0 },
    uLightFall: { value: o.lightFall ?? 1.5 },
    uAmbient: { value: o.ambient ?? 0.12 },
    uAspect: { value: o.aspect ?? 1.4 },
    uFiber: { value: o.fiber ?? 0.06 },
    uWeave: { value: o.weave ?? 0.0 }, // cloth weave for the handkerchief / tent canvas
    uAge: { value: o.age ?? 0.35 },
    uFolds: { value: o.folds ?? 1.0 },
    uDeckle: { value: o.deckle ?? 1.0 },
    uShadow: { value: o.shadowMap || null },
    uHasShadow: { value: o.shadowMap ? 1 : 0 },
    uShadowXf: { value: new THREE.Vector4(...(o.shadowXf || [0.5, 0.45, 1.0, 1.0])) }, // cx, cy, sx, sy in uv
    uShadowAmt: { value: o.shadowAmt ?? 0.8 },
    uShadowFlip: { value: o.shadowFlip ? 1 : 0 },
    uBurn: { value: -1.0 },
    uFlick: { value: 1.0 },
    uTime: { value: 0 },
    uStripes: { value: new THREE.Vector4(0, 0, 0, 0) }, // train-slat light: amount, period, phase, angle
    uWet: { value: 0 },
    uGrid: { value: o.grid || null },
    uHasGrid: { value: o.grid ? 1 : 0 },
    uGridColor: { value: new THREE.Color(o.gridColor ?? 0xb8504a) },
    uPencil: { value: o.pencil ?? 0 },
  };
  return new THREE.ShaderMaterial({
    uniforms: u,
    transparent: true,
    depthWrite: false,
    extensions: { derivatives: true },
    vertexShader: /* glsl */ `varying vec2 vUv; varying vec3 vWorld;
      void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.); vWorld=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */ `
      ${GLSL}
      varying vec2 vUv; varying vec3 vWorld;
      uniform sampler2D uInk, uShadow, uGrid; uniform float uHasInk, uHasShadow, uShadowFlip, uHasGrid, uPencil; uniform vec3 uGridColor;
      uniform vec3 uPaper, uInkColor, uLight; uniform vec2 uLightPos; uniform vec4 uShadowXf, uStripes;
      uniform float uLightAmt, uLightFall, uAmbient, uAspect, uFiber, uWeave, uAge, uFolds, uDeckle, uShadowAmt, uBurn, uFlick, uTime, uWet;
      void main(){
        vec2 q=vec2(vUv.x*uAspect,vUv.y);
        // deckled edge
        float edgeN=fbm(q*18.)*.018*uDeckle;
        float bx=min(vUv.x,1.-vUv.x)*uAspect, by=min(vUv.y,1.-vUv.y);
        float border=min(bx,by);
        if(uDeckle>0. && border<edgeN) discard;
        float fib=(fbm(q*90.)-.5)*uFiber*2. + (vnoise(q*600.)-.5)*uFiber;
        float weave=0.;
        if(uWeave>0.){ vec2 wv=q*vec2(260.,260.); weave=(sin(wv.x)*.5+.5)*(sin(wv.y)*.5+.5); weave=(weave-.25)*uWeave; }
        vec3 paper=uPaper*(1.+fib+weave);
        // ageing: darker towards edges + foxing stains
        float ageEdge=1.-smoothstep(0.,.18,border);
        paper*=1.-uAge*.35*ageEdge;
        float fox=smoothstep(.72,.9,fbm(q*7.+3.))*uAge*.18; paper*=1.-fox;
        // folds: one vertical and two horizontal creases
        if(uFolds>0.){
          float c1=1.-smoothstep(0.,.004,abs(vUv.y-.333)); float c2=1.-smoothstep(0.,.004,abs(vUv.y-.666)); float c3=1.-smoothstep(0.,.003,abs(vUv.x-.5));
          paper*=1.-.08*uFolds*(c1+c2+c3);
          paper*=1.+.03*uFolds*sign(vUv.y-.333)*smoothstep(.06,0.,abs(vUv.y-.333));
        }
        vec3 col=paper;
        if(uHasGrid>.5){ col=mix(col,uGridColor,texture2D(uGrid,vUv).a*.75); }
        if(uHasInk>.5){
          vec4 ink=texture2D(uInk,vUv);
          float a=ink.a;
          if(uPencil>0.) a*=1.-uPencil*(.55*vnoise(q*900.)+.25*vnoise(q*260.));
          vec3 ic=uInkColor*(.85+.3*vnoise(q*40.));
          col=mix(col,ic,a*.94);
        }
        if(uHasShadow>.5){
          vec2 su=(vUv-uShadowXf.xy)/uShadowXf.zw+.5;
          if(uShadowFlip>.5) su.x=1.-su.x;
          float s=0.;
          if(su.x>0.&&su.x<1.&&su.y>0.&&su.y<1.) s=texture2D(uShadow,su).a;
          col*=1.-s*uShadowAmt;
        }
        float d=distance(q,vec2(uLightPos.x*uAspect,uLightPos.y));
        float lit=uLightAmt*exp(-d*d*uLightFall)*uFlick;
        if(uStripes.x>0.){
          float s=fract((vUv.x*cos(uStripes.w)+vUv.y*sin(uStripes.w))*uStripes.y+uStripes.z);
          float band=smoothstep(.0,.04,s)*smoothstep(.22,.16,s);
          lit+=uStripes.x*band;
        }
        col*= uAmbient + uLight*lit;
        col*= 1.-uWet*.25*fbm(q*30.+vec2(0.,uTime*.4));
        if(uBurn>-.5){
          float n=fbm(q*3.)*.7+vnoise(q*14.)*.3; n+= (1.-border*3.)*.25;
          float e=n-uBurn; if(e<0.) discard;
          col=mix(col,vec3(.03,.02,.01),1.-smoothstep(0.,.07,e));
          col+=vec3(1.,.42,.08)*(1.-smoothstep(0.,.02,e))*2.5;
        }
        gl_FragColor=vec4(col,1.);
      }`,
  });
}

// ---------------------------------------------------------------- handwriting
// lines: [{text, start, end}] with times local to the shot; the text appears glyph by glyph over [start,end].
export class Hand {
  constructor(o) {
    this.o = Object.assign({ w: 2048, h: 1440, size: 64, lineGap: 1.55, margin: [0.12, 0.14], color: "#000", vertical: false, jitter: 0.04 }, o);
    const c = document.createElement("canvas");
    c.width = this.o.w;
    c.height = this.o.h;
    this.c = c;
    this.g = c.getContext("2d");
    this.tex = new THREE.CanvasTexture(c);
    this.tex.colorSpace = THREE.NoColorSpace;
    this.tex.anisotropy = 4;
    this.r = rng(this.o.seed ?? 77);
    this.layout();
    this.last = -1;
  }
  layout() {
    const { g, o } = this;
    g.font = `${o.size}px ${o.font}`;
    this.glyphs = [];
    const jit = rng(o.seed ?? 77);
    if (!o.vertical) {
      let y = o.h * o.margin[1] + o.size;
      const maxW = o.w * (1 - 2 * o.margin[0]);
      for (const [li, line] of o.lines.entries()) {
        // word wrap
        // Latin wraps on spaces; CJK has none, so it wraps on any character
        const words = /\s/.test(line.text.trim()) ? line.text.split(" ") : Array.from(line.text);
        const sep = /\s/.test(line.text.trim()) ? " " : "";
        let x = o.w * o.margin[0] + (line.indent ?? 0) * o.size;
        const startIdx = this.glyphs.length;
        for (const word of words) {
          const ww = g.measureText(word + sep).width;
          if (x + ww > o.w * o.margin[0] + maxW && x > o.w * o.margin[0] + 1) {
            x = o.w * o.margin[0];
            y += o.size * o.lineGap;
          }
          for (const ch of word + sep) {
            const cw = g.measureText(ch).width;
            this.glyphs.push({ ch, x, y: y + (jit() - 0.5) * o.size * o.jitter, w: cw, line: li, rot: (jit() - 0.5) * 0.03 });
            x += cw;
          }
        }
        this._assign(startIdx, line);
        y += o.size * o.lineGap * (line.gapAfter ?? 1);
      }
    } else {
      // vertical, columns right → left
      const colW = o.size * o.lineGap;
      let x = o.w * (1 - o.margin[0]) - o.size;
      const top = o.h * o.margin[1],
        bot = o.h * (1 - o.margin[1]);
      for (const [li, line] of o.lines.entries()) {
        let y = top + o.size;
        const startIdx = this.glyphs.length;
        for (const ch of line.text) {
          if (y > bot) {
            y = top + o.size;
            x -= colW;
          }
          const s = o.size * (0.92 + jit() * 0.16);
          this.glyphs.push({ ch, x: x + (jit() - 0.5) * o.size * o.jitter * 2, y, w: o.size, s, line: li, rot: (jit() - 0.5) * 0.06 });
          y += o.size * (ch.match(/[，。！？；：、]/) ? 0.75 : 1.08);
        }
        this._assign(startIdx, line);
        x -= colW * (line.gapAfter ?? 1);
        if (line.newColumn !== false) {
          /* each line starts a new column */
        }
      }
    }
  }
  _assign(i0, line) {
    const gl = this.glyphs.slice(i0);
    const n = gl.filter((q) => q.ch.trim()).length || 1;
    let k = 0;
    for (const q of gl) {
      if (!q.ch.trim()) {
        q.t0 = q.t1 = line.start + ((k + 0.5) / n) * (line.end - line.start);
        continue;
      }
      q.t0 = line.start + (k / n) * (line.end - line.start);
      q.t1 = line.start + ((k + 1) / n) * (line.end - line.start);
      k++;
    }
  }
  // draw state at local time t (only re-draws when visible state changes)
  draw(t) {
    const key = Math.round(t * 24);
    if (key === this.last) return;
    this.last = key;
    const { g, o } = this;
    g.clearRect(0, 0, o.w, o.h);
    g.fillStyle = o.color;
    g.textBaseline = "alphabetic";
    for (const q of this.glyphs) {
      if (t <= q.t0) continue;
      const p = clamp((t - q.t0) / Math.max(q.t1 - q.t0, 1e-3));
      g.save();
      const s = q.s ?? o.size;
      g.font = `${s}px ${o.font}`;
      g.translate(q.x, q.y);
      g.rotate(q.rot);
      if (p < 1) {
        g.beginPath();
        if (o.vertical) g.rect(-s * 0.2, -s * 1.1, s * 1.5, s * 1.25 * p + 2);
        else g.rect(-4, -s * 1.4, (q.w + 8) * p + 1, s * 2.2);
        g.clip();
      }
      // ink load: fresher ink is a touch darker
      g.globalAlpha = 0.86 + 0.14 * Math.exp(-(t - q.t1) * 0.6);
      // words carried off by the wind: after a while they drift right and dissolve
      if (o.fade) {
        const age = t - q.t1 - o.fade.after;
        if (age > 0) {
          const f = clamp(age / o.fade.dur);
          if (f >= 1) {
            g.restore();
            continue;
          }
          g.globalAlpha *= 1 - f;
          g.translate(o.fade.drift * f * f, -o.fade.rise * f);
        }
      }
      if (o.bleed) {
        g.shadowColor = o.color;
        g.shadowBlur = o.bleed;
      }
      g.fillText(q.ch, 0, 0);
      g.restore();
    }
    if (o.blots)
      for (const b of o.blots) {
        if (t < b.t) continue;
        const k = clamp((t - b.t) / 1.2);
        const rad = b.r * (0.3 + 0.7 * Math.sqrt(k));
        const gr = g.createRadialGradient(b.x * o.w, b.y * o.h, 0, b.x * o.w, b.y * o.h, rad);
        gr.addColorStop(0, "rgba(0,0,0,0.0)");
        gr.addColorStop(0.75, "rgba(0,0,0,0.10)");
        gr.addColorStop(0.95, "rgba(0,0,0,0.22)");
        gr.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = gr;
        g.beginPath();
        g.arc(b.x * o.w, b.y * o.h, rad, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = o.color;
      }
    this.tex.needsUpdate = true;
  }
}

// static text drawn once onto a canvas texture (titles, calligraphy, photos' captions)
export function textTex(o) {
  return canvasTex(o.w ?? 1024, o.h ?? 512, (g, w, h) => {
    g.fillStyle = o.color ?? "#000";
    g.font = `${o.weight ?? ""} ${o.size}px ${o.font}`;
    g.textAlign = o.align ?? "center";
    g.textBaseline = "middle";
    if (o.vertical) {
      let y = h * 0.5 - ((o.text.length - 1) * o.size * 1.05) / 2;
      for (const ch of o.text) {
        g.fillText(ch, w / 2, y);
        y += o.size * 1.05;
      }
    } else g.fillText(o.text, w / 2, h / 2);
  });
}

// ---------------------------------------------------------------- stroke-order handwriting (Hanzi Writer stroke data)
// Every character is written stroke by stroke in its real order: each stroke is revealed along its median,
// clipped to the stroke outline. Punctuation (no stroke data) is set in a font when its turn comes.
const PATHS = {};
function strokesOf(ch) {
  if (!HANZI[ch]) return null;
  if (!PATHS[ch]) {
    PATHS[ch] = HANZI[ch].s.map((d, i) => {
      const med = HANZI[ch].m[i];
      let L = 0;
      const cum = [0];
      for (let k = 1; k < med.length; k++) {
        L += Math.hypot(med[k][0] - med[k - 1][0], med[k][1] - med[k - 1][1]);
        cum.push(L);
      }
      return { path: new Path2D(d), med, cum, len: Math.max(L, 1) };
    });
  }
  return PATHS[ch];
}

export class StrokeHand {
  // o: {w,h, lines:[{text,start,end}], size, vertical, lineGap, margin:[x,y], color, bleed, brush (median width, data units),
  //     grid: cell size in px for a copybook (horizontal), cols, seed, punctFont}
  constructor(o) {
    this.o = Object.assign({ w: 2048, h: 1440, size: 120, lineGap: 1.3, margin: [0.1, 0.1], color: "#000", vertical: false, brush: 150, jitter: 0.02, punctFont: FONTS.kai }, o);
    const c = document.createElement("canvas");
    c.width = this.o.w;
    c.height = this.o.h;
    this.c = c;
    this.g = c.getContext("2d");
    this.tex = new THREE.CanvasTexture(c);
    this.tex.colorSpace = THREE.NoColorSpace;
    this.tex.anisotropy = 4;
    this.layout();
    this.last = -1;
  }
  layout() {
    const o = this.o;
    const r = rng(o.seed ?? 5);
    this.glyphs = [];
    const s = o.size;
    let col = 0,
      row = 0;
    const cell = o.grid ?? s * 1.08;
    const cols = o.cols ?? Math.floor((o.w * (1 - 2 * o.margin[0])) / cell);
    const rows = o.rows ?? Math.floor((o.h * (1 - 2 * o.margin[1])) / cell);
    for (const [li, line] of o.lines.entries()) {
      const chars = Array.from(line.text);
      const i0 = this.glyphs.length;
      for (const ch of chars) {
        let x, y;
        if (o.vertical) {
          if (row >= rows) {
            row = 0;
            col++;
          }
          x = o.w * (1 - o.margin[0]) - (col + 1) * s * o.lineGap + (s * o.lineGap - s) / 2;
          y = o.h * o.margin[1] + row * cell;
        } else {
          if (col >= cols) {
            col = 0;
            row++;
          }
          x = o.w * o.margin[0] + col * cell + (cell - s) / 2;
          y = o.h * o.margin[1] + row * cell * (o.grid ? 1 : o.lineGap) + (cell - s) / 2;
        }
        const k = 0.94 + r() * 0.1;
        this.glyphs.push({ ch, x: x + (r() - 0.5) * s * o.jitter, y: y + (r() - 0.5) * s * o.jitter, s: s * k, rot: (r() - 0.5) * 0.04 });
        if (o.vertical) row++;
        else col++;
      }
      // each spoken line starts a fresh column / row
      if (o.vertical) {
        row = 0;
        col++;
      } else {
        col = 0;
        row++;
      }
      const gl = this.glyphs.slice(i0);
      const weight = (q) => (/[，。！？；：、…“”]/.test(q.ch) ? 0.35 : 1);
      const W = gl.reduce((a, q) => a + weight(q), 0) || 1;
      let acc = 0;
      for (const q of gl) {
        q.t0 = line.start + (acc / W) * (line.end - line.start);
        acc += weight(q);
        q.t1 = line.start + (acc / W) * (line.end - line.start);
      }
    }
  }
  _glyph(q, p) {
    const { g, o } = this;
    const st = strokesOf(q.ch);
    const k = q.s / 1024;
    g.save();
    g.translate(q.x + q.s / 2, q.y + q.s / 2);
    g.rotate(q.rot);
    g.translate(-q.s / 2, -q.s / 2);
    if (!st && o.font && !/[，。！？；：、…“”]/.test(q.ch)) {
      g.save();
      g.beginPath();
      g.rect(-q.s * 0.2, -q.s * 0.2, q.s * 1.4, q.s * 1.4 * p);
      g.clip();
      g.font = `${q.s}px ${o.font}`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(q.ch, q.s / 2, q.s / 2);
      g.restore();
      g.restore();
      return;
    }
    if (!st) {
      g.font = `${q.s * 0.8}px ${o.font || o.punctFont}`;
      g.textBaseline = "middle";
      g.globalAlpha = p > 0 ? 1 : 0;
      g.fillText(q.ch, q.s * 0.1, q.s * 0.5);
      g.restore();
      return;
    }
    const total = st.reduce((a, s) => a + s.len + 220, 0);
    let budget = p * total;
    if (o.font) {
      // a real brush / handwriting glyph, revealed through masks laid along the true strokes, in order
      const pad = Math.ceil(q.s * 0.2);
      const size = Math.ceil(q.s + pad * 2);
      if (!this.scratch || this.scratch.width < size) {
        this.scratch = document.createElement("canvas");
        this.scratch.width = this.scratch.height = size;
      }
      const sc = this.scratch.getContext("2d", { willReadFrequently: true });
      sc.setTransform(1, 0, 0, 1, 0, 0);
      sc.clearRect(0, 0, this.scratch.width, this.scratch.height);
      sc.fillStyle = o.color;
      sc.font = `${q.s * (o.fontScale ?? 1.0)}px ${o.font}`;
      sc.textAlign = "center";
      sc.textBaseline = "middle";
      sc.fillText(q.ch, pad + q.s / 2, pad + q.s / 2 + q.s * (o.fontDy ?? 0.04));
      if (p < 1) {
        // the same reveal as the Western letters: the character comes in along the writing direction
        // (top → bottom in vertical columns, left → right in rows) behind a soft edge
        const soft = q.s * 0.14;
        const e = pad - soft + (q.s + soft * 2) * p;
        const gr = o.vertical ? sc.createLinearGradient(0, e - soft, 0, e) : sc.createLinearGradient(e - soft, 0, e, 0);
        gr.addColorStop(0, "rgba(0,0,0,1)");
        gr.addColorStop(1, "rgba(0,0,0,0)");
        sc.setTransform(1, 0, 0, 1, 0, 0);
        sc.globalCompositeOperation = "destination-in";
        sc.fillStyle = gr;
        sc.fillRect(0, 0, size, size);
        sc.globalCompositeOperation = "source-over";
        sc.fillStyle = o.color;
      }
      g.drawImage(this.scratch, -pad, -pad);
      g.restore();
      return;
    }
    if (o.pen) {
      // hard pen (pencil / fountain pen): a thin line along each stroke's centreline, written in order
      g.save();
      g.transform(k, 0, 0, -k, 0, 900 * k);
      g.lineWidth = o.pen;
      g.lineCap = "round";
      g.lineJoin = "round";
      for (const s of st) {
        if (budget <= 0) break;
        const L = Math.min(budget, s.len);
        g.beginPath();
        g.moveTo(s.med[0][0], s.med[0][1]);
        for (let i = 1; i < s.med.length; i++) {
          if (s.cum[i] <= L) g.lineTo(s.med[i][0], s.med[i][1]);
          else {
            const f = (L - s.cum[i - 1]) / (s.cum[i] - s.cum[i - 1]);
            g.lineTo(s.med[i - 1][0] + (s.med[i][0] - s.med[i - 1][0]) * f, s.med[i - 1][1] + (s.med[i][1] - s.med[i - 1][1]) * f);
            break;
          }
        }
        g.stroke();
        budget -= s.len + 220;
      }
      g.restore();
      g.restore();
      return;
    }
    for (const s of st) {
      const need = s.len + 220; // the extra is the pen lifting between strokes
      if (budget <= 0) break;
      if (budget >= need && !o.dry) {
        // finished stroke: its full (bold) shape
        g.save();
        g.transform(k, 0, 0, -k, 0, 900 * k);
        g.fill(s.path);
        if (o.bold) {
          g.lineWidth = o.bold;
          g.miterLimit = o.miter ?? 10;
          g.lineJoin = o.join ?? "round";
          g.stroke(s.path);
        }
        g.restore();
      } else {
        // the stroke being written: the same bold shape, revealed along its median, so its weight never jumps
        const L = Math.min(budget, s.len);
        const pad = Math.ceil(q.s * 0.15);
        const size = Math.ceil(q.s + pad * 2);
        if (!this.scratch || this.scratch.width < size) {
          this.scratch = document.createElement("canvas");
          this.scratch.width = this.scratch.height = size;
        }
        const sc = this.scratch.getContext("2d", { willReadFrequently: true });
        sc.setTransform(1, 0, 0, 1, 0, 0);
        sc.clearRect(0, 0, this.scratch.width, this.scratch.height);
        sc.setTransform(k, 0, 0, -k, pad, pad + 900 * k);
        sc.fillStyle = sc.strokeStyle = o.color;
        sc.fill(s.path);
        if (o.bold) {
          sc.lineWidth = o.bold;
          sc.miterLimit = o.miter ?? 10;
          sc.lineJoin = o.join ?? "round";
          sc.stroke(s.path);
        }
        if (o.dry) this._dry(sc, s, q.ch.charCodeAt(0) * 31 + st.indexOf(s));
        if (L >= s.len) {
          // (dry-brush mode routes finished strokes through here too, so the streaks stay inside each stroke)
          sc.setTransform(1, 0, 0, 1, 0, 0);
          g.drawImage(this.scratch, -pad, -pad);
          budget -= need;
          continue;
        }
        sc.globalCompositeOperation = "destination-in";
        sc.lineWidth = o.brush + (o.bold || 0) * 2;
        sc.lineCap = "round";
        sc.lineJoin = "round";
        sc.beginPath();
        sc.moveTo(s.med[0][0], s.med[0][1]);
        for (let i = 1; i < s.med.length; i++) {
          if (s.cum[i] <= L) sc.lineTo(s.med[i][0], s.med[i][1]);
          else {
            const f = (L - s.cum[i - 1]) / (s.cum[i] - s.cum[i - 1]);
            sc.lineTo(s.med[i - 1][0] + (s.med[i][0] - s.med[i - 1][0]) * f, s.med[i - 1][1] + (s.med[i][1] - s.med[i - 1][1]) * f);
            break;
          }
        }
        sc.stroke();
        sc.globalCompositeOperation = "source-over";
        g.drawImage(this.scratch, -pad, -pad);
      }
      budget -= need;
    }
    g.restore();
  }

  // dry brush (飞白): toward the end of a longer stroke the brush runs short of ink and the hairs separate —
  // thin streaks along the stroke's own direction, cut out of the ink of this stroke only
  _dry(sc, s, seed) {
    if (s.len < 160) return;
    const r = rng(seed);
    const at = (u) => {
      let i = 1;
      while (i < s.cum.length - 1 && s.cum[i] < u) i++;
      const a = s.med[i - 1], b = s.med[i];
      const f = (u - s.cum[i - 1]) / (s.cum[i] - s.cum[i - 1] || 1);
      const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      return [a[0] + dx * f, a[1] + dy * f, -dy / l, dx / l];
    };
    sc.save();
    sc.globalCompositeOperation = "destination-out";
    sc.lineCap = "round";
    const n = 3 + Math.floor(r() * 4);
    for (let j = 0; j < n; j++) {
      const off = (r() - 0.5) * (this.o.dryW ?? 64);
      const u0 = s.len * (0.45 + r() * 0.3), u1 = s.len * (0.9 + r() * 0.12);
      sc.lineWidth = 2 + r() * 4;
      sc.globalAlpha = 0.45 + r() * 0.5;
      sc.beginPath();
      for (let u = u0; u <= u1; u += 6) {
        const [x, y, nx, ny] = at(Math.min(u, s.len));
        // the streak opens up as the brush dries
        const d = off * (0.6 + 0.4 * (u - u0) / (u1 - u0 || 1));
        u === u0 ? sc.moveTo(x + nx * d, y + ny * d) : sc.lineTo(x + nx * d, y + ny * d);
      }
      sc.stroke();
    }
    sc.restore();
  }
  draw(t) {
    const key = Math.round(t * 240);
    if (key === this.last) return;
    this.last = key;
    const { g, o } = this;
    g.clearRect(0, 0, o.w, o.h);
    g.fillStyle = o.color;
    g.strokeStyle = o.color;
    if (o.bleed) {
      g.shadowColor = o.color;
      g.shadowBlur = o.bleed;
    }
    for (const q of this.glyphs) {
      if (t <= q.t0) continue;
      this._glyph(q, clamp((t - q.t0) / Math.max(q.t1 - q.t0, 1e-3)));
    }
    if (o.blots)
      for (const b of o.blots) {
        if (t < b.t) continue;
        const kk = clamp((t - b.t) / 2.2);
        const rad = b.r * (1 - Math.pow(1 - kk, 3)) + 0.5;
        const gr = g.createRadialGradient(b.x * o.w, b.y * o.h, 0, b.x * o.w, b.y * o.h, rad);
        gr.addColorStop(0, "rgba(0,0,0,0.0)");
        gr.addColorStop(0.75, "rgba(0,0,0,0.08)");
        gr.addColorStop(0.95, "rgba(0,0,0,0.2)");
        gr.addColorStop(1, "rgba(0,0,0,0)");
        g.save();
        g.globalAlpha = Math.min(1, kk * 3);
        g.shadowBlur = 0;
        g.fillStyle = gr;
        g.beginPath();
        g.arc(b.x * o.w, b.y * o.h, rad, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
    this.tex.needsUpdate = true;
  }
  // pen position (canvas px) at time t, for cameras that follow the writing
  penAt(t) {
    const G = this.glyphs;
    if (!G.length) return [this.o.w / 2, this.o.h / 2];
    let i = 0;
    while (i + 1 < G.length && G[i + 1].t0 <= t) i++;
    const q = G[i],
      n = G[Math.min(i + 1, G.length - 1)];
    const f = clamp((t - q.t0) / Math.max(q.t1 - q.t0, 1e-3));
    const c = (g) => [g.x + g.s / 2, g.y + g.s / 2];
    const [ax, ay] = c(q),
      [bx, by] = c(n);
    // continuous everywhere, the jump to a new column too (eased, so it starts and lands gently)
    const e = Math.hypot(bx - ax, by - ay) > q.s * 2.5 ? f * f * (3 - 2 * f) : f;
    return [ax + (bx - ax) * e, ay + (by - ay) * e];
  }
  // the pen, smoothed over a window of seconds (Gaussian), for a camera that follows the writing without steps
  penSmooth(t, win = 1.6, n = 0) {
    n = n || Math.ceil(win * 2 * 24) + 1; // one sample per film frame: no steps from the sampling itself
    let x = 0, y = 0, w = 0;
    for (let k = 0; k < n; k++) {
      const u = (k / (n - 1)) * 2 - 1;
      const wt = Math.exp(-u * u * 2.5);
      const [px, py] = this.penAt(t - win * 0.6 + u * win);
      x += px * wt;
      y += py * wt;
      w += wt;
    }
    return [x / w, y / w];
  }
}

// ranks of figures: a silhouette tiled across a wide strip, at varied scale and spacing, standing on a common ground line
export function armyTex(names, o = {}) {
  const list = Array.isArray(names) ? names : [names];
  return canvasTex(o.w ?? 4096, o.h ?? 768, (g, w, h) => {
    const r = rng(o.seed ?? 3);
    const base = (o.base ?? 0.92) * h;
    g.fillStyle = "#fff";
    g.fillRect(0, base - 2, w, h - base + 2);
    let x = -r() * 200;
    while (x < w) {
      const img = SIL[list[Math.floor(r() * list.length)]].image;
      const hh = (o.height ?? 0.7) * h * (0.85 + r() * 0.3);
      const ww = hh * (img.width / img.height);
      g.drawImage(img, x, base - hh, ww, hh);
      x += ww * (o.step ?? 0.92) + (o.gap ?? 0.15) * ww * r();
    }
  });
}
