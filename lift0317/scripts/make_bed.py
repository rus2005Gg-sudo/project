"""Procedural sound-design bed (drone, lift hum, clicks, doors, phone, knocks, impacts) -> assets/bed.wav.
Ducked under the voice-over envelope. Cue times match scene.js."""
import subprocess, numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 44100
DUR = 103.0
N = int(SR * DUR)
T = np.arange(N) / SR
rs = np.random.RandomState(317)

def sl(t0, t1):
    return slice(max(0, int(t0 * SR)), min(N, int(t1 * SR)))

def lp(x, f, o=2):
    return signal.sosfilt(signal.butter(o, f, "low", fs=SR, output="sos"), x)

def hp(x, f, o=2):
    return signal.sosfilt(signal.butter(o, f, "high", fs=SR, output="sos"), x)

def bp(x, f0, f1, o=2):
    return signal.sosfilt(signal.butter(o, [f0, f1], "band", fs=SR, output="sos"), x)

def noise(n):
    return rs.randn(n)

def env_win(t0, t1, fi=0.05, fo=0.05, g=1.0):
    e = np.zeros(N)
    a, b = int(t0 * SR), int(min(t1, DUR) * SR)
    if b <= a:
        return e
    seg = np.ones(b - a)
    ni, no = int(fi * SR), int(fo * SR)
    if ni > 0:
        seg[: min(ni, len(seg))] *= np.linspace(0, 1, min(ni, len(seg)))
    if no > 0:
        seg[-min(no, len(seg)):] *= np.linspace(1, 0, min(no, len(seg)))
    e[a:b] = seg * g
    return e

def ramp_env(keys):
    ts = [k[0] for k in keys]; vs = [k[1] for k in keys]
    return np.interp(T, ts, vs)

def add(buf, t0, x, g=1.0):
    a = int(t0 * SR)
    if a >= N:
        return
    x = x[: N - a]
    buf[a : a + len(x)] += x * g

def decay_tone(f0, f1, dur, k=7.0):
    n = int(dur * SR); t = np.arange(n) / SR
    f = f0 + (f1 - f0) * (t / dur)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * k)

def impact(t0, g=1.0, big=True):
    n = int(2.2 * SR); t = np.arange(n) / SR
    boom = decay_tone(62 if big else 70, 26, 2.2, 2.6 if big else 4.0)
    thud = lp(noise(n), 160) * np.exp(-t * 6) * 2.2
    crack = hp(noise(n), 1500) * np.exp(-t * 40) * 0.5
    return (boom * 1.0 + thud * 0.6 + crack * 0.4) * g

def riser(dur, g=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    x = bp(noise(n), 300, 5000) * (t / dur) ** 2.2
    x += np.sin(2 * np.pi * (80 + 400 * (t / dur) ** 2) * t) * (t / dur) ** 2 * 0.3
    return x * g

def click(g=1.0):
    n = int(0.09 * SR); t = np.arange(n) / SR
    return (bp(noise(n), 1800, 6500) * np.exp(-t * 90) + np.sin(2 * np.pi * 2100 * t) * np.exp(-t * 120) * 0.6) * g

def beep(g=1.0, f=1760, d=0.09):
    n = int(d * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * t) * np.minimum(1, t * 400) * np.minimum(1, (d - t) * 400) * g

def thump(g=1.0, f=70):
    return decay_tone(f, 38, 0.5, 9.0) * g + lp(noise(int(0.5 * SR)), 150) * np.exp(-np.arange(int(0.5 * SR)) / SR * 14) * g * 0.8

def door_slide(dur, g=1.0, creak=False):
    n = int(dur * SR); t = np.arange(n) / SR; u = t / dur
    sweep = bp(noise(n), 250, 1100) * np.sin(np.pi * u) ** 0.7
    rumble = np.sin(2 * np.pi * 72 * t + 3 * np.sin(2 * np.pi * 5 * t)) * np.sin(np.pi * u) * 0.45
    ping = (decay_tone(900, 700, 0.15, 25) * 0.4)
    x = sweep * 0.9 + rumble
    x[-len(ping):] += ping if len(ping) < n else 0
    if creak:
        f = 170 + 70 * u + 6 * np.sin(2 * np.pi * 9 * t)
        saw = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR)
        x += bp(saw, 400, 1800) * np.sin(np.pi * u) ** 1.5 * 0.5
    return x * g

def footstep(g=1.0):
    n = int(0.22 * SR); t = np.arange(n) / SR
    return (lp(noise(n), 260) * np.exp(-t * 28) * 1.6 + hp(noise(n), 2500) * np.exp(-t * 90) * 0.12) * g

def ring(dur, g=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    tone = np.sign(np.sin(2 * np.pi * 25 * t)) * 0.5 + 0.5
    x = (np.sin(2 * np.pi * 480 * t) + np.sin(2 * np.pi * 620 * t)) * tone
    return bp(x, 400, 3000) * g * np.minimum(1, t * 300) * np.minimum(1, (dur - t) * 300)

drone = np.zeros(N); hum = np.zeros(N); sfx = np.zeros(N); tick = np.zeros(N)

# ---------------- drone (music bed): 0 .. 93.3
lfo = 0.5 + 0.5 * np.sin(2 * np.pi * T / 11.0)
d = np.sin(2 * np.pi * 41.2 * T) * 0.6 + np.sin(2 * np.pi * 55.0 * T + 1.3 * np.sin(2 * np.pi * 0.13 * T)) * 0.4
d += np.sin(2 * np.pi * 82.4 * T) * 0.18 * lfo + np.sin(2 * np.pi * 123.5 * T) * 0.07 * (1 - lfo)
d += lp(noise(N), 400) * 0.25
dk = ramp_env([(0, 0.0), (2.0, 0.55), (31, 0.6), (46, 0.8), (62, 1.0), (75, 0.8), (89.2, 0.5), (93.2, 0.5), (93.25, 0.0)])
drone = d * dk

# pulsing rhythm 46.9 -> 75.1 and heartbeat 85 -> 89.2
bt = 46.9
while bt < 75.1:
    amp = 0.3 + 0.7 * min(1, (bt - 46.9) / 24)
    add(sfx, bt, decay_tone(52, 36, 0.45, 8.0), 0.55 * amp)
    bt += 1.1 - 0.35 * min(1, (bt - 46.9) / 24)
bt = 85.0
while bt < 89.2:
    add(sfx, bt, decay_tone(55, 38, 0.35, 10.0), 0.45)
    add(sfx, bt + 0.28, decay_tone(50, 36, 0.3, 11.0), 0.3)
    bt += 0.8

# ---------------- lift / room hum
h = np.sin(2 * np.pi * 61 * T) * 0.5 + np.sin(2 * np.pi * 122.4 * T) * 0.25 + np.sin(2 * np.pi * 183 * T + 0.4) * 0.08
h += bp(noise(N), 80, 260) * 0.5
elec = bp(noise(N), 90, 130) * 0.4 + np.sin(2 * np.pi * 100 * T) * 0.12 + np.sin(2 * np.pi * 300 * T) * 0.05
hk = ramp_env([(0, 0.15), (5.5, 0.15), (5.9, 0.35), (10.5, 0.5), (17.1, 0.5), (17.5, 1.0), (31.2, 1.0), (31.6, 1.3), (46.8, 1.4), (46.95, 0.7), (75.0, 0.9), (75.3, 0.0),
                (75.4, 0.0), (75.6, 0.12), (89.2, 0.12), (89.6, 0.25), (92.9, 0.25), (93.3, 0.05), (94.8, 0.12), (98, 0.5), (101.5, 0.6), (103, 0.6)])
hum = h * hk
# descent rumble 31.6 -> 46.9
rumble = lp(noise(N), 110) * env_win(31.6, 46.9, 1.0, 0.1) * 0.9 + lp(noise(N), 500) * env_win(31.6, 46.9, 2.0, 0.1) * 0.15
hum += rumble
# electric buzz in the hall at start, on flicker beats
buzz = elec * (ramp_env([(0, 0.35), (5.5, 0.35), (5.6, 0.0), (91.0, 0.0), (91.1, 0.4), (92.3, 0.4), (92.4, 0.0), (103, 0.0)]))
hum += buzz * 0.5
# flicker crackles
for a, b, dens in [(31.4, 36.5, 5), (43.6, 47.5, 6), (62.2, 75.2, 9), (91.0, 92.2, 8)]:
    tt = a
    while tt < b:
        tt += rs.exponential(1.0 / dens)
        if tt < b:
            n = int(rs.uniform(0.03, 0.12) * SR)
            add(sfx, tt, hp(noise(n), 800) * np.exp(-np.arange(n) / SR * 35) * 0.5 + bp(noise(n), 90, 140) * 0.3, rs.uniform(0.4, 1))

# ---------------- doors
for t0, dur, creak in [(2.4, 1.1, True), (5.1, 0.4, False), (17.6, 1.1, True), (31.2, 0.4, False), (48.5, 1.1, True), (75.1, 0.8, False), (93.4, 1.3, True), (85.9, 1.0, True), (89.3, 0.5, True)]:
    add(sfx, t0, door_slide(dur, 0.7, creak))
add(sfx, 91.0, impact(0, 0.9, False))  # slam
add(sfx, 91.0, hp(noise(int(0.4 * SR)), 600) * np.exp(-np.arange(int(0.4 * SR)) / SR * 14) * 0.6)

# ---------------- clicks / beeps
for t0 in [14.38, 17.55, 33.54, 34.44, 35.28, 70.7, 71.0, 85.8]:
    add(sfx, t0, click(0.8))
add(sfx, 17.5, thump(0.5, 90))
for t0 in [1.62, 92.48]:
    add(sfx, t0, beep(0.5)); add(sfx, t0 + 0.12, beep(0.35, 1320))
add(sfx, 73.84, beep(0.35, 220, 0.4))

# ---------------- phone ring 36.3 .. 43.4
tt = 36.3
while tt < 43.4:
    add(sfx, tt, ring(min(0.9, 43.4 - tt), 0.55))
    tt += 1.7

# ---------------- knocks from the shaft
add(sfx, 44.0, thump(0.7, 62)); add(sfx, 45.0, thump(0.5, 58))
add(sfx, 46.3, impact(0, 1.0, False)); add(sfx, 46.95, thump(1.0, 48)); add(sfx, 46.95, door_slide(0.5, 0.4))

# ---------------- impacts with risers
for t0, g in [(23.84, 0.9), (39.86, 0.9), (58.82, 0.95), (73.84, 1.15)]:
    add(sfx, t0 - 0.5, riser(0.5, 0.7)); add(sfx, t0, impact(0, g))
add(sfx, 29.5, impact(0, 0.6, False)); add(sfx, 29.3, riser(0.25, 0.4))
add(sfx, 1.62, impact(0, 0.6, False))
add(sfx, 68.72, impact(0, 0.5, False))
add(sfx, 85.0, impact(0, 0.35, False))
add(sfx, 88.64, impact(0, 1.0)); add(sfx, 88.1, riser(0.54, 0.5))
add(sfx, 93.45, impact(0, 0.7, True)); add(sfx, 93.3, riser(0.15, 0.2))
# final tiny sting: silence-ish tone under the last line
add(sfx, 99.2, decay_tone(98, 90, 3.0, 1.0), 0.12)

# ---------------- footsteps
for a, b, step in [(5.8, 15.6, 0.924), (18.9, 21.0, 1.047), (81.8, 85.0, 1.21)]:
    tt = a + 0.3
    while tt < b:
        add(tick, tt, footstep(0.45)); tt += step

# ---------------- voice ducking
vo_sr, vo = None, None
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "assets/vo.mp3", "-ac", "1", "-ar", str(SR), "/tmp/claude-0/vo_dec.wav"], stdin=subprocess.DEVNULL, check=True)
_sr, _v = wavfile.read("/tmp/claude-0/vo_dec.wav")
vo = _v.astype(np.float64) / 32768.0
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
env = lp(np.abs(vo), 6, 1)
env = np.clip(env / (np.percentile(env, 95) + 1e-9), 0, 1)
duck_amb = 1 - 0.55 * env
duck_sfx = 1 - 0.30 * env

mix = (drone * 0.11 + hum * 0.20) * duck_amb + (sfx * 0.30 + tick * 0.20) * duck_sfx
# silence right before the last line (98.2-94.84 zone): thin out everything a little
mix *= np.interp(T, [0, 93.1, 93.3, 94.7, 96, 103], [1, 1, 0.55, 0.55, 1, 1])
mix = np.tanh(mix * 1.1)
# stereo widening via tiny delay on hum/drone
L = mix.copy(); R = mix.copy()
dly = int(0.012 * SR)
R[dly:] = 0.82 * mix[dly:] + 0.18 * mix[:-dly]
# fade in/out
fade = np.minimum(1, T / 0.4) * np.minimum(1, (DUR - T) / 0.5)
out = np.stack([L * fade, R * fade], axis=1)
peak = np.max(np.abs(out))
out = out / peak * 0.8
wavfile.write("assets/bed.wav", SR, (out * 32767).astype(np.int16))
print("bed.wav written; peak before norm", round(float(peak), 3), "rms dBFS", round(20 * np.log10(np.sqrt(np.mean(out ** 2))), 1))
