import React from 'react';
import {AbsoluteFill, Img, interpolate, useCurrentFrame} from 'remotion';
import {ACCENT, GRAY, INK, IT, LOGO, clamp} from './kit';

// Seamless loop: everything is periodic in LOOP frames
export const BANNER_LOOP = 120;
const TAU = Math.PI * 2;

export const Banner: React.FC = () => {
	const f = useCurrentFrame();
	const t = (f % BANNER_LOOP) / BANNER_LOOP;
	const sheen = interpolate(t, [0.1, 0.55], [-0.4, 1.4], clamp);
	const bob = Math.sin(t * TAU) * 6;
	const tilt = Math.sin(t * TAU) * 4;
	const pulse = 1 + Math.max(0, Math.sin(t * TAU * 2)) * 0.04;
	const glowX = 50 + Math.sin(t * TAU) * 25;
	return (
		<AbsoluteFill style={{background: '#f5f5f7', padding: 24}}>
			<div
				style={{
					position: 'relative',
					flex: 1,
					borderRadius: 48,
					overflow: 'hidden',
					background: `radial-gradient(circle at ${glowX}% 0%, rgba(0,113,227,0.16), rgba(0,113,227,0) 55%), linear-gradient(180deg,#ffffff,#f2f5fb)`,
					boxShadow: '0 20px 50px rgba(20,40,90,0.10)',
					display: 'flex',
					alignItems: 'center',
					padding: '0 56px',
					gap: 44,
				}}
			>
				<div style={{perspective: 900}}>
					<div
						style={{
							width: 230,
							height: 230,
							borderRadius: 56,
							position: 'relative',
							overflow: 'hidden',
							background: 'linear-gradient(180deg,#ffffff,#eef2f9)',
							boxShadow: '0 24px 44px rgba(20,40,90,0.18), inset 0 2px 0 #fff',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							translate: `0 ${bob}px`,
							rotate: `y ${tilt}deg`,
						}}
					>
						<Img src={LOGO} style={{width: 145}} />
						<div style={{position: 'absolute', inset: 0, background: `linear-gradient(115deg, rgba(255,255,255,0) ${sheen * 100 - 12}%, rgba(255,255,255,0.85) ${sheen * 100}%, rgba(255,255,255,0) ${sheen * 100 + 12}%)`}} />
					</div>
				</div>
				<div style={{fontFamily: IT, flex: 1}}>
					<div style={{fontSize: 30, fontWeight: 600, color: ACCENT, letterSpacing: -0.3}}>Horz VPN</div>
					<div style={{fontSize: 64, fontWeight: 700, color: INK, letterSpacing: -2.4, lineHeight: 1.02, marginTop: 6}}>
						30 дней —{' '}
						<span style={{background: `linear-gradient(90deg,${ACCENT} ${sheen * 100 - 30}%,#5ac8fa ${sheen * 100}%,${ACCENT} ${sheen * 100 + 30}%)`, WebkitBackgroundClip: 'text', color: 'transparent'}}>бесплатно</span>
					</div>
					<div style={{fontSize: 30, fontWeight: 500, color: GRAY, marginTop: 10}}>Ищи в Telegram</div>
					<div
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: 14,
							marginTop: 18,
							background: INK,
							color: '#fff',
							fontSize: 36,
							fontWeight: 600,
							padding: '16px 34px',
							borderRadius: 50,
							scale: String(pulse),
							transformOrigin: 'left center',
						}}
					>
						<svg width="34" height="34" viewBox="0 0 24 24">
							<circle cx="12" cy="12" r="12" fill="#2aabee" />
							<path d="M5.5 11.8l11-4.3c.5-.2 1 .1.8.9l-1.9 8.9c-.1.6-.5.8-1 .5l-2.9-2.1-1.4 1.3c-.2.2-.3.3-.6.3l.2-3 5.4-4.9c.2-.2 0-.3-.3-.1l-6.7 4.2-2.9-.9c-.6-.2-.6-.6.3-.8z" fill="#fff" />
						</svg>
						@horzvpnbot
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};
