"""Build assets/cues.js (event times + caption chunks) from assets/seg.json (one [start,end] per spoken sentence).
If seg.json is missing, a placeholder timing is estimated from text length so the scene can be previewed before the voice exists."""
import json, os, sys

# one entry per spoken paragraph (the TTS text uses exactly these paragraphs, blank-line separated)
S = [
 "В школе начался пожар.",
 "Звенит сигнал тревоги.",
 "Что делать? Шесть правил.",
 "Первое.",
 "Не паникуй и не бери вещи.",
 "Рюкзак не стоит твоей жизни.",
 "Второе.",
 "Потрогай дверь тыльной стороной ладони.",
 "Горячая? Не открывай.",
 "Третье.",
 "Дым поднимается вверх.",
 "Пригнись и дыши через мокрую ткань.",
 "Четвёртое.",
 "Не пользуйся лифтом.",
 "Только лестница.",
 "Пятое.",
 "Закрывай двери за собой.",
 "Огонь любит воздух.",
 "Шестое.",
 "Выйди на улицу и позвони сто двенадцать.",
 "И не возвращайся за вещами.",
 "А теперь проверь.",
 "Ты знаешь, где ближайший запасной выход?",
 "Нет? Сохрани это видео.",
]
CAP = {
 0: "В школе начался<br/><span class='r'>пожар</span>",
 1: "Звенит <span class='y'>сигнал</span><br/>тревоги",
 2: "Что делать?<br/>Шесть <span class='y'>правил</span>",
 4: "Не паникуй.<br/>Не бери <span class='y'>вещи</span>",
 5: "Рюкзак не стоит<br/>твоей <span class='r'>жизни</span>",
 7: "Потрогай дверь<br/><span class='y'>тыльной стороной</span><br/>ладони",
 8: "Горячая?<br/><span class='r'>Не открывай</span>",
 10: "Дым идёт <span class='y'>вверх</span>",
 11: "Пригнись.<br/>Дыши через<br/><span class='y'>мокрую ткань</span>",
 13: "Не пользуйся<br/><span class='r'>лифтом</span>",
 14: "Только <span class='y'>лестница</span>",
 16: "Закрывай <span class='y'>двери</span><br/>за собой",
 17: "Огонь любит<br/><span class='r'>воздух</span>",
 19: "Выйди на улицу.<br/>Звони <span class='y'>112</span>",
 20: "Не возвращайся<br/>за <span class='r'>вещами</span>",
 21: "А теперь<br/><span class='y'>проверь</span>",
 22: "Где ближайший<br/><span class='y'>запасной выход</span>?",
 23: "Не знаешь?<br/>Сохрани <span class='y'>видео</span>",
}
OFF = 0.35
path = "assets/seg.json"
seg = json.load(open(path)) if os.path.exists(path) else None
placeholder = False
if seg is None or len(seg) != len(S):
    if seg is not None:
        print("SEGMENTS", len(seg), "expected", len(S)); sys.exit(1)
    placeholder = True; seg = []; t = 0.0
    for s in S:
        d = max(0.7, len(s) * 0.062); seg.append([t, t + d]); t += d + (0.18 if s.endswith(".") and len(s) < 12 else 0.34)
seg = [[a + OFF, b + OFF] for a, b in seg]
st = lambda i: seg[i][0]
en = lambda i: seg[i][1]
e = dict(alarm=st(1), r1=st(3), drop=st(5), r2=st(6), touch=st(7), hot=st(8), r3=st(9), up=st(10), crouch=st(11), r4=st(12), nolift=st(13), stairs=st(14), r5=st(15), close=st(16), air=st(17), r6=st(18), call=st(19), noret=st(20), chk=st(21), where=st(22), save=st(23))
e["twist"] = en(23) + 0.25
e["end"] = e["twist"] + 1.6
dur = e["end"] + 3.6 + 2.4
caps = []
for i, h in CAP.items():
    caps.append([round(seg[i][0] - 0.03, 2), round(seg[i][1] + 0.18, 2), h])
caps.sort()
for i in range(len(caps) - 1):
    if caps[i][1] > caps[i + 1][0] - 0.02: caps[i][1] = round(caps[i + 1][0] - 0.02, 2)
cue = dict(e={k: round(v, 2) for k, v in e.items()}, dur=round(dur, 2), caps=caps, seg=[[round(a, 2), round(b, 2)] for a, b in seg], placeholder=placeholder)
open("assets/cues.js", "w", encoding="utf8").write("window.CUE=" + json.dumps(cue, ensure_ascii=False) + ";")
print("placeholder" if placeholder else "real", json.dumps(cue["e"]), cue["dur"])
