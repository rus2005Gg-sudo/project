import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {flip} from '@remotion/transitions/flip';
import {fade} from '@remotion/transitions/fade';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {Character, Pose} from '../gym/Character';
import {font, mono} from '../reel/ui';
import {Grain} from '../common/fx';

export const P_FPS = 30;
const BEAT = 15;
const BAR = 60;
const TR = 8;
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const RED = '#ff2d55';
const BLUE = '#1a7cf5';

/* ---------- building blocks ---------- */

const Bg: React.FC<{mood: 'red' | 'blue' | 'deep'}> = ({mood}) => {
	const f = useCurrentFrame();
	const base = mood === 'red' ? ['#2a0610', '#0b0306'] : mood === 'deep' ? ['#07123a', '#02050f'] : ['#0b5fe8', '#062a7a'];
	const blob = mood === 'red' ? '255,45,85' : '90,200,255';
	return (
		<AbsoluteFill style={{background: `radial-gradient(120% 80% at 50% 40%, ${base[0]}, ${base[1]})`, overflow: 'hidden'}}>
			{[0, 1, 2].map((i) => (
				<div
					key={i}
					style={{
						position: 'absolute',
						width: 900,
						height: 900,
						borderRadius: '50%',
						left: 90 + Math.sin(f / 40 + i * 2) * 300 - 300 + i * 200,
						top: 300 + Math.cos(f / 50 + i) * 400 + i * 300,
						background: `radial-gradient(circle, rgba(${blob},0.35), rgba(${blob},0) 65%)`,
					}}
				/>
			))}
			<AbsoluteFill
				style={{
					backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.05) 2px, transparent 2px)',
					backgroundSize: '90px 90px',
					backgroundPosition: `0 ${(f * 3) % 90}px`,
					maskImage: 'radial-gradient(circle at 50% 50%, black 30%, transparent 75%)',
				}}
			/>
		</AbsoluteFill>
	);
};

const Slam: React.FC<{text: string; at?: number; size?: number; color?: string; top: number; rot?: number; stroke?: string}> = ({text, at = 0, size = 150, color = '#fff', top, rot = -3, stroke = '#05060b'}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const words = text.split(' ');
	return (
		<div style={{position: 'absolute', top, left: 40, right: 40, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 26px', rotate: `${rot}deg`}}>
			{words.map((w, i) => {
				const p = spring({frame: f - at - i * 3, fps, config: {damping: 11, stiffness: 260, mass: 0.7}});
				return (
					<span
						key={i}
						style={{
							display: 'inline-block',
							fontFamily: font,
							fontWeight: 900,
							fontSize: size,
							lineHeight: 1.02,
							letterSpacing: -3,
							color,
							scale: String(interpolate(p, [0, 1], [2.8, 1])),
							opacity: interpolate(p, [0, 0.25], [0, 1], cl),
							translate: `0 ${interpolate(p, [0, 1], [-60, 0])}px`,
							WebkitTextStroke: `14px ${stroke}`,
							paintOrder: 'stroke fill',
							textShadow: '0 18px 50px rgba(0,0,0,0.45)',
						}}
					>
						{w}
					</span>
				);
			})}
		</div>
	);
};

const Blur: React.FC<{children: React.ReactNode}> = ({children}) => (
	<CameraMotionBlur samples={6} shutterAngle={200}>
		{children}
	</CameraMotionBlur>
);

const Pop: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties}> = ({at, children, style}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = spring({frame: f - at, fps, config: {damping: 10, stiffness: 220}});
	return <div style={{scale: String(p), opacity: interpolate(p, [0, 0.2], [0, 1], cl), ...style}}>{children}</div>;
};

const Sfx: React.FC<{at: number; src: string; volume?: number}> = ({at, src, volume = 0.8}) => (
	<Sequence from={at} layout="none">
		<Audio src={staticFile(`sfx/${src}.mp3`)} volume={volume} />
	</Sequence>
);

const Shake: React.FC<{at: number; power?: number; children: React.ReactNode}> = ({at, power = 26, children}) => {
	const f = useCurrentFrame();
	const k = interpolate(f - at, [0, 10], [1, 0], cl) * (f >= at ? 1 : 0);
	return <AbsoluteFill style={{translate: `${(random(`x${f}`) - 0.5) * power * k}px ${(random(`y${f}`) - 0.5) * power * k}px`}}>{children}</AbsoluteFill>;
};

const Hero: React.FC<{pose: Pose; size: number; x?: number; bottom: number; id: string; enterAt?: number}> = ({pose, size, x = 540, bottom, id, enterAt}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const drop = enterAt === undefined ? 1 : spring({frame: f - enterAt, fps, config: {damping: 13, stiffness: 180}});
	return (
		<div style={{position: 'absolute', left: x, top: bottom, translate: `-50% ${-100 + (1 - drop) * -140}%`}}>
			<Character build="hero" id={id} size={size} pose={pose} />
		</div>
	);
};

const blink = (f: number) => (f % 84 < 3 ? 0.1 : 1);
const flexPose = (k: number, f: number, extra: Partial<Pose> = {}): Pose => ({
	l: {sh: 14 + k * 81, el: -12 + k * 127},
	r: {sh: 14 + k * 81, el: -12 + k * 127},
	flex: k,
	glow: k * (0.6 + 0.4 * Math.sin(f / 4)),
	blink: blink(f),
	mouth: 'grin',
	...extra,
});

/* ---------- scenes ---------- */

const receipt = [
	['VPN Premium', '899 ₽'],
	['+ 2 устройства', '299 ₽'],
	['+ «быстрый» сервер', '199 ₽'],
];

const S1Hook: React.FC = () => {
	const f = useCurrentFrame();
	const print = interpolate(f, [0, 26], [0, 1], {...cl, easing: ease});
	return (
		<AbsoluteFill>
			<Bg mood="red" />
			<Shake at={30} power={40}>
				<div style={{position: 'absolute', top: 400, left: 150, right: 150, rotate: '-2deg'}}>
					<div style={{background: '#fbf7ee', borderRadius: 14, padding: '44px 44px 30px', clipPath: `inset(0 0 ${(1 - print) * 100}% 0)`, boxShadow: '0 40px 90px rgba(0,0,0,0.6)'}}>
						<div style={{fontFamily: mono, fontWeight: 800, fontSize: 34, color: '#222', textAlign: 'center', letterSpacing: 4}}>ЧЕК · ТВОЙ VPN</div>
						<div style={{borderTop: '4px dashed #bbb', margin: '24px 0'}} />
						{receipt.map(([a, b]) => (
							<div key={a} style={{display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 36, color: '#333', margin: '14px 0'}}>
								<span>{a}</span>
								<span>{b}</span>
							</div>
						))}
						<div style={{borderTop: '4px dashed #bbb', margin: '24px 0'}} />
						<div style={{display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontWeight: 800, fontSize: 48, color: RED}}>
							<span>ИТОГО</span>
							<span>1397 ₽/мес</span>
						</div>
					</div>
				</div>
				<Blur>
					<Slam text="ДОРОГО?" at={30} size={180} color={RED} top={1180} rot={-6} />
				</Blur>
			</Shake>
			<Sfx at={0} src="card-slide-1" />
			<Sfx at={12} src="tick-001" volume={0.5} />
			<Sfx at={30} src="error-buzz" volume={0.7} />
			<Sfx at={30} src="impact-punch-heavy-000" />
		</AbsoluteFill>
	);
};

const S2NoProblem: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill>
			<Bg mood="deep" />
			<Shake at={10} power={30}>
				<Hero id="np" size={560} bottom={1450} enterAt={0} pose={{l: {sh: 14, el: -12}, r: {sh: 14, el: -12}, mouth: 'smirk', shades: f > 22, blink: blink(f)}} />
				<Blur>
					<Slam text="НЕ БЕДА." at={24} size={190} top={260} rot={-4} />
				</Blur>
			</Shake>
			<Sfx at={8} src="impact-punch-medium-001" />
			<Sfx at={22} src="switch-on" volume={0.6} />
		</AbsoluteFill>
	);
};

const S3Speed: React.FC = () => {
	const f = useCurrentFrame();
	const v = interpolate(f, [0, 24], [0, 10], {...cl, easing: ease});
	const needle = interpolate(v, [0, 10], [-120, 100]);
	return (
		<AbsoluteFill>
			<Bg mood="blue" />
			<div style={{position: 'absolute', top: 470, width: '100%', display: 'flex', justifyContent: 'center'}}>
				<svg width="820" height="560" viewBox="0 0 820 560">
					<defs>
						<linearGradient id="gg" x1="0" x2="1">
							<stop offset="0" stopColor="#7fdcff" />
							<stop offset="1" stopColor="#ffffff" />
						</linearGradient>
					</defs>
					<path d="M110 480 A 300 300 0 1 1 710 480" stroke="rgba(255,255,255,0.18)" strokeWidth="60" fill="none" strokeLinecap="round" />
					<path d="M110 480 A 300 300 0 1 1 710 480" stroke="url(#gg)" strokeWidth="60" fill="none" strokeLinecap="round" strokeDasharray="1260" strokeDashoffset={1260 * (1 - v / 10)} />
					<g transform={`translate(410 400) rotate(${needle})`}>
						<path d="M-14 0 L 0 -280 L 14 0 Z" fill="#fff" />
						<circle r="30" fill="#fff" />
					</g>
				</svg>
			</div>
			<div style={{position: 'absolute', top: 960, width: '100%', textAlign: 'center', fontFamily: font, fontWeight: 900, fontSize: 250, color: '#fff', letterSpacing: -8, lineHeight: 1, textShadow: '0 0 60px rgba(127,220,255,0.8)'}}>
				{v.toFixed(0)}
				<span style={{fontSize: 90, letterSpacing: -2}}> Гбит/с</span>
			</div>
			<Slam text="СКОРОСТЬ" at={20} size={130} top={1260} rot={-3} />
			<Sfx at={0} src="power-up-3" volume={0.5} />
		</AbsoluteFill>
	);
};

const DeviceIcon: React.FC<{kind: string}> = ({kind}) => (
	<svg width="190" height="190" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
		{kind === 'phone' && (
			<>
				<rect x="7" y="2" width="10" height="20" rx="2.5" />
				<path d="M11 18.5 h2" />
			</>
		)}
		{kind === 'laptop' && (
			<>
				<rect x="4" y="5" width="16" height="11" rx="1.5" />
				<path d="M2 19 h20" />
			</>
		)}
		{kind === 'tablet' && (
			<>
				<rect x="5" y="2" width="14" height="20" rx="2" />
				<circle cx="12" cy="18.5" r="0.6" fill="#fff" />
			</>
		)}
		{kind === 'tv' && (
			<>
				<rect x="2" y="4" width="20" height="13" rx="1.5" />
				<path d="M8 21 h8 M12 17 v4" />
			</>
		)}
	</svg>
);

const S4Devices: React.FC = () => (
	<AbsoluteFill>
		<Bg mood="blue" />
		<div style={{position: 'absolute', top: 480, left: 110, right: 110, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40}}>
			{['phone', 'laptop', 'tablet', 'tv'].map((k, i) => (
				<Pop key={k} at={i * 6}>
					<div style={{height: 330, borderRadius: 60, background: 'rgba(255,255,255,0.12)', border: '4px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 60px rgba(0,20,80,0.4)'}}>
						<DeviceIcon kind={k} />
					</div>
				</Pop>
			))}
		</div>
		<Slam text="ВСЕ УСТРОЙСТВА" at={24} size={112} top={1230} rot={-3} />
		{[0, 6, 12, 18].map((a) => (
			<Sfx key={a} at={a} src="notification-pop" volume={0.6} />
		))}
	</AbsoluteFill>
);

const apps = [
	{bg: 'radial-gradient(circle at 30% 107%,#fdf497 0%,#fd5949 45%,#d6249f 60%,#285aeb 90%)', icon: <><rect x="3" y="3" width="18" height="18" rx="5.5" stroke="#fff" strokeWidth="2" fill="none" /><circle cx="12" cy="12" r="4.2" stroke="#fff" strokeWidth="2" fill="none" /></>},
	{bg: 'linear-gradient(145deg,#ff4a4a,#e00000)', icon: <path d="M9 7 L17.5 12 L9 17Z" fill="#fff" />},
	{bg: '#0b0b10', icon: <path d="M13 3 H16 C16.3 5.2 17.8 6.7 20 7 V10 C18.5 10 17.1 9.5 16 8.7 V15 A6 6 0 1 1 10 9 V12.2 A2.9 2.9 0 1 0 13 15Z" fill="#fff" />},
	{bg: 'linear-gradient(145deg,#4cc3ff,#1d8fe0)', icon: <path d="M3 11.5 L20 4.5 L17 19.5 L11.5 15.5 L9 18.5 L9.3 14 L17 7.5 L7.5 13Z" fill="#fff" />},
];

const S5Apps: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill>
			<Bg mood="deep" />
			<div style={{position: 'absolute', top: 560, width: '100%', display: 'flex', justifyContent: 'center', gap: 34}}>
				{apps.map((a, i) => (
					<Pop key={i} at={i * BEAT / 2}>
						<div style={{width: 200, height: 200, borderRadius: 54, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', translate: `0 ${Math.sin(f / 6 + i) * 10}px`}}>
							<svg width="120" height="120" viewBox="0 0 24 24">
								{a.icon}
							</svg>
						</div>
					</Pop>
				))}
			</div>
			<Slam text="БЕЗ ТОРМОЗОВ" at={24} size={124} top={880} rot={-3} />
			<Slam text="и блокировок" at={34} size={84} top={1180} rot={-3} color="#7fdcff" />
			{[0, 7, 15, 22].map((a) => (
				<Sfx key={a} at={a} src="tick-001" volume={0.7} />
			))}
		</AbsoluteFill>
	);
};

const S6Logs: React.FC = () => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const st = spring({frame: f - 14, fps, config: {damping: 9, stiffness: 260}});
	return (
		<AbsoluteFill>
			<Bg mood="blue" />
			<Hero id="lg" size={600} bottom={1480} pose={{l: {sh: 14, el: -12}, r: {sh: 14, el: -12}, mouth: 'shh', brow: -1, blink: blink(f), glow: 0.5}} />
			<Shake at={14} power={30}>
				<div
					style={{
						position: 'absolute',
						top: 250,
						width: '100%',
						display: 'flex',
						justifyContent: 'center',
					}}
				>
					<div
						style={{
							scale: String(interpolate(st, [0, 1], [3, 1])),
							opacity: interpolate(st, [0, 0.2], [0, 1], cl),
							rotate: '-8deg',
							fontFamily: font,
							fontWeight: 900,
							fontSize: 160,
							color: '#fff',
							border: '14px solid #fff',
							borderRadius: 36,
							padding: '0 50px',
							background: 'rgba(5,20,60,0.35)',
							boxShadow: '0 0 80px rgba(127,220,255,0.7)',
						}}
					>
						0 ЛОГОВ
					</div>
				</div>
			</Shake>
			<Sfx at={14} src="impact-punch-heavy-000" />
		</AbsoluteFill>
	);
};

const S7Ai: React.FC = () => {
	const f = useCurrentFrame();
	const typing = f > 14 && f < 34;
	const done = f >= 34;
	return (
		<AbsoluteFill>
			<Bg mood="deep" />
			<div style={{position: 'absolute', top: 500, left: 90, right: 90, display: 'flex', flexDirection: 'column', gap: 30}}>
				<Pop at={0} style={{alignSelf: 'flex-end'}}>
					<div style={{background: BLUE, color: '#fff', fontFamily: font, fontWeight: 800, fontSize: 50, padding: '28px 40px', borderRadius: '40px 40px 8px 40px'}}>Подключи меня</div>
				</Pop>
				<Pop at={12} style={{alignSelf: 'flex-start'}}>
					<div style={{background: '#fff', color: '#0b1b44', fontFamily: font, fontWeight: 800, fontSize: 50, padding: '28px 40px', borderRadius: '40px 40px 40px 8px', minWidth: 200, display: 'flex', alignItems: 'center', gap: 18}}>
						{typing ? (
							[0, 1, 2].map((i) => <span key={i} style={{width: 18, height: 18, borderRadius: 9, background: '#8aa0c8', translate: `0 ${Math.sin(f / 2 + i) * 6}px`}} />)
						) : done ? (
							<>
								<svg width="54" height="54" viewBox="0 0 24 24">
									<circle cx="12" cy="12" r="11" fill="#22c55e" />
									<path d="M7 12.5 L10.5 16 L17 9" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
								Готово за минуту
							</>
						) : null}
					</div>
				</Pop>
			</div>
			<Slam text="AI‑ПОМОЩНИК" at={30} size={108} top={1050} rot={-3} />
			<Sfx at={0} src="notification-pop" volume={0.6} />
			<Sfx at={34} src="success-chime" volume={0.7} />
		</AbsoluteFill>
	);
};

const S8Price: React.FC = () => {
	const f = useCurrentFrame();
	const strike = interpolate(f, [4, 12], [0, 1], {...cl, easing: ease});
	return (
		<AbsoluteFill>
			<Bg mood="blue" />
			<div style={{position: 'absolute', top: 470, width: '100%', display: 'flex', justifyContent: 'center'}}>
				<div style={{position: 'relative', fontFamily: font, fontWeight: 900, fontSize: 170, color: 'rgba(255,255,255,0.55)', rotate: '-4deg'}}>
					1397 ₽
					<div style={{position: 'absolute', left: -20, top: '52%', height: 22, width: `${strike * 110}%`, background: RED, borderRadius: 11, rotate: '-8deg', boxShadow: `0 0 30px ${RED}`}} />
				</div>
			</div>
			<Slam text="ЧЕСТНАЯ ЦЕНА" at={16} size={140} top={800} rot={-3} />
			<Slam text="без доплат за «скорость»" at={28} size={62} top={1130} rot={-3} color="#bfe8ff" />
			<Sfx at={4} src="glitch-001" volume={0.6} />
			<Sfx at={18} src="handle-coins" volume={0.7} />
		</AbsoluteFill>
	);
};

const S9Hero: React.FC = () => {
	const f = useCurrentFrame();
	const k = interpolate(f, [0, 12], [0, 1], {...cl, easing: ease});
	return (
		<AbsoluteFill>
			<Bg mood="blue" />
			<AbsoluteFill style={{background: 'radial-gradient(circle at 50% 55%, rgba(255,255,255,0.35), rgba(255,255,255,0) 45%)', opacity: 0.5 + 0.5 * Math.sin(f / 5)}} />
			<Hero id="hr" size={680} bottom={1500} pose={flexPose(k, f)} />
			<Blur>
				<Slam text="HORZ VPN" at={6} size={170} top={240} rot={-4} />
			</Blur>
			<Sfx at={0} src="power-up-3" volume={0.6} />
		</AbsoluteFill>
	);
};

const S10Cta: React.FC = () => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const card = spring({frame: f - 4, fps, config: {damping: 13, stiffness: 170}});
	const tap = interpolate(f, [30, 36, 44], [0, 1, 0], cl);
	const finger = interpolate(f, [16, 30], [0, 1], {...cl, easing: ease});
	return (
		<AbsoluteFill>
			<Bg mood="blue" />
			<Hero id="ct" size={460} bottom={760} pose={flexPose(1, f, {mouth: 'smirk'})} />
			<div style={{position: 'absolute', top: 700, left: 80, right: 80, translate: `0 ${(1 - card) * 500}px`}}>
				<div style={{background: '#fff', borderRadius: 56, padding: '50px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26, boxShadow: '0 40px 100px rgba(0,30,120,0.55)'}}>
					<div style={{fontFamily: font, fontWeight: 900, fontSize: 60, color: '#0b1b44', textAlign: 'center', lineHeight: 1.1}}>Быстрый VPN за честные деньги</div>
					<div style={{display: 'flex', alignItems: 'center', gap: 18}}>
						<svg width="74" height="74" viewBox="0 0 24 24">
							<circle cx="12" cy="12" r="12" fill="#27a7e7" />
							<path d="M5.5 11.8 L17.5 7 L15.5 17.5 L11.6 14.6 L9.8 16.6 L10 13.5 L15.3 8.8 L8.6 12.8Z" fill="#fff" />
						</svg>
						<div style={{fontFamily: font, fontWeight: 900, fontSize: 76, color: BLUE}}>@horzvpnbot</div>
					</div>
					<div style={{position: 'relative'}}>
						<div style={{scale: String(1 + 0.04 * Math.sin(f / 4) - 0.08 * tap), background: 'linear-gradient(180deg,#3aa2ff,#0b5fe8)', color: '#fff', fontFamily: font, fontWeight: 900, fontSize: 58, padding: '32px 80px', borderRadius: 70, boxShadow: `0 16px 40px rgba(11,95,232,0.5), 0 0 ${60 * tap}px rgba(127,220,255,1)`}}>
							Запустить бота
						</div>
						<svg width="130" height="130" viewBox="0 0 24 24" style={{position: 'absolute', right: -40, bottom: -90, translate: `${(1 - finger) * 200}px ${(1 - finger) * 200 - tap * -10}px`, rotate: '-20deg'}}>
							<path d="M9 11 V 4.5 a1.5 1.5 0 0 1 3 0 V 10 l 5.5 1 c 1.2 .2 2 1.3 1.8 2.5 l -1 5 A 3 3 0 0 1 15.4 21 H 11 a 3 3 0 0 1 -2.4 -1.2 L 5 15 a1.5 1.5 0 0 1 2.3 -2 z" fill="#fff" stroke="#0b1b44" strokeWidth="1.2" strokeLinejoin="round" />
						</svg>
					</div>
				</div>
			</div>
			<Sfx at={4} src="card-slide-1" />
			<Sfx at={32} src="switch-on" />
			<Sfx at={34} src="success-chime" volume={0.6} />
		</AbsoluteFill>
	);
};

const scenes: {C: React.FC; d: number; t?: 'slide' | 'wipe' | 'flip' | 'fade' | 'slideUp'}[] = [
	{C: S1Hook, d: BAR},
	{C: S2NoProblem, d: BAR, t: 'wipe'},
	{C: S3Speed, d: BAR, t: 'slideUp'},
	{C: S4Devices, d: BAR, t: 'slide'},
	{C: S5Apps, d: BAR, t: 'flip'},
	{C: S6Logs, d: BAR, t: 'slideUp'},
	{C: S7Ai, d: BAR, t: 'wipe'},
	{C: S8Price, d: BAR, t: 'slide'},
	{C: S9Hero, d: BAR, t: 'fade'},
	{C: S10Cta, d: BAR + 30, t: 'slideUp'},
];

export const PROMO_FRAMES = scenes.reduce((a, s) => a + s.d, 0);

const pres = (t: string) =>
	t === 'wipe' ? wipe({direction: 'from-left'}) : t === 'flip' ? flip({direction: 'from-right'}) : t === 'fade' ? fade() : t === 'slideUp' ? slide({direction: 'from-bottom'}) : slide({direction: 'from-right'});

export const Promo: React.FC = () => (
	<AbsoluteFill style={{background: '#02050f'}}>
		<TransitionSeries>
			{scenes.map((s, i) => (
				<React.Fragment key={i}>
					{i > 0 ? <TransitionSeries.Transition presentation={pres(s.t!) as never} timing={linearTiming({durationInFrames: TR, easing: ease})} /> : null}
					<TransitionSeries.Sequence durationInFrames={s.d + (i < scenes.length - 1 ? TR : 0)}>
						<s.C />
					</TransitionSeries.Sequence>
				</React.Fragment>
			))}
		</TransitionSeries>
		<Grain />
		<Audio src={staticFile('promo/music.wav')} volume={0.85} />
		{scenes.slice(1).map((_, i) => (
			<Sfx key={i} at={(i + 1) * BAR - 6} src="card-slide-1" volume={0.35} />
		))}
	</AbsoluteFill>
);
