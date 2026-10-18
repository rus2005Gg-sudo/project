import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {clamp, OUT, INOUT} from './kit';
import {HZ, HZ_BG, HZ_BLUE, HZ_INK, HZ_SUB, Wordmark} from './brand';
import {HAPP_TRACK} from './happTrack';

/**
 * Tutorial: how to change the Happ theme via the Horz VPN bot.
 * Screen recording 828×1792 @60 fps placed in an iPhone frame; idle parts sped up,
 * iOS sheet/app-switch animations cut; share-sheet apps are blurred except Happ.
 */
const FPS = 30;
const SRC_W = 828;
const SRC_H = 1792;

type Seg = {s: number; e: number; rate: number; step: number};
// source seconds
const SEGS: Seg[] = [
	{s: 0.0, e: 1.75, rate: 1, step: 0},
	{s: 1.75, e: 3.62, rate: 1, step: 1},
	{s: 3.62, e: 8.35, rate: 1.6, step: 2},
	{s: 8.35, e: 10.3, rate: 1, step: 3},
	{s: 10.3, e: 11.85, rate: 1, step: 4},
	{s: 11.85, e: 13.95, rate: 1.6, step: 5},
	{s: 14.25, e: 16.33, rate: 1, step: 6}, // share sheet (slide-in cut) — masked
	{s: 16.6, e: 20.0, rate: 1, step: 7}, // Happ with the new theme (app-switch cut)
];
const SEG_LEN = SEGS.map((g) => Math.round(((g.e - g.s) / g.rate) * FPS));
const SEG_AT = SEG_LEN.map((_, i) => SEG_LEN.slice(0, i).reduce((a, b) => a + b, 0));
const VIDEO_END = SEG_AT[SEGS.length - 1] + SEG_LEN[SEGS.length - 1];
const END_CARD = 75;
export const HAPP_FRAMES = VIDEO_END + END_CARD;

/** output frame of a source time */
const outOf = (t: number) => {
	const i = SEGS.findIndex((g) => t >= g.s && t <= g.e);
	const g = SEGS[i];
	return SEG_AT[i] + ((t - g.s) / g.rate) * FPS;
};
/** source time + segment index of an output frame */
const srcOf = (f: number) => {
	let i = SEGS.length - 1;
	for (let k = 0; k < SEGS.length; k++) if (f < SEG_AT[k] + SEG_LEN[k]) {
		i = k;
		break;
	}
	const g = SEGS[i];
	return {i, t: g.s + ((Math.max(0, f - SEG_AT[i])) / FPS) * g.rate};
};

const STEPS = [
	'Открой бота и нажми «Мой VPN»',
	'Нажми «Оформление Happ»',
	'Выбери тему — например «Графит»',
	'Нажми «Загрузить тему в Happ»',
	'Открой файл, который прислал бот',
	'Нажми «Поделиться»',
	'Пролистай и выбери Happ',
	'Готово! Новая тема в Happ',
];

// taps: source time, x, y (source px)
const TAPS: [number, number, number][] = [
	[1.6, 310, 1231],
	[3.55, 321, 1495],
	[8.3, 167, 1321],
	[10.25, 321, 1408],
	[11.8, 82, 1000],
	[13.9, 723, 1687],
	[16.3, 506, 1313],
];

/* ---------- phone layout ---------- */
const K = 0.64; // screen scale
const SCR_W = SRC_W * K;
const SCR_H = SRC_H * K;
const BEZ = 14;
const PH_W = SCR_W + BEZ * 2;
const PH_H = SCR_H + BEZ * 2;
const PH_X = (1080 - PH_W) / 2;
const PH_Y = 508;
const ANCHOR = {x: 540, y: 1060};
const ZOOM = 1.2;

const ease = (t: number) => INOUT(Math.min(1, Math.max(0, t)));

/** camera: gentle push-in toward the next tap target, plus a look at the result */
const camera = (f: number) => {
	type Shot = {at: number; x: number; y: number; z: number; pre: number; post: number; hold: number};
	const shots: Shot[] = TAPS.map(([t, x, y], i) => ({at: outOf(t), x, y, z: ZOOM, pre: i === 6 ? 46 : 26, post: 16, hold: 6}));
	shots.push({at: outOf(17.2), x: 414, y: 520, z: 1.14, pre: 14, post: 22, hold: 34});
	let best = {w: 0, x: SRC_W / 2, y: SRC_H / 2, z: 1};
	for (const s of shots) {
		const w = f < s.at ? ease(1 - (s.at - f) / s.pre) : f < s.at + s.hold ? 1 : ease(1 - (f - s.at - s.hold) / s.post);
		if (w > best.w) best = {w, x: s.x, y: s.y, z: s.z};
	}
	return best;
};

const TapRing: React.FC<{f: number}> = ({f}) => (
	<>
		{TAPS.map(([t, x, y]) => {
			// keep each ring inside its own segment (no spill across the cuts)
			const seg = SEGS.findIndex((g) => t >= g.s && t <= g.e);
			const segEnd = SEG_AT[seg] + SEG_LEN[seg];
			const start = Math.min(outOf(t) - 4, segEnd - 14);
			const d = f - start;
			if (d < 0 || d > 18 || f >= segEnd) return null;
			const p = interpolate(d, [0, 18], [0, 1], {...clamp, easing: OUT});
			const dot = interpolate(d, [0, 3, 10], [0, 1, 0], clamp);
			return (
				<React.Fragment key={t}>
					<div style={{position: 'absolute', left: x - 90, top: y - 90, width: 180, height: 180, borderRadius: '50%', border: `8px solid ${HZ_BLUE}`, opacity: 1 - p, scale: String(0.35 + p * 0.75), boxShadow: '0 0 24px rgba(10,77,255,0.6)'}} />
					<div style={{position: 'absolute', left: x - 42, top: y - 42, width: 84, height: 84, borderRadius: '50%', background: 'rgba(255,255,255,0.75)', opacity: dot * 0.9, scale: String(0.6 + dot * 0.4)}} />
				</React.Fragment>
			);
		})}
	</>
);

/** blur every app in the share sheet except Happ (tracked per source frame) */
const SheetMask: React.FC<{t: number}> = ({t}) => {
	if (t < 14.2 || t > 16.34) return null;
	const idx = Math.round((t - HAPP_TRACK.t0) * HAPP_TRACK.fps);
	const hx = idx >= 0 && idx < HAPP_TRACK.x.length ? HAPP_TRACK.x[idx] : null;
	const Y0 = 1226;
	const Y1 = 1444;
	const blur: React.CSSProperties = {position: 'absolute', top: Y0, height: Y1 - Y0, backdropFilter: 'blur(26px) saturate(0.5)', WebkitBackdropFilter: 'blur(26px) saturate(0.5)', background: 'rgba(28,28,32,0.55)'};
	if (hx === null || hx === undefined) return <div style={{...blur, left: 0, width: SRC_W}} />;
	const L = Math.max(0, hx - 16);
	const R = Math.min(SRC_W, hx + 156);
	const glow = interpolate(t, [15.75, 16.0], [0, 1], clamp);
	return (
		<>
			{L > 0 ? <div style={{...blur, left: 0, width: L}} /> : null}
			{R < SRC_W ? <div style={{...blur, left: R, width: SRC_W - R}} /> : null}
			<div style={{position: 'absolute', left: hx - 8, top: 1235, width: 156, height: 200, borderRadius: 36, border: `6px solid ${HZ_BLUE}`, boxShadow: '0 0 30px rgba(10,77,255,0.7)', opacity: glow}} />
		</>
	);
};

const Tick: React.FC<{at: number; vol?: number}> = ({at, vol = 0.18}) => (
	<Sequence from={Math.max(0, Math.round(at))} layout="none">
		<Audio src={staticFile('sfx/tick-001.mp3')} volume={vol} />
	</Sequence>
);

const Caption: React.FC<{f: number}> = ({f}) => {
	const {i} = srcOf(Math.min(f, VIDEO_END - 1));
	const local = f - SEG_AT[i];
	const p = interpolate(local, [0, 12], [0, 1], {...clamp, easing: OUT});
	const done = i === STEPS.length - 1;
	return (
		<div style={{position: 'absolute', left: 80, right: 80, top: 282, height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16}}>
			<div key={`p${i}`} style={{opacity: p, translate: `0 ${(1 - p) * 18}px`, fontFamily: HZ, fontWeight: 800, fontSize: 30, letterSpacing: 3, color: '#fff', background: done ? '#22b45a' : HZ_BLUE, padding: '10px 26px', borderRadius: 40, textTransform: 'uppercase'}}>
				{done ? 'Готово ✓' : `Шаг ${i + 1} из 7`}
			</div>
			<div key={`c${i}`} style={{opacity: p, translate: `0 ${(1 - p) * 30}px`, filter: p < 0.99 ? `blur(${(1 - p) * 8}px)` : undefined, fontFamily: HZ, fontWeight: 900, fontSize: 56, lineHeight: 1.08, letterSpacing: -2, color: HZ_INK, textAlign: 'center'}}>
				{STEPS[i]}
			</div>
		</div>
	);
};

const Watermark: React.FC = () => (
	<div style={{position: 'absolute', top: 190, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
		<div style={{display: 'flex', alignItems: 'baseline', gap: 10, background: 'rgba(255,255,255,0.92)', padding: '10px 28px', borderRadius: 40, boxShadow: '0 8px 24px rgba(20,30,60,0.10)'}}>
			<span style={{fontFamily: HZ, fontWeight: 900, fontSize: 34, color: HZ_INK, letterSpacing: -1}}>
				HORZ<span style={{color: HZ_BLUE}}>.</span>
			</span>
			<span style={{fontFamily: HZ, fontWeight: 700, fontSize: 20, color: HZ_SUB, letterSpacing: 4}}>VPN</span>
		</div>
	</div>
);

export const HappTheme: React.FC = () => {
	const f = useCurrentFrame();
	const {t} = srcOf(Math.min(f, VIDEO_END - 1));
	const cam = camera(f);
	const B = {x: PH_X + BEZ + cam.x * K, y: PH_Y + BEZ + cam.y * K};
	// calm camera: small push-in, capped travel so the phone never flies off
	const tx = Math.max(-70, Math.min(70, ANCHOR.x - B.x)) * cam.w;
	const ty = Math.max(-300, Math.min(110, ANCHOR.y - B.y)) * cam.w;
	const z = 1 + (cam.z - 1) * cam.w;
	const intro = interpolate(f, [0, 16], [0, 1], {...clamp, easing: OUT});
	const outro = interpolate(f, [VIDEO_END - 6, VIDEO_END + 10], [0, 1], {...clamp, easing: INOUT});
	const card = interpolate(f, [VIDEO_END, VIDEO_END + 16], [0, 1], {...clamp, easing: OUT});

	return (
		<AbsoluteFill style={{background: HZ_BG}}>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 45% at 50% 62%, rgba(10,77,255,0.10), rgba(10,77,255,0) 70%)'}} />

			{/* phone */}
			<div style={{position: 'absolute', left: PH_X, top: PH_Y, width: PH_W, height: PH_H, transformOrigin: `${B.x - PH_X}px ${B.y - PH_Y}px`, transform: `translate(${tx}px, ${ty + (1 - intro) * 120 + outro * 900}px) scale(${z})`, opacity: intro * (1 - outro)}}>
				<div style={{position: 'absolute', inset: 0, borderRadius: 70, background: '#0b0b0d', boxShadow: '0 0 0 4px #c9ccd3, 0 0 0 5px #9aa0aa, 0 50px 110px rgba(20,30,60,0.35)'}} />
				<div style={{position: 'absolute', left: BEZ, top: BEZ, width: SCR_W, height: SCR_H, borderRadius: 54, overflow: 'hidden', background: '#000'}}>
					<div style={{position: 'absolute', left: 0, top: 0, width: SRC_W, height: SRC_H, transform: `scale(${K})`, transformOrigin: '0 0'}}>
						{SEGS.map((g, i) => (
							<Sequence key={i} from={SEG_AT[i]} durationInFrames={SEG_LEN[i]} layout="none">
								<OffthreadVideo src={staticFile('happ/rec.mp4')} startFrom={Math.round(g.s * FPS)} playbackRate={g.rate} muted style={{position: 'absolute', left: 0, top: 0, width: SRC_W, height: SRC_H}} />
							</Sequence>
						))}
						<SheetMask t={t} />
						<TapRing f={f} />
					</div>
				</div>
			</div>

			{/* solid band under the captions — the phone slides beneath it */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 540, background: 'linear-gradient(180deg, #fbfcfe 0%, #fbfcfe 86%, rgba(251,252,254,0) 100%)', opacity: 1 - card}} />
			{/* top: step captions (hidden under the end card) */}
			{f < VIDEO_END + 4 ? <div style={{opacity: 1 - card}}><Caption f={f} /></div> : null}

			{/* end card */}
			{f >= VIDEO_END - 2 ? (
				<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 46, padding: '290px 100px 360px', opacity: card}}>
					<div style={{translate: `0 ${(1 - card) * 40}px`}}>
						<Wordmark size={210} />
					</div>
					<div style={{fontFamily: HZ, fontWeight: 900, fontSize: 64, letterSpacing: -2, color: HZ_INK, textAlign: 'center', lineHeight: 1.1}}>
						Свой стиль — <span style={{color: HZ_BLUE}}>в один тап</span>
					</div>
					<div style={{fontFamily: HZ, fontWeight: 800, fontSize: 60, color: '#fff', background: HZ_INK, padding: '30px 70px', borderRadius: 80, letterSpacing: -1}}>@horzvpnbot</div>
				</AbsoluteFill>
			) : null}

			<Watermark />
			{TAPS.map(([tt]) => {
				const seg = SEGS.findIndex((g) => tt >= g.s && tt <= g.e);
				return <Tick key={tt} at={Math.min(outOf(tt) - 4, SEG_AT[seg] + SEG_LEN[seg] - 14)} />;
			})}
			<Tick at={VIDEO_END + 4} vol={0.14} />
		</AbsoluteFill>
	);
};
