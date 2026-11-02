# =====================================================================================
# CHAPTER 1 — 1861 永不消亡 · WIND: no lamp, no shadow; the voice starts over the camp,
# the words rise into the sky, the wind carries them east to Sarah's window, then turns to smoke.
S = T
CN1 = ["我最亲爱的萨拉：", "种种迹象表明，几天之内我们就要开拔——也许就是明天。", "我怕再没有机会给你写信，所以写下这几行字。等我不在了，它们会落进你的眼里。",
       "萨拉，我对你的爱永不消亡。它像粗大的缆绳把我捆住，除了上苍，没有什么能将它挣断。", "如果我回不来了，亲爱的萨拉，永远不要忘记我有多爱你。",
       "如果有一阵微风拂过你的脸颊，那就是我的呼吸。", "萨拉，不要为我的死哀伤。就当我只是走了，等着我，我们终会重逢。"]
card("c1", S + 1.0, 6.4, "第一封|永不消亡", "chapter")
card("c1", S + 3.4, 4.6, "一八六一年七月十四日　美国　华盛顿　克拉克营地", "date")
snd("assets/audio/music/m_air.wav", S + 0.8, 0.3, dur=78, media=0.0, fin=3.0, fout=6.0, kind="music")
sp = say("ballou", S + 5.6, [1.3, 1.0, 2.2, 1.6, 1.2, 1.2], CN1)
card("c1", sp[1][0] + 0.2, 6.2, "沙利文·巴卢，三十二岁，律师，北方军少校。<br>写给妻子萨拉。他们有两个年幼的儿子。", "small")
sky0 = sp[1][0] - 0.4
fl0 = sp[3][1] + 0.7
home0 = sp[4][1] + 0.9
night0 = sp[5][1] + 1.6
B1 = sp[6][1] + 2.6
seq(S, [
    (sky0, "c1_camp", "c1_camp", {}, ("dissolve", 1.2), None),
    (fl0, "c1_sky", "c1_sky", {}, ("dissolve", 1.4), hand_lines(VOICES["ballou"]["lines"], sp, sky0)),
    (home0, "c1_flight", "c1_flight", {}, ("dissolve", 1.4), None),
    (night0, "c1_home", "c1_home", {"breezeAt": r(sp[5][0] + 1.0 - home0)}, ("dissolve", 1.6), None),
    (B1, "c1_home_n", "c1_home", {"night": True}, ("dissolve", 2.2), None),
])
bed("assets/audio/sfx/crickets.wav", S, fl0, 0.28, 29, fin=2.0)
bed("assets/audio/sfx/wind_warm.wav", S, night0, 0.22, 38, fin=2.0)
bed("assets/audio/sfx/wind_warm.wav", fl0 - 0.5, home0 + 0.5, 0.3, 38)
bed("assets/audio/sfx/crickets.wav", night0, B1 + 0.6, 0.2, 29)
shot("c1_battle", "c1_battle", B1, 10.0, {"dur": 10.0}, tin=("dissolve", 1.6))
bed("assets/audio/sfx/wind_warm.wav", B1 - 1, B1 + 10, 0.38, 38)
for k in range(8):
    snd("assets/audio/sfx/cannon.wav", B1 + 0.8 + k * 10 / 9, 0.55 if k % 2 else 0.4)
card("c1", B1 + 1.4, 7.6, "“双方读的是同一本《圣经》，向同一个上帝祈祷，<br>都祈求他帮助自己打败对方。”", "quote", sub="——林肯，1865")
E1 = B1 + 10.0
shot("c1_end", "c1_home", E1, 18.0, {"night": True}, tin=("dissolve", 1.6))
bed("assets/audio/sfx/crickets.wav", E1, E1 + 18, 0.16, 29)
card("c1", E1 + 1.0, 5.2, "七天后，第一次布尔溪战役。一发炮弹击碎了他的腿。<br>一周后，他死在野战医院。", "card")
card("c1", E1 + 6.8, 5.0, "这封信从未寄出。<br>人们在他的遗物里找到它，交给了萨拉。", "card")
card("c1", E1 + 12.4, 5.0, "萨拉终身未再嫁。<br>她去世后，与他葬在了一起。", "card")
T = E1 + 18.0

# =====================================================================================
# CHAPTER 2 — 1911 纸短情长 · INK: the moon becomes a drop of ink; the handkerchief is the whole stage.
# who he was, and what happened, is told only after the cloth has burned.
S = T
shot("c2_moon", "c2_moon", S, 10.0, tin=("dissolve", 1.2))
bed("assets/audio/sfx/waves.wav", S - 0.5, S + 10.2, 0.4, 33)
card("c2", S + 1.0, 4.6, "一九一一年四月二十四日　夜　香港", "date")
C = S + 10.0
snd("assets/audio/music/m_chopin.wav", C + 3.0, 0.36, dur=120, media=0.0, fin=3.0, fout=6.0, kind="music")
card("c2", C + 1.8, 5.6, "第二封|纸短情长", "chapter_dark")
card("c2", C + 4.6, 4.4, "林觉民，写给妻子陈意映。", "small_dark")
sp = say("lin", C + 8.6, [1.4, 1.2, 1.8, 1.6, 2.2, 1.0, 1.8], None)
lin = VOICES["lin"]["lines"]
burn = sp[7][1] + 1.6 - C
paints = [
    {"tex": "ink_city", "from": r(sp[4][0] + 2.4 - C), "to": r(sp[4][1] + 0.6 - C), "seed": 3, "grow": 3.0},
    {"tex": "ink_plum", "from": r(sp[5][0] - 0.4 - C), "blurFrom": r(sp[6][0] + 0.2 - C), "to": r(sp[6][1] + 0.4 - C), "seed": 2, "grow": 4.0},
]
blots = [{"t": r(sp[2][0] + 1.6 - C), "x": 0.7, "y": 0.42, "r": 70}, {"t": r(sp[6][0] + 0.6 - C), "x": 0.36, "y": 0.58, "r": 60}]
CL = burn + 22.0
shot("c2_cloth", "c2_cloth", C, CL, {"dropAt": 0.15, "writeFrom": r(sp[0][0] - C - 0.3), "paints": paints, "blots": blots, "burnAt": r(burn)}, tin=("cut", 0.0), lines=hand_lines(lin, sp, C))
snd("assets/audio/sfx/pen2.wav", sp[0][0], 0.1, dur=sp[3][1] - sp[0][0], fin=0.6, fout=1.0)
snd("assets/audio/sfx/pen2.wav", sp[7][0], 0.1, dur=sp[7][1] - sp[7][0], media=6, fin=0.4, fout=0.8)
snd("assets/audio/sfx/fire_city.wav", sp[4][0] + 2.4, 0.2, dur=sp[4][1] - sp[4][0], fin=1.5, fout=1.5)
snd("assets/audio/sfx/paper_burn.wav", C + burn, 0.55, dur=7.0, fin=0.4, fout=1.5)
bed("assets/audio/sfx/fire_city.wav", C + burn + 1.0, C + CL, 0.45, 44, fin=3.0, fout=2.5)
for k, dt in enumerate([3.0, 4.1, 4.8, 6.3, 7.4, 9.0]):
    snd("assets/audio/sfx/gunshot_far.wav", C + burn + dt, 0.35 if k % 2 else 0.25)
card("c2", C + burn + 4.0, 6.0, "写下这封信三天后，林觉民参加广州起义。<br>他受伤被俘，从容就义，年仅二十四岁。", "card")
card("c2", C + burn + 10.6, 4.8, "这方手帕，后来辗转送到了陈意映手中。", "card")
card("c2", C + burn + 16.0, 5.0, "两年后，陈意映郁郁而终。", "card")
T = C + CL

# =====================================================================================
# CHAPTER 3 — 1914 直到最后一刻 · CROSS-SECTION + CLOCK: the verdict first, then the night counted down;
# the camera tracks across no man's land to the other dugout; at Christmas both sides climb out.
S = T
shot("black_c3v", "black", S, 13.0, tin=("dissolve", 1.0))
card("c3", S + 0.8, 11.6, "一九一四年十二月三日　夜　法国　凡尔格雷", "date")
card("c3", S + 1.4, 5.0, "一周前，德军突袭了他们的战壕。<br>弗洛克下士被俘，又在混乱中逃了回来。", "black")
card("c3", S + 6.8, 5.6, "他和二十三名战友被控“临阵脱逃”。<br>今晚，军事法庭判处其中六人死刑。", "black")
A = S + 13.0
bed("assets/audio/sfx/rain.wav", A - 1.0, A + 75, 0.4, 44, fin=2.0)
CN3 = ["我亲爱的露西：", "当这封信到你手里的时候，我已经被枪决了。", "我并不比别人更有罪，但他们需要一个“榜样”。", "我匆匆向你作最后的告别，眼里含着泪，心里满是痛苦。",
       "我跪下来，卑微地求你原谅，原谅我将带给你的一切悲伤。", "我死得清白。", "我最后的念头是你，直到最后一刻。"]
card("c3", A + 0.8, 6.0, "第三封|直到最后一刻", "chapter")
card("c3", A + 2.0, 4.0, "凌晨三点", "time")
sp = say("floch", A + 8.0, [0.9, 1.2, 1.8, 0.8, 1.8, 1.4], CN3)
card("c3", sp[0][0] + 0.2, 4.6, "亨利·弗洛克，三十三岁。写给妻子露西。", "small")
snd("assets/audio/sfx/pen.wav", sp[0][0], 0.16, dur=sp[6][1] - sp[0][0], fin=0.4, fout=0.8)
L3 = sp[3][0] - 0.5
B3 = sp[4][1] + 0.8
truck0 = sp[6][1] + 1.6
X3 = truck0 + 12.0
FR = [-9.6, -1.35, 7.4, -9.6, -1.55, -3]
DE = [9.6, -1.35, 7.4, 9.6, -1.55, -3]
seq(A, [
    (L3, "c3_night", "c3_section", {"mode": "night", "cam": [[0, -4, 0.6, 17] + [-4, -0.6, -3], [7.0] + FR, [L3 - A] + [-9.4, -1.4, 6.9, -9.4, -1.6, -3]]}, ("dissolve", 1.4), None),
    (B3, "c3_letter", "c3_letter", {}, ("dissolve", 0.9), hand_lines(VOICES["floch"]["lines"], sp, L3)),
    (X3, "c3_night_b", "c3_section", {"mode": "night", "cam": [[0] + FR, [truck0 - B3] + FR, [truck0 - B3 + 7.0] + DE, [X3 - B3] + [9.5, -1.4, 6.9, 9.5, -1.6, -3]]}, ("dissolve", 0.9), None),
])
card("c3", sp[5][0] - 0.6, 3.6, "清晨六点", "time")
card("c3", truck0 + 6.4, 5.4, "几百米外，对面的战壕里，<br>也有人点着蜡烛，给家里写信。", "card")
D3 = X3
volley = 7.0
card("c3", D3 + 1.2, 4.6, "清晨七点半", "time")
shot("c3_dawn", "c3_dawn", D3, 11.0, {"volleyAt": volley}, tin=("dissolve", 1.6))
bed("assets/audio/sfx/wind_cold.wav", D3 - 1.0, D3 + 11, 0.25, 38)
snd("assets/audio/sfx/volley.wav", D3 + volley - 0.12, 0.85)
K3 = D3 + 11.0
shot("black_c3a", "black", K3, 6.0, tin=("cut", 0.0))
card("c3", K3 + 0.8, 4.6, "六个人，倒在了自己的军队枪下。", "black")
X4 = K3 + 6.0
TR = 32.0
shot("c3_truce", "c3_section", X4, TR, {"mode": "truce", "meetAt": 7.0, "menOut": 21.0, "parapetOut": 24.0, "cam": [[0, 0, 1.0, 20, 0, 0.3, -3], [TR, 0, 0.9, 15.5, 0, 0.4, -3]]}, tin=("dissolve", 1.8))
card("c3", X4 + 1.2, 4.4, "二十天后，平安夜。", "date")
bed("assets/audio/sfx/wind_cold.wav", X4, X4 + TR, 0.16, 38)
snd("assets/audio/music/m_stille.wav", X4 + 2.0, 0.42, dur=TR - 1.0, media=0.0, fin=3.0, fout=6.0, kind="music")
card("c3", X4 + 8.6, 6.6, "西线的许多地方，两边的士兵走出战壕，<br>互道圣诞快乐，给对方看自己家人的照片。", "card")
card("c3", X4 + 22.2, 5.6, "第二天，他们回到战壕，继续向对方开枪。", "card")
C3b = X4 + TR
shot("black_c3b", "black", C3b, 12.0)
card("c3", C3b + 0.8, 4.8, "一九二一年，法国最高法院撤销原判，宣告六人无罪。", "black")
card("c3", C3b + 6.2, 5.0, "那时战争已经结束。<br>一千万名士兵，再也没有回家。", "black")
T = C3b + 12.0

# =====================================================================================
# CHAPTER 4 — 1936 赶快成人 · COPYBOOK, told backwards: the son copying first; then the train,
# the mother's pencil, the photograph, the boy at the door; back to the son's page and the name.
S = T
SON_LINE = "母亲和你在生前是永久没有再见的机会了"
shot("c4_son", "c4_book", S, 15.0, {"who": "son"}, tin=("dissolve", 1.2), lines=[{"text": SON_LINE, "start": 1.6, "end": 12.0}])
snd("assets/audio/music/m_satie.wav", S + 0.5, 0.42, dur=104, media=0.0, fin=3.0, fout=7.0, kind="music")
snd("assets/audio/sfx/pen.wav", S + 1.5, 0.16, dur=10.5, fin=0.4, fout=0.8)
card("c4", S + 1.0, 4.4, "多年以后。", "paper")
card("c4", S + 6.4, 7.4, "一个年轻人在纪念馆里，<br>一字一字抄下母亲留给他的信。", "paper")
TR4 = S + 15.0
shot("c4_train", "c4_train", TR4, 14.0, {"flashAt": 9.0}, tin=("dissolve", 2.0))
bed("assets/audio/sfx/train_rattle.wav", TR4 - 1.0, TR4 + 14 + 62, 0.32, 12.8, fin=2.0)
snd("assets/audio/sfx/train_loco.wav", TR4 + 0.4, 0.6, fin=1.0, fout=1.5)
snd("assets/audio/sfx/whistle.wav", TR4 + 4.2, 0.35)
bed("assets/audio/sfx/wind_warm.wav", TR4, TR4 + 14, 0.22, 38)
card("c4", TR4 + 0.8, 6.0, "第四封|赶快成人", "chapter")
card("c4", TR4 + 1.8, 5.0, "一九三六年八月二日　押往珠河的火车上", "date")
card("c4", TR4 + 7.2, 6.4, "赵一曼，三十一岁，东北抗日联军的女政委。<br>负伤被俘，受尽酷刑。今天，日军要押她回珠河处决。", "small")
M4 = TR4 + 14.0
sp = say("zhao", M4 + 2.4, [1.2, 1.2, 1.8, 1.4, 1.4, 1.4], None)
snd("assets/audio/sfx/pen2.wav", sp[0][0], 0.1, dur=sp[2][1] - sp[0][0], media=8, fin=0.5, fout=0.8)
ph0 = sp[3][0] - 0.3
boy0 = sp[4][0] + 0.8
lb0 = sp[5][1] + 0.6
N4 = sp[6][1] + 1.6
lines4 = lambda st: hand_lines(VOICES["zhao"]["lines"], sp, st)
seq(M4, [
    (ph0, "c4_mother", "c4_book", {"who": "mother"}, ("dissolve", 1.2), lines4(M4)),
    (boy0, "c4_photo", "c4_photo", {}, ("dissolve", 1.2), None),
    (lb0, "c4_boy", "c4_boy", {}, ("dissolve", 1.2), None),
    (N4, "c4_mother_b", "c4_book", {"who": "mother"}, ("dissolve", 1.0), lines4(lb0)),
])
NM = N4
shot("c4_name", "c4_book", NM, 21.0, {"who": "son", "name": {"text": "赵一曼", "start": 9.0, "end": 15.0}}, tin=("dissolve", 2.0), lines=[{"text": SON_LINE, "start": -20, "end": -10}])
snd("assets/audio/sfx/pen.wav", NM + 9.0, 0.22, dur=6.0, media=6, fin=0.2, fout=0.6)
card("c4", NM + 1.0, 4.6, "当天，她在珠河被日军杀害。", "paper")
card("c4", NM + 5.8, 3.2, "那个年轻人，就是宁儿。", "paper")
card("c4", NM + 9.4, 6.0, "他长大后才知道，那个叫“赵一曼”的英雄，就是他的妈妈。", "paper")
card("c4", NM + 15.6, 5.2, "抄完信，他用钢笔，在自己的手臂上，<br>刺下了这三个字。", "paper")
T = NM + 21.0

# =====================================================================================
# CHAPTER 5 — 1942 念念 · THE READER: told from the receiving end, in daylight.
# only after the reading do we learn where it came from, and that the writer was already dead.
S = T
shot("c5_room", "c5_yanan", S, 14.0, {"cx0": -0.8, "cx1": 0.2, "z0": 10.5, "z1": 9.2}, tin=("dissolve", 1.6))
bed("assets/audio/sfx/wind_warm.wav", S, S + 14, 0.12, 38)
snd("assets/audio/music/m_largo.wav", S + 1.0, 0.5, dur=96, media=24.0, fin=4.0, fout=6.0, kind="music")
card("c5", S + 1.0, 6.0, "第五封|念念", "chapter")
card("c5", S + 2.2, 4.8, "一九四二年　夏　延安", "date")
card("c5", S + 7.4, 5.6, "刘志兰收到了丈夫从前线寄来的信。<br>女儿北北，刚满两岁。", "small")
sp = say("zuo", S + 13.0, [2.0], None)
LT = sp[0][0] - 0.6
RM = sp[0][1] + 1.0
PH5 = sp[1][1] + 2.6
seq(S + 14.0 if LT < S + 14.0 else LT, [])
shots[-1]["dur"] = r(LT - shots[-1]["start"])
seq(LT, [
    (RM, "c5_letter", "c5_letter", {"ambient": 0.5, "lightAmt": 0.75, "light": [0.5, 0.65], "lightFall": 0.35}, ("dissolve", 1.0), hand_lines(VOICES["zuo"]["lines"], sp, LT)),
    (PH5, "c5_child", "c5_yanan", {"cx0": 1.4, "cx1": 1.9, "z0": 7.6, "z1": 6.9}, ("dissolve", 1.2), None),
    (PH5 + 9.0, "c5_photo", "c5_photo", {}, ("dissolve", 1.4), None),
])
card("c5", PH5 + 1.6, 5.0, "这是他们一家唯一的一张合影。", "card")
TH = PH5 + 9.0
shot("c5_taihang", "c5_taihang", TH, 12.0, tin=("dissolve", 1.6))
bed("assets/audio/sfx/wind_mountain.wav", TH - 0.5, TH + 12, 0.3, 38)
card("c5", TH + 1.0, 5.0, "这封信写于五月二十二日，太行山。<br>写信的人，是八路军副参谋长左权。", "card")
card("c5", TH + 6.6, 4.4, "三天后，日军合围。", "card")
BT = TH + 12.0
shot("c5_battle", "c5_battle", BT, 8.0, {"dur": 8.0}, tin=("dissolve", 1.2))
bed("assets/audio/sfx/wind_mountain.wav", BT - 1, BT + 8, 0.3, 38)
snd("assets/audio/sfx/aircraft.wav", BT - 0.5, 0.5)
for k in range(6):
    snd("assets/audio/sfx/explosion.wav", BT + 0.8 + k * (8.0 / 6.5), 0.5 if k % 2 else 0.38)
DK = BT + 8.0
shot("c5_dusk", "c5_yanan", DK, 24.0, {"duskAt": 0.0, "cx0": 0.0, "cx1": -0.4, "z0": 9.6, "z1": 10.4}, tin=("dissolve", 2.0))
bed("assets/audio/sfx/wind_warm.wav", DK, DK + 24, 0.1, 38)
card("c5", DK + 1.2, 4.8, "他在十字岭指挥突围时牺牲，三十七岁。", "card")
card("c5", DK + 6.6, 4.2, "再过两天，就是北北两岁的生日。", "card")
card("c5", DK + 11.4, 5.4, "这封信寄到延安时，他已经牺牲一个多月了。", "card")
card("c5", DK + 17.6, 5.4, "这封信里，没有告别。", "card")
T = DK + 24.0
