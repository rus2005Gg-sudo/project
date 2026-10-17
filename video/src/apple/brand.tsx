import React from 'react';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {clamp, OUT} from './kit';

/** New Horz look (2026-10): heavy black grotesque, electric-blue dot, light studio background */
export const HZ = '"Montserrat", "Inter Tight", sans-serif';
export const HZ_INK = '#0a0a0c';
export const HZ_BLUE = '#0a4dff';
export const HZ_SUB = '#6b7280';
export const HZ_BG = 'linear-gradient(180deg,#fbfcfe 0%,#eceff5 100%)';

export const Dot: React.FC<{size: number}> = ({size}) => (
	<span style={{display: 'inline-block', width: size, height: size, borderRadius: '50%', background: HZ_BLUE, marginLeft: size * 0.12}} />
);

/** HORZ. wordmark with tracked VPN under it */
export const Wordmark: React.FC<{size: number; align?: 'left' | 'center'}> = ({size, align = 'center'}) => (
	<div style={{display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : 'flex-start'}}>
		<div style={{fontFamily: HZ, fontWeight: 900, fontSize: size, letterSpacing: -size * 0.04, lineHeight: 0.9, color: HZ_INK, display: 'flex', alignItems: 'flex-end'}}>
			HORZ<span style={{display: 'inline-block', width: size * 0.12, height: size * 0.12, borderRadius: '50%', background: HZ_BLUE, margin: `0 0 ${size * 0.04}px ${size * 0.05}px`}} />
		</div>
		<div style={{fontFamily: HZ, fontWeight: 600, fontSize: size * 0.16, letterSpacing: size * 0.12, color: HZ_SUB, marginTop: size * 0.12, paddingLeft: size * 0.12}}>VPN</div>
	</div>
);

/** soft white studio background with pedestals */
export const StudioBg: React.FC = () => (
	<AbsoluteFill style={{background: HZ_BG}}>
		<div style={{position: 'absolute', left: -120, bottom: 320, width: 700, height: 420, borderRadius: 120, background: 'linear-gradient(180deg,#fff,#e9edf4)', boxShadow: '0 40px 80px rgba(20,30,60,0.08)'}} />
		<div style={{position: 'absolute', right: -160, bottom: 120, width: 760, height: 520, borderRadius: 140, background: 'linear-gradient(180deg,#fff,#e6eaf2)', boxShadow: '0 40px 80px rgba(20,30,60,0.08)'}} />
	</AbsoluteFill>
);

export const Slam: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties}> = ({at, children, style}) => {
	const f = useCurrentFrame();
	const p = interpolate(f - at, [0, 12], [0, 1], {...clamp, easing: OUT});
	return <div style={{opacity: p, translate: `0 ${(1 - p) * 40}px`, filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined, ...style}}>{children}</div>;
};
