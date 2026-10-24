"""words.json (ElevenLabs transcript, Russian) -> assets/captions.js, assets/cues.js, assets/cues.json.
Cues are found by matching spoken stems, so a re-generated voice-over only needs a re-run."""
import json, re

words = json.load(open("assets/words.json"))
def norm(s): return re.sub(r"[^a-zа-я0-9]", "", s.lower().replace("ё", "е"))
W = [(norm(t), s, e, t) for t, s, e in words]

def find(phrase, nth=0):
    p = [norm(x) for x in phrase.split()]
    cnt = 0
    for i in range(len(W) - len(p) + 1):
        if all(W[i + k][0].startswith(p[k][:5]) for k in range(len(p))):
            if cnt == nth: return i
            cnt += 1
    raise KeyError(phrase)
T = lambda p, n=0: round(W[find(p, n)][1], 2)

t = {
    "hookB": T("ты дома"), "minutes": T("У тебя есть"), "five": T("Пять минут назад"), "stairs": T("На лестнице"),
    "yard": T("Во дворе"), "rule1": T("Правило первое"), "lightsOff": round(T("выключи свет") + 0.45, 2),
    "curtains": T("Задерни шторы"), "phone": T("Телефон на"), "rule2": T("Правило второе"), "water": T("набери воду"),
    "hour": T("Через час"), "rule3": T("Правило третье"), "rule4": T("Правило четвертое"),
    "peephole": T("в глазок"), "docs": T("документы"), "charger": T("зарядка"), "kit": T("аптечка"),
    "cans": T("консервы"), "knife": T("нож"), "heard": T("И тут я"), "knock": T("Три тихих"),
    "voice": T("потом голос"), "momCalled": T("Но мама звонила"), "notOpen": T("Я не открыл"),
    "key": T("повернулся ключ"), "chain": T("Цепочка"), "rule5": T("Правило пятое"),
    "stepBack": T("Я отошел"), "steps": T("шаги были"), "behind": T("за спиной"),
}
t["wardrobe"] = round(t["rule3"] + 2.0, 2)
t["sofa"] = round(t["wardrobe"] + 1.8, 2)
last = W[-1][2]
CUE = {"t": t, "endBlack": round(last + 1.0, 2)}
CUE["dur"] = round(CUE["endBlack"] + 2.5, 1)
json.dump(CUE, open("assets/cues.json", "w"), indent=1)
open("assets/cues.js", "w").write("window.CUE=" + json.dumps(CUE) + ";window.__DUR=" + str(CUE["dur"]) + ";")

# captions: <= 3 words per chunk, big
items = [[w[3].replace('"', "").upper(), w[1], w[2]] for w in W]
segs, cur = [], []
for i, (txt, s, e) in enumerate(items):
    cur.append([txt, s, e])
    gap = items[i + 1][1] - e if i + 1 < len(items) else 9
    if re.search(r"[.:!?,]$", txt) or gap > 0.45:
        segs.append(cur); cur = []
if cur: segs.append(cur)
out = []
for sg in segs:
    n = len(sg); parts = -(-n // 3) if n > 3 else 1
    size = -(-n // parts)
    for k in range(0, n, size):
        out.append(sg[k:k + size])
caps = []
for k, c in enumerate(out):
    txt = " ".join(w[0] for w in c).rstrip(".,:;")
    start = c[0][1]
    nxt = out[k + 1][0][1] if k + 1 < len(out) else c[-1][2] + 0.4
    end = min(max(c[-1][2] + 0.2, start + 0.5), nxt - 0.02)
    caps.append({"t": txt, "s": round(start, 2), "e": round(end, 2)})
open("assets/captions.js", "w").write("window.CAPS=" + json.dumps(caps, ensure_ascii=False) + ";")
print("duration", CUE["dur"], "captions", len(caps))
print(t)
