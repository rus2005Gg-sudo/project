import React from 'react';
import '@fontsource/jetbrains-mono/500.css';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {Img} from 'remotion';
import {LOGO, ACCENT, AppIcon, AppleBg, BlackPill, Card, Drift as KitDrift, Eyebrow, GRAY, HAIR, INK, INOUT, IT, Lines, Lockup, Rise, SUB, blurZoom, clamp, prog} from './kit';

export const IN_FPS = 30;
const VOICE = 51.44;
const TR = 14;
// scene starts (s), slightly ahead of the first word of each phrase (word times from ASR)
const STARTS = [0, 5.2, 9.9, 16.9, 19.85, 27.1, 33.35, 41.7, 46.55];
const fr = (s: number) => Math.round(s * IN_FPS);
export const INSIDE_FRAMES = fr(VOICE + 1.4);
const DUR = STARTS.map((s, i) => (i < STARTS.length - 1 ? fr(STARTS[i + 1]) : INSIDE_FRAMES) - fr(s));
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

/* 1 — hook «Что происходит, когда ты нажимаешь „подключить VPN“? Разбираем за 40 секунд» */
const S1: React.FC = () => {
	const f = useCurrentFrame();
	const tapAt = at(0, 2.5);
	const on = prog(f, tapAt, 12, INOUT);
	const tap = interpolate(f - tapAt, [0, 5, 14], [1, 0.94, 1], clamp);
	return (
		<Drift dur={DUR[0] + TR}>
			<AppleBg />
			<Page gap={50}>
				<div style={{textAlign: 'center'}}>
					<Lines at={0} size={96} weight={700} lines={['Что происходит,']} color={GRAY} />
					<Lines at={at(0, 1.6)} size={96} weight={700} lines={['когда ты жмёшь']} />
				</div>
				<Rise at={at(0, 1.9)} dist={40}>
					<div style={{scale: String(tap), background: on > 0.5 ? ACCENT : INK, color: '#fff', fontFamily: IT, fontSize: 64, fontWeight: 700, padding: '40px 70px', borderRadius: 90, display: 'flex', alignItems: 'center', gap: 26, boxShadow: `0 0 0 ${on * 26}px rgba(0,113,227,${0.25 * (1 - on) + 0.05})`}}>
						<div style={{width: 120, height: 66, borderRadius: 33, background: on > 0.5 ? '#fff' : '#48484a', padding: 6, boxSizing: 'border-box'}}>
							<div style={{width: 54, height: 54, borderRadius: 27, background: on > 0.5 ? ACCENT : '#fff', translate: `${on * 54}px 0`}} />
						</div>
						Подключить VPN
					</div>
				</Rise>
				<Rise at={at(0, 3.8)} dist={20}>
					<div style={{fontFamily: IT, fontSize: 56, fontWeight: 600, color: SUB}}>
						разбираем за <span style={{color: ACCENT, fontWeight: 700}}>40 секунд</span>
					</div>
				</Rise>
			</Page>
			<Tick at={tapAt} vol={0.24} />
		</Drift>
	);
};

/* 2 — ad */
const S2: React.FC = () => (
	<Drift dur={DUR[1] + TR}>
		<AppleBg />
		<Page gap={30}>
			<Eyebrow at={at(1, 5.25)}>Кстати</Eyebrow>
			<AppIcon size={240} at={at(1, 6.2)} />
			<Lines at={at(1, 6.75)} size={150} weight={700} lines={['Horz VPN']} />
			<Rise at={at(1, 7.65)} dist={30}>
				<BlackPill style={{fontSize: 52, fontWeight: 600, padding: '30px 60px'}}>Ссылка в профиле</BlackPill>
			</Rise>
			<Rise at={at(1, 8.65)} dist={40} dur={18}>
				<Card style={{width: W, padding: '28px 40px', boxSizing: 'border-box', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 22}}>
					<span style={{fontFamily: IT, fontSize: 130, fontWeight: 700, color: ACCENT, letterSpacing: -6, lineHeight: 1}}>30</span>
					<span style={{fontFamily: IT, fontSize: 54, fontWeight: 600, color: INK}}>дней бесплатно</span>
				</Card>
			</Rise>
		</Page>
		<Tick at={at(1, 7.65)} />
		<Tick at={at(1, 8.95)} />
	</Drift>
);

/* vertical route with packets travelling down it */
const Route: React.FC<{a: number; h: number; color: string; label?: string; dashed?: boolean}> = ({a, h, color, label}) => {
	const f = useCurrentFrame();
	const p = prog(f, a, 16, INOUT);
	return (
		<div style={{position: 'relative', width: 8, height: h, marginLeft: 81}}>
			<div style={{position: 'absolute', left: 0, top: 0, width: 8, height: h * p, borderRadius: 4, background: color, opacity: 0.35}} />
			{p >= 1 && label
				? Array.from({length: 2}).map((_, i) => {
						const y = ((f * 3 + i * (h / 2)) % h) - 20;
						return (
							<div key={i} style={{position: 'absolute', left: 30, top: y, fontFamily: MONO, fontSize: 30, color: '#fff', background: color, padding: '4px 12px', borderRadius: 8, whiteSpace: 'nowrap'}}>
								{label}
							</div>
						);
					})
				: null}
		</div>
	);
};

/* 3 — without VPN: phone → ISP → site, data visible */
const S3: React.FC = () => {
	const f = useCurrentFrame();
	const eye = prog(f, at(2, 16.2), 14);
	return (
		<Drift dur={DUR[2] + TR}>
			<AppleBg glow="255,59,48" />
			<Page gap={0}>
				<Lines at={at(2, 10.65)} size={110} weight={700} lines={['Без VPN']} color={RED} />
				<div style={{height: 50}} />
				<div style={{width: 'fit-content'}}>
					<Node at={at(2, 11.4)} icon={G.phone(INK)} label="Твой телефон" />
					<Route a={at(2, 12.2)} h={150} color={RED} label="PASS qwerty" />
					<div style={{position: 'relative'}}>
						<Node at={at(2, 13.8)} icon={G.isp(RED)} label="Провайдер" ring={RED} />
						<div style={{position: 'absolute', left: 560, top: 30, width: 110, height: 110, borderRadius: 55, background: RED, padding: 24, boxSizing: 'border-box', opacity: eye, scale: String(interpolate(eye, [0, 0.6, 1], [0.5, 1.08, 1]))}}>{G.eye('#fff')}</div>
					</div>
					<Route a={at(2, 14.4)} h={150} color={RED} label="card=4276…" />
					<Node at={at(2, 14.8)} icon={G.globe(INK)} label="Сайт" />
				</div>
				<div style={{height: 40}} />
				<Pop at={at(2, 15.5)} style={{fontFamily: IT, fontSize: 60, fontWeight: 700, color: INK}}>
					По дороге <span style={{color: RED}}>всё видно</span>
				</Pop>
			</Page>
			<Tick at={at(2, 16.2)} />
		</Drift>
	);
};

/* 4 — three things */
const S4: React.FC = () => {
	const items: [React.ReactNode, string, number][] = [
		[G.key(ACCENT), 'Ключи', at(3, 17.4)],
		[G.lock(ACCENT), 'Шифрование', at(3, 18.5)],
		[G.server(ACCENT), 'VPN-сервер', at(3, 19.15)],
	];
	return (
		<Drift dur={DUR[3] + TR}>
			<AppleBg />
			<Page gap={30}>
				<div style={{display: 'flex', alignItems: 'baseline', gap: 26}}>
					<Pop at={at(3, 19.1)} style={{fontFamily: IT, fontSize: 260, fontWeight: 700, color: ACCENT, letterSpacing: -12, lineHeight: 1}}>
						3
					</Pop>
					<Lines at={at(3, 18.5)} size={110} weight={700} lines={['шага']} />
				</div>
				{items.map(([ic, t, a], i) => (
					<Rise key={t} at={a} dist={40} dur={16}>
						<Card style={{width: W, padding: '30px 40px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 30}}>
							<div style={{width: 90, height: 90, borderRadius: 26, background: 'rgba(0,113,227,0.08)', padding: 20, boxSizing: 'border-box'}}>{ic}</div>
							<div style={{fontFamily: IT, fontSize: 60, fontWeight: 700, color: INK}}>
								<span style={{color: GRAY}}>{i + 1}.</span> {t}
							</div>
						</Card>
					</Rise>
				))}
			</Page>
			{items.map(([, t, a]) => (
				<Tick key={t} at={a} />
			))}
		</Drift>
	);
};

/* 5 — step 1: key exchange */
const S5: React.FC = () => {
	const f = useCurrentFrame();
	const a = at(4, 21.9);
	const b = at(4, 22.8);
	const k = interpolate(f, [a, b], [0, 1], {...clamp, easing: INOUT});
	const lockP = prog(f, b, 14);
	return (
		<Drift dur={DUR[4] + TR}>
			<AppleBg />
			<Page gap={40}>
				<div style={{textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20}}>
					<Step at={at(4, 19.9)} n={1} />
					<Lines at={at(4, 22.0)} size={100} weight={700} lines={['Обмен ключами']} />
				</div>
				<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0}}>
					<Node at={at(4, 20.5)} icon={G.phone(INK)} label="Телефон" size={150} />
					<div style={{position: 'relative', width: 200, height: 300}}>
						{[0, 1].map((i) => {
							const y0 = i === 0 ? 0 : 210;
							const y = y0 + (105 - y0) * k;
							return <div key={i} style={{position: 'absolute', left: 55, top: y, width: 90, height: 90, opacity: f >= a ? 1 - lockP : 0, rotate: `${(i ? -1 : 1) * (1 - k) * 90}deg`}}>{G.key(i ? ACCENT : INK)}</div>;
						})}
						<div style={{position: 'absolute', left: 15, top: 65, width: 170, height: 170, borderRadius: 50, background: ACCENT, padding: 36, boxSizing: 'border-box', opacity: lockP, scale: String(interpolate(lockP, [0, 0.6, 1], [0.4, 1.1, 1])), boxShadow: '0 20px 50px rgba(0,113,227,0.35)'}}>{G.lock('#fff')}</div>
					</div>
					<Node at={at(4, 21.1)} icon={G.server(ACCENT)} label="VPN-сервер" size={150} ring={ACCENT} />
				</div>
				<Rise at={at(4, 23.5)} dist={24}>
					<div style={{fontFamily: IT, fontSize: 52, fontWeight: 600, color: SUB, textAlign: 'center'}}>
						<span style={{color: INK, fontWeight: 700}}>секретный язык</span>, который знаете
						<br />
						только вы двое
					</div>
				</Rise>
			</Page>
			<Tick at={b} vol={0.24} />
		</Drift>
	);
};

/* 6 — step 2: encrypt + wrap into an envelope */
const S6: React.FC = () => {
	const f = useCurrentFrame();
	const plain = 'PASS qwerty123';
	const enc = 'x9#Lq@7!vR2%kZ';
	const e = interpolate(f, [at(5, 28.9), at(5, 29.6)], [0, plain.length], clamp);
	const shown = plain.split('').map((c, i) => (i < e ? enc[i] : c)).join('');
	const wrap = prog(f, at(5, 30.4), 18, INOUT);
	return (
		<Drift dur={DUR[5] + TR}>
			<AppleBg />
			<Page gap={50}>
				<div style={{textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20}}>
					<Step at={at(5, 27.15)} n={2} />
					<Lines at={at(5, 28.9)} size={100} weight={700} lines={['Шифрование']} />
				</div>
				<div style={{position: 'relative', width: W, height: 520, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
					{/* envelope */}
					<div style={{position: 'absolute', width: 760, height: 480, borderRadius: 40, background: '#fff', boxShadow: '0 30px 70px rgba(20,40,90,0.14)', opacity: wrap, scale: String(interpolate(wrap, [0, 1], [1.3, 1])), padding: 60, boxSizing: 'border-box'}}>
						<svg viewBox="0 0 24 24" width="100%" height="100%" preserveAspectRatio="none" fill="none" stroke="rgba(0,113,227,0.35)" strokeWidth={0.25}>
							<path d="M0 0l12 10L24 0" />
						</svg>
					</div>
					<Rise at={at(5, 27.8)} dist={40}>
						<div style={{position: 'relative', background: e >= plain.length ? ACCENT : '#0c0f14', borderRadius: 26, padding: '30px 40px', display: 'flex', alignItems: 'center', gap: 24, scale: String(1 - wrap * 0.25), opacity: 1 - wrap * 0.15}}>
							<div style={{width: 56}}>{G.lock('#fff')}</div>
							<span style={{fontFamily: MONO, fontSize: 52, color: e >= plain.length ? '#fff' : '#39d98a', whiteSpace: 'pre'}}>{shown}</span>
						</div>
					</Rise>
					<div style={{position: 'absolute', right: 70, bottom: 50, width: 120, height: 120, borderRadius: 60, background: ACCENT, padding: 28, boxSizing: 'border-box', opacity: prog(f, at(5, 31.5), 12)}}>{G.lock('#fff')}</div>
				</div>
				<Pop at={at(5, 31.4)} style={{fontFamily: IT, fontSize: 58, fontWeight: 700, color: INK, textAlign: 'center'}}>
					как письмо в <span style={{color: ACCENT}}>непрозрачном конверте</span>
				</Pop>
			</Page>
			<Tick at={at(5, 29.6)} />
			<Tick at={at(5, 31.0)} />
		</Drift>
	);
};

/* 7 — step 3: envelope flies to server, server goes to the site */
const S7: React.FC = () => {
	const f = useCurrentFrame();
	const fly = interpolate(f, [at(6, 34.0), at(6, 35.6)], [0, 1], {...clamp, easing: INOUT});
	const open = prog(f, at(6, 36.15), 12);
	const go = interpolate(f, [at(6, 37.7), at(6, 38.9)], [0, 1], {...clamp, easing: INOUT});
	const ipAt = at(6, 39.5);
	const strike = prog(f, at(6, 41.2), 12);
	const Y = [0, 330, 660];
	const envY = Y[0] + 50 + (Y[1] - Y[0]) * fly;
	return (
		<Drift dur={DUR[6] + TR}>
			<AppleBg />
			<Page gap={30}>
				<div style={{textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20}}>
					<Step at={at(6, 33.4)} n={3} />
					<Lines at={at(6, 35.0)} size={90} weight={700} lines={['Через VPN-сервер']} />
				</div>
				<div style={{position: 'relative', width: 720, height: 830}}>
					<div style={{position: 'absolute', left: 0, top: Y[0]}}>
						<Node at={at(6, 33.5)} icon={G.phone(INK)} label="Телефон" size={150} />
					</div>
					<div style={{position: 'absolute', left: 0, top: Y[1]}}>
						<Node at={at(6, 34.9)} icon={G.server(ACCENT)} label="VPN-сервер" size={150} ring={ACCENT} />
					</div>
					<div style={{position: 'absolute', left: 0, top: Y[2]}}>
						<Node at={at(6, 37.7)} icon={G.globe(INK)} label="Сайт" size={150} />
					</div>
					{/* tunnel */}
					<div style={{position: 'absolute', left: 52, top: 160, width: 46, height: 160, borderRadius: 23, background: 'rgba(0,113,227,0.12)', boxShadow: 'inset 0 0 0 3px rgba(0,113,227,0.4)', opacity: prog(f, at(6, 33.9), 10)}} />
					<div style={{position: 'absolute', left: 72, top: 490, width: 6, height: 160 * go, borderRadius: 3, background: ACCENT}} />
					{/* envelope */}
					<div style={{position: 'absolute', left: 20, top: envY, width: 110, height: 80, opacity: f >= at(6, 33.9) ? 1 - open : 0, background: ACCENT, borderRadius: 14, padding: 14, boxSizing: 'border-box'}}>{G.mail('#fff')}</div>
					{/* site sees */}
					<Rise at={ipAt} dist={30} style={{position: 'absolute', left: 330, top: Y[2] - 10}}>
						<Card style={{padding: '22px 30px'}}>
							<div style={{fontFamily: IT, fontSize: 34, fontWeight: 500, color: GRAY}}>сайт видит</div>
							<div style={{fontFamily: IT, fontSize: 46, fontWeight: 700, color: ACCENT}}>IP сервера</div>
							<div style={{position: 'relative', fontFamily: IT, fontSize: 40, fontWeight: 600, color: strike > 0.5 ? '#aeaeb2' : INK, display: 'inline-block'}}>
								твой IP
								<div style={{position: 'absolute', left: 0, top: '52%', height: 5, width: `${strike * 100}%`, background: RED, borderRadius: 3}} />
							</div>
						</Card>
					</Rise>
				</div>
			</Page>
			<Tick at={at(6, 35.6)} />
			<Tick at={at(6, 36.15)} vol={0.1} />
			<Tick at={ipAt} />
			<Tick at={at(6, 41.2)} />
		</Drift>
	);
};

/* 8 — return trip + «доли секунды» */
const S8: React.FC = () => {
	const f = useCurrentFrame();
	const back = interpolate(f, [at(7, 42.2), at(7, 43.6)], [0, 1], {...clamp, easing: INOUT});
	const ms = Math.round(interpolate(f, [at(7, 45.5), at(7, 46.3)], [0, 80], clamp));
	return (
		<Drift dur={DUR[7] + TR}>
			<AppleBg />
			<Page gap={40}>
				<Lines at={at(7, 41.75)} size={96} weight={700} lines={['Ответ — обратно', 'в конверте']} colors={[INK, ACCENT]} stagger={at(7, 43.6) - at(7, 41.75)} />
				<div style={{position: 'relative', width: W, height: 200}}>
					<div style={{position: 'absolute', left: 40, top: 20, width: 150}}>{G.phone(INK)}</div>
					<div style={{position: 'absolute', right: 40, top: 20, width: 150}}>{G.server(ACCENT)}</div>
					<div style={{position: 'absolute', left: 230, right: 230, top: 80, height: 40, borderRadius: 20, background: 'rgba(0,113,227,0.1)', boxShadow: 'inset 0 0 0 3px rgba(0,113,227,0.4)'}} />
					<div style={{position: 'absolute', top: 64, left: 650 - 420 * back - 55, width: 110, height: 72, background: ACCENT, borderRadius: 12, padding: 12, boxSizing: 'border-box', opacity: back < 1 ? 1 : 0}}>{G.mail('#fff')}</div>
				</div>
				<Rise at={at(7, 44.4)} dist={40}>
					<div style={{fontFamily: IT, fontSize: 64, fontWeight: 700, color: SUB, textAlign: 'center'}}>и всё это за</div>
				</Rise>
				<Pop at={at(7, 45.5)} style={{fontFamily: IT, fontSize: 200, fontWeight: 700, color: INK, letterSpacing: -9, lineHeight: 1, fontVariantNumeric: 'tabular-nums'}}>
					0,{String(ms).padStart(3, '0')} с
				</Pop>
				<Pop at={at(7, 45.9)} style={{fontFamily: IT, fontSize: 56, fontWeight: 700, color: ACCENT}}>
					доли секунды
				</Pop>
			</Page>
			<Tick at={at(7, 43.6)} />
			<Tick at={at(7, 46.3)} vol={0.22} />
		</Drift>
	);
};

/* 9 — CTA */
const S9: React.FC = () => {
	const f = useCurrentFrame();
	const tapAt = at(8, 47.2);
	const tap = interpolate(f - tapAt, [0, 5, 14], [1, 0.93, 1], clamp);
	return (
		<Drift dur={DUR[8]}>
			<AppleBg />
			<Page gap={40}>
				<AppIcon size={200} at={0} float={false} />
				<Rise at={at(8, 46.6)} dist={30}>
					<div style={{scale: String(tap)}}>
						<BlackPill style={{fontSize: 64, fontWeight: 700, padding: '38px 90px', borderRadius: 90}}>Подписывайся</BlackPill>
					</div>
				</Rise>
				<div style={{textAlign: 'center', marginTop: 20}}>
					<Lines at={at(8, 47.5)} size={56} weight={600} lines={['Следующим разберём:']} color={GRAY} />
					<Lines at={at(8, 48.4)} size={86} weight={700} lines={['почему бесплатные VPN']} />
					<Lines at={at(8, 50.4)} size={86} weight={700} lines={['не бесплатные']} color={RED} />
				</div>
			</Page>
			<Tick at={tapAt} vol={0.22} />
		</Drift>
	);
};

const SCENES = [S1, S2, S3, S4, S5, S6, S7, S8, S9];

export const Inside: React.FC = () => (
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
		<Audio src={staticFile('inside/voice.mp3')} />
	</AbsoluteFill>
);
