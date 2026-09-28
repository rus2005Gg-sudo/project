import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {ACCENT, AppIcon, AppleBg, BlackPill, Card, Count, Drift, Eyebrow, GRAY, HAIR, INK, INOUT, IT, Lines, Lockup, Rise, SUB, blurZoom, clamp, prog} from './kit';

export const D3_FPS = 30;
const VOICE = 33.65;
const TR = 14;
const STARTS = [0, 2.45, 5.5, 9.1, 14.5, 16.9, 25.7, 30.4];
const fr = (s: number) => Math.round(s * D3_FPS);
export const DAY3_FRAMES = fr(VOICE + 1.3);
const DUR = STARTS.map((s, i) => (i < STARTS.length - 1 ? fr(STARTS[i + 1]) : DAY3_FRAMES) - fr(s));
// local frame of absolute second t inside scene i
const at = (i: number, t: number) => fr(t) - fr(STARTS[i]);

const Col: React.FC<{children: React.ReactNode; gap?: number}> = ({children, gap = 0}) => (
	<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap}}>{children}</AbsoluteFill>
);

const Tick: React.FC<{at: number; vol?: number}> = ({at: a, vol = 0.18}) => (
	<Sequence from={Math.max(0, a)} layout="none">
		<Audio src={staticFile('sfx/tick-001.mp3')} volume={vol} />
	</Sequence>
);

/* 1 — Day 3 */
const S1: React.FC = () => {
	const f = useCurrentFrame();
	const p = prog(f, 4, 30);
	return (
		<Drift dur={DUR[0] + TR}>
			<AppleBg />
			<Lockup />
			<Col>
				<Eyebrow at={2}>Акция «Месяц бесплатно»</Eyebrow>
				<div style={{height: 30}} />
				<div style={{fontFamily: IT, fontWeight: 700, color: INK, fontSize: 150, letterSpacing: -6, display: 'flex', alignItems: 'baseline', gap: 30}}>
					<Lines at={6} size={150} weight={700} lines={['День']} />
					<span style={{fontSize: 330, letterSpacing: -16, color: ACCENT, opacity: p, scale: String(interpolate(p, [0, 1], [0.7, 1])), display: 'inline-block', filter: p < 0.99 ? `blur(${(1 - p) * 14}px)` : undefined}}>3</span>
				</div>
			</Col>
			<Tick at={8} />
		</Drift>
	);
};

/* 2 — 28 people took it */
const S2: React.FC = () => (
	<Drift dur={DUR[1] + TR}>
		<AppleBg />
		<Lockup />
		<Col>
			<Rise at={0} dist={60}>
				<div style={{fontFamily: IT, fontSize: 380, fontWeight: 700, color: INK, letterSpacing: -20, lineHeight: 1}}>
					<Count to={28} at={2} dur={40} />
				</div>
			</Rise>
			<Lines at={10} size={84} lines={['человек уже забрали', 'месяц бесплатно']} colors={[INK, ACCENT]} />
		</Col>
	</Drift>
);

/* 3 — 272 of 300 left */
const S3: React.FC = () => {
	const f = useCurrentFrame();
	const fill = prog(f, 14, 50, INOUT) * (28 / 300);
	const cells = Array.from({length: 300});
	return (
		<Drift dur={DUR[2] + TR}>
			<AppleBg />
			<Lockup />
			<Col>
				<Eyebrow at={0}>Осталось</Eyebrow>
				<Rise at={2} dist={50}>
					<div style={{fontFamily: IT, fontSize: 300, fontWeight: 700, color: INK, letterSpacing: -14, lineHeight: 1.05}}>
						<Count to={272} at={4} dur={44} />
					</div>
				</Rise>
				<Rise at={10} dist={20}>
					<div style={{fontFamily: IT, fontSize: 48, fontWeight: 500, color: GRAY}}>подписок из 300</div>
				</Rise>
				<Rise at={16} dist={30} style={{marginTop: 70}}>
					<Card style={{padding: 44, width: 860}}>
						<div style={{display: 'grid', gridTemplateColumns: 'repeat(25, 1fr)', gap: 7}}>
							{cells.map((_, i) => {
								const taken = i < Math.round(fill * 300);
								const appear = prog(f, 16 + (i % 25) * 0.6 + Math.floor(i / 25) * 0.8, 14);
								return <div key={i} style={{aspectRatio: '1', borderRadius: 6, background: taken ? ACCENT : '#e8e8ed', opacity: appear, scale: String(0.6 + appear * 0.4)}} />;
							})}
						</div>
						<div style={{display: 'flex', justifyContent: 'space-between', marginTop: 30, fontFamily: IT, fontSize: 32, fontWeight: 500}}>
							<span style={{color: ACCENT}}>● Забрали 28</span>
							<span style={{color: SUB}}>● Свободно 272</span>
						</div>
					</Card>
				</Rise>
			</Col>
		</Drift>
	);
};

/* 4 — what's inside */
const S4: React.FC = () => {
	const items: [string, string, number][] = [
		['30', 'дней', at(3, 10.1)],
		['100', 'гигабайт', at(3, 11.65)],
		['2', 'устройства', at(3, 12.77)],
	];
	return (
		<Drift dur={DUR[3] + TR}>
			<AppleBg />
			<Lockup />
			<Col gap={34}>
				<Lines at={0} size={110} lines={['Что внутри']} />
				<div style={{height: 20}} />
				{items.map(([n, l, a], i) => (
					<Rise key={i} at={a} dist={50}>
						<Card style={{width: 820, padding: '40px 60px', display: 'flex', alignItems: 'baseline', gap: 30}}>
							<span style={{fontFamily: IT, fontSize: 150, fontWeight: 700, color: i === 0 ? ACCENT : INK, letterSpacing: -6, lineHeight: 1}}>{n}</span>
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

/* 5 — free */
const S5: React.FC = () => (
	<Drift dur={DUR[4] + TR}>
		<AppleBg />
		<Lockup />
		<Col>
			<Rise at={0} dist={60}>
				<div style={{fontFamily: IT, fontSize: 330, fontWeight: 700, color: INK, letterSpacing: -16, lineHeight: 1}}>
					0 <span style={{color: ACCENT}}>₽</span>
				</div>
			</Rise>
			<Lines at={8} size={84} lines={['Без оплаты.', 'Без карты.']} colors={[INK, GRAY]} stagger={10} />
		</Col>
	</Drift>
);

/* 6 — whitelists */
const SITES = ['госуслуги', 'маркетплейс', 'новости', 'видео', 'соцсеть', 'мессенджер', 'игры', 'почта'];
const S6: React.FC = () => {
	const f = useCurrentFrame();
	const cut = at(5, 20.3);
	const allowed = [0, 1];
	return (
		<Drift dur={DUR[5] + TR} amount={0.025}>
			<AppleBg glow="255,59,48" />
			<Lockup />
			<AbsoluteFill style={{alignItems: 'center', paddingTop: 260}}>
				<Eyebrow at={0} color="#ff3b30">В некоторых регионах</Eyebrow>
				<div style={{height: 20}} />
				<Lines at={4} size={96} lines={['вводят', 'белые списки']} colors={[INK, INK]} />
				<Rise at={10} dist={40} style={{marginTop: 60}}>
					<Card style={{width: 860, padding: '18px 50px'}}>
						{SITES.map((s, i) => {
							const ok = allowed.includes(i);
							const p = prog(f, cut + i * 4, 16);
							return (
								<div key={s} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 0', borderTop: i ? `1px solid ${HAIR}` : undefined, fontFamily: IT, fontSize: 40, fontWeight: 500}}>
									<span style={{color: ok ? INK : interpolate(p, [0, 1], [0, 1]) > 0.5 ? '#c7c7cc' : INK}}>{s}</span>
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
											fontSize: 30,
											fontWeight: 700,
											opacity: p,
											scale: String(0.5 + p * 0.5),
										}}
									>
										{ok ? '✓' : '✕'}
									</span>
								</div>
							);
						})}
					</Card>
				</Rise>
				<Rise at={at(5, 22.45)} dist={30} style={{marginTop: 60}}>
					<div style={{fontFamily: IT, fontSize: 56, fontWeight: 600, color: INK, textAlign: 'center'}}>
						Подготовься <span style={{color: ACCENT}}>заранее</span>
					</div>
				</Rise>
			</AbsoluteFill>
		</Drift>
	);
};

/* 7 — how to get */
const S7: React.FC = () => {
	const steps: [string, React.ReactNode, number][] = [
		['1', <>Найди <b style={{color: ACCENT}}>@horzvpnbot</b></>, 2],
		['2', 'Подпишись на канал', at(6, 28.7)],
		['3', '«Месяц бесплатно»', at(6, 29.5)],
	];
	return (
		<Drift dur={DUR[6] + TR}>
			<AppleBg />
			<Lockup />
			<Col gap={30}>
				<AppIcon size={200} at={0} />
				<div style={{height: 20}} />
				<Lines at={2} size={96} lines={['Всё, что нужно']} />
				<div style={{height: 20}} />
				{steps.map(([n, t, a]) => (
					<Rise key={n} at={a} dist={40}>
						<Card style={{width: 860, padding: '34px 44px', display: 'flex', alignItems: 'center', gap: 34}}>
							<div style={{width: 76, height: 76, borderRadius: 38, background: INK, color: '#fff', fontFamily: IT, fontSize: 38, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{n}</div>
							<div style={{fontFamily: IT, fontSize: 50, fontWeight: 600, color: INK, fontVariantLigatures: 'none'}}>{t}</div>
						</Card>
					</Rise>
				))}
			</Col>
			{steps.map(([n, , a]) => (
				<Tick key={n} at={a} />
			))}
		</Drift>
	);
};

/* 8 — 7 days, CTA */
const S8: React.FC = () => {
	const f = useCurrentFrame();
	const tap = interpolate(f - 40, [0, 5, 14], [1, 0.93, 1], clamp);
	const rp = prog(f, 42, 26);
	return (
		<Drift dur={DUR[7]}>
			<AppleBg />
			<Lockup />
			<Col>
				<Eyebrow at={0}>До конца акции</Eyebrow>
				<Rise at={2} dist={60}>
					<div style={{fontFamily: IT, fontSize: 300, fontWeight: 700, color: INK, letterSpacing: -14, lineHeight: 1.05}}>
						<Count to={7} at={4} dur={24} /> <span style={{fontSize: 130, letterSpacing: -4}}>дней</span>
					</div>
				</Rise>
				<Rise at={12} dist={20}>
					<div style={{fontFamily: IT, fontSize: 46, fontWeight: 500, color: GRAY}}>но места могут закончиться раньше</div>
				</Rise>
				<Rise at={20} dist={40} style={{marginTop: 110}}>
					<div style={{position: 'relative', scale: String(tap)}}>
						{rp > 0 && rp < 1 ? <div style={{position: 'absolute', inset: -10, borderRadius: 80, border: `3px solid ${ACCENT}`, opacity: 1 - rp, scale: String(1 + rp * 0.25)}} /> : null}
						<BlackPill style={{fontSize: 60, fontWeight: 600, padding: '38px 80px', borderRadius: 80}}>@horzvpnbot</BlackPill>
					</div>
				</Rise>
			</Col>
			<Tick at={40} vol={0.22} />
		</Drift>
	);
};

const SCENES = [S1, S2, S3, S4, S5, S6, S7, S8];

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
