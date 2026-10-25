import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter
SR = 44100; D = 30.0; N = int(SR * D)
t = np.arange(N) / SR
rs = np.random.RandomState(3)
def lp(x, f): b, a = butter(2, f / (SR / 2), "low"); return lfilter(b, a, x)
def hp(x, f): b, a = butter(2, f / (SR / 2), "high"); return lfilter(b, a, x)
def bp(x, lo, hi): b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], "band"); return lfilter(b, a, x)
def env(a, b, att=0.01, rel=0.1):
    e = np.zeros(N); m = (t >= a) & (t < b); e[m] = 1
    e = np.minimum(1, np.clip((t - a) / att, 0, 1)) * np.clip((b - t) / rel, 0, 1) * m; return e
L = np.zeros(N); R = np.zeros(N)
def add(x, pan=0.0, g=1.0):
    global L, R; L += x * g * (1 - max(0, pan)); R += x * g * (1 + min(0, pan))
BL = 0.7
# lit room: fridge hum + lamp buzz, dies at blackout with spin-down
hum_f = 100 - 90 * np.clip((t - BL) / 1.1, 0, 1) ** 0.6
ph = 2 * np.pi * np.cumsum(hum_f) / SR
lit = (np.sin(ph) * .5 + np.sin(2 * ph) * .25) * np.clip(1 - (t - BL) / 1.1, 0, 1) * (t < BL + 1.2)
add(lit * 0.25)
add(lp(rs.randn(N), 400) * 0.05 * (t < BL))
# distant tv/room chatter before outage
add(bp(rs.randn(N), 300, 1800) * (0.5 + 0.5 * np.sin(t * 9)) * 0.03 * (t < BL))
# transformer pop
crack = rs.randn(N) * env(BL - 0.02, BL + 0.35, 0.002, 0.3) * np.exp(-(t - BL) * 14)
add(hp(crack, 500) * 0.9, 0.2)
thud = np.sin(2 * np.pi * (70 - 35 * np.clip((t - BL) / 0.6, 0, 1)) * (t - BL)) * np.exp(-(t - BL) * 5) * (t >= BL)
add(thud * 1.1)
zap = np.sin(2 * np.pi * (3500 * np.exp(-(t - BL) * 10)) * (t - BL)) * np.exp(-(t - BL) * 18) * (t >= BL)
add(zap * 0.4, -0.3)
# dark room tone: low rumble + tiny high ringing
dark = (t >= BL + 0.2)
add(lp(rs.randn(N), 120) * 0.12 * dark)
add(np.sin(2 * np.pi * 5200 * t) * 0.006 * dark * np.clip((t - BL) / 2, 0, 1))
# opposite window flicker: electric clicks + rising tone
for k in (9.85, 9.97, 10.15, 10.27):
    add(hp(rs.randn(N), 2000) * env(k, k + 0.04, 0.001, 0.03) * 0.5, 0.4)
rise = np.sin(2 * np.pi * (60 + 70 * np.clip((t - 9.85) / 8, 0, 1)) * t) * env(9.85, 23.3, 1.5, 0.2)
add(rise * 0.35)
# drone, sub swell toward the turn
sw = np.clip((t - 10.2) / 12.5, 0, 1) ** 1.5
add((np.sin(2 * np.pi * 43 * t) + 0.6 * np.sin(2 * np.pi * 43.7 * t)) * sw * 0.28 * (t < 23.3))
add(bp(rs.randn(N), 300, 900) * sw * 0.05 * (t < 23.3))
# heartbeat, accelerating
bt = 12.0; i = 0
while bt < 23.25:
    for off, g in ((0, 1.0), (0.17, 0.7)):
        add(np.sin(2 * np.pi * 52 * (t - bt - off)) * np.exp(-(t - bt - off) * 22) * ((t >= bt + off)) * 0.8 * g)
    bt += max(0.4, 1.0 - 0.05 * i); i += 1
# phone flashlight click, floor creak, breath
add(hp(rs.randn(N), 1500) * env(20.2, 20.23, 0.001, 0.02) * 0.6, 0.0)
add(lp(rs.randn(N) * np.sin(2 * np.pi * 70 * t), 300) * env(21.7, 22.05, 0.05, 0.2) * 0.25, 0.5)
br = bp(rs.randn(N), 400, 2500) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.5 * (t - 21.0))) * env(21.0, 23.25, 0.4, 0.2)
add(br * 0.08, 0.6)
# reveal sting at 13.0 then hard silence
H = 23.3; he = env(H, H + 0.55, 0.003, 0.5) * (t >= H)
scr = sum(np.sign(np.sin(2 * np.pi * f * (t - H) * (1 + 0.15 * np.exp(-(t - H) * 5)))) for f in (610, 733, 1210, 1337)) / 4
add(hp(scr, 400) * he * 0.55, 0.0); add(hp(rs.randn(N), 3000) * he * 0.35)
add(np.sin(2 * np.pi * 38 * (t - H)) * np.exp(-(t - H) * 4) * (t >= H) * 1.3)
# after the cut: dead silence, then a soft low tone under end card
add(np.sin(2 * np.pi * 55 * t) * env(24.1, 30.0, 0.8, 0.8) * 0.12)
from scipy.io import wavfile as wf
vsr, v = wf.read("/tmp/claude-0/vo.wav"); v = v.astype(np.float64) / 32768.0
V = np.zeros(N); off = int(1.27 * SR); n = min(len(v), N - off); V[off:off + n] = v[:n]
V = hp(V, 90); V = V / (np.abs(V).max() + 1e-9)
V = np.tanh(V * 2.2) * 0.55 / np.tanh(2.2) * 1.6
ve = lp(np.abs(V), 6); duck = 1 - 0.55 * np.clip(ve / (ve.max() * 0.35), 0, 1)
L *= duck; R *= duck
m = np.maximum(np.abs(L).max(), np.abs(R).max()); k = 0.9 / m
L = np.tanh(L * k * 1.1); R = np.tanh(R * k * 1.1)
rv = np.zeros(N); 
for dl, g in ((0.043, .22), (0.089, .15), (0.151, .09)):
    d = int(dl * SR); rv[d:] += V[:-d] * g
Vw = V + lp(rv, 3500)
L += Vw * 0.95; R += Vw * 0.95
# hard mute exactly at the cut for impact
mute = np.where((t > H + 0.55) & (t < H + 0.65), 0.0, 1.0); L *= mute; R *= mute
out = np.stack([L, R], 1)
wavfile.write("assets/mix.wav", SR, (out * 32767).astype(np.int16))
print("ok", out.shape)
