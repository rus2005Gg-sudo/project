import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {slide} from '@remotion/transitions/slide';
import {fade} from '@remotion/transitions/fade';
import {wipe} from '@remotion/transitions/wipe';
import {Robot, RPose} from './Robot';
import {font} from '../reel/ui';

export const G_FPS = 30;
const TR = 10;
const NAVY = '#0b1b44';
const BLUE = '#1a7cf5';
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const useSp = (at: number, damping = 13, stiffness = 170) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	return spring({frame: f - at, fps, config: {damping, stiffness}});
};

const blink = (f: number) => (f % 90 > 86 ? 0.2 : 1);

const Sfx: React.FC<{at: number; src: string; volume?: number}> = ({at, src, volume = 0.5}) => (
	<Sequence from={at} layout="none">
		<Audio src={staticFile(`sfx/${src}.mp3`)} volume={volume} />
	</Sequence>
);

const Waves: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / 30;
	return (
		<AbsoluteFill style={{background: 'linear-gradient(180deg,#ffffff 0%,#eef5ff 45%,#d6e7ff 100%)', overflow: 'hidden'}}>
			<svg width="1080" height="1920" style={{position: 'absolute'}}>
				<defs>
					<linearGradient id="wv1" x1="0" x2="1" y1="0" y2="1">
						<stop offset="0" stopColor="#bfe0ff" stopOpacity="0.2" />
						<stop offset="0.5" stopColor="#3aa2ff" stopOpacity="0.55" />
						<stop offset="1" stopColor="#0b5fe8" stopOpacity="0.9" />
					</linearGradient>
					<linearGradient id="wv2" x1="1" x2="0">
						<stop offset="0" stopColor="#7fd0ff" stopOpacity="0.1" />
						<stop offset="1" stopColor="#1a7cf5" stopOpacity="0.6" />
					</linearGradient>
					<filter id="wb"><feGaussianBlur stdDeviation="2" /></filter>
					<filter id="wbb"><feGaussianBlur stdDeviation="14" /></filter>
				</defs>
				<path
					d={`M-100 ${1480 + 40 * Math.sin(t)} C 200 ${1300 + 50 * Math.sin(t * 0.8)}, 600 ${1760 + 40 * Math.cos(t)}, 1180 ${1380 + 50 * Math.sin(t * 1.2)} L 1180 1920 L -100 1920 Z`}
					fill="url(#wv1)"
				/>
				<path
					d={`M-100 ${1640 + 30 * Math.cos(t)} C 300 ${1520 + 40 * Math.sin(t)}, 700 ${1860}, 1180 ${1600 + 40 * Math.cos(t * 0.9)} L 1180 1920 L -100 1920 Z`}
					fill="url(#wv2)"
				/>
				{[0, 1, 2].map((i) => (
					<path
						key={i}
						d={`M-100 ${1450 + i * 60 + 30 * Math.sin(t + i)} C 250 ${1330 + i * 50}, 650 ${1760 - i * 40 + 30 * Math.cos(t + i)}, 1180 ${1400 + i * 70}`}
						stroke="#ffffff"
						strokeWidth={i === 0 ? 4 : 2}
						fill="none"
						opacity={0.8 - i * 0.2}
						filter="url(#wb)"
					/>
				))}
				<path
					d={`M700 -100 C 1000 ${200 + 40 * Math.sin(t)}, 900 500, 1180 ${420 + 30 * Math.cos(t)} L 1180 -100 Z`}
					fill="url(#wv2)"
					opacity="0.5"
					filter="url(#wbb)"
				/>
			</svg>
		</AbsoluteFill>
	);
};

const Brand: React.FC = () => (
	<div style={{position: 'absolute', top: 110, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18}}>
		<div style={{width: 76, height: 76, borderRadius: 22, background: '#fff', boxShadow: '0 8px 24px rgba(11,95,232,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
			<Img src={staticFile('reel/logo.png')} style={{width: 50}} />
		</div>
		<div style={{fontFamily: font, fontWeight: 900, fontSize: 52, color: NAVY}}>
			Horz <span style={{color: BLUE}}>VPN</span>
		</div>
	</div>
);

const Headline: React.FC<{a: string; b?: string; at?: number; top: number; size?: number}> = ({a, b, at = 0, top, size = 104}) => {
	const f = useCurrentFrame();
	const line = (txt: string, d: number, grad: boolean) => {
		const p = interpolate(f - at - d, [0, 14], [0, 1], {...cl, easing: ease});
		return (
			<div
				style={{
					fontFamily: font,
					fontWeight: 900,
					fontSize: size,
					lineHeight: 1.05,
					letterSpacing: -2,
					opacity: p,
					translate: `0 ${(1 - p) * 60}px`,
					...(grad ? {background: 'linear-gradient(90deg,#0b5fe8,#1a9bff)', WebkitBackgroundClip: 'text', color: 'transparent'} : {color: NAVY}),
				}}
			>
				{txt}
			</div>
		);
	};
	return (
		<div style={{position: 'absolute', top, left: 70, right: 70, textAlign: 'center'}}>
			{line(a, 0, false)}
			{b ? line(b, 6, true) : null}
		</div>
	);
};

const Glass: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
	<div
		style={{
			background: 'rgba(255,255,255,0.82)',
			border: '2px solid rgba(255,255,255,0.95)',
			borderRadius: 44,
			boxShadow: '0 30px 80px rgba(11,95,232,0.18), inset 0 2px 0 #fff',
			...style,
		}}
	>
		{children}
	</div>
);

const RobotAt: React.FC<{x: number; bottom: number; size: number; pose: RPose; id: string; enter?: number; from?: 'bottom' | 'right'}> = ({x, bottom, size, pose, id, enter = 0, from = 'bottom'}) => {
	const f = useCurrentFrame();
	const p = useSp(enter, 12, 140);
	const float = Math.sin(f / 14) * 10;
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: bottom,
				translate: from === 'bottom' ? `-50% calc(-100% + ${(1 - p) * 900 + float}px)` : `calc(-50% + ${(1 - p) * 800}px) calc(-100% + ${float}px)`,
			}}
		>
			<Robot id={id} size={size} pose={pose} />
		</div>
	);
};

/* ---------------- scenes ---------------- */

const Gift: React.FC = () => {
	const f = useCurrentFrame();
	const lid = interpolate(f, [26, 38], [0, 1], {...cl, easing: ease});
	const burst = interpolate(f, [30, 70], [0, 1], cl);
	return (
		<div style={{position: 'absolute', left: 540, top: 1020, translate: '-50% -50%'}}>
			<svg width="420" height="420" viewBox="0 0 420 420" style={{overflow: 'visible'}}>
				<defs>
					<linearGradient id="gb" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0" stopColor="#3aa2ff" />
						<stop offset="1" stopColor="#0b5fe8" />
					</linearGradient>
				</defs>
				<circle cx="210" cy="170" r={60 + burst * 200} fill="#7fd0ff" opacity={(1 - burst) * 0.5} />
				<rect x="70" y="190" width="280" height="200" rx="26" fill="url(#gb)" />
				<rect x="185" y="190" width="50" height="200" fill="#fff" opacity="0.9" />
				<g transform={`translate(${lid * 60} ${-lid * 150}) rotate(${lid * 25} 210 170)`}>
					<rect x="50" y="140" width="320" height="70" rx="22" fill="url(#gb)" />
					<rect x="185" y="140" width="50" height="70" fill="#fff" />
					<path d="M210 140 C 160 60, 110 110, 200 140 M210 140 C 260 60, 310 110, 220 140" stroke="#fff" strokeWidth="18" fill="none" strokeLinecap="round" />
				</g>
			</svg>
			<div
				style={{
					position: 'absolute',
					left: '50%',
					top: 40,
					translate: `-50% ${-lid * 90}px`,
					scale: String(interpolate(f, [30, 44], [0.3, 1], {...cl, easing: Easing.bezier(0.34, 1.56, 0.64, 1)})),
					opacity: lid,
					fontFamily: font,
					fontWeight: 900,
					fontSize: 150,
					color: '#fff',
					background: 'linear-gradient(180deg,#1a9bff,#0b5fe8)',
					borderRadius: 50,
					padding: '10px 50px',
					whiteSpace: 'nowrap',
					boxShadow: '0 20px 60px rgba(11,95,232,0.45)',
				}}
			>
				30 дней
			</div>
			{[...Array(26)].map((_, i) => {
				const a = random(`c${i}`) * Math.PI * 2;
				const d = 200 + random(`d${i}`) * 400;
				const p = interpolate(f, [30, 75], [0, 1], cl);
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: 210 + Math.cos(a) * d * p,
							top: 160 + Math.sin(a) * d * p + p * p * 300,
							width: 22,
							height: 12,
							borderRadius: 4,
							background: ['#1a7cf5', '#35d7ff', '#ffd24a', '#ffffff'][i % 4],
							rotate: `${p * 720 + i * 30}deg`,
							opacity: p > 0 ? 1 - p * 0.8 : 0,
							boxShadow: '0 2px 6px rgba(11,95,232,0.3)',
						}}
					/>
				);
			})}
		</div>
	);
};

const S1Hook: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill>
			<Waves />
			<Brand />
			<Headline a="Дарим подписку" b="бесплатно!" top={270} />
			<Gift />
			<RobotAt id="h" x={820} bottom={1640} size={380} enter={6} from="right" pose={{armR: 150, wave: Math.sin(f / 4) * 25, tilt: -6, eyes: 'happy', blink: blink(f)}} />
			<Sfx at={6} src="card-slide-1" />
			<Sfx at={30} src="success-chime" volume={0.6} />
		</AbsoluteFill>
	);
};

const S2Step: React.FC = () => {
	const f = useCurrentFrame();
	const card = useSp(18, 11, 180);
	return (
		<AbsoluteFill>
			<Waves />
			<Brand />
			<Headline a="Что нужно" b="сделать?" top={300} size={120} />
			<div style={{position: 'absolute', top: 700, width: '100%', display: 'flex', justifyContent: 'center', scale: String(card)}}>
				<Glass style={{padding: '40px 70px', display: 'flex', alignItems: 'center', gap: 34}}>
					<div style={{width: 140, height: 140, borderRadius: 70, background: 'linear-gradient(180deg,#1a9bff,#0b5fe8)', color: '#fff', fontFamily: font, fontWeight: 900, fontSize: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 40px rgba(11,95,232,0.4)'}}>1</div>
					<div style={{fontFamily: font, fontWeight: 900, fontSize: 70, color: NAVY, lineHeight: 1.05}}>
						одно
						<br />
						действие
					</div>
				</Glass>
			</div>
			<RobotAt id="s" x={540} bottom={1700} size={420} pose={{armL: 18, armR: 18, tilt: Math.sin(f / 10) * 6, eyes: 'round', blink: blink(f)}} />
			<Sfx at={18} src="notification-pop" />
		</AbsoluteFill>
	);
};

const typeText = (f: number, from: number, text: string, cps = 1.2) => text.slice(0, Math.max(0, Math.floor((f - from) / cps)));

const Comment: React.FC<{name: string; text: string; at: number; color: string}> = ({name, text, at, color}) => {
	const p = useSp(at, 14, 200);
	return (
		<div style={{display: 'flex', alignItems: 'center', gap: 22, opacity: p, translate: `0 ${(1 - p) * 40}px`, scale: String(0.9 + 0.1 * p)}}>
			<div style={{width: 76, height: 76, borderRadius: 38, background: color, color: '#fff', fontFamily: font, fontWeight: 900, fontSize: 36, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{name[0]}</div>
			<div>
				<div style={{fontFamily: font, fontWeight: 800, fontSize: 30, color: '#6b7a99'}}>{name}</div>
				<div style={{fontFamily: font, fontWeight: 900, fontSize: 52, color: NAVY}}>{text}</div>
			</div>
		</div>
	);
};

const S3Comments: React.FC = () => {
	const f = useCurrentFrame();
	const typed = typeText(f, 70, '+', 1);
	const sent = f > 86;
	const names: [string, string][] = [
		['alex.run', '#ff7a59'],
		['masha_k', '#9b5cff'],
		['den4ik', '#22c55e'],
		['kate.art', '#ff4fa0'],
	];
	return (
		<AbsoluteFill>
			<Waves />
			<Headline a="Напиши «+»" b="в комментариях" top={170} size={100} />
			<div style={{position: 'absolute', top: 480, left: 80, right: 80}}>
				<Glass style={{padding: '44px 44px 36px'}}>
					<div style={{fontFamily: font, fontWeight: 900, fontSize: 36, color: NAVY, marginBottom: 30}}>Комментарии</div>
					<div style={{display: 'flex', flexDirection: 'column', gap: 28}}>
						{names.map(([n, c], i) => (
							<Comment key={n} name={n} text="+" at={8 + i * 10} color={c} />
						))}
						{sent ? <Comment name="ты" text="+" at={86} color={BLUE} /> : null}
					</div>
					<div style={{marginTop: 36, display: 'flex', alignItems: 'center', gap: 20, background: '#f1f5fc', borderRadius: 40, padding: '20px 26px', border: `3px solid ${f > 60 ? BLUE : 'transparent'}`}}>
						<div style={{flex: 1, fontFamily: font, fontWeight: 800, fontSize: 44, color: sent || typed ? NAVY : '#9aa8c4'}}>
							{sent ? '' : typed || 'Добавьте комментарий…'}
							{f > 60 && !sent && f % 16 < 8 ? <span style={{color: BLUE}}>|</span> : null}
						</div>
						<div style={{width: 78, height: 78, borderRadius: 39, background: typed && !sent ? BLUE : '#c9d6ec', display: 'flex', alignItems: 'center', justifyContent: 'center', scale: String(f > 80 && f < 90 ? 0.88 : 1)}}>
							<svg width="40" height="40" viewBox="0 0 24 24">
								<path d="M3 11.5 L20 4.5 L17 19.5 L11.5 15.5 L9 18.5 L9.3 14 L17 7.5 L7.5 13Z" fill="#fff" />
							</svg>
						</div>
					</div>
				</Glass>
			</div>
			<RobotAt id="c" x={880} bottom={1780} size={300} pose={{armR: 140, wave: Math.sin(f / 5) * 15, eyes: 'happy', blink: blink(f)}} />
			{[8, 18, 28, 38].map((a) => (
				<Sfx key={a} at={a} src="notification-pop" volume={0.35} />
			))}
			<Sfx at={70} src="tick-001" volume={0.5} />
			<Sfx at={84} src="switch-on" volume={0.5} />
			<Sfx at={86} src="success-chime" volume={0.5} />
		</AbsoluteFill>
	);
};

const S4Telegram: React.FC = () => {
	const f = useCurrentFrame();
	const q = typeText(f, 16, 'horzvpnbot', 2);
	const chat = f > 50;
	const plus = f > 78;
	const reply = f > 110;
	const tgBg = 'linear-gradient(180deg,#dcebfb,#c9e0f7)';
	return (
		<AbsoluteFill>
			<Waves />
			<Headline a="Или найди бота" b="в Telegram" top={170} size={100} />
			<div style={{position: 'absolute', top: 470, left: 80, right: 80, height: 1030}}>
				<Glass style={{height: '100%', overflow: 'hidden', padding: 0}}>
					{!chat ? (
						<div style={{padding: 40}}>
							<div style={{display: 'flex', alignItems: 'center', gap: 20, background: '#f1f5fc', borderRadius: 40, padding: '22px 30px', border: `3px solid ${BLUE}`}}>
								<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#6b7a99" strokeWidth="2.4" strokeLinecap="round">
									<circle cx="11" cy="11" r="7" />
									<path d="M16.5 16.5 L21 21" />
								</svg>
								<div style={{fontFamily: font, fontWeight: 800, fontSize: 48, color: NAVY}}>
									@{q}
									{f % 16 < 8 ? <span style={{color: BLUE}}>|</span> : null}
								</div>
							</div>
							{f > 38 ? (
								<div style={{marginTop: 30, display: 'flex', alignItems: 'center', gap: 24, padding: 20, borderRadius: 30, background: f > 44 ? '#e6f0ff' : 'transparent'}}>
									<div style={{width: 110, height: 110, borderRadius: 55, background: '#fff', boxShadow: '0 6px 20px rgba(11,95,232,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
										<Img src={staticFile('reel/logo.png')} style={{width: 66}} />
									</div>
									<div>
										<div style={{fontFamily: font, fontWeight: 900, fontSize: 48, color: NAVY}}>Horz VPN</div>
										<div style={{fontFamily: font, fontWeight: 800, fontSize: 34, color: BLUE}}>@horzvpnbot · бот</div>
									</div>
								</div>
							) : null}
						</div>
					) : (
						<div style={{height: '100%', background: tgBg, display: 'flex', flexDirection: 'column'}}>
							<div style={{display: 'flex', alignItems: 'center', gap: 20, padding: '26px 30px', background: 'rgba(255,255,255,0.9)'}}>
								<div style={{width: 84, height: 84, borderRadius: 42, background: '#fff', boxShadow: '0 4px 14px rgba(11,95,232,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
									<Img src={staticFile('reel/logo.png')} style={{width: 50}} />
								</div>
								<div>
									<div style={{fontFamily: font, fontWeight: 900, fontSize: 40, color: NAVY}}>Horz VPN</div>
									<div style={{fontFamily: font, fontWeight: 800, fontSize: 28, color: '#6b7a99'}}>{reply || !plus ? 'бот' : 'печатает…'}</div>
								</div>
							</div>
							<div style={{flex: 1, padding: 34, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 22}}>
								{plus ? (
									<Bubble me at={78}>
										<span style={{fontSize: 80}}>+</span>
									</Bubble>
								) : null}
								{reply ? (
									<Bubble at={110}>
										Подписка на <b style={{color: BLUE}}>30 дней</b> активирована!
									</Bubble>
								) : null}
							</div>
							<div style={{display: 'flex', alignItems: 'center', gap: 18, padding: '20px 26px', background: '#fff'}}>
								<div style={{flex: 1, fontFamily: font, fontWeight: 800, fontSize: 42, color: f > 60 && !plus ? NAVY : '#9aa8c4'}}>{f > 60 && !plus ? '+' : 'Сообщение'}</div>
								<svg width="54" height="54" viewBox="0 0 24 24">
									<circle cx="12" cy="12" r="12" fill={BLUE} />
									<path d="M6 11.8 L17.5 7 L15.5 17.5 L11.6 14.6 L9.8 16.6 L10 13.5 L15.3 8.8 L8.6 12.8Z" fill="#fff" />
								</svg>
							</div>
						</div>
					)}
				</Glass>
			</div>
			{[16, 20, 24, 28, 32, 36].map((a) => (
				<Sfx key={a} at={a} src="tick-001" volume={0.3} />
			))}
			<Sfx at={50} src="card-slide-1" volume={0.5} />
			<Sfx at={78} src="switch-on" volume={0.5} />
			<Sfx at={110} src="success-chime" volume={0.6} />
		</AbsoluteFill>
	);
};

const Bubble: React.FC<{children: React.ReactNode; me?: boolean; at: number}> = ({children, me, at}) => {
	const p = useSp(at, 13, 220);
	return (
		<div
			style={{
				alignSelf: me ? 'flex-end' : 'flex-start',
				maxWidth: '82%',
				background: me ? '#e1f7d5' : '#fff',
				borderRadius: me ? '36px 36px 8px 36px' : '36px 36px 36px 8px',
				padding: '22px 34px',
				fontFamily: font,
				fontWeight: 800,
				fontSize: 44,
				color: NAVY,
				lineHeight: 1.2,
				boxShadow: '0 6px 18px rgba(11,40,100,0.12)',
				scale: String(p),
				transformOrigin: me ? 'bottom right' : 'bottom left',
			}}
		>
			{children}
		</div>
	);
};

const feats = [
	['Безопасность', 'в сети', 'shield'],
	['Высокая', 'скорость', 'bolt'],
	['Доступ', 'к сервисам', 'globe'],
	['AI-помощник', '24/7', 'bot'],
];

const FeatIcon: React.FC<{k: string}> = ({k}) => (
	<svg width="74" height="74" viewBox="0 0 24 24">
		<defs>
			<linearGradient id={`fi${k}`} x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stopColor="#3aa2ff" />
				<stop offset="1" stopColor="#0b5fe8" />
			</linearGradient>
		</defs>
		{k === 'shield' && (
			<>
				<path d="M12 2 L20 5 V11 C20 16 16.5 20 12 22 C7.5 20 4 16 4 11 V5Z" fill={`url(#fi${k})`} />
				<path d="M8 12 L11 15 L16 9" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
			</>
		)}
		{k === 'bolt' && <path d="M13.5 2 L5 13.5 H11 L10 22 L19 10 H13 Z" fill={`url(#fi${k})`} />}
		{k === 'globe' && (
			<g fill="none" stroke={`url(#fi${k})`} strokeWidth="2">
				<circle cx="12" cy="12" r="9" />
				<ellipse cx="12" cy="12" rx="4" ry="9" />
				<path d="M3 12 H21 M4.5 7.5 H19.5 M4.5 16.5 H19.5" />
			</g>
		)}
		{k === 'bot' && (
			<>
				<rect x="4" y="7" width="16" height="12" rx="5" fill={`url(#fi${k})`} />
				<circle cx="9.5" cy="13" r="1.6" fill="#fff" />
				<circle cx="14.5" cy="13" r="1.6" fill="#fff" />
				<path d="M12 7 V4" stroke={`url(#fi${k})`} strokeWidth="2" strokeLinecap="round" />
				<circle cx="12" cy="3.5" r="1.4" fill="#3aa2ff" />
			</>
		)}
	</svg>
);

const S5Features: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill>
			<Waves />
			<Brand />
			<Headline a="30 дней" b="на своей волне" top={250} size={96} />
			<div style={{position: 'absolute', top: 560, left: 90, right: 90, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30}}>
				{feats.map(([a, b, k], i) => {
					const p = interpolate(f - 14 - i * 6, [0, 14], [0, 1], {...cl, easing: ease});
					return (
						<Glass key={k} style={{padding: '36px 30px', opacity: p, translate: `0 ${(1 - p) * 80}px`}}>
							<div style={{width: 110, height: 110, borderRadius: 32, background: '#fff', boxShadow: '0 10px 26px rgba(11,95,232,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
								<FeatIcon k={k} />
							</div>
							<div style={{marginTop: 22, fontFamily: font, fontWeight: 800, fontSize: 42, color: NAVY, lineHeight: 1.15}}>
								{a}
								<br />
								<span style={{color: '#4b5a7a'}}>{b}</span>
							</div>
						</Glass>
					);
				})}
			</div>
			{[14, 20, 26, 32].map((a) => (
				<Sfx key={a} at={a} src="notification-pop" volume={0.3} />
			))}
		</AbsoluteFill>
	);
};

const S6Cta: React.FC = () => {
	const f = useCurrentFrame();
	const plus = useSp(10, 8, 200);
	return (
		<AbsoluteFill>
			<Waves />
			<Brand />
			<Headline a="Пиши «+»" b="прямо сейчас" top={250} size={124} />
			<div style={{position: 'absolute', top: 560, width: '100%', display: 'flex', justifyContent: 'center'}}>
				<div
					style={{
						width: 300,
						height: 300,
						borderRadius: 150,
						background: 'linear-gradient(180deg,#1a9bff,#0b5fe8)',
						color: '#fff',
						fontFamily: font,
						fontWeight: 900,
						fontSize: 260,
						lineHeight: '280px',
						textAlign: 'center',
						scale: String(plus * (1 + 0.05 * Math.sin(f / 5))),
						boxShadow: `0 30px 80px rgba(11,95,232,0.45), 0 0 0 ${20 + 14 * Math.sin(f / 5)}px rgba(26,124,245,0.15)`,
					}}
				>
					+
				</div>
			</div>
			<div style={{position: 'absolute', top: 930, width: '100%', display: 'flex', justifyContent: 'center'}}>
				<Glass style={{padding: '26px 44px', display: 'flex', alignItems: 'center', gap: 18}}>
					<svg width="64" height="64" viewBox="0 0 24 24">
						<circle cx="12" cy="12" r="12" fill="#27a7e7" />
						<path d="M5.5 11.8 L17.5 7 L15.5 17.5 L11.6 14.6 L9.8 16.6 L10 13.5 L15.3 8.8 L8.6 12.8Z" fill="#fff" />
					</svg>
					<div style={{fontFamily: font, fontWeight: 900, fontSize: 64, color: BLUE}}>@horzvpnbot</div>
				</Glass>
			</div>
			<RobotAt id="ct" x={540} bottom={1760} size={440} pose={{armR: 150, armL: 150, wave: Math.sin(f / 4) * 25, eyes: f % 60 < 30 ? 'happy' : 'wink', blink: 1}} />
			<Sfx at={10} src="notification-pop" volume={0.5} />
		</AbsoluteFill>
	);
};

const SCENES: {C: React.FC; d: number; t?: 'slide' | 'fade' | 'wipe' | 'up'}[] = [
	{C: S1Hook, d: 120},
	{C: S2Step, d: 90, t: 'slide'},
	{C: S3Comments, d: 150, t: 'up'},
	{C: S4Telegram, d: 180, t: 'slide'},
	{C: S5Features, d: 120, t: 'wipe'},
	{C: S6Cta, d: 110, t: 'up'},
];

export const GIVEAWAY_FRAMES = SCENES.reduce((a, s) => a + s.d, 0);

const pres = (t: string) => (t === 'fade' ? fade() : t === 'wipe' ? wipe({direction: 'from-left'}) : t === 'up' ? slide({direction: 'from-bottom'}) : slide({direction: 'from-right'}));

export const Giveaway: React.FC = () => (
	<AbsoluteFill style={{background: '#fff'}}>
		<TransitionSeries>
			{SCENES.map((s, i) => (
				<React.Fragment key={i}>
					{i > 0 ? <TransitionSeries.Transition presentation={pres(s.t!) as never} timing={linearTiming({durationInFrames: TR, easing: ease})} /> : null}
					<TransitionSeries.Sequence durationInFrames={s.d + (i < SCENES.length - 1 ? TR : 0)}>
						<s.C />
					</TransitionSeries.Sequence>
				</React.Fragment>
			))}
		</TransitionSeries>
	</AbsoluteFill>
);
