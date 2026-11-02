# SPEC — 家书 LETTERS HOME

GOAL:    The viewer leaves feeling that every war casualty was someone's letter-writer, and wishing every letter's writer could come home.
OUTPUT:  HyperFrames, 1920 x 1080, 24 fps. Picture area 2.35:1 = 1920 x 816, black bars 132 px top and bottom.
TIME:    ~8–9 min, set by the voice tracks (voice is the clock). Music is placed per chapter, never cut on beats.

LOOK — "纸雕灯" (layered paper-cut lamp)
  medium:   every world is 3–9 parallel paper layers in depth, lit by one light source per scene
            (flame, moon, fire, flare, daylight). Front layers read as near-black cut paper with a
            1–2 px rim of the light colour; back layers glow (translucent paper, 35–70% transmission).
  paper:    fibre noise ±4% luminance, scale 2.5 px; base #E9DFC9 (lit) / #15110D (silhouette);
            drop shadow of each layer onto the next: offset 6–14 px away from the light, blur 10 px, 0.45 opacity.
  light:    flame #FFB25A core #FFF1C8, flicker 3–7% at 7–13 Hz from seeded noise;
            moon #BFD4FF; fire #FF6A1F; flare #E8F4FF; dawn #C9D3DA.
  grade:    per era — 757 ember/black, 1861 amber-dusk, 1911 moon-blue + lamp, 1914 slate + candle,
            1936 bleached green-grey, 1942 ochre + mountain blue, epilogue pale dawn → warm window.
  grain:    5% animated luminance grain; vignette 18%; no bloom except on flames (radius 40 px, 0.6).
  type:     cards — Noto Serif SC 500, 40 px, tracking +0.08em, #EDE4D3 at 92%; small cards 28 px.
            subtitles — Noto Serif SC 400, 34 px in the lower bar; original-language line EB Garamond italic 24 px above it.
            dates — Noto Serif SC 400 30 px, letter-spaced 0.3em.
            calligraphy — Ma Shan Zheng (title, 见字如面), Zhi Mang Xing (林觉民 handkerchief).
            handwriting — Pinyon Script (Ballou), Cedarville Cursive (Floch), LXGW WenKai (赵一曼, 左权, epilogue).
  accent:   the only saturated colour is flame orange; red appears once (the phone's failed-send mark).

OBJECTS: brass lantern, oil-dish lamp, candle stub, kerosene lamp with glass chimney — each with a shader flame;
         letter paper with real handwriting appearing in sync with the voice; a white cloth handkerchief;
         tent canvas, plaster, trench earth, train boards, loess cave walls that take the writer's shadow;
         paper-cut figures (silhouettes) for every person; graves as white paper cut-outs.

MOTION:  camera — slow dolly 2–6% of frame per 5 s on power1.inOut, never orbiting; one move per shot.
         layers drift by parallax only. Particles (embers, rain, snow, petals, letters) are seeded and
         derived from t. Card text: fade 0.6 s in, hold, fade 0.8 s out; nothing slides. Handwriting is
         revealed glyph by glyph, paced to the spoken line.
         transitions — burn-through (paper chars and opens onto the next world), flame match-cut,
         slow dissolve (1.2 s), hard cut to black for every death card.

SHOTS:   built from SCRIPT.md; each chapter = lamp → world → shadow-writer + letter → recipient → event → lamp out → cards on black.

BANNED:  floating decorative particles (every particle is weather, fire or paper); glow rings, lens flares;
         text that moves while read; everything centred — cards sit on a left third or under the subject;
         cream-paper + monospace-label look; three-cards-in-a-row; logos; photoreal faces.

QA:      0:05 match flame; cold-open "见字如面" legible; prologue city layers read as a city;
         each chapter's writing shot shows shadow + flame + handwriting; truce candles; graves field depth;
         phone red mark; final title. Subtitles inside the lower bar on every spoken line.
