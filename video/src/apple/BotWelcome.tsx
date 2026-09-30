import React from 'react';
import {AbsoluteFill, Img, interpolate, useCurrentFrame} from 'remotion';
import {ACCENT, INK, IT, LOGO, OUT, clamp, prog} from './kit';

// Telegram bot welcome picture, 16:9, seamless loop
export const BW_LOOP = 180;
const RED = '#ff3b30';
const GREEN = '#34c759';

/* simplified social-app glyphs (generic shapes, not official logos) */
const ICONS: {bg: string; glyph: React.ReactNode}[] = [
	{
		bg: 'linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)',
		glyph: (
			<svg viewBox="0 0 24 24" width="60%" fill="none" stroke="#fff" strokeWidth={2}>
				<rect x="4" y="4" width="16" height="16" rx="5" />
				<circle cx="12" cy="12" r="3.8" />
				<circle cx="17" cy="7" r="0.8" fill="#fff" />
			</svg>
		),
	},
	{
		bg: '#ff0033',
		glyph: (
			<svg viewBox="0 0 24 24" width="55%">
				<path d="M9 7.5v9l7.5-4.5z" fill="#fff" />
			</svg>
		),
	},
	{
		bg: '#111',
		glyph: (
			<svg viewBox="0 0 24 24" width="55%" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round">
				<path d="M13 4v10.5a3.5 3.5 0 1 1-3.5-3.5M13 4c.5 2.5 2.5 4 5 4" />
			</svg>
		),
	},
	{
		bg: '#25d366',
		glyph: (
			<svg viewBox="0 0 24 24" width="58%" fill="none" stroke="#fff" strokeWidth={2}>
				<path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" strokeLinejoin="round" />
			</svg>
		),
	},
	{
		bg: '#1877f2',
		glyph: (
			<svg viewBox="0 0 24 24" width="55%">
				<path d="M13.5 20v-7h2.4l.4-2.8h-2.8V8.5c0-.8.3-1.4 1.4-1.4h1.5V4.6c-.3 0-1.2-.1-2.2-.1-2.2 0-3.6 1.3-3.6 3.7v2H8.2V13h2.4v7z" fill="#fff" />
			</svg>
		),
	},
	{
		bg: '#5865f2',
		glyph: (
			<svg viewBox="0 0 24 24" width="60%" fill="none" stroke="#fff" strokeWidth={2} strokeLinejoin="round">
				<path d="M6 7c4-2 8-2 12 0l2 9c-2 1.5-4 2.2-5 2.2l-1-1.7M6 7L4 16c2 1.5 4 2.2 5 2.2l1-1.7M8.5 15.5c2.3 1 4.7 1 7 0" />
				<circle cx="9.5" cy="12" r="1" fill="#fff" />
				<circle cx="14.5" cy="12" r="1" fill="#fff" />
			</svg>
		),
	},
	{
		bg: '#000',
		glyph: (
			<svg viewBox="0 0 24 24" width="50%" stroke="#fff" strokeWidth={2.4} strokeLinecap="round">
				<path d="M5 5l14 14M19 5L5 19" />
			</svg>
		),
	},
];

const SIZE = 118;
const GAP = 44;
const STEP = SIZE + GAP;

/** endless slot-style strip of app icons; `fixed` 0..1 turns them from blocked to working */
const Roulette: React.FC<{f: number; fixed: number}> = ({f, fixed}) => {
	const span = ICONS.length * STEP;
	const off = ((f / BW_LOOP) * span * 2) % span; // two full turns per loop → seamless
	const items = [];
	for (let r = -1; r < 3; r++) {
		ICONS.forEach((ic, i) => {
			const x = r * span + i * STEP - off;
			const cx = x + SIZE / 2 - 640;
			const d = Math.min(1, Math.abs(cx) / 640);
			const sc = 1.22 - d * 0.42;
			if (x < -STEP || x > 1280 + STEP) return;
			items.push(
				<div key={`${r}-${i}`} style={{position: 'absolute', left: x, top: 0, width: SIZE, height: SIZE, scale: String(sc)}}>
					<div
						style={{
							width: '100%',
							height: '100%',
							borderRadius: 32,
							background: ic.bg,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							filter: `grayscale(${1 - fixed}) opacity(${0.55 + fixed * 0.45})`,
							boxShadow: `0 14px 30px rgba(20,40,90,${0.08 + fixed * 0.1})`,
						}}
					>
						{ic.glyph}
					</div>
					<div
						style={{
							position: 'absolute',
							right: -8,
							top: -8,
							width: 42,
							height: 42,
							borderRadius: 21,
							background: fixed > 0.5 ? GREEN : RED,
							color: '#fff',
							fontFamily: IT,
							fontSize: 26,
							fontWeight: 700,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							border: '3px solid #fff',
							scale: String(fixed > 0.5 ? interpolate(fixed, [0.5, 0.8, 1], [0.4, 1.15, 1]) : 1),
						}}
					>
						{fixed > 0.5 ? '✓' : '✕'}
					</div>
				</div>,
			);
		});
	}
	return (
		<div style={{position: 'absolute', left: 0, right: 0, top: 515, height: SIZE, WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent)'}}>
			{items}
		</div>
	);
};

/** one line of text that rises in and fades out inside [a, b] */
const Beat: React.FC<{f: number; a: number; b: number; children: React.ReactNode}> = ({f, a, b, children}) => {
	const pin = prog(f, a, 16, OUT);
	const pout = prog(f, b - 12, 12);
	const o = pin * (1 - pout);
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 200, opacity: o, translate: `0 ${(1 - pin) * 30 - pout * 20}px`, filter: o < 0.98 ? `blur(${(1 - o) * 8}px)` : undefined}}>
			{children}
		</AbsoluteFill>
	);
};

export const BotWelcome: React.FC = () => {
	const f = useCurrentFrame() % BW_LOOP;
	const fixed = interpolate(f, [62, 80, 166, 178], [0, 1, 1, 0], clamp);
	const sheen = interpolate(f % 60, [0, 40], [-0.4, 1.4], clamp);
	const tap = interpolate(f, [140, 145, 154], [1, 0.93, 1], clamp);
	return (
		<AbsoluteFill style={{background: `radial-gradient(circle at 50% 0%, rgba(${fixed > 0.5 ? '0,113,227' : '255,59,48'},0.10), rgba(255,255,255,0) 60%), linear-gradient(180deg,#fbfbfd,#eef2f8)`, overflow: 'hidden'}}>
			<Beat f={f} a={0} b={62}>
				<div style={{fontFamily: IT, fontSize: 104, fontWeight: 700, color: INK, letterSpacing: -4, textAlign: 'center', lineHeight: 1.02}}>
					Не работают
					<br />
					<span style={{color: RED}}>соцсети?</span>
				</div>
			</Beat>
			<Beat f={f} a={64} b={122}>
				<div style={{display: 'flex', alignItems: 'center', gap: 40}}>
					<div style={{width: 190, height: 190, borderRadius: 48, background: 'linear-gradient(180deg,#fff,#eef2f9)', boxShadow: '0 24px 50px rgba(20,40,90,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden'}}>
						<Img src={LOGO} style={{width: 120}} />
						<div style={{position: 'absolute', inset: 0, background: `linear-gradient(115deg, rgba(255,255,255,0) ${sheen * 100 - 12}%, rgba(255,255,255,0.85) ${sheen * 100}%, rgba(255,255,255,0) ${sheen * 100 + 12}%)`}} />
					</div>
					<div style={{fontFamily: IT, fontWeight: 700, letterSpacing: -4, lineHeight: 1.02}}>
						<div style={{fontSize: 100, color: INK}}>Horz VPN</div>
						<div style={{fontSize: 100, color: ACCENT}}>поможет</div>
					</div>
				</div>
			</Beat>
			<Beat f={f} a={124} b={180}>
				<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34}}>
					<div style={{fontFamily: IT, fontSize: 96, fontWeight: 700, color: INK, letterSpacing: -4}}>Подключайся</div>
					<div style={{background: INK, color: '#fff', fontFamily: IT, fontSize: 48, fontWeight: 600, padding: '22px 60px', borderRadius: 60, scale: String(tap)}}>Жми «Start» 👇</div>
				</div>
			</Beat>
			<Roulette f={f} fixed={fixed} />
		</AbsoluteFill>
	);
};
