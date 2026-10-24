"""Narrator word timings -> assets/cues.js + assets/captions.js (narrator + radio subtitles)."""
import json, re
words = json.load(open("assets/words.json"))
def norm(s): return re.sub(r"[^a-zа-я0-9]", "", s.lower().replace("ё", "е"))
W = [(norm(t), s, e, t) for t, s, e in words]
def find(phrase, nth=0):
    p = [norm(x) for x in phrase.split()]; c = 0
    for i in range(len(W) - len(p) + 1):
        if all(W[i + k][0].startswith(p[k][:5]) for k in range(len(p))):
            if c == nth: return i
            c += 1
    raise KeyError(phrase)
NS = 30.2            # narrator starts here (after the pause)
RS = 6.0             # radio alert starts
D1 = 18.83; D2 = 3.28
N = lambda p, n=0: round(NS + W[find(p, n)][1], 2)
last = NS + W[-1][2]
R2S = round(last + 1.2, 2)
flash = round(N("Отвернись") + 0.2, 2)
E = {
  "s2": 3.0, "s3": 5.0, "radioStart": RS, "radioEnd": round(RS + D1, 2), "s5": 10.5, "s6": 13.0, "s7": 16.0,
  "mStart": 13.0, "brake": 17.0, "stop": 22.0, "exit": 22.2, "pause": 26.0, "ns": NS,
  "rule1": N("Правило первое"), "flash": flash, "turn": round(flash - 0.35, 2),
  "rule2": N("Правило второе"), "run": round(N("Правило второе") + 0.4, 2),
  "rule3": N("Правило третье"), "lie": N("ляг на"), "shock": round(flash + 19.2, 2),
  "rule4": N("Правило четвертое"), "get": round(N("Правило четвертое") - 0.2, 2), "door": round(N("Закрой двери") + 0.3, 2),
  "rule5": N("Правило пятое"), "undress": N("сними одежду"), "radioOn": N("включи радио"), "fin": N("Я включил"),
  "radio2": R2S,
}
endBlack = round(R2S + D2 + 1.6, 2)
CUE = {"e": E, "endBlack": endBlack, "dur": round(endBlack + 2.2, 1), "ns": NS, "d1": D1, "d2": D2}
open("assets/cues.js", "w").write("window.CUE=" + json.dumps(CUE) + ";window.__DUR=" + str(CUE["dur"]) + ";")
json.dump(CUE, open("assets/cues.json", "w"), indent=1)

# narrator captions (<=4 words)
items = [[w[3].replace('"', "").upper(), NS + w[1], NS + w[2]] for w in W if norm(w[3])]
segs, cur = [], []
for i, (txt, s, e) in enumerate(items):
    cur.append([txt, s, e]); gap = items[i + 1][1] - e if i + 1 < len(items) else 9
    if re.search(r"[.:!?]$", txt) or gap > 0.5: segs.append(cur); cur = []
if cur: segs.append(cur)
out = []
for sg in segs:
    n = len(sg); parts = -(-n // 4) if n > 4 else 1; size = -(-n // parts)
    for k in range(0, n, size): out.append(sg[k:k + size])
caps = []
for k, c in enumerate(out):
    txt = " ".join(w[0] for w in c).rstrip(".,:;").replace(" - ", " — ")
    start = c[0][1]; nxt = out[k + 1][0][1] if k + 1 < len(out) else c[-1][2] + 0.5
    caps.append({"t": txt, "s": round(start, 2), "e": round(min(max(c[-1][2] + 0.25, start + 0.6), nxt - 0.02), 2)})
# radio subtitles (clip start known, sentence timing estimated from character counts)
rtxt = ["ВНИМАНИЕ. ВНИМАНИЕ.", "ГОВОРИТ СИСТЕМА ОПОВЕЩЕНИЯ.", "ЗАФИКСИРОВАН ПУСК БАЛЛИСТИЧЕСКОЙ РАКЕТЫ.", "РАСЧЁТНОЕ ВРЕМЯ ДО УДАРА — ТРИ МИНУТЫ.", "ВСЕМ ГРАЖДАНАМ НЕМЕДЛЕННО ПРОСЛЕДОВАТЬ В УКРЫТИЕ.", "ПОВТОРЯЮ. ЗАФИКСИРОВАН ПУСК БАЛЛИСТИЧЕСКОЙ РАКЕТЫ.", "РАСЧЁТНОЕ ВРЕМЯ ДО УДАРА — ТРИ МИНУТЫ."]
pauses = [0.9, 0.6, 0, 0.9, 0, 0, 0]
tot = sum(len(x) for x in rtxt); avail = D1 - sum(pauses) - 0.3; t = RS + 0.15; rcaps = []
for s, p in zip(rtxt, pauses):
    d = avail * len(s) / tot; rcaps.append({"t": s, "s": round(t, 2), "e": round(t + d, 2)}); t += d + p
rcaps.append({"t": "ВНИМАНИЕ. ЗАФИКСИРОВАН ВТОРОЙ ПУСК.", "s": round(R2S + 0.1, 2), "e": round(R2S + D2 - 0.1, 2)})
open("assets/captions.js", "w").write("window.CAPS=" + json.dumps(caps, ensure_ascii=False) + ";window.RCAPS=" + json.dumps(rcaps, ensure_ascii=False) + ";")
print(json.dumps(CUE)); print(len(caps), len(rcaps))
