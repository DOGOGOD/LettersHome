import os
os.chdir(os.path.join(os.path.dirname(__file__), "..", "..", "film", "lib"))


def patch(path, pairs):
    s = open(path, encoding="utf-8").read()
    for a, b in pairs:
        if a not in s:
            print("MISSING in", path, ":", a[:90])
            continue
        s = s.replace(a, b)
    open(path, "w", encoding="utf-8").write(s)


def replace_block(path, start_marker, end_marker, new):
    s = open(path, encoding="utf-8").read()
    a = s.index(start_marker)
    b = s.index(end_marker)
    s = s[:a] + new + s[b:]
    open(path, "w", encoding="utf-8").write(s)


# glow: fade to zero before the quad edge
patch("world.js", [(
    "          gl_FragColor=vec4(uColor*c*uAmt + vec3(1.)*exp(-d*d*600.)*uCore*uAmt, 1.); }`,",
    "          float edge=smoothstep(.5,.3,d);\n          gl_FragColor=vec4((uColor*c*uAmt + vec3(1.)*exp(-d*d*600.)*uCore*uAmt)*edge, 1.); }`,",
)])

# tents: company streets — clusters with gaps, varied size and height
replace_block("kit.js", "  // rows of A-frame tents on a slope", "  // trench: sandbag parapet", '''  // rows of A-frame tents on a slope, grouped in company streets with gaps
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
''')

# cliffs: piecewise ridge mixing steep faces and slopes, with fbm detail
replace_block("kit.js", "  // Taihang-style mesas", "  // rows of A-frame tents", '''  // Taihang-style escarpments: steep faces alternating with long tilted slopes
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
''')

patch("shots_common.js", [
    ("cfg.zFrom ?? (vertical ? H * 1.08 : Wd * 0.88), cfg.zTo ?? (vertical ? H * 0.98 : Wd * 0.8)",
     "cfg.zFrom ?? (vertical ? H * 1.25 : Wd * 1.0), cfg.zTo ?? (vertical ? H * 1.12 : Wd * 0.92)"),
])
patch("shots_a.js", [
    ("      { z: -50, count: 70, size: 0.016, base: 0.55, tone: 0x8a6650, fog: 0.42 },\n", ""),
    ("      { z: -34, count: 38, size: 0.026, base: 0.6, tone: 0x6e4e3e, fog: 0.3 },", "      { z: -40, count: 38, size: 0.022, base: 0.58, tone: 0x7a5a48, fog: 0.36, group: 9 },"),
    ("      { z: -20, count: 16, size: 0.05, base: 0.66, tone: 0x4a3328, fog: 0.17 },", "      { z: -22, count: 16, size: 0.042, base: 0.64, tone: 0x4a3328, fog: 0.17, group: 6 },"),
    ("      { z: -9, count: 14, size: 0.11, base: 0.74, tone: 0x2a1c16, fog: 0.06 },", "      { z: -9, count: 5, size: 0.1, base: 0.74, tone: 0x2a1c16, fog: 0.06, group: 3 },"),
    ("      { z: -9, count: 5, size: 0.11, base: 0.74, tone: 0x2a1c16, fog: 0.06 },", "      { z: -9, count: 5, size: 0.1, base: 0.74, tone: 0x2a1c16, fog: 0.06, group: 3 },"),
    ("tex: P.tents({ count: d.count, size: d.size, base: d.base, amp: 0.05, seed: 40 + i })", "tex: P.tents({ size: d.size, base: d.base, amp: 0.05, seed: 40 + i, group: d.group })"),
    ("      const layer = 1 + Math.floor(r() * 3);", "      const layer = 1 + Math.floor(r() * 2);"),
])
patch("shots_b.js", [
    # no man's land: flare lights the sky behind dark silhouettes
    ("    const flare = st.glow({ x: 2, y: 3, z: -30, size: 9, color: 0xdcecff, amt: 1 });",
     "    const flare = st.glow({ x: 2, y: 3, z: -30, size: 7, color: 0xdcecff, amt: 1 });\n    const flareSky = st.glow({ x: 2, y: 3, z: -59, size: 70, core: 0, color: 0x6a7a8a, amt: 1 });"),
    ("      flare.position.set(fx, fy, -30);", "      flare.position.set(fx, fy, -30);\n      flareSky.position.set(fx * 2, fy * 1.6, -59);"),
    ("      flare.userData.u.uAmt.value = 1.1 * bright;", "      flare.userData.u.uAmt.value = 1.1 * bright;\n      flareSky.userData.u.uAmt.value = 0.9 * bright;"),
    ("tex: P.stumps({ base: 0.7, count: 7, seed: 92 }), z: -40, y: -1.8, tone: 0x0b1015, fog: 0.3,", "tex: P.stumps({ base: 0.7, count: 7, seed: 92 }), z: -40, y: -1.8, tone: 0x06090c, fog: 0.12,"),
    ("tex: P.wire({ base: 0.75, stakes: 22, seed: 93 }), z: -26, y: -2.3, tone: 0x080b0f, fog: 0.18,", "tex: P.wire({ base: 0.75, stakes: 22, seed: 93 }), z: -26, y: -2.3, tone: 0x05070a, fog: 0.06,"),
    ("tex: P.ridge({ base: 0.62, amp: 0.025, freq: 3, seed: 91 }), z: -60, y: -2.6, tone: 0x10161c, fog: 0.4,", "tex: P.ridge({ base: 0.62, amp: 0.025, freq: 3, seed: 91 }), z: -60, y: -2.6, tone: 0x0a0e12, fog: 0.2,"),
    # firing squad flashes smaller
    ("y: -1.02, z: -5.9, size: 1.3, color: 0xfff0c0 }));", "y: -1.02, z: -5.9, size: 0.9, color: 0xfff0c0 }));"),
    # boxcar seams subtle
    ("const wallMat = sheetMaterial({ ink: boards, inkColor: 0x0a0705,", "const wallMat = sheetMaterial({ ink: boards, inkColor: 0x2e2216,"),
    # steam lighter, broken up
    ("    const steam = st.smoke({ z: -26.2, w: 18, h: 5, color: 0x3a3836, density: 0.85, scale: 1.6, speed: [0.2, 0.04], edge: [0.05, 0.35, 0.95, 0.7], seed: 4 });",
     "    const steam = st.smoke({ z: -26.2, w: 14, h: 4, color: 0x4a4846, density: 0.55, scale: 2.6, speed: [0.25, 0.05], edge: [0.0, 0.4, 1.0, 0.6], seed: 4 });"),
    # Taihang: drop the rotated wall
    ("    const wallL = st.layer({ tex: P.cliffs({ base: 0.12, amp: 0.05, seed: 149, crevices: 60 }), z: -4, x: -7.2, y: 0.2, w: 5, h: 9, tone: 0x070607, rim: 0.6, rimDir: [1, 0.3], light: 0xffb070 });\n    wallL.rotation.z = -Math.PI / 2;\n", ""),
])
print("done")
