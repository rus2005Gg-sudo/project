"""Group word timings into 2-5 word caption chunks -> assets/captions.js (data for index.html)."""
import json, re

words = json.load(open("assets/words.json"))
# normalise display text (spoken "3:17" -> "03:17")
fix = {"3:17,": "03:17,", "3:17.": "03:17.", "зашел.": "зашёл.", "мое": "моё", "все,": "всё,", "спасен.": "спасён."}
items = []
for t, s, e in words:
    t = fix.get(t, t).replace('"', "").replace("«", "").replace("»", "")
    items.append([t.upper(), s, e])

KEY = [("НЕ ЗАХОДИ", "y"), ("НЕ СМОТРИ", "r"), ("НЕ ОТВЕЧАЙ", "y"), ("НЕ ВЫХОДИ", "r"), ("ТЫ УЖЕ ВЫШЕЛ", "r")]
segs, cur = [], []
for i, (t, s, e) in enumerate(items):
    cur.append([t, s, e])
    gap = items[i + 1][1] - e if i + 1 < len(items) else 9
    if re.search(r"[.:!?,]$", t) or gap > 0.5:
        segs.append(cur); cur = []
if cur: segs.append(cur)
# glue 1-word segments to the neighbour that is closer in time (keeps 2-5 words)
merged = []
for sg in segs:
    if merged and (len(sg) == 1 or len(merged[-1]) == 1) and len(merged[-1]) + len(sg) <= 5 and sg[0][1] - merged[-1][-1][2] < 0.6:
        merged[-1].extend(sg)
    else:
        merged.append(sg)
out = []
for sg in merged:
    n = len(sg); parts = -(-n // 5) if n > 5 else 1
    size = -(-n // parts)
    for k in range(0, n, size):
        out.append(sg[k:k + size])

res = []
for k, c in enumerate(out):
    txt = " ".join(w[0] for w in c).rstrip(".,:")
    start = c[0][1]
    nxt = out[k + 1][0][1] if k + 1 < len(out) else c[-1][2] + 0.4
    end = min(max(c[-1][2] + 0.18, start + 0.5), nxt - 0.02)
    res.append({"t": txt, "s": round(start, 2), "e": round(end, 2)})
json.dump(res, open("assets/captions.json", "w"), ensure_ascii=False)
open("assets/captions.js", "w").write("window.CAPS=" + json.dumps(res, ensure_ascii=False) + ";")
print(len(res), "chunks; longest", max(len(r["t"].split()) for r in res), "words")
