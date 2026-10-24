"""Zombie-at-home sound design: sirens, screams, groans, TV alert, switch, water, furniture, knocks, key/chain, heartbeat, steps.
Writes assets/bed.wav (ducked under the voice) and assets/vo_master.wav (gentle compression + level)."""
import json, subprocess, numpy as np
from scipy import signal
from scipy.io import wavfile

CUE = json.load(open("assets/cues.json")); T_ = CUE["t"]
SR = 44100; DUR = CUE["dur"]; N = int(SR * DUR); T = np.arange(N) / SR
rs = np.random.RandomState(7)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "assets/vo.mp3", "-ac", "1", "-ar", str(SR), "/tmp/claude-0/zh_vo.wav"], stdin=subprocess.DEVNULL, check=True)
_, v = wavfile.read("/tmp/claude-0/zh_vo.wav"); vo = np.pad(v.astype(float) / 32768, (0, max(0, N - len(v))))[:N]

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
def impact(g=1.0):
    n = int(2.0 * SR); t = np.arange(n) / SR
    return (tone(64, 26, 2.0, 2.8) + lp(noise(n), 170) * np.exp(-t * 6) * 1.6 + hp(noise(n), 1500) * np.exp(-t * 40) * 0.35) * g
def riser(dur, g=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; u = t / dur
    return (bp(noise(n), 300, 6000) * u ** 2.2 + np.sin(2 * np.pi * (90 + 500 * u ** 2) * t) * u ** 2 * 0.3) * g
def thud(g=1.0, f=62):
    n = int(0.6 * SR); t = np.arange(n) / SR
    return (tone(f, 34, 0.6, 8.0) + lp(noise(n), 400) * np.exp(-t * 18) * 0.9) * g
def click(g=1.0, f=2200):
    n = int(0.08 * SR); t = np.arange(n) / SR
    return (bp(noise(n), 1500, 7000) * np.exp(-t * 90) + np.sin(2 * np.pi * f * t) * np.exp(-t * 110) * 0.6) * g
def groan(dur, f0=95, g=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; u = t / dur
    f = f0 * (1.0 - 0.35 * u) + 7 * np.sin(2 * np.pi * 5.5 * t)
    saw = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR)
    x = bp(saw, 300, 900) * 0.9 + bp(saw, 1200, 2200) * 0.35
    return x * np.sin(np.pi * u) ** 0.8 * g + bp(noise(n), 400, 1800) * 0.25 * np.sin(np.pi * u) * g
def scream(dur, g=1.0, muffle=False):
    n = int(dur * SR); t = np.arange(n) / SR; u = t / dur
    f = 700 + 500 * np.sin(np.pi * u) + 40 * np.sin(2 * np.pi * 9 * t)
    s = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR)
    x = bp(s, 600, 3200) * np.sin(np.pi * u) ** 0.6
    if muffle: x = lp(x, 700)
    return x * g
def siren(dur, g=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 700 + 350 * np.sin(2 * np.pi * 0.22 * t)
    return lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.5, 2500) * g

import glob, os
def load_samples():
    out = []
    for f in sorted(glob.glob('assets/sfx/*.mp3')):
        w = '/tmp/claude-0/zh_' + os.path.basename(f) + '.wav'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f, '-ac', '1', '-ar', str(SR), w], stdin=subprocess.DEVNULL, check=True)
        _, x = wavfile.read(w); x = x.astype(float) / 32768; x /= (np.abs(x).max() + 1e-9); out.append((os.path.basename(f), x))
    return out
SAMPLES = load_samples()
def zg(rate=1.0, cutoff=None, g=1.0, k=0):
    # a generated ElevenLabs creature sound, pitch/speed-shifted and filtered for distance
    name, x = SAMPLES[k % len(SAMPLES)]
    n = int(len(x) / rate); y = np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x)
    if cutoff: y = lp(y, cutoff, 2)
    return y * np.hanning(len(y)) ** 0.3 * g
ambient = np.zeros(N); sfx = np.zeros(N); steps = np.zeros(N); tick = np.zeros(N)
# city bed: low rumble + wind + far siren + fire crackle
rum = lp(noise(N), 200) * 0.35 + lp(noise(N), 1200) * 0.06 * (0.5 + 0.5 * np.sin(2 * np.pi * T / 9))
ambient += rum
for tt in np.arange(0.4, DUR - 2, 0.45):
    if rs.rand() < 0.3: add(ambient, tt, hp(noise(int(0.05 * SR)), 1500) * np.exp(-np.arange(int(0.05 * SR)) / SR * 70), 0.25)
# distant screams and groans outside
for i, tt in enumerate(np.arange(1.2, T_["heard"], 1.7)): add(sfx, tt, zg(rs.uniform(0.62, 1.0), rs.choice([900, 1400, 2200]), rs.uniform(0.35, 0.6), i))
# neighbours on the stairs (muffled) + door thumps
for k, tt in enumerate(np.linspace(T_["stairs"], T_["yard"] - 0.3, 5)): add(sfx, tt, zg(rs.uniform(0.7, 0.95), 700, 0.7, k)); add(sfx, tt + 0.2, thud(0.35, 90))
# TV static + emergency tone
add(sfx, 3.0, hp(noise(int(5 * SR)), 2500) * 0.12, 1.0)
for k in range(5):
    add(sfx, T_["five"] + k * 0.5, (np.sin(2 * np.pi * 853 * np.arange(int(0.22 * SR)) / SR) + np.sin(2 * np.pi * 960 * np.arange(int(0.22 * SR)) / SR)) * 0.2)
# runner past the window
add(sfx, T_["yard"] + 0.2, zg(0.8, 2500, 0.8)); add(sfx, 0.3, zg(0.75, 2000, 0.7))
# light switch: click + power-down hum + deep thump
add(sfx, T_["lightsOff"], click(1.0, 1600)); add(sfx, T_["lightsOff"] + 0.05, thud(0.7, 70)); add(sfx, T_["lightsOff"] + 0.02, impact(0.4))
# curtains swish
n = int(0.9 * SR); add(sfx, T_["curtains"], bp(noise(n), 500, 4000) * np.hanning(n) * 0.35)
# silent mode: short vibration buzz
add(sfx, T_["phone"] + 1.2, tone(180, 180, 0.35, 1.5) * 0.3); add(sfx, T_["phone"] + 1.6, click(0.6, 900))
# water: stream while the tub fills + pots clink
n = int((T_["rule3"] - T_["water"]) * SR); add(sfx, T_["water"], bp(noise(n), 900, 5500) * 0.22 * (0.8 + 0.2 * np.sin(2 * np.pi * 7 * np.arange(n) / SR)) * np.minimum(1, np.arange(n) / SR / 0.5))
for tt in [T_["hour"] - 0.5, T_["hour"] + 0.2, T_["hour"] + 0.9]: add(sfx, tt, tone(1100, 900, 0.3, 12) * 0.25)
# heavy furniture drag
for t0, dur in [(T_["wardrobe"], T_["sofa"] - T_["wardrobe"] - 0.3), (T_["sofa"], T_["peephole"] - T_["sofa"] - 0.3)]:
    n = int(dur * SR); x = lp(noise(n), 260) * 0.9 + bp(noise(n), 300, 1500) * 0.25 * (0.6 + 0.4 * np.sin(2 * np.pi * 6 * np.arange(n) / SR))
    add(sfx, t0, x * np.hanning(n) * 0.9); add(sfx, t0 + dur, thud(0.9, 60))
# peephole: hallway flicker buzz
n = int((T_["rule4"] - T_["peephole"]) * SR); add(sfx, T_["peephole"], (np.sin(2 * np.pi * 100 * np.arange(n) / SR) * 0.15 + bp(noise(n), 90, 140) * 0.3) * 0.5)
# zipper + item clicks
add(sfx, T_["rule4"] + 1.0, bp(noise(int(0.7 * SR)), 2000, 6000) * np.abs(np.sin(2 * np.pi * 38 * np.arange(int(0.7 * SR)) / SR)) * 0.25)
for k in ["docs", "charger", "kit", "cans", "knife"]: add(sfx, T_[k], click(0.8, 1500 + 300 * len(k) % 900)); add(sfx, T_[k], thud(0.25, 150))
add(sfx, T_["knife"], tone(3200, 2800, 0.5, 6) * 0.12)
# timer ticks (speeding up) and the final alarm at zero
tt = T_["minutes"] + 0.9
while tt < T_["heard"]:
    add(tick, tt, click(0.5, 1200)); left = 600 * (1 - (tt - (T_["minutes"] + 0.9)) / (T_["heard"] - (T_["minutes"] + 0.9))); tt += 1.0 if left > 150 else 0.5
add(sfx, T_["heard"] - 0.05, tone(900, 900, 1.4, 1.0) * 0.18); add(sfx, T_["heard"], impact(1.0)); add(sfx, T_["heard"] - 0.5, riser(0.5, 0.6))
# three knocks, mother's voice tension, then silence
for k in range(3): add(sfx, T_["knock"] + 0.0 + k * 0.75 + 0.2, thud(1.0, 55)); add(sfx, T_["knock"] + k * 0.75 + 0.2, hp(noise(int(0.15 * SR)), 800) * np.exp(-np.arange(int(0.15 * SR)) / SR * 30) * 0.6)
add(sfx, T_["voice"] - 0.3, riser(0.6, 0.4))
add(sfx, T_["momCalled"] - 0.1, tone(440, 440, 0.12, 10) * 0.4); add(sfx, T_["momCalled"] + 0.2, tone(440, 440, 0.12, 10) * 0.4)
# key in the lock, chain
add(sfx, T_["key"] - 0.3, bp(noise(int(0.5 * SR)), 2500, 7000) * np.abs(np.sin(2 * np.pi * 30 * np.arange(int(0.5 * SR)) / SR)) * 0.35)
add(sfx, T_["key"] + 0.5, click(1.0, 900)); add(sfx, T_["key"] + 0.5, thud(0.5, 80)); add(sfx, T_["key"] + 0.9, click(0.9, 700))
for k in range(8): add(sfx, T_["chain"] + k * 0.07, click(0.5, 3500 - 120 * k))
add(sfx, T_["chain"] + 0.5, thud(0.9, 50)); add(sfx, T_["chain"] + 0.6, zg(0.7, 3500, 1.0))
# rule hits
for k in ["rule1", "rule2", "rule3", "rule4", "rule5"]: add(sfx, T_[k], impact(0.45)); add(sfx, T_[k] - 0.2, riser(0.2, 0.25))
# heartbeat from "heard" on, faster and louder
hb = np.zeros(N); tt = T_["heard"]
while tt < CUE["endBlack"]:
    g = 0.3 + 0.7 * min(1, (tt - T_["heard"]) / 25)
    add(hb, tt, tone(55, 38, 0.4, 9), g); add(hb, tt + 0.26, tone(50, 36, 0.35, 10), g * 0.7); tt += 1.1 - 0.5 * min(1, (tt - T_["heard"]) / 25)
# tension drone
dr = (np.sin(2 * np.pi * 55 * T) + np.sin(2 * np.pi * 58.5 * T) * 0.8 + np.sin(2 * np.pi * 82.4 * T + 1) * 0.35 + lp(noise(N), 300) * 0.3)
dr *= np.interp(T, [0, T_["rule1"] - 1, T_["rule1"] + 3, T_["rule4"], T_["heard"], T_["behind"], CUE["endBlack"], DUR], [0, 0, 0.25, 0.6, 1.0, 1.2, 1.3, 0.2])
# footsteps behind him + zombie breath, then the sting
tt = T_["steps"]
while tt < T_["behind"] + 0.3: add(steps, tt, thud(0.8, 90)); tt += 0.55
add(sfx, T_["behind"] - 0.1, zg(0.6, 4500, 1.3)); add(sfx, T_["behind"], impact(1.4)); add(sfx, T_["behind"] - 0.5, riser(0.5, 0.6))
add(sfx, T_["steps"] - 0.4, zg(0.55, 3000, 0.5))

env = lp(np.abs(vo), 6, 1); env = np.clip(env / (np.percentile(env, 95) + 1e-9), 0, 1)
duck = 1 - 0.55 * env
mix = (ambient * 0.45 + dr * 0.10 + hb * 0.4) * duck + (sfx * 0.34 + steps * 0.5 + tick * 0.35) * (1 - 0.3 * env)
mix = np.tanh(mix * 1.1)
# abrupt silence at the end
mix *= np.interp(T, [0, CUE["endBlack"] - 0.05, CUE["endBlack"] + 0.15, DUR], [1, 1, 0.12, 0.12])
fade = np.minimum(1, T / 0.3) * np.minimum(1, (DUR - T) / 0.6)
L = mix * fade; R = np.copy(L); d = int(0.011 * SR); R[d:] = 0.84 * L[d:] + 0.16 * L[:-d]
out = np.stack([L, R], 1); out = out / np.abs(out).max() * 0.8
wavfile.write("assets/bed.wav", SR, (out * 32767).astype(np.int16))

# voice master: mild compression + high-pass + level
a_att, a_rel = np.exp(-1 / (0.005 * SR)), np.exp(-1 / (0.18 * SR)); ab = np.abs(vo); e = 0.0; env2 = np.zeros(N)
for i in range(N):
    x = ab[i]; e = a_att * e + (1 - a_att) * x if x > e else a_rel * e + (1 - a_rel) * x; env2[i] = e
y = vo * np.where(env2 > 0.07, (env2 / 0.07) ** (1 / 3 - 1), 1.0); y = hp(y, 70, 2); y *= 0.89 / np.abs(y).max()
wavfile.write("assets/vo_master.wav", SR, (y * 32767).astype(np.int16))
act = y[np.abs(y) > 0.01]
print("dur", DUR, "vo rms", round(20 * np.log10(np.sqrt((act ** 2).mean())), 1), "bed rms", round(20 * np.log10(np.sqrt((out ** 2).mean())), 1))
