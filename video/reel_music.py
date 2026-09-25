import json, numpy as np, wave
tl = json.load(open('src/reel/timeline.json')); T = tl['total']
st = {s['id']: s['start'] for s in tl['segments']}
sr = 44100; n = int(T * sr); t = np.arange(n) / sr
rng = np.random.default_rng(7)
horz = st['horz']
dark = np.clip((horz - t) / 0.4, 0, 1); light = 1 - dark

def lp(x, k): return np.convolve(x, np.ones(k) / k, 'same')
def place(buf, at, x):
    i = int(at * sr); m = min(len(x), n - i)
    if m > 0: buf[i:i + m] += x[:m]

drone = (np.sin(2*np.pi*55*t) + 0.6*np.sin(2*np.pi*55.4*t) + 0.4*np.sin(2*np.pi*82.4*t + 0.5*np.sin(2*np.pi*0.15*t))) * 0.1
air = lp(rng.standard_normal(n), 120) * 0.35 * (0.6 + 0.4*np.sin(2*np.pi*0.1*t))
bpm = 100; beat = 60 / bpm
kick = np.zeros(n); hat = np.zeros(n); bass = np.zeros(n)
L = int(0.3*sr); tt = np.arange(L)/sr
K = np.sin(2*np.pi*(45 + 110*np.exp(-tt*28))*tt) * np.exp(-tt*8)
H = rng.standard_normal(int(0.04*sr)) * np.exp(-np.arange(int(0.04*sr))/sr*90)
notes_dark = [55, 55, 65.4, 49]; notes_light = [65.4, 73.4, 87.3, 98]
for k, b in enumerate(np.arange(st['forum'], T - 1.0, beat)):
    place(kick, b, K * 0.5)
    place(hat, b + beat/2, H * 0.07)
    f0 = (notes_light if b >= horz else notes_dark)[(k // 4) % 4]
    Lb = int(beat*sr); tb = np.arange(Lb)/sr
    place(bass, b, np.sin(2*np.pi*f0*tb) * np.exp(-tb*4) * 0.18)
chords = np.zeros(n)
for i, f in enumerate([261.6, 329.6, 392.0, 493.9, 587.3]):
    chords += np.sin(2*np.pi*f*t + i) * 0.028 * (1 + 0.4*np.sin(2*np.pi*(beat**-1/2)*t))
arp = np.zeros(n)
for k, b in enumerate(np.arange(horz, T - 1.0, beat/2)):
    f = [523.3, 659.3, 784.0, 987.8][k % 4]; Lb = int(0.25*sr); tb = np.arange(Lb)/sr
    place(arp, b, np.sin(2*np.pi*f*tb) * np.exp(-tb*10) * 0.07)
fx = np.zeros(n)
for sid, s in st.items():
    if s <= 0: continue
    Lw = int(0.5*sr); tw = np.arange(Lw)/sr
    w = lp(rng.standard_normal(Lw), 6) * np.sin(np.pi * tw / 0.5) ** 2 * 0.22
    place(fx, s - 0.35, w)
for at, amp in [(0, 0.7), (horz, 0.6)]:
    Lh = int(1.8*sr); th = np.arange(Lh)/sr
    place(fx, at, (np.sin(2*np.pi*38*th) + rng.standard_normal(Lh)*0.5*np.exp(-th*7)) * np.exp(-th*2.2) * amp)
mix = (drone + air*0.35) * dark + chords * light + arp + kick + hat + bass + fx
mix *= np.clip(t/0.02, 0, 1) * np.clip((T - t)/1.5, 0, 1)
mix = np.tanh(mix * 1.3) * 0.6
with wave.open('public/reel/music.wav', 'w') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr)
    w.writeframes((np.stack([mix, mix], 1) * 32767).astype('<i2').tobytes())
print('ok', T)
