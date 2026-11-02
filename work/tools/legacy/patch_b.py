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


patch("shots_b.js", [
    ('    const flare = st.flame({ x: 2, y: 3, z: -30, size: 1.4, seed: 5, halo: 6 });',
     '    const flare = st.glow({ x: 2, y: 3, z: -30, size: 9, color: 0xdcecff, amt: 1 });'),
    ('      flare.userData.u.uOut.value = 0.2;\n      const bright = (1 - 0.35 * k) * fl;',
     '      const bright = (1 - 0.35 * k) * fl;\n      flare.userData.u.uAmt.value = 1.1 * bright;'),
    ('        m.userData.u.uLightAmt.value = 0.14 * bright;\n        m.userData.u.uLightFall.value = 1.5;',
     '        m.userData.u.uLightAmt.value = 0.1 * bright;\n        m.userData.u.uLightFall.value = 0.8;'),
    ("tone: 0x080b0f, fog: 0.18, fogColor: 0x26303a, rim: 1.0, rimDir: [0, 1], light: flareCol, rimW: 0.002 }),",
     "tone: 0x080b0f, fog: 0.18, fogColor: 0x26303a, rim: 0.45, rimDir: [0, 1], light: flareCol, rimW: 0.002 }),"),
    ("tone: 0x040608, rim: 1.2, rimDir: [0, 1], light: flareCol, rimW: 0.002 }),",
     "tone: 0x040608, rim: 0.5, rimDir: [0, 1], light: flareCol, rimW: 0.002 }),"),
    ('shadow: { cx: 0.6, cy: 0.5, s: 0.95 }, grade: GRADE.g1914 }', 'shadow: { cx: 0.6, cy: 0.46, s: 0.82 }, grade: GRADE.g1914 }'),
    ('shadow: { cx: 0.4, cy: 0.5, s: 0.95, flip: true }', 'shadow: { cx: 0.4, cy: 0.46, s: 0.82, flip: true }'),
    ('    for (let i = 0; i < 8; i++) flashes.push(st.flame({ x: -3.0 + 2.35 + (i - 4) * 0.02 - 4.6 + i * 1.18, y: -0.55, z: -5.9, size: 0.45, seed: i, halo: 2.5 }));',
     '    for (let i = 0; i < 7; i++) flashes.push(st.glow({ x: -8.25 + (0.215 + 0.122 * i) * 10.5, y: -1.02, z: -5.9, size: 1.3, color: 0xfff0c0 }));'),
    ('      flashes.forEach((f) => (f.userData.u.uOut.value = 1 - k));', '      flashes.forEach((f) => (f.userData.u.uAmt.value = k * 1.6));'),
    ('    const gaps = st.layer({ tex: boards, z: -2, tone: 0x241a12, size: [ww, wh], fiber: 0.1 });\n    const outside = st.layer({ z: -2.2, tone: 0xfff4d8, size: [ww, wh] });\n    outside.renderOrder = -5;\n', ''),
    ('      outside.userData.u.uTone.value.setRGB(1.0 * (1 - dark), 0.96 * (1 - dark), 0.85 * (1 - dark));\n', ''),
    ('const wallMat = sheetMaterial({ paper: 0x5a4632, deckle: 0, folds: 0, age: 0.3, fiber: 0.14, aspect: ww / wh, ambient: 0.05, lightAmt: 0.0 });',
     'const wallMat = sheetMaterial({ ink: boards, inkColor: 0x0a0705, paper: 0x6a5238, deckle: 0, folds: 0, age: 0.3, fiber: 0.16, aspect: ww / wh, ambient: 0.04, lightAmt: 0.0 });'),
    ('    const train = sil(st, "fig_locomotive", { z: -26, w: 13, y: -2.25,', '    const train = sil(st, "fig_locomotive", { z: -26, w: 13, y: -1.45,'),
    ('    const steam = st.smoke({ z: -26.2, w: 16, h: 6, color: 0x2a2826, density: 0.9, scale: 1.4, speed: [-0.12, 0.05], edge: [0.35, 0.5, 1.0, 0.8], seed: 4 });',
     '    const steam = st.smoke({ z: -26.2, w: 18, h: 5, color: 0x3a3836, density: 0.85, scale: 1.6, speed: [0.2, 0.04], edge: [0.05, 0.35, 0.95, 0.7], seed: 4 });'),
    ('    const rails = st.layer({ tex: P.ridge({ base: 0.82, amp: 0.0, freq: 1, seed: 1 }), z: -25.9, y: -2.4,',
     '    const rails = st.layer({ tex: P.ridge({ base: 0.86, amp: 0.002, freq: 1, seed: 1 }), z: -25.9, y: -1.7,'),
    ('P.sorghum({ base: 0.78, count: 260, height: 0.3, seed: 123 }), z: -12, y: -2.3,', 'P.sorghum({ base: 0.86, count: 240, height: 0.18, seed: 123 }), z: -12, y: -2.3,'),
    ('P.sorghum({ base: 0.75, count: 90, height: 0.6, seed: 124 }), z: 2, y: -2.0, size: [st.fillSize(2)[0], 4.5],',
     'P.sorghum({ base: 0.9, count: 70, height: 0.42, seed: 124 }), z: 2, y: -2.2, size: [st.fillSize(2)[0], 4.5],'),
    ('      const x = lerp(-16, 9, t / dur);\n      train.position.x = x;\n      rails.position.x = 0;\n      steam.position.set(x - 4.8, -0.2, -26.2);',
     '      const x = lerp(12, -8, t / dur);\n      train.position.x = x;\n      rails.position.x = 0;\n      steam.position.set(x + 3.6, 0.9, -26.2);'),
    ('{ sil: "fig_zhao_writing", wall: 0x8a7258, lamp: { kind: "candle", x: -30, y: -30, h: 0.1, seed: 41 }, shadow: { cx: 0.58, cy: 0.5, s: 0.95 }, stripes: { amt: 1.2, period: 7, speed: 1.4, angle: -0.6 }, blur: 4, grade: GRADE.g1936 },',
     '{ sil: "fig_zhao_writing", wall: 0x9a8064, ambient: 0.32, lamp: { kind: "candle", x: -30, y: -30, h: 0.1, seed: 41 }, shadow: { cx: 0.58, cy: 0.47, s: 0.82 }, stripes: { amt: 1.0, period: 7, speed: 1.4, angle: -0.6 }, blur: 4, grade: GRADE.g1936 },'),
    ('shadow: { cx: 0.6, cy: 0.5, s: 0.95 }, grade: GRADE.g1942 }', 'shadow: { cx: 0.6, cy: 0.47, s: 0.82 }, grade: GRADE.g1942 }'),
    ('st.layer({ tex: P.cliffs({ base: d.base, amp: d.amp, seed: d.seed, strata: 4 + i }), z: d.z, y: -1.6 - i * 0.15,',
     'st.layer({ tex: P.cliffs({ base: d.base, amp: d.amp * 1.6, seed: d.seed, crevices: 30 + i * 10 }), z: d.z, y: -1.2 - i * 0.15,'),
    ('    const column = sil(st, "fig_soldier_column", { z: -21.8, w: 6, x: -2, y: 0.25,',
     '    const wallL = st.layer({ tex: P.cliffs({ base: 0.12, amp: 0.05, seed: 149, crevices: 60 }), z: -4, x: -7.2, y: 0.2, w: 5, h: 9, tone: 0x070607, rim: 0.6, rimDir: [1, 0.3], light: 0xffb070 });\n    wallL.rotation.z = -Math.PI / 2;\n    const column = sil(st, "fig_soldier_column", { z: -21.8, w: 6, x: -2, y: 0.25,'),
    ('blasts.push({ at, x, fl: st.flame({ x, y: -0.4, z: -24.5, size: 3.2, seed: i, halo: 4 }),', 'blasts.push({ at, x, fl: st.glow({ x, y: -0.4, z: -24.5, size: 9, color: 0xffa050 }),'),
    ('        b.fl.userData.u.uOut.value = 1 - k;', '        b.fl.userData.u.uAmt.value = k * 1.5;'),
    ('st.layer({ tex: P.cliffs({ base: 0.48, amp: 0.12, seed: 151, strata: 4 }),', 'st.layer({ tex: P.cliffs({ base: 0.45, amp: 0.18, seed: 151 }),'),
    ('const ridge = st.layer({ tex: P.cliffs({ base: 0.56, amp: 0.1, seed: 152, strata: 5 }),', 'const ridge = st.layer({ tex: P.cliffs({ base: 0.56, amp: 0.14, seed: 152 }),'),
    ('    const rowW = hw * 1.6,', '    const rowW = hw * 1.05,'),
    ('      st.camera.position.set(lerp(0.0, 0.0, p), lerp(-0.8, 9.0, p), lerp(6.5, 9.0, p));\n      st.camera.lookAt(0, lerp(-0.4, -1.6, p), lerp(-10, -40, p));',
     '      st.camera.position.set(0, lerp(0.2, 9.0, p), lerp(9.0, 10.0, p));\n      st.camera.lookAt(0, lerp(-0.2, -1.6, p), lerp(-10, -40, p));'),
    ('    const glow = st.layer({ z: -3.05, x: 0.4 - 0.75, y: -0.55 + 0.35, w: 1.7, h: 1.6, tone: 0xffb25a, opacity: 1 });\n    const flameIn = st.flame({ x: 0.4 - 0.72, y: -0.55 + 0.1, z: -3.04, size: 0.5, seed: 3, halo: 1.6 });',
     '    st.layer({ tex: P.sheet({ w: 1024, h: 840, hole: [0.203, 0.235, 0.255, 0.3] }), z: -3.02, x: 0.056, y: -1.102, w: 3.03, h: 2.48, tone: 0x0a0b10 });\n    const glow = st.layer({ z: -3.06, x: -0.459, y: -0.817, w: 0.9, h: 0.86, tone: 0xffb25a, opacity: 1 });\n    const flameIn = st.flame({ x: -0.459, y: -0.93, z: -3.04, size: 0.32, seed: 3, halo: 1.2 });'),
])
patch("shots_common.js", [
    ('      g.fillRect(380, 600, 40, 14); // wick knob\n', ''),
    ('      ambient: 0.05,\n      lightFall: 1.6,', '      ambient: cfg.ambient ?? 0.05,\n      lightFall: 1.6,'),
])
print("done")
