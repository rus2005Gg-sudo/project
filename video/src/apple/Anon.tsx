import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {Img} from 'remotion';
import {LOGO, ACCENT, AppIcon, AppleBg, BlackPill, Card, Drift, Eyebrow, GRAY, HAIR, INK, INOUT, IT, Lines, Lockup, Rise, SUB, blurZoom, clamp, prog} from './kit';

export const AN_FPS = 30;
const VOICE = 50.76;
const TR = 14;
// scene starts (s), slightly ahead of the first word of each phrase (word times from ASR)
const STARTS = [0, 3.55, 6.3, 8.65, 14.9, 31.75, 40.75, 43.85, 48.3];
const fr = (s: number) => Math.round(s * AN_FPS);
export const ANON_FRAMES = fr(VOICE + 1.4);
const DUR = STARTS.map((s, i) => (i < STARTS.length - 1 ? fr(STARTS[i + 1]) : ANON_FRAMES) - fr(s));
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


const RED = '#ff3b30';

/** highlight box drawn over a screenshot */
const Mark: React.FC<{at: number; x: number; y: number; w: number; h: number; color?: string}> = ({at: a, x, y, w, h, color = ACCENT}) => {
	const f = useCurrentFrame();
	const p = prog(f, a, 14);
	return <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 18, border: `5px solid ${color}`, background: `${color}14`, opacity: p, scale: String(interpolate(p, [0, 1], [1.25, 1]))}} />;
};

/* 1 — «Прошлый ролик… посмотрели больше тысячи раз» — stats screenshot */
const S1: React.FC = () => {
	const W = 880;
	const k = W / 827;
	return (
		<Drift dur={DUR[0] + TR} amount={0.02}>
			<AppleBg />
			<Page justify="flex-start" gap={30}>
				<Lines at={at(0, 0)} size={84} weight={700} lines={['Прошлый ролик']} />
				<Rise at={at(0, 0.3)} dist={60}>
					<div style={{position: 'relative', width: W, borderRadius: 36, overflow: 'hidden', boxShadow: '0 30px 80px rgba(20,40,90,0.16)'}}>
						<Img src={staticFile('anon/stats.jpg')} style={{width: W, display: 'block'}} />
						<Mark at={at(0, 2.5)} x={40 * k} y={420 * k} w={150 * k} h={110 * k} />
						<Mark at={at(0, 3.2)} x={40 * k} y={1130 * k} w={370 * k} h={160 * k} color={GREEN} />
					</div>
				</Rise>
			</Page>
			<Tick at={at(0, 2.5)} />
		</Drift>
	);
};

/* 2 — «И вы спрашивали: а как проверить свой VPN?» */
const S2: React.FC = () => (
	<Drift dur={DUR[1] + TR}>
		<AppleBg />
		<Lockup />
		<Page>
			<Lines at={at(1, 3.6)} size={96} weight={700} lines={['И вы спрашивали']} color={GRAY} />
			<div style={{height: 40}} />
			<Lines at={at(1, 4.75)} size={150} weight={700} lines={['Как', 'проверить']} stagger={at(1, 5.0) - at(1, 4.75)} />
			<Lines at={at(1, 5.45)} size={150} weight={700} lines={['свой VPN?']} color={ACCENT} />
		</Page>
	</Drift>
);

/* 3 — «Показываю. Это занимает тридцать секунд» */
const S3: React.FC = () => {
	const f = useCurrentFrame();
	const ring = prog(f, at(2, 7.9), 20, INOUT);
	return (
		<Drift dur={DUR[2] + TR}>
			<AppleBg />
			<Lockup />
			<Page gap={50}>
				<Lines at={at(2, 6.35)} size={120} weight={700} lines={['Показываю']} />
				<div style={{position: 'relative', width: 520, height: 520}}>
					<svg width={520} height={520} style={{position: 'absolute', rotate: '-90deg'}}>
						<circle cx={260} cy={260} r={240} fill="none" stroke="#e5e5ea" strokeWidth={18} />
						<circle cx={260} cy={260} r={240} fill="none" stroke={ACCENT} strokeWidth={18} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ring} />
					</svg>
					<div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: IT}}>
						<div style={{fontSize: 230, fontWeight: 700, color: INK, letterSpacing: -10, lineHeight: 1}}>
							<Roll from={0} to={30} a={at(2, 7.9)} b={at(2, 8.5)} />
						</div>
						<div style={{fontSize: 56, fontWeight: 600, color: SUB}}>секунд</div>
					</div>
				</div>
			</Page>
			<Tick at={at(2, 7.9)} />
		</Drift>
	);
};

/* 4 — «Включи VPN. Открой сайт 2ip.io и выбери раздел «Проверка анонимности»» */
const S4: React.FC = () => {
	const f = useCurrentFrame();
	const url = '2ip.io';
	const typed = Math.round(interpolate(f, [at(3, 10.7), at(3, 12.0)], [0, url.length], clamp));
	const steps: [string, React.ReactNode, number, number][] = [
		['1', 'Включи VPN', at(3, 8.7), at(3, 9.85)],
		['2', <>Открой <span style={{color: ACCENT}}>2ip.io</span></>, at(3, 9.85), at(3, 12.55)],
		['3', '«Проверка анонимности»', at(3, 12.55), 9999],
	];
	return (
		<Drift dur={DUR[3] + TR} amount={0.02}>
			<AppleBg />
			<Lockup />
			<Page gap={28}>
				{/* browser mock */}
				<Rise at={at(3, 9.85)} dist={50}>
					<Card style={{width: 968, padding: 30, boxSizing: 'border-box'}}>
						<div style={{display: 'flex', gap: 12, marginBottom: 24}}>
							{['#ff5f57', '#febc2e', '#28c840'].map((c) => (
								<div key={c} style={{width: 22, height: 22, borderRadius: 11, background: c}} />
							))}
						</div>
						<div style={{background: '#f2f2f7', borderRadius: 22, padding: '24px 30px', fontFamily: IT, fontSize: 54, fontWeight: 600, color: INK, display: 'flex', alignItems: 'center', gap: 20}}>
							<span style={{fontSize: 40}}>🔒</span>
							{url.slice(0, typed)}
							<span style={{width: 4, height: 56, background: ACCENT, opacity: Math.floor(f / 8) % 2 ? 1 : 0}} />
						</div>
						<div style={{marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14}}>
							{['Узнать IP', 'Проверка анонимности', 'Скорость интернета'].map((t, i) => {
								const hl = i === 1 ? prog(f, at(3, 13.5), 12) : 0;
								return (
									<div key={t} style={{padding: '22px 28px', borderRadius: 18, fontFamily: IT, fontSize: 44, fontWeight: 600, color: hl > 0.5 ? '#fff' : SUB, background: hl > 0.5 ? ACCENT : '#f7f7f9', opacity: prog(f, at(3, 12.1) + i * 3, 12), scale: String(1 + hl * 0.03)}}>
										{t}
									</div>
								);
							})}
						</div>
					</Card>
				</Rise>
				{steps.map(([n, t, a, end]) => {
					const k = f >= a && f < end ? prog(f, a, 12) : f >= end ? 1 - prog(f, end, 12) : 0;
					return (
						<Rise key={n} at={a} dist={40} dur={18}>
							<Card style={{width: 968, padding: '30px 40px', display: 'flex', alignItems: 'center', gap: 28, boxSizing: 'border-box', boxShadow: `0 20px 50px rgba(20,40,90,0.08), 0 0 0 ${k * 3}px rgba(0,113,227,${k})`}}>
								<div style={{width: 70, height: 70, borderRadius: 35, background: k > 0.5 ? ACCENT : INK, color: '#fff', fontFamily: IT, fontSize: 36, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{n}</div>
								<div style={{fontFamily: IT, fontSize: 50, fontWeight: 600, color: INK}}>{t}</div>
							</Card>
						</Rise>
					);
				})}
			</Page>
			<Tick at={at(3, 8.7)} />
			<Tick at={at(3, 9.85)} />
			<Tick at={at(3, 13.5)} />
		</Drift>
	);
};

/* 5 — «Смотри на главное»: WebRTC / DNS / итог */
const S5: React.FC = () => {
	const f = useCurrentFrame();
	const items: [string, string, React.ReactNode, number, number, number][] = [
		['1', 'Утечка IP через WebRTC', <>должно быть <b style={{color: GREEN}}>«нет»</b></>, at(4, 16.25), at(4, 19.6), at(4, 20.4)],
		['2', 'Утечка DNS', <>DNS твоего провайдера = <b style={{color: RED}}>утечка</b></>, at(4, 20.4), at(4, 24.9), at(4, 26.1)],
		['3', 'Итоговая строка', <>реальный IP не узнали = <b style={{color: GREEN}}>всё ок</b></>, at(4, 26.1), at(4, 30.2), 9999],
	];
	return (
		<Drift dur={DUR[4] + TR} amount={0.02}>
			<AppleBg />
			<Lockup />
			<Page gap={34}>
				<Lines at={at(4, 14.95)} size={100} weight={700} lines={['Смотри на главное']} />
				<div style={{height: 10}} />
				{items.map(([n, title, hint, a, hintAt, end]) => {
					const k = f >= a && f < end ? prog(f, a, 12) : f >= end ? 1 - prog(f, end, 12) * 0.6 : 0;
					return (
						<Rise key={n} at={a} dist={50} dur={20}>
							<Card style={{width: 968, padding: '40px 44px', boxSizing: 'border-box', opacity: f >= end ? 0.75 : 1, boxShadow: `0 30px 70px rgba(20,40,90,0.08), 0 0 0 ${k * 3}px rgba(0,113,227,${k})`}}>
								<div style={{display: 'flex', alignItems: 'center', gap: 28}}>
									<div style={{width: 76, height: 76, borderRadius: 38, background: k > 0.5 ? ACCENT : INK, color: '#fff', fontFamily: IT, fontSize: 38, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{n}</div>
									<div style={{fontFamily: IT, fontSize: 56, fontWeight: 700, color: INK, letterSpacing: -1}}>{title}</div>
								</div>
								<Rise at={hintAt} dist={16} dur={16}>
									<div style={{fontFamily: IT, fontSize: 44, fontWeight: 500, color: SUB, marginTop: 20, paddingLeft: 104}}>{hint}</div>
								</Rise>
							</Card>
						</Rise>
					);
				})}
			</Page>
			{items.map(([n, , , a, h]) => (
				<React.Fragment key={n}>
					<Tick at={a} />
					<Tick at={h} vol={0.1} />
				</React.Fragment>
			))}
		</Drift>
	);
};

/* 6 — «Вот как выглядит проверка Horz VPN» */
const S6: React.FC = () => {
	const f = useCurrentFrame();
	const rows: [string, string, number][] = [
		['Утечка IP через WebRTC', 'нет', at(5, 34.45)],
		['Утечка DNS', 'не провайдерский', at(5, 36.6)],
		['Реальный IP', 'не найден', at(5, 38.6)],
	];
	return (
		<Drift dur={DUR[5] + TR} amount={0.02}>
			<AppleBg glow="52,199,89" />
			<Page gap={30}>
				<div style={{display: 'flex', alignItems: 'center', gap: 30}}>
					<AppIcon size={150} at={at(5, 31.8)} float={false} />
					<div>
						<Lines at={at(5, 32.3)} size={70} weight={700} lines={['Проверка']} align="left" color={GRAY} />
						<Lines at={at(5, 33.4)} size={90} weight={700} lines={['Horz VPN']} align="left" />
					</div>
				</div>
				<Rise at={at(5, 32.6)} dist={40}>
					<Card style={{width: 968, padding: '34px 44px', boxSizing: 'border-box'}}>
						<div style={{fontFamily: IT, fontSize: 34, fontWeight: 500, color: GRAY}}>сайты видят тебя как</div>
						<div style={{fontFamily: IT, fontSize: 54, fontWeight: 700, color: INK, marginTop: 8}}>Франкфурт, Германия</div>
					</Card>
				</Rise>
				{rows.map(([t, v, a]) => {
					const c = prog(f, a + 4, 14);
					return (
						<Rise key={t} at={a} dist={50} dur={18}>
							<Card style={{width: 968, padding: '34px 44px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 30}}>
								<div style={{width: 84, height: 84, borderRadius: 42, flexShrink: 0, background: GREEN, color: '#fff', fontFamily: IT, fontSize: 50, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: c, scale: String(interpolate(c, [0, 0.6, 1], [0.3, 1.15, 1]))}}>✓</div>
								<div style={{fontFamily: IT}}>
									<div style={{fontSize: 38, fontWeight: 500, color: SUB}}>{t}</div>
									<div style={{fontSize: 60, fontWeight: 700, color: GREEN, letterSpacing: -1}}>{v}</div>
								</div>
							</Card>
						</Rise>
					);
				})}
			</Page>
			{rows.map(([t, , a]) => (
				<Tick key={t} at={a + 4} />
			))}
		</Drift>
	);
};

/* 7 — «Мы не видим и не храним, какие сайты ты открываешь» */
const S7: React.FC = () => {
	const f = useCurrentFrame();
	const p = prog(f, at(6, 41.3), 20);
	return (
		<Drift dur={DUR[6] + TR}>
			<AppleBg />
			<Lockup />
			<Page gap={20}>
				<div style={{width: 300, height: 300, borderRadius: 84, background: '#fff', boxShadow: '0 30px 70px rgba(20,40,90,0.12)', padding: 64, boxSizing: 'border-box', opacity: p, scale: String(interpolate(p, [0, 1], [0.7, 1]))}}>
					<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke={ACCENT} strokeWidth={1.8} strokeLinecap="round">
						<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
						<circle cx="12" cy="12" r="3" />
						<path d="M3 3l18 18" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - prog(f, at(6, 41.4), 14)} />
					</svg>
				</div>
				<div style={{height: 50}} />
				<Lines at={at(6, 40.8)} size={120} weight={700} lines={['Мы не видим']} />
				<Lines at={at(6, 41.8)} size={120} weight={700} lines={['и не храним,']} />
				<div style={{height: 20}} />
				<Lines at={at(6, 42.4)} size={84} weight={700} lines={['какие сайты', 'ты открываешь']} color={ACCENT} stagger={at(6, 43.1) - at(6, 42.4)} />
			</Page>
		</Drift>
	);
};

/* 8 — «А сейчас у нас акция: 30 дней, 100 ГБ, 2 устройства — бесплатно» */
const S8: React.FC = () => {
	const items: [string, string, number][] = [
		['30', 'дней', at(7, 45.25)],
		['100', 'гигабайт', at(7, 45.95)],
		['2', 'устройства', at(7, 46.75)],
	];
	return (
		<Drift dur={DUR[7] + TR}>
			<AppleBg />
			<Lockup />
			<Page gap={26}>
				<Eyebrow at={at(7, 43.9)}>А сейчас у нас</Eyebrow>
				<Lines at={at(7, 44.7)} size={140} weight={700} lines={['Акция']} />
				<div style={{height: 10}} />
				{items.map(([n, l, a]) => (
					<Rise key={n} at={a} dist={50} dur={16}>
						<Card style={{width: 968, padding: '32px 56px', display: 'flex', alignItems: 'baseline', gap: 28, boxSizing: 'border-box'}}>
							<span style={{fontFamily: IT, fontSize: 140, fontWeight: 700, color: ACCENT, letterSpacing: -6, lineHeight: 1}}>{n}</span>
							<span style={{fontFamily: IT, fontSize: 60, fontWeight: 600, color: SUB}}>{l}</span>
						</Card>
					</Rise>
				))}
				<Rise at={at(7, 47.65)} dist={40} dur={16}>
					<Card style={{width: 968, padding: '34px 56px', background: INK, boxSizing: 'border-box', textAlign: 'center'}}>
						<span style={{fontFamily: IT, fontSize: 76, fontWeight: 700, color: '#fff', letterSpacing: -2}}>бесплатно</span>
					</Card>
				</Rise>
			</Page>
			{items.map(([n, , a]) => (
				<Tick key={n} at={a} />
			))}
			<Tick at={at(7, 47.65)} />
		</Drift>
	);
};

/* 9 — «Ссылка в профиле. Успей забрать свою» — profile screenshot */
const S9: React.FC = () => {
	const f = useCurrentFrame();
	const linkAt = at(8, 48.85);
	const hl = prog(f, linkAt, 12);
	const tap = interpolate(f - linkAt, [0, 5, 14], [1, 0.94, 1], clamp);
	const W = 968;
	const k = W / 828;
	return (
		<Drift dur={DUR[8]} amount={0.02}>
			<AppleBg />
			<Page gap={40}>
				<Lines at={at(8, 48.35)} size={110} weight={700} lines={['Ссылка в профиле']} />
				<Rise at={at(8, 48.4)} dist={50}>
					<div style={{position: 'relative', width: W, borderRadius: 36, overflow: 'hidden', boxShadow: '0 30px 80px rgba(20,40,90,0.14)'}}>
						<Img src={staticFile('anon/profile.png')} style={{width: W, display: 'block'}} />
						<div style={{position: 'absolute', left: 20 * k, top: 492 * k, width: 280 * k, height: 58 * k, borderRadius: 16, border: `5px solid ${ACCENT}`, background: `rgba(0,113,227,${hl * 0.12})`, opacity: hl, scale: String(tap * interpolate(hl, [0, 1], [1.3, 1]))}} />
						<div style={{position: 'absolute', left: 215 * k, top: 490 * k, width: 76, height: 76, borderRadius: 38, background: 'rgba(0,0,0,0.25)', border: '4px solid #fff', opacity: interpolate(f - linkAt, [-8, 0, 16, 26], [0, 1, 1, 0], clamp), scale: String(interpolate(f - linkAt, [-8, 0, 6], [1.4, 1, 0.85], clamp))}} />
					</div>
				</Rise>
				<Lines at={at(8, 49.4)} size={120} weight={700} lines={['Успей забрать']} colors={[ACCENT]} />
			</Page>
			<Tick at={linkAt} vol={0.22} />
		</Drift>
	);
};

const SCENES = [S1, S2, S3, S4, S5, S6, S7, S8, S9];

export const Anon: React.FC = () => (
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
		<Audio src={staticFile('anon/voice.mp3')} />
	</AbsoluteFill>
);
