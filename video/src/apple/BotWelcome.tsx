import React from 'react';
import {AbsoluteFill, Img, interpolate, useCurrentFrame} from 'remotion';
import {ACCENT, GRAY, INK, IT, LOGO, clamp} from './kit';

// Telegram bot welcome picture: 16:9, seamless loop (everything periodic in LOOP)
export const BW_LOOP = 120;
const TAU = Math.PI * 2;

const Wave: React.FC<{t: number; y: number; amp: number; phase: number; color: string; width: number}> = ({t, y, amp, phase, color, width}) => {
	const pts: string[] = [];
	for (let x = 0; x <= 1280; x += 20) {
		const yy = y + Math.sin((x / 1280) * TAU * 1.5 + t * TAU + phase) * amp;
		pts.push(`${x},${yy.toFixed(1)}`);
	}
	return <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" />;
};

export const BotWelcome: React.FC = () => {
	const f = useCurrentFrame();
	const t = (f % BW_LOOP) / BW_LOOP;
	const bob = Math.sin(t * TAU) * 8;
	const tilt = Math.sin(t * TAU) * 5;
	const sheen = interpolate(t, [0.15, 0.6], [-0.4, 1.4], clamp);
	const glowX = 50 + Math.sin(t * TAU) * 20;
	return (
		<AbsoluteFill style={{background: `radial-gradient(circle at ${glowX}% 10%, rgba(0,113,227,0.14), rgba(0,113,227,0) 55%), linear-gradient(180deg,#fbfbfd,#eef2f8)`, overflow: 'hidden'}}>
			<svg width={1280} height={720} style={{position: 'absolute', inset: 0}}>
				<Wave t={t} y={600} amp={22} phase={0} color="rgba(0,113,227,0.16)" width={4} />
				<Wave t={t} y={630} amp={28} phase={1.4} color="rgba(90,200,250,0.22)" width={4} />
				<Wave t={t} y={660} amp={18} phase={2.6} color="rgba(0,113,227,0.10)" width={4} />
			</svg>
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 64, paddingBottom: 40}}>
				<div style={{perspective: 900}}>
					<div
						style={{
							width: 300,
							height: 300,
							borderRadius: 72,
							position: 'relative',
							overflow: 'hidden',
							background: 'linear-gradient(180deg,#ffffff,#eef2f9)',
							boxShadow: '0 34px 60px rgba(20,40,90,0.18), inset 0 2px 0 #fff',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							translate: `0 ${bob}px`,
							rotate: `y ${tilt}deg`,
						}}
					>
						<Img src={LOGO} style={{width: 190}} />
						<div style={{position: 'absolute', inset: 0, background: `linear-gradient(115deg, rgba(255,255,255,0) ${sheen * 100 - 12}%, rgba(255,255,255,0.85) ${sheen * 100}%, rgba(255,255,255,0) ${sheen * 100 + 12}%)`}} />
					</div>
				</div>
				<div style={{fontFamily: IT}}>
					<div style={{fontSize: 118, fontWeight: 700, color: INK, letterSpacing: -4.5, lineHeight: 1}}>Horz VPN</div>
					<div style={{fontSize: 56, fontWeight: 600, letterSpacing: -1.5, marginTop: 14, background: `linear-gradient(90deg,${ACCENT} ${sheen * 100 - 30}%,#5ac8fa ${sheen * 100}%,${ACCENT} ${sheen * 100 + 30}%)`, WebkitBackgroundClip: 'text', color: 'transparent'}}>
						На своей волне
					</div>
					<div style={{fontSize: 36, fontWeight: 500, color: GRAY, marginTop: 22}}>Быстрый и стабильный VPN</div>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
