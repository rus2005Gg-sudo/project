import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {ACCENT, AppIcon, AppleBg, BlackPill, Card, Drift, Eyebrow, GRAY, HAIR, INK, INOUT, IT, Lines, Lockup, Rise, SUB, blurZoom, clamp, prog} from './kit';

export const D3_FPS = 30;
const VOICE = 33.65;
const TR = 14;
// scene starts (s), slightly ahead of the first word of each phrase (word times from ASR)
const STARTS = [0, 2.3, 5.45, 9.05, 12.6, 14.45, 20.1, 22.3, 28.5, 32.15];
const fr = (s: number) => Math.round(s * D3_FPS);
export const DAY3_FRAMES = fr(VOICE + 1.4);
const DUR = STARTS.map((s, i) => (i < STARTS.length - 1 ? fr(STARTS[i + 1]) : DAY3_FRAMES) - fr(s));
// local frame of absolute second t inside scene i
const at = (i: number, t: number) => fr(t) - fr(STARTS[i]);

const Col: React.FC<{children: React.ReactNode; gap?: number}> = ({children, gap = 0}) => (
	<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap}}>{children}</AbsoluteFill>
);

const Tick: React.FC<{at: number; vol?: number}> = ({at: a, vol = 0.16}) => (
	<Sequence from={Math.max(0, a)} layout="none">
		<Audio src={staticFile('sfx/tick-001.mp3')} volume={vol} />
	</Sequence>
);

/** number that rolls between two values over [a, b] frames */
const Roll: React.FC<{from: number; to: number; a: number; b: number}> = ({from, to, a, b}) => {
	const f = useCurrentFrame();
	return <span style={{fontVariantNumeric: 'tabular-nums'}}>{Math.round(interpolate(f, [a, b], [from, to], {...clamp, easing: INOUT}))}</span>;
};

/** soft pop used for single words / numbers */
const Pop: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties}> = ({at: a, children, style}) => {
	const f = useCurrentFrame();
	const p = prog(f, a, 22);
	return (
		<span style={{display: 'inline-block', opacity: p, scale: String(interpolate(p, [0, 1], [0.75, 1])), filter: p < 0.99 ? `blur(${(1 - p) * 12}px)` : undefined, ...style}}>
			{children}
		</span>
	);
};

/* 1 — «Третий день акции Horz VPN» */
const S1: React.FC = () => (
	<Drift dur={DUR[0] + TR}>
		<AppleBg />
		<Lockup at={at(0, 1.2)} />
		<Col>
			<Eyebrow at={at(0, 0.7)}>Акция «Месяц бесплатно»</Eyebrow>
			<div style={{height: 30}} />
			<div style={{display: 'flex', alignItems: 'baseline', gap: 30}}>
				<Lines at={at(0, 0.35)} size={150} weight={700} lines={['День']} />
				<Pop at={at(0, 0)} style={{fontFamily: IT, fontWeight: 700, fontSize: 330, letterSpacing: -16, color: ACCENT, lineHeight: 1}}>
					3
				</Pop>
			</div>
		</Col>
		<Tick at={2} />
	</Drift>
);

/* 2 — «Двадцать восемь человек уже забрали месяц бесплатно» */
const S2: React.FC = () => (
	<Drift dur={DUR[1] + TR}>
		<AppleBg />
		<Lockup />
		<Col>
			<Rise at={0} dist={60}>
				<div style={{fontFamily: IT, fontSize: 380, fontWeight: 700, color: INK, letterSpacing: -20, lineHeight: 1}}>
					<Roll from={0} to={28} a={at(1, 2.44)} b={at(1, 3.2)} />
				</div>
			</Rise>
			<Lines at={at(1, 3.2)} size={84} lines={['человек уже забрали']} />
			<Lines at={at(1, 4.25)} size={84} lines={['месяц бесплатно']} color={ACCENT} />
		</Col>
	</Drift>
);

/* 3 — «Осталось двести семьдесят две подписки из трёхсот» */
const S3: React.FC = () => {
	const f = useCurrentFrame();
	const a = at(2, 6.1);
	const b = at(2, 7.3);
	const taken = Math.round(interpolate(f, [a, b], [0, 28], {...clamp, easing: INOUT}));
	return (
		<Drift dur={DUR[2] + TR}>
			<AppleBg />
			<Lockup />
			<Col>
				<Eyebrow at={at(2, 5.55)}>Осталось</Eyebrow>
				<Rise at={at(2, 5.7)} dist={50}>
					<div style={{fontFamily: IT, fontSize: 300, fontWeight: 700, color: INK, letterSpacing: -14, lineHeight: 1.05}}>
						<Roll from={300} to={272} a={a} b={b} />
					</div>
				</Rise>
				<div style={{fontFamily: IT, fontSize: 52, fontWeight: 500, color: GRAY, display: 'flex', gap: 16}}>
					<Pop at={at(2, 7.25)}>подписок</Pop>
					<Pop at={at(2, 7.95)} style={{color: INK}}>
						из 300
					</Pop>
				</div>
				<Rise at={at(2, 5.8)} dist={30} style={{marginTop: 70}}>
					<Card style={{padding: 44, width: 860}}>
						<div style={{display: 'grid', gridTemplateColumns: 'repeat(25, 1fr)', gap: 7}}>
							{Array.from({length: 300}).map((_, i) => {
								const on = i < taken;
								const flash = on ? interpolate(f - (a + (i / 28) * (b - a)), [0, 6], [1.35, 1], clamp) : 1;
								return <div key={i} style={{aspectRatio: '1', borderRadius: 6, background: on ? ACCENT : '#e8e8ed', scale: String(flash)}} />;
							})}
						</div>
						<div style={{display: 'flex', justifyContent: 'space-between', marginTop: 30, fontFamily: IT, fontSize: 32, fontWeight: 500}}>
							<span style={{color: ACCENT}}>● Забрали {taken}</span>
							<span style={{color: SUB}}>● Свободно {300 - taken}</span>
						</div>
					</Card>
				</Rise>
			</Col>
		</Drift>
	);
};

/* 4 — «Что внутри: тридцать дней, сто гигабайт и два устройства» */
const S4: React.FC = () => {
	const items: [string, string, number][] = [
		['30', 'дней', at(3, 9.95)],
		['100', 'гигабайт', at(3, 10.75)],
		['2', 'устройства', at(3, 11.7)],
	];
	return (
		<Drift dur={DUR[3] + TR}>
			<AppleBg />
			<Lockup />
			<Col gap={34}>
				<Lines at={at(3, 9.1)} size={110} lines={['Что внутри']} />
				<div style={{height: 20}} />
				{items.map(([n, l, a], i) => (
					<Rise key={i} at={a} dist={60} dur={20}>
						<Card style={{width: 820, padding: '40px 60px', display: 'flex', alignItems: 'baseline', gap: 30}}>
							<span style={{fontFamily: IT, fontSize: 150, fontWeight: 700, color: ACCENT, letterSpacing: -6, lineHeight: 1}}>{n}</span>
							<span style={{fontFamily: IT, fontSize: 60, fontWeight: 600, color: SUB}}>{l}</span>
						</Card>
					</Rise>
				))}
			</Col>
			{items.map(([, , a], i) => (
				<Tick key={i} at={a} />
			))}
		</Drift>
	);
};

/* 5 — «Без оплаты и без карты» */
const S5: React.FC = () => (
	<Drift dur={DUR[4] + TR}>
		<AppleBg />
		<Lockup />
		<Col>
			<Pop at={at(4, 12.65)} style={{fontFamily: IT, fontSize: 330, fontWeight: 700, color: INK, letterSpacing: -16, lineHeight: 1}}>
				0 <span style={{color: ACCENT}}>₽</span>
			</Pop>
			<Lines at={at(4, 12.7)} size={90} lines={['Без оплаты.']} />
			<Lines at={at(4, 13.45)} size={90} lines={['Без карты.']} color={GRAY} />
		</Col>
	</Drift>
);

/* 6 — «Кстати, в некоторых регионах уже вводят белые списки — когда работают только разрешённые сайты» */
const SITES = ['госуслуги', 'маркетплейс', 'новости', 'видео', 'соцсеть', 'мессенджер', 'игры', 'почта'];
const S6: React.FC = () => {
	const f = useCurrentFrame();
	const listAt = at(5, 16.55);
	const marksAt = at(5, 17.9);
	const allowed = [0, 1];
	return (
		<Drift dur={DUR[5] + TR} amount={0.025}>
			<AppleBg glow="255,59,48" />
			<Lockup />
			<AbsoluteFill style={{alignItems: 'center', paddingTop: 250}}>
				<Eyebrow at={at(5, 14.9)} color="#ff3b30">
					В некоторых регионах
				</Eyebrow>
				<div style={{height: 20}} />
				<Lines at={at(5, 16.05)} size={96} lines={['вводят', 'белые списки']} stagger={at(5, 16.6) - at(5, 16.05)} />
				<Rise at={listAt} dist={40} style={{marginTop: 56}}>
					<Card style={{width: 860, padding: '18px 50px'}}>
						{SITES.map((s, i) => {
							const ok = allowed.includes(i);
							// crosses cascade over «работают только», checks land on «разрешённые»
							const markAt = ok ? at(5, 18.65) : marksAt + (i - 2) * 4;
							const p = prog(f, markAt, 14);
							const rowIn = prog(f, listAt + i * 2, 16);
							return (
								<div
									key={s}
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
										padding: '22px 0',
										borderTop: i ? `1px solid ${HAIR}` : undefined,
										fontFamily: IT,
										fontSize: 40,
										fontWeight: 500,
										opacity: rowIn,
										translate: `0 ${(1 - rowIn) * 20}px`,
									}}
								>
									<span style={{color: !ok && p > 0.5 ? '#c7c7cc' : INK, textDecoration: !ok && p > 0.5 ? 'line-through' : undefined}}>{s}</span>
									<span
										style={{
											width: 46,
											height: 46,
											borderRadius: 23,
											background: ok ? '#34c759' : '#ff3b30',
											color: '#fff',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontSize: 28,
											fontWeight: 700,
											opacity: p,
											scale: String(interpolate(p, [0, 0.6, 1], [0.4, 1.15, 1])),
										}}
									>
										{ok ? '✓' : '✕'}
									</span>
								</div>
							);
						})}
					</Card>
				</Rise>
				<Rise at={at(5, 17.6)} dist={24} style={{marginTop: 50}}>
					<div style={{fontFamily: IT, fontSize: 46, fontWeight: 500, color: SUB, textAlign: 'center'}}>
						работают только <span style={{color: '#34c759', fontWeight: 600}}>разрешённые</span> сайты
					</div>
				</Rise>
			</AbsoluteFill>
		</Drift>
	);
};

/* 7 — «Поэтому лучше подготовиться заранее» */
const S7: React.FC = () => (
	<Drift dur={DUR[6] + TR}>
		<AppleBg />
		<Lockup />
		<Col>
			<AppIcon size={260} at={at(6, 20.15)} />
			<div style={{height: 90}} />
			<Lines at={at(6, 20.25)} size={100} lines={['Поэтому лучше']} color={GRAY} />
			<Lines at={at(6, 20.9)} size={120} weight={700} lines={['подготовиться']} />
			<Lines at={at(6, 21.55)} size={120} weight={700} lines={['заранее']} color={ACCENT} />
		</Col>
	</Drift>
);

/* 8 — «Всё, что нужно: найти в Телеграме бота… подписаться на канал и нажать «Месяц бесплатно»» */
const S8: React.FC = () => {
	const f = useCurrentFrame();
	const steps: [string, React.ReactNode, number][] = [
		[
			'1',
			<>
				Найди <Pop at={at(7, 24.0)} style={{color: ACCENT}}>@horzvpnbot</Pop>
			</>,
			at(7, 23.0),
		],
		['2', 'Подпишись на канал', at(7, 25.7)],
		['3', <>Нажми «Месяц бесплатно»</>, at(7, 26.85)],
	];
	const ends = [at(7, 25.7), at(7, 26.85), 9999];
	return (
		<Drift dur={DUR[7] + TR}>
			<AppleBg />
			<Lockup />
			<Col gap={30}>
				<Lines at={at(7, 22.35)} size={100} lines={['Всё, что нужно']} />
				<div style={{height: 30}} />
				{steps.map(([n, t, a], i) => {
					const active = f >= a && f < ends[i];
					const k = active ? prog(f, a, 14) : f >= ends[i] ? 1 - prog(f, ends[i], 14) : 0;
					return (
						<Rise key={n} at={a} dist={50} dur={20}>
							<Card
								style={{
									width: 880,
									padding: '34px 44px',
									display: 'flex',
									alignItems: 'center',
									gap: 34,
									scale: String(1 + k * 0.04),
									boxShadow: `0 30px 70px rgba(20,40,90,${0.08 + k * 0.08}), 0 0 0 ${k * 3}px rgba(0,113,227,${k})`,
								}}
							>
								<div style={{width: 76, height: 76, borderRadius: 38, background: k > 0.5 ? ACCENT : INK, color: '#fff', fontFamily: IT, fontSize: 38, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{n}</div>
								<div style={{fontFamily: IT, fontSize: 48, fontWeight: 600, color: INK, whiteSpace: 'nowrap'}}>{t}</div>
							</Card>
						</Rise>
					);
				})}
			</Col>
			{steps.map(([n, , a]) => (
				<Tick key={n} at={a} />
			))}
		</Drift>
	);
};

/* 9 — «До конца акции семь дней. Но места могут закончиться раньше» */
const S9: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<Drift dur={DUR[8] + TR}>
			<AppleBg />
			<Lockup />
			<Col>
				<Eyebrow at={at(8, 28.6)}>До конца акции</Eyebrow>
				<div style={{display: 'flex', alignItems: 'baseline', gap: 26, fontFamily: IT, fontWeight: 700, color: INK}}>
					<Pop at={at(8, 29.6)} style={{fontSize: 320, letterSpacing: -14, lineHeight: 1.05}}>
						7
					</Pop>
					<Pop at={at(8, 29.9)} style={{fontSize: 130, letterSpacing: -4}}>
						дней
					</Pop>
				</div>
				<div style={{display: 'flex', gap: 14, marginTop: 30}}>
					{Array.from({length: 7}).map((_, i) => {
						const q = prog(f, at(8, 29.7) + i * 2, 12);
						return <div key={i} style={{width: 96, height: 16, borderRadius: 8, background: i === 0 ? ACCENT : '#d9dde6', opacity: q, scale: `${q} 1`}} />;
					})}
				</div>
				<Rise at={at(8, 30.4)} dist={24} style={{marginTop: 70}}>
					<div style={{fontFamily: IT, fontSize: 50, fontWeight: 500, color: GRAY, textAlign: 'center'}}>
						но места могут
						<br />
						<span style={{color: INK, fontWeight: 600}}>закончиться раньше</span>
					</div>
				</Rise>
			</Col>
			<Tick at={at(8, 29.6)} />
		</Drift>
	);
};

/* 10 — «Успей забрать свою» */
const S10: React.FC = () => {
	const f = useCurrentFrame();
	const tapAt = at(9, 33.2);
	const tap = interpolate(f - tapAt, [0, 5, 14], [1, 0.93, 1], clamp);
	const rp = prog(f, tapAt + 2, 26);
	return (
		<Drift dur={DUR[9]}>
			<AppleBg />
			<Col>
				<AppIcon size={240} at={0} />
				<div style={{height: 80}} />
				<Lines at={at(9, 32.25)} size={120} weight={700} lines={['Успей', 'забрать свою']} colors={[INK, ACCENT]} stagger={at(9, 32.72) - at(9, 32.25)} />
				<Rise at={at(9, 32.8)} dist={40} style={{marginTop: 100}}>
					<div style={{position: 'relative', scale: String(tap)}}>
						{rp > 0 && rp < 1 ? <div style={{position: 'absolute', inset: -10, borderRadius: 80, border: `3px solid ${ACCENT}`, opacity: 1 - rp, scale: String(1 + rp * 0.25)}} /> : null}
						<BlackPill style={{fontSize: 60, fontWeight: 600, padding: '38px 80px', borderRadius: 80}}>@horzvpnbot</BlackPill>
					</div>
				</Rise>
			</Col>
			<Tick at={tapAt} vol={0.22} />
		</Drift>
	);
};

const SCENES = [S1, S2, S3, S4, S5, S6, S7, S8, S9, S10];

export const Day3: React.FC = () => (
	<AbsoluteFill style={{background: '#fbfbfd'}}>
		<TransitionSeries>
			{SCENES.map((S, i) => (
				<React.Fragment key={i}>
					{i > 0 ? <TransitionSeries.Transition presentation={blurZoom() as never} timing={linearTiming({durationInFrames: TR, easing: INOUT})} /> : null}
					<TransitionSeries.Sequence durationInFrames={DUR[i] + (i < SCENES.length - 1 ? TR : 0)}>
						<S />
					</TransitionSeries.Sequence>
				</React.Fragment>
			))}
		</TransitionSeries>
		<Audio src={staticFile('day3/voice.mp3')} />
	</AbsoluteFill>
);
