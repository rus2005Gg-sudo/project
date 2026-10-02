import React from 'react';
import '@fontsource/jetbrains-mono/500.css';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {Img} from 'remotion';
import {LOGO, ACCENT, AppIcon, AppleBg, BlackPill, Card, Drift as KitDrift, Eyebrow, GRAY, HAIR, INK, INOUT, IT, Lines, Lockup, Rise, SUB, blurZoom, clamp, prog} from './kit';

export const TB_FPS = 30;
const VOICE = 77.36;
const TR = 14;
// scene starts (s), slightly ahead of the first word of each phrase (word times from ASR)
const STARTS = [0, 5.1, 9.4, 18.55, 24.4, 34.95, 45.8, 49.35, 54.2, 63.15, 70.25];
const fr = (s: number) => Math.round(s * TB_FPS);
export const TBL_FRAMES = fr(VOICE + 1.4);
const DUR = STARTS.map((s, i) => (i < STARTS.length - 1 ? fr(STARTS[i + 1]) : TBL_FRAMES) - fr(s));
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

const Big: React.FC<{at: number; children: React.ReactNode; size?: number; color?: string}> = ({at: a, children, size = 200, color = INK}) => (
	<Pop at={a} style={{fontFamily: IT, fontSize: size, fontWeight: 700, color, letterSpacing: -size * 0.045, lineHeight: 1, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums'}}>
		{children}
	</Pop>
);

const Silhouette: React.FC<{size: number}> = ({size}) => (
	<svg viewBox="0 0 100 100" width={size} height={size}>
		<defs>
			<linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#3a3a3c" />
				<stop offset="1" stopColor="#1d1d1f" />
			</linearGradient>
		</defs>
		<circle cx="50" cy="50" r="50" fill="#e8ecf3" />
		<circle cx="50" cy="38" r="17" fill="url(#sg)" />
		<path d="M18 92c4-20 18-30 32-30s28 10 32 30" fill="url(#sg)" />
	</svg>
);

/* 1 — hook */
const S1: React.FC = () => {
	const f = useCurrentFrame();
	const n = Math.round(interpolate(f, [at(0, 1.5), at(0, 2.6)], [0, 5], {...clamp, easing: INOUT}));
	return (
		<Drift dur={DUR[0] + TR}>
			<AppleBg />
			<Page gap={36}>
				<Rise at={0} dist={40}>
					<div style={{width: 300, height: 300, borderRadius: 150, overflow: 'hidden', boxShadow: '0 24px 60px rgba(20,40,90,0.25)', border: '6px solid #fff'}}><Img src={staticFile('tbl/portrait.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 30%'}} /></div>
				</Rise>
				<Lines at={at(0, 0.2)} size={84} weight={700} lines={['Этот человек изменил', 'жизнь']} stagger={at(0, 1.2) - at(0, 0.2)} />
				<div style={{fontFamily: IT, fontSize: 190, fontWeight: 700, color: ACCENT, letterSpacing: -8, lineHeight: 1}}>{n} млрд</div>
				<Lines at={at(0, 2.6)} size={70} weight={700} lines={['людей']} color={SUB} />
				<Pop at={at(0, 3.2)} style={{fontFamily: IT, fontSize: 60, fontWeight: 700, color: '#fff', background: INK, padding: '20px 44px', borderRadius: 50}}>
					и отказался разбогатеть
				</Pop>
			</Page>
			<Tick at={at(0, 2.6)} vol={0.22} />
			<Tick at={at(0, 3.2)} />
		</Drift>
	);
};

/* 2 — ad */
const S2: React.FC = () => (
	<Drift dur={DUR[1] + TR}>
		<AppleBg />
		<Page gap={30}>
			<Eyebrow at={at(1, 5.15)}>Кстати</Eyebrow>
			<AppIcon size={240} at={at(1, 5.5)} />
			<Lines at={at(1, 5.8)} size={150} weight={700} lines={['Horz VPN']} />
			<Rise at={at(1, 6.75)} dist={30}>
				<BlackPill style={{fontSize: 52, fontWeight: 600, padding: '30px 60px'}}>Ссылка в профиле</BlackPill>
			</Rise>
			<Rise at={at(1, 7.85)} dist={40} dur={18}>
				<Card style={{width: W, padding: '28px 40px', boxSizing: 'border-box', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 22}}>
					<span style={{fontFamily: IT, fontSize: 130, fontWeight: 700, color: ACCENT, letterSpacing: -6, lineHeight: 1}}>30</span>
					<span style={{fontFamily: IT, fontSize: 54, fontWeight: 600, color: INK}}>дней бесплатно</span>
				</Card>
			</Rise>
		</Page>
		<Tick at={at(1, 6.75)} />
		<Tick at={at(1, 8.2)} />
	</Drift>
);

/* 3 — 1989, CERN */
const S3: React.FC = () => {
	const f = useCurrentFrame();
	const docs = Array.from({length: 9});
	const chaos = prog(f, at(2, 16.0), 40);
	return (
		<Drift dur={DUR[2] + TR}>
			<AppleBg />
			<Page gap={30}>
				<div style={{fontFamily: IT, fontSize: 200, fontWeight: 700, color: INK, letterSpacing: -9, lineHeight: 1}}>
					<Roll from={2026} to={1989} a={at(2, 9.45)} b={at(2, 11.0)} />
				</div>
				<Lines at={at(2, 11.5)} size={64} weight={700} lines={['Швейцария · ЦЕРН']} color={SUB} />
				<Shot src="tbl/lab.jpg" at={at(2, 12.3)} h={560}>
					<div style={{position: 'absolute', left: 24, top: 24, display: 'flex', flexDirection: 'column', gap: 12}}>
						<Pop at={at(2, 13.8)} style={{background: '#fff', color: INK, fontFamily: IT, fontSize: 40, fontWeight: 700, padding: '10px 22px', borderRadius: 14}}>
							тысячи учёных
						</Pop>
						<Pop at={at(2, 14.85)} style={{background: '#fff', color: INK, fontFamily: IT, fontSize: 40, fontWeight: 700, padding: '10px 22px', borderRadius: 14}}>
							сотни компьютеров
						</Pop>
					</div>
					{docs.map((_, i) => {
						const x = 120 + ((i * 263) % 640);
						const y = 220 + ((i * 97) % 260);
						return <div key={i} style={{position: 'absolute', left: x + Math.sin(f / 9 + i) * 14 * chaos, top: y + Math.cos(f / 11 + i) * 10 * chaos, width: 80, height: 104, background: '#fff', borderRadius: 8, boxShadow: '0 8px 20px rgba(0,0,0,0.35)', opacity: chaos, rotate: `${(i % 2 ? 1 : -1) * (8 + i * 3)}deg`, padding: 12, boxSizing: 'border-box'}}>{[0, 1, 2, 3].map((k) => <div key={k} style={{height: 6, background: '#d1d1d6', borderRadius: 3, marginBottom: 10, width: `${90 - k * 15}%`}} />)}</div>;
					})}
				</Shot>
				<Pop at={at(2, 16.0)} style={{fontFamily: IT, fontSize: 56, fontWeight: 700, color: RED}}>
					найти информацию — почти невозможно
				</Pop>
			</Page>
			<Tick at={at(2, 11.0)} />
			<Tick at={at(2, 16.0)} />
		</Drift>
	);
};

/* 4 — internet exists, but no sites and links */
const S4: React.FC = () => {
	const f = useCurrentFrame();
	const pts = Array.from({length: 12}).map((_, i) => ({x: 90 + ((i * 211) % 700), y: 60 + ((i * 149) % 380)}));
	return (
		<Drift dur={DUR[3] + TR}>
			<AppleBg />
			<Page gap={34}>
				<Lines at={at(3, 18.6)} size={90} weight={700} lines={['Интернет как сеть', 'уже есть']} stagger={at(3, 19.7) - at(3, 18.6)} />
				<Card style={{width: W, height: 480, position: 'relative', overflow: 'hidden'}}>
					<svg width={W} height={480} style={{position: 'absolute', inset: 0}}>
						{pts.map((p, i) => pts.slice(i + 1, i + 3).map((q, j) => <line key={`${i}-${j}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={ACCENT} strokeWidth={3} opacity={0.35 * prog(f, at(3, 19.2) + i, 12)} />))}
						{pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={16} fill={ACCENT} opacity={prog(f, at(3, 18.8) + i * 1.5, 10)} />)}
					</svg>
				</Card>
				<Lines at={at(3, 20.7)} size={64} weight={700} lines={['но в нём нет']} color={SUB} />
				<div style={{display: 'flex', gap: 30}}>
					{[
						['сайтов', at(3, 22.9)],
						['ссылок', at(3, 23.7)],
					].map(([t, a]) => (
						<Pop key={t as string} at={a as number} style={{fontFamily: IT, fontSize: 70, fontWeight: 700, color: RED, background: '#fff', padding: '18px 40px', borderRadius: 30, boxShadow: '0 16px 40px rgba(20,40,90,0.1)'}}>
							✕ {t}
						</Pop>
					))}
				</div>
			</Page>
			<Tick at={at(3, 22.9)} />
			<Tick at={at(3, 23.7)} />
		</Drift>
	);
};

/* 5 — Tim Berners-Lee, the proposal, «Vague but exciting» */
const S5: React.FC = () => {
	const f = useCurrentFrame();
	const link = prog(f, at(4, 28.6), 30, INOUT);
	const note = prog(f, at(4, 33.0), 16);
	return (
		<Drift dur={DUR[4] + TR}>
			<AppleBg />
			<Page gap={30}>
				<div style={{display: 'flex', alignItems: 'center', gap: 30}}>
					<Rise at={at(4, 24.4)} dist={30}>
						<div style={{width: 230, height: 230, borderRadius: 40, overflow: 'hidden', boxShadow: '0 20px 50px rgba(20,40,90,0.22)'}}><Img src={staticFile('tbl/young.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '28% 30%'}} /></div>
					</Rise>
					<div>
						<Lines at={at(4, 24.5)} size={44} weight={600} lines={['британский инженер']} align="left" color={GRAY} />
						<Lines at={at(4, 25.9)} size={92} weight={700} lines={['Тим', 'Бернерс-Ли']} align="left" stagger={6} />
					</div>
				</div>
				<Rise at={at(4, 27.3)} dist={50}>
					<div style={{position: 'relative', width: W, height: 640, background: '#fff', borderRadius: 30, boxShadow: '0 30px 70px rgba(20,40,90,0.14)', padding: '44px 50px', boxSizing: 'border-box', overflow: 'hidden'}}>
						<div style={{fontFamily: '"Times New Roman", serif', fontSize: 44, fontWeight: 700, color: INK}}>Information Management:</div>
						<div style={{fontFamily: '"Times New Roman", serif', fontSize: 44, fontWeight: 700, color: INK}}>A Proposal</div>
						<div style={{fontFamily: '"Times New Roman", serif', fontSize: 30, color: SUB, marginTop: 8}}>CERN · March 1989</div>
						<svg width={780} height={360} style={{position: 'absolute', left: 50, top: 230}}>
							{[
								[90, 70],
								[390, 40],
								[650, 120],
								[220, 260],
								[540, 280],
							].map(([x, y], i, arr) => (
								<g key={i}>
									{i > 0 ? <line x1={arr[i - 1][0]} y1={arr[i - 1][1]} x2={x} y2={y} stroke={ACCENT} strokeWidth={4} strokeDasharray="10 8" pathLength={1} opacity={link} /> : null}
									<rect x={x - 55} y={y - 34} width={110} height={68} rx={10} fill="#f2f2f7" stroke="#c7c7cc" strokeWidth={2} />
								</g>
							))}
						</svg>
						<div style={{position: 'absolute', right: 40, bottom: 40, rotate: '-8deg', opacity: note, scale: String(interpolate(note, [0, 1], [1.3, 1])), fontFamily: '"Comic Sans MS", "Segoe Print", cursive', fontSize: 46, color: '#c0392b', fontStyle: 'italic'}}>
							Vague but exciting…
						</div>
					</div>
				</Rise>
				<Pop at={at(4, 33.1)} style={{fontFamily: IT, fontSize: 60, fontWeight: 700, color: INK}}>
					«Расплывчато, <span style={{color: ACCENT}}>но интересно</span>»
				</Pop>
			</Page>
			<Tick at={at(4, 28.6)} />
			<Tick at={at(4, 33.1)} vol={0.22} />
		</Drift>
	);
};

/* 6 — in a year: HTML, URL, HTTP, browser, server */
const S6: React.FC = () => {
	const items: [string, string, number][] = [
		['HTML', 'язык страниц', at(5, 38.3)],
		['URL', 'адреса', at(5, 40.35)],
		['HTTP', 'протокол', at(5, 41.9)],
		['Браузер', 'первый', at(5, 43.5)],
		['Сервер', 'первый', at(5, 44.7)],
	];
	return (
		<Drift dur={DUR[5] + TR}>
			<AppleBg />
			<Page gap={22}>
				<Lines at={at(5, 35.0)} size={80} weight={700} lines={['За один год']} color={GRAY} />
				<Lines at={at(5, 35.85)} size={74} weight={700} lines={['он создаёт всё,']} />
				<Lines at={at(5, 36.9)} size={60} weight={700} lines={['чем ты пользуешься до сих пор']} color={SUB} />
				<div style={{height: 10}} />
				{items.map(([t, s, a]) => (
					<Rise key={t} at={a} dist={40} dur={14}>
						<Card style={{width: W, padding: '22px 40px', boxSizing: 'border-box', display: 'flex', alignItems: 'baseline', gap: 24}}>
							<span style={{fontFamily: MONO, fontSize: 64, fontWeight: 500, color: ACCENT}}>{t}</span>
							<span style={{fontFamily: IT, fontSize: 40, fontWeight: 600, color: SUB}}>{s}</span>
						</Card>
					</Rise>
				))}
			</Page>
			{items.map(([t, , a]) => (
				<Tick key={t} at={a} />
			))}
		</Drift>
	);
};

/* 7 — the server with the sticker */
const S7: React.FC = () => {
	const f = useCurrentFrame();
	const st = prog(f, at(6, 47.0), 14);
	return (
		<Drift dur={DUR[6] + TR}>
			<AppleBg />
			<Page gap={50}>
				<Lines at={at(6, 45.85)} size={76} weight={700} lines={['На компьютере —', 'наклейка']} stagger={at(6, 47.0) - at(6, 45.85)} />
				<Tracked src="tbl/next.jpg" iw={827} ih={525} w={W} h={640} at={at(6, 45.85)} from={[420, 270, 1]} to={[330, 330, 1.7]} dur={fr(3.5)} targets={[{x: 292, y: 292, w: 92, h: 76, label: 'DO NOT POWER IT DOWN!!', at: at(6, 47.0), color: RED}]} />
				<Pop at={at(6, 47.6)} style={{fontFamily: IT, fontSize: 56, fontWeight: 700, color: INK, whiteSpace: 'nowrap'}}>
					«Это сервер. <span style={{color: RED}}>Не выключать!</span>»
				</Pop>
			</Page>
			<Tick at={at(6, 47.0)} vol={0.22} />
		</Drift>
	);
};

/* 8 — first website, 6 Aug 1991 */
const PAGE_TEXT = 'The WorldWideWeb (W3) is a wide-area hypermedia information retrieval initiative aiming to give universal access to a large universe of documents.';
const S8: React.FC = () => {
	const f = useCurrentFrame();
	const n = Math.round(interpolate(f, [at(7, 51.0), at(7, 54.0)], [0, PAGE_TEXT.length], clamp));
	return (
		<Drift dur={DUR[7] + TR}>
			<AppleBg />
			<Page gap={34}>
				<Big at={at(7, 49.4)} size={150}>
					6.08.1991
				</Big>
				<Rise at={at(7, 50.6)} dist={50}>
					<div style={{width: W, background: '#fff', borderRadius: 24, overflow: 'hidden', boxShadow: '0 30px 70px rgba(20,40,90,0.16)'}}>
						<div style={{background: '#e5e5ea', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16}}>
							{['#ff5f57', '#febc2e', '#28c840'].map((c) => (
								<div key={c} style={{width: 18, height: 18, borderRadius: 9, background: c}} />
							))}
							<div style={{flex: 1, background: '#fff', borderRadius: 12, padding: '8px 18px', fontFamily: MONO, fontSize: 30, color: INK}}>info.cern.ch</div>
						</div>
						<div style={{position: 'relative', overflow: 'hidden', padding: '34px 40px', fontFamily: '"Times New Roman", serif', minHeight: 420}}>
							<Img src={staticFile('tbl/site.jpg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '0% 38%', transformOrigin: '0% 35%', scale: '1.3', opacity: prog(f, at(7, 54.0) - 30, 14)}} />
							<div style={{fontSize: 56, fontWeight: 700, color: INK, marginBottom: 20}}>World Wide Web</div>
							<div style={{fontSize: 36, color: INK, lineHeight: 1.4}}>
								{PAGE_TEXT.slice(0, n).split(/(hypermedia|documents)/).map((s, i) => (s === 'hypermedia' || s === 'documents' ? <u key={i} style={{color: '#0000ee'}}>{s}</u> : <span key={i}>{s}</span>))}
								{n < PAGE_TEXT.length ? '▌' : ''}
							</div>
						</div>
					</div>
				</Rise>
				<Pop at={at(7, 52.7)} style={{fontFamily: IT, fontSize: 70, fontWeight: 700, color: INK}}>
					первый сайт <span style={{color: ACCENT}}>в истории</span>
				</Pop>
			</Page>
			<Tick at={at(7, 49.4)} vol={0.22} />
			<Tick at={at(7, 52.7)} />
		</Drift>
	);
};

/* 9 — could patent it, gave it away for free */
const S9: React.FC = () => {
	const f = useCurrentFrame();
	const strike = prog(f, at(8, 58.2), 14);
	return (
		<Drift dur={DUR[8] + TR}>
			<AppleBg />
			<Page gap={34}>
				<Lines at={at(8, 54.3)} size={80} weight={700} lines={['А дальше — главное']} color={GRAY} />
				<Rise at={at(8, 56.0)} dist={40}>
					<Card style={{width: W, padding: '34px 44px', boxSizing: 'border-box', position: 'relative'}}>
						<div style={{fontFamily: IT, fontSize: 40, fontWeight: 600, color: SUB}}>мог</div>
						<div style={{fontFamily: IT, fontSize: 76, fontWeight: 700, color: strike > 0.5 ? '#aeaeb2' : INK}}>запатентовать веб</div>
						<div style={{fontFamily: IT, fontSize: 76, fontWeight: 700, color: strike > 0.5 ? '#aeaeb2' : '#c9a227'}}>и разбогатеть 💰</div>
						<div style={{position: 'absolute', left: 30, right: 30, top: '58%', height: 8, borderRadius: 4, background: RED, transformOrigin: 'left', scale: `${strike} 1`}} />
					</Card>
				</Rise>
				<Big at={at(8, 58.4)} size={160} color={ACCENT}>
					1993
				</Big>
				<Lines at={at(8, 59.3)} size={60} weight={700} lines={['ЦЕРН отдаёт веб миру']} color={SUB} />
				<div style={{display: 'flex', gap: 24}}>
					<Pop at={at(8, 61.2)} style={{fontFamily: IT, fontSize: 70, fontWeight: 700, color: '#fff', background: GREEN, padding: '18px 40px', borderRadius: 30}}>
						бесплатно
					</Pop>
					<Pop at={at(8, 62.2)} style={{fontFamily: IT, fontSize: 70, fontWeight: 700, color: '#fff', background: INK, padding: '18px 40px', borderRadius: 30}}>
						навсегда
					</Pop>
				</div>
			</Page>
			<Tick at={at(8, 58.2)} />
			<Tick at={at(8, 61.2)} vol={0.22} />
			<Tick at={at(8, 62.2)} />
		</Drift>
	);
};

/* 10 — today: 5+ billion */
const S10: React.FC = () => {
	const f = useCurrentFrame();
	const n = interpolate(f, [at(9, 65.0), at(9, 66.5)], [0, 5], {...clamp, easing: INOUT});
	const dots = Array.from({length: 60});
	return (
		<Drift dur={DUR[9] + TR}>
			<AppleBg />
			<Page gap={30}>
				<Lines at={at(9, 63.2)} size={90} weight={700} lines={['Сегодня']} color={GRAY} />
				<div style={{position: 'relative', width: 680, height: 600, borderRadius: 40, overflow: 'hidden', boxShadow: '0 40px 90px rgba(0,30,90,0.35)', background: '#000'}}>
					<Img src={staticFile('tbl/earth.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', scale: String(interpolate(f, [0, DUR[9]], [1.05, 1.2], clamp)), rotate: `${f * 0.03}deg`}} />
				</div>
				<div style={{fontFamily: IT, fontSize: 160, fontWeight: 700, color: INK, letterSpacing: -7, lineHeight: 1, whiteSpace: 'nowrap'}}>{n.toFixed(0)} млрд+</div>
				<Lines at={at(9, 67.0)} size={56} weight={700} lines={['каждый сайт работает', 'на его идее']} colors={[SUB, ACCENT]} stagger={at(9, 68.9) - at(9, 67.0)} />
			</Page>
			<Tick at={at(9, 66.5)} vol={0.22} />
		</Drift>
	);
};

/* 11 — «Интернет должен принадлежать всем» + CTA */
const S11: React.FC = () => {
	const f = useCurrentFrame();
	const tapAt = at(10, 73.0);
	const tap = interpolate(f - tapAt, [0, 5, 14], [1, 0.93, 1], clamp);
	return (
		<Drift dur={DUR[10]}>
			<AppleBg />
			<Page gap={40}>
				<Lines at={at(10, 70.3)} size={110} weight={700} lines={['Интернет должен', 'принадлежать']} stagger={at(10, 71.5) - at(10, 70.3)} />
				<Big at={at(10, 72.25)} size={200} color={ACCENT}>
					всем
				</Big>
				<Rise at={at(10, 72.7)} dist={30} style={{marginTop: 40}}>
					<div style={{scale: String(tap)}}>
						<BlackPill style={{fontSize: 60, fontWeight: 700, padding: '34px 80px', borderRadius: 90}}>Подписывайся</BlackPill>
					</div>
				</Rise>
				<Lines at={at(10, 74.2)} size={50} weight={600} lines={['дальше — люди,', 'которые создали интернет']} color={GRAY} stagger={4} />
			</Page>
			<Tick at={at(10, 72.25)} vol={0.22} />
			<Tick at={tapAt} />
		</Drift>
	);
};

const SCENES = [S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11];

export const Tbl: React.FC = () => (
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
		<Audio src={staticFile('tbl/voice.mp3')} />
	</AbsoluteFill>
);
