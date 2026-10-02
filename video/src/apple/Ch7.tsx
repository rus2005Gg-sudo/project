import React from 'react';
import '@fontsource/jetbrains-mono/500.css';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {Img} from 'remotion';
import {LOGO, ACCENT, AppIcon, AppleBg, BlackPill, Card, Drift as KitDrift, Eyebrow, GRAY, HAIR, INK, INOUT, IT, Lines, Lockup, Rise, SUB, blurZoom, clamp, prog} from './kit';

export const C7_FPS = 30;
const VOICE = 26.88;
const TR = 14;
// scene starts (s), slightly ahead of the first word of each phrase (word times from ASR)
const STARTS = [0, 4.3, 9.25, 17.5, 22.85];
const fr = (s: number) => Math.round(s * C7_FPS);
export const CH7_FRAMES = fr(VOICE + 1.4);
const DUR = STARTS.map((s, i) => (i < STARTS.length - 1 ? fr(STARTS[i + 1]) : CH7_FRAMES) - fr(s));
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

const PINK = '#ff2d55';

const Goal: React.FC<{at: number; icon: string; n: number; label: string; color: string}> = ({at: a, icon, n, label, color}) => {
	const f = useCurrentFrame();
	const p = prog(f, a + 4, 30, INOUT);
	return (
		<Rise at={a} dist={50} dur={16}>
			<Card style={{width: W, padding: '34px 44px', boxSizing: 'border-box'}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 24}}>
					<span style={{fontSize: 76}}>{icon}</span>
					<span style={{fontFamily: IT, fontSize: 110, fontWeight: 700, color: INK, letterSpacing: -4, lineHeight: 1, fontVariantNumeric: 'tabular-nums'}}>{n}</span>
					<span style={{fontFamily: IT, fontSize: 52, fontWeight: 700, color: SUB}}>{label}</span>
					<span style={{marginLeft: 'auto', fontFamily: IT, fontSize: 34, fontWeight: 700, color, border: `3px solid ${color}`, padding: '4px 16px', borderRadius: 20}}>цель</span>
				</div>
				<div style={{height: 16, borderRadius: 8, background: '#eee', marginTop: 22, overflow: 'hidden'}}>
					<div style={{width: `${p * 100}%`, height: '100%', borderRadius: 8, background: `repeating-linear-gradient(90deg, ${color} 0 18px, transparent 18px 30px)`, opacity: 0.5}} />
				</div>
			</Card>
		</Rise>
	);
};

/* 1 — CHALLENGE + goals */
const S1: React.FC = () => (
	<Drift dur={DUR[0] + TR}>
		<AppleBg glow="255,45,85" />
		<Page gap={34}>
			<Pop at={0} style={{fontFamily: IT, fontSize: 150, fontWeight: 700, color: '#fff', background: PINK, padding: '14px 50px', borderRadius: 40, letterSpacing: -5}}>
				ЧЕЛЛЕНДЖ
			</Pop>
			<Lines at={at(0, 0.6)} size={56} weight={700} lines={['если этот ролик наберёт']} color={SUB} />
			<Goal at={at(0, 1.75)} icon="❤️" n={500} label="лайков" color={PINK} />
			<Lines at={at(0, 2.6)} size={56} weight={700} lines={['а наш аккаунт']} color={SUB} />
			<Goal at={at(0, 3.3)} icon="👥" n={1000} label="подписчиков" color={ACCENT} />
		</Page>
		<Tick at={0} vol={0.24} />
		<Tick at={at(0, 1.75)} />
		<Tick at={at(0, 3.3)} />
	</Drift>
);

/* 2 — prize: all tariffs free & unlimited for 7 days */
const S2: React.FC = () => (
	<Drift dur={DUR[1] + TR}>
		<AppleBg />
		<Page gap={26}>
			<AppIcon size={200} at={at(1, 4.4)} />
			<Lines at={at(1, 4.9)} size={84} weight={700} lines={['все тарифы Horz VPN']} />
			<div style={{display: 'flex', gap: 22}}>
				<Pop at={at(1, 6.45)} style={{fontFamily: IT, fontSize: 64, fontWeight: 700, color: '#fff', background: GREEN, padding: '16px 36px', borderRadius: 30}}>
					бесплатно
				</Pop>
				<Pop at={at(1, 7.25)} style={{fontFamily: IT, fontSize: 64, fontWeight: 700, color: '#fff', background: ACCENT, padding: '16px 36px', borderRadius: 30}}>
					безлимитно
				</Pop>
			</div>
			<div style={{display: 'flex', alignItems: 'baseline', gap: 24, marginTop: 10}}>
				<Pop at={at(1, 8.5)} style={{fontFamily: IT, fontSize: 300, fontWeight: 700, color: INK, letterSpacing: -14, lineHeight: 1}}>
					7
				</Pop>
				<Pop at={at(1, 8.8)} style={{fontFamily: IT, fontSize: 120, fontWeight: 700, color: INK}}>
					дней
				</Pop>
			</div>
		</Page>
		<Tick at={at(1, 6.45)} />
		<Tick at={at(1, 7.25)} />
		<Tick at={at(1, 8.5)} vol={0.26} />
	</Drift>
);

/* 3 — three things to do */
const S3: React.FC = () => {
	const f = useCurrentFrame();
	const steps: [string, string, React.ReactNode, number, number][] = [
		['1', '❤️', 'Поставь лайк этому видео', at(2, 11.4), at(2, 13.45)],
		['2', '➕', 'Подпишись на наш TikTok', at(2, 13.45), at(2, 15.55)],
		['3', '✈️', <>Подпишись на Telegram-канал</>, at(2, 15.55), 9999],
	];
	return (
		<Drift dur={DUR[2] + TR}>
			<AppleBg />
			<Page gap={26}>
				<Lines at={at(2, 9.3)} size={84} weight={700} lines={['Что нужно от тебя?']} />
				<div style={{display: 'flex', alignItems: 'baseline', gap: 18}}>
					<Pop at={at(2, 10.6)} style={{fontFamily: IT, fontSize: 160, fontWeight: 700, color: ACCENT, letterSpacing: -6, lineHeight: 1}}>
						3
					</Pop>
					<Lines at={at(2, 10.85)} size={80} weight={700} lines={['вещи']} />
				</div>
				{steps.map(([n, ic, t, a, end]) => {
					const k = f >= a && f < end ? prog(f, a, 10) : f >= end ? 1 - prog(f, end, 10) * 0.7 : 0;
					return (
						<Rise key={n} at={a} dist={40} dur={14}>
							<Card style={{width: W, padding: '30px 40px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 26, scale: String(1 + k * 0.03), boxShadow: `0 24px 60px rgba(20,40,90,0.10), 0 0 0 ${k * 4}px rgba(0,113,227,${k})`}}>
								<div style={{width: 80, height: 80, borderRadius: 40, background: k > 0.5 ? ACCENT : INK, color: '#fff', fontFamily: IT, fontSize: 40, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{n}</div>
								<span style={{fontSize: 46}}>{ic}</span>
								<div style={{fontFamily: IT, fontSize: 42, fontWeight: 700, color: INK, whiteSpace: 'nowrap'}}>{t}</div>
							</Card>
						</Rise>
					);
				})}
			</Page>
			{steps.map(([n, , , a]) => (
				<Tick key={n} at={a} />
			))}
		</Drift>
	);
};

/* 4 — Telegram channel: link in profile */
const S4: React.FC = () => {
	const f = useCurrentFrame();
	const linkAt = at(3, 18.5);
	const hl = prog(f, linkAt, 12);
	const tap = interpolate(f - linkAt, [0, 5, 14], [1, 0.94, 1], clamp);
	const PW = 760;
	const k = PW / 828;
	return (
		<Drift dur={DUR[3] + TR}>
			<AppleBg />
			<Page gap={34}>
				<Lines at={at(3, 17.55)} size={80} weight={700} lines={['Telegram-канал']} colors={[ACCENT]} />
				<Rise at={at(3, 17.6)} dist={40}>
					<div style={{position: 'relative', width: PW, borderRadius: 36, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.3)'}}>
						<Img src={staticFile('ch7/channel.png')} style={{width: '100%', display: 'block'}} />
						<div style={{position: 'absolute', left: 34 * k, top: 608 * k, width: 760 * k, height: 136 * k, borderRadius: 30, border: `6px solid ${ACCENT}`, background: `rgba(0,113,227,${hl * 0.15})`, opacity: hl, scale: String(tap * interpolate(hl, [0, 1], [1.2, 1]))}} />
					</div>
				</Rise>
				<Pop at={at(3, 18.5)} style={{fontFamily: IT, fontSize: 60, fontWeight: 700, color: '#fff', background: INK, padding: '20px 46px', borderRadius: 50}}>
					Ссылка в профиле 👆
				</Pop>
				<Lines at={at(3, 20.1)} size={52} weight={700} lines={['там объявим старт']} color={SUB} />
			</Page>
			<Tick at={linkAt} vol={0.22} />
		</Drift>
	);
};

/* 5 — share + go */
const S5: React.FC = () => {
	const f = useCurrentFrame();
	const fly = prog(f, at(4, 23.0), 30, INOUT);
	return (
		<Drift dur={DUR[4]}>
			<AppleBg glow="255,45,85" />
			<Page gap={40}>
				<div style={{fontSize: 200, translate: `${fly * 200}px ${-fly * 120}px`, rotate: `${fly * 15}deg`, opacity: 1 - fly * 0.3}}>✈️</div>
				<Lines at={at(4, 22.95)} size={100} weight={700} lines={['Отправь другу']} />
				<Lines at={at(4, 24.2)} size={60} weight={700} lines={['так дойдём до цели быстрее']} color={SUB} />
				<Pop at={at(4, 26.05)} style={{fontFamily: IT, fontSize: 140, fontWeight: 700, color: '#fff', background: PINK, padding: '20px 70px', borderRadius: 60, letterSpacing: -4}}>
					Погнали!
				</Pop>
			</Page>
			<Tick at={at(4, 23.0)} />
			<Tick at={at(4, 26.05)} vol={0.26} />
		</Drift>
	);
};

const SCENES = [S1, S2, S3, S4, S5];

export const Ch7: React.FC = () => (
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
		<Audio src={staticFile('ch7/voice.mp3')} />
	</AbsoluteFill>
);
