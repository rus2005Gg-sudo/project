import React from 'react';
import '@fontsource/jetbrains-mono/500.css';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {Img} from 'remotion';
import {LOGO, ACCENT, AppIcon, AppleBg, BlackPill, Card, Drift as KitDrift, Eyebrow, GRAY, HAIR, INK, INOUT, IT, Lines, Lockup, Rise, SUB, blurZoom, clamp, prog} from './kit';

export const BS_FPS = 30;
const VOICE = 67.04;
const TR = 14;
// scene starts (s), slightly ahead of the first word of each phrase (word times from ASR)
const STARTS = [0, 9.25, 13.65, 20.65, 25.05, 38.4, 47.55, 57.75, 63.1];
const fr = (s: number) => Math.round(s * BS_FPS);
export const BSOD_FRAMES = fr(VOICE + 1.4);
const DUR = STARTS.map((s, i) => (i < STARTS.length - 1 ? fr(STARTS[i + 1]) : BSOD_FRAMES) - fr(s));
// local frame of absolute second t inside scene i
const at = (i: number, t: number) => fr(t) - fr(STARTS[i]);

const Col: React.FC<{children: React.ReactNode; gap?: number}> = ({children, gap = 0}) => (
	<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap}}>{children}</AbsoluteFill>
);

const Tick: React.FC<{at: number; vol?: number}> = ({at: a, vol = 0.16}) => (
	<Sequence from={Math.max(0, a)} layout="none">
		<Audio src={staticFile('sfx/tick-001.mp3')} volume={vol} />
	</Sequence>
);

/** number that rolls between two values over [a, b] frames */
const Roll: React.FC<{from: number; to: number; a: number; b: number}> = ({from, to, a, b}) => {
	const f = useCurrentFrame();
	return <span style={{fontVariantNumeric: 'tabular-nums'}}>{Math.round(interpolate(f, [a, b], [from, to], {...clamp, easing: INOUT}))}</span>;
};

/** soft pop used for single words / numbers */
const Pop: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties}> = ({at: a, children, style}) => {
	const f = useCurrentFrame();
	const p = prog(f, a, 22);
	return (
		<span style={{display: 'inline-block', opacity: p, scale: String(interpolate(p, [0, 1], [0.9, 1])), filter: p < 0.99 ? `blur(${(1 - p) * 10}px)` : undefined, ...style}}>
			{children}
		</span>
	);
};


const GREEN = '#34c759';
const Page: React.FC<{children: React.ReactNode; gap?: number; justify?: React.CSSProperties['justifyContent']}> = ({children, gap = 0, justify = 'center'}) => (
	<AbsoluteFill style={{padding: '290px 100px 360px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: justify, gap}}>{children}</AbsoluteFill>
);


const RED = '#ff3b30';
// calmer camera: much smaller push-in than the kit default
const Drift: React.FC<{dur: number; children: React.ReactNode; amount?: number}> = ({dur, children}) => <KitDrift dur={dur} amount={0.012}>{children}</KitDrift>;

type Target = {x: number; y: number; w: number; h: number; label: string; at: number; color?: string};
/** photo with a slow camera move; boxes are pinned to image coordinates so they "track" objects as the camera moves */
const Tracked: React.FC<{src: string; iw: number; ih: number; w: number; h: number; at: number; from: [number, number, number]; to: [number, number, number]; dur: number; targets?: Target[]; children?: React.ReactNode}> = ({src, iw, ih, w, h, at: a, from, to, dur, targets = [], children}) => {
	const f = useCurrentFrame();
	const p = prog(f, a, 20);
	const m = interpolate(f - a, [0, dur], [0, 1], {...clamp, easing: INOUT});
	const cx = from[0] + (to[0] - from[0]) * m;
	const cy = from[1] + (to[1] - from[1]) * m;
	const z = from[2] + (to[2] - from[2]) * m;
	const S = Math.max(w / iw, h / ih) * z;
	// keep the image covering the frame while the camera tracks
	const tx = Math.min(0, Math.max(w - iw * S, w / 2 - cx * S));
	const ty = Math.min(0, Math.max(h - ih * S, h / 2 - cy * S));
	return (
		<div style={{position: 'relative', width: w, height: h, borderRadius: 30, overflow: 'hidden', boxShadow: '0 30px 70px rgba(20,40,90,0.18)', opacity: p, translate: `0 ${(1 - p) * 50}px`}}>
			<div style={{position: 'absolute', left: 0, top: 0, width: iw, height: ih, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${S})`}}>
				<Img src={staticFile(src)} style={{width: iw, height: ih, display: 'block'}} />
				{targets.map((t, i) => {
					const q = prog(f, t.at, 12);
					const c = t.color ?? ACCENT;
					const bw = 4 / S;
					const L = 22 / S;
					const corner = (st: React.CSSProperties) => <div style={{position: 'absolute', width: L, height: L, borderColor: c, borderStyle: 'solid', borderWidth: 0, ...st}} />;
					return (
						<div key={i} style={{position: 'absolute', left: t.x, top: t.y, width: t.w, height: t.h, opacity: q, scale: String(interpolate(q, [0, 1], [1.25, 1]))}}>
							<div style={{position: 'absolute', inset: 0, background: `${c}1f`, borderRadius: 6 / S}} />
							{corner({left: 0, top: 0, borderLeftWidth: bw, borderTopWidth: bw})}
							{corner({right: 0, top: 0, borderRightWidth: bw, borderTopWidth: bw})}
							{corner({left: 0, bottom: 0, borderLeftWidth: bw, borderBottomWidth: bw})}
							{corner({right: 0, bottom: 0, borderRightWidth: bw, borderBottomWidth: bw})}
							<div style={{position: 'absolute', left: 0, top: -44 / S, transformOrigin: '0 0', scale: String(1 / S), background: c, color: '#fff', fontFamily: IT, fontSize: 30, fontWeight: 700, padding: '6px 14px', borderRadius: 10, whiteSpace: 'nowrap'}}>{t.label}</div>
						</div>
					);
				})}
			</div>
			{children}
		</div>
	);
};

/** always-on brand mark, fixed (does not move with the camera) */
const Watermark: React.FC = () => (
	<div style={{position: 'absolute', top: 190, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
		<div style={{display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.85)', padding: '12px 24px 12px 16px', borderRadius: 40, boxShadow: '0 8px 24px rgba(20,40,90,0.10)'}}>
			<Img src={LOGO} style={{width: 40}} />
			<span style={{fontFamily: IT, fontSize: 32, fontWeight: 700, color: INK, letterSpacing: -0.5}}>Horz VPN</span>
		</div>
	</div>
);
const W = 880; // usable width inside the TikTok safe zone
const MONO = '"JetBrains Mono", ui-monospace, monospace';

/** photo with slow Ken Burns push + polaroid frame + caption */
const Photo: React.FC<{src: string; at: number; w: number; h: number; caption?: React.ReactNode; tilt?: number; pos?: string}> = ({src, at: a, w, h, caption, tilt = 0, pos = 'center'}) => {
	const f = useCurrentFrame();
	const p = prog(f, a, 22);
	const kb = interpolate(f - a, [0, 240], [1.02, 1.08], clamp);
	return (
		<div style={{opacity: p, translate: `0 ${(1 - p) * 80}px`, rotate: `${tilt * p}deg`, scale: String(interpolate(p, [0, 1], [0.85, 1])), background: '#fff', padding: 16, paddingBottom: caption ? 0 : 16, borderRadius: 24, boxShadow: '0 30px 70px rgba(20,40,90,0.18)'}}>
			<div style={{width: w, height: h, overflow: 'hidden', borderRadius: 14}}>
				<Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos, scale: String(kb)}} />
			</div>
			{caption ? <div style={{fontFamily: IT, fontSize: 38, fontWeight: 700, color: INK, textAlign: 'center', padding: '18px 8px 20px', letterSpacing: -0.5}}>{caption}</div> : null}
		</div>
	);
};

const Year: React.FC<{from: number; to: number; a: number; b: number; size?: number; color?: string}> = ({from, to, a, b, size = 300, color = INK}) => (
	<div style={{fontFamily: IT, fontSize: size, fontWeight: 700, color, letterSpacing: -size * 0.05, lineHeight: 1}}>
		<Roll from={from} to={to} a={a} b={b} />
	</div>
);

/* ---------- glyphs ---------- */
const G = {
	phone: (c: string) => <svg viewBox="0 0 24 24" width="100%" fill="none" stroke={c} strokeWidth={1.7} strokeLinecap="round"><rect x="6.5" y="2.5" width="11" height="19" rx="2.8" /><path d="M10.5 18.5h3" /></svg>,
	isp: (c: string) => <svg viewBox="0 0 24 24" width="100%" fill="none" stroke={c} strokeWidth={1.7} strokeLinecap="round"><rect x="3" y="13" width="18" height="7" rx="2" /><path d="M7 16.5h.01M11 16.5h.01M8 13V9M16 13V9M5 7a10 10 0 0 1 14 0M8 9.5a6 6 0 0 1 8 0" /></svg>,
	globe: (c: string) => <svg viewBox="0 0 24 24" width="100%" fill="none" stroke={c} strokeWidth={1.7}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18" /></svg>,
	server: (c: string) => <svg viewBox="0 0 24 24" width="100%" fill="none" stroke={c} strokeWidth={1.7} strokeLinecap="round"><rect x="4" y="3.5" width="16" height="7" rx="2" /><rect x="4" y="13.5" width="16" height="7" rx="2" /><path d="M8 7h.01M8 17h.01" /></svg>,
	eye: (c: string) => <svg viewBox="0 0 24 24" width="100%" fill="none" stroke={c} strokeWidth={1.8}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>,
	lock: (c: string) => <svg viewBox="0 0 24 24" width="100%" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></svg>,
	key: (c: string) => <svg viewBox="0 0 24 24" width="100%" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round"><circle cx="7.5" cy="12" r="4" /><path d="M11.5 12H21M17 12v3M20 12v2" /></svg>,
	mail: (c: string) => <svg viewBox="0 0 24 24" width="100%" fill="none" stroke={c} strokeWidth={1.8} strokeLinejoin="round"><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3.5 6.5l8.5 6.5 8.5-6.5" /></svg>,
};

const Step: React.FC<{at: number; n: number}> = ({at: a, n}) => (
	<Pop at={a} style={{fontFamily: IT, fontSize: 46, fontWeight: 700, color: '#fff', background: ACCENT, padding: '10px 30px', borderRadius: 40}}>
		Шаг {n}
	</Pop>
);

const Node: React.FC<{at: number; icon: React.ReactNode; label: string; size?: number; ring?: string}> = ({at: a, icon, label, size = 170, ring}) => (
	<Rise at={a} dist={30}>
		<div style={{display: 'flex', alignItems: 'center', gap: 28}}>
			<div style={{width: size, height: size, borderRadius: size * 0.28, background: '#fff', boxShadow: `0 20px 44px rgba(20,40,90,0.10)${ring ? `, 0 0 0 4px ${ring}` : ''}`, padding: size * 0.22, boxSizing: 'border-box', flexShrink: 0}}>{icon}</div>
			<div style={{fontFamily: IT, fontSize: 52, fontWeight: 700, color: INK}}>{label}</div>
		</div>
	</Rise>
);

/** full-bleed photo card with slow push-in and dark grade for legibility */
const Shot: React.FC<{src: string; at: number; h: number; children?: React.ReactNode; tint?: string}> = ({src, at: a, h, children, tint = 'rgba(0,0,0,0.0)'}) => {
	const f = useCurrentFrame();
	const p = prog(f, a, 20);
	return (
		<div style={{position: 'relative', width: W, height: h, borderRadius: 34, overflow: 'hidden', boxShadow: '0 30px 80px rgba(20,40,90,0.22)', opacity: p, translate: `0 ${(1 - p) * 50}px`}}>
			<Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', scale: String(interpolate(f - a, [0, 300], [1.05, 1.18], clamp))}} />
			<div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${tint}, rgba(0,0,0,0.55))`}} />
			{children}
		</div>
	);
};

const Source: React.FC<{at: number; children: React.ReactNode}> = ({at: a, children}) => (
	<Rise at={a} dist={10}>
		<div style={{fontFamily: IT, fontSize: 30, fontWeight: 500, color: GRAY, textAlign: 'center'}}>{children}</div>
	</Rise>
);

const YearTag: React.FC<{at: number; y: string}> = ({at: a, y}) => (
	<Pop at={a} style={{fontFamily: IT, fontSize: 150, fontWeight: 700, color: INK, letterSpacing: -7, lineHeight: 1}}>
		{y}
	</Pop>
);

const WINBLUE = '#0078d7';

/** a tiny monitor that turns into a blue screen at `at` */
const Monitor: React.FC<{at: number; w: number}> = ({at: a, w}) => {
	const f = useCurrentFrame();
	const on = f >= a;
	const flash = interpolate(f - a, [0, 3, 8], [1, 1, 0], clamp);
	return (
		<div style={{width: w, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
			<div style={{width: w, height: w * 0.62, borderRadius: w * 0.06, background: '#1d1d1f', padding: w * 0.04, boxSizing: 'border-box'}}>
				<div style={{width: '100%', height: '100%', borderRadius: w * 0.03, background: on ? WINBLUE : '#3a3a3c', position: 'relative', overflow: 'hidden', padding: w * 0.07, boxSizing: 'border-box'}}>
					{on ? <div style={{fontFamily: 'Segoe UI, Inter Tight, sans-serif', color: '#fff', fontSize: w * 0.22, lineHeight: 1}}>:(</div> : null}
					<div style={{position: 'absolute', inset: 0, background: '#fff', opacity: flash * 0.8}} />
				</div>
			</div>
			<div style={{width: w * 0.2, height: w * 0.08, background: '#1d1d1f'}} />
			<div style={{width: w * 0.45, height: w * 0.04, borderRadius: w * 0.02, background: '#1d1d1f'}} />
		</div>
	);
};

/* 1 — 19.07.2024, millions of blue screens */
const S1: React.FC = () => {
	const N = 20;
	return (
		<Drift dur={DUR[0] + TR}>
			<AppleBg />
			<Page gap={34}>
				<Big at={0} size={150}>
					19.07.2024
				</Big>
				<div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 22, width: W}}>
					{Array.from({length: N}).map((_, i) => (
						<Monitor key={i} at={at(0, 3.4) + ((i * 7) % N) * 4} w={156} />
					))}
				</div>
				<Lines at={at(0, 4.5)} size={64} weight={700} lines={['миллионы синих экранов']} colors={[WINBLUE]} />
				<Pop at={at(0, 7.6)} style={{fontFamily: IT, fontSize: 60, fontWeight: 700, color: '#fff', background: INK, padding: '16px 40px', borderRadius: 40}}>
					и не перезагружаются
				</Pop>
			</Page>
			<Tick at={at(0, 3.4)} />
			<Tick at={at(0, 7.6)} vol={0.22} />
		</Drift>
	);
};

/* 2 — ad */
const S2: React.FC = () => (
	<Drift dur={DUR[1] + TR}>
		<AppleBg />
		<Page gap={30}>
			<Eyebrow at={at(1, 9.3)}>Кстати</Eyebrow>
			<AppIcon size={240} at={at(1, 9.6)} />
			<Lines at={at(1, 9.95)} size={150} weight={700} lines={['Horz VPN']} />
			<Rise at={at(1, 11.05)} dist={30}>
				<BlackPill style={{fontSize: 52, fontWeight: 600, padding: '30px 60px'}}>Ссылка в профиле</BlackPill>
			</Rise>
			<Rise at={at(1, 12.2)} dist={40} dur={18}>
				<Card style={{width: W, padding: '28px 40px', boxSizing: 'border-box', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 22}}>
					<span style={{fontFamily: IT, fontSize: 130, fontWeight: 700, color: ACCENT, letterSpacing: -6, lineHeight: 1}}>3</span>
					<span style={{fontFamily: IT, fontSize: 54, fontWeight: 600, color: INK}}>дня бесплатно</span>
				</Card>
			</Rise>
		</Page>
		<Tick at={at(1, 11.05)} />
		<Tick at={at(1, 12.5)} />
	</Drift>
);

/* 3 — airports, banks, hospitals… all down */
const FLIGHTS = ['SU 1402  МОСКВА', 'LH 401   NEW YORK', 'BA 117   LONDON', 'DL 92    ATLANTA', 'EK 23    DUBAI', 'TK 1   ISTANBUL'];
const S3: React.FC = () => {
	const f = useCurrentFrame();
	const sectors: [string, number][] = [
		['🏦 Банки', at(2, 16.6)],
		['🏥 Больницы', at(2, 17.25)],
		['📺 Телеканалы', at(2, 17.85)],
		['🛒 Кассы', at(2, 18.55)],
	];
	return (
		<Drift dur={DUR[2] + TR}>
			<AppleBg glow="255,59,48" />
			<Page gap={28}>
				<Lines at={at(2, 13.7)} size={84} weight={700} lines={['Аэропорты встают']} />
				<Rise at={at(2, 13.8)} dist={40}>
					<div style={{width: W, background: '#111', borderRadius: 26, padding: '26px 30px', boxSizing: 'border-box', fontFamily: MONO}}>
						{FLIGHTS.map((fl, i) => {
							const c = f > at(2, 14.6) + i * 6;
							return (
								<div key={fl} style={{display: 'flex', justifyContent: 'space-between', fontSize: 36, padding: '8px 0', color: '#ffd60a', borderBottom: i < FLIGHTS.length - 1 ? '1px solid #333' : undefined}}>
									<span style={{whiteSpace: 'pre'}}>{fl}</span>
									<span style={{color: c ? '#ff453a' : '#30d158'}}>{c ? 'CANCELLED' : 'ON TIME'}</span>
								</div>
							);
						})}
					</div>
				</Rise>
				<div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, width: W}}>
					{sectors.map(([t, a]) => (
						<Rise key={t} at={a} dist={30} dur={12}>
							<Card style={{padding: '24px 28px', fontFamily: IT, fontSize: 46, fontWeight: 700, color: INK, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
								{t}
								<span style={{color: RED, fontSize: 40}}>✕</span>
							</Card>
						</Rise>
					))}
				</div>
				<Pop at={at(2, 19.8)} style={{fontFamily: IT, fontSize: 70, fontWeight: 700, color: RED}}>
					всё лежит
				</Pop>
			</Page>
			<Tick at={at(2, 14.6)} />
			{sectors.map(([t, a]) => (
				<Tick key={t} at={a} vol={0.12} />
			))}
		</Drift>
	);
};

/* 4 — hackers? attack? no. one update */
const S4: React.FC = () => {
	const f = useCurrentFrame();
	const s1 = prog(f, at(3, 22.6), 10);
	const bar = prog(f, at(3, 23.9), 20, INOUT);
	return (
		<Drift dur={DUR[3] + TR}>
			<AppleBg />
			<Page gap={30}>
				{[
					['Хакеры?', at(3, 20.7)],
					['Атака?', at(3, 21.6)],
				].map(([t, a]) => (
					<div key={t as string} style={{position: 'relative'}}>
						<Pop at={a as number} style={{fontFamily: IT, fontSize: 130, fontWeight: 700, color: s1 > 0.5 ? '#aeaeb2' : INK}}>
							{t}
						</Pop>
						<div style={{position: 'absolute', left: -10, right: -10, top: '52%', height: 12, borderRadius: 6, background: RED, transformOrigin: 'left', scale: `${s1} 1`}} />
					</div>
				))}
				<Pop at={at(3, 22.65)} style={{fontFamily: IT, fontSize: 150, fontWeight: 700, color: RED}}>
					Нет.
				</Pop>
				<Rise at={at(3, 23.1)} dist={30}>
					<Card style={{width: W, padding: '30px 40px', boxSizing: 'border-box'}}>
						<div style={{fontFamily: IT, fontSize: 52, fontWeight: 700, color: INK}}>⬇ Одно обновление</div>
						<div style={{height: 18, borderRadius: 9, background: '#eee', marginTop: 20, overflow: 'hidden'}}>
							<div style={{width: `${bar * 100}%`, height: '100%', background: ACCENT, borderRadius: 9}} />
						</div>
					</Card>
				</Rise>
			</Page>
			<Tick at={at(3, 22.6)} vol={0.24} />
		</Drift>
	);
};

/* 5 — CrowdStrike: update → error → one file → Windows crashes at boot */
const S5: React.FC = () => {
	const f = useCurrentFrame();
	const crash = prog(f, at(4, 36.6), 8);
	return (
		<Drift dur={DUR[4] + TR}>
			<AppleBg />
			<Page gap={26}>
				<Lines at={at(4, 25.1)} size={96} weight={700} lines={['CrowdStrike']} />
				<Rise at={at(4, 26.9)} dist={30}>
					<div style={{display: 'flex', alignItems: 'center', gap: 20, fontFamily: IT, fontSize: 46, fontWeight: 600, color: SUB}}>
						<div style={{width: 70}}>{G.lock(ACCENT)}</div>
						защищает компьютеры от вирусов
					</div>
				</Rise>
				<Rise at={at(4, 29.1)} dist={40}>
					<Card style={{width: W, padding: '30px 40px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 26, boxShadow: f > at(4, 31.8) ? '0 0 0 5px ' + RED : undefined}}>
						<div style={{fontSize: 80}}>📄</div>
						<div>
							<div style={{fontFamily: IT, fontSize: 40, fontWeight: 600, color: SUB}}>обычное обновление</div>
							<div style={{fontFamily: MONO, fontSize: 46, color: f > at(4, 33.4) ? RED : INK}}>C-00000291*.sys</div>
						</div>
					</Card>
				</Rise>
				<Pop at={at(4, 31.8)} style={{fontFamily: IT, fontSize: 70, fontWeight: 700, color: RED}}>
					⚠ в нём ошибка
				</Pop>
				<Rise at={at(4, 34.0)} dist={30}>
					<div style={{width: 720, height: 400, borderRadius: 24, background: crash > 0.5 ? WINBLUE : '#000', padding: 44, boxSizing: 'border-box', color: '#fff', fontFamily: 'Segoe UI, Inter Tight, sans-serif', boxShadow: '0 30px 70px rgba(0,0,0,0.3)'}}>
						{crash > 0.5 ? (
							<>
								<div style={{fontSize: 120, lineHeight: 1}}>:(</div>
								<div style={{fontSize: 34, marginTop: 24, lineHeight: 1.3}}>Your device ran into a problem and needs to restart.</div>
							</>
						) : (
							<div style={{fontSize: 40, opacity: 0.8}}>Windows · загрузка…</div>
						)}
					</div>
				</Rise>
			</Page>
			<Tick at={at(4, 31.8)} />
			<Tick at={at(4, 36.6)} vol={0.26} />
		</Drift>
	);
};

/* 6 — 8.5 million computers, <1% but critical */
const S6: React.FC = () => {
	const f = useCurrentFrame();
	const n = Math.round(interpolate(f, [at(5, 39.1), at(5, 40.6)], [0, 8500000], {...clamp, easing: INOUT}));
	return (
		<Drift dur={DUR[5] + TR}>
			<AppleBg />
			<Page gap={30}>
				<Lines at={at(5, 38.45)} size={70} weight={700} lines={['Итог']} color={GRAY} />
				<div style={{fontFamily: IT, fontSize: 160, fontWeight: 700, color: WINBLUE, letterSpacing: -6, lineHeight: 1, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap'}}>{n.toLocaleString('ru-RU')}</div>
				<Lines at={at(5, 40.6)} size={64} weight={700} lines={['компьютеров']} />
				<Rise at={at(5, 41.7)} dist={30}>
					<Card style={{width: W, padding: '28px 40px', boxSizing: 'border-box', fontFamily: IT, fontSize: 48, fontWeight: 700, color: SUB, textAlign: 'center'}}>
						меньше <span style={{color: INK}}>1%</span> всех Windows в мире
					</Card>
				</Rise>
				<Lines at={at(5, 44.3)} size={56} weight={700} lines={['но это были']} color={SUB} />
				<div style={{display: 'flex', gap: 16}}>
					{[
						['✈ аэропорты', at(5, 45.4)],
						['🏦 банки', at(5, 46.25)],
						['🏥 больницы', at(5, 47.0)],
					].map(([t, a]) => (
						<Pop key={t as string} at={a as number} style={{fontFamily: IT, fontSize: 44, fontWeight: 700, color: '#fff', background: RED, padding: '14px 26px', borderRadius: 30, whiteSpace: 'nowrap'}}>
							{t}
						</Pop>
					))}
				</div>
			</Page>
			<Tick at={at(5, 40.6)} vol={0.24} />
		</Drift>
	);
};

/* 7 — recalled in < 1.5 h, but fixed by hand, weeks */
const S7: React.FC = () => {
	const f = useCurrentFrame();
	const steps = ['Перезагрузить в безопасном режиме', 'Удалить файл C-00000291*.sys', 'Перезагрузить снова'];
	return (
		<Drift dur={DUR[6] + TR}>
			<AppleBg />
			<Page gap={26}>
				<Lines at={at(6, 47.6)} size={70} weight={700} lines={['Обновление отозвали']} color={SUB} />
				<Big at={at(6, 48.7)} size={130} color={GREEN}>
					&lt; 1,5 часа
				</Big>
				<Lines at={at(6, 50.35)} size={76} weight={700} lines={['но чинить — вручную']} colors={[RED]} />
				{steps.map((s, i) => (
					<Rise key={s} at={at(6, 52.1) + i * 18} dist={30} dur={12}>
						<Card style={{width: W, padding: '22px 36px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 22}}>
							<div style={{width: 60, height: 60, borderRadius: 30, background: INK, color: '#fff', fontFamily: IT, fontSize: 30, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{i + 1}</div>
							<div style={{fontFamily: IT, fontSize: 40, fontWeight: 600, color: INK}}>{s}</div>
						</Card>
					</Rise>
				))}
				<Lines at={at(6, 54.4)} size={56} weight={700} lines={['на каждом компьютере ×8 500 000']} color={SUB} />
				<Pop at={at(6, 56.95)} style={{fontFamily: IT, fontSize: 64, fontWeight: 700, color: '#fff', background: INK, padding: '16px 40px', borderRadius: 40}}>
					некоторые — неделями
				</Pop>
			</Page>
			<Tick at={at(6, 48.7)} />
			<Tick at={at(6, 56.95)} />
		</Drift>
	);
};

/* 8 — not hackers, one bug */
const CODE = ['if (channel_file.valid) {', '  load(channel_file);', '  read(fields[21]); // ← только 20', '}'];
const S8: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<Drift dur={DUR[7] + TR}>
			<AppleBg />
			<Page gap={34}>
				<Lines at={at(7, 57.8)} size={84} weight={700} lines={['Самый крупный', 'IT-сбой в истории']} stagger={8} />
				<Lines at={at(7, 60.2)} size={64} weight={700} lines={['устроили не хакеры']} color={SUB} />
				<Rise at={at(7, 61.5)} dist={40}>
					<div style={{width: W, background: '#0a0d12', borderRadius: 26, padding: '30px 34px', boxSizing: 'border-box'}}>
						{CODE.map((l, i) => (
							<div key={i} style={{fontFamily: MONO, fontSize: 38, lineHeight: 1.6, whiteSpace: 'pre', color: i === 2 ? '#ff6b6b' : '#c9d1d9', background: i === 2 && f > at(7, 62.0) ? 'rgba(255,59,48,0.2)' : 'transparent', borderRadius: 6}}>
								{l}
							</div>
						))}
					</div>
				</Rise>
				<Pop at={at(7, 61.95)} style={{fontFamily: IT, fontSize: 84, fontWeight: 700, color: RED}}>
					одна ошибка в коде
				</Pop>
			</Page>
			<Tick at={at(7, 61.95)} vol={0.24} />
		</Drift>
	);
};

/* 9 — CTA */
const S9: React.FC = () => {
	const f = useCurrentFrame();
	const tapAt = at(8, 63.6);
	const tap = interpolate(f - tapAt, [0, 5, 14], [1, 0.93, 1], clamp);
	return (
		<Drift dur={DUR[8]}>
			<AppleBg />
			<Page gap={40}>
				<AppIcon size={200} at={0} float={false} />
				<Rise at={at(8, 63.2)} dist={30}>
					<div style={{scale: String(tap)}}>
						<BlackPill style={{fontSize: 64, fontWeight: 700, padding: '38px 90px', borderRadius: 90}}>Подписывайся</BlackPill>
					</div>
				</Rise>
				<Lines at={at(8, 64.2)} size={56} weight={700} lines={['дальше — как ломается', 'интернет']} color={GRAY} stagger={6} />
			</Page>
			<Tick at={tapAt} vol={0.22} />
		</Drift>
	);
};

const Big: React.FC<{at: number; children: React.ReactNode; size?: number; color?: string}> = ({at: a, children, size = 200, color = INK}) => (
	<Pop at={a} style={{fontFamily: IT, fontSize: size, fontWeight: 700, color, letterSpacing: -size * 0.045, lineHeight: 1, whiteSpace: 'nowrap'}}>
		{children}
	</Pop>
);

const SCENES = [S1, S2, S3, S4, S5, S6, S7, S8, S9];

export const Bsod: React.FC = () => (
	<AbsoluteFill style={{background: '#fbfbfd'}}>
		<TransitionSeries>
			{SCENES.map((S, i) => (
				<React.Fragment key={i}>
					{i > 0 ? <TransitionSeries.Transition presentation={blurZoom() as never} timing={linearTiming({durationInFrames: TR, easing: INOUT})} /> : null}
					<TransitionSeries.Sequence durationInFrames={DUR[i] + (i < SCENES.length - 1 ? TR : 0)}>
						<S />
					</TransitionSeries.Sequence>
				</React.Fragment>
			))}
		</TransitionSeries>
		<Watermark />
		<Audio src={staticFile('bsod/voice.mp3')} />
	</AbsoluteFill>
);
