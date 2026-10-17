import React from 'react';
import {AbsoluteFill, Img, interpolate, useCurrentFrame} from 'remotion';
import {LOGO, OUT, INOUT, clamp} from './kit';
import {HZ} from './brand';
import {ICONS} from './BotWelcome';

/** 4.9 s chroma-key bumper (blue surround), like the reference: sign → glowing @handle pill → "ищи в ТГ" */
export const BUMPER_FRAMES = 148;
const BLUE = '#0a4dff';
const GLOW = '#5b8cff';
const U = 848; // design units; rendered at 2x

const rnd = (n: number) => {
	const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
	return x - Math.floor(x);
};

const Particles: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<>
			{Array.from({length: 46}).map((_, i) => {
				const x = rnd(i) * 848;
				const y = (rnd(i + 90) * 336 - f * (0.15 + rnd(i + 5) * 0.4) + 336 * 4) % 336;
				const s = 2 + rnd(i + 40) * 4;
				return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: GLOW, opacity: 0.25 + 0.5 * Math.abs(Math.sin(f / 18 + i)), filter: s > 4 ? 'blur(1px)' : undefined}} />;
			})}
		</>
	);
};

const Ribbon: React.FC<{style: React.CSSProperties}> = ({style}) => (
	<div style={{position: 'absolute', width: 260, height: 130, borderRadius: '50%', background: 'radial-gradient(ellipse at 30% 30%, #7fa8ff, #1a4be0 45%, #061a66 80%)', filter: 'blur(1.5px)', boxShadow: '0 0 40px rgba(10,77,255,0.6)', ...style}} />
);

export const Bumper: React.FC = () => {
	const f = useCurrentFrame();
	// scene A: sign 0..57, scene B from 54
	const a = interpolate(f, [0, 14], [0, 1], {...clamp, easing: OUT});
	const aOut = interpolate(f, [48, 60], [1, 0], {...clamp, easing: INOUT});
	const b = interpolate(f, [56, 74], [0, 1], {...clamp, easing: OUT});
	const flash = interpolate(f, [52, 56, 66], [0, 0.55, 0], clamp);
	const pulse = 0.6 + 0.4 * Math.sin(f / 7);
	const tg = interpolate(f, [86, 100], [0, 1], {...clamp, easing: OUT});
	const float = (i: number) => Math.sin(f / 22 + i * 1.7) * 6;
	const iconSpots: [number, number, number][] = [
		[60, 18, 0], [690, 14, 1], [24, 190, 2], [740, 210, 3], [330, 262, 4], [520, 8, 5],
	];
	return (
		<AbsoluteFill style={{background: '#0000ff'}}>
			<div style={{width: U, height: 336, transform: 'scale(2)', transformOrigin: '0 0', position: 'relative'}}>
				<div style={{position: 'absolute', inset: 0, borderRadius: 40, overflow: 'hidden', background: '#02040a'}}>
					{/* grid + glow */}
					<div style={{position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(91,140,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(91,140,255,0.07) 1px, transparent 1px)', backgroundSize: '42px 42px'}} />
					<div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 55%, rgba(10,77,255,${0.22 + b * 0.18}), rgba(10,77,255,0) 60%)`}} />
					<Particles />

					{/* scene A: sign */}
					<div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: Math.min(a, aOut), scale: String(interpolate(f, [48, 62], [1, 1.25], clamp)), filter: aOut < 1 ? `blur(${(1 - aOut) * 8}px)` : undefined}}>
						<div style={{translate: `${(1 - a) * -520}px 0`, rotate: `${-3 + (1 - a) * -6}deg`, width: 640, height: 200, borderRadius: 30, background: 'linear-gradient(180deg,rgba(14,24,52,0.95),rgba(5,10,26,0.95))', border: `2px solid rgba(91,140,255,0.55)`, boxShadow: `0 0 50px rgba(10,77,255,0.45), inset 0 0 40px rgba(10,77,255,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28}}>
							<Img src={LOGO} style={{width: 118}} />
							<div style={{fontFamily: HZ, fontWeight: 900, fontSize: 84, color: '#fff', letterSpacing: -3, transform: 'skewX(-8deg)', whiteSpace: 'nowrap'}}>
								HORZ <span style={{color: GLOW}}>VPN</span>
							</div>
						</div>
					</div>

					{/* scene B: handle pill */}
					<div style={{position: 'absolute', inset: 0, opacity: b, scale: String(interpolate(b, [0, 1], [0.86, 1]))}}>
						<Ribbon style={{left: -90, top: -40, rotate: '28deg'}} />
						<Ribbon style={{right: -100, bottom: -30, rotate: '-30deg'}} />
						{iconSpots.map(([x, y, i]) => (
							<div key={i} style={{position: 'absolute', left: x, top: y + float(i), width: 84, height: 84, opacity: 0.4, filter: 'blur(1.6px)', rotate: `${(i - 2) * 6}deg`}}>
								<div style={{width: '100%', height: '100%', borderRadius: 22, background: ICONS[i].bg, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{ICONS[i].glyph}</div>
							</div>
						))}
						<div style={{position: 'absolute', left: 0, right: 0, top: 84, display: 'flex', justifyContent: 'center'}}>
							<div style={{padding: '12px 46px 18px', borderRadius: 44, background: 'rgba(10,50,170,0.32)', border: `3px solid ${GLOW}`, boxShadow: `0 0 ${40 * pulse}px rgba(91,140,255,0.7), inset 0 0 40px rgba(91,140,255,0.25)`}}>
								<span style={{fontFamily: HZ, fontWeight: 800, fontSize: 82, color: '#9bbcff', letterSpacing: -3, textShadow: `0 0 ${24 * pulse}px rgba(91,140,255,0.9)`, whiteSpace: 'nowrap'}}>@horzvpnbot</span>
							</div>
						</div>
						<div style={{position: 'absolute', left: 0, right: 0, top: 252, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, opacity: tg, translate: `0 ${(1 - tg) * 14}px`}}>
							<Img src={LOGO} style={{width: 40}} />
							<span style={{fontFamily: HZ, fontWeight: 800, fontSize: 34, color: '#c9d6f5', letterSpacing: 1}}>ИЩИ В ТГ</span>
						</div>
					</div>
					<div style={{position: 'absolute', inset: 0, background: '#fff', opacity: flash}} />
				</div>
			</div>
		</AbsoluteFill>
	);
};
