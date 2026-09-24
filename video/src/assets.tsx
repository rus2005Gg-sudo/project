import React from 'react';

type P = {size?: number; style?: React.CSSProperties};

export const Background: React.FC<{t: number}> = ({t}) => (
	<svg width="960" height="540" viewBox="0 0 960 540" style={{position: 'absolute', inset: 0}}>
		<defs>
			<radialGradient id="bgc" cx="50%" cy="42%" r="75%">
				<stop offset="0" stopColor="#ffffff" />
				<stop offset="0.45" stopColor="#dff1ff" />
				<stop offset="1" stopColor="#1f7cf2" />
			</radialGradient>
			<linearGradient id="w1" x1="0" x2="1">
				<stop offset="0" stopColor="#1e6ff0" stopOpacity="0.9" />
				<stop offset="1" stopColor="#7cc8ff" stopOpacity="0.15" />
			</linearGradient>
			<linearGradient id="w2" x1="1" x2="0">
				<stop offset="0" stopColor="#0b5de0" stopOpacity="0.85" />
				<stop offset="1" stopColor="#9fd8ff" stopOpacity="0.1" />
			</linearGradient>
			<filter id="blur8"><feGaussianBlur stdDeviation="8" /></filter>
			<filter id="glowl"><feGaussianBlur stdDeviation="2.5" /></filter>
		</defs>
		<rect width="960" height="540" fill="url(#bgc)" />
		<path
			d={`M0 ${120 + 10 * Math.sin(t * 2)} C 260 ${40 + 12 * Math.sin(t * 2 + 1)}, 420 260, 960 ${60}
			    L960 0 L0 0Z`}
			fill="url(#w2)"
			opacity="0.55"
			filter="url(#blur8)"
		/>
		<path
			d={`M0 ${400 + 12 * Math.sin(t * 1.6)} C 300 ${300 + 14 * Math.sin(t * 1.6 + 2)}, 560 520, 960 ${330 + 10 * Math.sin(t * 1.6)}
			    L960 540 L0 540Z`}
			fill="url(#w1)"
			opacity="0.5"
			filter="url(#blur8)"
		/>
		{[0, 1, 2].map((i) => (
			<path
				key={i}
				d={`M-20 ${150 + i * 40 + 10 * Math.sin(t * 2 + i)} C 300 ${60 + i * 50}, 600 ${280 - i * 30 + 12 * Math.sin(t * 1.5 + i)}, 980 ${90 + i * 60}`}
				stroke="#ffffff"
				strokeWidth={i === 0 ? 2.2 : 1.2}
				fill="none"
				opacity={0.85 - i * 0.2}
				filter="url(#glowl)"
			/>
		))}
		{[0, 1].map((i) => (
			<path
				key={'b' + i}
				d={`M-20 ${470 - i * 40} C 320 ${360 + 12 * Math.sin(t * 2 + i)}, 640 ${520 - i * 20}, 980 ${380 + i * 50 + 10 * Math.sin(t * 1.7 + i)}`}
				stroke="#bff0ff"
				strokeWidth={1.8}
				fill="none"
				opacity={0.8}
				filter="url(#glowl)"
			/>
		))}
	</svg>
);

export const Logo: React.FC<P> = ({size = 160, style}) => (
	<svg width={size} height={size} viewBox="0 0 200 200" style={style}>
		<defs>
			<linearGradient id="lh" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stopColor="#3fd0ff" />
				<stop offset="1" stopColor="#0a5ee8" />
			</linearGradient>
			<linearGradient id="lt" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#ffffff" />
				<stop offset="1" stopColor="#e6f2ff" />
			</linearGradient>
			<filter id="ls" x="-20%" y="-20%" width="140%" height="140%">
				<feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0a5ee8" floodOpacity="0.35" />
			</filter>
		</defs>
		<rect x="10" y="10" width="180" height="180" rx="44" fill="url(#lt)" filter="url(#ls)" />
		<rect x="48" y="40" width="34" height="120" rx="17" fill="url(#lh)" />
		<rect x="118" y="40" width="34" height="120" rx="17" fill="url(#lh)" />
		<path d="M64 106 C 92 106, 106 94, 136 94" stroke="url(#lh)" strokeWidth="26" strokeLinecap="round" fill="none" />
		<path d="M58 60 L58 100" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="6" strokeLinecap="round" />
		<path d="M128 60 L128 72" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="6" strokeLinecap="round" />
	</svg>
);

export const Server: React.FC<P & {t?: number}> = ({size = 220, style, t = 0}) => {
	const unit = (y: number, k: number) => (
		<g key={k} transform={`translate(0 ${y})`}>
			<path d="M40 30 L150 30 L190 10 L80 10Z" fill="#7cc4ff" />
			<path d="M150 30 L190 10 L190 55 L150 75Z" fill="#0b4fc9" />
			<rect x="40" y="30" width="110" height="45" rx="4" fill="url(#sf)" />
			{[0, 1, 2].map((i) => (
				<rect key={i} x={54 + i * 16} y="47" width="11" height="8" rx="3" fill="#bff6ff" opacity={0.6 + 0.4 * Math.abs(Math.sin(t * 6 + i + k))} />
			))}
			<circle cx="136" cy="51" r="4" fill="#bff6ff" />
		</g>
	);
	return (
		<svg width={size} height={size} viewBox="0 0 220 240" style={style}>
			<defs>
				<linearGradient id="sf" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#3d95ff" />
					<stop offset="1" stopColor="#1463e6" />
				</linearGradient>
				<filter id="sg"><feGaussianBlur stdDeviation="3" /></filter>
			</defs>
			<ellipse cx="115" cy="222" rx="90" ry="12" fill="#0a4fc0" opacity="0.25" />
			{[150, 95, 40].map((y, i) => unit(y, i))}
			<ellipse cx="115" cy="140" rx="105" ry="26" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.9" filter="url(#sg)" strokeDasharray="240 200" strokeDashoffset={-t * 300} />
			<ellipse cx="115" cy="140" rx="105" ry="26" fill="none" stroke="#e8fbff" strokeWidth="1.5" strokeDasharray="240 200" strokeDashoffset={-t * 300} />
		</svg>
	);
};

export const Bolt: React.FC<P> = ({size = 120, style}) => (
	<svg width={size} height={size} viewBox="0 0 100 100" style={style}>
		<defs>
			<linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stopColor="#b8f4ff" />
				<stop offset="0.5" stopColor="#35c3ff" />
				<stop offset="1" stopColor="#0a6cf0" />
			</linearGradient>
			<filter id="bgl"><feGaussianBlur stdDeviation="4" /></filter>
		</defs>
		<path d="M58 4 L18 58 L46 58 L38 96 L82 38 L54 38Z" fill="#4fd2ff" filter="url(#bgl)" opacity="0.8" />
		<path d="M58 4 L18 58 L46 58 L38 96 L82 38 L54 38Z" fill="url(#bg1)" stroke="#ffffff" strokeWidth="3" strokeLinejoin="round" />
	</svg>
);

export const Robot: React.FC<P & {t?: number}> = ({size = 220, style, t = 0}) => {
	const blink = Math.sin(t * 5) > 0.97 ? 0.15 : 1;
	return (
		<svg width={size} height={size} viewBox="0 0 200 220" style={style}>
			<defs>
				<linearGradient id="rw" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#ffffff" />
					<stop offset="1" stopColor="#d4e6ff" />
				</linearGradient>
				<radialGradient id="rv" cx="50%" cy="40%" r="70%">
					<stop offset="0" stopColor="#1b2a4a" />
					<stop offset="1" stopColor="#070d1c" />
				</radialGradient>
				<filter id="re"><feGaussianBlur stdDeviation="2.5" /></filter>
			</defs>
			<ellipse cx="100" cy="212" rx="45" ry="7" fill="#0a4fc0" opacity="0.2" />
			<g transform={`rotate(${-20 + 12 * Math.sin(t * 8)} 40 130)`}>
				<rect x="22" y="118" width="30" height="46" rx="15" fill="url(#rw)" stroke="#9cc6ff" strokeWidth="1.5" />
			</g>
			<g transform={`rotate(${20 - 12 * Math.sin(t * 8 + 1)} 160 130)`}>
				<rect x="148" y="118" width="30" height="46" rx="15" fill="url(#rw)" stroke="#9cc6ff" strokeWidth="1.5" />
			</g>
			<rect x="52" y="112" width="96" height="80" rx="34" fill="url(#rw)" stroke="#9cc6ff" strokeWidth="1.5" />
			<text x="100" y="168" textAnchor="middle" fontSize="36" fontWeight="900" fill="#1a7cf5" fontFamily="Montserrat, sans-serif">H</text>
			<rect x="68" y="186" width="24" height="24" rx="10" fill="#2d8cff" />
			<rect x="108" y="186" width="24" height="24" rx="10" fill="#2d8cff" />
			<circle cx="30" cy="70" r="14" fill="#2d8cff" />
			<circle cx="170" cy="70" r="14" fill="#2d8cff" />
			<rect x="28" y="14" width="144" height="108" rx="50" fill="url(#rw)" stroke="#9cc6ff" strokeWidth="1.5" />
			<rect x="44" y="34" width="112" height="70" rx="32" fill="url(#rv)" />
			<g transform={`translate(0 ${38 * (1 - blink)})`}>
				<ellipse cx="78" cy="62" rx="11" ry={11 * blink} fill="#35d2ff" filter="url(#re)" />
				<ellipse cx="122" cy="62" rx="11" ry={11 * blink} fill="#35d2ff" filter="url(#re)" />
				<ellipse cx="78" cy="62" rx="8" ry={8 * blink} fill="#bff4ff" />
				<ellipse cx="122" cy="62" rx="8" ry={8 * blink} fill="#bff4ff" />
			</g>
			<path d="M86 84 Q100 94 114 84" stroke="#35d2ff" strokeWidth="4" strokeLinecap="round" fill="none" />
		</svg>
	);
};

const Tile: React.FC<{bg: string; size: number; children: React.ReactNode; style?: React.CSSProperties}> = ({bg, size, children, style}) => (
	<div
		style={{
			width: size,
			height: size,
			borderRadius: size * 0.26,
			background: bg,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			boxShadow: '0 6px 18px rgba(10,80,200,0.35), inset 0 2px 0 rgba(255,255,255,0.35)',
			...style,
		}}
	>
		{children}
	</div>
);

const blue = 'linear-gradient(145deg,#4fb6ff,#0b5fe8)';

export const icons: Array<(s: number) => React.ReactNode> = [
	(s) => (
		<Tile size={s} bg={blue}>
			<svg width={s * 0.62} height={s * 0.62} viewBox="0 0 24 24">
				<path d="M12 2 L20 5 V11 C20 16 16.5 20 12 22 C7.5 20 4 16 4 11 V5Z" fill="#fff" opacity="0.25" />
				<path d="M12 2 L20 5 V11 C20 16 16.5 20 12 22 C7.5 20 4 16 4 11 V5Z" fill="none" stroke="#fff" strokeWidth="1.8" />
				<path d="M8 12 L11 15 L16 9" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
			</svg>
		</Tile>
	),
	(s) => (
		<Tile size={s} bg={blue}>
			<svg width={s * 0.62} height={s * 0.62} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6">
				<circle cx="12" cy="12" r="9" />
				<ellipse cx="12" cy="12" rx="4" ry="9" />
				<path d="M3 12 H21 M4.5 7.5 H19.5 M4.5 16.5 H19.5" />
			</svg>
		</Tile>
	),
	(s) => (
		<Tile size={s} bg="#0b0b10">
			<svg width={s * 0.58} height={s * 0.58} viewBox="0 0 24 24">
				{[
					['#25f4ee', -0.8, -0.6],
					['#fe2c55', 0.8, 0.6],
					['#ffffff', 0, 0],
				].map(([c, dx, dy]) => (
					<path
						key={c as string}
						transform={`translate(${dx} ${dy})`}
						d="M13 3 H16 C16.3 5.2 17.8 6.7 20 7 V10 C18.5 10 17.1 9.5 16 8.7 V15 A6 6 0 1 1 10 9 V12.2 A2.9 2.9 0 1 0 13 15Z"
						fill={c as string}
					/>
				))}
			</svg>
		</Tile>
	),
	(s) => (
		<Tile size={s} bg="radial-gradient(circle at 30% 107%,#fdf497 0%,#fd5949 45%,#d6249f 60%,#285aeb 90%)">
			<svg width={s * 0.6} height={s * 0.6} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
				<rect x="3" y="3" width="18" height="18" rx="5.5" />
				<circle cx="12" cy="12" r="4.2" />
				<circle cx="17.3" cy="6.7" r="1" fill="#fff" stroke="none" />
			</svg>
		</Tile>
	),
	(s) => (
		<Tile size={s} bg="linear-gradient(145deg,#ff4a4a,#e00000)">
			<svg width={s * 0.52} height={s * 0.52} viewBox="0 0 24 24">
				<path d="M9 7 L17.5 12 L9 17Z" fill="#fff" />
			</svg>
		</Tile>
	),
	(s) => (
		<Tile size={s} bg="linear-gradient(145deg,#4cc3ff,#1d8fe0)">
			<svg width={s * 0.58} height={s * 0.58} viewBox="0 0 24 24">
				<path d="M3 11.5 L20 4.5 L17 19.5 L11.5 15.5 L9 18.5 L9.3 14 L17 7.5 L7.5 13Z" fill="#fff" />
			</svg>
		</Tile>
	),
	(s) => (
		<Tile size={s} bg={blue}>
			<svg width={s * 0.6} height={s * 0.6} viewBox="0 0 24 24">
				<path d="M12 20 C5 15 3 11.5 3 8.5 A4.5 4.5 0 0 1 12 6.5 A4.5 4.5 0 0 1 21 8.5 C21 11.5 19 15 12 20Z" fill="#fff" />
			</svg>
		</Tile>
	),
];

export const Sparkle: React.FC<{size: number; color?: string; style?: React.CSSProperties}> = ({size, color = '#ffffff', style}) => (
	<svg width={size} height={size} viewBox="0 0 24 24" style={style}>
		<path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill={color} />
	</svg>
);
