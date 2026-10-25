import json, os, numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter
c = json.loads(open("assets/cues.js", encoding="utf8").read()[len("window.CUE="):-1]); E = c["e"]; D = c["dur"]
SR = 44100; N = int(SR * D); t = np.arange(N) / SR; rs = np.random.RandomState(7)
def lp(x, f, o=2): b, a = butter(o, f / (SR / 2), "low"); return lfilter(b, a, x)
def hp(x, f, o=2): b, a = butter(o, f / (SR / 2), "high"); return lfilter(b, a, x)
def bp(x, lo, hi): b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], "band"); return lfilter(b, a, x)
def env(a, b, att=0.02, rel=0.1): return np.clip((t - a) / att, 0, 1) * np.clip((b - t) / rel, 0, 1) * ((t >= a) & (t < b))
bed = np.zeros(N)
has = lambda n: os.path.exists('assets/sfx/%s.wav' % n)
pg = lambda n: 0.2 if has(n) else 1.0
def place(name, start, gain, dur=None):
    if not has(name): return np.zeros(N)
    x = wavfile.read('assets/sfx/%s.wav' % name)[1].astype(np.float64) / 32768.0
    if x.ndim > 1: x = x.mean(1)
    if dur: x = np.resize(x, int(dur * SR)) * np.minimum(1, np.minimum(np.arange(int(dur * SR)) / (0.3 * SR), (int(dur * SR) - np.arange(int(dur * SR))) / (0.4 * SR)))
    o = np.zeros(N); a = int(start * SR); n = min(len(x), N - a); o[a:a + n] = x[:n]; return o * gain
# blackout at start: transformer pop + fridge hum spin-down
bed += hp(rs.randn(N), 500) * env(0.0, 0.3, 0.002, 0.25) * np.exp(-t * 12) * 0.9 * pg('transformer')
bed += np.sin(2 * np.pi * (70 - 30 * np.clip(t / 0.6, 0, 1)) * t) * np.exp(-t * 5) * 1.1
hum = 100 - 92 * np.clip(t / 1.2, 0, 1) ** 0.6
bed += (np.sin(2 * np.pi * np.cumsum(hum) / SR)) * np.clip(1 - t / 1.3, 0, 1) * 0.3
# dark room tone
bed += lp(rs.randn(N), 140) * 0.11 * (t > 0.3) + np.sin(2 * np.pi * 5100 * t) * 0.004 * (t > 1)
# rule 1: fridge door-thunk (quiet) not opened -> single soft knock
for k in (E["r1"] + 1.2,): bed += np.sin(2 * np.pi * 60 * (t - k)) * np.exp(-np.clip(t - k, 0, None) * 18) * (t >= k) * 0.5
# rule 2: water running into tub
w = bp(rs.randn(N), 700, 5200) * (0.6 + 0.4 * np.sin(2 * np.pi * 3.1 * t)) * env(E["r2"] + 0.3, E["r3"] - 0.8, 0.4, 0.8)
bed += (w * 0.22 + lp(rs.randn(N), 600) * env(E["r2"] + 1.0, E["r3"] - 0.8, 1.5, 0.8) * 0.1) * pg('water')
# rule 3: phone clicks, battery blip
for k in (E["r3"] + 0.6, E["r3"] + 2.6): bed += hp(rs.randn(N), 2500) * env(k, k + 0.03, 0.001, 0.02) * 0.4
for k, f in ((E["r3"] + 0.7, 880), (E["r3"] + 0.82, 1320)): bed += np.sin(2 * np.pi * f * t) * env(k, k + 0.09, 0.005, 0.07) * 0.12
# rule 4: lighter flick + candle crackle, flashlight click
bed += hp(rs.randn(N), 3000) * env(E["r4"] - 0.05, E["r4"] + 0.05, 0.002, 0.04) * 0.5
cr = (rs.rand(N) > 0.9993).astype(float); cr = lp(np.convolve(cr, np.exp(-np.arange(400) / 40.0))[:N], 6000) * rs.randn(N)
bed += pg('candle') * (cr * env(E["r4"], E["r4"] + 3.0, 0.2, 0.3) * 0.5) + lp(rs.randn(N), 900) * env(E["r4"], E["r4"] + 3.0, 0.3, 0.4) * 0.03
bed += hp(rs.randn(N), 1500) * env(E["r4"] + 2.4, E["r4"] + 2.43, 0.001, 0.02) * 0.6
# rule 5: cold wind + breath
bed += bp(rs.randn(N), 150, 700) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.25 * t)) * env(E["r5"], E["r6"], 1.0, 1.0) * 0.08
bed += bp(rs.randn(N), 500, 2600) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.35 * t)) * env(E["r5"] + 0.5, E["r6"] - 0.3, 0.6, 0.6) * 0.05
# rule 6: radio static + faint murmur
rad = bp(rs.randn(N), 400, 4500) * env(E["r6"] + 1.0, E["chk"] - 0.4, 0.2, 0.5)
mur = bp(rs.randn(N), 250, 1800) * (0.5 + 0.5 * np.sin(2 * np.pi * 2.3 * t) * np.sin(2 * np.pi * 0.7 * t)) * env(E["r6"] + 2.4, E["chk"] - 0.4, 0.6, 0.5)
bed += (rad * 0.07 + mur * 0.09) * pg('radio')
# drone beneath the check section + heartbeat
sw = np.clip((t - E["chk"]) / (E["twist"] - E["chk"]), 0, 1) ** 1.4
bed += (np.sin(2 * np.pi * 41 * t) + 0.6 * np.sin(2 * np.pi * 41.8 * t)) * sw * 0.22 * (t < E["twist"] + 1.8)
bt = E["chk"] + 0.5
while bt < E["twist"]:
    for off, g in ((0, 1.0), (0.17, 0.7)): bed += np.sin(2 * np.pi * 52 * (t - bt - off)) * np.exp(-np.clip(t - bt - off, 0, None) * 22) * (t >= bt + off) * 0.6 * g
    bt += max(0.45, 0.95 - 0.1 * (bt - E["chk"]))
# twist: tub drains (gurgle) then dead silence, soft sting at end card
tw = E["twist"]
gur = bp(rs.randn(N), 200, 1400) * (0.5 + 0.5 * np.sin(2 * np.pi * (6 + 4 * (t - tw)) * t)) * env(tw, tw + 1.6, 0.1, 0.5)
bed += gur * 0.3 * pg('drain') + np.sin(2 * np.pi * 36 * (t - tw)) * np.exp(-np.clip(t - tw, 0, None) * 2.5) * (t >= tw) * 0.6
bed += place('transformer', 0.0, 0.9) + place('water', E['r2'] + 0.3, 0.6, E['r3'] - E['r2'] - 1.2) + place('candle', E['r4'] - 0.1, 0.7, 3.4) + place('radio', E['r6'] + 0.9, 0.55, E['chk'] - E['r6'] - 1.4) + place('drain', E['twist'], 0.9)
mute = np.where((t > tw + 1.7) & (t < E["end"] + 0.35), 0.0, 1.0); bed *= mute
bed += np.sin(2 * np.pi * 55 * t) * env(E["end"] + 0.4, D, 0.8, 0.8) * 0.1
# voice: bass-boosted baritone
v = wavfile.read("/tmp/claude-0/vo_g.wav")[1].astype(np.float64) / 32768.0
V = np.zeros(N); off = int(0.35 * SR); n = min(len(v), N - off); V[off:off + n] = v[:n]
V = hp(V, 70)
V = np.tanh(V / (np.abs(V).max() + 1e-9) * 1.6) / np.tanh(1.6) * 0.95
rv = np.zeros(N)
for dl, g in ((0.037, .2), (0.083, .14), (0.143, .09)): d = int(dl * SR); rv[d:] += V[:-d] * g
V = V + lp(rv, 3000)
ve = lp(np.abs(V), 6); duck = 1 - 0.6 * np.clip(ve / (ve.max() * 0.3), 0, 1)
bed = bed * duck
bed = bed / (np.abs(bed).max() + 1e-9) * 0.8
mix = np.tanh((bed * 0.9 + V * 1.0) * 1.05)
st = np.stack([mix + lp(mix, 800) * 0.0, mix], 1)
# slight stereo width via tiny delay on the bed side
dd = int(0.0007 * SR); st[dd:, 1] = mix[:-dd] * 0.98
wavfile.write("assets/mix.wav", SR, (st * 32767 * 0.95).astype(np.int16)); print("ok", st.shape, D)
