import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {ACCENT, AppIcon, AppleBg, BlackPill, Card, Drift, GRAY, INK, INOUT, IT, LOGO, Lines, Rise, SUB, blurZoom, clamp, prog} from './kit';
import {Img} from 'remotion';

export const ISP_FPS = 30;
const VOICE = 39.08;
const TR = 14;
const RED = '#ff3b30';
const GREEN = '#34c759';
// scene starts, a hair ahead of the first word (word times from ASR)
const STARTS = [0, 4.15, 10.75, 13.4, 17.15, 22.75, 30.2, 33.05];
const fr = (s: number) => Math.round(s * ISP_FPS);
export const ISP_FRAMES = fr(VOICE + 1.3);
const DUR = STARTS.map((s, i) => (i < STARTS.length - 1 ? fr(STARTS[i + 1]) : ISP_FRAMES) - fr(s));
const at = (i: number, t: number) => fr(t) - fr(STARTS[i]);

const Tick: React.FC<{at: number; vol?: number}> = ({at: a, vol = 0.16}) => (
	<Sequence from={Math.max(0, a)} layout="none">
		<Audio src={staticFile('sfx/tick-001.mp3')} volume={vol} />
	</Sequence>
);

/** compact top lockup — sits high so content can fill the frame */
const Mark: React.FC = () => (
	<div style={{position: 'absolute', top: 70, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12}}>
		<Img src={LOGO} style={{width: 36}} />
		<div style={{fontFamily: IT, fontSize: 32, fontWeight: 600, color: INK, letterSpacing: -0.5}}>Horz VPN</div>
	</div>
);

/** full-frame column with tight gutters */
const Page: React.FC<{children: React.ReactNode; justify?: React.CSSProperties['justifyContent']; gap?: number}> = ({children, justify = 'center', gap = 0}) => (
	<AbsoluteFill style={{padding: '170px 56px 120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: justify, gap}}>{children}</AbsoluteFill>
);

/* ---------- icons ---------- */
const I = {
	phone: (c: string) => (
		<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke={c} strokeWidth={1.7} strokeLinecap="round">
			<rect x="6.5" y="2.5" width="11" height="19" rx="2.8" />
			<path d="M10.5 18.5h3" />
		</svg>
	),
	isp: (c: string) => (
		<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke={c} strokeWidth={1.7} strokeLinecap="round">
			<rect x="3" y="13" width="18" height="7" rx="2" />
			<path d="M7 16.5h.01M11 16.5h.01M8 13V9M16 13V9M5 7a10 10 0 0 1 14 0M8 9.5a6 6 0 0 1 8 0" />
		</svg>
	),
	globe: (c: string) => (
		<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke={c} strokeWidth={1.7}>
			<circle cx="12" cy="12" r="9" />
			<path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18" />
		</svg>
	),
	server: (c: string) => (
		<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke={c} strokeWidth={1.7} strokeLinecap="round">
			<rect x="4" y="3.5" width="16" height="7" rx="2" />
			<rect x="4" y="13.5" width="16" height="7" rx="2" />
			<path d="M8 7h.01M8 17h.01" />
		</svg>
	),
	eye: (c: string) => (
		<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke={c} strokeWidth={1.8}>
			<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
			<circle cx="12" cy="12" r="3" />
		</svg>
	),
	eyeOff: (c: string) => (
		<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round">
			<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
			<circle cx="12" cy="12" r="3" />
			<path d="M3 3l18 18" />
		</svg>
	),
	lock: (c: string) => (
		<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round">
			<rect x="5" y="10.5" width="14" height="10" rx="2.5" />
			<path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
		</svg>
	),
};

const Node: React.FC<{icon: React.ReactNode; label: string; at: number; size?: number; ring?: string}> = ({icon, label, at: a, size = 190, ring}) => {
	const f = useCurrentFrame();
	const p = prog(f, a, 22);
	return (
		<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, opacity: p, translate: `0 ${(1 - p) * 40}px`, filter: p < 0.99 ? `blur(${(1 - p) * 10}px)` : undefined}}>
			<div
				style={{
					width: size,
					height: size,
					borderRadius: size * 0.28,
					background: '#fff',
					boxShadow: `0 24px 50px rgba(20,40,90,0.10)${ring ? `, 0 0 0 4px ${ring}` : ''}`,
					padding: size * 0.22,
					boxSizing: 'border-box',
				}}
			>
				{icon}
			</div>
			<div style={{fontFamily: IT, fontSize: 36, fontWeight: 600, color: SUB}}>{label}</div>
		</div>
	);
};

/** horizontal connector that draws itself */
const Wire: React.FC<{at: number; w: number; color?: string; dashed?: boolean}> = ({at: a, w, color = '#c7c7cc', dashed}) => {
	const f = useCurrentFrame();
	const p = prog(f, a, 18, INOUT);
	return (
		<div style={{width: w, height: 8, marginBottom: 58, position: 'relative'}}>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					width: `${p * 100}%`,
					borderRadius: 4,
					background: dashed ? `repeating-linear-gradient(90deg, ${color} 0 14px, transparent 14px 24px)` : color,
					backgroundPosition: `${-f * 2}px 0`,
				}}
			/>
		</div>
	);
};

/** big info row: icon badge + text; can be struck out */
const Row: React.FC<{at: number; icon: React.ReactNode; text: string; tone?: string; strikeAt?: number}> = ({at: a, icon, text, tone = ACCENT, strikeAt}) => {
	const f = useCurrentFrame();
	const s = strikeAt === undefined ? 0 : prog(f, strikeAt, 16, INOUT);
	return (
		<Rise at={a} dist={50} dur={20}>
			<Card style={{width: 968, padding: '40px 46px', display: 'flex', alignItems: 'center', gap: 36, boxSizing: 'border-box'}}>
				<div style={{width: 96, height: 96, flexShrink: 0, borderRadius: 28, background: s > 0.5 ? '#f2f2f7' : `${tone}14`, padding: 20, boxSizing: 'border-box'}}>{icon}</div>
				<div style={{position: 'relative', fontFamily: IT, fontSize: 58, fontWeight: 600, color: s > 0.5 ? '#aeaeb2' : INK, letterSpacing: -1.5, lineHeight: 1.08}}>
					{text}
					{s > 0 ? <div style={{position: 'absolute', left: 0, top: '52%', height: 6, borderRadius: 3, width: `${s * 100}%`, background: RED}} /> : null}
				</div>
			</Card>
		</Rise>
	);
};

/* 1 — «Что на самом деле видит твой интернет-провайдер, когда ты включаешь VPN?» */
const S1: React.FC = () => (
	<Drift dur={DUR[0] + TR}>
		<AppleBg />
		<Mark />
		<Page gap={10}>
			<Lines at={at(0, 0)} size={120} weight={700} lines={['Что на самом деле']} color={GRAY} />
			<Lines at={at(0, 0.95)} size={150} weight={700} lines={['видит твой']} />
			<Lines at={at(0, 1.5)} size={150} weight={700} lines={['провайдер,']} />
			<div style={{height: 30}} />
			<Lines at={at(0, 2.5)} size={120} weight={700} lines={['когда включаешь']} color={GRAY} />
			<Lines at={at(0, 3.45)} size={260} weight={700} lines={['VPN?']} color={ACCENT} />
		</Page>
	</Drift>
);

/* 2 — «Без VPN провайдер видит твой IP-адрес, к каким сервисам ты подключаешься и когда это происходит» */
const S2: React.FC = () => (
	<Drift dur={DUR[1] + TR}>
		<AppleBg glow="255,59,48" />
		<Mark />
		<Page justify="space-between">
			<div style={{textAlign: 'center'}}>
				<Lines at={at(1, 4.2)} size={96} weight={700} lines={['Без VPN']} color={RED} />
				<Lines at={at(1, 5.1)} size={96} weight={700} lines={['провайдер видит']} />
			</div>
			<div style={{display: 'flex', alignItems: 'center'}}>
				<Node at={at(1, 4.3)} icon={I.phone(INK)} label="Ты" />
				<Wire at={at(1, 4.9)} w={150} color={RED} />
				<Node at={at(1, 5.1)} icon={I.isp(RED)} label="Провайдер" ring={RED} />
				<Wire at={at(1, 5.6)} w={150} color={RED} />
				<Node at={at(1, 7.3)} icon={I.globe(INK)} label="Сервисы" />
			</div>
			<div style={{display: 'flex', flexDirection: 'column', gap: 26}}>
				<Row at={at(1, 6.05)} icon={I.eye(RED)} tone={RED} text="Твой IP-адрес" />
				<Row at={at(1, 7.3)} icon={I.eye(RED)} tone={RED} text="Куда подключаешься" />
				<Row at={at(1, 9.15)} icon={I.eye(RED)} tone={RED} text="Когда это происходит" />
			</div>
		</Page>
		<Tick at={at(1, 6.05)} />
		<Tick at={at(1, 7.3)} />
		<Tick at={at(1, 9.15)} />
	</Drift>
);

/* 3 — «Но стоит включить VPN — всё меняется» */
const S3: React.FC = () => {
	const f = useCurrentFrame();
	const on = prog(f, at(2, 11.85), 14, INOUT);
	return (
		<Drift dur={DUR[2] + TR}>
			<AppleBg />
			<Mark />
			<Page gap={70}>
				<Lines at={at(2, 10.85)} size={130} weight={700} lines={['Но стоит', 'включить VPN']} colors={[GRAY, INK]} stagger={at(2, 11.45) - at(2, 10.85)} />
				<Rise at={at(2, 11.2)} dist={40}>
					<div style={{width: 560, height: 300, borderRadius: 150, background: on > 0.5 ? ACCENT : '#e5e5ea', padding: 24, boxSizing: 'border-box', boxShadow: `0 30px 80px rgba(0,113,227,${on * 0.35})`}}>
						<div style={{width: 252, height: 252, borderRadius: 126, background: '#fff', translate: `${on * 260}px 0`, boxShadow: '0 10px 30px rgba(0,0,0,0.18)', padding: 56, boxSizing: 'border-box'}}>
							<Img src={LOGO} style={{width: '100%', opacity: on}} />
						</div>
					</div>
				</Rise>
				<Lines at={at(2, 12.45)} size={130} weight={700} lines={['всё меняется']} color={ACCENT} />
			</Page>
			<Tick at={at(2, 11.85)} vol={0.24} />
		</Drift>
	);
};

/* 4 — «Теперь между тобой и VPN-сервером создаётся зашифрованный туннель» */
const S4: React.FC = () => {
	const f = useCurrentFrame();
	const tun = prog(f, at(3, 15.5), 30, INOUT);
	const lockP = prog(f, at(3, 16.75), 18);
	const pkts = Array.from({length: 7});
	return (
		<Drift dur={DUR[3] + TR}>
			<AppleBg />
			<Mark />
			<Page justify="space-between">
				<div style={{textAlign: 'center'}}>
					<Lines at={at(3, 13.45)} size={84} weight={700} lines={['Между тобой', 'и VPN-сервером —']} color={GRAY} stagger={at(3, 14.6) - at(3, 13.45)} />
					<Lines at={at(3, 16.0)} size={124} weight={700} lines={['зашифрованный']} />
					<Lines at={at(3, 16.7)} size={124} weight={700} lines={['туннель']} color={ACCENT} />
				</div>
				<div style={{position: 'relative', width: 968, height: 420, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
					<Node at={at(3, 13.9)} icon={I.phone(INK)} label="Ты" size={200} />
					<div style={{position: 'absolute', left: 190, right: 190, top: 104, height: 120, borderRadius: 60, overflow: 'hidden', background: 'rgba(0,113,227,0.08)', clipPath: `inset(0 ${(1 - tun) * 100}% 0 0 round 60px)`, boxShadow: 'inset 0 0 0 4px rgba(0,113,227,0.35)'}}>
						{pkts.map((_, i) => {
							const x = ((f * 7 + i * 90) % 700) - 60;
							return <div key={i} style={{position: 'absolute', top: 44, left: x, width: 46, height: 32, borderRadius: 10, background: `linear-gradient(90deg,${ACCENT},#5ac8fa)`, opacity: 0.9}} />;
						})}
					</div>
					<div style={{position: 'absolute', left: '50%', top: 104 + 60, width: 130, height: 130, marginLeft: -65, marginTop: -65, borderRadius: 40, background: ACCENT, padding: 28, boxSizing: 'border-box', opacity: lockP, scale: String(interpolate(lockP, [0, 0.6, 1], [0.4, 1.12, 1])), boxShadow: '0 20px 40px rgba(0,113,227,0.4)'}}>
						{I.lock('#fff')}
					</div>
					<Node at={at(3, 14.65)} icon={I.server(ACCENT)} label="VPN-сервер" size={200} ring={ACCENT} />
				</div>
				<Rise at={at(3, 16.75)} dist={30}>
					<div style={{fontFamily: IT, fontSize: 44, fontWeight: 500, color: SUB, textAlign: 'center'}}>весь трафик идёт внутри, в зашифрованном виде</div>
				</Rise>
			</Page>
			<Tick at={at(3, 16.75)} vol={0.22} />
		</Drift>
	);
};

/* 5 — «Провайдер всё ещё видит сам факт подключения к VPN, время соединения и объём переданных данных» */
const S5: React.FC = () => (
	<Drift dur={DUR[4] + TR}>
		<AppleBg />
		<Mark />
		<Page gap={70}>
			<div style={{display: 'flex', alignItems: 'center', gap: 40}}>
				<Node at={at(4, 17.2)} icon={I.isp(INK)} label="" size={170} />
				<div>
					<Lines at={at(4, 17.25)} size={96} weight={700} lines={['Провайдер']} align="left" />
					<Lines at={at(4, 17.85)} size={96} weight={700} lines={['всё ещё видит']} align="left" color={GRAY} />
				</div>
			</div>
			<div style={{display: 'flex', flexDirection: 'column', gap: 26}}>
				<Row at={at(4, 18.5)} icon={I.eye(INK)} tone={INK} text="Факт подключения к VPN" />
				<Row at={at(4, 20.2)} icon={I.eye(INK)} tone={INK} text="Время соединения" />
				<Row at={at(4, 21.3)} icon={I.eye(INK)} tone={INK} text="Объём данных" />
			</div>
			<Rise at={at(4, 21.9)} dist={20}>
				<div style={{fontFamily: IT, fontSize: 42, fontWeight: 500, color: SUB}}>это нормально — так работает любой VPN</div>
			</Rise>
		</Page>
		<Tick at={at(4, 18.5)} />
		<Tick at={at(4, 20.2)} />
		<Tick at={at(4, 21.3)} />
	</Drift>
);

/* 6 — «Но содержимое трафика внутри туннеля он уже не видит. И сайты, которые ты посещаешь, ему тоже не видны» */
const S6: React.FC = () => (
	<Drift dur={DUR[5] + TR}>
		<AppleBg />
		<Mark />
		<Page gap={70}>
			<div style={{display: 'flex', alignItems: 'center', gap: 40}}>
				<Node at={at(5, 22.8)} icon={I.eyeOff(ACCENT)} label="" size={170} ring={ACCENT} />
				<div>
					<Lines at={at(5, 22.8)} size={96} weight={700} lines={['Но уже']} align="left" color={GRAY} />
					<Lines at={at(5, 25.4)} size={96} weight={700} lines={['не видит']} align="left" color={ACCENT} />
				</div>
			</div>
			<div style={{display: 'flex', flexDirection: 'column', gap: 26}}>
				<Row at={at(5, 23.0)} icon={I.lock(ACCENT)} text="Содержимое трафика" strikeAt={at(5, 25.8)} />
				<Row at={at(5, 26.65)} icon={I.globe(ACCENT)} text="Сайты, которые ты открываешь" strikeAt={at(5, 29.55)} />
			</div>
			<Rise at={at(5, 25.9)} dist={30}>
				<Card style={{width: 968, padding: '36px 46px', background: ACCENT, boxSizing: 'border-box'}}>
					<div style={{fontFamily: IT, fontSize: 52, fontWeight: 600, color: '#fff', textAlign: 'center', letterSpacing: -1}}>для провайдера — просто шифр</div>
				</Card>
			</Rise>
		</Page>
		<Tick at={at(5, 25.8)} />
		<Tick at={at(5, 29.55)} />
	</Drift>
);

/* 7 — «…если VPN настроен правильно и нет утечек» */
const S7: React.FC = () => {
	const f = useCurrentFrame();
	const items: [string, number][] = [
		['VPN настроен правильно', at(6, 30.7)],
		['Нет утечек', at(6, 32.2)],
	];
	return (
		<Drift dur={DUR[6] + TR}>
			<AppleBg glow="52,199,89" />
			<Mark />
			<Page gap={40}>
				<Lines at={at(6, 30.25)} size={200} weight={700} lines={['Если']} color={GRAY} />
				{items.map(([t, a]) => {
					const c = prog(f, a + 6, 14);
					return (
						<Rise key={t} at={a} dist={50} dur={20}>
							<Card style={{width: 968, padding: '44px 46px', display: 'flex', alignItems: 'center', gap: 36, boxSizing: 'border-box'}}>
								<div style={{width: 100, height: 100, borderRadius: 50, background: GREEN, color: '#fff', fontFamily: IT, fontSize: 60, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', scale: String(interpolate(c, [0, 0.6, 1], [0.3, 1.15, 1])), opacity: c}}>✓</div>
								<div style={{fontFamily: IT, fontSize: 62, fontWeight: 600, color: INK, letterSpacing: -1.5}}>{t}</div>
							</Card>
						</Rise>
					);
				})}
			</Page>
			{items.map(([t, a]) => (
				<Tick key={t} at={a + 6} />
			))}
		</Drift>
	);
};

/* 8 — «Хочешь — в следующем ролике покажу, как проверить свой VPN на утечки за 30 секунд. Подписывайся» */
const S8: React.FC = () => {
	const f = useCurrentFrame();
	const tapAt = at(7, 38.25);
	const tap = interpolate(f - tapAt, [0, 5, 14], [1, 0.93, 1], clamp);
	const rp = prog(f, tapAt + 2, 26);
	const sec = Math.round(interpolate(f, [at(7, 37.3), at(7, 37.9)], [0, 30], {...clamp, easing: INOUT}));
	return (
		<Drift dur={DUR[7]}>
			<AppleBg />
			<Page justify="space-between">
				<div style={{display: 'flex', alignItems: 'center', gap: 34}}>
					<AppIcon size={130} at={0} float={false} />
					<Rise at={at(7, 33.6)} dist={20}>
						<div style={{fontFamily: IT, fontSize: 44, fontWeight: 600, color: ACCENT}}>В следующем ролике</div>
					</Rise>
				</div>
				<div style={{textAlign: 'center'}}>
					<Lines at={at(7, 34.9)} size={124} weight={700} lines={['Как проверить']} />
					<Lines at={at(7, 35.6)} size={124} weight={700} lines={['свой VPN']} />
					<Lines at={at(7, 36.1)} size={124} weight={700} lines={['на утечки']} color={ACCENT} />
				</div>
				<Rise at={at(7, 36.7)} dist={40}>
					<Card style={{width: 968, padding: '34px 46px', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 24, boxSizing: 'border-box'}}>
						<span style={{fontFamily: IT, fontSize: 44, fontWeight: 500, color: SUB}}>буквально за</span>
						<span style={{fontFamily: IT, fontSize: 150, fontWeight: 700, color: INK, letterSpacing: -6, lineHeight: 1, fontVariantNumeric: 'tabular-nums'}}>{sec}</span>
						<span style={{fontFamily: IT, fontSize: 44, fontWeight: 500, color: SUB}}>секунд</span>
					</Card>
				</Rise>
				<Rise at={at(7, 38.0)} dist={40}>
					<div style={{position: 'relative', scale: String(tap)}}>
						{rp > 0 && rp < 1 ? <div style={{position: 'absolute', inset: -10, borderRadius: 90, border: `3px solid ${ACCENT}`, opacity: 1 - rp, scale: String(1 + rp * 0.2)}} /> : null}
						<BlackPill style={{fontSize: 64, fontWeight: 600, padding: '40px 110px', borderRadius: 90}}>Подписывайся</BlackPill>
					</div>
				</Rise>
			</Page>
			<Tick at={tapAt} vol={0.22} />
		</Drift>
	);
};

const SCENES = [S1, S2, S3, S4, S5, S6, S7, S8];

export const Isp: React.FC = () => (
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
		<Audio src={staticFile('v5/voice.mp3')} />
	</AbsoluteFill>
);
