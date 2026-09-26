import React from 'react';
import {staticFile} from 'remotion';

export type RPose = {
	armL?: number;
	armR?: number;
	wave?: number;
	tilt?: number;
	eyes?: 'happy' | 'round' | 'wink';
	blink?: number;
	bob?: number;
};

const OUT = '#0d2a6b';

const Arm: React.FC<{rot: number; wave?: number; id: string}> = ({rot, wave = 0, id}) => (
	<g transform={`rotate(${rot})`}>
		<path d="M-26 0 C -30 60, -24 110, -20 130 L 20 130 C 24 110, 30 60, 26 0 Z" fill={`url(#${id}w)`} stroke="#c9dbf5" strokeWidth={3} />
		<rect x="-24" y="52" width="48" height="22" rx="10" fill="#1a7cf5" />
		<g transform={`translate(0 140) rotate(${wave})`}>
			<ellipse cx="0" cy="18" rx="34" ry="38" fill={`url(#${id}w)`} stroke="#c9dbf5" strokeWidth={3} />
			<ellipse cx="-30" cy="4" rx="13" ry="18" fill={`url(#${id}w)`} stroke="#c9dbf5" strokeWidth={3} transform="rotate(-30 -30 4)" />
		</g>
	</g>
);

export const Robot: React.FC<{pose?: RPose; size: number; id: string; style?: React.CSSProperties}> = ({pose = {}, size, id, style}) => {
	const {armL = 18, armR = 18, wave = 0, tilt = 0, eyes = 'happy', blink = 1, bob = 0} = pose;
	return (
		<svg width={size} height={size * 1.25} viewBox="0 0 600 750" style={{overflow: 'visible', ...style}}>
			<defs>
				<linearGradient id={`${id}w`} x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor="#ffffff" />
					<stop offset="0.6" stopColor="#eef4fd" />
					<stop offset="1" stopColor="#c8daf4" />
				</linearGradient>
				<radialGradient id={`${id}v`} cx="40%" cy="30%" r="80%">
					<stop offset="0" stopColor="#1f2d52" />
					<stop offset="1" stopColor="#050a18" />
				</radialGradient>
				<linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#3aa2ff" />
					<stop offset="1" stopColor="#0b5fe8" />
				</linearGradient>
				<filter id={`${id}g`} x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation="6" />
				</filter>
				<filter id={`${id}s`} x="-30%" y="-30%" width="160%" height="160%">
					<feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#0b5fe8" floodOpacity="0.25" />
				</filter>
			</defs>
			<ellipse cx="300" cy="735" rx="150" ry="16" fill="#0b5fe8" opacity={0.15} />
			<g transform={`translate(0 ${bob})`} filter={`url(#${id}s)`}>
				{/* legs */}
				<rect x="228" y="610" width="56" height="90" rx="26" fill={`url(#${id}w)`} stroke="#c9dbf5" strokeWidth={3} />
				<rect x="316" y="610" width="56" height="90" rx="26" fill={`url(#${id}w)`} stroke="#c9dbf5" strokeWidth={3} />
				<rect x="222" y="672" width="68" height="30" rx="14" fill={`url(#${id}b)`} />
				<rect x="310" y="672" width="68" height="30" rx="14" fill={`url(#${id}b)`} />
				{/* arms back */}
				<g transform="translate(190 430)">
					<Arm rot={armL} id={id} />
				</g>
				<g transform="translate(410 430) scale(-1 1)">
					<Arm rot={armR} wave={wave} id={id} />
				</g>
				{/* body */}
				<path d="M200 420 C 200 390, 400 390, 400 420 L 392 600 C 390 640, 210 640, 208 600 Z" fill={`url(#${id}w)`} stroke="#c9dbf5" strokeWidth={3} />
				<rect x="250" y="398" width="100" height="26" rx="12" fill={`url(#${id}b)`} />
				<image href={staticFile('reel/logo.png')} x="248" y="455" width="104" height="108" />
				{/* head */}
				<g transform={`rotate(${tilt} 300 380)`}>
					<rect x="276" y="360" width="48" height="40" rx="12" fill="#1a3a7a" />
					<ellipse cx="128" cy="230" rx="34" ry="62" fill={`url(#${id}b)`} />
					<ellipse cx="472" cy="230" rx="34" ry="62" fill={`url(#${id}b)`} />
					<ellipse cx="128" cy="230" rx="16" ry="36" fill="#7fe3ff" opacity={0.7} />
					<ellipse cx="472" cy="230" rx="16" ry="36" fill="#7fe3ff" opacity={0.7} />
					<rect x="140" y="90" width="320" height="285" rx="130" fill={`url(#${id}w)`} stroke="#c9dbf5" strokeWidth={3} />
					<path d="M200 120 Q 300 88, 400 120" stroke="#fff" strokeWidth={14} strokeLinecap="round" fill="none" opacity={0.9} />
					<rect x="172" y="150" width="256" height="180" rx="88" fill={`url(#${id}v)`} />
					<path d="M205 175 Q 260 158, 320 168" stroke="#ffffff" strokeOpacity={0.18} strokeWidth={10} strokeLinecap="round" fill="none" />
					{/* eyes */}
					{[245, 355].map((x, i) => {
						const kind = eyes === 'wink' && i === 1 ? 'happy' : eyes;
						return (
							<g key={x}>
								{kind === 'round' ? (
									<>
										<ellipse cx={x} cy={240} rx={24} ry={30 * blink} fill="#35d7ff" filter={`url(#${id}g)`} />
										<ellipse cx={x} cy={240} rx={20} ry={26 * blink} fill="#bff4ff" />
									</>
								) : (
									<>
										<path d={`M${x - 30} ${252} Q ${x} ${220 - 10 * blink}, ${x + 30} ${252}`} stroke="#35d7ff" strokeWidth={20} strokeLinecap="round" fill="none" filter={`url(#${id}g)`} />
										<path d={`M${x - 30} ${252} Q ${x} ${220 - 10 * blink}, ${x + 30} ${252}`} stroke="#bff4ff" strokeWidth={12} strokeLinecap="round" fill="none" />
									</>
								)}
							</g>
						);
					})}
					<path d="M275 290 Q 300 304, 325 290" stroke="#35d7ff" strokeWidth={8} strokeLinecap="round" fill="none" opacity={eyes === 'round' ? 0.9 : 0} />
				</g>
			</g>
		</svg>
	);
};
