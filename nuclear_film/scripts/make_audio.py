"""Nuclear short: cinematic sound design + voices -> assets/mix.wav (single pre-mixed track, ducked, -15 LUFS applied after render)."""
import json, subprocess, numpy as np
from scipy import signal
from scipy.io import wavfile

CUE = json.load(open("assets/cues.json")); E = CUE["e"]
SR = 44100; DUR = CUE["dur"]; N = int(SR * DUR); T = np.arange(N) / SR
rs = np.random.RandomState(1945)

def load(path, name):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path, "-ac", "1", "-ar", str(SR), f"/tmp/claude-0/nf_{name}.wav"], stdin=subprocess.DEVNULL, check=True)
    _, x = wavfile.read(f"/tmp/claude-0/nf_{name}.wav"); return x.astype(float) / 32768
lp = lambda x, f, o=2: signal.sosfilt(signal.butter(o, f, "low", fs=SR, output="sos"), x)
hp = lambda x, f, o=2: signal.sosfilt(signal.butter(o, f, "high", fs=SR, output="sos"), x)
bp = lambda x, a, b, o=2: signal.sosfilt(signal.butter(o, [a, b], "band", fs=SR, output="sos"), x)
noise = lambda n: rs.randn(n)
def add(buf, t0, x, g=1.0):
    a = int(t0 * SR)
    if a < 0 or a >= N: return
    x = x[: N - a]; buf[a:a + len(x)] += x * g
def tone(f0, f1, dur, k=6.0):
    n = int(dur * SR); t = np.arange(n) / SR; f = f0 + (f1 - f0) * t / dur
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * k)
def env(keys): return np.interp(T, [k[0] for k in keys], [k[1] for k in keys])
def impact(g=1.0, long=2.4):
    n = int(long * SR); t = np.arange(n) / SR
    return (tone(58, 24, long, 2.2) + lp(noise(n), 150) * np.exp(-t * 4.5) * 1.8 + hp(noise(n), 1400) * np.exp(-t * 40) * 0.3) * g
def riser(dur, g=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; u = t / dur
    return (bp(noise(n), 200, 5000) * u ** 2.2 + np.sin(2 * np.pi * (70 + 420 * u ** 2) * t) * u ** 2 * 0.3) * g
def click(g=1.0, f=1800):
    n = int(0.07 * SR); t = np.arange(n) / SR
    return (bp(noise(n), 1200, 6500) * np.exp(-t * 90) + np.sin(2 * np.pi * f * t) * np.exp(-t * 100) * 0.5) * g
def thud(g=1.0, f=60):
    n = int(0.5 * SR); t = np.arange(n) / SR
    return (tone(f, 32, 0.5, 9.0) + lp(noise(n), 300) * np.exp(-t * 16) * 0.7) * g
def pluck(f, dur, g=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 3) + 0.2 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 5)) * np.exp(-t * 1.6) * np.minimum(1, t * 200) * g

voice = np.zeros(N); radio = np.zeros(N); amb = np.zeros(N); sfx = np.zeros(N)

# ---------------------------------------------------------------- voices
nr = load("assets/narr.mp3", "narr")
a_att, a_rel = np.exp(-1 / (0.005 * SR)), np.exp(-1 / (0.2 * SR)); ab = np.abs(nr); e_ = 0.0; en = np.zeros(len(nr))
for i in range(len(nr)):
    v = ab[i]; e_ = a_att * e_ + (1 - a_att) * v if v > e_ else a_rel * e_ + (1 - a_rel) * v; en[i] = e_
nr = nr * np.where(en > 0.07, (en / 0.07) ** (1 / 3 - 1), 1.0); nr = hp(nr, 70); nr *= 0.9 / np.abs(nr).max()
ir = noise(int(0.9 * SR)) * np.exp(-np.arange(int(0.9 * SR)) / SR * 6); ir /= np.abs(ir).sum()
nr = nr + 0.28 * signal.fftconvolve(nr, ir)[: len(nr)] * 5
add(voice, E["ns"], nr, 1.0)
def radio_fx(x):
    y = bp(x, 380, 3300, 2); y = np.tanh(y * 3.2) * 0.55
    y += bp(noise(len(y)), 1500, 6000) * 0.035 * (0.6 + 0.4 * np.sin(np.linspace(0, 40, len(y))))
    return y / (np.abs(y).max() + 1e-9) * 0.85
r1 = radio_fx(load("assets/radio1.mp3", "r1")); r2 = radio_fx(load("assets/radio2.mp3", "r2"))
add(radio, E["radioStart"], r1, 1.0); add(radio, E["radio2"], r2, 1.0)

# ---------------------------------------------------------- opening: radio song -> static -> alert tone
chords = [[110, 130.8, 164.8, 220], [87.3, 130.8, 174.6, 220], [130.8, 164.8, 196, 261.6], [98, 146.8, 196, 246.9]]
song = np.zeros(N)
for bar in range(3):
    for k, f in enumerate(chords[bar % 4] * 2):
        add(song, 0.3 + bar * 2.0 + k * 0.25, pluck(f, 1.9, 0.5))
song = lp(hp(song, 150), 2600) * env([(0, 0), (0.6, 1.0), (5.2, 1.0), (5.55, 0)])
amb += song * 0.9
add(sfx, E["radioStart"] - 0.55, hp(noise(int(0.55 * SR)), 1500) * 0.35)
for k in range(3):  # EAS-like attention tone
    n = int(0.28 * SR); tt = np.arange(n) / SR
    add(sfx, E["radioStart"] - 0.9 + 0.0 * k + k * 0.0, np.zeros(1))
et = np.zeros(N)
n = int(0.9 * SR); tt = np.arange(n) / SR
tones = (np.sin(2 * np.pi * 853 * tt) + np.sin(2 * np.pi * 960 * tt)) * 0.22 * np.minimum(1, tt * 80) * np.minimum(1, (0.9 - tt) * 80)
add(sfx, E["radioStart"] - 1.0, bp(tones, 380, 3300) * 1.0)
add(sfx, E["radio2"] - 1.0, bp(tones, 380, 3300) * 1.0)

# ------------------------------------------------------------- the car
speed = np.where(T < E["brake"], 1.0, np.clip(1 - (T - E["brake"]) / (E["stop"] - E["brake"]), 0, 1)) * (T < E["stop"] + 0.3)
engine = (np.sin(2 * np.pi * 52 * T * (0.7 + 0.3 * speed)) * 0.5 + np.sin(2 * np.pi * 104 * T * (0.7 + 0.3 * speed)) * 0.25 + lp(noise(N), 240) * 0.5) * speed
road = bp(noise(N), 300, 1800) * 0.07 * speed
for tt in np.arange(0.5, E["stop"], 0.52): add(sfx, tt, thud(0.05, 90) * (1 if tt < E["brake"] else 0.5))  # lane dashes
amb += engine * 0.28 + road
add(sfx, E["brake"], bp(noise(int(4.5 * SR)), 900, 4000) * np.hanning(int(4.5 * SR)) * 0.14)  # tyres
add(sfx, E["stop"] + 0.3, thud(0.5, 50)); add(sfx, E["exit"] - 0.1, click(0.5, 900)); add(sfx, E["exit"] + 0.2, thud(0.3, 110))
# night desert wind + crickets
wind = lp(noise(N), 700) * (0.5 + 0.5 * np.sin(2 * np.pi * T / 8.5)) * 0.08 * (T > E["stop"])
amb += wind
for tt in np.arange(E["stop"], E["ns"] + 8, 0.12): add(amb, tt, tone(4300, 4300, 0.05, 40) * 0.015)

# ---------------------------------------------------------- the missile
roar = lp(noise(N), 500) * env([(E["mStart"], 0), (E["mStart"] + 6, 0.05), (E["flash"] - 3, 0.22), (E["flash"] - 0.3, 0.35), (E["flash"], 0)])
roar += bp(noise(N), 1500, 5000) * 0.04 * env([(E["mStart"], 0), (E["flash"] - 1, 1), (E["flash"], 0)])
amb += roar * 0.7

# ------------------------------------------------- the pause: tinnitus + heartbeat
tin = np.sin(2 * np.pi * 4100 * T) * 0.02 * env([(E["pause"] - 0.2, 0), (E["pause"] + 0.8, 1), (E["ns"] + 0.5, 1), (E["ns"] + 3.5, 0)])
amb += tin
tt = E["pause"]
while tt < E["flash"] - 2: add(sfx, tt, tone(55, 38, 0.4, 9), 0.28); add(sfx, tt + 0.27, tone(50, 36, 0.35, 10), 0.2); tt += 1.15
# ---------------------------------------------------------- drone / score
drone = (np.sin(2 * np.pi * 55 * T) + np.sin(2 * np.pi * 82.4 * T + 1) * 0.5 + np.sin(2 * np.pi * 110.5 * T) * 0.2 + lp(noise(N), 250) * 0.2)
drone *= env([(0, 0), (E["pause"], 0), (E["ns"] + 1, 0.35), (E["flash"], 0.6), (E["shock"], 1.0), (E["rule4"], 0.5), (E["door"], 0.18), (E["radioOn"], 0.5), (E["radio2"], 1.0), (CUE["endBlack"], 1.2), (DUR, 0)])
amb += drone * 0.1

# ------------------------------------------------------------- the flash & shock
for k in ["rule1", "rule2", "rule3", "rule4", "rule5"]: add(sfx, E[k] - 0.05, impact(0.35, 1.6)); add(sfx, E[k] - 0.4, riser(0.4, 0.2))
add(sfx, E["flash"] - 0.25, riser(0.25, 0.4))
add(sfx, E["flash"], tone(34, 30, 1.6, 1.2) * 0.9)  # silent flash: sub swell only
muffle = env([(E["flash"], 0), (E["flash"] + 0.05, 1), (E["flash"] + 4.0, 0.4), (E["flash"] + 9, 0)])
tin2 = np.sin(2 * np.pi * 3600 * T) * 0.03 * muffle; amb += tin2
for tt in np.arange(E["run"], E["lie"] - 0.5, 0.31): add(sfx, tt, lp(noise(int(0.1 * SR)), 900) * np.exp(-np.arange(int(0.1 * SR)) / SR * 40) * 1.0, 0.55)  # footfalls
for tt in np.arange(E["run"], E["lie"] - 0.5, 1.2): add(sfx, tt + 0.5, bp(noise(int(0.5 * SR)), 300, 1500) * np.hanning(int(0.5 * SR)) * 0.1)  # breath
add(sfx, E["lie"], thud(0.6, 70)); add(sfx, E["lie"] + 0.1, lp(noise(int(0.4 * SR)), 800) * np.hanning(int(0.4 * SR)) * 0.3)
S = E["shock"]
add(sfx, S - 2.4, riser(2.4, 0.55)); add(sfx, S, impact(1.6, 3.4))
n = int(8 * SR); gust = lp(noise(n), 1200) * np.hanning(n) ** 0.6 * 1.0; add(sfx, S - 0.6, gust, 0.8); add(sfx, S + 0.2, bp(noise(n), 200, 3000) * np.hanning(n) ** 0.5, 0.45)
for tt in np.arange(S, S + 4.5, 0.17): add(sfx, tt, hp(noise(int(0.08 * SR)), 900) * np.exp(-np.arange(int(0.08 * SR)) / SR * 35) * rs.uniform(0.2, 0.8), 0.7)  # debris
for tt in [S + 0.4, S + 1.1, S + 2.0]: add(sfx, tt, thud(0.6, 45))
add(amb, S + 1.5, lp(noise(int(10 * SR)), 300) * np.hanning(int(10 * SR)) * 0.25)

# ---------------------------------------------------------------- bunker
D = E["door"]
add(sfx, D - 0.6, bp(noise(int(0.9 * SR)), 200, 1500) * np.hanning(int(0.9 * SR)) * 0.4)  # hinge
add(sfx, D + 0.1, impact(0.9, 1.8)); add(sfx, D + 0.15, tone(1200, 800, 0.6, 5) * 0.15)  # clang
room = (np.sin(2 * np.pi * 58 * T) * 0.4 + lp(noise(N), 260) * 0.35) * env([(D - 0.2, 0), (D + 0.4, 1), (DUR, 1)])
amb += room * 0.18
add(sfx, E["undress"] + 0.3, bp(noise(int(0.8 * SR)), 300, 4000) * np.hanning(int(0.8 * SR)) * 0.2)  # cloth
for tt in np.arange(E["undress"] + 1.8, E["radioOn"] - 0.2, 0.09): add(sfx, tt, bp(noise(int(0.06 * SR)), 1800, 7000) * np.hanning(int(0.06 * SR)) * 0.2)  # water
add(sfx, E["radioOn"] - 0.05, click(0.9, 1400)); add(amb, E["radioOn"], hp(noise(int(3.0 * SR)), 2500) * np.hanning(int(3.0 * SR)) ** 0.5 * 0.12)
add(sfx, E["radio2"] - 0.2, hp(noise(int(0.5 * SR)), 2000) * 0.2)
add(sfx, E["radio2"] + 3.0, impact(1.0, 3.0)); add(sfx, E["radio2"] + 3.1, riser(1.2, 0.3))

# ------------------------------------------------------------------ master
vo_env = lp(np.abs(voice + radio), 5, 1); vo_env = np.clip(vo_env / (np.percentile(vo_env[vo_env > 1e-4], 90) + 1e-9), 0, 1)
duck = 1 - 0.55 * vo_env
mix = voice * 1.0 + radio * 1.1 + (amb * 0.5 + sfx * 0.42) * duck
mix = np.tanh(mix * 1.05)
mix *= np.interp(T, [0, CUE["endBlack"], CUE["endBlack"] + 0.3, DUR], [1, 1, 0.0, 0.0])
fade = np.minimum(1, T / 0.5) * np.minimum(1, (DUR - T) / 0.4)
L = mix * fade; R = np.copy(L); d = int(0.012 * SR); R[d:] = 0.85 * L[d:] + 0.15 * L[:-d]
out = np.stack([L, R], 1); out = out / np.abs(out).max() * 0.85
wavfile.write("assets/mix.wav", SR, (out * 32767).astype(np.int16))
print("mix.wav", DUR, "s rms dB", round(20 * np.log10(np.sqrt((out ** 2).mean())), 1))
