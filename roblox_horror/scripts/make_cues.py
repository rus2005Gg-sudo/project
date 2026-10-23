"""words.json (ElevenLabs transcript) -> assets/captions.js, assets/cues.js, assets/cues.json.
Every cue is found by matching a spoken phrase, so swapping in a new voice-over only needs a re-run."""
import json, re, sys

words = json.load(open("assets/words.json"))
norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower().replace("0", "zero"))
W = [(norm(t), s, e, t) for t, s, e in words]

def find(phrase, nth=0):
    p = [norm(x) for x in phrase.split()]
    cnt = 0
    for i in range(len(W) - len(p) + 1):
        if all(W[i + k][0] == p[k] for k in range(len(p))):
            if cnt == nth:
                return i
            cnt += 1
    raise KeyError(phrase)

def T(p, n=0): return round(W[find(p, n)][1], 2)
def E(p, n=0): return round(W[find(p, n) + len(p.split()) - 1][2], 2)

t = {
    "intro2": T("It was three"), "sun": T("The sun"), "empty": T("And the server"),
    "chat1": T("Then the chat"), "welcome": T("Welcome back"), "zeroAppear": T("A player stood"),
    "smiling": T("Smiling"), "hisName": T("His name"), "rule1": T("Rule one"), "blinked": T("I blinked"),
    "closer": T("He was"), "rule2": T("Rule two"), "typed": T("I typed"), "who": T("Who"),
    "musicSlow": T("The music slowed"), "run": T("I ran"), "lava": T("Over the lava"),
    "everyTime": T("Every time"), "there": T("he was there"), "skyRed": T("The sky turned red"),
    "platforms": T("The platforms"), "rule3": T("Rule three"), "pressed": T("I pressed leave"),
    "button": T("The button"), "looked": T("I looked at"), "gone": T("His name was gone"),
    "said": T("And it said"), "chat2": T("The chat said", 0) if False else T("The chat said", 0),
    "farAway": T("And far away"), "joined": T("someone new"),
}
try:
    t["chat2"] = T("The chat said", 1)
except KeyError:
    t["chat2"] = T("The chat said", 0)
last = W[-1][2]
CUE = {
    "t": t,
    "musicSlow": t["musicSlow"], "sky_red": t["skyRed"], "noticeZero": t["zeroAppear"], "run": t["run"],
    "skyRedEnd": round(t["rule3"] - 0.4, 2), "freezeStart": t["rule1"], "scaredFrom": t["blinked"],
    "numbFrom": t["said"], "nameSwap": t["said"] + 0.6, "heroGone": t["farAway"], "zeroAppear": t["zeroAppear"],
    "zeroGone": t["gone"] + 0.5, "zeroEvil": t["skyRed"], "newPlayer": t["joined"] + 0.2, "finalMsg": t["chat2"],
    "endBlack": round(last + 1.1, 2), "rule1": t["rule1"], "rule2": t["rule2"], "rule3": t["rule3"],
    "menuOn": t["pressed"], "menuOff": t["looked"] - 0.2, "leaveGone": t["button"], "vanishFrom": t["platforms"],
    "flashes": [t["welcome"], t["blinked"] + 0.15, t["closer"], t["run"], t["skyRed"], t["button"] + 0.2, t["said"] + 0.6],
    "dips": [t["blinked"] + 0.18, t["rule2"] - 0.15, t["skyRed"] - 0.1, t["said"] + 0.55, t["farAway"] - 0.05],
    "glitchWin": [[t["musicSlow"], t["musicSlow"] + 1.4], [t["button"], t["button"] + 1.4], [t["said"] + 0.55, t["said"] + 1.8], [t["skyRed"], t["skyRed"] + 1.2]],
    "shakes": [[t["zeroAppear"], 0.5, 0.4], [t["blinked"] + 0.2, 0.9, 0.3], [t["closer"], 0.5, 0.3], [t["run"], 0.6, 0.5], [t["skyRed"], 1.2, 0.6], [t["said"] + 0.6, 1.2, 0.5]],
    "zeroKeys": [
        [0, 0, 0], [t["blinked"] + 0.12, 0, 0], [t["blinked"] + 0.3, 0, 11],
        [t["rule2"] - 0.2, 0, 11], [t["rule2"], 0, 14], [t["who"] + 0.2, 0, 14], [t["who"] + 0.5, 0, 18],
        [t["run"], 0, 18], [t["run"] + 40, 0, 18],
    ],
    "zeroFollow": [[t["run"], 24], [t["lava"], 18], [t["everyTime"], 12], [t["there"], 8], [t["skyRed"], 6], [t["rule3"], 4.5], [t["pressed"], 3.5], [t["gone"], 3.5]],
    "chat": [
        {"t": 0.6, "sys": True, "text": "Welcome to Sunny Obby 2012!"},
        {"t": t["welcome"] + 0.25, "name": "Player_0", "color": "#ff6a6a", "text": "Welcome back."},
        {"t": t["who"] + 0.35, "name": "YOU_2012", "color": "#4aa8ff", "text": "Who?"},
        {"t": t["who"] + 1.9, "name": "Player_0", "color": "#ff6a6a", "text": "You know me."},
        {"t": t["chat2"] + 0.3, "name": "YOU_2012", "color": "#4aa8ff", "text": "Welcome back."},
        {"t": t["joined"] + 0.35, "sys": True, "text": "Player_0 joined the server."},
    ],
}
json.dump(CUE, open("assets/cues.json", "w"), indent=1)
open("assets/cues.js", "w").write("window.CUE=" + json.dumps(CUE) + ";window.__DUR=" + str(round(CUE["endBlack"] + 2.6, 1)) + ";")

# ---------------- captions: up to 3 words per chunk
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
    txt = " ".join(w[0] for w in c).rstrip(".,:")
    start = c[0][1]
    nxt = out[k + 1][0][1] if k + 1 < len(out) else c[-1][2] + 0.4
    end = min(max(c[-1][2] + 0.2, start + 0.5), nxt - 0.02)
    caps.append({"t": txt, "s": round(start, 2), "e": round(end, 2)})
open("assets/captions.js", "w").write("window.CAPS=" + json.dumps(caps, ensure_ascii=False) + ";")
print("cues ok; duration", round(CUE["endBlack"] + 2.6, 1), "| captions", len(caps))
for k, v in t.items():
    print(f"{k:10s} {v}")
