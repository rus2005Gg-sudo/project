import json, subprocess, wave, numpy as np, os, tempfile
P = [
 ("hook", "Твой VPN — дрищ. Сейчас докажу.", "Твой ви-пи-эн — дрищ. Сейчас докажу."),
 ("meet", "Знакомься: бесплатный VPN. Он еле поднимает одно видео.", "Знакомься: бесплатный ви-пи-эн. Он еле поднимает одно видео."),
 ("fail", "Открываешь Instagram — он падает. Включаешь игру — пинг триста.", "Открываешь инстаграм — он падает. Включаешь игру — пинг триста."),
 ("leak", "А чтобы его кормили, он сливает твои данные.", "А чтобы его кормили, он сливает твои данные."),
 ("horz", "А это Хорз. Он качается каждый день.", "А это Хорз. Он качается каждый день."),
 ("lift", "10 Гбит/с — это его разминка.", "Десять гигабит в секунду — это его разминка."),
 ("always", "Серверы 24/7. Ни одной пропущенной тренировки.", "Серверы двадцать четыре на семь. Ни одной пропущенной тренировки."),
 ("fight", "Хакеры, трекеры, блокировки? Он их даже не замечает.", "Хакеры, трекеры, блокировки? Он их даже не замечает."),
 ("nologs", "И никаких логов. Настоящий качок не болтает.", "И никаких логов. Настоящий качок не болтает."),
 ("cta", "Хватит тренироваться с дрищом. Бери Хорза: @horzvpnbot в Telegram.", "Хватит тренироваться с дрищом. Бери Хорза: хорз ви-пи-эн бот в телеграме."),
]
sr = 24000; gap = 0.35; t = 0.3; audio = [np.zeros(int(t * sr))]; phrases = []; segs = []
for sid, cap, tts in P:
    f = tempfile.mktemp(suffix='.wav')
    subprocess.run(['RHVoice-test', '-p', 'aleksandr-hq', '-r', '125', '-o', f], input=tts.encode(), check=True)
    w = wave.open(f); rate = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(float)
    if rate != sr: x = np.interp(np.arange(0, len(x), rate / sr), np.arange(len(x)), x)
    d = len(x) / sr
    segs.append({"id": sid, "start": round(max(0, t - 0.2), 2) if segs else 0.0})
    phrases.append({"text": cap, "start": round(t, 2), "end": round(t + d, 2)})
    audio += [x, np.zeros(int(gap * sr))]; t += d + gap; os.remove(f)
y = np.concatenate(audio).astype('<i2')
with wave.open('public/gym/voice.wav', 'w') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(y.tobytes())
json.dump({"voice": "gym/voice.wav", "segments": segs, "phrases": phrases, "total": round(t + 1.2, 2)},
          open('src/gym/timeline.json', 'w'), ensure_ascii=False, indent=1)
print(round(t, 1), [(s['id'], s['start']) for s in segs])
