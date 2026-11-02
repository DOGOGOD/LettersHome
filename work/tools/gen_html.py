"""Generate the HyperFrames project files from timeline.json + edl.json, and subset the CJK fonts."""
import json, os, re, html
import soundfile as sf
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILM = os.path.normpath(os.path.join(ROOT, "..", "film"))
TL = json.load(open(os.path.join(FILM, "timeline.json"), encoding="utf-8"))
EDL = json.load(open(os.path.join(ROOT, "edl.json"), encoding="utf-8"))
VOICES = json.load(open(os.path.join(ROOT, "voices.json"), encoding="utf-8"))
TOTAL = TL["total"]
os.makedirs(os.path.join(FILM, "compositions"), exist_ok=True)
FD = os.path.join(FILM, "assets", "fonts")

# ------------------------------------------------------------------ fonts: subset to the characters the film uses
texts = []
for c in EDL["cards"]:
    texts.append(re.sub(r"<[^>]+>", "", c["text"]) + (c.get("sub") or ""))
for s in EDL["subs"]:
    texts.append(s["cn"] + (s["orig"] or ""))
for sh in TL["shots"]:
    for l in sh.get("lines") or []:
        texts.append(l["text"])
for v in VOICES.values():
    texts += v["lines"]
texts += ["见字如面", "家书", "妈，我很好，勿念。", "第一封第二封第三封第四封第五封", "LETTERS HOME", "0123456789:：", "家书抵万金烽火连三月"]
chars = "".join(sorted(set("".join(texts)) | set(" ，。！？；：、“”‘’（）《》——…·|")))
open(os.path.join(ROOT, "charset.txt"), "w", encoding="utf-8").write(chars)


def sub(src, dst, chars, variable=False, rename=None):
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    f = TTFont(os.path.join(FD, "src", src))
    s = subset.Subsetter(options=opts)
    s.populate(text=chars)
    s.subset(f)
    if rename:
        # a subset is a Modified Version under the SIL OFL: fonts with a Reserved Font Name must not keep it
        for rec in f["name"].names:
            if rec.nameID in (1, 3, 4, 6, 16, 17, 21, 22):
                rec.string = rename.replace(" ", "") if rec.nameID == 6 else rename
    f.flavor = "woff2"
    f.save(os.path.join(FD, dst))
    print(dst, os.path.getsize(os.path.join(FD, dst)) // 1024, "KB")


sub("NotoSerifSC[wght].ttf", "NotoSerifSC.woff2", chars)
sub("LXGWWenKai-Regular.ttf", "LettersKai.woff2", chars, rename="Letters Kai")  # subset of LXGW WenKai (RFN)
sub("MaShanZheng-Regular.ttf", "MaShanZheng.woff2", chars)
sub("ZhiMangXing-Regular.ttf", "ZhiMangXing.woff2", chars)
sub("LongCang-Regular.ttf", "LongCang.woff2", chars)
sub("Yozai-Regular.ttf", "Yozai.woff2", chars)
LATIN = "".join(chr(c) for c in range(32, 0x250)) + "—–’‘“”…«»"
for src, dst in [("PinyonScript-Regular.ttf", "PinyonScript.woff2"), ("LaBelleAurore.ttf", "LaBelleAurore.woff2"), ("Cedarville-Cursive.ttf", "CedarvilleCursive.woff2"), ("EBGaramond[wght].ttf", "EBGaramond.woff2"), ("EBGaramond-Italic[wght].ttf", "EBGaramondItalic.woff2")]:
    sub(src, dst, LATIN)
sub("MrsSaintDelafield-Regular.ttf", "LettersSpencer.woff2", LATIN, rename="Letters Spencer")  # subset of Mrs Saint Delafield (RFN)

FONTFACE = """
      @font-face { font-family: "Noto Serif SC"; src: url("assets/fonts/NotoSerifSC.woff2") format("woff2"); font-weight: 200 900; }
      @font-face { font-family: "Letters Kai"; src: url("assets/fonts/LettersKai.woff2") format("woff2"); }
      @font-face { font-family: "Ma Shan Zheng"; src: url("assets/fonts/MaShanZheng.woff2") format("woff2"); }
      @font-face { font-family: "Zhi Mang Xing"; src: url("assets/fonts/ZhiMangXing.woff2") format("woff2"); }
      @font-face { font-family: "Long Cang"; src: url("assets/fonts/LongCang.woff2") format("woff2"); }
      @font-face { font-family: "Yozai"; src: url("assets/fonts/Yozai.woff2") format("woff2"); }
      @font-face { font-family: "Pinyon Script"; src: url("assets/fonts/PinyonScript.woff2") format("woff2"); }
      @font-face { font-family: "Letters Spencer"; src: url("assets/fonts/LettersSpencer.woff2") format("woff2"); }
      @font-face { font-family: "La Belle Aurore"; src: url("assets/fonts/LaBelleAurore.woff2") format("woff2"); }
      @font-face { font-family: "Cedarville Cursive"; src: url("assets/fonts/CedarvilleCursive.woff2") format("woff2"); }
      @font-face { font-family: "EB Garamond"; src: url("assets/fonts/EBGaramond.woff2") format("woff2"); font-weight: 400 800; }
      @font-face { font-family: "EB Garamond"; src: url("assets/fonts/EBGaramondItalic.woff2") format("woff2"); font-style: italic; font-weight: 400 800; }"""

# ------------------------------------------------------------------ cards: one composition per section
CARD_CSS = """
      #root { position: absolute; inset: 0; }
      .card { position: absolute; color: #ece3d2; font-family: "Noto Serif SC", serif; text-shadow: 0 0 22px rgba(0,0,0,.75), 0 0 4px rgba(0,0,0,.6); }
      .card .in { opacity: 0; }
      .s-card { left: 168px; bottom: 236px; font-size: 40px; font-weight: 500; line-height: 1.7; letter-spacing: .06em; }
      .s-small { left: 168px; bottom: 236px; font-size: 30px; font-weight: 400; line-height: 1.8; letter-spacing: .06em; }
      .s-black { left: 300px; top: 412px; font-size: 40px; font-weight: 400; line-height: 1.85; letter-spacing: .08em; color: #e6dccb; text-shadow: none; }
      .s-upper { left: 168px; top: 220px; font-size: 34px; font-weight: 400; line-height: 1.8; letter-spacing: .06em; }
      .s-dark { left: 168px; top: 214px; font-size: 40px; font-weight: 500; letter-spacing: .06em; color: #1d1915; text-shadow: 0 0 24px rgba(235,235,232,.9); }
      .s-papermid { left: 0; right: 0; top: 438px; text-align: center; font-size: 34px; font-weight: 500; line-height: 1.75; letter-spacing: .06em; color: #1d1610; text-shadow: 0 0 14px rgba(244,238,224,1), 0 0 28px rgba(244,238,224,.9); }
      .s-paper { left: 168px; top: 214px; font-size: 36px; font-weight: 500; line-height: 1.75; letter-spacing: .06em; color: #1d1610; text-shadow: 0 0 18px rgba(240,232,214,.9); }
      .s-small_dark { left: 168px; bottom: 236px; font-size: 30px; line-height: 1.8; letter-spacing: .06em; color: #1d1610; text-shadow: 0 0 16px rgba(240,236,228,.9); }
      .s-chapter_dark { left: 168px; top: 300px; text-shadow: none; }
      .s-chapter_dark .no { display: block; font-size: 28px; letter-spacing: .6em; color: #3a2e24; margin-bottom: 18px; }
      .s-chapter_dark .ti { display: block; font-family: "Ma Shan Zheng", serif; font-size: 104px; letter-spacing: .12em; color: #120c08; }
      .s-time { right: 168px; top: 196px; font-size: 30px; letter-spacing: .4em; color: #e6ddca; }
      .s-date { left: 168px; top: 196px; font-size: 28px; font-weight: 400; letter-spacing: .32em; color: #e2d8c6; }
      .s-quote { left: 168px; bottom: 214px; font-size: 34px; font-weight: 400; line-height: 1.75; letter-spacing: .05em; }
      .s-quote .attr { display: block; margin-top: 14px; font-size: 24px; letter-spacing: .2em; color: #cfc4b2; }
      .s-chapter { left: 168px; top: 300px; }
      .s-chapter .no { display: block; font-size: 28px; letter-spacing: .6em; color: #e2d8c6; margin-bottom: 18px; }
      .s-chapter .ti { display: block; font-family: "Ma Shan Zheng", serif; font-size: 104px; letter-spacing: .12em; color: #f1e8d6; }
      .s-brush { right: 300px; top: 210px; writing-mode: vertical-rl; font-family: "Ma Shan Zheng", serif; font-size: 76px; line-height: 1.5; letter-spacing: .14em; color: #f2e9d8; }
      .s-title_en { left: 0; right: 0; top: 772px; text-align: center; font-family: "EB Garamond", serif; font-size: 32px; font-weight: 600; letter-spacing: .8em; color: #1a110a; text-shadow: none; }
      .s-credits { left: 0; right: 0; top: 330px; text-align: center; font-size: 30px; line-height: 1.9; letter-spacing: .08em; color: #b9ae9c; text-shadow: none; }"""


def card_inner(c):
    t = c["text"]
    if c["style"] in ("chapter", "chapter_dark"):
        no, ti = t.split("|")
        return f'<span class="no">{no}</span><span class="ti">{ti}</span>'
    if c["style"] == "quote":
        return f'{t}<span class="attr">{html.escape(c["sub"] or "")}</span>'
    return t


sections = {}
for c in EDL["cards"]:
    sections.setdefault(c["section"], []).append(c)
hosts = []
for sec, cs in sections.items():
    s0 = max(0, min(c["start"] for c in cs) - 0.5)
    s1 = max(c["start"] + c["dur"] for c in cs) + 0.5
    cid = f"cards-{sec}"
    els, tw = [], []
    for i, c in enumerate(cs):
        a = round(c["start"] - s0, 3)
        d = round(c["dur"], 3)
        eid = f"{sec}-k{i}"
        els.append(f'    <div id="{eid}" class="clip card s-{c["style"]}" data-start="{a}" data-duration="{d}" data-track-index="{i % 3}"><div class="in">{card_inner(c)}</div></div>')
        fin = 0.9 if c["style"] in ("chapter", "chapter_dark", "brush", "title_en", "credits") else 0.6
        fout = 0.9
        tw.append(f'      tl.fromTo("#{eid} .in", {{ opacity: 0, filter: "blur(6px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: {fin}, ease: "power2.out" }}, {a});')
        tw.append(f'      tl.to("#{eid} .in", {{ opacity: 0, duration: {fout}, ease: "power1.in" }}, {round(a + d - fout - 0.05, 3)});')
    doc = f"""<template>
  <style>{FONTFACE}
{CARD_CSS}
  </style>
  <div id="root" data-composition-id="{cid}" data-width="1920" data-height="1080">
{chr(10).join(els)}
  </div>
  <script>
    (function () {{
      const tl = gsap.timeline({{ paused: true }});
{chr(10).join(tw)}
      window.__timelines["{cid}"] = tl;
    }})();
  </script>
</template>
"""
    open(os.path.join(FILM, "compositions", f"{cid}.html"), "w", encoding="utf-8").write(doc)
    hosts.append((cid, round(s0, 3), round(s1 - s0, 3)))

# ------------------------------------------------------------------ subtitles
SUB_CSS = """
      #root { position: absolute; inset: 0; }
      .sub { position: absolute; left: 0; right: 0; bottom: 0; height: 132px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
      .sub .in { opacity: 0; }
      .sub .orig { display: block; font-family: "EB Garamond", serif; font-style: italic; font-size: 25px; color: #c9bfae; letter-spacing: .02em; margin-bottom: 6px; }
      .sub .cn { display: block; font-family: "Noto Serif SC", serif; font-size: 33px; font-weight: 400; color: #f1e9da; letter-spacing: .06em; }"""
els, tw = [], []
for i, s in enumerate(EDL["subs"]):
    eid = f"sub{i:02d}"
    orig = f'<span class="orig">{html.escape(s["orig"])}</span>' if s["orig"] else ""
    els.append(f'    <div id="{eid}" class="clip sub" data-start="{s["start"]}" data-duration="{s["dur"]}" data-track-index="{i % 2}"><div class="in">{orig}<span class="cn">{html.escape(s["cn"])}</span></div></div>')
    tw.append(f'      tl.fromTo("#{eid} .in", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.25 }}, {s["start"]});')
    tw.append(f'      tl.to("#{eid} .in", {{ opacity: 0, duration: 0.3 }}, {round(s["start"] + s["dur"] - 0.35, 3)});')
doc = f"""<template>
  <style>{FONTFACE}
{SUB_CSS}
  </style>
  <div id="root" data-composition-id="subs" data-width="1920" data-height="1080" data-layout-allow-caption-zone>
{chr(10).join(els)}
  </div>
  <script>
    (function () {{
      const tl = gsap.timeline({{ paused: true }});
{chr(10).join(tw)}
      window.__timelines["subs"] = tl;
    }})();
  </script>
</template>
"""
open(os.path.join(FILM, "compositions", "subs.html"), "w", encoding="utf-8").write(doc)

# ------------------------------------------------------------------ the phone
# his mother's unanswered messages; he types, hesitates, deletes, types again; the send fails;
# the battery dies and the black glass keeps only the reflection of his candle
ph = EDL["phone"]
if ph["dur"]:
    mom = [("3月2日 21:14", "吃饭了吗？"), ("3月4日 23:40", "怎么一直不回消息"), ("3月7日 06:02", "妈妈每天都在看新闻"), ("3月9日 22:51", "不用多说，回一个字就好")]
    bubbles = "".join(f'<div class="ph-ts" id="ph-ts{i}">{ts}</div><div class="ph-mom" id="ph-m{i}">{tx}</div>' for i, (ts, tx) in enumerate(mom))
    first, final = "妈，我", "妈，我很好，勿念。"
    typ = []  # (time, visible string)
    t = 9.6
    for k in range(1, len(first) + 1):
        typ.append((t, first[:k]))
        t += 0.42
    t += 1.6
    for k in range(len(first) - 1, -1, -1):
        typ.append((t, first[:k]))
        t += 0.22
    t += 1.4
    for k in range(1, len(final) + 1):
        typ.append((t, final[:k]))
        t += 0.46
    send = t + 0.9
    fail = send + 3.6
    batt = fail + 2.2
    dark = batt + 2.4
    states = "".join(f'<span class="ph-st" id="ph-s{i}">{html.escape(s)}<i class="caret"></i></span>' for i, (_, s) in enumerate(typ))
    sets = []
    for i, (tt, _) in enumerate(typ):
        end = typ[i + 1][0] if i + 1 < len(typ) else send
        sets.append(f'      tl.fromTo("#ph-s{i}", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.01 }}, {round(tt, 3)});')
        sets.append(f'      tl.to("#ph-s{i}", {{ opacity: 0, duration: 0.01 }}, {round(end, 3)});')
    moms = "\n".join(f'      tl.fromTo(["#ph-ts{i}", "#ph-m{i}"], {{ opacity: 0 }}, {{ opacity: 1, duration: 0.5 }}, {1.6 + i * 1.5});' for i in range(len(mom)))
    PHONE_CSS = """
      #root { position: absolute; inset: 0; }
      #ph-wrap { position: absolute; left: 700px; top: 150px; width: 430px; height: 780px; opacity: 0; }
      #ph-body { position: absolute; inset: 0; border-radius: 48px; background: #0b0c0f; box-shadow: 0 0 0 3px #1c1d22, 0 30px 90px rgba(0,0,0,.85); overflow: hidden; }
      #ph-screen { position: absolute; left: 14px; top: 14px; right: 14px; bottom: 14px; border-radius: 36px; background: #15171c; overflow: hidden; }
      #ph-bar { position: absolute; left: 0; right: 0; top: 0; height: 84px; background: #1c1f25; border-bottom: 1px solid #2a2d34; font-family: "Noto Serif SC", serif; color: #d9d4ca; font-size: 23px; text-align: center; line-height: 104px; letter-spacing: .12em; }
      #ph-sig { position: absolute; left: 28px; top: 14px; height: 16px; display: flex; align-items: flex-end; gap: 3px; }
      #ph-sig i { display: block; width: 4px; border-radius: 1px; background: #4a4d54; }
      #ph-sig i:nth-child(1) { height: 5px; background: #b9b4aa; } #ph-sig i:nth-child(2) { height: 8px; } #ph-sig i:nth-child(3) { height: 11px; } #ph-sig i:nth-child(4) { height: 14px; }
      #ph-bat { position: absolute; right: 26px; top: 16px; width: 30px; height: 13px; border: 2px solid #9a958c; border-radius: 3px; }
      #ph-bat i { position: absolute; left: 2px; top: 2px; bottom: 2px; width: 3px; background: #d23b2e; }
      #ph-list { position: absolute; left: 0; right: 0; top: 96px; bottom: 100px; padding: 0 20px; }
      .ph-ts { text-align: center; font: 15px "Noto Serif SC", serif; color: #6c6f76; margin: 16px 0 8px; opacity: 0; }
      .ph-mom { max-width: 270px; padding: 12px 16px; border-radius: 18px 18px 18px 4px; background: #2a2d34; color: #e6e2da; font: 22px "Noto Serif SC", serif; letter-spacing: .03em; opacity: 0; }
      #ph-bubble { position: absolute; right: 22px; bottom: 120px; max-width: 290px; padding: 13px 17px; border-radius: 18px 18px 4px 18px; background: #2f6b4a; color: #f1efe8; font: 23px "Noto Serif SC", serif; letter-spacing: .04em; opacity: 0; }
      #ph-spin { position: absolute; right: 336px; bottom: 132px; width: 24px; height: 24px; border-radius: 50%; border: 3px solid #6b7078; border-top-color: transparent; opacity: 0; }
      #ph-fail { position: absolute; right: 334px; bottom: 130px; width: 30px; height: 30px; border-radius: 50%; background: #d23b2e; color: #fff; font: 700 22px/30px "EB Garamond", serif; text-align: center; opacity: 0; }
      #ph-failtx { position: absolute; right: 24px; bottom: 96px; font: 15px "Noto Serif SC", serif; color: #d2564a; opacity: 0; }
      #ph-input { position: absolute; left: 18px; right: 18px; bottom: 26px; height: 60px; border-radius: 30px; background: #22252c; }
      .ph-st { position: absolute; left: 24px; top: 0; line-height: 60px; color: #e8e4dc; font: 23px "Noto Serif SC", serif; letter-spacing: .04em; opacity: 0; white-space: nowrap; }
      .caret { display: inline-block; width: 2px; height: 26px; background: #8ab89a; margin-left: 3px; vertical-align: -5px; }
      #ph-toast { position: absolute; left: 40px; right: 40px; top: 120px; padding: 14px; border-radius: 14px; background: rgba(40,40,46,.96); color: #e8e4dc; font: 19px "Noto Serif SC", serif; text-align: center; opacity: 0; }
      #ph-off { position: absolute; inset: 0; background: #020203; opacity: 0; }
      #ph-refl { position: absolute; right: 60px; bottom: 150px; width: 70px; height: 110px; border-radius: 50%; background: radial-gradient(ellipse at center, rgba(255,190,110,.55), rgba(255,150,60,.12) 45%, rgba(0,0,0,0) 72%); opacity: 0; }
      #ph-sheen { position: absolute; inset: 0; background: linear-gradient(125deg, rgba(255,255,255,.05) 0%, rgba(255,255,255,0) 35%); opacity: 0; }
      #ph-crack { position: absolute; inset: 0; opacity: .5; }"""
    tws = [
        '      tl.fromTo("#ph-wrap", { opacity: 0 }, { opacity: 1, duration: 1.4, ease: "power1.out" }, 0.4);',
        moms,
        "\n".join(sets),
        f'      tl.fromTo("#ph-bubble", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.25 }}, {round(send, 3)});',
        f'      tl.fromTo("#ph-spin", {{ opacity: 0, rotation: 0 }}, {{ opacity: 1, rotation: 1080, duration: {round(fail - send - 0.1, 3)}, ease: "none" }}, {round(send + 0.1, 3)});',
        f'      tl.to("#ph-spin", {{ opacity: 0, duration: 0.01 }}, {round(fail, 3)});',
        f'      tl.fromTo(["#ph-fail", "#ph-failtx"], {{ opacity: 0 }}, {{ opacity: 1, duration: 0.01 }}, {round(fail, 3)});',
        f'      tl.fromTo("#ph-toast", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.3 }}, {round(batt, 3)});',
        f'      tl.fromTo("#ph-off", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.18 }}, {round(dark, 3)});',
        f'      tl.to("#ph-off", {{ opacity: 0.7, duration: 0.06 }}, {round(dark + 0.22, 3)});',
        f'      tl.to("#ph-off", {{ opacity: 1, duration: 0.1 }}, {round(dark + 0.3, 3)});',
        f'      tl.fromTo(["#ph-refl", "#ph-sheen"], {{ opacity: 0 }}, {{ opacity: 1, duration: 2.5 }}, {round(dark + 0.8, 3)});',
        f'      tl.to("#ph-wrap", {{ opacity: 0, duration: 2.0, ease: "power1.in" }}, {round(ph["dur"] - 2.2, 3)});',
    ]
    crack = '<svg id="ph-crack" viewBox="0 0 402 752"><g fill="none" stroke="#cfd6e0" stroke-width="1.2"><path d="M330 60 L276 168 L296 240 L232 344 L250 430 L198 548"/><path d="M276 168 L210 200 L132 180"/><path d="M296 240 L362 312 L398 300"/><path d="M232 344 L154 368 L66 346 L10 380"/><path d="M250 430 L318 494 L330 590"/><path d="M198 548 L130 632 L142 740"/></g></svg>'
    body = (
        f'<div id="ph-wrap"><div id="ph-body"><div id="ph-screen">'
        f'<div id="ph-bar">妈妈</div><div id="ph-sig"><i></i><i></i><i></i><i></i></div><div id="ph-bat"><i></i></div>'
        f'<div id="ph-list">{bubbles}</div><div id="ph-bubble">{final}</div>'
        f'<div id="ph-spin"></div><div id="ph-fail">!</div><div id="ph-failtx">发送失败</div>'
        f'<div id="ph-input">{states}</div><div id="ph-toast">电量剩余 1%</div>'
        f'<div id="ph-off"></div><div id="ph-refl"></div><div id="ph-sheen"></div>{crack}'
        f"</div></div></div>"
    )
    doc = (
        "<template>\n  <style>" + FONTFACE + PHONE_CSS + "\n  </style>\n"
        + f'  <div id="root" data-composition-id="phone" data-width="1920" data-height="1080">\n'
        + f'    <div id="ph-clip" class="clip" data-start="0" data-duration="{ph["dur"]}" data-track-index="0">{body}</div>\n  </div>\n'
        + "  <script>\n    (function () {\n      const tl = gsap.timeline({ paused: true });\n"
        + "\n".join(tws)
        + '\n      window.__timelines["phone"] = tl;\n    })();\n  </script>\n</template>\n'
    )
    open(os.path.join(FILM, "compositions", "phone.html"), "w", encoding="utf-8").write(doc)

# ------------------------------------------------------------------ world data module
open(os.path.join(FILM, "lib", "timeline_data.js"), "w", encoding="utf-8").write("export default " + json.dumps(TL, ensure_ascii=False) + ";\n")

# ------------------------------------------------------------------ root
durs = {}


def flen(src):
    if src not in durs:
        durs[src] = sf.info(os.path.join(FILM, src)).duration
    return durs[src]


aud = []
lanes = []  # end time per sfx lane, so overlapping clips never share a lane


def lane_for(start, end):
    for k, e in enumerate(lanes):
        if e <= start - 0.01:
            lanes[k] = end
            return 22 + k
    lanes.append(end)
    return 22 + len(lanes) - 1


for i, a in enumerate(EDL["audio"]):
    L = flen(a["src"])
    d = a["dur"] if a["dur"] else L - a["media"]
    d = min(d, L - a["media"])
    tr = lane_for(a["start"], a["start"] + d) if a["kind"] == "sfx" else {"vo": 20, "music": 21}[a["kind"]]
    fades = (f' data-fade-in="{a["fin"]}"' if a["fin"] else "") + (f' data-fade-out="{a["fout"]}"' if a["fout"] else "")
    ms = f' data-media-start="{a["media"]}"' if a["media"] else ""
    aud.append(f'      <audio id="au{i:03d}" class="clip" src="{a["src"]}" data-start="{a["start"]}" data-duration="{round(d, 3)}"{ms} data-volume="{a["vol"]}"{fades} data-track-index="{tr}"></audio>')

host_html = "\n".join(
    f'      <div id="{cid}" data-composition-id="{cid}" data-composition-src="compositions/{cid}.html" data-start="{s0}" data-duration="{d}" data-track-index="2" data-track-kind="graphics" data-width="1920" data-height="1080" style="z-index: 20"></div>'
    for cid, s0, d in hosts
)
phone_host = (f'      <div id="phone" data-composition-id="phone" data-composition-src="compositions/phone.html" data-start="{ph["start"]}" data-duration="{ph["dur"]}" data-track-index="3" data-track-kind="graphics" data-width="1920" data-height="1080" style="z-index: 30"></div>\n' if ph["dur"] else "")
index = f"""<!doctype html>
<html lang="zh" data-resolution="landscape">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <title>家书 · Letters Home</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <script type="importmap">
      {{ "imports": {{ "three": "./lib/three.module.min.js" }} }}
    </script>
    <style>{FONTFACE}
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1920px; height: 1080px; overflow: hidden; background: #000; }}
      #root {{ position: relative; width: 1920px; height: 1080px; background: #000; }}
      #world {{ position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; display: block; z-index: 0; }}
      #bars {{ position: absolute; inset: 0; z-index: 50; pointer-events: none; }}
      #bars .bar {{ position: absolute; left: 0; right: 0; height: 132px; background: #000; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1920" data-height="1080" data-fps="24">
      <canvas id="world" class="clip" data-start="0" data-duration="{TOTAL}" data-track-index="0" width="1920" height="1080"></canvas>
{host_html}
{phone_host}      <div id="bars" class="clip" data-start="0" data-duration="{TOTAL}" data-track-index="4" data-layout-ignore><div class="bar" style="top: 0"></div><div class="bar" style="bottom: 0"></div></div>
      <div id="subs" data-composition-id="subs" data-composition-src="compositions/subs.html" data-start="0" data-duration="{TOTAL}" data-track-index="5" data-track-kind="captions" data-width="1920" data-height="1080" style="z-index: 60"></div>
{chr(10).join(aud)}
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
    <script type="module">
      import {{ World }} from "./lib/world.js";
      import {{ loadAssets }} from "./lib/kit.js";
      import {{ BUILDERS }} from "./lib/catalog.js";
      import TL from "./lib/timeline_data.js";

      const shots = TL.shots.map((s) => Object.assign({{}}, s, {{ build: BUILDERS[s.builder](s.p || {{}}) }}));
      let world = null;
      let pending = window.__hfThreeTime || 0;
      const draw = (t) => {{
        if (world) world.render(t);
        else pending = t;
      }};
      window.addEventListener("hf-seek", (e) => draw(e.detail.time));
      window.__hf = window.__hf || {{}};
      window.__hf.buildReady = window.__hf.buildReady || {{}};
      window.__hf.buildReady.world = loadAssets().then(() => {{
        world = new World(document.getElementById("world"), shots);
        world.render(window.__hfThreeTime ?? pending);
      }});
    </script>
  </body>
</html>
"""
open(os.path.join(FILM, "index.html"), "w", encoding="utf-8").write(index)
print("hosts", len(hosts), "audio", len(aud), "total", TOTAL)
