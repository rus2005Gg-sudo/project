import React from 'react';
import {staticFile} from 'remotion';

export type Arm = {sh: number; el: number};
export type Pose = {
	l: Arm;
	r: Arm;
	flex?: number;
	squat?: number;
	lean?: number;
	blink?: number;
	mouth?: 'smirk' | 'grin' | 'shh' | 'sad' | 'open' | 'grit';
	brow?: number;
	shades?: boolean;
	glow?: number;
};

export type Build = 'hero' | 'skinny';

const OUT = '#0b1430';

const B = {
	hero: {
		skin: ['#f3c7a4', '#d99a73'],
		shoulderX: 118,
		upper: 128,
		fore: 112,
		upperW: 36,
		foreW: 29,
		fist: 34,
		torsoTop: 180,
		torsoBottom: 88,
		shirt: ['#ffffff', '#d7e7ff'],
		trim: '#1a7cf5',
		shorts: ['#1a7cf5', '#0b4fc9'],
		legW: 44,
		head: 1.22,
	},
	skinny: {
		skin: ['#e9dccf', '#bfae9d'],
		shoulderX: 62,
		upper: 122,
		fore: 112,
		upperW: 12,
		foreW: 10,
		fist: 16,
		torsoTop: 74,
		torsoBottom: 64,
		shirt: ['#9aa1b0', '#6f7688'],
		trim: '#5a6173',
		shorts: ['#5a6173', '#434959'],
		legW: 15,
		head: 1.12,
	},
};

const hand = (b: typeof B.hero, a: Arm) => {
	const s = (a.sh * Math.PI) / 180;
	const e = ((a.sh + a.el) * Math.PI) / 180;
	const r = b.fore + b.fist * 0.45;
	return {x: -Math.sin(s) * b.upper - Math.sin(e) * r, y: Math.cos(s) * b.upper + Math.cos(e) * r};
};

export const fistPos = (build: Build, pose: Pose) => {
	const b = B[build];
	const sy = 330 + (pose.squat ?? 0) * 60;
	const l = hand(b, pose.l);
	const r = hand(b, pose.r);
	return {l: {x: 300 - b.shoulderX + l.x, y: sy + l.y}, r: {x: 300 + b.shoulderX - r.x, y: sy + r.y}};
};

const ArmG: React.FC<{b: typeof B.hero; a: Arm; flex: number; id: string}> = ({b, a, flex, id}) => {
	const w = b.upperW;
	const bulge = w * (0.35 + 0.55 * flex);
	const fw = b.foreW;
	return (
		<g transform={`rotate(${a.sh})`}>
			<g transform="scale(-1 1)">
			<path
				d={`M${-w} 0 C ${-w - 6} ${b.upper * 0.35}, ${-w * 0.8} ${b.upper * 0.8}, ${-w * 0.72} ${b.upper}
				    L ${w * 0.72} ${b.upper}
				    C ${w * 0.9 + bulge} ${b.upper * 0.75}, ${w + bulge} ${b.upper * 0.3}, ${w} 0 Z`}
				fill={`url(#${id}skin)`}
				stroke={OUT}
				strokeWidth={5}
				strokeLinejoin="round"
			/>
			{b === B.hero ? (
				<path d={`M${w * 0.25} ${b.upper * 0.25} Q ${w * 0.7 + bulge * 0.6} ${b.upper * 0.5}, ${w * 0.4} ${b.upper * 0.8}`} stroke="#b97a55" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.6} />
			) : null}
			</g>
			<g transform={`translate(0 ${b.upper}) rotate(${a.el})`}>
				<circle r={w * 0.74} fill={`url(#${id}skin)`} stroke={OUT} strokeWidth={5} />
				<path
					d={`M${-fw} 0 C ${-fw - 4} ${b.fore * 0.4}, ${-fw * 0.75} ${b.fore * 0.8}, ${-fw * 0.72} ${b.fore}
					    L ${fw * 0.72} ${b.fore} C ${fw * 0.8} ${b.fore * 0.7}, ${fw + 8} ${b.fore * 0.3}, ${fw} 0 Z`}
					fill={`url(#${id}skin)`}
					stroke={OUT}
					strokeWidth={5}
					strokeLinejoin="round"
				/>
				<circle r={w * 0.72 - 3} fill={`url(#${id}skin)`} />
				<g transform={`translate(0 ${b.fore + b.fist * 0.45})`}>
					<rect x={-b.fist} y={-b.fist * 0.85} width={b.fist * 2} height={b.fist * 1.7} rx={b.fist * 0.6} fill={`url(#${id}skin)`} stroke={OUT} strokeWidth={5} />
					{[-0.45, 0, 0.45].map((k) => (
						<path key={k} d={`M${b.fist * k} ${-b.fist * 0.2} v ${b.fist * 0.55}`} stroke={OUT} strokeWidth={3} opacity={0.45} strokeLinecap="round" />
					))}
				</g>
			</g>
		</g>
	);
};

export const Character: React.FC<{build: Build; pose: Pose; size: number; style?: React.CSSProperties; id: string; label?: string; front?: React.ReactNode}> = ({
	build,
	pose,
	size,
	style,
	id,
	label,
	front,
}) => {
	const b = B[build];
	const hero = build === 'hero';
	const squat = pose.squat ?? 0;
	const sy = 330 + squat * 60;
	const flex = pose.flex ?? 0;
	const blink = pose.blink ?? 1;
	const tw = b.torsoTop;
	const bw = b.torsoBottom;
	const glow = pose.glow ?? 0;
	const mouth = pose.mouth ?? (hero ? 'smirk' : 'sad');
	const brow = pose.brow ?? 0;
	const hy = (hero ? 190 : 205) + squat * 60;

	return (
		<svg width={size} height={size * 1.5} viewBox="0 0 600 900" style={{overflow: 'visible', ...style}}>
			<defs>
				<linearGradient id={`${id}skin`} x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor={b.skin[0]} />
					<stop offset="1" stopColor={b.skin[1]} />
				</linearGradient>
				<linearGradient id={`${id}shirt`} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor={b.shirt[0]} />
					<stop offset="1" stopColor={b.shirt[1]} />
				</linearGradient>
				<linearGradient id={`${id}shorts`} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor={b.shorts[0]} />
					<stop offset="1" stopColor={b.shorts[1]} />
				</linearGradient>
				<radialGradient id={`${id}glow`}>
					<stop offset="0" stopColor="#7fdcff" stopOpacity="0.95" />
					<stop offset="1" stopColor="#7fdcff" stopOpacity="0" />
				</radialGradient>
			</defs>
			<ellipse cx="300" cy="872" rx={hero ? 190 : 110} ry="22" fill="#000" opacity="0.35" />
			<g transform={`rotate(${pose.lean ?? 0} 300 860)`}>
				{/* legs */}
				{[-1, 1].map((s) => {
					const kx = 300 + s * (hero ? 70 : 40) + s * squat * 50;
					return (
						<g key={s}>
							<path
								d={`M${300 + s * (hero ? 55 : 30)} ${640 + squat * 50} L ${kx} ${760 + squat * 30} L ${300 + s * (hero ? 75 : 42)} 840`}
								stroke={OUT}
								strokeWidth={b.legW * 2 + 10}
								strokeLinecap="round"
								strokeLinejoin="round"
								fill="none"
							/>
							<path
								d={`M${300 + s * (hero ? 55 : 30)} ${640 + squat * 50} L ${kx} ${760 + squat * 30} L ${300 + s * (hero ? 75 : 42)} 840`}
								stroke={`url(#${id}skin)`}
								strokeWidth={b.legW * 2}
								strokeLinecap="round"
								strokeLinejoin="round"
								fill="none"
							/>
							<path
								d={`M${300 + s * (hero ? 75 : 42) - (hero ? 52 : 30)} 870 Q ${300 + s * (hero ? 75 : 42) - (hero ? 50 : 30)} 820, ${300 + s * (hero ? 75 : 42)} 822 Q ${300 + s * (hero ? 75 : 42) + (hero ? 60 : 36)} 830, ${300 + s * (hero ? 75 : 42) + (hero ? 58 : 36)} 870 Z`}
								transform={s < 0 ? `translate(${2 * (300 + s * (hero ? 75 : 42))} 0) scale(-1 1)` : undefined}
								fill="#fff"
								stroke={OUT}
								strokeWidth={5}
							/>
							<path
								d={`M${300 + s * (hero ? 75 : 42) - 30} 858 h 60`}
								stroke={hero ? '#1a7cf5' : '#8a91a0'}
								strokeWidth={8}
								strokeLinecap="round"
							/>
						</g>
					);
				})}
				{/* shorts */}
				<path
					d={`M${300 - bw - 12} ${560 + squat * 58} L ${300 + bw + 12} ${560 + squat * 58} L ${300 + bw + (hero ? 40 : 18)} ${690 + squat * 45} L ${310} ${690 + squat * 45} L 300 ${625 + squat * 50} L 290 ${690 + squat * 45} L ${300 - bw - (hero ? 40 : 18)} ${690 + squat * 45} Z`}
					fill={`url(#${id}shorts)`}
					stroke={OUT}
					strokeWidth={5}
					strokeLinejoin="round"
				/>
				{/* torso */}
				<g transform={`translate(0 ${squat * 60})`}>
					<path
						d={`M${300 - tw} 300 C ${300 - tw - 10} 380, ${300 - bw - 30} 470, ${300 - bw} 575 L ${300 + bw} 575 C ${300 + bw + 30} 470, ${300 + tw + 10} 380, ${300 + tw} 300 C ${300 + tw * 0.6} 262, ${300 - tw * 0.6} 262, ${300 - tw} 300 Z`}
						fill={`url(#${id}skin)`}
						stroke={OUT}
						strokeWidth={6}
						strokeLinejoin="round"
					/>
					{/* tank top */}
					<path
						d={`M${300 - tw * 0.62} 290 L ${300 - tw * 0.42} 290 C ${300 - tw * 0.32} 350, ${300 + tw * 0.32} 350, ${300 + tw * 0.42} 290 L ${300 + tw * 0.62} 290
						    C ${300 + tw * 0.7} 360, ${300 + bw + 25} 440, ${300 + bw + 6} 582 L ${300 - bw - 6} 582 C ${300 - bw - 25} 440, ${300 - tw * 0.7} 360, ${300 - tw * 0.62} 290 Z`}
						fill={`url(#${id}shirt)`}
						stroke={OUT}
						strokeWidth={6}
						strokeLinejoin="round"
					/>
					<path d={`M${300 - tw * 0.42} 293 C ${300 - tw * 0.32} 352, ${300 + tw * 0.32} 352, ${300 + tw * 0.42} 293`} stroke={b.trim} strokeWidth={8} fill="none" />
					{hero ? (
						<>
							<path d="M300 360 Q 250 420, 205 400" stroke="#9fb8d8" strokeWidth={5} fill="none" strokeLinecap="round" />
							<path d="M300 360 Q 350 420, 395 400" stroke="#9fb8d8" strokeWidth={5} fill="none" strokeLinecap="round" />
							{[470, 510].map((y) => (
								<path key={y} d={`M268 ${y} h 64`} stroke="#b7cbe6" strokeWidth={4} strokeLinecap="round" />
							))}
							<path d="M300 440 v 120" stroke="#b7cbe6" strokeWidth={4} />
							<circle cx="300" cy="392" r={95} fill={`url(#${id}glow)`} opacity={glow} />
							<g transform="translate(300 392)">
								<rect x={-62} y={-62} width={124} height={124} rx={34} fill="#fff" stroke="#cfe0ff" strokeWidth={3} />
								<image href={staticFile('reel/logo.png')} x={-46} y={-48} width={92} height={96} />
							</g>
						</>
					) : (
						<text x="300" y="470" textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={26} fill="#3d4352">
							{label ?? 'FREE'}
						</text>
					)}
				</g>
				{/* neck + traps */}
				<g transform={`translate(0 ${squat * 60})`}>
					{hero ? (
						<path d="M262 250 L 250 292 C 220 300, 200 296, 185 300 L 415 300 C 400 296, 380 300, 350 292 L 338 250 Z" fill={`url(#${id}skin)`} stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
					) : (
						<rect x="284" y="240" width="32" height="60" fill={`url(#${id}skin)`} stroke={OUT} strokeWidth={5} />
					)}
				</g>
				{/* arms */}
				{hero ? (
					<>
						<circle cx={300 - b.shoulderX} cy={sy - 2} r={52} fill={`url(#${id}skin)`} stroke={OUT} strokeWidth={6} />
						<circle cx={300 + b.shoulderX} cy={sy - 2} r={52} fill={`url(#${id}skin)`} stroke={OUT} strokeWidth={6} />
					</>
				) : null}
				<g transform={`translate(${300 - b.shoulderX} ${sy})`}>
					<ArmG b={b} a={pose.l} flex={flex} id={id} />
				</g>
				<g transform={`translate(${300 + b.shoulderX} ${sy}) scale(-1 1)`}>
					<ArmG b={b} a={pose.r} flex={flex} id={id} />
				</g>
				{hero ? (
					<>
						<circle cx={300 - b.shoulderX} cy={sy - 2} r={46} fill={`url(#${id}skin)`} />
						<circle cx={300 + b.shoulderX} cy={sy - 2} r={46} fill={`url(#${id}skin)`} />
						<path d={`M${300 - b.shoulderX - 30} ${sy - 30} q 20 -14 44 -4`} stroke="#fff" strokeOpacity={0.4} strokeWidth={6} fill="none" strokeLinecap="round" />
						<path d={`M${300 + b.shoulderX + 30} ${sy - 30} q -20 -14 -44 -4`} stroke="#fff" strokeOpacity={0.4} strokeWidth={6} fill="none" strokeLinecap="round" />
					</>
				) : null}
				{/* head */}
				<g transform={`translate(300 ${hy}) scale(${b.head})`}>
					<ellipse cx="-70" cy="10" rx="16" ry="22" fill={`url(#${id}skin)`} stroke={OUT} strokeWidth={5} />
					<ellipse cx="70" cy="10" rx="16" ry="22" fill={`url(#${id}skin)`} stroke={OUT} strokeWidth={5} />
					<path
						d={hero ? 'M-72 -30 C -72 -95, 72 -95, 72 -30 L 70 25 C 66 62, 34 78, 0 78 C -34 78, -66 62, -70 25 Z' : 'M-62 -30 C -62 -90, 62 -90, 62 -30 L 58 25 C 52 62, 26 80, 0 80 C -26 80, -52 62, -58 25 Z'}
						fill={`url(#${id}skin)`}
						stroke={OUT}
						strokeWidth={6}
					/>
					{hero ? (
						<>
							<path d="M-74 -34 C -74 -100, 74 -100, 74 -34 C 50 -58, -50 -58, -74 -34 Z" fill="#1d1f2b" stroke={OUT} strokeWidth={5} />
							<path d="M-74 -40 C -40 -54, 40 -54, 74 -40 L 74 -24 C 40 -38, -40 -38, -74 -24 Z" fill="#1a7cf5" stroke={OUT} strokeWidth={4} />
							<path d="M62 -34 l 30 -10 l -6 22 Z" fill="#1a7cf5" stroke={OUT} strokeWidth={4} strokeLinejoin="round" />
						</>
					) : (
						<path d="M-60 -40 C -50 -92, 50 -92, 60 -40 C 40 -60, 20 -48, 0 -62 C -20 -48, -40 -60, -60 -40 Z" fill="#6b5a4a" stroke={OUT} strokeWidth={5} />
					)}
					{/* brows */}
					<path d={`M-44 ${-18 - brow * 4} L -14 ${-12 + (hero ? 4 : -6) + brow * 3}`} stroke={OUT} strokeWidth={8} strokeLinecap="round" />
					<path d={`M44 ${-18 - brow * 4} L 14 ${-12 + (hero ? 4 : -6) + brow * 3}`} stroke={OUT} strokeWidth={8} strokeLinecap="round" />
					{/* eyes */}
					{pose.shades ? (
						<g>
							<path d="M-58 -6 H 58 V 4 C 56 26, 16 28, 8 6 H -8 C -16 28, -56 26, -58 4 Z" fill="#0b1430" stroke={OUT} strokeWidth={4} />
							<path d="M-46 0 l 18 0" stroke="#7fdcff" strokeWidth={5} strokeLinecap="round" />
							<path d="M22 0 l 18 0" stroke="#7fdcff" strokeWidth={5} strokeLinecap="round" />
						</g>
					) : (
						<g>
							<ellipse cx="-28" cy="4" rx="11" ry={12 * blink} fill={OUT} />
							<ellipse cx="28" cy="4" rx="11" ry={12 * blink} fill={OUT} />
							{blink > 0.5 ? (
								<>
									<circle cx="-24" cy="0" r="3.5" fill="#fff" />
									<circle cx="32" cy="0" r="3.5" fill="#fff" />
								</>
							) : null}
							{!hero ? (
								<>
									<circle cx="-28" cy="4" r="22" fill="none" stroke={OUT} strokeWidth={4} />
									<circle cx="28" cy="4" r="22" fill="none" stroke={OUT} strokeWidth={4} />
									<path d="M-6 4 h 12" stroke={OUT} strokeWidth={4} />
								</>
							) : null}
						</g>
					)}
					{/* nose */}
					<path d="M0 14 q -8 16 2 20" stroke="#b97a55" strokeWidth={4} fill="none" strokeLinecap="round" />
					{/* mouth */}
					{mouth === 'smirk' && <path d="M-22 48 Q 4 60, 28 42" stroke={OUT} strokeWidth={6} fill="none" strokeLinecap="round" />}
					{mouth === 'grin' && <path d="M-30 42 Q 0 76, 30 42 Z" fill="#fff" stroke={OUT} strokeWidth={5} strokeLinejoin="round" />}
					{mouth === 'grit' && (
						<g>
							<rect x="-30" y="38" width="60" height="22" rx="8" fill="#fff" stroke={OUT} strokeWidth={5} />
							<path d="M-30 49 h 60 M-10 38 v 22 M10 38 v 22" stroke={OUT} strokeWidth={3} />
						</g>
					)}
					{mouth === 'shh' && <ellipse cx="0" cy="50" rx="10" ry="8" fill={OUT} />}
					{mouth === 'sad' && <path d="M-20 56 Q 0 40, 20 56" stroke={OUT} strokeWidth={6} fill="none" strokeLinecap="round" />}
					{mouth === 'open' && <ellipse cx="0" cy="52" rx="16" ry="18" fill="#5a1a22" stroke={OUT} strokeWidth={5} />}
					{hero ? <path d="M-40 60 Q 0 90, 40 60" stroke="#b97a55" strokeWidth={3} fill="none" opacity={0.5} /> : null}
				</g>
				{front}
			</g>
		</svg>
	);
};
