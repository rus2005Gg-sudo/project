import React from 'react';
import '@fontsource/montserrat/800-italic.css';
import '@fontsource/montserrat/900-italic.css';
import '@fontsource/manrope/800.css';
import {AbsoluteFill, Img, interpolate, spring, useCurrentFrame} from 'remotion';
import {LOGO, clamp} from './kit';
import {ICONS} from './BotWelcome';

/**
 * 4.9 s bumper in the "mascot holds a sign → glowing @handle" format.
 * Surround is chroma GREEN: the brand blue would be keyed out on a blue screen.
 * Designed in 848×336 units, rendered at 2×.
 */
export const BUMPER2_FRAMES = 148;
const KEY = '#00ff00';
const U_W = 848;
const U_H = 336;
const BLUE = '#0a4dff';
const SKY = '#5b8cff';
const HEAVY = '"Montserrat", sans-serif';
const ROUND = '"Manrope", sans-serif';

// voice cues (frames) — "Если VPN… / то Horz VPN!"
const FLIP = 46; // sign turns to HORZ VPN
const WHIP = 58; // camera whips down, handle drops in

const sp = (f: number, at: number, damping = 12, stiffness = 140) => spring({frame: f - at, fps: 30, config: {damping, stiffness, mass: 0.9}});
const rnd = (n: number) => {
	const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
	return x - Math.floor(x);
};

const Particles: React.FC<{f: number}> = ({f}) => (
	<>
		{Array.from({length: 54}).map((_, i) => {
			const s = 1.5 + rnd(i + 40) * 4.5;
			const x = rnd(i) * U_W;
			const y = (((rnd(i + 90) * U_H - f * (0.2 + rnd(i + 5) * 0.5)) % U_H) + U_H) % U_H;
			const tw = 0.25 + 0.6 * Math.abs(Math.sin(f / 14 + i * 1.3));
			return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: s > 4 ? SKY : '#9fbaff', opacity: tw, boxShadow: s > 3.5 ? `0 0 ${s * 2}px ${SKY}` : undefined}} />;
		})}
	</>
);

/** glossy 3D-looking ribbon */
const Ribbon: React.FC<{id: string; flip?: boolean}> = ({id, flip}) => (
	<svg viewBox="0 0 300 180" width={300} height={180} style={{overflow: 'visible', transform: flip ? 'scale(-1,-1)' : undefined}}>
		<defs>
			<linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stopColor="#dbe7ff" />
				<stop offset="0.3" stopColor="#5b8cff" />
				<stop offset="0.65" stopColor="#0a3ccc" />
				<stop offset="1" stopColor="#021659" />
			</linearGradient>
			<linearGradient id={`${id}h`} x1="0" y1="0" x2="1" y2="0">
				<stop offset="0" stopColor="#fff" stopOpacity="0" />
				<stop offset="0.45" stopColor="#fff" stopOpacity="0.9" />
				<stop offset="1" stopColor="#fff" stopOpacity="0" />
			</linearGradient>
			<filter id={`${id}b`}>
				<feGaussianBlur stdDeviation="2.2" />
			</filter>
		</defs>
		<path d="M0 132 C 70 40, 150 170, 300 52 L 300 104 C 150 222, 70 96, 0 186 Z" fill="#021659" opacity="0.7" transform="translate(10 16)" />
		<path d="M0 120 C 70 28, 150 158, 300 40 L 300 96 C 150 214, 70 86, 0 176 Z" fill={`url(#${id}g)`} />
		<path d="M0 124 C 70 34, 150 162, 300 46" fill="none" stroke={`url(#${id}h)`} strokeWidth="6" filter={`url(#${id}b)`} />
		<path d="M20 150 C 90 70, 160 190, 300 78 L 300 96 C 150 214, 70 86, 0 176 Z" fill="#000" opacity="0.28" />
		<path d="M0 172 C 70 82, 150 210, 300 92" fill="none" stroke="#9fbcff" strokeOpacity="0.55" strokeWidth="2.5" filter={`url(#${id}b)`} />
	</svg>
);

/** app icon with gloss + depth */
const Icon3D: React.FC<{i: number; size: number; tilt: number; f: number; at: number}> = ({i, size, tilt, f, at}) => {
	const p = sp(f, at, 10, 160);
	const bob = Math.sin(f / 18 + i * 1.9) * 4;
	return (
		<div style={{width: size, height: size, scale: String(p), translate: `0 ${bob}px`, rotate: `${tilt}deg`, filter: 'brightness(0.78) saturate(1.15)'}}>
			<div style={{position: 'relative', width: '100%', height: '100%', borderRadius: size * 0.27, background: ICONS[i].bg, boxShadow: `0 ${size * 0.16}px ${size * 0.3}px rgba(0,0,0,0.6), inset 0 -${size * 0.06}px 0 rgba(0,0,0,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
				{ICONS[i].glyph}
				<div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.38), rgba(255,255,255,0) 48%)'}} />
			</div>
		</div>
	);
};

export const Bumper2: React.FC = () => {
	const f = useCurrentFrame();

	// opening: thin line → card
	const lineW = interpolate(f, [0, 8], [0, U_W * 0.86], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
	const open = interpolate(f, [8, 19], [0, 1], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
	const cw = f < 8 ? lineW : interpolate(open, [0, 1], [U_W * 0.86, U_W]);
	const ch = f < 8 ? 4 : interpolate(open, [0, 1], [4, U_H]);
	const cl = (U_W - cw) / 2;
	const ct = (U_H - ch) / 2;

	// scene A: logo "hero" + sign
	const hero = sp(f, 12, 9, 150);
	const squash = f >= FLIP ? interpolate(f - FLIP, [0, 3, 9], [0, 1, 0], clamp) : 0;
	const sign = sp(f, 17, 11, 130);
	const front = interpolate(f, [FLIP, FLIP + 4], [0, 90], clamp);
	const back = interpolate(f, [FLIP + 4, FLIP + 9], [-90, 0], clamp);
	const burst = interpolate(f, [FLIP + 5, FLIP + 20], [0, 1], clamp);

	// whip: A drops out, B falls in from the top
	const aY = interpolate(f, [WHIP, WHIP + 8], [0, 380], {...clamp, easing: (t) => t * t});
	const aBlur = interpolate(f, [WHIP, WHIP + 8], [0, 14], clamp);
	const bIn = sp(f, WHIP + 3, 13, 170);
	const bY = interpolate(bIn, [0, 1], [-380, 0]);
	const bBlur = interpolate(f, [WHIP + 3, WHIP + 9], [14, 0], clamp);
	const showA = f < WHIP + 9;
	const showB = f >= WHIP + 2;

	const rib1 = sp(f, WHIP + 7, 14, 90);
	const rib2 = sp(f, WHIP + 9, 14, 90);
	const pulse = 0.65 + 0.35 * Math.sin(f / 6);
	const shine = interpolate(f, [92, 110], [-0.3, 1.3], clamp);
	const tg = interpolate(f, [WHIP + 24, WHIP + 34], [0, 1], clamp);

	return (
		<AbsoluteFill style={{background: KEY}}>
			<div style={{width: U_W, height: U_H, transform: 'scale(2)', transformOrigin: '0 0', position: 'relative'}}>
				<div style={{position: 'absolute', left: cl, top: ct, width: cw, height: ch, borderRadius: Math.min(40, ch / 2), overflow: 'hidden', background: '#02040b', boxShadow: f < 10 ? '0 0 18px 2px rgba(91,140,255,0.9), 0 0 0 1px #5b8cff' : '0 0 0 1px rgba(91,140,255,0.25)'}}>
					{/* inner canvas stays fixed while the card mask opens */}
					<div style={{position: 'absolute', left: -cl, top: -ct, width: U_W, height: U_H}}>
						<div style={{position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(91,140,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(91,140,255,0.06) 1px, transparent 1px)', backgroundSize: '38px 38px'}} />
						<div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 55% 70% at 55% 55%, rgba(10,77,255,0.28), rgba(10,77,255,0) 70%)'}} />
						<Particles f={f} />

						{/* ---------- scene A ---------- */}
						{showA ? (
							<div style={{position: 'absolute', inset: 0, translate: `0 ${aY}px`, filter: aBlur > 0.2 ? `blur(${aBlur}px)` : undefined}}>
								{/* sign */}
								<div style={{position: 'absolute', left: 222, top: 92, width: 586, height: 172, perspective: 900, translate: `${(1 - sign) * 560}px 0`, rotate: `${-4 + (1 - sign) * 10}deg`}}>
									{[0, 1].map((side) => (
										<div
											key={side}
											style={{
												position: 'absolute',
												inset: 0,
												borderRadius: 26,
												background: 'linear-gradient(180deg, rgba(24,36,72,0.96), rgba(5,9,22,0.97))',
												border: '2px solid rgba(140,175,255,0.6)',
												boxShadow: '0 26px 50px rgba(0,0,0,0.6), 0 0 44px rgba(10,77,255,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												paddingLeft: 64,
												transform: `rotateX(${side === 0 ? front : back}deg)`,
												backfaceVisibility: 'hidden',
												opacity: side === 0 ? (f < FLIP + 4 ? 1 : 0) : f >= FLIP + 4 ? 1 : 0,
											}}
										>
											{side === 0 ? (
												<div style={{fontFamily: HEAVY, fontStyle: 'italic', fontWeight: 900, fontSize: 70, color: '#fff', letterSpacing: -1, whiteSpace: 'nowrap'}}>
													ЕСЛИ VPN<span style={{color: SKY}}>…</span>
												</div>
											) : (
												<div style={{fontFamily: HEAVY, fontStyle: 'italic', fontWeight: 900, fontSize: 84, color: '#fff', letterSpacing: -1, whiteSpace: 'nowrap', textShadow: '0 0 24px rgba(91,140,255,0.6)'}}>
													HORZ <span style={{color: SKY}}>VPN</span>
												</div>
											)}
										</div>
									))}
									{/* sparkle burst on the flip */}
									{burst > 0 && burst < 1
										? Array.from({length: 12}).map((_, i) => {
												const a = (i / 12) * Math.PI * 2;
												const r = 60 + burst * 260;
												return <div key={i} style={{position: 'absolute', left: 293 + Math.cos(a) * r * 1.4, top: 86 + Math.sin(a) * r * 0.55, width: 7, height: 7, borderRadius: 4, background: '#cfe0ff', opacity: 1 - burst, boxShadow: `0 0 12px ${SKY}`}} />;
										  })
										: null}
								</div>

								{/* logo hero, overlapping the sign like it is holding it */}
								<div style={{position: 'absolute', left: 30, top: 74, width: 230, height: 230, translate: `${(1 - hero) * -300}px ${Math.sin(f / 10) * 3}px`, rotate: `${-10 - (1 - hero) * 30}deg`, scale: `${1 + squash * 0.1} ${1 - squash * 0.12}`, transformOrigin: '50% 100%'}}>
									<div style={{position: 'absolute', inset: -30, borderRadius: '50%', background: 'radial-gradient(circle, rgba(10,77,255,0.45), rgba(10,77,255,0) 65%)'}} />
									<div style={{position: 'relative', width: '100%', height: '100%', borderRadius: 56, background: 'linear-gradient(160deg,#ffffff,#e4ebf8)', boxShadow: '0 24px 44px rgba(0,0,0,0.6), inset 0 -8px 0 rgba(20,40,90,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
										<Img src={LOGO} style={{width: '68%'}} />
										<div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0) 45%)'}} />
									</div>
								</div>
							</div>
						) : null}

						{/* ---------- scene B ---------- */}
						{showB ? (
							<div style={{position: 'absolute', inset: 0}}>
								{/* icons sit behind the pill */}
								<div style={{position: 'absolute', left: 64, top: 6}}>
									<Icon3D i={0} size={96} tilt={-14} f={f} at={WHIP + 12} />
								</div>
								<div style={{position: 'absolute', left: 660, top: -6}}>
									<Icon3D i={1} size={104} tilt={12} f={f} at={WHIP + 14} />
								</div>
								<div style={{position: 'absolute', left: 48, top: 232}}>
									<Icon3D i={2} size={90} tilt={10} f={f} at={WHIP + 16} />
								</div>
								<div style={{position: 'absolute', left: 690, top: 236}}>
									<Icon3D i={5} size={92} tilt={-10} f={f} at={WHIP + 18} />
								</div>

								{/* ribbons */}
								<div style={{position: 'absolute', left: -96 - (1 - rib1) * 220, top: -64 - (1 - rib1) * 160, rotate: `${18 + Math.sin(f / 30) * 3}deg`}}>
									<Ribbon id="r1" />
								</div>
								<div style={{position: 'absolute', left: 650 + (1 - rib2) * 220, top: 210 + (1 - rib2) * 160, rotate: `${18 + Math.sin(f / 28 + 1) * 3}deg`}}>
									<Ribbon id="r2" flip />
								</div>

								{/* handle pill */}
								<div style={{position: 'absolute', left: 0, right: 0, top: 66, display: 'flex', justifyContent: 'center', translate: `0 ${bY}px`, filter: bBlur > 0.2 ? `blur(${bBlur}px)` : undefined}}>
									<div style={{position: 'relative', padding: '14px 58px 20px', borderRadius: 38, overflow: 'hidden', background: 'linear-gradient(180deg, rgba(24,70,210,0.55), rgba(6,22,90,0.72))', border: '3px solid #86abff', boxShadow: `0 0 ${26 + 18 * pulse}px rgba(91,140,255,0.8), inset 0 0 34px rgba(91,140,255,0.38), 0 22px 44px rgba(0,0,0,0.55)`}}>
										<div style={{filter: `drop-shadow(0 0 ${8 + 6 * pulse}px rgba(120,165,255,0.9))`}}>
											<div style={{fontFamily: ROUND, fontWeight: 800, fontSize: 86, letterSpacing: -2, lineHeight: 1.15, whiteSpace: 'nowrap', background: 'linear-gradient(180deg,#f2f6ff 10%,#9cbcff 90%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>@horzvpnbot</div>
										</div>
										<div style={{position: 'absolute', top: -20, bottom: -20, width: 90, left: `${shine * 100}%`, background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.35), rgba(255,255,255,0))', rotate: '18deg'}} />
									</div>
								</div>

								{/* ищи в тг */}
								<div style={{position: 'absolute', left: 0, right: 0, top: 246, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, opacity: tg, translate: `0 ${(1 - tg) * 12}px`}}>
									<div style={{width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(160deg,#fff,#e4ebf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 14px rgba(0,0,0,0.5)'}}>
										<Img src={LOGO} style={{width: '72%'}} />
									</div>
									<span style={{fontFamily: HEAVY, fontStyle: 'italic', fontWeight: 800, fontSize: 36, color: '#dfe7f7', letterSpacing: 0.5}}>ИЩИ В ТГ</span>
								</div>
							</div>
						) : null}

						{/* vignette */}
						<div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 90% at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none'}} />
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};
