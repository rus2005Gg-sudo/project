import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {ACCENT, AppIcon, AppleBg, BlackPill, Card, Count, Drift, Eyebrow, GRAY, HAIR, INK, INOUT, IT, Lines, Lockup, OUT, Rise, SUB, blurZoom, clamp, prog} from './kit';

export const CH_FPS = 30;
const TR = 18;

/* 300 dots, `filled` of them blue */
const Dots: React.FC<{filled: number; at: number; cols?: number}> = ({filled, at, cols = 20}) => {
	const f = useCurrentFrame();
	return (
		<div style={{display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 14}}>
			{[...Array(300)].map((_, i) => {
				const on = i < filled;
				const p = prog(f, at + (on ? i * 1.2 : 12 + (i % cols) * 0.6), 16);
				return <div key={i} style={{aspectRatio: '1', borderRadius: '50%', background: on ? ACCENT : '#dfe2e8', opacity: 0.2 + 0.8 * p, scale: String(0.5 + 0.5 * p)}} />;
			})}
		</div>
	);
};

const S1: React.FC<{dur: number}> = ({dur}) => (
	<AbsoluteFill>
		<AppleBg />
		<Drift dur={dur}>
			<Lockup at={2} />
			<div style={{position: 'absolute', top: 430, width: '100%', display: 'flex', justifyContent: 'center'}}>
				<AppIcon size={280} at={0} />
			</div>
			<div style={{position: 'absolute', top: 820, width: '100%', textAlign: 'center', fontFamily: IT, color: INK}}>
				<Rise at={6}>
					<div style={{fontSize: 300, fontWeight: 600, letterSpacing: -14, lineHeight: 0.95}}>
						<Count to={300} at={8} dur={40} />
					</div>
					<div style={{fontSize: 56, fontWeight: 600, letterSpacing: -1.5}}>подписок Horz VPN</div>
				</Rise>
				<Rise at={104} style={{marginTop: 30}}>
					<div style={{fontSize: 60, fontWeight: 600, color: GRAY, letterSpacing: -1.5}}>Просто так.</div>
				</Rise>
			</div>
		</Drift>
	</AbsoluteFill>
);

const S2: React.FC<{dur: number}> = ({dur}) => (
	<AbsoluteFill>
		<AppleBg />
		<Drift dur={dur} amount={0.02}>
			<div style={{position: 'absolute', top: 300, width: '100%'}}>
				<Eyebrow at={0}>Первые сутки</Eyebrow>
			</div>
			<div style={{position: 'absolute', top: 380, width: '100%', textAlign: 'center', fontFamily: IT, color: INK}}>
				<Rise at={4}>
					<div style={{fontSize: 280, fontWeight: 600, letterSpacing: -12, lineHeight: 1}}>
						<Count to={15} at={30} dur={40} />
					</div>
					<div style={{fontSize: 52, fontWeight: 600, letterSpacing: -1.2}}>уже забрали свой месяц</div>
				</Rise>
			</div>
			<div style={{position: 'absolute', top: 900, left: 150, right: 150}}>
				<Dots filled={15} at={30} />
			</div>
		</Drift>
	</AbsoluteFill>
);

const S3: React.FC<{dur: number}> = ({dur}) => {
	const f = useCurrentFrame();
	const sweep = interpolate(f, [10, 60], [-260, 260], {...clamp, easing: INOUT});
	return (
		<AbsoluteFill>
			<AppleBg />
			<Drift dur={dur} amount={0.03}>
				<div style={{position: 'absolute', top: 520, width: '100%'}}>
					<Lines at={0} size={96} lines={['Остальные', 'ищут подвох.']} colors={[INK, GRAY]} stagger={6} />
				</div>
				<div style={{position: 'absolute', top: 920, width: '100%', display: 'flex', justifyContent: 'center'}}>
					<Rise at={8}>
						<div style={{position: 'relative', fontFamily: IT, fontSize: 84, fontWeight: 600, color: INK, letterSpacing: -2}}>
							Месяц бесплатно<span style={{color: ACCENT}}>*</span>
							<svg width="200" height="200" viewBox="0 0 24 24" style={{position: 'absolute', left: '50%', top: -40, translate: `${sweep - 100}px 0`}} fill="none" stroke={INK} strokeWidth="1.4" strokeLinecap="round">
								<circle cx="10" cy="10" r="6.5" fill="rgba(255,255,255,0.35)" />
								<path d="M15 15 L21 21" strokeWidth="2.2" />
							</svg>
						</div>
					</Rise>
				</div>
			</Drift>
		</AbsoluteFill>
	);
};

const noCatch: [string, number][] = [
	['Подвоха нет', 33],
	['Карта не нужна', 63],
	['Без автосписаний', 81],
];

const S4: React.FC<{dur: number}> = ({dur}) => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill>
			<AppleBg />
			<Drift dur={dur} amount={0.02}>
				<div style={{position: 'absolute', top: 400, width: '100%'}}>
					<Lines at={0} size={104} lines={['Объясняем.']} />
				</div>
				<div style={{position: 'absolute', top: 680, left: 120, right: 120}}>
					<Card style={{padding: '16px 54px'}}>
						{noCatch.map(([t, at], i) => {
							const p = prog(f, at, 22);
							return (
								<div key={t} style={{display: 'flex', alignItems: 'center', gap: 30, padding: '40px 0', borderTop: i ? `1px solid ${HAIR}` : 'none', opacity: 0.25 + 0.75 * p}}>
									<svg width="60" height="60" viewBox="0 0 24 24">
										<circle cx="12" cy="12" r="11" fill={p > 0.5 ? ACCENT : '#dfe2e8'} />
										<path d="M7 12.5 L10.5 16 L17 9" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="16" strokeDashoffset={16 * (1 - p)} />
									</svg>
									<div style={{fontFamily: IT, fontSize: 56, fontWeight: 600, color: INK, letterSpacing: -1.5}}>{t}</div>
								</div>
							);
						})}
					</Card>
				</div>
			</Drift>
		</AbsoluteFill>
	);
};

const specs = [
	{n: 30, unit: 'дней', at: 2},
	{n: 100, unit: 'ГБ', at: 22},
	{n: 2, unit: 'устройства', at: 44},
];

const S5: React.FC<{dur: number}> = ({dur}) => {
	const f = useCurrentFrame();
	const free = prog(f, 82, 26);
	return (
		<AbsoluteFill>
			<AppleBg />
			<Drift dur={dur} amount={0.02}>
				<div style={{position: 'absolute', top: 360, left: 140, right: 140}}>
					{specs.map((s, i) => {
						const p = prog(f, s.at, 24);
						return (
							<div key={s.unit} style={{display: 'flex', alignItems: 'baseline', gap: 22, fontFamily: IT, color: INK, padding: '30px 0', borderTop: i ? `1px solid ${HAIR}` : 'none', opacity: p, translate: `0 ${(1 - p) * 30}px`}}>
								<div style={{fontSize: 150, fontWeight: 600, letterSpacing: -6, lineHeight: 1}}>
									<Count to={s.n} at={s.at} dur={26} />
								</div>
								<div style={{fontSize: 56, fontWeight: 600, letterSpacing: -1.5}}>{s.unit}</div>
							</div>
						);
					})}
				</div>
				<div style={{position: 'absolute', top: 1230, width: '100%', textAlign: 'center', fontFamily: IT, opacity: free, translate: `0 ${(1 - free) * 30}px`, filter: free < 0.99 ? `blur(${(1 - free) * 10}px)` : undefined}}>
					<span style={{fontSize: 150, fontWeight: 600, letterSpacing: -6, color: ACCENT}}>0 ₽</span>
				</div>
			</Drift>
		</AbsoluteFill>
	);
};

/* ---------- bot recording ---------- */
const SRC_W = 826;
const SRC_H = 1704;
const SCREEN_W = 560;
const SCREEN_H = (SCREEN_W * SRC_H) / SRC_W;
const K = SCREEN_W / SRC_W;
const A_END = 102; // src 1.0 -> 4.15
const B_END = 160; // src 4.15 -> 6.1
const vid: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: SRC_W, height: SRC_H, display: 'block'};

type Cam = [number, number, number, number];
const cams: Cam[] = [
	[0, 413, 1300, 1.35],
	[20, 413, 1300, 1.35],
	[40, 413, 852, 1],
	[56, 413, 852, 1],
	[74, 323, 1250, 1.4],
	[112, 323, 1250, 1.4],
	[126, 413, 852, 1],
	[150, 413, 852, 1],
];
const camAt = (f: number) => {
	const ks = cams.map((c) => c[0]);
	const ch = (i: number) => interpolate(f, ks, cams.map((c) => c[i]), {...clamp, easing: INOUT});
	const z = ch(3);
	return {
		z,
		cx: Math.min(Math.max(ch(1), SRC_W / 2 / z), SRC_W - SRC_W / 2 / z),
		cy: Math.min(Math.max(ch(2), SRC_H / 2 / z), SRC_H - SRC_H / 2 / z),
	};
};

const Tap: React.FC<{x: number; y: number; at: number}> = ({x, y, at}) => {
	const f = useCurrentFrame();
	const t = f - at;
	if (t < -6 || t > 20) return null;
	const inP = interpolate(t, [-6, 0], [0, 1], {...clamp, easing: OUT});
	const outP = interpolate(t, [2, 20], [0, 1], {...clamp, easing: OUT});
	return <div style={{position: 'absolute', left: x - 52, top: y - 52, width: 104, height: 104, borderRadius: 52, background: 'rgba(255,255,255,0.42)', boxShadow: '0 0 0 2px rgba(255,255,255,0.7), 0 8px 24px rgba(0,0,0,0.35)', opacity: t < 0 ? inP : 1 - outP, scale: String(t < 0 ? 1.25 - 0.25 * inP : 0.9 + outP * 0.35)}} />;
};

const S6: React.FC<{dur: number}> = () => {
	const f = useCurrentFrame();
	const inP = prog(f, 0, 30);
	const {cx, cy, z} = camAt(f);
	const s = K * z;
	return (
		<AbsoluteFill>
			<AppleBg />
			<div style={{position: 'absolute', top: 110, width: '100%'}}>
				<Lines at={0} size={80} lines={['Бот → «Месяц бесплатно».']} />
			</div>
			<div style={{position: 'absolute', top: 240, width: '100%', textAlign: 'center', fontFamily: IT, fontSize: 40, fontWeight: 500, color: GRAY}}>
				<Rise at={120} dist={10}>
					<span style={{color: INK}}>И всё.</span>
				</Rise>
			</div>
			<div style={{position: 'absolute', left: 540, top: 340, perspective: 2400}}>
				<div style={{translate: `-50% ${(1 - inP) * 200}px`, opacity: inP, rotate: `y ${interpolate(f, [0, 150], [-10, -3], clamp)}deg`, filter: inP < 0.99 ? `blur(${(1 - inP) * 14}px)` : undefined}}>
					<div style={{padding: 5, borderRadius: 92, background: 'linear-gradient(135deg,#e6e8ec,#a9aeb8 45%,#f4f5f7 60%,#8f949e)', boxShadow: '0 60px 120px rgba(20,40,90,0.22), 0 20px 40px rgba(20,40,90,0.12)'}}>
						<div style={{padding: 14, borderRadius: 88, background: '#0a0a0c'}}>
							<div style={{position: 'relative', width: SCREEN_W, height: SCREEN_H, borderRadius: 74, overflow: 'hidden', background: '#000'}}>
								<div style={{position: 'absolute', left: 0, top: 0, width: SRC_W, height: SRC_H, transformOrigin: '0 0', transform: `translate(${SCREEN_W / 2 - cx * s}px, ${SCREEN_H / 2 - cy * s}px) scale(${s})`}}>
									<Sequence durationInFrames={A_END} layout="none">
										<OffthreadVideo src={staticFile('giveaway/howto.mp4')} trimBefore={30} playbackRate={3.15 / (A_END / 30)} muted style={vid} />
									</Sequence>
									<Sequence from={A_END} durationInFrames={B_END - A_END} layout="none">
										<OffthreadVideo src={staticFile('giveaway/howto.mp4')} trimBefore={Math.round(4.15 * 30)} muted style={vid} />
									</Sequence>
									{f >= B_END ? <Img src={staticFile('giveaway/howto_last.png')} style={vid} /> : null}
									<Tap x={413} y={1577} at={14} />
									<Tap x={320} y={1408} at={A_END} />
								</div>
								<div style={{position: 'absolute', left: '50%', top: 16, translate: '-50% 0', width: 160, height: 44, borderRadius: 22, background: '#000'}} />
							</div>
						</div>
					</div>
				</div>
			</div>
			{[14, A_END].map((a) => (
				<Sequence key={a} from={a} layout="none">
					<Audio src={staticFile('sfx/tick-001.mp3')} volume={0.18} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};

const S7: React.FC<{dur: number}> = ({dur}) => {
	const f = useCurrentFrame();
	const v = Math.round(interpolate(f, [4, 40], [300, 285], {...clamp, easing: OUT}));
	return (
		<AbsoluteFill>
			<AppleBg />
			<Drift dur={dur}>
				<div style={{position: 'absolute', top: 360, width: '100%'}}>
					<Eyebrow at={0}>Осталось</Eyebrow>
				</div>
				<div style={{position: 'absolute', top: 430, width: '100%', textAlign: 'center', fontFamily: IT, color: INK}}>
					<Rise at={2}>
						<div style={{fontSize: 320, fontWeight: 600, letterSpacing: -14, lineHeight: 1, fontVariantNumeric: 'tabular-nums'}}>{v}</div>
						<div style={{fontSize: 60, fontWeight: 600, letterSpacing: -1.5}}>мест</div>
					</Rise>
				</div>
				<div style={{position: 'absolute', top: 1020, left: 150, right: 150}}>
					<div style={{height: 12, borderRadius: 6, background: '#e3e5ea', overflow: 'hidden'}}>
						<div style={{height: '100%', width: `${(prog(f, 4, 36) * 15) / 3}%`, background: ACCENT, borderRadius: 6}} />
					</div>
					<div style={{display: 'flex', justifyContent: 'space-between', fontFamily: IT, fontSize: 28, color: SUB, marginTop: 16}}>
						<span>15 забрали</span>
						<span>из 300</span>
					</div>
				</div>
			</Drift>
		</AbsoluteFill>
	);
};

const S8: React.FC<{dur: number}> = ({dur}) => {
	const f = useCurrentFrame();
	const plus = prog(f, 40, 30);
	const link = prog(f, 95, 24);
	return (
		<AbsoluteFill>
			<AppleBg />
			<Drift dur={dur} amount={0.025}>
				<div style={{position: 'absolute', top: 280, width: '100%'}}>
					<Lines at={0} size={90} lines={['Не хочешь', 'искать бота?']} colors={[INK, GRAY]} stagger={6} />
				</div>
				<div style={{position: 'absolute', top: 600, width: '100%', display: 'flex', justifyContent: 'center', opacity: plus, scale: String(0.85 + 0.15 * plus), filter: plus < 0.99 ? `blur(${(1 - plus) * 10}px)` : undefined}}>
					<div style={{width: 300, height: 300, borderRadius: 150, background: INK, color: '#fff', fontFamily: IT, fontWeight: 500, fontSize: 240, lineHeight: '290px', textAlign: 'center'}}>+</div>
				</div>
				<div style={{position: 'absolute', top: 960, width: '100%', textAlign: 'center', fontFamily: IT, opacity: plus}}>
					<div style={{fontSize: 64, fontWeight: 600, color: INK, letterSpacing: -2}}>в комментариях</div>
					<div style={{fontSize: 48, fontWeight: 500, color: ACCENT, marginTop: 14, opacity: link, translate: `0 ${(1 - link) * 16}px`}}>Пришлём ссылку.</div>
				</div>
				<div style={{position: 'absolute', top: 1260, width: '100%', display: 'flex', justifyContent: 'center'}}>
					<Rise at={110}>
						<BlackPill>Или @horzvpnbot</BlackPill>
					</Rise>
				</div>
			</Drift>
		</AbsoluteFill>
	);
};

const SCENES: {C: React.FC<{dur: number}>; d: number}[] = [
	{C: S1, d: 127},
	{C: S2, d: 112},
	{C: S3, d: 70},
	{C: S4, d: 144},
	{C: S5, d: 111},
	{C: S6, d: 150},
	{C: S7, d: 66},
	{C: S8, d: 180},
];

export const CHALLENGE_FRAMES = SCENES.reduce((a, s) => a + s.d, 0);

export const Challenge: React.FC = () => (
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
		<Audio src={staticFile('challenge/voice.mp3')} />
	</AbsoluteFill>
);
