import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {BLUE, Brand, Gift, Glass, Headline, Mark, NAVY, Sfx as BaseSfx, Waves, cl, ease, useSp} from '../giveaway/Giveaway';

const Sfx: React.FC<{at: number; src: string; volume?: number}> = ({volume = 0.5, ...r}) => <BaseSfx {...r} volume={volume * 0.55} />;
import {font} from '../reel/ui';

export const M_FPS = 30;
const TR = 10;

/* ---------- small pieces ---------- */

const Chip: React.FC<{at: number; icon: React.ReactNode; big: string; small: string}> = ({at, icon, big, small}) => {
	const p = useSp(at, 12, 180);
	return (
		<div style={{scale: String(0.6 + 0.4 * p), opacity: interpolate(p, [0, 0.3], [0, 1], cl)}}>
			<Glass style={{padding: '34px 44px', display: 'flex', alignItems: 'center', gap: 34}}>
				<div style={{width: 130, height: 130, borderRadius: 38, background: '#fff', boxShadow: '0 10px 26px rgba(11,95,232,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{icon}</div>
				<div>
					<div style={{fontFamily: font, fontWeight: 900, fontSize: 80, lineHeight: 1, color: NAVY, letterSpacing: -2, whiteSpace: 'nowrap'}}>{big}</div>
					<div style={{fontFamily: font, fontWeight: 800, fontSize: 38, color: '#5b6a8a', marginTop: 6}}>{small}</div>
				</div>
			</Glass>
		</div>
	);
};

const Ico: React.FC<{k: 'cal' | 'db' | 'dev' | 'tg'}> = ({k}) => (
	<svg width="80" height="80" viewBox="0 0 24 24">
		<defs>
			<linearGradient id={`mi${k}`} x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stopColor="#3aa2ff" />
				<stop offset="1" stopColor="#0b5fe8" />
			</linearGradient>
		</defs>
		{k === 'cal' && (
			<>
				<rect x="3" y="5" width="18" height="16" rx="3.5" fill={`url(#mi${k})`} />
				<rect x="3" y="5" width="18" height="5" rx="2" fill="#0b4fc9" />
				<path d="M8 3 V7 M16 3 V7" stroke="#0b4fc9" strokeWidth="2.2" strokeLinecap="round" />
				<text x="12" y="18.6" textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize="7.5" fill="#fff">30</text>
			</>
		)}
		{k === 'db' && (
			<>
				<ellipse cx="12" cy="5.5" rx="8" ry="3" fill="#3aa2ff" />
				<path d="M4 5.5 V18.5 C4 20.2 7.6 21.5 12 21.5 C16.4 21.5 20 20.2 20 18.5 V5.5 C20 7.2 16.4 8.5 12 8.5 C7.6 8.5 4 7.2 4 5.5 Z" fill={`url(#mi${k})`} />
				<path d="M4 12 C4 13.7 7.6 15 12 15 C16.4 15 20 13.7 20 12" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.2" fill="none" />
			</>
		)}
		{k === 'dev' && (
			<>
				<rect x="2" y="5" width="14" height="10" rx="1.8" fill={`url(#mi${k})`} />
				<path d="M1 17.5 H17" stroke="#0b4fc9" strokeWidth="2" strokeLinecap="round" />
				<rect x="15.5" y="8" width="7" height="13" rx="1.8" fill="#0b4fc9" stroke="#fff" strokeWidth="1.2" />
			</>
		)}
		{k === 'tg' && (
			<>
				<circle cx="12" cy="12" r="11" fill="#27a7e7" />
				<path d="M5.5 11.8 L17.5 7 L15.5 17.5 L11.6 14.6 L9.8 16.6 L10 13.5 L15.3 8.8 L8.6 12.8Z" fill="#fff" />
			</>
		)}
	</svg>
);

/* ---------- scenes ---------- */

const S1Hook: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill>
			<Waves />
			<Brand />
			<Headline a="Месяц VPN" b="бесплатно!" top={260} size={124} />
			<Gift />
			<Sfx at={6} src="card-slide-1" />
			<Sfx at={30} src="success-chime" volume={0.55} />
		</AbsoluteFill>
	);
};

const S2Offer: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill>
			<Waves />
			<Brand />
			<Headline a="Что" b="в подарке?" top={250} size={120} />
			<div style={{position: 'absolute', top: 600, left: 110, right: 110, display: 'flex', flexDirection: 'column', gap: 34}}>
				<Chip at={4} icon={<Ico k="cal" />} big="30 дней" small="полный доступ" />
				<Chip at={28} icon={<Ico k="db" />} big="100 ГБ" small="трафика" />
				<Chip at={52} icon={<Ico k="dev" />} big="2 устройства" small="телефон + ноутбук" />
			</div>
			{[4, 28, 52].map((a) => (
				<Sfx key={a} at={a} src="notification-pop" volume={0.4} />
			))}
		</AbsoluteFill>
	);
};

const dataRows = ['IP-адрес', 'Какие сайты открываешь', 'Время подключений', 'Устройство'];

const S3NoLogs: React.FC = () => {
	const f = useCurrentFrame();
	const stamp = useSp(112, 9, 240);
	return (
		<AbsoluteFill>
			<Waves />
			<Brand />
			<Headline a="Не собираем логи" b="и не продаём данные" top={250} size={76} />
			<div style={{position: 'absolute', top: 560, left: 100, right: 100}}>
				<Glass style={{padding: '40px 44px'}}>
					<div style={{fontFamily: font, fontWeight: 900, fontSize: 34, color: '#6b7a99', marginBottom: 18}}>Что мы храним о тебе:</div>
					{dataRows.map((r, i) => {
						const on = interpolate(f - 10 - i * 20, [0, 10], [0, 1], {...cl, easing: ease});
						const strike = interpolate(f - 18 - i * 20, [0, 8], [0, 1], {...cl, easing: ease});
						return (
							<div key={r} style={{display: 'flex', alignItems: 'center', gap: 20, padding: '18px 0', borderTop: i ? '2px solid #e6eefb' : 'none', opacity: on, translate: `${(1 - on) * 60}px 0`}}>
								<Mark ok={false} />
								<div style={{position: 'relative', fontFamily: font, fontWeight: 800, fontSize: 44, color: strike > 0.5 ? '#9aa8c4' : NAVY}}>
									{r}
									<div style={{position: 'absolute', left: -6, top: '52%', height: 6, width: `${strike * 104}%`, background: '#ff4d6d', borderRadius: 3}} />
								</div>
							</div>
						);
					})}
				</Glass>
			</div>
			<div
				style={{
					position: 'absolute',
					top: 1260,
					width: '100%',
					display: 'flex',
					justifyContent: 'center',
					scale: String(interpolate(stamp, [0, 1], [2.6, 1])),
					opacity: interpolate(stamp, [0, 0.2], [0, 1], cl),
					rotate: '-6deg',
				}}
			>
				<div style={{fontFamily: font, fontWeight: 900, fontSize: 96, color: '#fff', background: 'linear-gradient(180deg,#1a9bff,#0b5fe8)', borderRadius: 36, padding: '10px 50px', boxShadow: '0 20px 60px rgba(11,95,232,0.45)'}}>Ничего. 0 логов</div>
			</div>
			{dataRows.map((_, i) => (
				<Sfx key={i} at={18 + i * 20} src="tick-001" volume={0.35} />
			))}
			<Sfx at={112} src="impact-punch-medium-001" volume={0.5} />
		</AbsoluteFill>
	);
};

const S4Speed: React.FC = () => {
	const f = useCurrentFrame();
	const v = interpolate(f, [10, 45], [0, 10], {...cl, easing: ease});
	const needle = interpolate(v, [0, 10], [-120, 100]);
	return (
		<AbsoluteFill>
			<Waves />
			<Brand />
			<Headline a="Скоростная сеть" b="без тормозов" top={250} size={100} />
			{[...Array(8)].map((_, i) => {
				const x = ((f * 40 + i * 260) % 1600) - 300;
				return <div key={i} style={{position: 'absolute', left: x, top: 640 + i * 90, width: 260, height: 6, borderRadius: 3, background: 'linear-gradient(90deg, rgba(26,124,245,0), rgba(26,124,245,0.35))'}} />;
			})}
			<div style={{position: 'absolute', top: 560, width: '100%', display: 'flex', justifyContent: 'center'}}>
				<svg width="820" height="560" viewBox="0 0 820 560">
					<defs>
						<linearGradient id="spg" x1="0" x2="1">
							<stop offset="0" stopColor="#7fd0ff" />
							<stop offset="1" stopColor="#0b5fe8" />
						</linearGradient>
					</defs>
					<path d="M110 480 A 300 300 0 1 1 710 480" stroke="#dfeafb" strokeWidth="60" fill="none" strokeLinecap="round" />
					<path d="M110 480 A 300 300 0 1 1 710 480" stroke="url(#spg)" strokeWidth="60" fill="none" strokeLinecap="round" strokeDasharray="1260" strokeDashoffset={1260 * (1 - v / 10)} />
					<g transform={`translate(410 400) rotate(${needle})`}>
						<path d="M-14 0 L 0 -270 L 14 0 Z" fill={NAVY} />
						<circle r="30" fill={NAVY} />
					</g>
				</svg>
			</div>
			<div style={{position: 'absolute', top: 1060, width: '100%', textAlign: 'center', fontFamily: font, fontWeight: 900, lineHeight: 1, color: NAVY}}>
				<span style={{fontSize: 90, color: '#5b6a8a'}}>до </span>
				<span style={{fontSize: 230, letterSpacing: -8, background: 'linear-gradient(90deg,#0b5fe8,#1a9bff)', WebkitBackgroundClip: 'text', color: 'transparent'}}>{v.toFixed(0)}</span>
				<span style={{fontSize: 90}}> Гбит/с</span>
			</div>
			<Sfx at={10} src="power-up-3" volume={0.35} />
		</AbsoluteFill>
	);
};

const apps = [
	{bg: 'radial-gradient(circle at 30% 107%,#fdf497 0%,#fd5949 45%,#d6249f 60%,#285aeb 90%)', icon: <><rect x="3" y="3" width="18" height="18" rx="5.5" stroke="#fff" strokeWidth="2" fill="none" /><circle cx="12" cy="12" r="4.2" stroke="#fff" strokeWidth="2" fill="none" /></>},
	{bg: 'linear-gradient(145deg,#ff4a4a,#e00000)', icon: <path d="M9 7 L17.5 12 L9 17Z" fill="#fff" />},
	{bg: '#0b0b10', icon: <path d="M13 3 H16 C16.3 5.2 17.8 6.7 20 7 V10 C18.5 10 17.1 9.5 16 8.7 V15 A6 6 0 1 1 10 9 V12.2 A2.9 2.9 0 1 0 13 15Z" fill="#fff" />},
	{bg: 'linear-gradient(145deg,#4cc3ff,#1d8fe0)', icon: <path d="M3 11.5 L20 4.5 L17 19.5 L11.5 15.5 L9 18.5 L9.3 14 L17 7.5 L7.5 13Z" fill="#fff" />},
];

const S5Stable: React.FC = () => {
	const f = useCurrentFrame();
	const chip = useSp(72, 12, 180);
	return (
		<AbsoluteFill>
			<Waves />
			<Brand />
			<Headline a="Соцсети и сервисы" b="без тормозов" top={250} size={84} />
			<div style={{position: 'absolute', top: 660, width: '100%', display: 'flex', justifyContent: 'center', gap: 34}}>
				{apps.map((a, i) => {
					const p = useSpLocal(f, 8 + i * 7);
					return (
						<div key={i} style={{scale: String(p), translate: `0 ${Math.sin(f / 7 + i) * 12}px`}}>
							<div style={{width: 190, height: 190, borderRadius: 52, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 50px rgba(11,40,100,0.25)'}}>
								<svg width="112" height="112" viewBox="0 0 24 24">
									{a.icon}
								</svg>
							</div>
						</div>
					);
				})}
			</div>
			<div style={{position: 'absolute', top: 960, width: '100%', display: 'flex', justifyContent: 'center', scale: String(chip), opacity: chip}}>
				<Glass style={{padding: '30px 50px', display: 'flex', alignItems: 'center', gap: 26}}>
					<div style={{width: 26, height: 26, borderRadius: 13, background: '#22c55e', boxShadow: `0 0 0 ${8 + 6 * Math.sin(f / 5)}px rgba(34,197,94,0.2)`}} />
					<div style={{fontFamily: font, fontWeight: 900, fontSize: 66, color: NAVY}}>
						Серверы онлайн <span style={{color: BLUE}}>24/7</span>
					</div>
				</Glass>
			</div>
			{[8, 15, 22, 29].map((a) => (
				<Sfx key={a} at={a} src="notification-pop" volume={0.35} />
			))}
		</AbsoluteFill>
	);
};

const useSpLocal = (f: number, at: number) => interpolate(f - at, [0, 6, 10], [0, 1.12, 1], {...cl, easing: Easing.out(Easing.quad)});

const S6Ai: React.FC = () => {
	const f = useCurrentFrame();
	const typing = f > 22 && f < 46;
	const done = f >= 46;
	const b1 = useSp(8, 13, 220);
	const b2 = useSp(20, 13, 220);
	return (
		<AbsoluteFill>
			<Waves />
			<Brand />
			<Headline a="AI-помощник" b="поможет подключиться" top={250} size={70} />
			<div style={{position: 'absolute', top: 780, left: 80, right: 80, display: 'flex', flexDirection: 'column', gap: 34}}>
				<div style={{alignSelf: 'flex-end', scale: String(b1), transformOrigin: 'bottom right', background: BLUE, color: '#fff', fontFamily: font, fontWeight: 800, fontSize: 56, padding: '30px 44px', borderRadius: '44px 44px 8px 44px', boxShadow: '0 12px 30px rgba(11,95,232,0.3)'}}>Как подключиться на iPhone?</div>
				<div style={{alignSelf: 'flex-start', scale: String(b2), transformOrigin: 'bottom left', background: '#fff', color: NAVY, fontFamily: font, fontWeight: 800, fontSize: 54, padding: '30px 44px', borderRadius: '44px 44px 44px 8px', boxShadow: '0 12px 30px rgba(11,40,100,0.12)', display: 'flex', alignItems: 'center', gap: 16, minWidth: 180}}>
					{typing ? [0, 1, 2].map((i) => <span key={i} style={{width: 18, height: 18, borderRadius: 9, background: '#8aa0c8', translate: `0 ${Math.sin(f / 2 + i) * 6}px`}} />) : null}
					{done ? (
						<>
							<Mark ok />
							Готово! Нажми «Подключить»
						</>
					) : null}
				</div>
			</div>
			<Sfx at={8} src="notification-pop" volume={0.4} />
			<Sfx at={46} src="success-chime" volume={0.5} />
		</AbsoluteFill>
	);
};

/* ---------- how-to with the real screen recording ---------- */

const SRC_W = 826;
const SRC_H = 1704;
const SCREEN_W = 560;
const SCREEN_H = (SCREEN_W * SRC_H) / SRC_W;
const K = SCREEN_W / SRC_W;
// source seconds of the recording: Старт tapped 1.45, gift button 4.15, gift arrives 5.0, end 6.1
const SEG_A = 70; // src 0 -> 1.45
const SEG_B = 125; // src 1.45 -> 4.15
const SEG_C = 183; // src 4.15 -> 6.1
const TAP_START = SEG_A;
const TAP_GIFT = SEG_B;
const TAP_CONNECT = 222;

type Cam = [number, number, number, number];
const cams: Cam[] = [
	[0, 413, 852, 1],
	[46, 413, 852, 1],
	[60, 413, 1500, 1.6],
	[80, 413, 1500, 1.6],
	[90, 413, 852, 1],
	[94, 413, 852, 1],
	[104, 323, 1060, 1.35],
	[112, 323, 1060, 1.35],
	[119, 323, 1300, 1.5],
	[132, 323, 1300, 1.5],
	[142, 413, 852, 1],
	[150, 413, 852, 1],
	[162, 323, 850, 1.35],
	[190, 323, 850, 1.35],
	[206, 323, 1230, 1.55],
	[260, 323, 1230, 1.55],
]

const camAt = (f: number) => {
	const ks = cams.map((c) => c[0]);
	const ch = (i: number) => interpolate(f, ks, cams.map((c) => c[i]), {...cl, easing: Easing.inOut(Easing.cubic)});
	const z = ch(3);
	const cx = Math.min(Math.max(ch(1), SRC_W / 2 / z), SRC_W - SRC_W / 2 / z);
	const cy = Math.min(Math.max(ch(2), SRC_H / 2 / z), SRC_H - SRC_H / 2 / z);
	return {cx, cy, z};
};

const Tap: React.FC<{x: number; y: number; at: number}> = ({x, y, at}) => {
	const f = useCurrentFrame();
	const t = f - at;
	if (t < -8 || t > 22) return null;
	const approach = interpolate(t, [-8, 0], [0, 1], {...cl, easing: ease});
	const ring = interpolate(t, [0, 18], [0, 1], cl);
	return (
		<>
			<div style={{position: 'absolute', left: x - 60, top: y - 60, width: 120, height: 120, borderRadius: 60, background: 'rgba(255,255,255,0.55)', border: '6px solid #fff', scale: String(t < 0 ? 1.4 - 0.4 * approach : 1 - 0.15 * Math.min(1, t / 4)), opacity: t < 0 ? approach : 1 - ring, boxShadow: '0 0 30px rgba(26,124,245,0.9)'}} />
			<div style={{position: 'absolute', left: x - 60, top: y - 60, width: 120, height: 120, borderRadius: 60, border: '6px solid #7fd0ff', scale: String(1 + ring * 1.6), opacity: t >= 0 ? 1 - ring : 0}} />
		</>
	);
};

const steps: [number, number, string, string][] = [
	[0, 93, '1', 'Нажми «Старт»'],
	[93, 151, '2', 'Жми «Месяц бесплатно»'],
	[151, 999, '3', 'Подарок твой → «Подключить»'],
];

const vidStyle: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: SRC_W, height: SRC_H, display: 'block'};

const S7HowTo: React.FC = () => {
	const f = useCurrentFrame();
	const phoneIn = useSp(0, 14, 140);
	const {cx, cy, z} = camAt(f);
	const s = K * z;
	const step = steps.find(([a, b]) => f >= a && f < b)!;
	const stepP = interpolate(f - step[0], [0, 10], [0, 1], {...cl, easing: ease});
	return (
		<AbsoluteFill>
			<Waves />
			<Headline a="Как забрать?" top={110} size={100} />
			<div style={{position: 'absolute', top: 250, width: '100%', display: 'flex', justifyContent: 'center'}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 22, background: '#fff', borderRadius: 50, padding: '18px 40px 18px 18px', boxShadow: '0 16px 40px rgba(11,95,232,0.2)', opacity: stepP, translate: `0 ${(1 - stepP) * 30}px`}}>
					<div style={{width: 76, height: 76, borderRadius: 38, background: 'linear-gradient(180deg,#1a9bff,#0b5fe8)', color: '#fff', fontFamily: font, fontWeight: 900, fontSize: 46, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{step[2]}</div>
					<div style={{fontFamily: font, fontWeight: 900, fontSize: 50, color: NAVY}}>{step[3]}</div>
				</div>
			</div>
			<div style={{position: 'absolute', left: 540, top: 390, translate: `-50% ${(1 - phoneIn) * 1400}px`}}>
				<div style={{padding: 18, borderRadius: 86, background: 'linear-gradient(160deg,#2b3350,#0b0f1c)', boxShadow: '0 40px 100px rgba(11,40,120,0.35), inset 0 0 0 3px #4a557a'}}>
					<div style={{position: 'relative', width: SCREEN_W, height: SCREEN_H, borderRadius: 70, overflow: 'hidden', background: '#000'}}>
						<div style={{position: 'absolute', left: 0, top: 0, width: SRC_W, height: SRC_H, transformOrigin: '0 0', transform: `translate(${SCREEN_W / 2 - cx * s}px, ${SCREEN_H / 2 - cy * s}px) scale(${s})`}}>
							<Sequence durationInFrames={SEG_A} layout="none">
								<OffthreadVideo src={staticFile('giveaway/howto.mp4')} playbackRate={1.45 / (SEG_A / 30)} muted style={vidStyle} />
							</Sequence>
							<Sequence from={SEG_A} durationInFrames={SEG_B - SEG_A} layout="none">
								<OffthreadVideo src={staticFile('giveaway/howto.mp4')} trimBefore={Math.round(1.45 * 30)} playbackRate={(4.15 - 1.45) / ((SEG_B - SEG_A) / 30)} muted style={vidStyle} />
							</Sequence>
							<Sequence from={SEG_B} durationInFrames={SEG_C - SEG_B} layout="none">
								<OffthreadVideo src={staticFile('giveaway/howto.mp4')} trimBefore={Math.round(4.15 * 30)} muted style={vidStyle} />
							</Sequence>
							{f >= SEG_C ? <Img src={staticFile('giveaway/howto_last.png')} style={vidStyle} /> : null}
							<Tap x={413} y={1577} at={TAP_START} />
							<Tap x={320} y={1408} at={TAP_GIFT} />
							<Tap x={320} y={1322} at={TAP_CONNECT} />
						</div>
						<div style={{position: 'absolute', left: '50%', top: 14, translate: '-50% 0', width: 170, height: 40, borderRadius: 20, background: '#000'}} />
					</div>
				</div>
			</div>
			{f > 98 && f < 126 ? (
				<div style={{position: 'absolute', top: 1625, width: '100%', display: 'flex', justifyContent: 'center', opacity: interpolate(f, [98, 104, 120, 126], [0, 1, 1, 0], cl)}}>
					<Glass style={{padding: '22px 40px', fontFamily: font, fontWeight: 900, fontSize: 50, color: NAVY}}>
						30 дней · <span style={{color: BLUE}}>100 ГБ</span> · 2 устройства
					</Glass>
				</div>
			) : null}
			{f > 160 ? (
				<div style={{position: 'absolute', top: 1625, width: '100%', display: 'flex', justifyContent: 'center', opacity: interpolate(f, [160, 170], [0, 1], cl)}}>
					<Glass style={{padding: '22px 40px', display: 'flex', alignItems: 'center', gap: 16, fontFamily: font, fontWeight: 900, fontSize: 52, color: NAVY}}>
						<Mark ok /> Подписка на месяц — твоя
					</Glass>
				</div>
			) : null}
			<Sfx at={TAP_START} src="switch-on" volume={0.5} />
			<Sfx at={TAP_GIFT} src="switch-on" volume={0.5} />
			<Sfx at={150} src="success-chime" volume={0.5} />
			<Sfx at={TAP_CONNECT} src="switch-on" volume={0.5} />
		</AbsoluteFill>
	);
};

const S8Terms: React.FC = () => {
	const f = useCurrentFrame();
	const ch = useSp(8, 12, 180);
	const c = useSp(68, 12, 180);
	const tap = interpolate(f, [40, 46, 54], [0, 1, 0], cl);
	const subscribed = f >= 46;
	return (
		<AbsoluteFill>
			<Waves />
			<Brand />
			<Headline a="Подарок для подписчиков" b="нашего канала" top={280} size={80} />
			<div style={{position: 'absolute', top: 580, left: 90, right: 90, scale: String(ch), opacity: ch}}>
				<Glass style={{padding: '30px 32px', display: 'flex', alignItems: 'center', gap: 24}}>
					<div style={{width: 120, height: 120, borderRadius: 60, background: '#fff', boxShadow: '0 10px 26px rgba(11,95,232,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
						<Img src={staticFile('reel/logo.png')} style={{width: 80}} />
					</div>
					<div style={{flex: 1}}>
						<div style={{fontFamily: font, fontWeight: 900, fontSize: 50, color: NAVY, whiteSpace: 'nowrap'}}>Horz VPN</div>
						<div style={{fontFamily: font, fontWeight: 800, fontSize: 30, color: '#5b6a8a', whiteSpace: 'nowrap'}}>канал в Telegram</div>
					</div>
					<div
						style={{
							fontFamily: font,
							fontWeight: 900,
							fontSize: 30,
							whiteSpace: 'nowrap',
							flexShrink: 0,
							color: subscribed ? BLUE : '#fff',
							background: subscribed ? '#eaf3ff' : 'linear-gradient(180deg,#1a9bff,#0b5fe8)',
							padding: '18px 24px',
							borderRadius: 40,
							scale: String(1 - 0.08 * tap),
							boxShadow: subscribed ? 'none' : '0 10px 26px rgba(11,95,232,0.35)',
							display: 'flex',
							alignItems: 'center',
							gap: 10,
						}}
					>
						{subscribed ? <Mark ok /> : null}
						{subscribed ? 'Вы подписаны' : 'Подписаться'}
					</div>
				</Glass>
			</div>
			<div style={{position: 'absolute', top: 900, width: '100%', display: 'flex', justifyContent: 'center', scale: String(c), opacity: c}}>
				<Glass style={{padding: '40px 60px', display: 'flex', alignItems: 'center', gap: 30}}>
					<div style={{width: 110, height: 110, borderRadius: 55, background: 'linear-gradient(180deg,#ff8a3d,#ff4d6d)', display: 'flex', alignItems: 'center', justifyContent: 'center', scale: String(1 + 0.06 * Math.sin(f / 4)), boxShadow: '0 12px 30px rgba(255,77,109,0.35)'}}>
						<svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round">
							<circle cx="12" cy="13" r="8" />
							<path d="M12 9 V13 L15 15 M9 2 H15" />
						</svg>
					</div>
					<div style={{fontFamily: font, fontWeight: 900, fontSize: 70, color: NAVY, lineHeight: 1.05}}>
						Места
						<br />
						<span style={{color: '#ff4d6d'}}>ограничены</span>
					</div>
				</Glass>
			</div>
			<Sfx at={8} src="notification-pop" volume={0.45} />
			<Sfx at={44} src="switch-on" volume={0.45} />
			<Sfx at={68} src="notification-pop" volume={0.45} />
		</AbsoluteFill>
	);
};

const S9Cta: React.FC = () => {
	const f = useCurrentFrame();
	const a = useSp(8, 12, 180);
	const b = useSp(82, 12, 180);
	const link = useSp(136, 10, 200);
	const rem = useSp(150, 12, 180);
	return (
		<AbsoluteFill>
			<Waves />
			<Brand />
			<Headline a="Забери свой месяц" b="прямо сейчас" top={250} size={84} />
			<div style={{position: 'absolute', top: 600, left: 80, right: 80, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 30}}>
				<div style={{scale: String(a), opacity: a}}>
					<Glass style={{padding: '38px 44px', display: 'flex', alignItems: 'center', gap: 30}}>
						<Ico k="tg" />
						<div>
							<div style={{fontFamily: font, fontWeight: 800, fontSize: 38, color: '#5b6a8a'}}>Найди бота в Telegram</div>
							<div style={{fontFamily: font, fontWeight: 900, fontSize: 76, color: BLUE}}>@horzvpnbot</div>
						</div>
					</Glass>
				</div>
				<div style={{textAlign: 'center', fontFamily: font, fontWeight: 900, fontSize: 50, color: '#8a99b8', opacity: b}}>или</div>
				<div style={{scale: String(b), opacity: b}}>
					<Glass style={{padding: '38px 44px', display: 'flex', alignItems: 'center', gap: 30, boxShadow: `0 30px 80px rgba(11,95,232,0.18), 0 0 0 ${link * (8 + 6 * Math.sin(f / 5))}px rgba(26,124,245,0.18)`}}>
						<div style={{width: 120, height: 120, borderRadius: 60, background: 'linear-gradient(180deg,#1a9bff,#0b5fe8)', color: '#fff', fontFamily: font, fontWeight: 900, fontSize: 104, lineHeight: '112px', textAlign: 'center', flexShrink: 0, scale: String(1 + 0.06 * Math.sin(f / 4)), boxShadow: '0 12px 30px rgba(11,95,232,0.4)'}}>+</div>
						<div>
							<div style={{fontFamily: font, fontWeight: 900, fontSize: 62, color: NAVY, lineHeight: 1.1}}>Напиши «+»</div>
							<div style={{fontFamily: font, fontWeight: 800, fontSize: 40, color: '#5b6a8a'}}>в комментариях</div>
							<div style={{fontFamily: font, fontWeight: 900, fontSize: 44, color: BLUE, opacity: link, translate: `0 ${(1 - link) * 20}px`}}>пришлём ссылку</div>
						</div>
					</Glass>
				</div>
			</div>
			<div style={{position: 'absolute', top: 1300, width: '100%', display: 'flex', justifyContent: 'center', opacity: rem, translate: `0 ${(1 - rem) * 40}px`}}>
				<div style={{fontFamily: font, fontWeight: 900, fontSize: 42, whiteSpace: 'nowrap', color: '#fff', background: 'linear-gradient(180deg,#1a9bff,#0b5fe8)', borderRadius: 40, padding: '20px 40px', boxShadow: '0 16px 40px rgba(11,95,232,0.4)'}}>Месяц · 100 ГБ · 2 устройства</div>
			</div>
			<Sfx at={8} src="notification-pop" volume={0.45} />
			<Sfx at={82} src="notification-pop" volume={0.45} />
			<Sfx at={136} src="success-chime" volume={0.4} />
		</AbsoluteFill>
	);
};

const SCENES: {C: React.FC; d: number; t?: 'slide' | 'wipe' | 'up'}[] = [
	{C: S1Hook, d: 112},
	{C: S2Offer, d: 91, t: 'slide'},
	{C: S3NoLogs, d: 138, t: 'up'},
	{C: S4Speed, d: 127, t: 'slide'},
	{C: S5Stable, d: 145, t: 'wipe'},
	{C: S6Ai, d: 96, t: 'slide'},
	{C: S7HowTo, d: 238, t: 'up'},
	{C: S8Terms, d: 108, t: 'slide'},
	{C: S9Cta, d: 214, t: 'up'},
];

export const MONTH_FRAMES = SCENES.reduce((a, s) => a + s.d, 0);

const pres = (t: string) => (t === 'wipe' ? wipe({direction: 'from-left'}) : t === 'up' ? slide({direction: 'from-bottom'}) : slide({direction: 'from-right'}));

export const Month: React.FC = () => (
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
		<Audio src={staticFile('giveaway/voice.mp3')} />
	</AbsoluteFill>
);
