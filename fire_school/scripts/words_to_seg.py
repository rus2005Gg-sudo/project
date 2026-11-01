"""assets/words.json (ElevenLabs Scribe word timings) -> assets/seg.json, one [start,end] per sentence of make_cues.S"""
import json, re, importlib.util
spec = importlib.util.spec_from_file_location("mc", "scripts/make_cues.py")
src = open("scripts/make_cues.py", encoding="utf8").read(); S = eval(src[src.index("S = [") + 4: src.index("]\n", src.index("S = [")) + 1])
w = json.load(open("assets/words.json")); w = [x for x in (w["words"] if isinstance(w, dict) else w) if x.get("type", "word") == "word"]
seg, i = [], 0
for s in S:
    n = len(s.split()); a, b = w[i], w[i + n - 1]; seg.append([round(a["start"], 3), round(b["end"], 3)]); i += n
assert i == len(w), (i, len(w))
json.dump(seg, open("assets/seg.json", "w")); print(len(seg), "segments, last end", seg[-1][1])
