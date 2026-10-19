import React, {useEffect, useState} from 'react';
import '@fontsource/jetbrains-mono/500.css';
import {AbsoluteFill, Audio, Sequence, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {fitText} from '@remotion/layout-utils';
import {clamp} from './kit';
import {HZ, HZ_BG, HZ_BLUE, HZ_INK, HZ_SUB, Wordmark} from './brand';
import {ICONS} from './BotWelcome';

/**
 * «Как работает шифрование» v2 — one message travels through the whole film:
 * read by everyone → postcard → encrypted → keys → brute force → Horz VPN.
 * Kinetic word-by-word captions (masked slide-up) synced to the voice.
 */
export const ENC2_FPS = 30;
const FPS = ENC2_FPS;
const VOICE = 39.71;
export const ENC2_FRAMES = Math.round((VOICE + 1.3) * FPS);
const TR = 10;
const STARTS = [0, 7.15, 14.2, 21.05, 23.75, 30.75, 36.35];
const fr = (s: number) => Math.round(s * FPS);
const DUR = STARTS.map((s, i) => (i < STARTS.length - 1 ? fr(STARTS[i + 1]) : ENC2_FRAMES) - fr(s));
const at = (i: number, t: number) => fr(t) - fr(STARTS[i]);

const BLUE = HZ_BLUE;
const INK = HZ_INK;
const RED = '#ff3b30';
const NAVY = '#0b1430';
const MONO = '"JetBrains Mono", monospace';
const CARD: React.CSSProperties = {background: '#fff', boxShadow: '0 24px 60px rgba(20,30,60,0.14)'};

const rnd = (n: number) => {
	const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
	return x - Math.floor(x);
};
const sp = (f: number, a: number, damping = 13, stiffness = 170) => spring({frame: f - a, fps: FPS, config: {damping, stiffness}});
const lin = (f: number, a: number, b: number, from = 0, to = 1) => interpolate(f, [a, b], [from, to], clamp);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/* ---------------- icons (stroke, 24 grid) ---------------- */
const Ico: React.FC<{size: number; color: string; children: React.ReactNode; sw?: number}> = ({size, color, children, sw = 1.8}) => (
	<svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
		{children}
	</svg>
);
const I = {
	wifi: (s: number, c: string) => (
		<Ico size={s} color={c}>
			<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.3a9.5 9.5 0 0 1 13 0M8.6 15.6a5 5 0 0 1 6.8 0" />
			<circle cx="12" cy="19" r="1.2" fill={c} />
		</Ico>
	),
	isp: (s: number, c: string) => (
		<Ico size={s} color={c}>
			<rect x="4" y="3" width="16" height="18" rx="2" />
			<path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10.5 21v-3h3v3" />
		</Ico>
	),
	hacker: (s: number, c: string) => (
		<Ico size={s} color={c}>
			<path d="M12 2.5c-4.4 0-7.5 3.6-7.5 8.3V21h15V10.8c0-4.7-3.1-8.3-7.5-8.3z" />
			<path d="M8.2 11.6c0-2.2 1.7-3.7 3.8-3.7s3.8 1.5 3.8 3.7-1.7 4.3-3.8 4.3-3.8-2.1-3.8-4.3z" fill={c} />
		</Ico>
	),
	phone: (s: number, c: string) => (
		<Ico size={s} color={c}>
			<rect x="6.5" y="2.5" width="11" height="19" rx="2.8" />
			<path d="M10.5 18.5h3" />
		</Ico>
	),
	server: (s: number, c: string) => (
		<Ico size={s} color={c}>
			<rect x="4" y="3.5" width="16" height="7" rx="2" />
			<rect x="4" y="13.5" width="16" height="7" rx="2" />
			<path d="M8 7h.01M8 17h.01M12 7h4M12 17h4" />
		</Ico>
	),
	lock: (s: number, c: string, sw = 2) => (
		<Ico size={s} color={c} sw={sw}>
			<rect x="5" y="10.5" width="14" height="10" rx="2.5" />
			<path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
			<path d="M12 14.5v2.5" />
		</Ico>
	),
	key: (s: number, c: string) => (
		<Ico size={s} color={c} sw={2}>
			<circle cx="7.5" cy="12" r="4" />
			<path d="M11.5 12H21M17.5 12v3M20.5 12v2" />
		</Ico>
	),
	chip: (s: number, c: string) => (
		<Ico size={s} color={c}>
			<rect x="6" y="6" width="12" height="12" rx="2" />
			<path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
			<rect x="9.5" y="9.5" width="5" height="5" rx="1" fill={c} />
		</Ico>
	),
};

/** eye that opens (open 0..1) */
const Eye: React.FC<{size: number; open: number; color?: string}> = ({size, open, color = RED}) => (
	<svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
		<path d={`M2 12s3.6-${7 * open} 10-${7 * open} 10 ${7 * open} 10 ${7 * open}-3.6 ${7 * open}-10 ${7 * open}S2 12 2 12z`} />
		{open > 0.3 ? <circle cx="12" cy="12" r={3.2 * open} fill={color} /> : null}
	</svg>
);

/* ---------------- kinetic captions ---------------- */
type Tok = [string, number, ('r' | 'b')?];
type CapPage = {from: number; to: number; lines: Tok[][]};
const PAGES: CapPage[] = [
	{from: 0, to: 3.55, lines: [[['Прямо', -0.2], ['сейчас', 0.3]], [['твоё', 0.84], ['сообщение', 1.2]], [['может', 1.78], ['прочитать', 2.05]], [['кто', 2.62, 'r'], ['угодно', 2.9, 'r']]]},
	{from: 7.2, to: 10.4, lines: [[['Без', 7.2], ['шифрования', 7.6]], [['данные', 8.4], ['летят', 8.84]], [['открытым', 9.24, 'r'], ['текстом', 9.8, 'r']]]},
	{from: 10.45, to: 14.15, lines: [[['как', 10.45], ['открытка:', 10.69]], [['каждый', 11.4], ['видит,', 12.9]], [['что', 13.35], ['внутри', 13.55, 'r']]]},
	{from: 14.25, to: 17.25, lines: [[['Шифрование', 14.27, 'b']], [['превращает', 15.12]], [['текст…', 15.6]]]},
	{from: 17.3, to: 19.3, lines: [[['вот', 17.32], ['в', 17.55], ['это', 17.71, 'b']], [['набор', 18.1], ['символов', 18.67]]]},
	{from: 19.35, to: 21.0, lines: [[['без', 19.62], ['ключа', 19.82]], [['не', 20.22], ['прочитать', 20.38, 'b']]]},
	{from: 21.1, to: 23.7, lines: [[['ключ', 21.22, 'b'], ['есть', 21.66], ['только', 21.98]], [['у', 22.3], ['тебя', 22.5]], [['и', 22.86], ['у', 23.03], ['сервера', 23.22]]]},
	{from: 23.8, to: 27.25, lines: [[['подобрать', 24.24]], [['перебором?', 25.0]], [['даже', 25.64], ['суперкомпьютеру', 25.88]]]},
	{from: 27.3, to: 28.3, lines: [[['нужны', 26.96], ['миллиарды', 27.33, 'r']], [['лет', 28.04, 'r']]]},
	{from: 28.36, to: 30.7, lines: [[['дольше,', 28.36], ['чем', 29.04]], [['существует', 29.23]], [['Вселенная', 29.95, 'b']]]},
	{from: 30.85, to: 32.4, lines: [[['Кстати', 30.87]]]},
	{from: 32.45, to: 34.05, lines: [[['шифрует', 32.47], ['весь', 32.99]], [['твой', 33.32], ['трафик', 33.59, 'b']]]},
	{from: 34.07, to: 36.35, lines: [[['а', 34.07], ['не', 34.15], ['одно', 34.32]], [['приложение', 34.59]]]},
	{from: 37.4, to: 40.9, lines: [[['дальше:', 37.42], ['как', 38.38]], [['работают', 38.62], ['ключи', 39.14, 'b']]]},
];
const CAP_MAX = 92;
const CAP_W = 900;

const Captions: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const page = PAGES.find((p) => t >= p.from - 0.15 && t < p.to + 0.2);
	if (!page) return null;
	const outP = lin(f, fr(page.to) - 4, fr(page.to) + 4);
	return (
		<div style={{position: 'absolute', left: 90, right: 90, top: 300, height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
			{page.lines.map((line, li) => {
				const text = line.map((w) => w[0]).join(' ');
				const size = Math.min(CAP_MAX, Math.floor(fitText({text, withinWidth: CAP_W, fontFamily: 'Montserrat', fontWeight: 900}).fontSize * 0.96));
				return (
					<div key={li} style={{display: 'flex', gap: size * 0.26, justifyContent: 'center', whiteSpace: 'nowrap'}}>
						{line.map(([w, wt, c], wi) => {
							const a = fr(wt) - 3;
							const p = spring({frame: f - a, fps: FPS, config: {damping: 16, stiffness: 210}});
							const exit = outP > 0 ? lin(outP, (li * 0.12 + wi * 0.05) / 1.5, 1) : 0;
							const color = c === 'r' ? RED : c === 'b' ? BLUE : INK;
							return (
								<span key={wi} style={{display: 'inline-block', overflow: 'hidden', paddingBottom: size * 0.1, marginBottom: -size * 0.06}}>
									<span style={{display: 'inline-block', fontFamily: HZ, fontWeight: 900, fontSize: size, lineHeight: 1.08, letterSpacing: -size * 0.035, color, translate: `0 ${(1 - p) * 110 - exit * 110}%`}}>{w}</span>
								</span>
							);
						})}
					</div>
				);
			})}
		</div>
	);
};

/* ---------------- whip-pan transition (directional blur) ---------------- */
const WhipComp: React.FC<TransitionPresentationComponentProps<Record<string, never>>> = ({children, presentationDirection, presentationProgress}) => {
	const p = easeOut(presentationProgress);
	const exiting = presentationDirection === 'exiting';
	const x = exiting ? -p * 1080 : (1 - p) * 1080;
	const blur = Math.sin(presentationProgress * Math.PI) * 40;
	const id = `whip-${presentationDirection}`;
	return (
		<AbsoluteFill style={{translate: `${x}px 0`, filter: blur > 0.5 ? `url(#${id})` : undefined}}>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id={id} x="-20%" y="0" width="140%" height="100%">
					<feGaussianBlur stdDeviation={`${blur.toFixed(1)} 0`} />
				</filter>
			</svg>
			{children}
		</AbsoluteFill>
	);
};
const whip = (): TransitionPresentation<Record<string, never>> => ({component: WhipComp, props: {}});

const Tick: React.FC<{at: number; vol?: number}> = ({at: a, vol = 0.18}) => (
	<Sequence from={Math.max(0, a)} layout="none">
		<Audio src={staticFile('sfx/tick-001.mp3')} volume={vol} />
	</Sequence>
);

const Stage: React.FC<{children: React.ReactNode; push?: number}> = ({children, push = 0.04}) => {
	const f = useCurrentFrame();
	return <AbsoluteFill style={{scale: String(1 + f * (push / 200))}}>{children}</AbsoluteFill>;
};

const Node: React.FC<{x: number; y: number; icon: React.ReactNode; label: string; p: number; color?: string}> = ({x, y, icon, label, p, color = RED}) => (
	<div style={{position: 'absolute', left: x - 110, top: y - 110, width: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, scale: String(p), opacity: Math.min(1, p * 2)}}>
		<div style={{...CARD, width: 200, height: 200, borderRadius: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `5px solid ${color}`}}>{icon}</div>
		<div style={{fontFamily: HZ, fontWeight: 800, fontSize: 36, color: INK, whiteSpace: 'nowrap', background: '#fff', padding: '8px 22px', borderRadius: 30, boxShadow: '0 10px 24px rgba(20,30,60,0.10)'}}>{label}</div>
	</div>
);

/** message bubble; `cipher` 0..1 sweeps the text into shuffling glyphs */
const GLYPHS = '#$%&@*+=?!<>/{}[]0123456789ABCDEF§¥ЖΣΩ';
const Bubble: React.FC<{text: string; cipher?: number; f: number; size?: number; style?: React.CSSProperties}> = ({text, cipher = 0, f, size = 54, style}) => {
	const n = text.length;
	return (
		<div style={{position: 'relative', background: cipher > 0.5 ? NAVY : 'linear-gradient(180deg,#2a8cff,#1f6fe0)', color: '#fff', fontFamily: cipher > 0 ? MONO : HZ, fontWeight: cipher > 0 ? 500 : 700, fontSize: size, padding: '30px 44px', borderRadius: '46px 46px 14px 46px', boxShadow: cipher > 0.5 ? `0 0 0 4px ${BLUE}, 0 30px 70px rgba(10,77,255,0.35)` : '0 30px 70px rgba(31,111,224,0.4)', whiteSpace: 'nowrap', ...style}}>
			{text.split('').map((ch, i) => {
				const done = cipher * (n + 4) - i > 0;
				if (!done || ch === ' ') return <span key={i}>{ch}</span>;
				return (
					<span key={i} style={{color: '#8fb0ff'}}>
						{GLYPHS[Math.floor(rnd(i * 31 + Math.floor(f / 2)) * GLYPHS.length)]}
					</span>
				);
			})}
		</div>
	);
};

/* ================= scenes ================= */

/* A — hook: message read by anyone; Wi-Fi, ISP, hacker */
const SA: React.FC = () => {
	const f = useCurrentFrame();
	const hit = fr(2.62);
	const shake = f >= hit && f < hit + 10 ? Math.sin((f - hit) * 2.6) * interpolate(f - hit, [0, 10], [14, 0]) : 0;
	const redPulse = lin(f, hit, hit + 3) * (1 - lin(f, hit + 3, hit + 18));
	const nodes: {x: number; y: number; t: number; icon: (s: number, c: string) => React.ReactNode; label: string}[] = [
		{x: 230, y: 860, t: 3.66, icon: I.wifi, label: 'Wi-Fi в кафе'},
		{x: 850, y: 860, t: 4.94, icon: I.isp, label: 'Провайдер'},
		{x: 540, y: 1335, t: 5.82, icon: I.hacker, label: 'Хакер в сети'},
	];
	const B = {x: 540, y: 1100};
	return (
		<AbsoluteFill>
			<Stage>
				<AbsoluteFill style={{background: `radial-gradient(ellipse 80% 55% at 50% 58%, rgba(255,59,48,${0.05 + redPulse * 0.25}), rgba(255,59,48,0) 70%)`}} />
				<AbsoluteFill style={{translate: `${shake}px 0`}}>
					<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
						{nodes.map((n) => {
							const len = Math.hypot(n.x - B.x, n.y - B.y);
							const d = lin(f, fr(n.t), fr(n.t) + 9);
							return <line key={n.label} x1={n.x} y1={n.y} x2={B.x} y2={B.y} stroke={RED} strokeWidth={6} strokeDasharray={`${len * d} ${len}`} opacity={0.75} />;
						})}
						{nodes.map((n) => {
							const flowOn = f > fr(n.t) + 9;
							return flowOn ? <line key={n.label + 'f'} x1={B.x} y1={B.y} x2={n.x} y2={n.y} stroke={RED} strokeWidth={6} strokeDasharray="10 34" strokeDashoffset={-f * 4} /> : null;
						})}
					</svg>
					{/* the message */}
					<div style={{position: 'absolute', left: 0, right: 0, top: B.y - 70, display: 'flex', justifyContent: 'center', scale: String(0.85 + 0.15 * sp(f, -6)), translate: `0 ${Math.sin(f / 14) * 6}px`}}>
						<Bubble f={f} text="Мой пароль: qwerty123" style={{boxShadow: redPulse > 0 ? `0 0 0 ${8 * redPulse}px rgba(255,59,48,0.5), 0 30px 70px rgba(31,111,224,0.4)` : undefined}} />
					</div>
					{nodes.map((n) => (
						<Node key={n.label} x={n.x} y={n.y} icon={n.icon(110, RED)} label={n.label} p={sp(f, fr(n.t) - 2, 11)} />
					))}
					{/* copies of the password flying to each node */}
					{nodes.map((n) => {
						const k = lin(f, fr(n.t) + 8, fr(n.t) + 22);
						if (k <= 0 || k >= 1) return null;
						return <div key={n.label + 'c'} style={{position: 'absolute', left: B.x + (n.x - B.x) * easeOut(k) - 90, top: B.y + (n.y - B.y) * easeOut(k) - 24, fontFamily: MONO, fontSize: 30, color: '#fff', background: RED, padding: '6px 14px', borderRadius: 12, opacity: 1 - k * 0.3}}>qwerty123</div>;
					})}
				</AbsoluteFill>
			</Stage>
			<Tick at={0} vol={0.14} />
			<Tick at={hit} vol={0.28} />
			{nodes.map((n) => (
				<Tick key={n.label} at={fr(n.t) - 2} />
			))}
		</AbsoluteFill>
	);
};

/* B — plain text travels like a postcard; every hop sees it */
const SB: React.FC = () => {
	const f = useCurrentFrame();
	const s = 1;
	const travel = lin(f, at(s, 7.7), at(s, 13.2));
	const y = interpolate(easeOut(travel), [0, 1], [1360, 790]);
	const flip = lin(f, at(s, 10.4), at(s, 10.95));
	const stamp = sp(f, at(s, 13.5), 9);
	const hops = [1240, 1070, 900];
	return (
		<AbsoluteFill>
			<Stage>
				<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
					<line x1={540} y1={1440} x2={540} y2={700} stroke="#c9cfdb" strokeWidth={8} strokeDasharray="4 22" strokeLinecap="round" />
				</svg>
				<div style={{position: 'absolute', left: 540 - 70, top: 1470 - 70, width: 140, height: 140, ...CARD, borderRadius: 40, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{I.phone(84, INK)}</div>
				<div style={{position: 'absolute', left: 540 - 70, top: 640 - 70, width: 140, height: 140, ...CARD, borderRadius: 40, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{I.server(84, INK)}</div>
				{hops.map((hy, i) => {
					const left = i % 2 === 0;
					const seen = y < hy + 40;
					const open = seen ? sp(f, Math.round(at(s, 7.7) + (5.5 * (1360 - hy)) / 570 * FPS * 0.55), 12) : 0.08;
					return (
						<div key={hy} style={{position: 'absolute', left: left ? 120 : 820, top: hy - 70, width: 140, height: 140, ...CARD, borderRadius: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `5px solid ${seen ? RED : '#e3e6ee'}`}}>
							<Eye size={96} open={Math.max(0.08, open)} />
						</div>
					);
				})}
				{/* packet / postcard */}
				<div style={{position: 'absolute', left: 0, right: 0, top: y - 110, display: 'flex', justifyContent: 'center', perspective: 1400}}>
					<div style={{width: 560, height: 220, position: 'relative', rotate: `0 1 0 ${flip * 180}deg`, transformStyle: 'preserve-3d'}}>
						<div style={{position: 'absolute', inset: 0, ...CARD, borderRadius: 28, padding: '26px 32px', backfaceVisibility: 'hidden', fontFamily: MONO, fontSize: 36, color: INK, lineHeight: 1.45}}>
							<div style={{fontFamily: HZ, fontWeight: 800, fontSize: 24, color: '#8b93a7', letterSpacing: 3}}>ДАННЫЕ · ОТКРЫТО</div>
							логин: ivan@mail.ru
							<br />
							пароль: qwerty123
						</div>
						<div style={{position: 'absolute', inset: 0, borderRadius: 18, background: '#f3ead7', padding: '24px 30px', backfaceVisibility: 'hidden', rotate: '0 1 0 180deg', fontFamily: MONO, fontSize: 36, color: '#1c1a16', lineHeight: 1.45, boxShadow: '0 30px 70px rgba(20,30,60,0.22)'}}>
							<div style={{position: 'absolute', right: 24, top: 22, width: 76, height: 92, border: '4px dashed #b9a988', borderRadius: 8}} />
							<div style={{fontFamily: HZ, fontWeight: 800, fontSize: 24, color: '#7a6a4c', letterSpacing: 3}}>ОТКРЫТКА</div>
							логин: ivan@mail.ru
							<br />
							пароль: qwerty123
						</div>
						<div style={{position: 'absolute', right: -40, top: -30, fontFamily: HZ, fontWeight: 900, fontSize: 52, color: RED, border: `7px solid ${RED}`, borderRadius: 16, padding: '6px 20px', rotate: '-12deg', scale: String(interpolate(stamp, [0, 1], [2.4, 1])), opacity: Math.min(1, stamp * 2), background: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap'}}>ВИДНО ВСЕМ</div>
					</div>
				</div>
			</Stage>
			<Tick at={at(s, 10.4)} />
			<Tick at={at(s, 13.5)} vol={0.3} />
		</AbsoluteFill>
	);
};

/* C — encryption: the text sweeps into cipher; eyes can't read it */
const SC: React.FC = () => {
	const f = useCurrentFrame();
	const s = 2;
	const bubbleIn = sp(f, at(s, 15.8), 12);
	const cipher = lin(f, at(s, 17.3), at(s, 18.1));
	const lockIn = sp(f, at(s, 17.95), 9);
	const hexRows = ['4F 2A 9C E1 07 B3 5D 88', 'C4 19 7E A2 3F 60 D9 0B', '91 E8 56 2C B7 4A F3 1D'];
	return (
		<AbsoluteFill>
			<Stage>
				<AbsoluteFill style={{background: `radial-gradient(ellipse 70% 40% at 50% 60%, rgba(10,77,255,${0.06 + cipher * 0.12}), rgba(10,77,255,0) 70%)`}} />
				{/* big lock behind */}
				<div style={{position: 'absolute', left: 0, right: 0, top: 760, display: 'flex', justifyContent: 'center', opacity: lin(f, 0, 10) * (1 - lin(f, at(s, 15.6), at(s, 15.9)) * 0.85), scale: String(0.8 + sp(f, 0) * 0.2)}}>
					{I.lock(260, BLUE, 1.6)}
				</div>
				<div style={{position: 'absolute', left: 0, right: 0, top: 1040, display: 'flex', justifyContent: 'center', scale: String(bubbleIn), opacity: Math.min(1, bubbleIn * 2)}}>
					<div style={{position: 'relative'}}>
						<Bubble f={f} text="Привет, это мой пароль" cipher={cipher} size={50} />
						{/* scan bar */}
						{cipher > 0 && cipher < 1 ? <div style={{position: 'absolute', top: -14, bottom: -14, width: 10, left: `${cipher * 100}%`, background: BLUE, boxShadow: `0 0 30px ${BLUE}`, borderRadius: 5}} /> : null}
						<div style={{position: 'absolute', right: -34, top: -44, width: 96, height: 96, borderRadius: 48, background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', scale: String(lockIn), boxShadow: '0 12px 30px rgba(10,77,255,0.5)'}}>{I.lock(56, '#fff')}</div>
					</div>
				</div>
				{/* cipher stream */}
				<div style={{position: 'absolute', left: 0, right: 0, top: 1240, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
					{hexRows.map((r, i) => {
						const k = lin(f, at(s, 18.1) + i * 5, at(s, 18.1) + i * 5 + 14);
						const shown = Math.floor(k * r.length);
						return (
							<div key={i} style={{fontFamily: MONO, fontSize: 44, color: '#9fb3e0', letterSpacing: 2, whiteSpace: 'pre'}}>
								{r.slice(0, shown)}
							</div>
						);
					})}
				</div>
				{/* eyes fail */}
				<div style={{position: 'absolute', left: 0, right: 0, top: 1470, display: 'flex', justifyContent: 'center', gap: 70}}>
					{[0, 1, 2].map((i) => {
						const a = at(s, 19.6) + i * 4;
						const p = sp(f, a, 11);
						const shut = lin(f, a + 14, a + 20);
						return (
							<div key={i} style={{position: 'relative', scale: String(p), opacity: Math.min(1, p * 2)}}>
								<div style={{...CARD, width: 150, height: 150, borderRadius: 75, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
									<Eye size={96} open={1 - shut * 0.92} color={shut > 0.5 ? '#aab1c2' : RED} />
								</div>
								<div style={{position: 'absolute', right: -6, top: -6, width: 54, height: 54, borderRadius: 27, background: INK, color: '#fff', fontFamily: HZ, fontWeight: 900, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', scale: String(sp(f, a + 16, 10))}}>?</div>
							</div>
						);
					})}
				</div>
			</Stage>
			<Tick at={at(s, 15.8)} />
			<Tick at={at(s, 17.3)} vol={0.22} />
			<Tick at={at(s, 17.95)} vol={0.26} />
		</AbsoluteFill>
	);
};

/* D — keys: only you and the server */
const SD: React.FC = () => {
	const f = useCurrentFrame();
	const s = 3;
	const ends = [
		{x: 260, icon: I.phone, label: 'у тебя', t: 22.5},
		{x: 820, icon: I.server, label: 'у сервера', t: 23.2},
	];
	return (
		<AbsoluteFill>
			<Stage>
				<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
					<line x1={260} y1={1080} x2={820} y2={1080} stroke={BLUE} strokeOpacity={0.18} strokeWidth={70} strokeLinecap="round" />
				</svg>
				{/* encrypted packets in the tunnel */}
				{Array.from({length: 4}).map((_, i) => {
					const k = ((f / 40 + i / 4) % 1);
					return (
						<div key={i} style={{position: 'absolute', left: 300 + k * 480 - 34, top: 1080 - 22, width: 68, height: 44, borderRadius: 14, background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: Math.sin(k * Math.PI)}}>
							{I.lock(26, '#8fb0ff')}
						</div>
					);
				})}
				{ends.map((e) => {
					const p = sp(f, 2, 12);
					const kIn = sp(f, at(s, e.t) - 6, 10);
					return (
						<div key={e.label} style={{position: 'absolute', left: e.x - 120, top: 1080 - 120, width: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, scale: String(p)}}>
							<div style={{...CARD, width: 240, height: 240, borderRadius: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', border: `5px solid ${kIn > 0.5 ? BLUE : '#e3e6ee'}`}}>
								{e.icon(130, INK)}
								<div style={{position: 'absolute', right: -30, top: -30, width: 100, height: 100, borderRadius: 50, background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 14px 30px rgba(10,77,255,0.45)', scale: String(kIn), rotate: `${(1 - kIn) * -120}deg`, translate: `0 ${(1 - kIn) * -200}px`}}>
									{I.key(60, '#fff')}
								</div>
							</div>
						</div>
					);
				})}
			</Stage>
			<Tick at={at(s, 22.5) - 3} />
			<Tick at={at(s, 23.2) - 3} />
		</AbsoluteFill>
	);
};

/* E — brute force: attempts, billions of years, longer than the universe */
const SE: React.FC = () => {
	const f = useCurrentFrame();
	const s = 4;
	const tries = Math.floor(interpolate(f, [at(s, 24.2), at(s, 27.3)], [0, 9.9e11], {...clamp, easing: (x) => x * x * x}));
	const triesTxt = tries.toLocaleString('ru-RU');
	const keyGuess = Array.from({length: 16}).map((_, i) => '0123456789ABCDEF'[Math.floor(rnd(i * 7 + f) * 16)]).join('');
	const bigOn = f >= at(s, 27.3);
	const big = '1 000 000 000+';
	const bigSize = Math.min(190, Math.floor(fitText({text: big, withinWidth: 860, fontFamily: 'Montserrat', fontWeight: 900}).fontSize * 0.95));
	const bars = lin(f, at(s, 28.4), at(s, 30.3));
	const showBars = f >= at(s, 28.36);
	return (
		<AbsoluteFill>
			<Stage>
				{!showBars ? (
					<div style={{position: 'absolute', left: 0, right: 0, top: 760, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34}}>
						<div style={{...CARD, width: 860, borderRadius: 40, padding: '34px 40px', display: 'flex', alignItems: 'center', gap: 30, opacity: lin(f, 0, 8)}}>
							<div style={{width: 130, height: 130, borderRadius: 34, background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{I.chip(86, '#8fb0ff')}</div>
							<div style={{minWidth: 0}}>
								<div style={{fontFamily: MONO, fontSize: 40, color: INK, whiteSpace: 'nowrap'}}>
									{keyGuess} <span style={{color: RED}}>✕</span>
								</div>
								<div style={{fontFamily: HZ, fontWeight: 700, fontSize: 30, color: HZ_SUB, marginTop: 8, whiteSpace: 'nowrap'}}>попыток: {triesTxt}</div>
							</div>
						</div>
						{bigOn ? (
							<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', scale: String(interpolate(sp(f, at(s, 27.3), 10), [0, 1], [1.5, 1])), opacity: lin(f, at(s, 27.3), at(s, 27.3) + 4)}}>
								<div style={{fontFamily: HZ, fontWeight: 900, fontSize: bigSize, letterSpacing: -bigSize * 0.04, color: RED, whiteSpace: 'nowrap', lineHeight: 1}}>{big}</div>
								<div style={{fontFamily: HZ, fontWeight: 900, fontSize: 80, color: INK, marginTop: 10}}>лет</div>
							</div>
						) : (
							<div style={{display: 'flex', gap: 20, marginTop: 30}}>{[0, 1, 2, 3, 4].map((i) => <div key={i} style={{width: 36, height: 36, borderRadius: 18, background: f % 10 === i * 2 ? RED : '#e3e6ee'}} />)}</div>
						)}
					</div>
				) : (
					<div style={{position: 'absolute', left: 100, right: 100, top: 860, display: 'flex', flexDirection: 'column', gap: 70}}>
						{[
							{label: 'Возраст Вселенной', sub: '13,8 млрд лет', w: 0.06, c: BLUE, d: 0},
							{label: 'Подбор ключа', sub: 'в миллиарды раз дольше', w: 1, c: RED, d: 8},
						].map((b) => {
							const k = easeOut(lin(f, at(s, 28.45) + b.d, at(s, 28.45) + b.d + 30));
							return (
								<div key={b.label} style={{opacity: lin(f, at(s, 28.4) + b.d, at(s, 28.4) + b.d + 6)}}>
									<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16}}>
										<span style={{fontFamily: HZ, fontWeight: 900, fontSize: 46, color: INK}}>{b.label}</span>
										<span style={{fontFamily: HZ, fontWeight: 700, fontSize: 32, color: b.c}}>{b.sub}</span>
									</div>
									<div style={{height: 64, borderRadius: 32, background: '#e9ecf3', overflow: 'hidden'}}>
										<div style={{height: '100%', width: `${Math.max(7, b.w * 100 * k)}%`, borderRadius: 32, background: b.c, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 24, boxSizing: 'border-box', color: '#fff', fontFamily: HZ, fontWeight: 900, fontSize: 40}}>{b.w === 1 && k > 0.9 ? '→ ∞' : ''}</div>
									</div>
								</div>
							);
						})}
						<div style={{display: 'none'}}>{bars}</div>
					</div>
				)}
			</Stage>
			<Tick at={at(s, 27.3)} vol={0.3} />
			<Tick at={at(s, 28.45)} />
			<Tick at={at(s, 28.7)} />
		</AbsoluteFill>
	);
};

/* F — Horz VPN encrypts all traffic, not one app */
const SF: React.FC = () => {
	const f = useCurrentFrame();
	const s = 5;
	const mark = sp(f, at(s, 31.45), 11);
	const shield = easeOut(lin(f, at(s, 32.45), at(s, 33.2)));
	const pill = sp(f, at(s, 35.25), 11);
	const tap = interpolate(f - at(s, 35.6), [0, 5, 14], [1, 0.92, 1], clamp);
	return (
		<AbsoluteFill>
			<Stage push={0.02}>
				<div style={{position: 'absolute', left: 0, right: 0, top: 700, display: 'flex', justifyContent: 'center', scale: String(mark), opacity: Math.min(1, mark * 2)}}>
					<Wordmark size={140} />
				</div>
				{/* phone with apps, wrapped by the encrypted shield */}
				<div style={{position: 'absolute', left: 540 - 200, top: 930, width: 400, height: 470, borderRadius: 60, background: '#fff', border: '6px solid #0a0a0c', boxShadow: '0 30px 70px rgba(20,30,60,0.18)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22, padding: '50px 40px', boxSizing: 'border-box', opacity: lin(f, at(s, 32.0), at(s, 32.4))}}>
					{ICONS.slice(0, 6).map((ic, i) => (
						<div key={i} style={{width: 92, height: 92, borderRadius: 24, background: ic.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', scale: String(sp(f, at(s, 32.1) + i * 2, 11))}}>
							{ic.glyph}
						</div>
					))}
					<div style={{gridColumn: '1 / 4', display: 'flex', justifyContent: 'center', marginTop: 6, fontFamily: HZ, fontWeight: 800, fontSize: 30, color: shield > 0.6 ? BLUE : HZ_SUB}}>{shield > 0.6 ? 'весь трафик зашифрован' : '…'}</div>
				</div>
				<div style={{position: 'absolute', left: 540 - 200 - 30 * shield, top: 930 - 30 * shield, width: 400 + 60 * shield, height: 470 + 60 * shield, borderRadius: 80, border: `8px solid ${BLUE}`, opacity: shield, boxShadow: `0 0 ${50 * shield}px rgba(10,77,255,0.45)`}} />
				<div style={{position: 'absolute', left: 540 + 160, top: 900, width: 110, height: 110, borderRadius: 55, background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', scale: String(sp(f, at(s, 33.0), 9)), boxShadow: '0 14px 30px rgba(10,77,255,0.5)'}}>{I.lock(62, '#fff')}</div>
				<div style={{position: 'absolute', left: 0, right: 0, top: 1440, display: 'flex', justifyContent: 'center', scale: String(pill * tap), opacity: Math.min(1, pill * 2)}}>
					<div style={{fontFamily: HZ, fontWeight: 800, fontSize: 50, color: '#fff', background: INK, padding: '24px 60px', borderRadius: 70}}>Ссылка в профиле</div>
				</div>
			</Stage>
			<Tick at={at(s, 31.45)} vol={0.22} />
			<Tick at={at(s, 33.0)} />
			<Tick at={at(s, 35.6)} vol={0.22} />
		</AbsoluteFill>
	);
};

/* G — subscribe */
const SG: React.FC = () => {
	const f = useCurrentFrame();
	const s = 6;
	const tapAt = at(s, 36.75);
	const tap = interpolate(f - tapAt, [0, 5, 14], [1, 0.92, 1], clamp);
	const ring = lin(f, tapAt, tapAt + 22);
	return (
		<AbsoluteFill>
			<Stage push={0.02}>
				<div style={{position: 'absolute', left: 0, right: 0, top: 960, display: 'flex', justifyContent: 'center'}}>
					<div style={{position: 'relative', scale: String(sp(f, 0, 11) * tap)}}>
						{ring > 0 && ring < 1 ? <div style={{position: 'absolute', inset: -16, borderRadius: 100, border: `5px solid ${BLUE}`, opacity: 1 - ring, scale: String(1 + ring * 0.3)}} /> : null}
						<div style={{fontFamily: HZ, fontWeight: 900, fontSize: 76, color: '#fff', background: INK, padding: '38px 96px', borderRadius: 100}}>Подписывайся</div>
					</div>
				</div>
				<div style={{position: 'absolute', left: 0, right: 0, top: 1230, display: 'flex', justifyContent: 'center', rotate: `0 1 0 ${f * 3}deg`}}>
					<div style={{width: 150, height: 150, borderRadius: 75, background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 36px rgba(10,77,255,0.45)', scale: String(sp(f, at(s, 39.1), 10))}}>{I.key(90, '#fff')}</div>
				</div>
			</Stage>
			<Tick at={tapAt} vol={0.24} />
		</AbsoluteFill>
	);
};

const SCENES = [SA, SB, SC, SD, SE, SF, SG];

const Watermark: React.FC = () => (
	<div style={{position: 'absolute', top: 190, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
		<div style={{display: 'flex', alignItems: 'baseline', gap: 10, background: 'rgba(255,255,255,0.92)', padding: '10px 28px', borderRadius: 40, boxShadow: '0 8px 24px rgba(20,30,60,0.10)'}}>
			<span style={{fontFamily: HZ, fontWeight: 900, fontSize: 34, color: INK, letterSpacing: -1}}>
				HORZ<span style={{color: BLUE}}>.</span>
			</span>
			<span style={{fontFamily: HZ, fontWeight: 700, fontSize: 20, color: HZ_SUB, letterSpacing: 4}}>VPN</span>
		</div>
	</div>
);

/** wait for the heavy fonts before anything measures text */
const useFontsReady = () => {
	const [ready, setReady] = useState(false);
	const [handle] = useState(() => delayRender('fonts'));
	useEffect(() => {
		Promise.all([document.fonts.load('900 92px Montserrat', 'АБВ abc 0123'), document.fonts.load('800 40px Montserrat', 'АБВ'), document.fonts.load('500 40px "JetBrains Mono"', 'abc')]).then(() => {
			setReady(true);
			continueRender(handle);
		});
	}, [handle]);
	return ready;
};

const BEATS = [2.62, 10.45, 13.5, 14.27, 17.3, 27.3, 29.95, 31.45, 33.0];
const Punch: React.FC<{children: React.ReactNode}> = ({children}) => {
	const f = useCurrentFrame();
	let k = 0;
	for (const b of BEATS) k = Math.max(k, interpolate(f - fr(b), [-1, 2, 12], [0, 1, 0], clamp));
	return <AbsoluteFill style={{scale: String(1 + 0.045 * k)}}>{children}</AbsoluteFill>;
};

export const EncV2: React.FC = () => {
	const ready = useFontsReady();
	return (
		<AbsoluteFill style={{background: HZ_BG}}>
			{ready ? (
				<>
					<Punch>
					<TransitionSeries>
						{SCENES.map((S, i) => (
							<React.Fragment key={i}>
								{i > 0 ? <TransitionSeries.Transition presentation={whip()} timing={linearTiming({durationInFrames: TR})} /> : null}
								<TransitionSeries.Sequence durationInFrames={DUR[i] + (i < SCENES.length - 1 ? TR : 0)}>
									<S />
								</TransitionSeries.Sequence>
							</React.Fragment>
						))}
					</TransitionSeries>
					</Punch>
					<Captions />
					<Watermark />
				</>
			) : null}
			<Audio src={staticFile('enc/voice.mp3')} />
			{/* whoosh-like tick on each whip */}
			{STARTS.slice(1).map((s) => (
				<Tick key={s} at={fr(s) - 4} vol={0.1} />
			))}
		</AbsoluteFill>
	);
};

