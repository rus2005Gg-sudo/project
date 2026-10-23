"""Gentle compression + level match of the ElevenLabs voice-over -> assets/vo_master.wav (voice track)."""
import numpy as np
from scipy.io import wavfile
from scipy import signal
sr, x = wavfile.read("/tmp/claude-0/vo_dec.wav"); x = x.astype(np.float64) / 32768.0
# envelope follower
a_att, a_rel = np.exp(-1 / (0.005 * sr)), np.exp(-1 / (0.18 * sr))
env = np.zeros_like(x); e = 0.0
ab = np.abs(x)
for i in range(len(x)):  # vectorising not needed for 100 s
    v = ab[i]; e = a_att * e + (1 - a_att) * v if v > e else a_rel * e + (1 - a_rel) * v; env[i] = e
thr, ratio = 0.06, 3.0
gain = np.where(env > thr, (env / thr) ** (1 / ratio - 1), 1.0)
y = x * gain
y = signal.sosfilt(signal.butter(2, 70, "high", fs=sr, output="sos"), y)
y *= 0.89 / np.abs(y).max()
act = y[np.abs(y) > 0.01]
print("peak dB", round(20 * np.log10(np.abs(y).max()), 1), "rms-active dB", round(20 * np.log10(np.sqrt((act ** 2).mean())), 1))
wavfile.write("assets/vo_master.wav", sr, (y * 32767).astype(np.int16))
