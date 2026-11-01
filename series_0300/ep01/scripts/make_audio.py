"""Episode 1 mix: ElevenLabs voices (assets/vo.mp3, assets/vo_unknown.mp3) + ElevenLabs SFX placed on cues -> assets/mix.wav"""
import json, os, subprocess, numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter
SR = 44100
c = json.loads(open("assets/cues.js", encoding="utf8").read()[len("window.CUE="):-1]); E = c["e"]; D = c["dur"]; N = int(SR * D)
def lp(x, f): b, a = butter(2, f / (SR / 2), "low"); return lfilter(b, a, x)
def hp(x, f): b, a = butter(2, f / (SR / 2), "high"); return lfilter(b, a, x)
def load(p):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", p, "-ac", "1", "-ar", str(SR), "/tmp/_ep.wav"], check=True)
    x = wavfile.read("/tmp/_ep.wav")[1].astype(np.float64) / 32768.0; return x / (np.abs(x).max() + 1e-9)
def loop(x, n, xf=0.12):  # crossfaded loop to length n samples
    f = int(xf * SR); out = np.zeros(n); seg = len(x); pos = 0; ramp = np.linspace(0, 1, f)
    while pos < n:
        y = x.copy(); y[:f] *= ramp; y[-f:] *= ramp[::-1]; m = min(seg, n - pos); out[pos:pos + m] += y[:m]; pos += seg - f
    return out
def place(name, t0, gain=1.0, dur=None, rate=1.0):
    p = "assets/sfx/%s.mp3" % name if not name.endswith(".mp3") else "assets/" + name
    if not os.path.exists(p): return np.zeros(N)
    x = load(p)
    if rate != 1.0: idx = np.arange(0, len(x) - 1, rate); x = np.interp(idx, np.arange(len(x)), x)
    if dur: x = loop(x, int(dur * SR))
    o = np.zeros(N); a = int(t0 * SR); m = max(0, min(len(x), N - a)); o[a:a + m] = x[:m]; return o * gain
bed = np.zeros(N)
bed += place("hit", 0.0, 0.5, rate=0.7)                          # cold-open low thud
bed += place("vibrate", E["buzz"], 0.9) + place("notify", E["buzz"] + 0.05, 0.75)
bed += place("notify", E["msg2"] - 0.2, 0.45) + place("notify", E["prank"] + 1.1, 0.35, rate=1.2)
bed += place("hit", E["off"], 0.9, rate=0.8)                     # phone off -> darkness
bed += place("whoosh", E["morning"] - 0.25, 0.7)
bed += place("hallway", E["morning"], 0.55, E["board"] - E["morning"] + 0.4) + place("steps", E["morning"] + 0.1, 0.35, E["board"] - E["morning"] - 0.2)
bed += place("laugh", E["board"] + 0.4, 0.8) + place("laugh", E["board"] + 2.2, 0.7, rate=0.95) + place("laugh", E["board"] + 3.8, 0.45, rate=1.05)
bed += place("vibrate", E["warn"] - 0.1, 0.9) + place("notify", E["warn"] + 0.05, 0.9)
bed += place("hit", E["hit"], 1.0) + place("hit", E["hit"] + 0.02, 0.6, rate=0.6) + place("notify", E["end"] + 0.4, 0.5, rate=0.85)
V = place("vo.mp3", 2.6, 1.0) + place("vo_unknown.mp3", E["whisper"], 0.95)
V = hp(V, 70); V = np.tanh(V * 1.4) / np.tanh(1.4)
rv = np.zeros(N)
for dl, g in ((0.031, .16), (0.067, .1), (0.12, .06)): d = int(dl * SR); rv[d:] += V[:-d] * g
V = V + lp(rv, 3500)
ve = lp(np.abs(V), 6); duck = 1 - 0.5 * np.clip(ve / (ve.max() * 0.3 + 1e-9), 0, 1)
bed = bed * duck; bed = bed / (np.abs(bed).max() + 1e-9) * 0.75
mix = np.tanh((bed * 0.85 + V) * 1.05); st = np.stack([mix, mix], 1); dd = int(0.0006 * SR); st[dd:, 1] = mix[:-dd] * 0.98
wavfile.write("assets/mix.wav", SR, (st * 32767 * 0.95).astype(np.int16)); print("mix ok", D)
