# Credits & third-party licences / 致谢与第三方许可

Everything below is redistributable. Licence texts for bundled material are in [`licenses/`](licenses/).

## Letters & poem / 信件与诗

All texts are in the public domain (their authors died 1861–1942; 杜甫 757).

| Text | Author | Year |
|---|---|---|
| 《春望》 | 杜甫 | 757 |
| Letter to Sarah Ballou | Sullivan Ballou | 1861 |
| 《与妻书》 | 林觉民 | 1911 |
| Last letter | Henri Floch | 1914 |
| 给儿子宁儿的遗书 | 赵一曼 | 1936 |
| 致刘志兰的信 | 左权 | 1942 |
| Second Inaugural Address (quoted) | Abraham Lincoln | 1865 |

The Chinese translations of the English and French letters were made for this film.

## Music / 音乐 — Wikimedia Commons

Not stored in the repository; `python work/tools/fetch_assets.py music` downloads and prepares them.

| Track in the film | Commons file | Licence |
|---|---|---|
| Bach, Cello Suite No. 1 — Sarabande | [Bach_-_Cello_Suite_no._1_in_G_major,_BWV_1007_-_IV._Sarabande.ogg](https://commons.wikimedia.org/wiki/File:Bach_-_Cello_Suite_no._1_in_G_major,_BWV_1007_-_IV._Sarabande.ogg) | Public domain |
| Bach, Air on the G String — United States Air Force Band | [Air_-_Air_Force_Strings_-_United_States_Air_Force_Band.mp3](https://commons.wikimedia.org/wiki/File:Air_-_Air_Force_Strings_-_United_States_Air_Force_Band.mp3) | Public domain |
| Chopin, Nocturne in C-sharp minor — Frank Levy | [Chopin_-_Nocturne_No._20_in_C-sharp_minor,_B._49_(Frank_Levy).flac](https://commons.wikimedia.org/wiki/File:Chopin_-_Nocturne_No._20_in_C-sharp_minor,_B._49_(Frank_Levy).flac) | Public domain |
| Gruber, Stille Nacht — Ernestine Schumann-Heink | [Gruber_-_Schumann-Heink_-_Stille_Nacht.ogg](https://commons.wikimedia.org/wiki/File:Gruber_-_Schumann-Heink_-_Stille_Nacht.ogg) | Public domain |
| Satie, Gymnopédie No. 1 — Robin Alciatore | [Erik_Satie_-_gymnopedies_-_la_1_ere._lent_et_douloureux.ogg](https://commons.wikimedia.org/wiki/File:Erik_Satie_-_gymnopedies_-_la_1_ere._lent_et_douloureux.ogg) | Public domain |
| Dvořák, Symphony No. 9 — Largo | [Antonin_Dvorak_-_symphony_no._9_in_e_minor_'from_the_new_world',_op._95_-_ii._largo.ogg](https://commons.wikimedia.org/wiki/File:Antonin_Dvorak_-_symphony_no._9_in_e_minor_%27from_the_new_world%27,_op._95_-_ii._largo.ogg) | Public domain |
| Mahler, Symphony No. 5 — Adagietto — Peabody Symphony Orchestra | [Mahler_Symphony_No._5,_IV._Adagietto.ogg](https://commons.wikimedia.org/wiki/File:Mahler_Symphony_No._5,_IV._Adagietto.ogg) | CC0 |

## Sound effects / 音效

Most effects are synthesized in code (`work/tools/sfx_synth.py`, `sfx_chuff.py`) — gunfire, explosions, wind,
fire, waves, crickets, aircraft, candle room, match, paper burning, steam whistle and locomotive. The built files
are in `film/assets/audio/sfx/`. Recorded sources:

| Effect | Source | Licence |
|---|---|---|
| rain | [Rain_(1).ogg](https://commons.wikimedia.org/wiki/File:Rain_(1).ogg) — ezwa | Public domain |
| rain & thunder | [Rain_and_thunder.ogg](https://commons.wikimedia.org/wiki/File:Rain_and_thunder.ogg) — User:Caesar | Public domain |
| fountain pen | [Writing_with_inkpen.ogg](https://commons.wikimedia.org/wiki/File:Writing_with_inkpen.ogg) — stephan | Public domain |
| pen on paper | [292934-152_Writing-pen-paper-various_marks_and_lines.wav](https://commons.wikimedia.org/wiki/File:292934-152_Writing-pen-paper-various_marks_and_lines.wav) — soundsnap | CC0 |
| train rattle | “kitchen shaking from train passing.wav” — vestibule-door (via Openverse) | CC0 |

## Fonts / 字体 — SIL Open Font License 1.1

Shipped as character subsets in `film/assets/fonts/` ([`licenses/OFL-1.1.txt`](licenses/OFL-1.1.txt)); full fonts via
`python work/tools/fetch_assets.py fonts`. The two fonts with a Reserved Font Name are renamed in their subsets
(as the OFL requires of modified versions): *Letters Kai* is a subset of LXGW WenKai, *Letters Spencer* a subset
of Mrs Saint Delafield.

| Font | Used for | Copyright |
|---|---|---|
| Ma Shan Zheng 马善政楷书 | 家书 title, chapter titles, 左权's letter | © 2018 The MaShanZheng Project Authors |
| Zhi Mang Xing 志莽行书 | 林觉民's letter | © 2018 The ZhiMangXing Project Authors |
| Long Cang 龙藏体 | 宁儿's copybook | © 2018 The LongCang Project Authors |
| Yozai 悠哉字体 | 赵一曼's letter | © 2020, 2024 LXGW; original font data © Y.OzVox |
| LXGW WenKai 霞鹜文楷 (as *Letters Kai*) | punctuation in the letters, Japanese lines in the “same words” scene | © 2021–2026 LXGW, Reserved Font Names '霞鹜', '霞鶩', '落霞孤鹜', '落霞孤鶩', 'LXGW' |
| Noto Serif SC | captions, subtitles | © 2017–2024 Adobe |
| EB Garamond | English title, original-language subtitles | © 2017 The EB Garamond Project Authors |
| Pinyon Script | Ballou's letter, “same words” scene | © 2022 The PinyonScript Project Authors |
| Mrs Saint Delafield (as *Letters Spencer*) | English sheets in the “same words” scene | © 2004 Alejandro Paul, Reserved Font Name “Mrs Saint Delafield” |
| La Belle Aurore | “same words” scene | © 2010 Kimberly Geswein |
| Cedarville Cursive | Floch's letter, “same words” scene | © 2010 Kimberly Geswein |

The multilingual “same words” scene also uses fonts that ship with Windows (Segoe Script/Print, Ink Free, Lucida
Handwriting, Malgun Gothic, Nirmala UI, Segoe UI, Times New Roman). They are not included; other systems
substitute their own.

## Code & data / 代码与数据

| | Licence |
|---|---|
| [three.js](https://threejs.org) r170 (`film/lib/three.module.min.js`) | MIT — [`licenses/THREE-JS-MIT.txt`](licenses/THREE-JS-MIT.txt) |
| Stroke-order data (`film/lib/hanzi_data.js`): [Make Me a Hanzi](https://github.com/skishore/makemeahanzi) / [Hanzi Writer data](https://github.com/chanind/hanzi-writer-data), derived from Arphic PL KaitiM | Arphic Public License — [`licenses/ARPHIC-PUBLIC-LICENSE.txt`](licenses/ARPHIC-PUBLIC-LICENSE.txt) |
| [HyperFrames](https://hyperframes.heygen.com) (HTML-to-video, run via `npx`, not bundled) | see its project |

## Generated with / 生成工具

| | Model | Licence |
|---|---|---|
| Voices / 配音 | [Qwen3-TTS-12Hz-1.7B-VoiceDesign](https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign) | Apache-2.0 |
| Voice checks | [Whisper large-v3-turbo](https://huggingface.co/openai/whisper-large-v3-turbo) | MIT |
| Figure silhouettes / 人物剪影 | Z-Image Turbo (via ComfyUI) | see the model card |
