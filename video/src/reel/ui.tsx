import React from 'react';
import {AbsoluteFill, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/800.css';

export const font = 'Montserrat, sans-serif';
export const mono = '"JetBrains Mono", monospace';
export const C = {
	bg: '#05060b',
	red: '#ff2d55',
	cyan: '#19e3ff',
	green: '#3dff8a',
	blue: '#1a7cf5',
	text: '#f2f5ff',
	dim: '#8a93b2',
};
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const useSpring = (delay = 0, damping = 14, stiffness = 140) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	return spring({frame: f - delay, fps, config: {damping, stiffness}});
};

export const Pop: React.FC<{delay?: number; children: React.ReactNode; style?: React.CSSProperties; from?: 'up' | 'left' | 'right' | 'scale'}> = ({
	delay = 0,
	children,
	style,
	from = 'up',
}) => {
	const p = useSpring(delay);
	const tr =
		from === 'up'
			? `translateY(${(1 - p) * 80}px)`
			: from === 'left'
				? `translateX(${(p - 1) * 200}px)`
				: from === 'right'
					? `translateX(${(1 - p) * 200}px)`
					: `scale(${0.4 + 0.6 * p})`;
	return <div style={{opacity: Math.min(1, p * 1.4), transform: tr, ...style}}>{children}</div>;
};

export const DarkBg: React.FC<{tint?: string}> = ({tint = '255,45,85'}) => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
			<div
				style={{
					position: 'absolute',
					inset: -200,
					background: `radial-gradient(circle at 50% ${30 + 5 * Math.sin(f / 40)}%, rgba(${tint},0.22), rgba(0,0,0,0) 55%),
					radial-gradient(circle at 80% 90%, rgba(25,227,255,0.12), rgba(0,0,0,0) 50%)`,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					backgroundImage:
						'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
					backgroundSize: '60px 60px',
					backgroundPosition: `0 ${(f * 1.5) % 60}px`,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.25) 0px, rgba(0,0,0,0.25) 2px, transparent 2px, transparent 5px)',
					opacity: 0.5,
				}}
			/>
		</AbsoluteFill>
	);
};

export const BrandBg: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / 30;
	return (
		<AbsoluteFill style={{background: 'linear-gradient(180deg,#0b4fd8 0%,#1a8cff 45%,#dff1ff 100%)', overflow: 'hidden'}}>
			<svg width="1080" height="1920" style={{position: 'absolute'}}>
				<defs>
					<filter id="bb"><feGaussianBlur stdDeviation="3" /></filter>
				</defs>
				{[0, 1, 2, 3].map((i) => (
					<path
						key={i}
						d={`M-40 ${700 + i * 180 + 30 * Math.sin(t * 1.5 + i)} C 300 ${520 + i * 170}, 700 ${900 + i * 120 + 40 * Math.sin(t + i)}, 1120 ${640 + i * 200}`}
						stroke="#ffffff"
						strokeWidth={i === 0 ? 4 : 2}
						fill="none"
						opacity={0.55 - i * 0.1}
						filter="url(#bb)"
					/>
				))}
			</svg>
			<div
				style={{
					position: 'absolute',
					left: 540 - 500,
					top: 560 - 500,
					width: 1000,
					height: 1000,
					borderRadius: '50%',
					background: 'radial-gradient(circle, rgba(255,255,255,0.45), rgba(255,255,255,0) 65%)',
				}}
			/>
		</AbsoluteFill>
	);
};

export const Glitch: React.FC<{children: string; size: number; color?: string; seed: string; strength?: number}> = ({
	children,
	size,
	color = C.text,
	seed,
	strength = 1,
}) => {
	const f = useCurrentFrame();
	const on = random(`${seed}${Math.floor(f / 3)}`) < 0.35 * strength;
	const dx = on ? (random(`${seed}x${f}`) - 0.5) * 24 * strength : 0;
	const base: React.CSSProperties = {
		fontFamily: font,
		fontWeight: 900,
		fontSize: size,
		lineHeight: 1,
		letterSpacing: -2,
		textAlign: 'center',
		whiteSpace: 'nowrap',
	};
	return (
		<div style={{position: 'relative'}}>
			<div style={{...base, color: C.cyan, position: 'absolute', inset: 0, transform: `translate(${-dx - 4}px,0)`, opacity: 0.8, mixBlendMode: 'screen'}}>
				{children}
			</div>
			<div style={{...base, color: C.red, position: 'absolute', inset: 0, transform: `translate(${dx + 4}px,0)`, opacity: 0.8, mixBlendMode: 'screen'}}>
				{children}
			</div>
			<div style={{...base, color, position: 'relative', transform: `translate(${dx / 2}px,0)`}}>{children}</div>
		</div>
	);
};

export const Card: React.FC<{children: React.ReactNode; style?: React.CSSProperties; glow?: string}> = ({children, style, glow = '255,45,85'}) => (
	<div
		style={{
			background: 'linear-gradient(180deg, rgba(22,26,40,0.95), rgba(12,14,24,0.95))',
			border: `2px solid rgba(${glow},0.45)`,
			borderRadius: 32,
			boxShadow: `0 0 60px rgba(${glow},0.18), inset 0 1px 0 rgba(255,255,255,0.08)`,
			...style,
		}}
	>
		{children}
	</div>
);

export const Logo: React.FC<{size: number; style?: React.CSSProperties}> = ({size, style}) => (
	<Img src={staticFile('reel/logo.png')} style={{width: size, height: 'auto', ...style}} />
);

export const Tag: React.FC<{children: React.ReactNode; color?: string; size?: number}> = ({children, color = C.red, size = 30}) => (
	<span
		style={{
			fontFamily: font,
			fontWeight: 800,
			fontSize: size,
			color,
			border: `2px solid ${color}`,
			background: `${color}22`,
			borderRadius: 14,
			padding: '6px 14px',
			whiteSpace: 'nowrap',
		}}
	>
		{children}
	</span>
);

export const Shake: React.FC<{amount: number; children: React.ReactNode}> = ({amount, children}) => {
	const f = useCurrentFrame();
	const x = (random(`sx${f}`) - 0.5) * amount;
	const y = (random(`sy${f}`) - 0.5) * amount;
	return <AbsoluteFill style={{transform: `translate(${x}px,${y}px)`}}>{children}</AbsoluteFill>;
};

export const fadeIn = (f: number, d = 6) => interpolate(f, [0, d], [0, 1], clamp);
