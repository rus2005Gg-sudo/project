import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {Img} from 'remotion';
import {LOGO, ACCENT, AppIcon, AppleBg, BlackPill, Card, Drift, Eyebrow, GRAY, HAIR, INK, INOUT, IT, Lines, Lockup, Rise, SUB, blurZoom, clamp, prog} from './kit';

export const D4_FPS = 30;
const VOICE = 29.8;
const TR = 14;
// scene starts (s), slightly ahead of the first word of each phrase (word times from ASR)
const STARTS = [0, 2.5, 5.8, 9.0, 13.55, 15.05, 20.7, 22.3, 26.7];
const fr = (s: number) => Math.round(s * D4_FPS);
export const DAY4_FRAMES = fr(VOICE + 1.4);
const DUR = STARTS.map((s, i) => (i < STARTS.length - 1 ? fr(STARTS[i + 1]) : DAY4_FRAMES) - fr(s));
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


const GREEN = '#34c759';
const Page: React.FC<{children: React.ReactNode; gap?: number; justify?: React.CSSProperties['justifyContent']}> = ({children, gap = 0, justify = 'center'}) => (
	<AbsoluteFill style={{padding: '190px 56px 120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: justify, gap}}>{children}</AbsoluteFill>
);

/* 1 — «Четвёртый день акции Horz VPN» */
const S1: React.FC = () => (
	<Drift dur={DUR[0] + TR}>
		<AppleBg />
		<Lockup at={at(0, 1.3)} />
		<Page>
			<Eyebrow at={at(0, 0.8)}>Акция «Месяц бесплатно»</Eyebrow>
			<div style={{display: 'flex', alignItems: 'baseline', gap: 30}}>
				<Lines at={at(0, 0.55)} size={170} weight={700} lines={['День']} />
				<Pop at={at(0, 0)} style={{fontFamily: IT, fontWeight: 700, fontSize: 420, letterSpacing: -20, color: ACCENT, lineHeight: 1}}>
					4
				</Pop>
			</div>
		</Page>
		<Tick at={2} />
	</Drift>
);

/* 2 — «Уже тридцать девять человек забрали месяц бесплатно» */
const S2: React.FC = () => (
	<Drift dur={DUR[1] + TR}>
		<AppleBg />
		<Lockup />
		<Page>
			<Lines at={at(1, 2.55)} size={90} lines={['Уже']} color={GRAY} />
			<Rise at={0} dist={60}>
				<div style={{fontFamily: IT, fontSize: 460, fontWeight: 700, color: INK, letterSpacing: -24, lineHeight: 1}}>
					<Roll from={0} to={39} a={at(1, 2.95)} b={at(1, 3.8)} />
				</div>
			</Rise>
			<Lines at={at(1, 3.75)} size={96} weight={700} lines={['человек забрали']} />
			<Lines at={at(1, 4.65)} size={96} weight={700} lines={['месяц бесплатно']} color={ACCENT} />
		</Page>
	</Drift>
);

/* 3 — «Осталось двести шестьдесят одна подписка из трёхсот» */
const S3: React.FC = () => {
	const f = useCurrentFrame();
	const a = at(2, 6.4);
	const b = at(2, 7.6);
	const taken = Math.round(interpolate(f, [a, b], [0, 39], {...clamp, easing: INOUT}));
	return (
		<Drift dur={DUR[2] + TR}>
			<AppleBg />
			<Lockup />
			<Page>
				<Eyebrow at={at(2, 5.85)}>Осталось</Eyebrow>
				<Rise at={at(2, 5.9)} dist={50}>
					<div style={{fontFamily: IT, fontSize: 340, fontWeight: 700, color: INK, letterSpacing: -16, lineHeight: 1.02}}>
						<Roll from={300} to={261} a={a} b={b} />
					</div>
				</Rise>
				<div style={{fontFamily: IT, fontSize: 60, fontWeight: 500, color: GRAY, display: 'flex', gap: 18}}>
					<Pop at={at(2, 7.6)}>подписка</Pop>
					<Pop at={at(2, 8.4)} style={{color: INK}}>
						из 300
					</Pop>
				</div>
				<Rise at={at(2, 5.95)} dist={30} style={{marginTop: 50}}>
					<Card style={{padding: 44, width: 968, boxSizing: 'border-box'}}>
						<div style={{display: 'grid', gridTemplateColumns: 'repeat(25, 1fr)', gap: 8}}>
							{Array.from({length: 300}).map((_, i) => {
								const on = i < taken;
								const flash = on ? interpolate(f - (a + (i / 39) * (b - a)), [0, 6], [1.35, 1], clamp) : 1;
								return <div key={i} style={{aspectRatio: '1', borderRadius: 6, background: on ? ACCENT : '#e8e8ed', scale: String(flash)}} />;
							})}
						</div>
						<div style={{display: 'flex', justifyContent: 'space-between', marginTop: 30, fontFamily: IT, fontSize: 36, fontWeight: 500}}>
							<span style={{color: ACCENT}}>● Забрали {taken}</span>
							<span style={{color: SUB}}>● Свободно {300 - taken}</span>
						</div>
					</Card>
				</Rise>
			</Page>
		</Drift>
	);
};

/* 4 — «Внутри: тридцать дней, сто гигабайт и два устройства. Без оплаты» */
const S4: React.FC = () => {
	const items: [string, string, number][] = [
		['30', 'дней', at(3, 9.9)],
		['100', 'гигабайт', at(3, 10.7)],
		['2', 'устройства', at(3, 11.7)],
	];
	return (
		<Drift dur={DUR[3] + TR}>
			<AppleBg />
			<Lockup />
			<Page gap={28}>
				<Lines at={at(3, 9.1)} size={120} weight={700} lines={['Внутри']} />
				<div style={{height: 10}} />
				{items.map(([n, l, a], i) => (
					<Rise key={i} at={a} dist={60} dur={20}>
						<Card style={{width: 968, padding: '40px 60px', display: 'flex', alignItems: 'baseline', gap: 30, boxSizing: 'border-box'}}>
							<span style={{fontFamily: IT, fontSize: 170, fontWeight: 700, color: ACCENT, letterSpacing: -7, lineHeight: 1}}>{n}</span>
							<span style={{fontFamily: IT, fontSize: 66, fontWeight: 600, color: SUB}}>{l}</span>
						</Card>
					</Rise>
				))}
				<Rise at={at(3, 12.7)} dist={40} dur={20}>
					<Card style={{width: 968, padding: '36px 60px', background: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, boxSizing: 'border-box'}}>
						<span style={{fontFamily: IT, fontSize: 90, fontWeight: 700, color: '#fff', letterSpacing: -3}}>0 ₽</span>
						<span style={{fontFamily: IT, fontSize: 54, fontWeight: 600, color: '#fff', opacity: 0.7}}>без оплаты</span>
					</Card>
				</Rise>
			</Page>
			{items.map(([, , a], i) => (
				<Tick key={i} at={a} />
			))}
			<Tick at={at(3, 12.7)} />
		</Drift>
	);
};

/* 5 — «Как забрать? Всё просто» */
const S5: React.FC = () => (
	<Drift dur={DUR[4] + TR}>
		<AppleBg />
		<Lockup />
		<Page>
			<Lines at={at(4, 13.6)} size={190} weight={700} lines={['Как', 'забрать?']} stagger={at(4, 13.9) - at(4, 13.6)} />
			<div style={{height: 40}} />
			<Lines at={at(4, 14.45)} size={130} weight={700} lines={['Всё просто']} color={ACCENT} />
		</Page>
	</Drift>
);

/* 6 — «Переходи по ссылке в профиле. Подписывайся на канал. Открывай бота и жми «Месяц бесплатно»» */
const S6: React.FC = () => {
	const f = useCurrentFrame();
	const linkAt = at(5, 15.75);
	const hl = prog(f, linkAt, 12);
	const tap = interpolate(f - linkAt, [0, 5, 14], [1, 0.94, 1], clamp);
	const steps: [string, React.ReactNode, number][] = [
		['2', 'Подпишись на канал', at(5, 16.7)],
		['3', <>Открой <span style={{color: ACCENT}}>@horzvpnbot</span></>, at(5, 18.5)],
		['4', 'Жми «Месяц бесплатно»', at(5, 19.35)],
	];
	const ends = [at(5, 18.5), at(5, 19.35), 9999];
	return (
		<Drift dur={DUR[5] + TR} amount={0.02}>
			<AppleBg />
			<Lockup />
			<Page gap={26}>
				{/* step 1 — profile mock */}
				<Rise at={at(5, 15.1)} dist={50} dur={20}>
					<Card style={{width: 968, padding: '40px 46px', boxSizing: 'border-box', boxShadow: `0 30px 70px rgba(20,40,90,0.10), 0 0 0 ${hl * 3}px rgba(0,113,227,${hl * (f < ends[0] - 0 && f < at(5, 16.7) ? 1 : 0.0)})`}}>
						<div style={{display: 'flex', alignItems: 'center', gap: 30}}>
							<div style={{width: 76, height: 76, borderRadius: 38, background: INK, color: '#fff', fontFamily: IT, fontSize: 38, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>1</div>
							<div style={{fontFamily: IT, fontSize: 50, fontWeight: 600, color: INK}}>Ссылка в профиле</div>
						</div>
						<div style={{position: 'relative', marginTop: 30, borderRadius: 28, overflow: 'hidden', boxShadow: '0 0 0 2px #e5e5ea'}}>
							<Img src={staticFile('day4/profile.png')} style={{width: '100%', display: 'block'}} />
							<div style={{position: 'absolute', left: 18, top: 522, width: 300, height: 62, borderRadius: 16, border: `5px solid ${ACCENT}`, background: `rgba(0,113,227,${hl * 0.12})`, opacity: hl, scale: String(tap * interpolate(hl, [0, 1], [1.3, 1]))}} />
							<div style={{position: 'absolute', left: 230, top: 518, width: 70, height: 70, borderRadius: 35, background: 'rgba(0,0,0,0.25)', border: '4px solid #fff', opacity: interpolate(f - linkAt, [-8, 0, 16, 26], [0, 1, 1, 0], clamp), scale: String(interpolate(f - linkAt, [-8, 0, 6], [1.4, 1, 0.85], clamp))}} />
						</div>
					</Card>
				</Rise>
				{steps.map(([n, t, a], i) => {
					const active = f >= a && f < ends[i];
					const k = active ? prog(f, a, 12) : f >= ends[i] ? 1 - prog(f, ends[i], 12) : 0;
					return (
						<Rise key={n} at={a} dist={50} dur={18}>
							<Card style={{width: 968, padding: '36px 46px', display: 'flex', alignItems: 'center', gap: 30, boxSizing: 'border-box', scale: String(1 + k * 0.03), boxShadow: `0 30px 70px rgba(20,40,90,${0.08 + k * 0.08}), 0 0 0 ${k * 3}px rgba(0,113,227,${k})`}}>
								<div style={{width: 76, height: 76, borderRadius: 38, background: k > 0.5 ? ACCENT : INK, color: '#fff', fontFamily: IT, fontSize: 38, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{n}</div>
								<div style={{fontFamily: IT, fontSize: 52, fontWeight: 600, color: INK, whiteSpace: 'nowrap'}}>{t}</div>
							</Card>
						</Rise>
					);
				})}
			</Page>
			<Tick at={linkAt} />
			{steps.map(([n, , a]) => (
				<Tick key={n} at={a} />
			))}
		</Drift>
	);
};

/* 7 — «Готово — подписка твоя» */
const S7: React.FC = () => {
	const f = useCurrentFrame();
	const c = prog(f, at(6, 20.8), 18);
	return (
		<Drift dur={DUR[6] + TR}>
			<AppleBg glow="52,199,89" />
			<Lockup />
			<Page>
				<div style={{width: 300, height: 300, borderRadius: 150, background: GREEN, color: '#fff', fontFamily: IT, fontSize: 180, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: c, scale: String(interpolate(c, [0, 0.6, 1], [0.3, 1.12, 1])), boxShadow: '0 30px 80px rgba(52,199,89,0.35)'}}>✓</div>
				<div style={{height: 70}} />
				<Lines at={at(6, 20.8)} size={170} weight={700} lines={['Готово']} />
				<Lines at={at(6, 21.3)} size={110} weight={700} lines={['подписка твоя']} color={GREEN} />
			</Page>
			<Tick at={at(6, 20.8)} vol={0.22} />
		</Drift>
	);
};

/* 8 — «А если у тебя уже есть платный безлимит — получишь плюс тридцать дней к тарифу» */
const S8: React.FC = () => (
	<Drift dur={DUR[7] + TR}>
		<AppleBg />
		<Lockup />
		<Page>
			<Lines at={at(7, 22.4)} size={96} weight={700} lines={['Уже есть']} color={GRAY} />
			<Lines at={at(7, 23.65)} size={120} weight={700} lines={['платный безлимит?']} />
			<div style={{height: 60}} />
			<Rise at={at(7, 24.65)} dist={50}>
				<Card style={{width: 968, padding: '50px 60px', boxSizing: 'border-box', textAlign: 'center'}}>
					<div style={{fontFamily: IT, fontSize: 44, fontWeight: 500, color: SUB}}>получишь</div>
					<div style={{fontFamily: IT, fontSize: 230, fontWeight: 700, color: ACCENT, letterSpacing: -10, lineHeight: 1.05}}>
						<Pop at={at(7, 25.2)}>+30</Pop>
					</div>
					<div style={{fontFamily: IT, fontSize: 60, fontWeight: 600, color: INK}}>
						<Pop at={at(7, 25.8)}>дней к тарифу</Pop>
					</div>
				</Card>
			</Rise>
		</Page>
		<Tick at={at(7, 25.2)} />
	</Drift>
);

/* 9 — «Места уходят каждый день. Успей забрать свою» */
const S9: React.FC = () => {
	const f = useCurrentFrame();
	const tapAt = at(8, 29.2);
	const tap = interpolate(f - tapAt, [0, 5, 14], [1, 0.93, 1], clamp);
	const rp = prog(f, tapAt + 2, 26);
	return (
		<Drift dur={DUR[8]}>
			<AppleBg />
			<Page>
				<AppIcon size={220} at={0} />
				<div style={{height: 70}} />
				<Lines at={at(8, 26.75)} size={100} weight={700} lines={['Места уходят']} color={GRAY} />
				<Lines at={at(8, 27.7)} size={100} weight={700} lines={['каждый день']} color={GRAY} />
				<div style={{height: 30}} />
				<Lines at={at(8, 28.4)} size={150} weight={700} lines={['Успей', 'забрать свою']} colors={[INK, ACCENT]} stagger={at(8, 28.85) - at(8, 28.4)} />
				<Rise at={at(8, 28.9)} dist={40} style={{marginTop: 80}}>
					<div style={{position: 'relative', scale: String(tap)}}>
						{rp > 0 && rp < 1 ? <div style={{position: 'absolute', inset: -10, borderRadius: 90, border: `3px solid ${ACCENT}`, opacity: 1 - rp, scale: String(1 + rp * 0.2)}} /> : null}
						<BlackPill style={{fontSize: 60, fontWeight: 600, padding: '40px 90px', borderRadius: 90}}>Ссылка в профиле</BlackPill>
					</div>
				</Rise>
			</Page>
			<Tick at={tapAt} vol={0.22} />
		</Drift>
	);
};

const SCENES = [S1, S2, S3, S4, S5, S6, S7, S8, S9];

export const Day4: React.FC = () => (
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
		<Audio src={staticFile('day4/voice.mp3')} />
	</AbsoluteFill>
);
