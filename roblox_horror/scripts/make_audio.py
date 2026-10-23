"""Roblox-horror sound design: cheerful obby chiptune that warps into a drone, chat pops, footsteps, hits.
Writes assets/bed.wav (ducked under the voice) and assets/vo_master.wav (compressed + light room)."""
import json, numpy as np, soundfile as sf
from scipy import signal
from scipy.io import wavfile

CUE = json.load(open("assets/cues.json")); T_ = CUE["t"]
SR = 44100
vo, vsr = sf.read("assets/vo.wav")
if vo.ndim > 1: vo = vo.mean(1)
vo = signal.resample_poly(vo, SR, vsr) if vsr != SR else vo
DUR = round(CUE["endBlack"] + 2.6, 1)
N = int(SR * DUR); T = np.arange(N) / SR
rs = np.random.RandomState(2012)
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]

lp = lambda x, f, o=2: signal.sosfilt(signal.butter(o, f, "low", fs=SR, output="sos"), x)
hp = lambda x, f, o=2: signal.sosfilt(signal.butter(o, f, "high", fs=SR, output="sos"), x)
bp = lambda x, a, b, o=2: signal.sosfilt(signal.butter(o, [a, b], "band", fs=SR, output="sos"), x)
noise = lambda n: rs.randn(n)

def add(buf, t0, x, g=1.0):
    a = int(t0 * SR)
    if a >= N or a < 0: return
    x = x[: N - a]; buf[a:a + len(x)] += x * g

def tone(f0, f1, dur, k=6.0, kind="sin"):
    n = int(dur * SR); t = np.arange(n) / SR
    f = f0 + (f1 - f0) * t / dur; ph = 2 * np.pi * np.cumsum(f) / SR
    w = np.sin(ph) if kind == "sin" else signal.square(ph) * 0.5
    return w * np.exp(-t * k)

def impact(g=1.0):
    n = int(2.0 * SR); t = np.arange(n) / SR
    return (tone(64, 26, 2.0, 2.8) + lp(noise(n), 170) * np.exp(-t * 6) * 1.6 + hp(noise(n), 1500) * np.exp(-t * 40) * 0.35) * g

def riser(dur, g=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; u = t / dur
    return (bp(noise(n), 300, 6000) * u ** 2.2 + np.sin(2 * np.pi * (90 + 500 * u ** 2) * t) * u ** 2 * 0.3) * g

def pop(g=1.0):
    n = int(0.09 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * (1100 - 5000 * t) * t) * np.exp(-t * 45) + bp(noise(n), 2000, 7000) * np.exp(-t * 120) * 0.3) * g

def step(g=1.0):
    n = int(0.12 * SR); t = np.arange(n) / SR
    return (lp(noise(n), 700) * np.exp(-t * 45) * 1.2 + tone(180, 90, 0.12, 30) * 0.5) * g

def glitch(dur, g=1.0):
    n = int(dur * SR); x = np.zeros(n); t = 0
    while t < n:
        L = int(rs.uniform(0.01, 0.05) * SR); f = rs.uniform(200, 3000)
        seg = np.sign(np.sin(2 * np.pi * f * np.arange(L) / SR)) * rs.uniform(0.2, 0.8) if rs.rand() < 0.6 else noise(L) * 0.5
        x[t:t + L] = seg[: n - t]; t += L + int(rs.uniform(0, 0.04) * SR)
    return x * g

# ---------------------------------------------------------- cheerful obby music
BPM = 124; beat = 60 / BPM
scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21]  # C major pentatonic across two octaves
def mtof(m): return 261.63 * 2 ** (m / 12)
melody = [0, 4, 7, 9, 7, 4, 2, 4, 0, 5, 9, 12, 9, 7, 4, 2]  # scale degrees as semitone offsets
bass = [0, 0, 5, 5, 7, 7, 0, 0]
PL = int(SR * 80)  # unwarped music buffer, 80 s worth of material
mus = np.zeros(PL)
step_len = beat / 2
for i in range(int(80 / step_len)):
    m = melody[i % len(melody)] + (12 if (i // 16) % 2 else 0)
    t0 = i * step_len; n = int(step_len * 0.9 * SR); tt = np.arange(n) / SR
    w = (signal.square(2 * np.pi * mtof(m) * tt, duty=0.35) * 0.5 + np.sin(2 * np.pi * mtof(m + 12) * tt) * 0.3) * np.exp(-tt * 7)
    a = int(t0 * SR); mus[a:a + n] += w[: PL - a] * 0.55
    if i % 4 == 0:
        b = bass[(i // 4) % len(bass)] - 12; nb = int(beat * 1.8 * SR); tb = np.arange(nb) / SR
        wb = np.sin(2 * np.pi * mtof(b) * tb) * np.exp(-tb * 2.2) * 0.7
        a = int(t0 * SR); mus[a:a + nb] += wb[: PL - a]
mus = lp(mus, 5200)
# varispeed warp: normal speed until the music slows, then it drags down to a crawl
ms = CUE["musicSlow"]
rate = np.where(T < ms, 1.0, np.clip(1.0 - 0.72 * (1 - np.exp(-(T - ms) / 1.6)), 0.25, 1.0))
phase = np.cumsum(rate) / SR
music = np.interp(phase * SR, np.arange(PL), mus, right=0.0)
mg = np.interp(T, [0, 0.8, ms, CUE["run"], CUE["run"] + 1.4, DUR], [0, 0.75, 0.75, 0.55, 0.0, 0.0])
music *= mg

# ------------------------------------------------------------ ambience / drone
wind = lp(noise(N), 900) * (0.5 + 0.5 * np.sin(2 * np.pi * T / 7.0)) * 0.12
wind *= np.interp(T, [0, ms, CUE["sky_red"], CUE["endBlack"]], [0.5, 1.0, 2.2, 1.6])
dr = (np.sin(2 * np.pi * 55 * T) + np.sin(2 * np.pi * 58.3 * T) * 0.8 + np.sin(2 * np.pi * 82.4 * T + 1) * 0.35 + lp(noise(N), 300) * 0.3)
dr *= np.interp(T, [0, ms - 1, ms + 3, CUE["sky_red"], CUE["rule3"], CUE["nameSwap"], CUE["heroGone"], CUE["heroGone"] + 1.5, DUR], [0, 0, 0.25, 0.8, 1.0, 1.1, 1.1, 0.5, 0.3])
sfx = np.zeros(N); steps = np.zeros(N)

# ------------------------------------------------------------------- events
add(sfx, CUE["zeroAppear"] - 0.4, riser(0.4, 0.5)); add(sfx, CUE["zeroAppear"], impact(0.9))
add(sfx, CUE["rule1"] - 0.05, impact(0.5)); add(sfx, CUE["rule2"] - 0.05, impact(0.5)); add(sfx, CUE["rule3"] - 0.05, impact(0.6))
for c in (CUE["t"]["blinked"] + 0.18, CUE["t"]["closer"]): add(sfx, c, impact(0.7)); add(sfx, c - 0.15, riser(0.15, 0.35))
add(sfx, CUE["t"]["who"] + 1.9, pop(0.6))
for m in CUE["chat"]: add(sfx, m["t"], pop(0.8))
add(sfx, CUE["t"]["musicSlow"], glitch(1.4, 0.4))
add(sfx, CUE["sky_red"] - 0.3, riser(0.9, 0.7)); add(sfx, CUE["sky_red"], impact(1.2)); add(sfx, CUE["sky_red"], glitch(1.2, 0.3))
add(sfx, CUE["menuOn"], pop(1.0)); add(sfx, CUE["menuOn"] + 0.25, pop(0.7))
add(sfx, CUE["leaveGone"], glitch(1.5, 0.45)); add(sfx, CUE["leaveGone"], impact(0.8))
add(sfx, CUE["zeroGone"] - 0.3, riser(0.3, 0.4)); add(sfx, CUE["zeroGone"], impact(0.6))
add(sfx, CUE["nameSwap"] - 0.5, riser(0.5, 0.7)); add(sfx, CUE["nameSwap"], impact(1.3)); add(sfx, CUE["nameSwap"], glitch(1.3, 0.5))
add(sfx, CUE["newPlayer"], pop(0.9)); add(sfx, CUE["newPlayer"] + 0.1, tone(880, 880, 1.6, 2.5) * 0.12)
add(sfx, CUE["heroGone"] - 0.05, impact(0.5))
# platform crackle while they vanish
for tt in np.arange(CUE["vanishFrom"], CUE["rule3"], 0.35):
    add(sfx, tt, hp(noise(int(0.08 * SR)), 900) * np.exp(-np.arange(int(0.08 * SR)) / SR * 40) * 0.5, 0.8)
# footsteps while running (plastic blocks) + jump swooshes
tt = CUE["run"] + 0.15
while tt < CUE["skyRedEnd"]:
    add(steps, tt, step(0.7)); tt += 0.23
for k in range(8):
    tj = CUE["run"] + (k + 0.6) / 10 * (CUE["skyRedEnd"] - CUE["run"])
    add(sfx, tj, bp(noise(int(0.3 * SR)), 400, 2500) * np.hanning(int(0.3 * SR)) * 0.25)
# heartbeat creeping in from rule one
hb = np.zeros(N); tt = CUE["rule1"]
while tt < CUE["nameSwap"] + 4:
    g = 0.25 + 0.55 * min(1, (tt - CUE["rule1"]) / 40)
    add(hb, tt, tone(55, 38, 0.4, 9), g); add(hb, tt + 0.27, tone(50, 36, 0.35, 10), g * 0.7)
    tt += 1.15 - 0.45 * min(1, (tt - CUE["rule1"]) / 40)

# ------------------------------------------------------------------ ducking
env = lp(np.abs(vo), 6, 1); env = np.clip(env / (np.percentile(env, 95) + 1e-9), 0, 1)
duck = 1 - 0.55 * env
mix = (music * 0.55 + wind + dr * 0.11 + hb * 0.4) * duck + (sfx * 0.32 + steps * 0.4) * (1 - 0.3 * env)
mix = np.tanh(mix * 1.1)
fade = np.minimum(1, T / 0.3) * np.minimum(1, (DUR - T) / 0.6)
L = mix * fade; R = np.copy(L); d = int(0.011 * SR); R[d:] = 0.84 * L[d:] + 0.16 * L[:-d]
out = np.stack([L, R], 1); out = out / np.abs(out).max() * 0.8
wavfile.write("assets/bed.wav", SR, (out * 32767).astype(np.int16))

# ----------------------------------------------------------- voice master
a_att, a_rel = np.exp(-1 / (0.005 * SR)), np.exp(-1 / (0.18 * SR))
ab = np.abs(vo); e = 0.0; env2 = np.zeros(N)
for i in range(N):
    v = ab[i]; e = a_att * e + (1 - a_att) * v if v > e else a_rel * e + (1 - a_rel) * v; env2[i] = e
y = vo * np.where(env2 > 0.07, (env2 / 0.07) ** (1 / 3 - 1), 1.0)
y = hp(y, 70, 2)
ir = noise(int(0.5 * SR)) * np.exp(-np.arange(int(0.5 * SR)) / SR * 9); ir /= np.abs(ir).sum()
y = y + 0.22 * signal.fftconvolve(y, ir)[:N] * 6
y *= 0.89 / np.abs(y).max()
wavfile.write("assets/vo_master.wav", SR, (y * 32767).astype(np.int16))
act = y[np.abs(y) > 0.01]
print("duration", DUR, "| vo rms", round(20 * np.log10(np.sqrt((act ** 2).mean())), 1), "dB | bed rms", round(20 * np.log10(np.sqrt((out ** 2).mean())), 1), "dB")
