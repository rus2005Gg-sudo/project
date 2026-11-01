"""Mix assets/vo.mp3 (ElevenLabs voice) + ElevenLabs sound effects in assets/sfx/*.mp3 into assets/mix.wav, placed on scene events from cues.js."""
import json, os, subprocess, numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter
SR = 44100
c = json.loads(open("assets/cues.js", encoding="utf8").read()[len("window.CUE="):-1]); E = c["e"]; D = c["dur"]; N = int(SR * D)
def lp(x, f, o=2): b, a = butter(o, f / (SR / 2), "low"); return lfilter(b, a, x)
def hp(x, f, o=2): b, a = butter(o, f / (SR / 2), "high"); return lfilter(b, a, x)
def load(path):
    out = "/tmp/_sfx_tmp.wav"; subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path, "-ac", "1", "-ar", str(SR), out], check=True)
    x = wavfile.read(out)[1].astype(np.float64) / 32768.0; return x / (np.abs(x).max() + 1e-9)
def place(name, start, gain=1.0, dur=None, fi=0.05, fo=0.2, rate=1.0):
    p = "assets/sfx/%s.mp3" % name
    if not os.path.exists(p): return np.zeros(N)
    x = load(p)
    if dur:  # loop / trim to dur with fades
        n = int(dur * SR); x = np.resize(x, n); k = np.arange(n); x = x * np.minimum(1, np.minimum(k / (fi * SR + 1), (n - k) / (fo * SR + 1)))
    o = np.zeros(N); a = int(start * SR); n = max(0, min(len(x), N - a)); o[a:a + n] = x[:n]; return o * gain
def gate(a, b, fi=0.3, fo=0.4): t = np.arange(N) / SR; return np.clip((t - a) / fi, 0, 1) * np.clip((b - t) / fo, 0, 1)
A, R3, R5, R6, CHK, SV, TW, END = E["alarm"], E["r3"], E["r5"], E["r6"], E["chk"], E["save"], E["twist"], E["end"]
bed = np.zeros(N)
# beds (loops)
bed += place("alarm", A, 0.5, R6 + 0.6 - A, 0.05, 0.9)
bed += place("fire", 0, 0.30, A + 0.6, 0.05, 0.6) + place("fire", A, 0.16, R3 - A, 0.4, 0.4) + place("fire", R3 - 0.2, 0.55, R5 - R3 + 0.2, 0.5, 0.5) + place("fire", R5, 0.26, R6 - R5 + 0.2, 0.4, 0.5)
bed += place("fire", R6, 0.28, CHK - R6, 0.4, 0.8) + place("fire", CHK, 0.09, TW - CHK, 0.5, 0.5) + place("fire", TW - 0.2, 0.7, END - TW + 0.8, 0.2, 0.6)
bed += place("crowd", R6 + 0.3, 0.45, CHK - R6 + 0.2, 0.8, 0.8)
bed += place("siren", R6 + 0.2, 0.5, CHK - R6 + 0.6, 0.8, 1.2)
# spot effects
bed += place("thud", E["drop"] + 0.3 + 0.33, 0.9) + place("hiss", E["hot"] - 0.5, 0.8, 1.6, 0.05, 0.4) + place("door", R3 - 0.5, 0.8)
bed += place("cough", E["crouch"] - 0.2, 0.7) + place("steps", E["crouch"] + 0.6, 0.55, E["nolift"] - E["crouch"] - 0.4, 0.1, 0.2)
bed += place("elevator", E["nolift"] - 0.1, 0.8) + place("steps", E["stairs"] + 0.3, 0.6, R5 - E["stairs"] - 0.4, 0.05, 0.1)
bed += place("door", E["close"] + 0.35, 1.0) + place("steps", E["air"] + 1.3, 0.55, R6 - E["air"] - 1.6, 0.1, 0.2) + place("steps", R6, 0.6, 1.9, 0.05, 0.3)
bed += place("phone", E["call"] + 0.2, 0.8) + place("boom", TW, 1.0) + place("whoosh", A - 0.3, 0.6) + place("whoosh", R3 - 0.5, 0.5) + place("whoosh", R5 - 0.3, 0.5) + place("whoosh", R6 - 0.3, 0.5) + place("whoosh", CHK - 0.3, 0.5)
# sub drone / heartbeat in the check section
t = np.arange(N) / SR; sw = np.clip((t - CHK) / (TW - CHK), 0, 1) ** 1.4
bed += (np.sin(2 * np.pi * 41 * t) + 0.6 * np.sin(2 * np.pi * 41.8 * t)) * sw * 0.2 * (t < TW + 1.2)
bt = CHK + 0.4
while bt < TW:
    for off, g in ((0, 1.0), (0.17, 0.7)): bed += np.sin(2 * np.pi * 52 * (t - bt - off)) * np.exp(-np.clip(t - bt - off, 0, None) * 22) * (t >= bt + off) * 0.55 * g
    bt += max(0.45, 0.95 - 0.1 * (bt - CHK))
mute = np.where((t > TW + 1.4) & (t < END + 0.3), 0.0, 1.0); bed *= mute
bed += place("fire", END + 0.3, 0.12, D - END - 0.3, 1.0, 1.5) + place("whoosh", END + 3.4, 0.35)
# voice
V = np.zeros(N)
if os.path.exists("assets/vo.mp3"):
    v = load("assets/vo.mp3"); off = int(0.35 * SR); n = min(len(v), N - off); V[off:off + n] = v[:n]
    V = hp(V, 70); V = np.tanh(V / (np.abs(V).max() + 1e-9) * 1.6) / np.tanh(1.6) * 0.95
    rv = np.zeros(N)
    for dl, g in ((0.037, .2), (0.083, .14), (0.143, .09)): d = int(dl * SR); rv[d:] += V[:-d] * g
    V = V + lp(rv, 3000)
ve = lp(np.abs(V), 6); duck = 1 - 0.55 * np.clip(ve / (ve.max() * 0.3 + 1e-9), 0, 1)
bed = bed * duck; bed = bed / (np.abs(bed).max() + 1e-9) * 0.8
mix = np.tanh((bed * 0.9 + V * 1.0) * 1.05)
st = np.stack([mix, mix], 1); dd = int(0.0007 * SR); st[dd:, 1] = mix[:-dd] * 0.98
wavfile.write("assets/mix.wav", SR, (st * 32767 * 0.95).astype(np.int16)); print("mix ok", D, "s; sfx present:", sorted(f[:-4] for f in os.listdir("assets/sfx") if f.endswith(".mp3")))
