import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import '@fontsource/inter-tight/400.css';
import '@fontsource/inter-tight/500.css';
import '@fontsource/inter-tight/600.css';
import '@fontsource/inter-tight/700.css';

export const IT = '"Inter Tight", sans-serif';
export const INK = '#1d1d1f';
export const GRAY = '#86868b';
export const SUB = '#6e6e73';
export const ACCENT = '#0071e3';
export const HAIR = '#d2d2d7';
export const LOGO = staticFile('reel/logo.png');

// Apple-like curves: fast start, long soft settle, no overshoot
export const OUT = Easing.bezier(0.22, 1, 0.36, 1);
export const INOUT = Easing.bezier(0.65, 0, 0.35, 1);
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const prog = (f: number, at: number, dur = 24, ease = OUT) => interpolate(f - at, [0, dur], [0, 1], {...clamp, easing: ease});

/* ---------- transition: blur-zoom crossfade ---------- */
const BlurZoom: React.FC<TransitionPresentationComponentProps<Record<string, never>>> = ({children, presentationDirection, presentationProgress}) => {
	const p = presentationProgress;
	const entering = presentationDirection === 'entering';
	const opacity = entering ? p : 1 - p;
	const scale = entering ? interpolate(p, [0, 1], [1.06, 1]) : interpolate(p, [0, 1], [1, 0.95]);
	const blur = entering ? (1 - p) * 18 : p * 14;
	return (
		<AbsoluteFill style={{opacity, scale: String(scale), filter: blur > 0.2 ? `blur(${blur}px)` : undefined}}>
			{children}
		</AbsoluteFill>
	);
};
export const blurZoom = (): TransitionPresentation<Record<string, never>> => ({component: BlurZoom, props: {}});

/* ---------- backgrounds ---------- */
export const AppleBg: React.FC<{glow?: string}> = ({glow = '0,113,227'}) => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: 'linear-gradient(180deg,#fbfbfd 0%,#f2f3f7 100%)', overflow: 'hidden'}}>
			<div
				style={{
					position: 'absolute',
					width: 1400,
					height: 1400,
					left: -160 + Math.sin(f / 90) * 60,
					top: -900 + Math.cos(f / 110) * 40,
					borderRadius: '50%',
					background: `radial-gradient(circle, rgba(${glow},0.10), rgba(${glow},0) 60%)`,
				}}
			/>
		</AbsoluteFill>
	);
};

/** slow camera drift for a whole scene */
export const Drift: React.FC<{dur: number; children: React.ReactNode; amount?: number}> = ({dur, children, amount = 0.035}) => {
	const f = useCurrentFrame();
	return <AbsoluteFill style={{scale: String(interpolate(f, [0, dur], [1, 1 + amount], clamp))}}>{children}</AbsoluteFill>;
};

/* ---------- typography ---------- */
/** line-by-line mask reveal, like Apple keynote titles */
export const Lines: React.FC<{
	lines: React.ReactNode[];
	at?: number;
	size: number;
	weight?: number;
	color?: string;
	colors?: string[];
	align?: 'center' | 'left';
	stagger?: number;
	tracking?: number;
	lh?: number;
	style?: React.CSSProperties;
}> = ({lines, at = 0, size, weight = 600, color = INK, colors, align = 'center', stagger = 5, tracking, lh = 1.06, style}) => {
	const f = useCurrentFrame();
	return (
		<div style={{fontFamily: IT, fontSize: size, fontWeight: weight, letterSpacing: tracking ?? -size * 0.035, lineHeight: lh, textAlign: align, ...style}}>
			{lines.map((l, i) => {
				const p = prog(f, at + i * stagger, 26);
				return (
					<div key={i} style={{overflow: 'hidden', paddingBottom: size * 0.08, marginBottom: -size * 0.08}}>
						<div style={{translate: `0 ${(1 - p) * 105}%`, opacity: interpolate(p, [0, 0.35], [0, 1], clamp), color: colors?.[i] ?? color, whiteSpace: 'nowrap'}}>{l}</div>
					</div>
				);
			})}
		</div>
	);
};

/** soft fade-up with blur-to-sharp */
export const Rise: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties; dist?: number; dur?: number}> = ({at, children, style, dist = 40, dur = 26}) => {
	const f = useCurrentFrame();
	const p = prog(f, at, dur);
	return <div style={{opacity: p, translate: `0 ${(1 - p) * dist}px`, filter: p < 0.99 ? `blur(${(1 - p) * 10}px)` : undefined, ...style}}>{children}</div>;
};

export const Eyebrow: React.FC<{children: React.ReactNode; at?: number; color?: string}> = ({children, at = 0, color = ACCENT}) => (
	<Rise at={at} dist={16}>
		<div style={{fontFamily: IT, fontSize: 32, fontWeight: 500, color, textAlign: 'center'}}>{children}</div>
	</Rise>
);

export const Count: React.FC<{to: number; at: number; dur?: number; suffix?: string; decimals?: number}> = ({to, at, dur = 36, suffix = '', decimals = 0}) => {
	const f = useCurrentFrame();
	const v = interpolate(f - at, [0, dur], [0, to], {...clamp, easing: OUT});
	return (
		<span style={{fontVariantNumeric: 'tabular-nums'}}>
			{v.toFixed(decimals)}
			{suffix}
		</span>
	);
};

export const Lockup: React.FC<{at?: number}> = ({at = 0}) => (
	<Rise at={at} dist={10} style={{position: 'absolute', top: 110, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14}}>
		<Img src={LOGO} style={{width: 42}} />
		<div style={{fontFamily: IT, fontSize: 36, fontWeight: 600, color: INK, letterSpacing: -0.5}}>Horz VPN</div>
	</Rise>
);

/* ---------- objects ---------- */
export const AppIcon: React.FC<{size: number; at?: number; float?: boolean}> = ({size, at = 0, float = true}) => {
	const f = useCurrentFrame();
	const p = prog(f, at, 34);
	const sheen = interpolate((f - at - 20) % 150, [0, 40], [-1.2, 1.4], clamp);
	const y = float ? Math.sin(f / 30) * 8 : 0;
	return (
		<div style={{perspective: 1400}}>
			<div
				style={{
					width: size,
					height: size,
					borderRadius: size * 0.24,
					position: 'relative',
					overflow: 'hidden',
					background: 'linear-gradient(180deg,#ffffff,#eef2f9)',
					boxShadow: `0 ${size * 0.15}px ${size * 0.3}px rgba(20,40,90,0.16), 0 ${size * 0.03}px ${size * 0.08}px rgba(20,40,90,0.08), inset 0 2px 0 #fff, inset 0 -6px 16px rgba(20,60,140,0.06)`,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					opacity: p,
					scale: String(interpolate(p, [0, 1], [0.86, 1])),
					rotate: `x ${interpolate(p, [0, 1], [24, 0]) + Math.sin(f / 40) * 3}deg`,
					translate: `0 ${(1 - p) * 60 + y}px`,
					filter: p < 0.99 ? `blur(${(1 - p) * 12}px)` : undefined,
				}}
			>
				<Img src={LOGO} style={{width: size * 0.62}} />
				<div style={{position: 'absolute', inset: 0, background: `linear-gradient(115deg, rgba(255,255,255,0) ${35 + sheen * 30}%, rgba(255,255,255,0.75) ${45 + sheen * 30}%, rgba(255,255,255,0) ${55 + sheen * 30}%)`, mixBlendMode: 'soft-light'}} />
			</div>
		</div>
	);
};

export const Card: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
	<div style={{background: '#ffffff', borderRadius: 40, boxShadow: '0 30px 70px rgba(20,40,90,0.08), 0 4px 14px rgba(20,40,90,0.04)', ...style}}>{children}</div>
);

export const BlackPill: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
	<div style={{background: INK, color: '#fff', fontFamily: IT, fontSize: 40, fontWeight: 500, padding: '30px 60px', borderRadius: 60, whiteSpace: 'nowrap', ...style}}>{children}</div>
);
