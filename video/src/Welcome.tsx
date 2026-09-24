import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import {Background, Bolt, Logo, Robot, Server, Sparkle, icons} from './assets';

const fontFamily = 'Montserrat, sans-serif';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const S = {
	logo: [0, 21],
	server: [21, 51],
	bolt: [51, 78],
	robot: [78, 111],
	final: [111, 150],
} as const;

const sceneOpacity = (f: number, [a, b]: readonly [number, number], last = false) =>
	interpolate(f, [a, a + 4, b - 4, b], [0, 1, 1, last ? 1 : 0], clamp);

const Pill: React.FC<{children: React.ReactNode; size?: number; style?: React.CSSProperties; light?: boolean}> = ({
	children,
	size = 44,
	style,
	light,
}) => (
	<div
		style={{
			fontFamily,
			fontWeight: 900,
			fontSize: size,
			lineHeight: 1.05,
			color: light ? '#0d5fe6' : '#fff',
			padding: `${size * 0.32}px ${size * 0.6}px`,
			borderRadius: size * 0.6,
			background: light ? 'linear-gradient(180deg,#ffffff,#e4f1ff)' : 'linear-gradient(180deg,#3aa2ff,#0b5fe8)',
			boxShadow: '0 10px 30px rgba(11,95,232,0.4), inset 0 2px 0 rgba(255,255,255,0.45)',
			textAlign: 'center',
			whiteSpace: 'nowrap',
			...style,
		}}
	>
		{children}
	</div>
);

const Glow: React.FC<{x: number; y: number; r: number; o: number; color?: string}> = ({x, y, r, o, color = '120,210,255'}) => (
	<div
		style={{
			position: 'absolute',
			left: x - r,
			top: y - r,
			width: r * 2,
			height: r * 2,
			borderRadius: '50%',
			background: `radial-gradient(circle, rgba(${color},${o}) 0%, rgba(${color},0) 70%)`,
		}}
	/>
);

const LogoScene: React.FC<{f: number}> = ({f}) => {
	const scale = interpolate(f, [0, 12, 21], [0.8, 1.05, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: sceneOpacity(f, S.logo)}}>
			<Glow x={480} y={230} r={210} o={0.9 * interpolate(f, [0, 12], [0, 1], clamp)} color="255,255,255" />
			<div style={{transform: `scale(${scale})`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
				<Logo size={220} />
				<div style={{fontFamily, fontWeight: 900, fontSize: 64, color: '#0b1b44', letterSpacing: -1}}>
					Horz<span style={{color: '#0d62ea'}}>VPN</span>
				</div>
			</div>
		</AbsoluteFill>
	);
};

const ServerScene: React.FC<{f: number; fps: number}> = ({f, fps}) => {
	const l = f - S.server[0];
	const p = spring({frame: l, fps, config: {damping: 14, stiffness: 140}});
	const text = spring({frame: l - 6, fps, config: {damping: 13}});
	return (
		<AbsoluteFill style={{opacity: sceneOpacity(f, S.server)}}>
			{[0, 1, 2, 3, 4, 5].map((i) => {
				const x = interpolate(l, [0, 20], [-200, 900], clamp) + ((i * 97) % 160);
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: x - 300,
							top: 150 + i * 42,
							width: 260 - i * 20,
							height: 4,
							borderRadius: 2,
							background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.95))',
							boxShadow: '0 0 10px rgba(120,220,255,0.9)',
						}}
					/>
				);
			})}
			<Glow x={260} y={290} r={200} o={0.7 * p} />
			<div
				style={{
					position: 'absolute',
					left: interpolate(p, [0, 1], [-60, 130]),
					top: interpolate(p, [0, 1], [460, 150]),
					transform: `rotate(${interpolate(p, [0, 1], [-12, 0])}deg)`,
				}}
			>
				<Server size={270} t={l / fps} />
			</div>
			<div
				style={{
					position: 'absolute',
					left: 440,
					top: 200,
					transform: `translateX(${(1 - text) * 80}px)`,
					opacity: Math.min(1, text * 1.3),
				}}
			>
				<Pill size={50}>
					Быстрый
					<br />и стабильный!
				</Pill>
			</div>
		</AbsoluteFill>
	);
};

const BoltScene: React.FC<{f: number; fps: number}> = ({f, fps}) => {
	const l = f - S.bolt[0];
	const z = interpolate(l, [0, 7, 11], [2.6, 0.92, 1], {...clamp, easing: Easing.out(Easing.quad)});
	const pulse = interpolate(l, [5, 20], [0, 1], clamp);
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: sceneOpacity(f, S.bolt)}}>
			<div
				style={{
					position: 'absolute',
					left: 480 - 200 * (0.3 + pulse),
					top: 270 - 200 * (0.3 + pulse),
					width: 400 * (0.3 + pulse),
					height: 400 * (0.3 + pulse),
					borderRadius: '50%',
					border: '6px solid rgba(255,255,255,0.9)',
					boxShadow: '0 0 40px rgba(90,210,255,0.9), inset 0 0 30px rgba(90,210,255,0.7)',
					opacity: 1 - pulse,
				}}
			/>
			<Glow x={480} y={270} r={260} o={0.9 * (1 - pulse * 0.4)} color="255,255,255" />
			<div style={{transform: `scale(${z})`, display: 'flex', alignItems: 'center', gap: 4}}>
				<Bolt size={150} style={{transform: `rotate(${Math.sin(l * 0.8) * 3}deg)`}} />
				<div
					style={{
						fontFamily,
						fontWeight: 900,
						fontSize: 128,
						letterSpacing: -4,
						background: 'linear-gradient(180deg,#39b6ff,#0a4fd8)',
						WebkitBackgroundClip: 'text',
						color: 'transparent',
						filter: 'drop-shadow(0 6px 12px rgba(10,80,220,0.35))',
					}}
				>
					10
				</div>
				<div style={{fontFamily, fontWeight: 900, fontSize: 52, color: '#0b3fb0', lineHeight: 1, marginLeft: 10}}>
					Гбит
					<br />
					/сек
				</div>
			</div>
		</AbsoluteFill>
	);
};

const RobotScene: React.FC<{f: number; fps: number}> = ({f, fps}) => {
	const l = f - S.robot[0];
	const p = spring({frame: l, fps, config: {damping: 11, stiffness: 120}});
	const hop = Math.abs(Math.sin((l / fps) * Math.PI * 2.4)) * -14 * interpolate(l, [8, 14], [0, 1], clamp);
	const text = spring({frame: l - 7, fps, config: {damping: 13}});
	return (
		<AbsoluteFill style={{opacity: sceneOpacity(f, S.robot)}}>
			<Glow x={680} y={280} r={200} o={0.8 * p} color="255,255,255" />
			{[
				[560, 130, 30, '#ffffff'],
				[820, 110, 22, '#ffd54a'],
				[850, 380, 28, '#7fdcff'],
				[570, 400, 18, '#ffffff'],
			].map(([x, y, s, c], i) => (
				<Sparkle
					key={i}
					size={(s as number) * interpolate(l, [6 + i * 3, 12 + i * 3], [0, 1], clamp)}
					color={c as string}
					style={{position: 'absolute', left: x as number, top: y as number, transform: `rotate(${l * 3}deg)`}}
				/>
			))}
			<div
				style={{
					position: 'absolute',
					left: interpolate(p, [0, 1], [1000, 575]),
					top: 135 + hop,
					transform: `rotate(${interpolate(p, [0, 1], [25, 0])}deg)`,
				}}
			>
				<Robot size={250} t={l / fps} />
			</div>
			<div
				style={{
					position: 'absolute',
					left: 60,
					top: 205,
					transform: `translateX(${(text - 1) * 80}px)`,
					opacity: Math.min(1, text * 1.3),
				}}
			>
				<Pill size={46} light>
					VPN с<br />
					AI-помощником
				</Pill>
			</div>
		</AbsoluteFill>
	);
};

const FinalScene: React.FC<{f: number; fps: number}> = ({f, fps}) => {
	const l = f - S.final[0];
	const head = spring({frame: l, fps, config: {damping: 14}});
	const glow = interpolate(l, [26, 32, 39], [0, 1, 0.6], clamp);
	const tag = spring({frame: l - 20, fps, config: {damping: 14}});
	return (
		<AbsoluteFill style={{opacity: sceneOpacity(f, S.final, true)}}>
			<Glow x={480} y={270} r={420} o={0.75 * glow} color="255,255,255" />
			<div
				style={{
					position: 'absolute',
					top: 52,
					width: '100%',
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					gap: 18,
					transform: `translateY(${(1 - head) * -40}px)`,
					opacity: head,
				}}
			>
				<Logo size={110} />
				<div style={{fontFamily, fontWeight: 900, fontSize: 72, color: '#0b1b44', letterSpacing: -1}}>
					Horz<span style={{color: '#0d62ea'}}>VPN</span>
				</div>
			</div>
			<div style={{position: 'absolute', top: 222, width: '100%', display: 'flex', justifyContent: 'center', gap: 20}}>
				{icons.map((ic, i) => {
					const s = spring({frame: l - 3 - i * 2.5, fps, config: {damping: 10, stiffness: 180}});
					return (
						<div
							key={i}
							style={{
								transform: `scale(${s}) translateY(${(1 - s) * 30}px)`,
								filter: glow > 0 ? `drop-shadow(0 0 ${14 * glow}px rgba(120,220,255,${glow}))` : undefined,
							}}
						>
							{ic(88)}
						</div>
					);
				})}
			</div>
			<div
				style={{
					position: 'absolute',
					top: 382,
					width: '100%',
					display: 'flex',
					justifyContent: 'center',
					transform: `scale(${0.8 + 0.2 * tag})`,
					opacity: tag,
				}}
			>
				<Pill size={33}>Быстро. Безопасно. Без ограничений.</Pill>
			</div>
		</AbsoluteFill>
	);
};

export const Welcome: React.FC = () => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	return (
		<AbsoluteFill style={{background: '#dff1ff', overflow: 'hidden'}}>
			<Background t={f / fps} />
			{f < S.logo[1] && <LogoScene f={f} />}
			{f >= S.server[0] && f < S.server[1] && <ServerScene f={f} fps={fps} />}
			{f >= S.bolt[0] && f < S.bolt[1] && <BoltScene f={f} fps={fps} />}
			{f >= S.robot[0] && f < S.robot[1] && <RobotScene f={f} fps={fps} />}
			{f >= S.final[0] && <FinalScene f={f} fps={fps} />}
		</AbsoluteFill>
	);
};
