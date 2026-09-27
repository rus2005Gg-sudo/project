import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {ACCENT, AppIcon, AppleBg, BlackPill, Card, Count, Drift, Eyebrow, GRAY, HAIR, INK, INOUT, IT, LOGO, Lines, Lockup, OUT, Rise, SUB, blurZoom, clamp, prog} from './kit';

export const MA_FPS = 30;
const TR = 18;

const Tap: React.FC<{x: number; y: number; at: number}> = ({x, y, at}) => {
	const f = useCurrentFrame();
	const t = f - at;
	if (t < -6 || t > 20) return null;
	const inP = interpolate(t, [-6, 0], [0, 1], {...clamp, easing: OUT});
	const outP = interpolate(t, [2, 20], [0, 1], {...clamp, easing: OUT});
	return (
		<div
			style={{
				position: 'absolute',
				left: x - 52,
				top: y - 52,
				width: 104,
				height: 104,
				borderRadius: 52,
				background: 'rgba(255,255,255,0.42)',
				boxShadow: '0 0 0 2px rgba(255,255,255,0.7), 0 8px 24px rgba(0,0,0,0.35)',
				backdropFilter: 'blur(2px)',
				opacity: t < 0 ? inP : 1 - outP,
				scale: String(t < 0 ? 1.25 - 0.25 * inP : 0.9 + outP * 0.35),
			}}
		/>
	);
};

const Sfx: React.FC<{at: number}> = ({at}) => (
	<Sequence from={at} layout="none">
		<Audio src={staticFile('sfx/tick-001.mp3')} volume={0.18} />
	</Sequence>
);

/* ---------- scenes ---------- */

const S1Hook: React.FC<{dur: number}> = ({dur}) => (
	<AbsoluteFill>
		<AppleBg />
		<Drift dur={dur}>
			<Lockup at={4} />
			<div style={{position: 'absolute', top: 440, width: '100%', display: 'flex', justifyContent: 'center'}}>
				<AppIcon size={400} at={0} />
			</div>
			<div style={{position: 'absolute', top: 1010, width: '100%'}}>
				<Eyebrow at={14}>Подарок подписчикам</Eyebrow>
				<Lines at={18} size={112} lines={['Месяц Horz VPN.', 'Бесплатно.']} colors={[INK, GRAY]} style={{marginTop: 22}} />
			</div>
		</Drift>
	</AbsoluteFill>
);

const specs: {n: number; unit: string; note: string; at: number}[] = [
	{n: 30, unit: 'дней', note: 'полного доступа', at: 4},
	{n: 100, unit: 'ГБ', note: 'трафика', at: 28},
	{n: 2, unit: 'устройства', note: 'телефон и ноутбук', at: 52},
];

const S2Offer: React.FC<{dur: number}> = ({dur}) => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill>
			<AppleBg />
			<Drift dur={dur} amount={0.02}>
				<div style={{position: 'absolute', top: 260, width: '100%'}}>
					<Lines at={0} size={104} lines={['Что внутри.']} />
				</div>
				<div style={{position: 'absolute', top: 560, left: 120, right: 120}}>
					{specs.map((s, i) => {
						const p = prog(f, s.at, 26);
						const line = prog(f, s.at + 6, 30, INOUT);
						return (
							<div key={s.unit} style={{padding: '44px 0', opacity: p, translate: `0 ${(1 - p) * 30}px`}}>
								<div style={{display: 'flex', alignItems: 'baseline', gap: 22, fontFamily: IT, color: INK}}>
									<div style={{fontSize: 150, fontWeight: 600, letterSpacing: -6, lineHeight: 1}}>
										<Count to={s.n} at={s.at} dur={30} />
									</div>
									<div style={{fontSize: 56, fontWeight: 600, letterSpacing: -1.5}}>{s.unit}</div>
								</div>
								<div style={{fontFamily: IT, fontSize: 32, color: SUB, marginTop: 8}}>{s.note}</div>
								{i < specs.length - 1 ? <div style={{height: 1, background: HAIR, marginTop: 44, width: `${line * 100}%`}} /> : null}
							</div>
						);
					})}
				</div>
			</Drift>
		</AbsoluteFill>
	);
};

const privacyRows = ['IP-адрес', 'История сайтов', 'Время подключений', 'Данные устройства'];

const S3NoLogs: React.FC<{dur: number}> = ({dur}) => {
	const f = useCurrentFrame();
	const zero = prog(f, 104, 30);
	return (
		<AbsoluteFill>
			<AppleBg />
			<Drift dur={dur} amount={0.02}>
				<div style={{position: 'absolute', top: 240, width: '100%'}}>
					<Lines at={0} size={96} lines={['Ничего не храним.', 'Ничего не продаём.']} colors={[INK, GRAY]} stagger={8} />
				</div>
				<div style={{position: 'absolute', top: 600, left: 110, right: 110}}>
					<Rise at={8}>
						<Card style={{padding: '20px 48px'}}>
							{privacyRows.map((r, i) => {
								const s = prog(f, 20 + i * 20, 22, INOUT);
								return (
									<div key={r} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '34px 0', borderTop: i ? `1px solid ${HAIR}` : 'none'}}>
										<div style={{position: 'relative', fontFamily: IT, fontSize: 46, fontWeight: 500, color: s > 0.5 ? GRAY : INK}}>
											{r}
											<div style={{position: 'absolute', left: 0, top: '54%', height: 3, width: `${s * 100}%`, background: INK, opacity: 0.55}} />
										</div>
										<div style={{fontFamily: IT, fontSize: 32, fontWeight: 500, color: s > 0.9 ? ACCENT : 'transparent'}}>не храним</div>
									</div>
								);
							})}
						</Card>
					</Rise>
				</div>
				<div style={{position: 'absolute', top: 1280, width: '100%', textAlign: 'center', opacity: zero, translate: `0 ${(1 - zero) * 30}px`, filter: zero < 0.99 ? `blur(${(1 - zero) * 10}px)` : undefined}}>
					<span style={{fontFamily: IT, fontSize: 150, fontWeight: 600, letterSpacing: -6, color: INK}}>0</span>
					<span style={{fontFamily: IT, fontSize: 56, fontWeight: 600, color: INK, marginLeft: 16}}>логов</span>
				</div>
			</Drift>
			{privacyRows.map((_, i) => (
				<Sfx key={i} at={20 + i * 20} />
			))}
		</AbsoluteFill>
	);
};

const S4Speed: React.FC<{dur: number}> = ({dur}) => {
	const f = useCurrentFrame();
	const bar = prog(f, 14, 50, INOUT);
	return (
		<AbsoluteFill>
			<AppleBg />
			<Drift dur={dur}>
				<div style={{position: 'absolute', top: 400, width: '100%'}}>
					<Eyebrow at={2}>Скоростная сеть</Eyebrow>
				</div>
				<div style={{position: 'absolute', top: 570, width: '100%', textAlign: 'center', fontFamily: IT, color: INK}}>
					<Rise at={6}>
						<div style={{fontSize: 44, fontWeight: 500, color: SUB}}>до</div>
						<div style={{fontSize: 420, fontWeight: 600, letterSpacing: -22, lineHeight: 0.9, background: 'linear-gradient(180deg,#1d1d1f 30%,#0071e3 120%)', WebkitBackgroundClip: 'text', color: 'transparent'}}>
							<Count to={10} at={10} dur={46} />
						</div>
						<div style={{fontSize: 72, fontWeight: 600, letterSpacing: -2, marginTop: 10}}>Гбит/с</div>
					</Rise>
				</div>
				<div style={{position: 'absolute', top: 1330, left: 160, right: 160}}>
					<div style={{height: 10, borderRadius: 5, background: '#e3e5ea', overflow: 'hidden'}}>
						<div style={{height: '100%', width: `${bar * 100}%`, borderRadius: 5, background: 'linear-gradient(90deg,#5ac8fa,#0071e3)'}} />
					</div>
					<Rise at={60}>
						<div style={{fontFamily: IT, fontSize: 40, fontWeight: 500, color: SUB, textAlign: 'center', marginTop: 34}}>Без тормозов. Без ожидания.</div>
					</Rise>
				</div>
			</Drift>
		</AbsoluteFill>
	);
};

const S5Always: React.FC<{dur: number}> = ({dur}) => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill>
			<AppleBg glow="52,199,89" />
			<Drift dur={dur}>
				<div style={{position: 'absolute', top: 600, width: '100%', textAlign: 'center'}}>
					<Rise at={0}>
						<div style={{display: 'inline-flex', alignItems: 'center', gap: 16, fontFamily: IT, fontSize: 36, fontWeight: 500, color: SUB}}>
							<span style={{width: 18, height: 18, borderRadius: 9, background: '#34c759', boxShadow: `0 0 0 ${6 + 5 * Math.sin(f / 6)}px rgba(52,199,89,0.18)`}} />
							Серверы онлайн
						</div>
					</Rise>
					<Lines at={4} size={320} lines={['24/7']} style={{marginTop: 20}} tracking={-14} />
				</div>
				<div style={{position: 'absolute', top: 1190, left: 150, right: 150, display: 'flex', gap: 8}}>
					{[...Array(30)].map((_, i) => {
						const p = prog(f, 10 + i * 1.2, 14);
						return <div key={i} style={{flex: 1, height: 70, borderRadius: 6, background: '#34c759', opacity: 0.25 + 0.75 * p, scale: `1 ${0.3 + 0.7 * p}`, transformOrigin: 'bottom'}} />;
					})}
				</div>
				<Rise at={30} style={{position: 'absolute', top: 1290, width: '100%', textAlign: 'center', fontFamily: IT, fontSize: 30, color: GRAY}}>
					без выходных и перерывов
				</Rise>
			</Drift>
		</AbsoluteFill>
	);
};

const S6Ai: React.FC<{dur: number}> = ({dur}) => {
	const f = useCurrentFrame();
	const typing = f > 30 && f < 52;
	const done = f >= 52;
	const b1 = prog(f, 12, 22);
	const b2 = prog(f, 28, 22);
	return (
		<AbsoluteFill>
			<AppleBg />
			<Drift dur={dur} amount={0.02}>
				<div style={{position: 'absolute', top: 420, width: '100%'}}>
					<Lines at={0} size={100} lines={['AI-помощник.', 'Подключит за минуту.']} colors={[INK, GRAY]} stagger={6} />
				</div>
				<div style={{position: 'absolute', top: 880, left: 110, right: 110, display: 'flex', flexDirection: 'column', gap: 22, fontFamily: IT}}>
					<div style={{alignSelf: 'flex-end', opacity: b1, translate: `0 ${(1 - b1) * 30}px`, scale: String(0.94 + 0.06 * b1), transformOrigin: 'bottom right', background: ACCENT, color: '#fff', fontSize: 50, fontWeight: 500, padding: '28px 40px', borderRadius: 44}}>Как подключиться?</div>
					<div style={{alignSelf: 'flex-start', opacity: b2, translate: `0 ${(1 - b2) * 30}px`, scale: String(0.94 + 0.06 * b2), transformOrigin: 'bottom left', background: '#e9e9eb', color: INK, fontSize: 50, fontWeight: 500, padding: '28px 40px', borderRadius: 44, minWidth: 160, display: 'flex', alignItems: 'center', gap: 14}}>
						{typing ? [0, 1, 2].map((i) => <span key={i} style={{width: 18, height: 18, borderRadius: 9, background: '#8e8e93', opacity: 0.4 + 0.6 * Math.abs(Math.sin(f / 5 + i))}} />) : null}
						{done ? 'Нажми «Подключить» — готово.' : null}
					</div>
				</div>
			</Drift>
		</AbsoluteFill>
	);
};

/* ---------- how-to with the real recording ---------- */

const SRC_W = 826;
const SRC_H = 1704;
const SCREEN_W = 540;
const SCREEN_H = (SCREEN_W * SRC_H) / SRC_W;
const K = SCREEN_W / SRC_W;
const SEG_A = 70;
const SEG_B = 125;
const SEG_C = 183;
const TAP_START = SEG_A;
const TAP_GIFT = SEG_B;
const TAP_CONNECT = 222;

type Cam = [number, number, number, number];
const cams: Cam[] = [
	[0, 413, 852, 1],
	[44, 413, 852, 1],
	[62, 413, 1500, 1.55],
	[80, 413, 1500, 1.55],
	[94, 413, 852, 1],
	[98, 413, 852, 1],
	[110, 323, 1060, 1.3],
	[114, 323, 1060, 1.3],
	[122, 323, 1300, 1.45],
	[134, 323, 1300, 1.45],
	[146, 413, 852, 1],
	[152, 413, 852, 1],
	[166, 323, 850, 1.3],
	[190, 323, 850, 1.3],
	[208, 323, 1230, 1.5],
	[260, 323, 1230, 1.5],
];
const camAt = (f: number) => {
	const ks = cams.map((c) => c[0]);
	const ch = (i: number) => interpolate(f, ks, cams.map((c) => c[i]), {...clamp, easing: INOUT});
	const z = ch(3);
	const cx = Math.min(Math.max(ch(1), SRC_W / 2 / z), SRC_W - SRC_W / 2 / z);
	const cy = Math.min(Math.max(ch(2), SRC_H / 2 / z), SRC_H - SRC_H / 2 / z);
	return {cx, cy, z};
};

const vid: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: SRC_W, height: SRC_H, display: 'block'};

const steps = [
	{from: 0, label: 'Нажми «Старт»'},
	{from: 93, label: 'Выбери «Месяц бесплатно»'},
	{from: 151, label: 'Нажми «Подключить»'},
];

const S7HowTo: React.FC<{dur: number}> = () => {
	const f = useCurrentFrame();
	const inP = prog(f, 0, 36);
	const {cx, cy, z} = camAt(f);
	const s = K * z;
	const cur = steps.filter((st) => f >= st.from).length - 1;
	const labelP = prog(f, steps[cur].from, 20);
	return (
		<AbsoluteFill>
			<AppleBg />
			<div style={{position: 'absolute', top: 100, width: '100%'}}>
				<Lines at={0} size={88} lines={['Как забрать.']} />
			</div>
			<div style={{position: 'absolute', top: 232, left: 150, right: 150, display: 'flex', gap: 14}}>
				{steps.map((st, i) => (
					<div key={i} style={{flex: 1, height: 6, borderRadius: 3, background: '#e3e5ea', overflow: 'hidden'}}>
						<div style={{height: '100%', borderRadius: 3, background: INK, width: `${i < cur ? 100 : i === cur ? prog(f, st.from, 26, INOUT) * 100 : 0}%`}} />
					</div>
				))}
			</div>
			<div style={{position: 'absolute', top: 262, width: '100%', textAlign: 'center', fontFamily: IT, fontSize: 44, fontWeight: 500, color: INK, opacity: labelP, translate: `0 ${(1 - labelP) * 14}px`}}>
				<span style={{color: GRAY}}>Шаг {cur + 1}. </span>
				{steps[cur].label}
			</div>
			<div style={{position: 'absolute', left: 540, top: 370, perspective: 2400}}>
				<div
					style={{
						translate: `-50% ${(1 - inP) * 220}px`,
						opacity: inP,
						rotate: `y ${interpolate(f, [0, 237], [-12, -3], clamp)}deg`,
						filter: inP < 0.99 ? `blur(${(1 - inP) * 14}px)` : undefined,
					}}
				>
					<div style={{padding: 5, borderRadius: 92, background: 'linear-gradient(135deg,#e6e8ec,#a9aeb8 45%,#f4f5f7 60%,#8f949e)', boxShadow: '0 60px 120px rgba(20,40,90,0.22), 0 20px 40px rgba(20,40,90,0.12)'}}>
						<div style={{padding: 14, borderRadius: 88, background: '#0a0a0c'}}>
							<div style={{position: 'relative', width: SCREEN_W, height: SCREEN_H, borderRadius: 74, overflow: 'hidden', background: '#000'}}>
								<div style={{position: 'absolute', left: 0, top: 0, width: SRC_W, height: SRC_H, transformOrigin: '0 0', transform: `translate(${SCREEN_W / 2 - cx * s}px, ${SCREEN_H / 2 - cy * s}px) scale(${s})`}}>
									<Sequence durationInFrames={SEG_A} layout="none">
										<OffthreadVideo src={staticFile('giveaway/howto.mp4')} playbackRate={1.45 / (SEG_A / 30)} muted style={vid} />
									</Sequence>
									<Sequence from={SEG_A} durationInFrames={SEG_B - SEG_A} layout="none">
										<OffthreadVideo src={staticFile('giveaway/howto.mp4')} trimBefore={Math.round(1.45 * 30)} playbackRate={(4.15 - 1.45) / ((SEG_B - SEG_A) / 30)} muted style={vid} />
									</Sequence>
									<Sequence from={SEG_B} durationInFrames={SEG_C - SEG_B} layout="none">
										<OffthreadVideo src={staticFile('giveaway/howto.mp4')} trimBefore={Math.round(4.15 * 30)} muted style={vid} />
									</Sequence>
									{f >= SEG_C ? <Img src={staticFile('giveaway/howto_last.png')} style={vid} /> : null}
									<Tap x={413} y={1577} at={TAP_START} />
									<Tap x={320} y={1408} at={TAP_GIFT} />
									<Tap x={320} y={1322} at={TAP_CONNECT} />
								</div>
								<div style={{position: 'absolute', left: '50%', top: 16, translate: '-50% 0', width: 160, height: 44, borderRadius: 22, background: '#000'}} />
								<div style={{position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 35%)', pointerEvents: 'none'}} />
							</div>
						</div>
					</div>
				</div>
			</div>
			<Sfx at={TAP_START} />
			<Sfx at={TAP_GIFT} />
			<Sfx at={TAP_CONNECT} />
		</AbsoluteFill>
	);
};

const S8Terms: React.FC<{dur: number}> = ({dur}) => {
	const f = useCurrentFrame();
	const subscribed = f >= 46;
	const press = interpolate(f, [38, 44, 52], [0, 1, 0], clamp);
	const ring = prog(f, 68, 40, INOUT);
	return (
		<AbsoluteFill>
			<AppleBg />
			<Drift dur={dur} amount={0.02}>
				<div style={{position: 'absolute', top: 400, width: '100%'}}>
					<Lines at={0} size={96} lines={['Для подписчиков', 'нашего канала.']} colors={[INK, GRAY]} stagger={6} />
				</div>
				<div style={{position: 'absolute', top: 760, left: 110, right: 110}}>
					<Rise at={8}>
						<Card style={{padding: '34px 40px', display: 'flex', alignItems: 'center', gap: 28}}>
							<div style={{width: 120, height: 120, borderRadius: 60, background: 'linear-gradient(180deg,#fff,#eef2f9)', boxShadow: '0 8px 20px rgba(20,40,90,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
								<Img src={LOGO} style={{width: 74}} />
							</div>
							<div style={{flex: 1, fontFamily: IT}}>
								<div style={{fontSize: 48, fontWeight: 600, color: INK, whiteSpace: 'nowrap'}}>Horz VPN</div>
								<div style={{fontSize: 30, color: SUB, whiteSpace: 'nowrap'}}>канал в Telegram</div>
							</div>
							<div style={{fontFamily: IT, fontSize: 32, fontWeight: 500, whiteSpace: 'nowrap', padding: '18px 30px', borderRadius: 40, background: subscribed ? '#f2f2f7' : ACCENT, color: subscribed ? SUB : '#fff', scale: String(1 - 0.06 * press)}}>
								{subscribed ? 'Вы подписаны' : 'Подписаться'}
							</div>
						</Card>
					</Rise>
				</div>
				<div style={{position: 'absolute', top: 1110, width: '100%', display: 'flex', justifyContent: 'center'}}>
					<Rise at={66}>
						<div style={{display: 'flex', alignItems: 'center', gap: 34}}>
							<svg width="130" height="130" viewBox="0 0 120 120">
								<circle cx="60" cy="60" r="50" stroke="#e3e5ea" strokeWidth="10" fill="none" />
								<circle cx="60" cy="60" r="50" stroke={INK} strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={314} strokeDashoffset={314 * (1 - ring * 0.82)} transform="rotate(-90 60 60)" />
							</svg>
							<div style={{fontFamily: IT, fontSize: 64, fontWeight: 600, color: INK, lineHeight: 1.05, letterSpacing: -2}}>
								Мест
								<br />
								<span style={{color: GRAY}}>ограничено.</span>
							</div>
						</div>
					</Rise>
				</div>
			</Drift>
			<Sfx at={44} />
		</AbsoluteFill>
	);
};

const S9Cta: React.FC<{dur: number}> = ({dur}) => {
	const f = useCurrentFrame();
	const alt = prog(f, 80, 26);
	const link = prog(f, 136, 24);
	return (
		<AbsoluteFill>
			<AppleBg />
			<Drift dur={dur} amount={0.025}>
				<div style={{position: 'absolute', top: 240, width: '100%', display: 'flex', justifyContent: 'center'}}>
					<AppIcon size={260} at={0} />
				</div>
				<div style={{position: 'absolute', top: 600, width: '100%'}}>
					<Lines at={8} size={104} lines={['Забери свой месяц.']} />
				</div>
				<div style={{position: 'absolute', top: 820, width: '100%', display: 'flex', justifyContent: 'center'}}>
					<Rise at={18}>
						<BlackPill style={{fontSize: 46, padding: '34px 70px'}}>Открыть @horzvpnbot</BlackPill>
					</Rise>
				</div>
				<div style={{position: 'absolute', top: 1030, width: '100%', textAlign: 'center', fontFamily: IT, opacity: alt, translate: `0 ${(1 - alt) * 24}px`, filter: alt < 0.99 ? `blur(${(1 - alt) * 8}px)` : undefined}}>
					<div style={{fontSize: 40, color: SUB}}>или напиши</div>
					<div style={{fontSize: 96, fontWeight: 600, color: INK, letterSpacing: -2, marginTop: 6}}>«+» в комментариях</div>
					<div style={{fontSize: 44, fontWeight: 500, color: ACCENT, marginTop: 18, opacity: link, translate: `0 ${(1 - link) * 16}px`}}>Пришлём ссылку.</div>
				</div>
				<Rise at={150} style={{position: 'absolute', top: 1480, width: '100%', textAlign: 'center', fontFamily: IT, fontSize: 30, color: GRAY}}>
					30 дней · 100 ГБ · 2 устройства
				</Rise>
			</Drift>
		</AbsoluteFill>
	);
};

const SCENES: {C: React.FC<{dur: number}>; d: number}[] = [
	{C: S1Hook, d: 112},
	{C: S2Offer, d: 91},
	{C: S3NoLogs, d: 138},
	{C: S4Speed, d: 125},
	{C: S5Always, d: 70},
	{C: S6Ai, d: 97},
	{C: S7HowTo, d: 237},
	{C: S8Terms, d: 109},
	{C: S9Cta, d: 217},
];

export const MONTH_APPLE_FRAMES = SCENES.reduce((a, s) => a + s.d, 0);

export const MonthApple: React.FC = () => (
	<AbsoluteFill style={{background: '#fbfbfd'}}>
		<TransitionSeries>
			{SCENES.map((s, i) => (
				<React.Fragment key={i}>
					{i > 0 ? <TransitionSeries.Transition presentation={blurZoom() as never} timing={linearTiming({durationInFrames: TR, easing: INOUT})} /> : null}
					<TransitionSeries.Sequence durationInFrames={s.d + (i < SCENES.length - 1 ? TR : 0)}>
						<s.C dur={s.d + TR} />
					</TransitionSeries.Sequence>
				</React.Fragment>
			))}
		</TransitionSeries>
		<Audio src={staticFile('giveaway/voice_clean.wav')} />
	</AbsoluteFill>
);
