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

