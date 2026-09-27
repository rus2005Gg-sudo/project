import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {ACCENT, AppIcon, AppleBg, Card, Drift, Eyebrow, GRAY, HAIR, INK, INOUT, IT, LOGO, Lines, Lockup, OUT, Rise, SUB, blurZoom, clamp, prog} from './kit';

export const TEAM_FPS = 30;
const TR = 18;

const Strike: React.FC<{text: string; at: number}> = ({text, at}) => {
	const f = useCurrentFrame();
	const p = prog(f, at, 18, INOUT);
	return (
		<div style={{position: 'relative', display: 'inline-block', fontFamily: IT, fontSize: 96, fontWeight: 600, letterSpacing: -3, color: p > 0.5 ? GRAY : INK}}>
			{text}
			<div style={{position: 'absolute', left: -8, top: '54%', height: 6, width: `calc(${p * 100}% + 16px)`, background: INK, borderRadius: 3}} />
		</div>
	);
};

const S1: React.FC<{dur: number}> = ({dur}) => (
	<AbsoluteFill>
		<AppleBg />
		<Drift dur={dur}>
			<Lockup at={2} />
			<div style={{position: 'absolute', top: 440, width: '100%', display: 'flex', justifyContent: 'center'}}>
				<AppIcon size={320} at={0} />
			</div>
			<div style={{position: 'absolute', top: 900, width: '100%'}}>
				<Eyebrow at={10}>Horz VPN растёт</Eyebrow>
				<Lines at={48} size={110} lines={['Ищем человека', 'в команду.']} colors={[INK, GRAY]} stagger={6} style={{marginTop: 24}} />
			</div>
		</Drift>
	</AbsoluteFill>
);

const S2: React.FC<{dur: number}> = ({dur}) => {
	const f = useCurrentFrame();
	const team = prog(f, 58, 28);
	return (
		<AbsoluteFill>
			<AppleBg />
			<Drift dur={dur} amount={0.02}>
				<div style={{position: 'absolute', top: 470, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20}}>
					<Rise at={0}>
						<Strike text="Не блогер." at={22} />
					</Rise>
					<Rise at={10}>
						<Strike text="Не продавец." at={42} />
					</Rise>
				</div>
				<div style={{position: 'absolute', top: 900, width: '100%', textAlign: 'center', fontFamily: IT, opacity: team, translate: `0 ${(1 - team) * 40}px`, filter: team < 0.99 ? `blur(${(1 - team) * 12}px)` : undefined}}>
					<div style={{fontSize: 40, fontWeight: 500, color: SUB}}>А тот, кто внутри проекта</div>
					<div style={{fontSize: 130, fontWeight: 600, letterSpacing: -5, color: ACCENT, marginTop: 10}}>Часть команды.</div>
				</div>
			</Drift>
		</AbsoluteFill>
	);
};

const Ico: React.FC<{k: string; size?: number; color?: string}> = ({k, size = 64, color = INK}) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
		{k === 'help' && (
			<>
				<circle cx="12" cy="8" r="4" />
				<path d="M4 21 C4 16.5 7.6 14 12 14 C16.4 14 20 16.5 20 21" />
			</>
		)}
		{k === 'chat' && <path d="M4 5 H20 V16 H10 L5 20 V16 H4 Z" />}
		{k === 'spark' && <path d="M12 3 L13.8 9.2 L20 11 L13.8 12.8 L12 19 L10.2 12.8 L4 11 L10.2 9.2 Z" />}
		{k === 'globe' && (
			<>
				<circle cx="12" cy="12" r="9" />
				<ellipse cx="12" cy="12" rx="4" ry="9" />
				<path d="M3 12 H21" />
			</>
		)}
		{k === 'clock' && (
			<>
				<circle cx="12" cy="12" r="9" />
				<path d="M12 7 V12 L15.5 14" />
			</>
		)}
		{k === 'home' && <path d="M4 11 L12 4 L20 11 V20 H14 V14 H10 V20 H4 Z" />}
		{k === 'heart' && <path d="M12 20 C5 15 3 11.5 3 8.5 A4.5 4.5 0 0 1 12 6.5 A4.5 4.5 0 0 1 21 8.5 C21 11.5 19 15 12 20Z" />}
		{k === 'share' && (
			<>
				<path d="M14 5 L20 11 L14 17" />
				<path d="M20 11 H11 C7 11 4 13.5 4 19" />
			</>
		)}
		{k === 'comment' && <path d="M4 5 H20 V16 H10 L5 20 V16 H4 Z" />}
	</svg>
);

const RowCard: React.FC<{icon: string; title: string; at: number; last?: boolean}> = ({icon, title, at, last}) => {
	const f = useCurrentFrame();
	const p = prog(f, at, 24);
	return (
		<div style={{display: 'flex', alignItems: 'center', gap: 34, padding: '38px 0', borderBottom: last ? 'none' : `1px solid ${HAIR}`, opacity: 0.2 + 0.8 * p, translate: `${(1 - p) * 40}px 0`}}>
			<div style={{width: 110, height: 110, borderRadius: 30, background: '#f2f3f7', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
				<Ico k={icon} color={p > 0.5 ? ACCENT : GRAY} />
			</div>
			<div style={{fontFamily: IT, fontSize: 50, fontWeight: 600, color: INK, letterSpacing: -1.2, lineHeight: 1.1}}>{title}</div>
		</div>
	);
};

const S3: React.FC<{dur: number}> = ({dur}) => (
	<AbsoluteFill>
		<AppleBg />
		<Drift dur={dur} amount={0.02}>
			<div style={{position: 'absolute', top: 320, width: '100%'}}>
				<Lines at={0} size={100} lines={['Что делать.']} />
			</div>
			<div style={{position: 'absolute', top: 580, left: 110, right: 110}}>
				<Card style={{padding: '10px 50px'}}>
					<RowCard icon="help" title="Помогать пользователям" at={4} />
					<RowCard icon="chat" title="Отвечать на вопросы" at={45} />
					<RowCard icon="spark" title="Делать сервис лучше" at={80} last />
				</Card>
			</div>
		</Drift>
	</AbsoluteFill>
);

const S4: React.FC<{dur: number}> = ({dur}) => (
	<AbsoluteFill>
		<AppleBg />
		<Drift dur={dur}>
			<div style={{position: 'absolute', top: 560, width: '100%'}}>
				<Lines at={0} size={120} lines={['Опыт', 'не важен.']} colors={[INK, GRAY]} stagger={6} />
			</div>
			<div style={{position: 'absolute', top: 1010, width: '100%', textAlign: 'center', fontFamily: IT}}>
				<Rise at={40}>
					<div style={{fontSize: 44, fontWeight: 500, color: SUB}}>Важно желание</div>
					<div style={{fontSize: 72, fontWeight: 600, color: ACCENT, letterSpacing: -2, marginTop: 8}}>помогать и расти с нами.</div>
				</Rise>
			</div>
		</Drift>
	</AbsoluteFill>
);

const S5: React.FC<{dur: number}> = ({dur}) => {
	const f = useCurrentFrame();
	const g = prog(f, 58, 70, INOUT);
	const pts = [...Array(9)].map((_, i) => {
		const x = (i / 8) * 780;
		const y = 360 - Math.pow(i / 8, 1.8) * 300 - (i % 2 ? 12 : 0);
		return [x, y];
	});
	const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
	return (
		<AbsoluteFill>
			<AppleBg />
			<Drift dur={dur} amount={0.02}>
				<div style={{position: 'absolute', top: 300, width: '100%'}}>
					<Eyebrow at={0}>За это</Eyebrow>
					<Lines at={6} size={110} lines={['Доля с подписок.']} style={{marginTop: 20}} />
				</div>
				<div style={{position: 'absolute', top: 640, left: 150}}>
					<svg width="780" height="420" viewBox="0 0 780 420" style={{overflow: 'visible'}}>
						<defs>
							<linearGradient id="tgArea" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0" stopColor="#0071e3" stopOpacity="0.22" />
								<stop offset="1" stopColor="#0071e3" stopOpacity="0" />
							</linearGradient>
							<clipPath id="tgClip">
								<rect x="0" y="-40" width={780 * g} height="500" />
							</clipPath>
						</defs>
						<line x1="0" y1="400" x2="780" y2="400" stroke={HAIR} strokeWidth="2" />
						<g clipPath="url(#tgClip)">
							<path d={`${d} L780 400 L0 400 Z`} fill="url(#tgArea)" />
							<path d={d} stroke={ACCENT} strokeWidth="7" fill="none" strokeLinejoin="round" strokeLinecap="round" />
						</g>
						<circle cx={780 * g} cy={pts[Math.min(8, Math.round(g * 8))][1]} r="14" fill={ACCENT} opacity={g > 0.02 ? 1 : 0} />
					</svg>
				</div>
				<div style={{position: 'absolute', top: 1170, width: '100%', textAlign: 'center', fontFamily: IT}}>
					<Rise at={70}>
						<div style={{fontSize: 48, fontWeight: 600, color: INK, letterSpacing: -1}}>Растёт Horz — растёт твой доход.</div>
					</Rise>
				</div>
			</Drift>
		</AbsoluteFill>
	);
};

const S6: React.FC<{dur: number}> = ({dur}) => (
	<AbsoluteFill>
		<AppleBg />
		<Drift dur={dur} amount={0.02}>
			<div style={{position: 'absolute', top: 360, width: '100%'}}>
				<Lines at={0} size={104} lines={['Удалённо.']} />
			</div>
			<div style={{position: 'absolute', top: 620, left: 110, right: 110}}>
				<Card style={{padding: '10px 50px'}}>
					<RowCard icon="home" title="Из дома" at={3} />
					<RowCard icon="globe" title="Из любой точки" at={36} />
					<RowCard icon="clock" title="В удобном темпе" at={73} last />
				</Card>
			</div>
		</Drift>
	</AbsoluteFill>
);

const Action: React.FC<{icon: string; label: string; at: number; fill?: boolean}> = ({icon, label, at, fill}) => {
	const f = useCurrentFrame();
	const p = prog(f, at, 22);
	const pop = interpolate(f - at, [0, 6, 14], [0.8, 1.12, 1], {...clamp, easing: OUT});
	const on = f >= at;
	return (
		<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, opacity: 0.25 + 0.75 * p}}>
			<div style={{width: 190, height: 190, borderRadius: 95, background: on ? INK : '#e9eaee', display: 'flex', alignItems: 'center', justifyContent: 'center', scale: String(on ? pop : 1)}}>
				<svg width="92" height="92" viewBox="0 0 24 24" fill={fill && on ? '#ff375f' : 'none'} stroke={on ? (fill ? '#ff375f' : '#fff') : GRAY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
					{icon === 'heart' && <path d="M12 20 C5 15 3 11.5 3 8.5 A4.5 4.5 0 0 1 12 6.5 A4.5 4.5 0 0 1 21 8.5 C21 11.5 19 15 12 20Z" />}
					{icon === 'share' && (
						<>
							<path d="M14 5 L20 11 L14 17" />
							<path d="M20 11 H11 C7 11 4 13.5 4 19" />
						</>
					)}
					{icon === 'comment' && <path d="M4 5 H20 V16 H10 L5 20 V16 H4 Z" />}
				</svg>
			</div>
			<div style={{fontFamily: IT, fontSize: 36, fontWeight: 500, color: on ? INK : GRAY}}>{label}</div>
		</div>
	);
};

const S7: React.FC<{dur: number}> = ({dur}) => (
	<AbsoluteFill>
		<AppleBg />
		<Drift dur={dur} amount={0.02}>
			<div style={{position: 'absolute', top: 430, width: '100%'}}>
				<Lines at={0} size={116} lines={['Хочешь', 'в команду?']} colors={[INK, ACCENT]} stagger={6} />
			</div>
			<div style={{position: 'absolute', top: 900, left: 90, right: 90, display: 'flex', justifyContent: 'space-around'}}>
				<Action icon="heart" label="Лайк" at={37} fill />
				<Action icon="share" label="Поделись" at={66} />
				<Action icon="comment" label="О себе" at={99} />
			</div>
		</Drift>
	</AbsoluteFill>
);

const example = 'Ответственный, люблю разбираться в технике и помогать людям. Хочу расти вместе с Horz.';

const S8: React.FC<{dur: number}> = ({dur}) => {
	const f = useCurrentFrame();
	const n = Math.floor(interpolate(f, [10, 84], [0, example.length], clamp));
	return (
		<AbsoluteFill>
			<AppleBg />
			<Drift dur={dur} amount={0.015}>
				<div style={{position: 'absolute', top: 360, width: '100%'}}>
					<Lines at={0} size={84} lines={['Какой ты.', 'Что умеешь.', 'Почему к нам.']} colors={[INK, GRAY, GRAY]} stagger={8} />
				</div>
				<div style={{position: 'absolute', top: 820, left: 100, right: 100}}>
					<Rise at={4}>
						<Card style={{padding: '40px 44px'}}>
							<div style={{display: 'flex', alignItems: 'center', gap: 20}}>
								<div style={{width: 80, height: 80, borderRadius: 40, background: 'linear-gradient(135deg,#5ac8fa,#0071e3)', color: '#fff', fontFamily: IT, fontSize: 38, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Т</div>
								<div style={{fontFamily: IT, fontSize: 34, fontWeight: 600, color: INK}}>ты</div>
							</div>
							<div style={{fontFamily: IT, fontSize: 46, fontWeight: 500, color: INK, lineHeight: 1.35, marginTop: 22, minHeight: 190}}>
								{example.slice(0, n)}
								{n < example.length && f % 16 < 9 ? <span style={{color: ACCENT}}>|</span> : null}
							</div>
						</Card>
					</Rise>
				</div>
			</Drift>
		</AbsoluteFill>
	);
};

const S9: React.FC<{dur: number}> = ({dur}) => {
	const f = useCurrentFrame();
	const n = prog(f, 26, 28);
	return (
		<AbsoluteFill>
			<AppleBg />
			<Drift dur={dur} amount={0.02}>
				<div style={{position: 'absolute', top: 300, left: 70, right: 70, opacity: n, translate: `0 ${(1 - n) * -120}px`, filter: n < 0.99 ? `blur(${(1 - n) * 10}px)` : undefined}}>
					<div style={{background: 'rgba(255,255,255,0.85)', borderRadius: 44, padding: '30px 36px', display: 'flex', alignItems: 'center', gap: 26, boxShadow: '0 30px 80px rgba(20,40,90,0.14)'}}>
						<div style={{width: 110, height: 110, borderRadius: 28, background: '#fff', boxShadow: '0 6px 18px rgba(20,40,90,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
							<Img src={LOGO} style={{width: 70}} />
						</div>
						<div style={{fontFamily: IT, flex: 1}}>
							<div style={{display: 'flex', justifyContent: 'space-between', fontSize: 30, color: SUB}}>
								<span style={{fontWeight: 600, color: INK}}>Horz VPN</span>
								<span>сейчас</span>
							</div>
							<div style={{fontSize: 40, fontWeight: 500, color: INK, marginTop: 6}}>Привет! Ты нам подходишь.</div>
						</div>
					</div>
				</div>
				<div style={{position: 'absolute', top: 780, width: '100%'}}>
					<Lines at={4} size={104} lines={['Самым интересным', 'напишем сами.']} colors={[INK, GRAY]} stagger={8} />
				</div>
				<div style={{position: 'absolute', top: 1160, width: '100%', display: 'flex', justifyContent: 'center'}}>
					<AppIcon size={200} at={40} />
				</div>
			</Drift>
		</AbsoluteFill>
	);
};

const SCENES: {C: React.FC<{dur: number}>; d: number}[] = [
	{C: S1, d: 108},
	{C: S2, d: 133},
	{C: S3, d: 150},
	{C: S4, d: 122},
	{C: S5, d: 156},
	{C: S6, d: 112},
	{C: S7, d: 149},
	{C: S8, d: 91},
	{C: S9, d: 116},
];

export const TEAM_FRAMES = SCENES.reduce((a, s) => a + s.d, 0);

export const Team: React.FC = () => (
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
		<Audio src={staticFile('team/voice.mp3')} />
	</AbsoluteFill>
);
