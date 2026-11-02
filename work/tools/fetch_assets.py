"""Download what the repository does not carry: the music recordings (public domain / CC0, Wikimedia Commons) and the
full source fonts (SIL Open Font License). Both are needed only to rebuild; the film itself renders from the
committed font subsets once the music is in place.

python fetch_assets.py            # music + fonts
python fetch_assets.py music      # only the music  -> film/assets/audio/music/m_*.wav (loudness-normalised)
python fetch_assets.py fonts      # only the fonts  -> film/assets/fonts/src/*.ttf
python fetch_assets.py sfx        # recordings sfx_synth.py starts from -> work/sfx_src/*.wav (the built effects
                                  # are already committed in film/assets/audio/sfx; only needed to rebuild them)

Needs ffmpeg on PATH (or set FFMPEG to its full path).
"""
import os, sys, subprocess, time, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILM = os.path.join(ROOT, "..", "film")
UA = {"User-Agent": "letters-home-film/1.0 (https://github.com/; asset fetch)"}
FFMPEG = os.environ.get("FFMPEG", "ffmpeg")
C = "https://upload.wikimedia.org/wikipedia/commons"

# (source file, url, output name) — licences are listed in CREDITS.md
MUSIC = [
    ("bach_sarabande.ogg", f"{C}/4/4b/Bach_-_Cello_Suite_no._1_in_G_major%2C_BWV_1007_-_IV._Sarabande.ogg", "m_sarabande"),
    ("bach_air_usaf.mp3", f"{C}/e/ec/Air_-_Air_Force_Strings_-_United_States_Air_Force_Band.mp3", "m_air"),
    ("chopin_nocturne_csharp.flac", f"{C}/f/fc/Chopin_-_Nocturne_No._20_in_C-sharp_minor%2C_B._49_%28Frank_Levy%29.flac", "m_chopin"),
    ("stille_nacht_schumann_heink.ogg", f"{C}/7/73/Gruber_-_Schumann-Heink_-_Stille_Nacht.ogg", "m_stille"),
    ("satie_gymnopedie1.ogg", f"{C}/9/90/Erik_Satie_-_gymnopedies_-_la_1_ere._lent_et_douloureux.ogg", "m_satie"),
    ("dvorak_largo.ogg", f"{C}/c/c3/Antonin_Dvorak_-_symphony_no._9_in_e_minor_%27from_the_new_world%27%2C_op._95_-_ii._largo.ogg", "m_largo"),
    ("mahler_adagietto.ogg", f"{C}/b/b2/Mahler_Symphony_No._5%2C_IV._Adagietto.ogg", "m_mahler"),
]

SFX = [
    ("rain1", f"{C}/0/0e/Rain_%281%29.ogg"),
    ("rain_thunder", f"{C}/4/42/Rain_and_thunder.ogg"),
    ("inkpen", f"{C}/7/7c/Writing_with_inkpen.ogg"),
    ("pen_paper", f"{C}/9/98/292934-152_Writing-pen-paper-various_marks_and_lines.wav"),
]

G = "https://github.com/google/fonts/raw/main/ofl"
FONTS = [
    ("MaShanZheng-Regular.ttf", f"{G}/mashanzheng/MaShanZheng-Regular.ttf"),
    ("ZhiMangXing-Regular.ttf", f"{G}/zhimangxing/ZhiMangXing-Regular.ttf"),
    ("LongCang-Regular.ttf", f"{G}/longcang/LongCang-Regular.ttf"),
    ("NotoSerifSC[wght].ttf", f"{G}/notoserifsc/NotoSerifSC%5Bwght%5D.ttf"),
    ("EBGaramond[wght].ttf", f"{G}/ebgaramond/EBGaramond%5Bwght%5D.ttf"),
    ("EBGaramond-Italic[wght].ttf", f"{G}/ebgaramond/EBGaramond-Italic%5Bwght%5D.ttf"),
    ("PinyonScript-Regular.ttf", f"{G}/pinyonscript/PinyonScript-Regular.ttf"),
    ("MrsSaintDelafield-Regular.ttf", f"{G}/mrssaintdelafield/MrsSaintDelafield-Regular.ttf"),
    ("LaBelleAurore.ttf", f"{G}/labelleaurore/LaBelleAurore.ttf"),
    ("Cedarville-Cursive.ttf", f"{G}/cedarvillecursive/Cedarville-Cursive.ttf"),
    ("LXGWWenKai-Regular.ttf", "https://github.com/lxgw/LxgwWenKai/releases/latest/download/LXGWWenKai-Regular.ttf"),
    ("Yozai-Regular.ttf", "https://github.com/lxgw/yozai-font/releases/download/v0.868/Yozai-Regular.ttf"),
]


def get(url, dest):
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        return
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r, open(dest, "wb") as f:
                f.write(r.read())
            return
        except Exception as e:
            print("  retry", attempt + 1, e)
            time.sleep(5 + attempt * 5)
    raise SystemExit(f"could not download {url}")


def music():
    src = os.path.join(ROOT, "music_src")
    dst = os.path.join(FILM, "assets", "audio", "music")
    os.makedirs(src, exist_ok=True)
    os.makedirs(dst, exist_ok=True)
    for name, url, out in MUSIC:
        print("music", name)
        get(url, os.path.join(src, name))
        time.sleep(2)  # be gentle with Commons
        # the same treatment the film was mixed with: loudness-normalised, 48 kHz stereo
        subprocess.run([FFMPEG, "-y", "-v", "error", "-i", os.path.join(src, name), "-af", "loudnorm=I=-20:TP=-2:LRA=20", "-ar", "48000", "-ac", "2", os.path.join(dst, out + ".wav")], check=True)


def sfx():
    dst = os.path.join(ROOT, "sfx_src")
    os.makedirs(dst, exist_ok=True)
    for name, url in SFX:
        print("sfx", name)
        raw = os.path.join(dst, name + os.path.splitext(url)[1])
        get(url, raw)
        time.sleep(2)
        if not raw.endswith(".wav"):
            subprocess.run([FFMPEG, "-y", "-v", "error", "-i", raw, os.path.join(dst, name + ".wav")], check=True)


def fonts():
    dst = os.path.join(FILM, "assets", "fonts", "src")
    os.makedirs(dst, exist_ok=True)
    for name, url in FONTS:
        print("font", name)
        get(url, os.path.join(dst, name))


if __name__ == "__main__":
    what = sys.argv[1:] or ["music", "fonts"]
    if "music" in what:
        music()
    if "fonts" in what:
        fonts()
    if "sfx" in what:
        sfx()
    print("done")
