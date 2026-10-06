import React from 'react';
import '@fontsource/jetbrains-mono/500.css';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {Img} from 'remotion';
import {LOGO, ACCENT, AppIcon, AppleBg, BlackPill, Card, Drift as KitDrift, Eyebrow, GRAY, HAIR, INK, INOUT, IT, Lines, Lockup, Rise, SUB, blurZoom, clamp, prog} from './kit';

export const FB_FPS = 30;
const VOICE = 52.24;
const TR = 14;
// scene starts (s), slightly ahead of the first word of each phrase (word times from ASR)
const STARTS = [0, 10.8, 15.8, 23.85, 29.9, 36.8, 43.4, 48.5];
const fr = (s: number) => Math.round(s * FB_FPS);
export const FB_FRAMES = fr(VOICE + 1.4);
const DUR = STARTS.map((s, i) => (i < STARTS.length - 1 ? fr(STARTS[i + 1]) : FB_FRAMES) - fr(s));
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

import {ICONS} from './BotWelcome';

const APPS = [
	{n: 'Facebook', ic: ICONS[4]},
	{n: 'Instagram', ic: ICONS[0]},
	{n: 'WhatsApp', ic: ICONS[3]},
];

const Big: React.FC<{at: number; children: React.ReactNode; size?: number; color?: string}> = ({at: a, children, size = 200, color = INK}) => (
	<Pop at={a} style={{fontFamily: IT, fontSize: size, fontWeight: 700, color, letterSpacing: -size * 0.045, lineHeight: 1, whiteSpace: 'nowrap'}}>
		{children}
	</Pop>
);

/** app icon that fades to a dashed empty slot at `gone` */
const AppSlot: React.FC<{ic: (typeof ICONS)[number]; name: string; at: number; gone: number}> = ({ic, name, at: a, gone}) => {
	const f = useCurrentFrame();
	const p = prog(f, a, 12);
	const g = prog(f, gone, 14);
	return (
		<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, opacity: p}}>
			<div style={{position: 'relative', width: 220, height: 220}}>
				<div style={{position: 'absolute', inset: 0, borderRadius: 56, border: '5px dashed #c7c7cc', opacity: g}} />
				<div style={{position: 'absolute', inset: 0, borderRadius: 56, background: ic.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(20,40,90,0.16)', opacity: 1 - g, scale: String(1 - g * 0.3), filter: `blur(${g * 14}px)`}}>
					{ic.glyph}
				</div>
			</div>
			<div style={{fontFamily: IT, fontSize: 40, fontWeight: 600, color: g > 0.5 ? GRAY : INK}}>{name}</div>
		</div>
	);
};

/* 1 — 4 Oct 2021: FB, IG, WA vanished; 3.5 B people */
const S1: React.FC = () => (
	<Drift dur={DUR[0] + TR}>
		<AppleBg glow="255,59,48" />
		<Page gap={46}>
			<Big at={0} size={120}>
				4 октября 2021
			</Big>
			<div style={{display: 'flex', gap: 50}}>
				{APPS.map((x, i) => (
					<AppSlot key={x.n} ic={x.ic} name={x.n} at={at(0, [2.45, 3.1, 3.85][i])} gone={at(0, 4.4) + i * 5} />
				))}
			</div>
			<Lines at={at(0, 4.4)} size={84} weight={700} lines={['исчезли из интернета']} colors={[RED]} />
			<Rise at={at(0, 8.1)} dist={40}>
				<Card style={{width: W, padding: '30px 40px', boxSizing: 'border-box', textAlign: 'center'}}>
					<div style={{fontFamily: IT, fontSize: 120, fontWeight: 700, color: INK, letterSpacing: -5, lineHeight: 1, whiteSpace: 'nowrap'}}>
						3,5 млрд
					</div>
					<div style={{fontFamily: IT, fontSize: 46, fontWeight: 600, color: SUB, marginTop: 12}}>человек без связи</div>
				</Card>
			</Rise>
		</Page>
		<Tick at={at(0, 4.4)} vol={0.22} />
		<Tick at={at(0, 8.1)} />
	</Drift>
);

/* 2 — ad */
const S2: React.FC = () => (
	<Drift dur={DUR[1] + TR}>
		<AppleBg />
		<Page gap={30}>
			<Eyebrow at={at(1, 10.85)}>Кстати</Eyebrow>
			<AppIcon size={240} at={at(1, 11.1)} />
			<Lines at={at(1, 11.4)} size={150} weight={700} lines={['Horz VPN']} />
			<Rise at={at(1, 12.15)} dist={30}>
				<BlackPill style={{fontSize: 52, fontWeight: 600, padding: '30px 60px'}}>Ссылка в профиле</BlackPill>
			</Rise>
			<Rise at={at(1, 13.2)} dist={40} dur={18}>
				<Card style={{width: W, padding: '28px 40px', boxSizing: 'border-box', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 22}}>
					<span style={{fontFamily: IT, fontSize: 130, fontWeight: 700, color: ACCENT, letterSpacing: -6, lineHeight: 1}}>3</span>
					<span style={{fontFamily: IT, fontSize: 54, fontWeight: 600, color: INK}}>дня бесплатно</span>
				</Card>
			</Rise>
			<Lines at={at(1, 14.8)} size={64} weight={700} lines={['Что случилось?']} color={SUB} />
		</Page>
		<Tick at={at(1, 12.15)} />
		<Tick at={at(1, 13.5)} />
	</Drift>
);

/* 3 — a routine command with a bug cuts every backbone link */
const S3: React.FC = () => {
	const f = useCurrentFrame();
	const cut = prog(f, at(2, 21.2), 16, INOUT);
	const typed = Math.floor(interpolate(f, [at(2, 16.7), at(2, 18.7)], [0, 1], clamp) * 26);
	const cmd = '$ check-backbone --all';
	const N = 8;
	return (
		<Drift dur={DUR[2] + TR}>
			<AppleBg />
			<Page gap={30}>
				<Lines at={at(2, 15.9)} size={80} weight={700} lines={['Обычная команда']} />
				<Rise at={at(2, 16.6)} dist={30}>
					<div style={{width: W, background: '#0a0d12', borderRadius: 26, padding: '28px 34px', boxSizing: 'border-box', fontFamily: MONO, fontSize: 40, color: '#c9d1d9', boxShadow: f > at(2, 19.9) ? '0 0 0 5px ' + RED : undefined}}>
						{cmd.slice(0, typed)}
						<span style={{opacity: Math.floor(f / 15) % 2}}>▍</span>
						{f > at(2, 19.9) ? <div style={{color: '#ff6b6b', marginTop: 10}}>⚠ ошибка в проверке</div> : null}
					</div>
				</Rise>
				{/* hub with backbone links */}
				<Rise at={at(2, 18.5)} dist={30}>
					<div style={{position: 'relative', width: 640, height: 640}}>
						<svg viewBox="-320 -320 640 640" width={640} height={640} style={{position: 'absolute', inset: 0}}>
							{Array.from({length: N}).map((_, i) => {
								const a = (i / N) * Math.PI * 2;
								const x = Math.cos(a) * 270;
								const y = Math.sin(a) * 270;
								const k = Math.min(1, Math.max(0, cut * 1.6 - i * 0.08));
								return (
									<g key={i}>
										<line x1={0} y1={0} x2={x * (1 - k * 0.45)} y2={y * (1 - k * 0.45)} stroke={k > 0 ? RED : ACCENT} strokeWidth={6} strokeDasharray={k > 0 ? '14 12' : undefined} opacity={1 - k * 0.6} />
										<circle cx={x} cy={y} r={26} fill={k > 0.5 ? '#d1d1d6' : ACCENT} />
									</g>
								);
							})}
						</svg>
						<div style={{position: 'absolute', left: 220, top: 220, width: 200, height: 200, borderRadius: 52, background: ICONS[4].bg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(20,40,90,0.2)'}}>{ICONS[4].glyph}</div>
					</div>
				</Rise>
				<Pop at={at(2, 21.2)} style={{fontFamily: IT, fontSize: 60, fontWeight: 700, color: '#fff', background: RED, padding: '16px 40px', borderRadius: 40, whiteSpace: 'nowrap'}}>
					все соединения отключены
				</Pop>
			</Page>
			<Tick at={at(2, 19.9)} />
			<Tick at={at(2, 21.2)} vol={0.24} />
		</Drift>
	);
};

/* 4 — servers fine, but the internet forgot the way; internal systems down */
const S4: React.FC = () => {
	const f = useCurrentFrame();
	const lost = prog(f, at(3, 26.1), 20, INOUT);
	return (
		<Drift dur={DUR[3] + TR}>
			<AppleBg />
			<Page gap={34}>
				<Rise at={at(3, 23.9)} dist={30}>
					<Card style={{width: W, padding: '30px 40px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 28}}>
						<div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
							{[0, 1, 2].map((i) => (
								<div key={i} style={{width: 150, height: 40, borderRadius: 10, background: INK, display: 'flex', alignItems: 'center', paddingLeft: 16, gap: 8}}>
									<div style={{width: 12, height: 12, borderRadius: 6, background: GREEN, opacity: 0.5 + 0.5 * Math.sin(f / 5 + i)}} />
									<div style={{width: 12, height: 12, borderRadius: 6, background: GREEN}} />
								</div>
							))}
						</div>
						<div>
							<div style={{fontFamily: IT, fontSize: 56, fontWeight: 700, color: INK}}>Серверы целы</div>
							<div style={{fontFamily: IT, fontSize: 44, fontWeight: 700, color: GREEN}}>✓ работают</div>
						</div>
					</Card>
				</Rise>
				<Lines at={at(3, 25.2)} size={76} weight={700} lines={['но интернет', 'забыл дорогу']} colors={[INK, RED]} stagger={8} />
				<Rise at={at(3, 25.8)} dist={30}>
					<div style={{display: 'flex', alignItems: 'center', gap: 24}}>
						<div style={{fontSize: 90}}>🌐</div>
						<svg width={360} height={40}>
							<line x1={0} y1={20} x2={360} y2={20} stroke={lost > 0 ? RED : ACCENT} strokeWidth={6} strokeDasharray="16 14" strokeDashoffset={-f * 2} opacity={1 - lost * 0.5} />
							<text x={180} y={34} textAnchor="middle" fontSize={44} fontWeight={700} fill={RED} opacity={lost} fontFamily="Inter Tight">?</text>
						</svg>
						<div style={{width: 110, height: 110, borderRadius: 30, background: ICONS[4].bg, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 1 - lost * 0.6, filter: `grayscale(${lost})`}}>{ICONS[4].glyph}</div>
					</div>
				</Rise>
				<Pop at={at(3, 28.0)} style={{fontFamily: IT, fontSize: 58, fontWeight: 700, color: '#fff', background: INK, padding: '16px 40px', borderRadius: 40, whiteSpace: 'nowrap'}}>
					и внутренние системы легли
				</Pop>
			</Page>
			<Tick at={at(3, 26.1)} />
			<Tick at={at(3, 28.0)} />
		</Drift>
	);
};

/* 5 — badges didn't work; engineers sent to the data center */
const S5: React.FC = () => {
	const f = useCurrentFrame();
	const deny = f > at(4, 32.9);
	const shake = deny ? Math.sin((f - at(4, 32.9)) * 1.6) * interpolate(f - at(4, 32.9), [0, 14], [10, 0], clamp) : 0;
	return (
		<Drift dur={DUR[4] + TR}>
			<AppleBg />
			<Page gap={34}>
				<Lines at={at(4, 30.0)} size={76} weight={700} lines={['Сотрудники', 'не могли войти']} stagger={8} />
				<Rise at={at(4, 32.0)} dist={30}>
					<div style={{display: 'flex', alignItems: 'center', gap: 40, translate: `${shake}px 0`}}>
						<div style={{width: 230, height: 150, borderRadius: 22, background: 'linear-gradient(135deg,#1877f2,#0a4fb5)', padding: 22, boxSizing: 'border-box', color: '#fff', fontFamily: IT, boxShadow: '0 20px 40px rgba(20,40,90,0.2)'}}>
							<div style={{width: 50, height: 50, borderRadius: 25, background: 'rgba(255,255,255,0.4)'}} />
							<div style={{fontSize: 26, fontWeight: 700, marginTop: 12}}>ПРОПУСК</div>
						</div>
						<div style={{width: 170, height: 230, borderRadius: 26, background: '#1d1d1f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20}}>
							<div style={{width: 40, height: 40, borderRadius: 20, background: deny ? RED : '#636366', boxShadow: deny ? '0 0 30px ' + RED : undefined}} />
							<div style={{fontFamily: MONO, fontSize: 28, color: deny ? '#ff6b6b' : '#8e8e93'}}>{deny ? 'ОТКАЗ' : '· · ·'}</div>
						</div>
					</div>
				</Rise>
				<Lines at={at(4, 33.8)} size={60} weight={700} lines={['инженеров — в дата-центр']} color={SUB} />
				<Rise at={at(4, 35.5)} dist={30}>
					<Card style={{width: W, padding: '26px 40px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, fontFamily: IT, fontSize: 54, fontWeight: 700, color: INK}}>
						🔧 чинить вручную
					</Card>
				</Rise>
			</Page>
			<Tick at={at(4, 32.9)} vol={0.24} />
			<Tick at={at(4, 35.5)} />
		</Drift>
	);
};

/* 6 — ~6 hours down, Zuckerberg −$7B */
const S6: React.FC = () => {
	const f = useCurrentFrame();
	const ring = prog(f, at(5, 38.3), 24, INOUT);
	return (
		<Drift dur={DUR[5] + TR}>
			<AppleBg />
			<Page gap={34}>
				<Lines at={at(5, 36.85)} size={64} weight={700} lines={['Facebook лежал почти']} color={SUB} />
				<div style={{position: 'relative', width: 380, height: 380}}>
					<svg viewBox="0 0 100 100" width={380} height={380} style={{position: 'absolute', inset: 0, rotate: '-90deg'}}>
						<circle cx={50} cy={50} r={44} fill="none" stroke="#e5e5ea" strokeWidth={8} />
						<circle cx={50} cy={50} r={44} fill="none" stroke={RED} strokeWidth={8} strokeLinecap="round" strokeDasharray={`${ring * 0.5 * 276.5} 276.5`} />
					</svg>
					<div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
						<div style={{fontFamily: IT, fontSize: 150, fontWeight: 700, color: INK, lineHeight: 1}}>
							<Roll from={0} to={6} a={at(5, 38.3)} b={at(5, 39.1)} />
						</div>
						<div style={{fontFamily: IT, fontSize: 46, fontWeight: 600, color: SUB}}>часов</div>
					</div>
				</div>
				<Rise at={at(5, 39.5)} dist={40}>
					<Card style={{width: W, padding: '30px 40px', boxSizing: 'border-box', textAlign: 'center'}}>
						<div style={{fontFamily: IT, fontSize: 44, fontWeight: 600, color: SUB}}>Цукерберг потерял за день</div>
						<div style={{fontFamily: IT, fontSize: 130, fontWeight: 700, color: RED, letterSpacing: -5, lineHeight: 1.1, whiteSpace: 'nowrap'}}>
							−$<Roll from={0} to={7} a={at(5, 41.0)} b={at(5, 41.9)} /> млрд
						</div>
					</Card>
				</Rise>
			</Page>
			<Tick at={at(5, 38.3)} />
			<Tick at={at(5, 41.9)} vol={0.24} />
		</Drift>
	);
};

/* 7 — everyone went to Telegram: +70 M users in a day */
const TG = (
	<svg viewBox="0 0 24 24" width="56%">
		<path d="M3 11.5l16.5-6.5c.8-.3 1.5.2 1.2 1.4l-2.8 13.2c-.2 1-.8 1.2-1.6.7l-4.4-3.3-2.1 2c-.2.2-.4.4-.9.4l.3-4.5 8.2-7.4c.4-.3-.1-.5-.5-.2L6.8 13.6 2.5 12.3c-.9-.3-.9-.9.5-.8z" fill="#fff" />
	</svg>
);
const S7: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<Drift dur={DUR[6] + TR}>
			<AppleBg />
			<Page gap={36}>
				<Lines at={at(6, 43.5)} size={72} weight={700} lines={['А люди ушли в']} />
				<Rise at={at(6, 44.8)} dist={40}>
					<div style={{display: 'flex', alignItems: 'center', gap: 30}}>
						<div style={{width: 200, height: 200, borderRadius: 100, background: 'linear-gradient(180deg,#2aabee,#229ed9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 50px rgba(34,158,217,0.4)', scale: String(1 + Math.sin(f / 10) * 0.02)}}>{TG}</div>
						<div style={{fontFamily: IT, fontSize: 110, fontWeight: 700, color: '#229ed9', letterSpacing: -4}}>Telegram</div>
					</div>
				</Rise>
				<Rise at={at(6, 45.5)} dist={40}>
					<Card style={{width: W, padding: '30px 40px', boxSizing: 'border-box', textAlign: 'center'}}>
						<div style={{fontFamily: IT, fontSize: 150, fontWeight: 700, color: INK, letterSpacing: -6, lineHeight: 1, whiteSpace: 'nowrap'}}>
							+<Roll from={0} to={70} a={at(6, 46.5)} b={at(6, 47.6)} /> млн
						</div>
						<div style={{fontFamily: IT, fontSize: 46, fontWeight: 600, color: SUB, marginTop: 12}}>новых пользователей за сутки</div>
					</Card>
				</Rise>
			</Page>
			<Tick at={at(6, 44.8)} />
			<Tick at={at(6, 47.6)} vol={0.22} />
		</Drift>
	);
};

/* 8 — CTA */
const S8: React.FC = () => {
	const f = useCurrentFrame();
	const tapAt = at(7, 49.0);
	const tap = interpolate(f - tapAt, [0, 5, 14], [1, 0.93, 1], clamp);
	return (
		<Drift dur={DUR[7]}>
			<AppleBg />
			<Page gap={40}>
				<AppIcon size={200} at={0} float={false} />
				<Rise at={at(7, 48.6)} dist={30}>
					<div style={{scale: String(tap)}}>
						<BlackPill style={{fontSize: 64, fontWeight: 700, padding: '38px 90px', borderRadius: 90}}>Подписывайся</BlackPill>
					</div>
				</Rise>
				<Lines at={at(7, 49.5)} size={56} weight={700} lines={['дальше — как ломается', 'интернет']} color={GRAY} stagger={6} />
			</Page>
			<Tick at={tapAt} vol={0.22} />
		</Drift>
	);
};

const SCENES = [S1, S2, S3, S4, S5, S6, S7, S8];

export const Fb: React.FC = () => (
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
		<Audio src={staticFile('fb/voice.mp3')} />
	</AbsoluteFill>
);
