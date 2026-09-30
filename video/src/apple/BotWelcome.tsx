import React from 'react';
import {AbsoluteFill, Img, interpolate, useCurrentFrame} from 'remotion';
import {ACCENT, INK, IT, LOGO, OUT, clamp, prog} from './kit';

// Telegram bot welcome picture, 16:9, seamless 6s loop
export const BW_LOOP = 180;
const RED = '#ff3b30';
const GREEN = '#34c759';

/* simplified social-app glyphs (generic shapes, not official logos) */
const ICONS: {bg: string; glyph: React.ReactNode}[] = [
	{bg: 'linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)', glyph: <svg viewBox="0 0 24 24" width="60%" fill="none" stroke="#fff" strokeWidth={2}><rect x="4" y="4" width="16" height="16" rx="5" /><circle cx="12" cy="12" r="3.8" /><circle cx="17" cy="7" r="0.8" fill="#fff" /></svg>},
	{bg: '#ff0033', glyph: <svg viewBox="0 0 24 24" width="55%"><path d="M9 7.5v9l7.5-4.5z" fill="#fff" /></svg>},
	{bg: '#111', glyph: <svg viewBox="0 0 24 24" width="55%" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round"><path d="M13 4v10.5a3.5 3.5 0 1 1-3.5-3.5M13 4c.5 2.5 2.5 4 5 4" /></svg>},
	{bg: '#25d366', glyph: <svg viewBox="0 0 24 24" width="58%" fill="none" stroke="#fff" strokeWidth={2}><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" strokeLinejoin="round" /></svg>},
	{bg: '#1877f2', glyph: <svg viewBox="0 0 24 24" width="55%"><path d="M13.5 20v-7h2.4l.4-2.8h-2.8V8.5c0-.8.3-1.4 1.4-1.4h1.5V4.6c-.3 0-1.2-.1-2.2-.1-2.2 0-3.6 1.3-3.6 3.7v2H8.2V13h2.4v7z" fill="#fff" /></svg>},
	{bg: '#5865f2', glyph: <svg viewBox="0 0 24 24" width="60%" fill="none" stroke="#fff" strokeWidth={2} strokeLinejoin="round"><path d="M6 7c4-2 8-2 12 0l2 9c-2 1.5-4 2.2-5 2.2l-1-1.7M6 7L4 16c2 1.5 4 2.2 5 2.2l1-1.7M8.5 15.5c2.3 1 4.7 1 7 0" /><circle cx="9.5" cy="12" r="1" fill="#fff" /><circle cx="14.5" cy="12" r="1" fill="#fff" /></svg>},
	{bg: '#000', glyph: <svg viewBox="0 0 24 24" width="50%" stroke="#fff" strokeWidth={2.4} strokeLinecap="round"><path d="M5 5l14 14M19 5L5 19" /></svg>},
];

const CX = 330;
const CY = 360;
const HIT = 52; // frame where the logo lands

const Spinner: React.FC<{f: number}> = ({f}) => (
	<svg viewBox="0 0 40 40" width="46%" style={{rotate: `${f * 14}deg`}}>
		<circle cx="20" cy="20" r="15" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={5} />
		<path d="M20 5a15 15 0 0 1 15 15" fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" />
	</svg>
);

/** text block on the right that slides in / out inside [a, b] */
const Say: React.FC<{f: number; a: number; b: number; children: React.ReactNode}> = ({f, a, b, children}) => {
	const pin = prog(f, a, 12, OUT);
	const pout = prog(f, b - 8, 8);
	const o = pin * (1 - pout);
	return (
		<div style={{position: 'absolute', left: 660, right: 30, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', opacity: o, translate: `${(1 - pin) * 80 - pout * 40}px 0`, filter: o < 0.98 ? `blur(${(1 - o) * 10}px)` : undefined}}>
			{children}
		</div>
	);
};

export const BotWelcome: React.FC = () => {
	const f = useCurrentFrame() % BW_LOOP;
	const hit = prog(f, HIT, 14, OUT);
	// logo slams in from huge + blurred
	const lz = interpolate(f, [HIT - 12, HIT], [0, 1], {...clamp, easing: (x) => x * x});
	const logoScale = f < HIT ? interpolate(lz, [0, 1], [4.5, 0.92]) : interpolate(f, [HIT, HIT + 6, HIT + 14], [0.92, 1.08, 1], clamp);
	// shake before the hit, camera kick on the hit
	const shake = f < HIT - 12 ? Math.sin(f * 2.1) * interpolate(f, [0, HIT - 12], [2, 7], clamp) : 0;
	const kick = interpolate(f, [HIT, HIT + 4, HIT + 16], [0, 1, 0], clamp);
	// icons: grey ring that shivers → blown outward → orbiting in colour
	const R = interpolate(hit, [0, 1], [140, 225]) + kick * 30;
	const spin = f >= HIT ? (f - HIT) * 0.9 : 0;
	const loopOut = interpolate(f, [168, 180], [1, 0], clamp);
	const loopIn = interpolate(f, [0, 8], [0, 1], clamp);
	const vis = Math.min(loopIn, loopOut);
	const glow = hit * (0.5 + Math.sin(f / 8) * 0.1);
	const tap = interpolate(f, [150, 155, 164], [1, 0.92, 1], clamp);
	return (
		<AbsoluteFill style={{background: 'linear-gradient(180deg,#fbfbfd,#edf1f8)', overflow: 'hidden'}}>
			{/* colour wash that flips from red alarm to blue */}
			<AbsoluteFill style={{background: `radial-gradient(circle at ${CX}px ${CY}px, rgba(255,59,48,${0.16 * (1 - hit)}), rgba(255,59,48,0) 55%)`}} />
			<AbsoluteFill style={{background: `radial-gradient(circle at ${CX}px ${CY}px, rgba(0,113,227,${0.2 * glow}), rgba(0,113,227,0) 60%)`}} />
			{/* flash on hit */}
			<AbsoluteFill style={{background: '#fff', opacity: interpolate(f, [HIT, HIT + 2, HIT + 10], [0, 0.85, 0], clamp)}} />

			<AbsoluteFill style={{opacity: vis, translate: `${shake}px ${kick * 6}px`, scale: String(1 + kick * 0.03)}}>
				{/* shockwaves */}
				{[0, 7].map((d) => {
					const p = prog(f, HIT + d, 26, OUT);
					return p > 0 && p < 1 ? <div key={d} style={{position: 'absolute', left: CX - 300, top: CY - 300, width: 600, height: 600, borderRadius: '50%', border: `${6 - d * 0.5}px solid ${ACCENT}`, opacity: (1 - p) * 0.8, scale: String(0.3 + p * 1.1)}} /> : null;
				})}
				{/* orbit track */}
				<div style={{position: 'absolute', left: CX - R, top: CY - R, width: R * 2, height: R * 2, borderRadius: '50%', border: `2px dashed rgba(0,113,227,${0.25 * hit})`, rotate: `${spin * 0.5}deg`}} />
				{/* icons */}
				{ICONS.map((ic, i) => {
					const a = ((i / ICONS.length) * 360 + spin - 90) * (Math.PI / 180);
					const x = CX + Math.cos(a) * R - 50;
					const y = CY + Math.sin(a) * R - 50;
					const pop = prog(f, HIT + 2 + i * 2, 12);
					const jitter = f < HIT ? Math.sin(f * 3 + i) * 3 : 0;
					return (
						<div key={i} style={{position: 'absolute', left: x + jitter, top: y, width: 100, height: 100, scale: String(f < HIT ? 1 : interpolate(pop, [0, 0.5, 1], [0.6, 1.2, 1]))}}>
							<div style={{width: '100%', height: '100%', borderRadius: 28, background: ic.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', filter: `grayscale(${1 - pop})`, opacity: 0.55 + pop * 0.45, boxShadow: `0 14px 30px rgba(20,40,90,${0.1 + pop * 0.12})`}}>
								{pop < 0.5 ? <Spinner f={f} /> : ic.glyph}
							</div>
							<div style={{position: 'absolute', right: -8, top: -8, width: 36, height: 36, borderRadius: 18, border: '3px solid #fff', background: pop > 0.5 ? GREEN : RED, color: '#fff', fontFamily: IT, fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
								{pop > 0.5 ? '✓' : '!'}
							</div>
						</div>
					);
				})}
				{/* logo */}
				<div style={{position: 'absolute', left: CX - 90, top: CY - 90, width: 180, height: 180, borderRadius: 46, background: 'linear-gradient(180deg,#fff,#eef2f9)', boxShadow: `0 24px 50px rgba(20,40,90,0.2), 0 0 ${60 * glow}px rgba(0,113,227,${0.5 * glow})`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: lz, scale: String(logoScale), filter: f < HIT ? `blur(${(1 - lz) * 16}px)` : undefined}}>
					<Img src={LOGO} style={{width: 116}} />
				</div>

				{/* copy */}
				<Say f={f} a={0} b={HIT}>
					<div style={{fontFamily: IT, fontWeight: 700, letterSpacing: -3.5, lineHeight: 1.02}}>
						<div style={{fontSize: 92, color: INK}}>Соцсети</div>
						<div style={{fontSize: 92, color: RED}}>не грузятся?</div>
					</div>
				</Say>
				<Say f={f} a={HIT + 4} b={128}>
					<div style={{fontFamily: IT, fontWeight: 700, letterSpacing: -3.5, lineHeight: 1.02}}>
						<div style={{fontSize: 96, color: INK}}>Horz VPN</div>
						<div style={{fontSize: 80, color: ACCENT}}>и всё летает ⚡</div>
					</div>
				</Say>
				<Say f={f} a={128} b={180}>
					<div style={{fontFamily: IT, fontSize: 88, fontWeight: 700, letterSpacing: -3.5, color: INK}}>Подключайся</div>
					<div style={{marginTop: 28, alignSelf: 'flex-start', background: INK, color: '#fff', fontFamily: IT, fontSize: 46, fontWeight: 600, padding: '22px 56px', borderRadius: 60, scale: String(tap), boxShadow: `0 0 0 ${interpolate(f, [152, 170], [0, 24], clamp)}px rgba(0,113,227,${interpolate(f, [152, 170], [0.35, 0], clamp)})`}}>
						Жми «Start» 👇
					</div>
				</Say>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
