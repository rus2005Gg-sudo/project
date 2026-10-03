import React from 'react';
import '@fontsource/jetbrains-mono/500.css';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {Img} from 'remotion';
import {LOGO, ACCENT, AppIcon, AppleBg, BlackPill, Card, Drift as KitDrift, Eyebrow, GRAY, HAIR, INK, INOUT, IT, Lines, Lockup, Rise, SUB, blurZoom, clamp, prog} from './kit';

export const LO_FPS = 30;
const VOICE = 70.72;
const TR = 14;
// scene starts (s), slightly ahead of the first word of each phrase (word times from ASR)
const STARTS = [0, 5.5, 9.5, 18.1, 23.05, 32.35, 37.7, 43.75, 53.85, 61.1, 66.3];
const fr = (s: number) => Math.round(s * LO_FPS);
export const LO_FRAMES = fr(VOICE + 1.4);
const DUR = STARTS.map((s, i) => (i < STARTS.length - 1 ? fr(STARTS[i + 1]) : LO_FRAMES) - fr(s));
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

const GREENT = '#39d98a';

/** dark terminal card with a block cursor */
const Term: React.FC<{children: React.ReactNode; w?: number; red?: boolean; glitch?: number}> = ({children, w = W, red, glitch = 0}) => {
	const f = useCurrentFrame();
	return (
		<div style={{position: 'relative', width: w, background: '#0a0d12', borderRadius: 28, padding: '40px 44px', boxSizing: 'border-box', boxShadow: `0 30px 70px rgba(0,0,0,0.35)${red ? ', 0 0 0 4px #ff3b30' : ''}`, overflow: 'hidden', translate: glitch ? `${Math.sin(f * 7) * 10 * glitch}px ${Math.cos(f * 5) * 4 * glitch}px` : undefined}}>
			<div style={{fontFamily: MONO, fontSize: 120, fontWeight: 500, color: red ? '#ff5b52' : GREENT, letterSpacing: 6, lineHeight: 1.1, minHeight: 140, textShadow: `0 0 24px ${red ? 'rgba(255,59,48,0.5)' : 'rgba(57,217,138,0.5)'}`}}>
				{children}
				<span style={{opacity: Math.floor(f / 10) % 2 ? 1 : 0}}>▌</span>
			</div>
			{glitch > 0
				? Array.from({length: 6}).map((_, i) => <div key={i} style={{position: 'absolute', left: 0, right: 0, top: ((f * 37 + i * 53) % 100) + '%', height: 6 + (i % 3) * 6, background: 'rgba(255,59,48,0.35)', opacity: glitch}} />)
				: null}
		</div>
	);
};

/* 1 — hook: «Первое сообщение… двух букв. И на них сеть сломалась» */
const S1: React.FC = () => {
	const f = useCurrentFrame();
	const crash = prog(f, at(0, 4.4), 10);
	return (
		<Drift dur={DUR[0] + TR}>
			<AppleBg glow={crash > 0.5 ? '255,59,48' : '0,113,227'} />
			<Page gap={40}>
				<Lines at={0} size={84} weight={700} lines={['Первое сообщение', 'в истории интернета']} stagger={8} />
				<Term red={crash > 0.5} glitch={crash > 0 && crash < 1 ? 1 : crash >= 1 ? 0.3 : 0}>
					{f > at(0, 2.9) ? 'L' : ''}
					{f > at(0, 3.3) ? 'O' : ''}
				</Term>
				<Lines at={at(0, 2.0)} size={60} weight={700} lines={['всего две буквы']} color={SUB} />
				<Pop at={at(0, 4.4)} style={{fontFamily: IT, fontSize: 80, fontWeight: 700, color: '#fff', background: RED, padding: '18px 48px', borderRadius: 40}}>
					и сеть сломалась
				</Pop>
			</Page>
			<Tick at={at(0, 2.9)} />
			<Tick at={at(0, 3.3)} />
			<Tick at={at(0, 4.4)} vol={0.26} />
		</Drift>
	);
};

/* 2 — ad: 3 days free */
const S2: React.FC = () => (
	<Drift dur={DUR[1] + TR}>
		<AppleBg />
		<Page gap={30}>
			<Eyebrow at={at(1, 5.6)}>Кстати</Eyebrow>
			<AppIcon size={240} at={at(1, 5.9)} />
			<Lines at={at(1, 6.1)} size={150} weight={700} lines={['Horz VPN']} />
			<Rise at={at(1, 7.15)} dist={30}>
				<BlackPill style={{fontSize: 52, fontWeight: 600, padding: '30px 60px'}}>Ссылка в профиле</BlackPill>
			</Rise>
			<Rise at={at(1, 8.35)} dist={40} dur={18}>
				<Card style={{width: W, padding: '28px 40px', boxSizing: 'border-box', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 22}}>
					<span style={{fontFamily: IT, fontSize: 130, fontWeight: 700, color: ACCENT, letterSpacing: -6, lineHeight: 1}}>3</span>
					<span style={{fontFamily: IT, fontSize: 54, fontWeight: 600, color: INK}}>дня бесплатно</span>
				</Card>
			</Rise>
		</Page>
		<Tick at={at(1, 7.15)} />
		<Tick at={at(1, 8.6)} />
	</Drift>
);

/* 3 — 29.10.1969, California map */
const S3: React.FC = () => (
	<Drift dur={DUR[2] + TR}>
		<AppleBg />
		<Page gap={30}>
			<Big at={at(2, 9.6)} size={150}>
				29.10.1969
			</Big>
			<Lines at={at(2, 12.7)} size={70} weight={700} lines={['Калифорния']} color={SUB} />
			<Tracked
				src="lo/map.jpg"
				iw={720}
				ih={640}
				w={W}
				h={800}
				at={at(2, 12.6)}
				from={[330, 320, 1]}
				to={[200, 400, 1.35]}
				dur={fr(5)}
				targets={[
					{x: 215, y: 470, w: 70, h: 70, label: 'UCLA', at: at(2, 15.9)},
					{x: 62, y: 267, w: 70, h: 70, label: 'Стэнфорд', at: at(2, 15.9), color: RED},
				]}
			/>
		</Page>
		<Tick at={at(2, 9.6)} />
		<Tick at={at(2, 15.9)} />
	</Drift>
);

/* 4 — UCLA room: task is to send LOGIN to Stanford, 500 km */
const S4: React.FC = () => {
	const f = useCurrentFrame();
	const word = 'LOGIN';
	const n = Math.round(interpolate(f, [at(3, 19.9), at(3, 20.5)], [0, word.length], clamp));
	return (
		<Drift dur={DUR[3] + TR}>
			<AppleBg />
			<Page gap={30}>
				<Tracked src="lo/room.jpg" iw={827} ih={560} w={W} h={560} at={at(3, 18.1)} from={[413, 300, 1]} to={[560, 300, 1.25]} dur={fr(5)} targets={[{x: 440, y: 40, w: 230, h: 470, label: 'тот самый узел сети', at: at(3, 18.6)}]} />
				<Lines at={at(3, 18.5)} size={64} weight={700} lines={['Задача: отправить']} color={SUB} />
				<Term w={W - 160}>{word.slice(0, n)}</Term>
				<div style={{display: 'flex', alignItems: 'baseline', gap: 18}}>
					<Pop at={at(3, 21.2)} style={{fontFamily: IT, fontSize: 60, fontWeight: 700, color: INK}}>
						в Стэнфорд
					</Pop>
					<Pop at={at(3, 22.05)} style={{fontFamily: IT, fontSize: 60, fontWeight: 700, color: ACCENT}}>
						· 500 км
					</Pop>
				</div>
			</Page>
			<Tick at={at(3, 20.5)} />
		</Drift>
	);
};

/* 5 — L… «Видите?» «Видим». O… «Видим». G… crash */
const Bubble: React.FC<{at: number; side: 'l' | 'r'; children: React.ReactNode}> = ({at: a, side, children}) => (
	<Pop at={a} style={{alignSelf: side === 'l' ? 'flex-start' : 'flex-end', fontFamily: IT, fontSize: 48, fontWeight: 700, color: side === 'l' ? '#fff' : INK, background: side === 'l' ? ACCENT : '#fff', padding: '16px 34px', borderRadius: 34, boxShadow: '0 12px 30px rgba(20,40,90,0.12)'}}>
		{children}
	</Pop>
);
const S5: React.FC = () => {
	const f = useCurrentFrame();
	const crashAt = at(4, 31.0);
	const crash = prog(f, crashAt, 8);
	const typed = (f > at(4, 24.0) ? 'L' : '') + (f > at(4, 28.3) ? 'O' : '') + (f > at(4, 30.2) && f < crashAt + 4 ? 'G' : '');
	return (
		<Drift dur={DUR[4] + TR}>
			<AppleBg glow={crash > 0.5 ? '255,59,48' : '0,113,227'} />
			<Page gap={26}>
				<div style={{display: 'flex', gap: 26, alignItems: 'center', width: W}}>
					<Rise at={at(4, 24.6)} dist={30}>
						<div style={{width: 260, height: 260, borderRadius: 40, overflow: 'hidden', boxShadow: '0 20px 50px rgba(20,40,90,0.2)'}}>
							<Img src={staticFile('lo/phone.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
						</div>
					</Rise>
					<div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 14}}>
						<Bubble at={at(4, 25.9)} side="l">
							Видите?
						</Bubble>
						<Bubble at={at(4, 26.85)} side="r">
							Видим ✓
						</Bubble>
						<Bubble at={at(4, 28.8)} side="r">
							Видим ✓
						</Bubble>
					</div>
				</div>
				<Term red={crash > 0.5} glitch={crash > 0 ? (crash < 1 ? 1 : 0.4) : 0}>
					{typed}
				</Term>
				<Pop at={crashAt} style={{fontFamily: MONO, fontSize: 64, fontWeight: 500, color: '#fff', background: RED, padding: '16px 40px', borderRadius: 18}}>
					SYSTEM CRASH
				</Pop>
			</Page>
			<Tick at={at(4, 24.0)} />
			<Tick at={at(4, 28.3)} />
			<Tick at={at(4, 30.2)} />
			<Tick at={crashAt} vol={0.3} />
		</Drift>
	);
};

/* 6 — first word: «LO» — «Смотрите» */
const S6: React.FC = () => (
	<Drift dur={DUR[5] + TR}>
		<AppleBg />
		<Page gap={30}>
			<Lines at={at(5, 32.4)} size={80} weight={700} lines={['Первое слово интернета']} color={SUB} />
			<Pop at={at(5, 34.55)} style={{fontFamily: MONO, fontSize: 380, fontWeight: 500, color: INK, letterSpacing: 20, lineHeight: 1}}>
				LO
			</Pop>
			<Lines at={at(5, 35.2)} size={60} weight={700} lines={['как будто сеть сказала:']} color={SUB} />
			<Pop at={at(5, 36.85)} style={{fontFamily: IT, fontSize: 110, fontWeight: 700, color: ACCENT}}>
				«Смотрите»
			</Pop>
		</Page>
		<Tick at={at(5, 34.55)} vol={0.26} />
		<Tick at={at(5, 36.85)} />
	</Drift>
);

/* 7 — fixed in an hour; ARPANET works */
const S7: React.FC = () => (
	<Drift dur={DUR[6] + TR}>
		<AppleBg />
		<Page gap={28}>
			<div style={{display: 'flex', alignItems: 'center', gap: 24}}>
				<Lines at={at(6, 37.75)} size={70} weight={700} lines={['Через час']} color={SUB} />
				<Pop at={at(6, 39.9)} style={{fontFamily: MONO, fontSize: 70, fontWeight: 500, color: '#fff', background: GREEN, padding: '10px 28px', borderRadius: 16}}>
					LOGIN ✓
				</Pop>
			</div>
			<Tracked src="lo/imp.jpg" iw={827} ih={815} w={W} h={720} at={at(6, 38.2)} from={[420, 400, 1]} to={[600, 470, 1.3]} dur={fr(5)} targets={[{x: 410, y: 410, w: 395, h: 110, label: 'узел ARPANET', at: at(6, 41.8)}]} />
			<Big at={at(6, 41.85)} size={130} color={ACCENT}>
				ARPANET
			</Big>
			<Lines at={at(6, 42.5)} size={60} weight={700} lines={['прадедушка интернета']} color={SUB} />
		</Page>
		<Tick at={at(6, 39.9)} />
		<Tick at={at(6, 41.85)} vol={0.22} />
	</Drift>
);

/* 8 — Cerf & Kahn, TCP/IP */
const S8: React.FC = () => (
	<Drift dur={DUR[7] + TR}>
		<AppleBg />
		<Page gap={28}>
			<Lines at={at(7, 43.8)} size={70} weight={700} lines={['Настоящий прорыв']} color={SUB} />
			<Tracked src="lo/chalk.jpg" iw={827} ih={806} w={W} h={640} at={at(7, 44.0)} from={[413, 360, 1]} to={[640, 560, 1.4]} dur={fr(8)} targets={[{x: 690, y: 400, w: 110, h: 60, label: 'TCP', at: at(7, 49.0)}]} />
			<Lines at={at(7, 46.25)} size={80} weight={700} lines={['Винт Серф и Боб Кан']} />
			<Big at={at(7, 49.0)} size={160} color={ACCENT}>
				TCP/IP
			</Big>
			<Lines at={at(7, 50.8)} size={54} weight={700} lines={['общий язык для любых сетей мира']} color={SUB} />
		</Page>
		<Tick at={at(7, 46.25)} />
		<Tick at={at(7, 49.0)} vol={0.24} />
	</Drift>
);

/* 9 — 1.01.1983 birthday + diagram */
const S9: React.FC = () => (
	<Drift dur={DUR[8] + TR}>
		<AppleBg />
		<Page gap={30}>
			<Big at={at(8, 53.95)} size={150}>
				1.01.1983
			</Big>
			<Rise at={at(8, 55.0)} dist={40}><div style={{width: 640, borderRadius: 30, overflow: 'hidden', boxShadow: '0 30px 70px rgba(20,40,90,0.16)'}}><Img src={staticFile('lo/diagram.jpg')} style={{width: '100%', display: 'block'}} /></div></Rise>
			<Lines at={at(8, 57.9)} size={60} weight={700} lines={['эту дату называют']} color={SUB} />
			<Pop at={at(8, 59.3)} style={{fontFamily: IT, fontSize: 76, fontWeight: 700, color: '#fff', background: ACCENT, padding: '18px 44px', borderRadius: 40}}>
				днём рождения интернета 🎂
			</Pop>
		</Page>
		<Tick at={at(8, 53.95)} />
		<Tick at={at(8, 59.3)} vol={0.24} />
	</Drift>
);

/* 10 — today: billions of devices, your phone */
const S10: React.FC = () => {
	const f = useCurrentFrame();
	const dots = Array.from({length: 48});
	return (
		<Drift dur={DUR[9] + TR}>
			<AppleBg />
			<Page gap={30}>
				<Lines at={at(9, 61.15)} size={84} weight={700} lines={['Сегодня']} color={GRAY} />
				<div style={{position: 'relative', width: W, height: 520}}>
					{dots.map((_, i) => {
						const x = 40 + ((i * 173) % 800);
						const y = 30 + ((i * 97) % 460);
						const q = prog(f, at(9, 62.6) + i * 0.6, 8);
						return (
							<div key={i} style={{position: 'absolute', left: x, top: y, width: 54, height: 54, opacity: q * 0.8}}>
								{G.phone(i % 5 ? '#c7c7cc' : ACCENT)}
							</div>
						);
					})}
					<Pop at={at(9, 64.85)} style={{position: 'absolute', left: W / 2 - 110, top: 130, width: 220, height: 260, background: '#fff', borderRadius: 40, padding: 30, boxSizing: 'border-box', boxShadow: '0 30px 70px rgba(0,113,227,0.35), 0 0 0 5px ' + ACCENT}}>
						{G.phone(ACCENT)}
					</Pop>
				</div>
				<Lines at={at(9, 63.0)} size={70} weight={700} lines={['миллиарды устройств']} />
				<Lines at={at(9, 64.4)} size={64} weight={700} lines={['и твой телефон — прямо сейчас']} color={ACCENT} />
			</Page>
			<Tick at={at(9, 64.85)} vol={0.22} />
		</Drift>
	);
};

/* 11 — CTA */
const S11: React.FC = () => {
	const f = useCurrentFrame();
	const tapAt = at(10, 66.6);
	const tap = interpolate(f - tapAt, [0, 5, 14], [1, 0.93, 1], clamp);
	return (
		<Drift dur={DUR[10]}>
			<AppleBg />
			<Page gap={40}>
				<AppIcon size={200} at={0} float={false} />
				<Rise at={at(10, 66.4)} dist={30}>
					<div style={{scale: String(tap)}}>
						<BlackPill style={{fontSize: 64, fontWeight: 700, padding: '38px 90px', borderRadius: 90}}>Подписывайся</BlackPill>
					</div>
				</Rise>
				<Lines at={at(10, 67.4)} size={56} weight={700} lines={['дальше — люди,', 'которые создали интернет']} color={GRAY} stagger={6} />
			</Page>
			<Tick at={tapAt} vol={0.22} />
		</Drift>
	);
};

const SCENES = [S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11];

export const Lo: React.FC = () => (
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
		<Audio src={staticFile('lo/voice.mp3')} />
	</AbsoluteFill>
);
