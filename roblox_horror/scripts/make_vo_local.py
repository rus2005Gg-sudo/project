"""Local fallback narration: Kokoro per-sentence synthesis (exact sentence timings) -> assets/vo.wav + assets/words.json"""
import subprocess, numpy as np, soundfile as sf, re, os, json
paras = open('scripts/vo_text.txt').read().strip().split('\n\n')
os.makedirs('/tmp/claude-0/kk', exist_ok=True)
sents = []
for pi, p in enumerate(paras):
    parts = re.findall(r'[^.?!]+[.?!]+["”]?|[^.?!]+$', p.replace('...', '…'))
    for si, s in enumerate(parts):
        s = s.strip().replace('…', '...')
        if s: sents.append((s, si == len(parts) - 1))
chunks, words, t, sr = [], [], 0.0, 24000
lead = 0.25
chunks.append(np.zeros(int(sr * lead))); t += lead
for i, (s, last) in enumerate(sents):
    f = f'/tmp/claude-0/kk/s{i}.txt'; open(f, 'w').write(s); out = f'/tmp/claude-0/kk/s{i}.wav'
    subprocess.run(['npx', 'hyperframes', 'tts', f, '--voice', 'bm_george', '--speed', '0.84', '-o', out], capture_output=True, text=True, stdin=subprocess.DEVNULL)
    x, sr = sf.read(out)
    # trim leading/trailing silence
    nz = np.where(np.abs(x) > 0.01)[0]; x = x[nz[0]:nz[-1] + 1] if len(nz) else x
    dur = len(x) / sr
    toks = s.split()
    wts = [len(re.sub(r'\W', '', w)) + 2 + (3 if re.search(r'[,:]$', w) else 0) + (5 if re.search(r'[.?!]["”]?$', w) else 0) for w in toks]
    tot = sum(wts); a = t
    for w, wt in zip(toks, wts):
        d = dur * wt / tot; words.append([w.strip('"“”'), round(a, 3), round(a + d * 0.92, 3)]); a += d
    chunks.append(x); t += dur
    gap = 0.75 if last else (0.5 if s.rstrip().endswith('...') else 0.32)
    chunks.append(np.zeros(int(sr * gap))); t += gap
    print(i, round(t, 1), s[:50])
y = np.concatenate(chunks)
sf.write('assets/vo.wav', y, sr)
json.dump(words, open('assets/words.json', 'w'), ensure_ascii=False)
print('total', round(len(y) / sr, 2), 'words', len(words))
