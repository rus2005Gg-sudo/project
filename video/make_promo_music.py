import numpy as np, wave
from scipy.signal import lfilter, butter

SR = 44100
BPM = 120
BEAT = 60 / BPM
T = 22.0
DROP = 4.0
END = 21.0
n = int(T * SR)
t = np.arange(n) / SR
rng = np.random.default_rng(3)
L = np.zeros(n)
R = np.zeros(n)


def add(at, x, pan=0.0, gain=1.0):
    i = int(at * SR)
    m = min(len(x), n - i)
    if m <= 0:
        return
    L[i:i + m] += x[:m] * gain * (1 - max(0, pan))
    R[i:i + m] += x[:m] * gain * (1 + min(0, pan))


def lp(x, fc, order=2):
    b, a = butter(order, min(fc, SR / 2 - 100) / (SR / 2))
    return lfilter(b, a, x)


def hp(x, fc, order=2):
    b, a = butter(order, fc / (SR / 2), 'high')
    return lfilter(b, a, x)


def saw(f, dur, detune=0.0):
    tt = np.arange(int(dur * SR)) / SR
    ph = (tt * f * (1 + detune)) % 1.0
    return 2 * ph - 1


def env(dur, a=0.005, d=0.1, s=0.7, r=0.1):
    N = int(dur * SR)
    e = np.full(N, s)
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na)
    e[na:na + nd] = np.linspace(1, s, nd)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def kick():
    tt = np.arange(int(0.45 * SR)) / SR
    f = 42 + 140 * np.exp(-tt * 35)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 7)
    x += np.sin(2 * np.pi * 3000 * tt) * np.exp(-tt * 300) * 0.3
    return np.tanh(x * 1.6)


def clap():
    tt = np.arange(int(0.3 * SR)) / SR
    nz = rng.standard_normal(len(tt))
    e = np.exp(-tt * 22) + 0.6 * np.exp(-np.maximum(0, tt - 0.012) * 40) * (tt > 0.012)
    return hp(lp(nz, 5000), 900) * e * 0.8


def hat(open_=False):
    tt = np.arange(int((0.25 if open_ else 0.06) * SR)) / SR
    return hp(rng.standard_normal(len(tt)), 7000) * np.exp(-tt * (12 if open_ else 70)) * 0.35


def chord_notes(root):
    return [root, root * 2 ** (3 / 12), root * 2 ** (7 / 12), root * 2 ** (10 / 12), root * 2]


def supersaw(freqs, dur, fc):
    x = np.zeros(int(dur * SR))
    for f in freqs:
        for d in (-0.012, -0.005, 0.0, 0.006, 0.013):
            x += saw(f, dur, d)
    return lp(x / (len(freqs) * 5), fc, 2)


# sidechain envelope from kicks in drop
side = np.ones(n)
beats_drop = np.arange(DROP, END, BEAT)
for b in beats_drop:
    i = int(b * SR)
    m = min(int(0.3 * SR), n - i)
    side[i:i + m] = np.minimum(side[i:i + m], 0.25 + 0.75 * (np.arange(m) / m) ** 0.6)

# ---------- intro 0..DROP ----------
# hook stabs on beats 0 and 1 (glitchy), low drone, riser 2..4s
for b in [0.0, 1.0]:
    add(b, kick(), gain=0.9)
drone = np.sin(2 * np.pi * 55 * t) * 0.12 + np.sin(2 * np.pi * 110.4 * t) * 0.05
drone *= (t < DROP) * np.clip(t / 0.05, 0, 1)
L += drone
R += drone
for k, b in enumerate(np.arange(0, DROP, BEAT / 2)):
    add(b, hat(), pan=0.3 * (-1) ** k, gain=0.5 if b < 2 else 0.8)
rs = 2.0
rlen = DROP - rs
tt = np.arange(int(rlen * SR)) / SR
noise = rng.standard_normal(len(tt))
riser = np.zeros(len(tt))
seg = 2048
for s0 in range(0, len(tt), seg):
    fc = 300 + 9000 * (s0 / len(tt)) ** 2
    riser[s0:s0 + seg] = lp(noise[s0:s0 + seg], fc, 1)
riser *= (tt / rlen) ** 2 * 0.5
sweep = np.sin(2 * np.pi * np.cumsum(200 + 1400 * (tt / rlen) ** 2) / SR) * (tt / rlen) ** 3 * 0.12
add(rs, riser + sweep)
# snare roll into drop
for k, b in enumerate(np.arange(3.0, DROP, BEAT / 4)):
    add(b, clap(), gain=0.25 + 0.5 * k / 8)

# ---------- drop DROP..END ----------
prog = [55.0, 43.65, 65.41, 49.0]  # A, F, C, G roots (Am-F-C-G)
bar = BEAT * 4
for k, b in enumerate(beats_drop):
    add(b, kick(), gain=1.0)
    if k % 2 == 1:
        add(b, clap(), gain=0.8)
    add(b + BEAT / 2, hat(open_=(k % 4 == 3)), pan=0.25, gain=0.9)
    add(b + BEAT / 4, hat(), pan=-0.3, gain=0.4)
    add(b + 3 * BEAT / 4, hat(), pan=-0.3, gain=0.4)
pad = np.zeros(n)
bass = np.zeros(n)
lead = np.zeros(n)
for j, b in enumerate(np.arange(DROP, END, bar)):
    root = prog[j % 4]
    x = supersaw(chord_notes(root * 4), bar, 2600 + 800 * np.sin(j))
    i = int(b * SR)
    m = min(len(x), n - i)
    pad[i:i + m] += x[:m] * env(bar, 0.01, 0.2, 0.8, 0.05)[:m]
    for q in range(8):
        f = root * (2 if q % 2 else 1)
        bb = lp(saw(f, BEAT / 2, 0.003) + saw(f, BEAT / 2, -0.004), 900) * env(BEAT / 2, 0.003, 0.08, 0.6, 0.03)
        ii = int((b + q * BEAT / 2) * SR)
        mm = min(len(bb), n - ii)
        if mm > 0:
            bass[ii:ii + mm] += bb[:mm] * 0.55
    notes = [4, 2, 4, 5, 4, 2, 0, 2] if j % 2 == 0 else [4, 5, 7, 5, 4, 2, 4, 7]
    for q, sem in enumerate(notes):
        f = root * 8 * 2 ** ([0, 2, 3, 5, 7, 8, 10, 12][sem] / 12)
        tt2 = np.arange(int(BEAT / 2 * SR)) / SR
        x2 = (np.sign(np.sin(2 * np.pi * f * tt2)) * 0.3 + np.sin(2 * np.pi * f * tt2)) * np.exp(-tt2 * 9)
        ii = int((b + q * BEAT / 2) * SR)
        mm = min(len(x2), n - ii)
        if mm > 0:
            lead[ii:ii + mm] += lp(x2, 5000)[:mm] * 0.1
pad *= side * 0.5
bass *= side
L += pad + bass + lead * 0.9
R += pad * 1.05 + bass + lead * 1.1
# impact on drop and final hit
imp_t = np.arange(int(2.0 * SR)) / SR
impact = (np.sin(2 * np.pi * 45 * imp_t) * np.exp(-imp_t * 3) + lp(rng.standard_normal(len(imp_t)), 3000) * np.exp(-imp_t * 5) * 0.5)
add(DROP, impact, gain=0.7)
add(END, impact, gain=0.9)
add(END, supersaw(chord_notes(55 * 4), 1.0, 3000) * np.exp(-np.arange(int(SR)) / SR * 2.5), gain=0.6)

# simple stereo reverb-ish tail (feedback delay)
for d, g in [(0.083, 0.25), (0.137, 0.18), (0.211, 0.12)]:
    k = int(d * SR)
    L[k:] += R[:-k] * g
    R[k:] += L[:-k] * g

mix = np.stack([L, R], 1)
mix *= np.clip((T - t) / 0.8, 0, 1)[:, None]
mix = np.tanh(mix * 1.1)
mix /= np.max(np.abs(mix)) + 1e-9
mix *= 0.89
with wave.open('public/promo/music.wav', 'w') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok')
