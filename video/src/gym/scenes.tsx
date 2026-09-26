import React from 'react';
import {AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Character, Pose, fistPos} from './Character';
import {C, clamp, font, mono} from '../reel/ui';

type SP = {dur: number};

const useP = (delay = 0, damping = 12, stiffness = 160) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	return spring({frame: f - delay, fps, config: {damping, stiffness}});
};

const blinkAt = (f: number, seed: string) => {
	const period = 70 + Math.floor(random(seed) * 30);
	const k = (f + Math.floor(random(seed + 'o') * 40)) % period;
	return k < 3 ? 0.1 : 1;
};

export const GymBg: React.FC<{mood?: 'dark' | 'hero'; sign?: boolean}> = ({mood = 'dark', sign = true}) => {
	const f = useCurrentFrame();
	const hero = mood === 'hero';
	const flicker = hero ? 1 : 0.55 + 0.45 * (random(`fl${Math.floor(f / 4)}`) > 0.2 ? 1 : 0.2);
	return (
		<AbsoluteFill style={{background: hero ? 'linear-gradient(180deg,#0a1a46 0%,#0e3a9a 55%,#0a1330 100%)' : 'linear-gradient(180deg,#0d0f19 0%,#1a1f33 55%,#0b0d15 100%)', overflow: 'hidden'}}>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.035) 2px, transparent 2px), linear-gradient(rgba(255,255,255,0.03) 2px, transparent 2px)',
					backgroundSize: '120px 60px',
					height: 1250,
				}}
			/>
			<svg width="1080" height="1920" style={{position: 'absolute'}}>
				<defs>
					<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor={hero ? '#123a8a' : '#1c2133'} />
						<stop offset="1" stopColor="#05060b" />
					</linearGradient>
					<linearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor={hero ? '#9fe3ff' : '#fff4d6'} stopOpacity="0.35" />
						<stop offset="1" stopColor={hero ? '#9fe3ff' : '#fff4d6'} stopOpacity="0" />
					</linearGradient>
				</defs>
				<rect y="1250" width="1080" height="670" fill="url(#floor)" />
				{[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((i) => (
					<line key={i} x1={540 + i * 70} y1={1250} x2={540 + i * 330} y2={1920} stroke="#fff" strokeOpacity="0.06" strokeWidth="3" />
				))}
				{[1300, 1380, 1500, 1680].map((y) => (
					<line key={y} x1="0" y1={y} x2="1080" y2={y} stroke="#fff" strokeOpacity="0.05" strokeWidth="3" />
				))}
				{[120, 960].map((x) => (
					<g key={x} opacity="0.5">
						<rect x={x - 60} y="760" width="16" height="490" fill="#2b3150" />
						<rect x={x + 44} y="760" width="16" height="490" fill="#2b3150" />
						{[860, 980, 1100].map((y) => (
							<g key={y}>
								<rect x={x - 70} y={y} width="140" height="10" fill="#343b5e" />
								<circle cx={x - 60} cy={y - 10} r="26" fill="#1f2440" stroke="#3a4270" strokeWidth="6" />
								<circle cx={x + 60} cy={y - 10} r="26" fill="#1f2440" stroke="#3a4270" strokeWidth="6" />
							</g>
						))}
					</g>
				))}
				<path d="M360 0 L 720 0 L 900 1350 L 180 1350 Z" fill="url(#cone)" />
			</svg>
			{sign ? (
				<div
					style={{
						position: 'absolute',
						top: 120,
						width: '100%',
						textAlign: 'center',
						fontFamily: font,
						fontWeight: 900,
						fontSize: 96,
						letterSpacing: 8,
						color: hero ? '#dff6ff' : '#ffd6de',
						opacity: flicker,
						textShadow: hero
							? '0 0 12px #7fdcff, 0 0 40px #1a7cf5, 0 0 90px #1a7cf5'
							: '0 0 12px #ff2d55, 0 0 40px #ff2d55',
					}}
				>
					{hero ? 'HORZ GYM' : 'FREE GYM'}
				</div>
			) : null}
		</AbsoluteFill>
	);
};

const Place: React.FC<{x: number; y: number; children: React.ReactNode; style?: React.CSSProperties}> = ({x, y, children, style}) => (
	<div style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%, -100%)', ...style}}>{children}</div>
);

const Dumbbell: React.FC<{x: number; y: number; s?: number; color?: string; label?: string}> = ({x, y, s = 1, color = '#ff8fb1', label}) => (
	<g transform={`translate(${x} ${y}) scale(${s})`}>
		<rect x="-38" y="-5" width="76" height="10" rx="4" fill="#c9ced9" stroke="#0b1430" strokeWidth="3" />
		<rect x="-50" y="-16" width="16" height="32" rx="5" fill={color} stroke="#0b1430" strokeWidth="3" />
		<rect x="34" y="-16" width="16" height="32" rx="5" fill={color} stroke="#0b1430" strokeWidth="3" />
		{label ? (
			<text y="-26" textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize="22" fill="#fff" stroke="#0b1430" strokeWidth="5" paintOrder="stroke">
				{label}
			</text>
		) : null}
	</g>
);

const Barbell: React.FC<{a: {x: number; y: number}; b: {x: number; y: number}; label: string; bend?: number}> = ({a, b, label, bend = 0}) => {
	const cx = (a.x + b.x) / 2;
	const cy = (a.y + b.y) / 2;
	const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
	const half = 330;
	return (
		<g transform={`translate(${cx} ${cy}) rotate(${ang})`}>
			<path d={`M${-half} ${bend} Q 0 ${-bend}, ${half} ${bend}`} stroke="#0b1430" strokeWidth="22" fill="none" strokeLinecap="round" />
			<path d={`M${-half} ${bend} Q 0 ${-bend}, ${half} ${bend}`} stroke="#d5dbe8" strokeWidth="12" fill="none" strokeLinecap="round" />
			{[-1, 1].map((s) => (
				<g key={s} transform={`translate(${s * (half - 70)} ${bend})`}>
					{[0, 1, 2].map((i) => (
						<rect
							key={i}
							x={-18 + s * i * 32 - (s < 0 ? 0 : 0)}
							y={-(130 - i * 18)}
							width="30"
							height={(130 - i * 18) * 2}
							rx="8"
							fill={i === 0 ? '#1a7cf5' : i === 1 ? '#0b4fc9' : '#2a3150'}
							stroke="#0b1430"
							strokeWidth="5"
						/>
					))}
				</g>
			))}
			<g transform="translate(0 -40)">
				<rect x="-150" y="-44" width="300" height="70" rx="20" fill="#1a7cf5" stroke="#fff" strokeWidth="5" />
				<text y="4" textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize="44" fill="#fff">
					{label}
				</text>
			</g>
		</g>
	);
};

const Sweat: React.FC<{n?: number}> = ({n = 4}) => {
	const f = useCurrentFrame();
	return (
		<>
			{[...Array(n)].map((_, i) => {
				const p = ((f + i * 11) % 30) / 30;
				return (
					<path
						key={i}
						transform={`translate(${220 + random(`sw${i}`) * 160} ${130 + p * 90})`}
						d="M0 -14 C 8 -2, 10 6, 0 10 C -10 6, -8 -2, 0 -14 Z"
						fill="#7fd4ff"
						stroke="#0b1430"
						strokeWidth="3"
						opacity={1 - p}
					/>
				);
			})}
		</>
	);
};

const Big: React.FC<{children: React.ReactNode; top: number; size?: number; color?: string; delay?: number; rot?: number}> = ({children, top, size = 110, color = '#fff', delay = 0, rot = 0}) => {
	const p = useP(delay, 9, 220);
	return (
		<div
			style={{
				position: 'absolute',
				top,
				width: '100%',
				textAlign: 'center',
				fontFamily: font,
				fontWeight: 900,
				fontSize: size,
				lineHeight: 1,
				color,
				letterSpacing: -2,
				transform: `scale(${2.2 - 1.2 * p}) rotate(${rot}deg)`,
				opacity: Math.min(1, p * 1.5),
				WebkitTextStroke: '12px #05060b',
				paintOrder: 'stroke fill',
				textShadow: '0 12px 40px rgba(0,0,0,0.6)',
			}}
		>
			{children}
		</div>
	);
};

const idle = (f: number, amp = 1): Pose => {
	const br = Math.sin(f / 9) * 3 * amp;
	return {l: {sh: 14 + br, el: -12}, r: {sh: 14 + br, el: -12}};
};

/* ---------------- scenes ---------------- */

const hookPose = (f: number): Pose => ({l: {sh: 25 + Math.sin(f * 2) * 4, el: 100}, r: {sh: 20, el: 10}, mouth: 'open', brow: 1, blink: blinkAt(f, 'h')});

export const Hook: React.FC<SP> = () => {
	const f = useCurrentFrame();
	const drop = useP(4, 10, 200);
	const shake = (random(`hs${f}`) - 0.5) * 5;
	return (
		<AbsoluteFill>
			<GymBg />
			<Big top={330} size={120} delay={0}>
				ТВОЙ VPN
			</Big>
			<Big top={470} size={210} color={C.red} delay={6} rot={-4}>
				ДРИЩ
			</Big>
			<Place x={540 + shake} y={1350 + (1 - drop) * 700}>
				<Character
					build="skinny"
					id="h"
					size={520}
					pose={hookPose(f)}
					front={<Dumbbell x={fistPos('skinny', hookPose(f)).l.x} y={fistPos('skinny', hookPose(f)).l.y} s={0.9} />}
				/>
			</Place>
		</AbsoluteFill>
	);
};

export const Meet: React.FC<SP> = ({dur}) => {
	const f = useCurrentFrame();
	const strain = Math.min(1, f / (dur * 0.6));
	const tremble = Math.sin(f * 2.2) * 5 * strain;
	const lift = interpolate(f, [10, dur * 0.7], [0, 0.5], clamp);
	const pose: Pose = {
		l: {sh: 20 + lift * 40 + tremble, el: 40 + lift * 60},
		r: {sh: 20 + lift * 40 - tremble, el: 40 + lift * 60},
		mouth: 'grit',
		brow: 1,
		blink: blinkAt(f, 'm'),
	};
	const fp = fistPos('skinny', pose);
	const load = Math.floor(interpolate(f, [0, dur], [3, 12], clamp));
	return (
		<AbsoluteFill>
			<GymBg />
			<div style={{position: 'absolute', top: 290, width: '100%', display: 'flex', justifyContent: 'center'}}>
				<div style={{background: 'rgba(10,12,20,0.85)', border: '3px solid #ff2d55', borderRadius: 30, padding: '24px 40px', display: 'flex', alignItems: 'center', gap: 26}}>
					<svg width="70" height="70" viewBox="0 0 50 50" style={{transform: `rotate(${f * 12}deg)`}}>
						<circle cx="25" cy="25" r="20" stroke="#ff2d55" strokeWidth="6" fill="none" strokeDasharray="80 60" strokeLinecap="round" />
					</svg>
					<div>
						<div style={{fontFamily: font, fontWeight: 900, fontSize: 48, color: '#fff'}}>Загрузка видео…</div>
						<div style={{marginTop: 10, width: 400, height: 16, borderRadius: 8, background: '#2a3150'}}>
							<div style={{width: `${load * 4}%`, height: '100%', borderRadius: 8, background: '#ff2d55'}} />
						</div>
					</div>
					<div style={{fontFamily: mono, fontWeight: 800, fontSize: 44, color: '#ff2d55'}}>{load}%</div>
				</div>
			</div>
			<Place x={540} y={1370}>
				<Character
					build="skinny"
					id="m"
					size={620}
					label="FREE"
					pose={pose}
					front={
						<>
							<Dumbbell x={fp.l.x} y={fp.l.y} s={1.1} label="1 видео" />
							<Sweat />
						</>
					}
				/>
			</Place>
		</AbsoluteFill>
	);
};

export const Fail: React.FC<SP> = ({dur}) => {
	const f = useCurrentFrame();
	const half = dur * 0.48;
	const fall = interpolate(f, [8, 20], [0, 1], {...clamp});
	const ping = Math.floor(interpolate(f, [half, half + 25], [40, 300], clamp));
	const needle = interpolate(ping, [0, 300], [-80, 80]);
	const second = f > half;
	return (
		<AbsoluteFill>
			<GymBg />
			{!second ? (
				<>
					<div style={{position: 'absolute', top: 300, width: '100%', display: 'flex', justifyContent: 'center'}}>
						<div style={{width: 560, borderRadius: 50, background: '#0b0d15', border: '6px solid #2a3150', padding: 30, textAlign: 'center'}}>
							<div style={{width: 130, height: 130, margin: '0 auto', borderRadius: 34, background: 'radial-gradient(circle at 30% 107%,#fdf497 0%,#fd5949 45%,#d6249f 60%,#285aeb 90%)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
								<svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
									<rect x="3" y="3" width="18" height="18" rx="5.5" />
									<circle cx="12" cy="12" r="4.2" />
								</svg>
							</div>
							<div style={{fontFamily: font, fontWeight: 900, fontSize: 44, color: C.red, marginTop: 24, opacity: f > 12 ? 1 : 0}}>Нет соединения</div>
						</div>
					</div>
					<Place x={540 + fall * 60} y={1370 + fall * 40}>
						<Character
							build="skinny"
							id="f1"
							size={560}
							label="FREE"
							pose={{l: {sh: 40 + fall * 80, el: 20}, r: {sh: 40 + fall * 80, el: 20}, lean: fall * 78, mouth: 'open', blink: fall > 0.8 ? 0.1 : 1}}
						/>
					</Place>
					{fall > 0.9 ? <Big top={1080} size={90} color={C.red}>*упал*</Big> : null}
				</>
			) : (
				<>
					<div style={{position: 'absolute', top: 230, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
						<svg width="700" height="420" viewBox="0 0 700 420">
							<path d="M80 380 A 270 270 0 0 1 620 380" stroke="#2a3150" strokeWidth="46" fill="none" />
							<path d="M80 380 A 270 270 0 0 1 350 110" stroke={C.green} strokeWidth="46" fill="none" opacity="0.5" />
							<path d="M350 110 A 270 270 0 0 1 620 380" stroke={C.red} strokeWidth="46" fill="none" opacity="0.8" />
							<g transform={`translate(350 380) rotate(${needle})`}>
								<path d="M-12 0 L 0 -250 L 12 0 Z" fill="#fff" />
								<circle r="26" fill="#fff" />
							</g>
						</svg>
						<div style={{fontFamily: mono, fontWeight: 800, fontSize: 130, color: C.red, textShadow: `0 0 40px ${C.red}`}}>PING {ping}</div>
					</div>
					<Place x={540} y={1400}>
						<Character build="skinny" id="f2" size={380} label="FREE" pose={{l: {sh: 150, el: 10}, r: {sh: 150, el: 10}, mouth: 'open', brow: 1, blink: blinkAt(f, 'f2')}} />
					</Place>
				</>
			)}
		</AbsoluteFill>
	);
};

export const Leak: React.FC<SP> = () => {
	const f = useCurrentFrame();
	const hand = useP(6, 14, 120);
	const give = interpolate(f, [20, 45], [0, 1], clamp);
	return (
		<AbsoluteFill>
			<GymBg />
			<AbsoluteFill style={{background: 'radial-gradient(circle at 85% 55%, rgba(255,45,85,0.35), rgba(0,0,0,0) 45%)'}} />
			<Place x={400} y={1370}>
				<Character
					build="skinny"
					id="lk"
					size={560}
					label="FREE"
					pose={{l: {sh: 10, el: 0}, r: {sh: 70 + give * 15, el: -10}, mouth: 'smirk', brow: -1, blink: blinkAt(f, 'lk')}}
				/>
			</Place>
			<div style={{position: 'absolute', left: 560 + give * 170, top: 780 - give * 40, transform: `rotate(${give * 12}deg)`}}>
				<div style={{width: 210, height: 160, background: '#f7d774', borderRadius: 16, border: '5px solid #0b1430', position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'}}>
					<div style={{position: 'absolute', top: -26, left: 16, width: 90, height: 34, background: '#f7d774', borderRadius: '12px 12px 0 0', border: '5px solid #0b1430', borderBottom: 'none'}} />
					<div style={{padding: 16, fontFamily: font, fontWeight: 900, fontSize: 30, color: '#0b1430', lineHeight: 1.1}}>
						ТВОИ
						<br />
						ДАННЫЕ
					</div>
				</div>
			</div>
			<svg width="600" height="500" viewBox="0 0 600 500" style={{position: 'absolute', left: 740 + (1 - hand) * 400, top: 600}}>
				<path d="M600 250 L 200 230 C 160 228, 120 250, 100 280 L 60 330 C 40 360, 80 380, 110 350 L 150 310 L 200 330 L 600 340 Z" fill="#11131d" stroke="#ff2d55" strokeWidth="5" />
			</svg>
			{f > 40 ? (
				<>
					{[0, 1, 2].map((i) => {
						const p = coinP(f - 40 - i * 5);
						return (
							<div key={i} style={{position: 'absolute', left: 520 + i * 40, top: 560 + p * 300, opacity: p < 1 ? 1 : 0, fontFamily: font, fontWeight: 900, fontSize: 70, color: '#ffd24a', textShadow: '0 0 20px #ffb020'}}>
								$
							</div>
						);
					})}
				</>
			) : null}
			<Big top={330} size={96} color={C.red} delay={4}>
				СЛИВ ДАННЫХ
			</Big>
		</AbsoluteFill>
	);
};

const coinP = (t: number) => Math.min(1, Math.max(0, t / 25));

export const Enter: React.FC<SP> = ({dur}) => {
	const f = useCurrentFrame();
	const land = interpolate(f, [0, 9], [0, 1], {...clamp});
	const impact = interpolate(f, [9, 14, 22], [0, 1, 0], clamp);
	const squat = impact * 0.35;
	const flex = interpolate(f, [22, 32], [0, 1], clamp);
	const pose: Pose = {
		l: {sh: 14 + flex * 81, el: -12 + flex * 127},
		r: {sh: 14 + flex * 81, el: -12 + flex * 127},
		flex,
		squat,
		mouth: flex > 0.5 ? 'grin' : 'smirk',
		glow: flex * (0.6 + 0.4 * Math.sin(f / 4)),
		blink: blinkAt(f, 'e'),
	};
	return (
		<AbsoluteFill style={{transform: `translateY(${impact * 18 * Math.sin(f * 3)}px)`}}>
			<GymBg mood="hero" />
			{[...Array(14)].map((_, i) => {
				const a = (i / 14) * Math.PI * 2;
				const p = interpolate(f, [9, 30], [0, 1], clamp);
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: 540 + Math.cos(a) * (120 + p * 360) - 18,
							top: 1340 + Math.sin(a) * (30 + p * 90) * 0.4 - 18,
							width: 36,
							height: 36,
							borderRadius: 18,
							background: 'rgba(200,225,255,0.55)',
							opacity: (1 - p) * (f > 9 ? 1 : 0),
							filter: 'blur(4px)',
						}}
					/>
				);
			})}
			<Place x={540} y={1360 - (1 - land) * 1400}>
				<Character build="hero" id="en" size={620} pose={pose} />
			</Place>
			<AbsoluteFill style={{background: '#fff', opacity: impact * 0.5}} />
			<Big top={250} size={130} color="#fff" delay={24}>
				ХОРЗ
			</Big>
		</AbsoluteFill>
	);
};

export const Lift: React.FC<SP> = () => {
	const f = useCurrentFrame();
	const rep = (1 - Math.cos((Math.max(0, f - 10) / 26) * Math.PI * 2)) / 2;
	const sh = 95 + rep * 60;
	const el = 95 - rep * 80;
	const pose: Pose = {l: {sh, el}, r: {sh, el}, mouth: rep > 0.5 ? 'grit' : 'smirk', shades: true, flex: 0.7, glow: 0.4};
	const fp = fistPos('hero', pose);
	const cnt = useP(0, 12, 140);
	return (
		<AbsoluteFill>
			<GymBg mood="hero" />
			<Place x={540} y={1380}>
				<Character build="hero" id="lf" size={660} pose={pose} front={<Barbell a={fp.l} b={fp.r} label="10 Гбит/с" bend={-8 - rep * 10} />} />
			</Place>
			<div style={{position: 'absolute', top: 250, width: '100%', textAlign: 'center', transform: `scale(${cnt})`}}>
				<div style={{fontFamily: font, fontWeight: 900, fontSize: 60, color: '#bfe8ff'}}>РАЗМИНКА</div>
			</div>
		</AbsoluteFill>
	);
};

const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

export const Always: React.FC<SP> = ({dur}) => {
	const f = useCurrentFrame();
	const curlL = (1 - Math.cos((f / 18) * Math.PI * 2)) / 2;
	const curlR = (1 - Math.cos((f / 18) * Math.PI * 2 + Math.PI)) / 2;
	const pose: Pose = {l: {sh: 10, el: -5 + curlL * 140}, r: {sh: 10, el: -5 + curlR * 140}, flex: Math.max(curlL, curlR), mouth: 'smirk', blink: blinkAt(f, 'al')};
	const fp = fistPos('hero', pose);
	return (
		<AbsoluteFill>
			<GymBg mood="hero" sign={false} />
			<div style={{position: 'absolute', top: 150, left: 90, right: 90, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 14}}>
				{days.map((d, i) => {
					const on = f > 8 + i * (dur * 0.08);
					return (
						<div key={d} style={{background: on ? '#fff' : 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '16px 0', textAlign: 'center', transform: `scale(${on ? 1 : 0.9})`}}>
							<div style={{fontFamily: font, fontWeight: 900, fontSize: 30, color: on ? '#0b1b44' : '#bfd2ff'}}>{d}</div>
							<svg width="44" height="44" viewBox="0 0 24 24" style={{marginTop: 6, opacity: on ? 1 : 0}}>
								<path d="M4 12 L10 18 L20 6" stroke="#1a7cf5" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
						</div>
					);
				})}
			</div>
			<div style={{position: 'absolute', top: 310, width: '100%', textAlign: 'center', fontFamily: font, fontWeight: 900, fontSize: 130, color: '#fff', textShadow: '0 0 30px #7fdcff, 0 0 80px #1a7cf5'}}>
				24/7
			</div>
			<Place x={540} y={1380}>
				<Character
					build="hero"
					id="al"
					size={560}
					pose={pose}
					front={
						<>
							<Dumbbell x={fp.l.x} y={fp.l.y} s={1.3} color="#1a7cf5" />
							<Dumbbell x={fp.r.x} y={fp.r.y} s={1.3} color="#1a7cf5" />
						</>
					}
				/>
			</Place>
		</AbsoluteFill>
	);
};

const EnemyIcon: React.FC<{kind: string}> = ({kind}) => (
	<svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
		{kind === 'skull' && (
			<>
				<path d="M12 2 C 6 2, 4 6, 4 10 C 4 13, 6 14, 7 15 V 19 H 17 V 15 C 18 14, 20 13, 20 10 C 20 6, 18 2, 12 2 Z" />
				<circle cx="9" cy="10" r="2" fill={C.red} />
				<circle cx="15" cy="10" r="2" fill={C.red} />
				<path d="M10 19 V 16 M14 19 V 16" />
			</>
		)}
		{kind === 'eye' && (
			<>
				<path d="M2 12 C 5 6, 19 6, 22 12 C 19 18, 5 18, 2 12 Z" />
				<circle cx="12" cy="12" r="3.5" fill={C.red} />
			</>
		)}
		{kind === 'block' && (
			<>
				<circle cx="12" cy="12" r="9" />
				<path d="M5.6 5.6 L 18.4 18.4" />
			</>
		)}
	</svg>
);

const enemies = [
	{label: 'Хакер', icon: 'skull', from: -1, y: 700, at: 0.12},
	{label: 'Трекер', icon: 'eye', from: 1, y: 860, at: 0.38},
	{label: 'Блок', icon: 'block', from: -1, y: 1000, at: 0.62},
];

export const Fight: React.FC<SP> = ({dur}) => {
	const f = useCurrentFrame();
	let swatL = 0;
	let swatR = 0;
	const out = enemies.map((e) => {
		const hitAt = e.at * dur + 16;
		const tIn = interpolate(f, [e.at * dur, hitAt], [0, 1], clamp);
		const after = f - hitAt;
		const sw = interpolate(f, [hitAt - 6, hitAt, hitAt + 8], [0, 1, 0], clamp);
		if (e.from < 0) swatL = Math.max(swatL, sw);
		else swatR = Math.max(swatR, sw);
		return {...e, tIn, after, hitAt};
	});
	const pose: Pose = {
		l: {sh: 14 + swatL * 100, el: -12 + swatL * 10},
		r: {sh: 14 + swatR * 100, el: -12 + swatR * 10},
		shades: true,
		mouth: 'smirk',
		glow: 0.3,
	};
	return (
		<AbsoluteFill>
			<GymBg mood="hero" />
			<Place x={540} y={1380}>
				<Character build="hero" id="fg" size={640} pose={pose} />
			</Place>
			{out.map((e, i) => {
				if (e.tIn <= 0) return null;
				const x0 = e.from < 0 ? -200 : 1280;
				const xHit = e.from < 0 ? 330 : 750;
				if (e.after < 0) {
					const x = x0 + (xHit - x0) * e.tIn;
					return (
						<div key={i} style={{position: 'absolute', left: x - 90, top: e.y - 90, width: 180, height: 180, borderRadius: 40, background: '#1a0a10', border: `5px solid ${C.red}`, boxShadow: `0 0 40px ${C.red}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `rotate(${Math.sin(f / 3 + i) * 8}deg)`}}>
							<EnemyIcon kind={e.icon} />
							<div style={{fontFamily: font, fontWeight: 900, fontSize: 30, color: '#fff'}}>{e.label}</div>
						</div>
					);
				}
				const p = Math.min(1, e.after / 18);
				return (
					<React.Fragment key={i}>
						{[...Array(10)].map((_, k) => {
							const a = random(`sh${i}${k}`) * Math.PI * 2;
							const d = 60 + random(`sd${i}${k}`) * 260;
							return (
								<div
									key={k}
									style={{
										position: 'absolute',
										left: xHit + Math.cos(a) * d * p + (e.from < 0 ? -1 : 1) * p * 200,
										top: e.y + Math.sin(a) * d * p + p * p * 200,
										width: 30,
										height: 30,
										background: k % 2 ? C.red : '#fff',
										transform: `rotate(${k * 40 + p * 300}deg)`,
										opacity: 1 - p,
									}}
								/>
							);
						})}
						<div style={{position: 'absolute', left: xHit - 120, top: e.y - 150, fontFamily: font, fontWeight: 900, fontSize: 80, color: '#fff', opacity: 1 - p, transform: `scale(${1 + p})`, WebkitTextStroke: '8px #05060b', paintOrder: 'stroke fill'}}>
							БАМ!
						</div>
					</React.Fragment>
				);
			})}
		</AbsoluteFill>
	);
};

export const NoLogs: React.FC<SP> = () => {
	const f = useCurrentFrame();
	const stamp = useP(14, 8, 240);
	return (
		<AbsoluteFill>
			<GymBg mood="hero" />
			<Place x={540} y={1380}>
				<Character build="hero" id="nl" size={680} pose={{...idle(f), mouth: 'shh', brow: -1, blink: blinkAt(f, 'nl'), glow: 0.5}} />
			</Place>
			<div style={{position: 'absolute', left: 690, top: 700, opacity: interpolate(f, [2, 8], [0, 1], clamp)}}>
				<div style={{background: '#fff', borderRadius: 40, padding: '20px 34px', position: 'relative', fontFamily: font, fontWeight: 900, fontSize: 60, color: '#8aa0c8', whiteSpace: 'nowrap'}}>
					бла-бла
					<div style={{position: 'absolute', left: 10, right: 10, top: '50%', height: 10, background: C.red, transform: 'rotate(-8deg)', borderRadius: 5}} />
				</div>
			</div>
			<div
				style={{
					position: 'absolute',
					top: 250,
					left: 120,
					transform: `scale(${3 - 2 * stamp}) rotate(-10deg)`,
					opacity: stamp,
					fontFamily: font,
					fontWeight: 900,
					fontSize: 110,
					color: '#fff',
					border: '10px solid #fff',
					borderRadius: 28,
					padding: '4px 36px',
					boxShadow: '0 0 60px rgba(127,220,255,0.8)',
					background: 'rgba(26,124,245,0.4)',
				}}
			>
				0 ЛОГОВ
			</div>
		</AbsoluteFill>
	);
};

export const Cta: React.FC<SP> = () => {
	const f = useCurrentFrame();
	const card = useP(10, 12, 150);
	const pulse = 1 + 0.05 * Math.sin(f / 5);
	const flex = interpolate(f, [0, 12], [0, 1], clamp);
	return (
		<AbsoluteFill>
			<GymBg mood="hero" />
			<Place x={540} y={1100}>
				<Character
					build="hero"
					id="ct"
					size={540}
					pose={{l: {sh: 14 + flex * 81, el: -12 + flex * 127}, r: {sh: 14 + flex * 81, el: -12 + flex * 127}, flex, mouth: 'grin', glow: 0.7 + 0.3 * Math.sin(f / 4), blink: blinkAt(f, 'ct')}}
				/>
			</Place>
			<div style={{position: 'absolute', top: 1060, left: 110, right: 110, transform: `translateY(${(1 - card) * 300}px)`, opacity: card}}>
				<div style={{background: 'rgba(255,255,255,0.97)', borderRadius: 44, padding: '34px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, boxShadow: '0 30px 90px rgba(0,50,160,0.55)'}}>
					<div style={{display: 'flex', alignItems: 'center', gap: 16}}>
						<svg width="60" height="60" viewBox="0 0 24 24">
							<circle cx="12" cy="12" r="12" fill="#27a7e7" />
							<path d="M5.5 11.8 L17.5 7 L15.5 17.5 L11.6 14.6 L9.8 16.6 L10 13.5 L15.3 8.8 L8.6 12.8Z" fill="#fff" />
						</svg>
						<div style={{fontFamily: font, fontWeight: 900, fontSize: 66, color: '#1a7cf5'}}>@horzvpnbot</div>
					</div>
					<div style={{transform: `scale(${pulse})`, background: 'linear-gradient(180deg,#3aa2ff,#0b5fe8)', color: '#fff', fontFamily: font, fontWeight: 900, fontSize: 50, padding: '26px 70px', borderRadius: 60, boxShadow: '0 14px 40px rgba(11,95,232,0.5)'}}>
						Качаться с Хорзом
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};
