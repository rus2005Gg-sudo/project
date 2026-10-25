import json, os, sys
# sentences in order (one per detected speech segment)
S = [
 "Свет погас во всём городе.",
 "Не на час.",
 "На несколько дней.",
 "Что делать, если ты в блэкауте?",
 "Шесть правил.",
 "Первое.",
 "Не открывай холодильник.",
 "Закрытый, он держит холод часов шесть.",
 "Второе.",
 "Набери воды.",
 "Пока есть давление.",
 "Ванна, кастрюли, бутылки.",
 "Через сутки насосы встанут.",
 "Третье.",
 "Береги телефон.",
 "Авиарежим, яркость на минимум.",
 "Это твоя связь.",
 "Четвёртое.",
 "Фонарик лучше свечи.",
 "Свечи — это пожары.",
 "Пятое.",
 "Тепло.",
 "Одевайся слоями.",
 "Живи в одной комнате.",
 "Шестое.",
 "Радио.",
 "Батарейки в приёмник.",
 "Вышки продержатся несколько часов, и связи не будет.",
 "А теперь проверь.",
 "Сколько воды у тебя дома?",
 "Меньше десяти литров?",
 "Сохрани это видео.",
]
OFF = 0.35
seg = json.load(open("assets/seg.json")) if os.path.exists("assets/seg.json") else None
if seg is None or len(seg) != len(S):
    print("SEGMENTS", None if seg is None else len(seg), "expected", len(S)); sys.exit(1)
seg = [[a + OFF, b + OFF] for a, b in seg]
idx = {s: i for i, s in enumerate(S)}
def st(s): return seg[idx[s]][0]
def en(s): return seg[idx[s]][1]
e = dict(r1=st("Первое."), r2=st("Второе."), r3=st("Третье."), r4=st("Четвёртое."), r5=st("Пятое."), r6=st("Шестое."),
         chk=st("А теперь проверь."), save=st("Сохрани это видео."))
e["twist"] = en("Сохрани это видео.") + 0.3
e["end"] = e["twist"] + 2.0
dur = e["end"] + 3.8 + 2.6
# captions: group sentences into on-screen chunks
G = [(0, 1, "Свет погас<br/>во <span class='y'>всём</span> городе"), (1, 3, "Не на час.<br/>На <span class='r'>несколько дней</span>"),
     (3, 5, "Что делать,<br/>если ты в блэкауте?"), (5, 5, None),
     (6, 8, "Закрытый холодильник<br/>держит холод <span class='y'>~6 часов</span>"),
     (9, 12, "Набери воды,<br/>пока есть <span class='y'>давление</span>"), (12, 13, "Через сутки<br/>насосы <span class='r'>встанут</span>"),
     (14, 16, "Авиарежим,<br/>яркость на <span class='y'>минимум</span>"), (16, 16, "Это твоя <span class='y'>связь</span>"),
     (18, 19, "Фонарик<br/>лучше <span class='y'>свечи</span>"), (19, 19, "Свечи — это <span class='r'>пожары</span>"),
     (21, 23, "Одевайся <span class='y'>слоями</span>.<br/>Живи в одной комнате"),
     (26, 27, "Батарейки<br/>в <span class='y'>приёмник</span>"), (27, 27, "Вышки продержатся<br/>несколько часов"),
     (28, 29, "А теперь<br/><span class='y'>проверь</span>"), (29, 30, "Сколько воды<br/>у тебя дома?"), (30, 31, "Меньше <span class='r'>10 литров</span>?<br/>Сохрани видео")]
caps = []
for a, b, h in G:
    if h is None: continue
    s0 = seg[a][0]; e0 = seg[b][1]
    caps.append([round(s0, 2), round(e0 + 0.15, 2), h])
# merge: make sure no overlap
for i in range(len(caps) - 1):
    if caps[i][1] > caps[i + 1][0] - 0.02: caps[i][1] = caps[i + 1][0] - 0.02
cue = dict(e={k: round(v, 2) for k, v in e.items()}, dur=round(dur, 2), caps=caps)
open("assets/cues.js", "w", encoding="utf8").write("window.CUE=" + json.dumps(cue, ensure_ascii=False) + ";")
print(json.dumps(cue["e"]), cue["dur"])
