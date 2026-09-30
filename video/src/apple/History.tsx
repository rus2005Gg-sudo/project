import React from 'react';
import '@fontsource/jetbrains-mono/500.css';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {Img} from 'remotion';
import {LOGO, ACCENT, AppIcon, AppleBg, BlackPill, Card, Drift as KitDrift, Eyebrow, GRAY, HAIR, INK, INOUT, IT, Lines, Lockup, Rise, SUB, blurZoom, clamp, prog} from './kit';

export const HI_FPS = 30;
const VOICE = 60.1;
const TR = 14;
// scene starts (s), slightly ahead of the first word of each phrase (word times from ASR)
const STARTS = [0, 5.2, 11.05, 12.55, 20.5, 30.6, 41.8, 47.45, 50.4, 54.85];
const fr = (s: number) => Math.round(s * HI_FPS);
export const HIST_FRAMES = fr(VOICE + 1.4);
const DUR = STARTS.map((s, i) => (i < STARTS.length - 1 ? fr(STARTS[i + 1]) : HIST_FRAMES) - fr(s));
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
		<span style={{display: 'inline-block', opacity: p, scale: String(interpolate(p, [0, 1], [0.9, 1])), filter: p < 0.99 ? `blur(${(1 - p) * 10}px)` : undefined, ...style}}>
			{children}
		</span>
	);
};


const GREEN = '#34c759';
const Page: React.FC<{children: React.ReactNode; gap?: number; justify?: React.CSSProperties['justifyContent']}> = ({children, gap = 0, justify = 'center'}) => (
	<AbsoluteFill style={{padding: '290px 100px 360px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: justify, gap}}>{children}</AbsoluteFill>
);


const RED = '#ff3b30';
// calmer camera: much smaller push-in than the kit default
const Drift: React.FC<{dur: number; children: React.ReactNode; amount?: number}> = ({dur, children}) => <KitDrift dur={dur} amount={0.012}>{children}</KitDrift>;

type Target = {x: number; y: number; w: number; h: number; label: string; at: number; color?: string};
/** photo with a slow camera move; boxes are pinned to image coordinates so they "track" objects as the camera moves */
const Tracked: React.FC<{src: string; iw: number; ih: number; w: number; h: number; at: number; from: [number, number, number]; to: [number, number, number]; dur: number; targets?: Target[]; children?: React.ReactNode}> = ({src, iw, ih, w, h, at: a, from, to, dur, targets = [], children}) => {
	const f = useCurrentFrame();
	const p = prog(f, a, 20);
	const m = interpolate(f - a, [0, dur], [0, 1], {...clamp, easing: INOUT});
	const cx = from[0] + (to[0] - from[0]) * m;
	const cy = from[1] + (to[1] - from[1]) * m;
	const z = from[2] + (to[2] - from[2]) * m;
	const S = Math.max(w / iw, h / ih) * z;
	// keep the image covering the frame while the camera tracks
	const tx = Math.min(0, Math.max(w - iw * S, w / 2 - cx * S));
	const ty = Math.min(0, Math.max(h - ih * S, h / 2 - cy * S));
	return (
		<div style={{position: 'relative', width: w, height: h, borderRadius: 30, overflow: 'hidden', boxShadow: '0 30px 70px rgba(20,40,90,0.18)', opacity: p, translate: `0 ${(1 - p) * 50}px`}}>
			<div style={{position: 'absolute', left: 0, top: 0, width: iw, height: ih, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${S})`}}>
				<Img src={staticFile(src)} style={{width: iw, height: ih, display: 'block'}} />
				{targets.map((t, i) => {
					const q = prog(f, t.at, 12);
					const c = t.color ?? ACCENT;
					const bw = 4 / S;
					const L = 22 / S;
					const corner = (st: React.CSSProperties) => <div style={{position: 'absolute', width: L, height: L, borderColor: c, borderStyle: 'solid', borderWidth: 0, ...st}} />;
					return (
						<div key={i} style={{position: 'absolute', left: t.x, top: t.y, width: t.w, height: t.h, opacity: q, scale: String(interpolate(q, [0, 1], [1.25, 1]))}}>
							<div style={{position: 'absolute', inset: 0, background: `${c}1f`, borderRadius: 6 / S}} />
							{corner({left: 0, top: 0, borderLeftWidth: bw, borderTopWidth: bw})}
							{corner({right: 0, top: 0, borderRightWidth: bw, borderTopWidth: bw})}
							{corner({left: 0, bottom: 0, borderLeftWidth: bw, borderBottomWidth: bw})}
							{corner({right: 0, bottom: 0, borderRightWidth: bw, borderBottomWidth: bw})}
							<div style={{position: 'absolute', left: 0, top: -44 / S, transformOrigin: '0 0', scale: String(1 / S), background: c, color: '#fff', fontFamily: IT, fontSize: 30, fontWeight: 700, padding: '6px 14px', borderRadius: 10, whiteSpace: 'nowrap'}}>{t.label}</div>
						</div>
					);
				})}
			</div>
			{children}
		</div>
	);
};

/** always-on brand mark, fixed (does not move with the camera) */
const Watermark: React.FC = () => (
	<div style={{position: 'absolute', top: 190, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
		<div style={{display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.85)', padding: '12px 24px 12px 16px', borderRadius: 40, boxShadow: '0 8px 24px rgba(20,40,90,0.10)'}}>
			<Img src={LOGO} style={{width: 40}} />
			<span style={{fontFamily: IT, fontSize: 32, fontWeight: 700, color: INK, letterSpacing: -0.5}}>Horz VPN</span>
		</div>
	</div>
);
const W = 880; // usable width inside the TikTok safe zone
const MONO = '"JetBrains Mono", ui-monospace, monospace';

/** photo with slow Ken Burns push + polaroid frame + caption */
const Photo: React.FC<{src: string; at: number; w: number; h: number; caption?: React.ReactNode; tilt?: number; pos?: string}> = ({src, at: a, w, h, caption, tilt = 0, pos = 'center'}) => {
	const f = useCurrentFrame();
	const p = prog(f, a, 22);
	const kb = interpolate(f - a, [0, 240], [1.02, 1.08], clamp);
	return (
		<div style={{opacity: p, translate: `0 ${(1 - p) * 80}px`, rotate: `${tilt * p}deg`, scale: String(interpolate(p, [0, 1], [0.85, 1])), background: '#fff', padding: 16, paddingBottom: caption ? 0 : 16, borderRadius: 24, boxShadow: '0 30px 70px rgba(20,40,90,0.18)'}}>
			<div style={{width: w, height: h, overflow: 'hidden', borderRadius: 14}}>
				<Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos, scale: String(kb)}} />
			</div>
			{caption ? <div style={{fontFamily: IT, fontSize: 38, fontWeight: 700, color: INK, textAlign: 'center', padding: '18px 8px 20px', letterSpacing: -0.5}}>{caption}</div> : null}
		</div>
	);
};

const Year: React.FC<{from: number; to: number; a: number; b: number; size?: number; color?: string}> = ({from, to, a, b, size = 300, color = INK}) => (
	<div style={{fontFamily: IT, fontSize: size, fontWeight: 700, color, letterSpacing: -size * 0.05, lineHeight: 1}}>
		<Roll from={from} to={to} a={a} b={b} />
	</div>
);

/* 1 — hook «Кто придумал VPN? Спорим, ты пользуешься им каждый день — и понятия не имеешь» */
const S1: React.FC = () => {
	const f = useCurrentFrame();
	const q = prog(f, 0, 10);
	return (
		<Drift dur={DUR[0] + TR} amount={0.05}>
			<AppleBg />
			<Page>
				<div style={{fontFamily: IT, fontWeight: 700, letterSpacing: -9, lineHeight: 0.95, textAlign: 'center', scale: String(interpolate(q, [0, 1], [1.3, 1])), opacity: q}}>
					<div style={{fontSize: 170, color: INK}}>Кто</div>
					<div style={{fontSize: 150, color: INK}}>придумал</div>
					<Pop at={at(0, 0.8)} style={{fontSize: 250, color: ACCENT}}>
						VPN?
					</Pop>
				</div>
				<div style={{height: 60}} />
				<Lines at={at(0, 1.6)} size={64} weight={700} lines={['Ты пользуешься им']} color={SUB} />
				<Lines at={at(0, 3.1)} size={64} weight={700} lines={['каждый день']} color={SUB} />
				<Lines at={at(0, 3.85)} size={64} weight={700} lines={['и понятия не имеешь']} color={INK} />
			</Page>
			<Tick at={at(0, 0.8)} vol={0.22} />
		</Drift>
	);
};

/* 2 — ad «Кстати, если нужен быстрый VPN — Horz VPN, ссылка в профиле. Первые 30 дней бесплатно» */
const S2: React.FC = () => (
	<Drift dur={DUR[1] + TR}>
		<AppleBg />
		<Page gap={30}>
			<Eyebrow at={at(1, 5.3)}>Кстати</Eyebrow>
			<AppIcon size={260} at={at(1, 6.7)} />
			<Lines at={at(1, 7.6)} size={150} weight={700} lines={['Horz VPN']} />
			<Rise at={at(1, 8.5)} dist={30}>
				<BlackPill style={{fontSize: 52, fontWeight: 600, padding: '30px 60px'}}>Ссылка в профиле</BlackPill>
			</Rise>
			<Rise at={at(1, 9.55)} dist={40} dur={18}>
				<Card style={{width: W, padding: '30px 40px', boxSizing: 'border-box', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 22}}>
					<span style={{fontFamily: IT, fontSize: 130, fontWeight: 700, color: ACCENT, letterSpacing: -6, lineHeight: 1}}>30</span>
					<span style={{fontFamily: IT, fontSize: 54, fontWeight: 600, color: INK}}>дней бесплатно</span>
				</Card>
			</Rise>
		</Page>
		<Tick at={at(1, 8.5)} />
		<Tick at={at(1, 9.95)} />
	</Drift>
);

/* 3 — «А теперь — история» */
const S3: React.FC = () => (
	<Drift dur={DUR[2] + TR} amount={0.06}>
		<AppleBg />
		<Page>
			<Lines at={at(2, 11.1)} size={110} weight={700} lines={['А теперь —']} color={GRAY} />
			<Lines at={at(2, 11.8)} size={200} weight={700} lines={['история']} />
		</Page>
	</Drift>
);

/* 4 — 1993: open-text internet (live photo, tracked monitor) */
const TERM = ['USER alex', 'PASS qwerty123', 'card=4276 1234 5678', 'MSG "встречаемся в 8"'];
const S4: React.FC = () => {
	const f = useCurrentFrame();
	const eye = prog(f, at(3, 19.0), 16);
	return (
		<Drift dur={DUR[3] + TR}>
			<AppleBg glow="255,59,48" />
			<Page gap={28}>
				<Tracked src="history/pc90_hd.jpg" iw={827} ih={539} w={W} h={600} at={at(3, 12.6)} from={[430, 270, 1]} to={[270, 220, 1.45]} dur={fr(7.5)} targets={[{x: 180, y: 112, w: 150, h: 170, label: 'открытый текст', at: at(3, 17.3), color: RED}]}>
					<div style={{position: 'absolute', left: 34, bottom: 20, fontFamily: IT, fontSize: 170, fontWeight: 700, color: '#fff', letterSpacing: -8, lineHeight: 1, textShadow: '0 6px 30px rgba(0,0,0,0.45)'}}>
						<Roll from={2026} to={1993} a={at(3, 12.6)} b={at(3, 13.8)} />
					</div>
				</Tracked>
				<Rise at={at(3, 16.2)} dist={40}>
					<div style={{position: 'relative', width: W, background: '#0c0f14', borderRadius: 28, padding: '28px 36px', boxSizing: 'border-box'}}>
						{TERM.map((l, i) => {
							const t = at(3, 16.4) + i * 7;
							const n = Math.round(interpolate(f, [t, t + 10], [0, l.length], clamp));
							const hl = i < 3 && f > at(3, 17.9);
							return (
								<div key={i} style={{fontFamily: MONO, fontSize: 40, lineHeight: 1.5, color: hl ? '#ff6b6b' : '#39d98a', background: hl ? 'rgba(255,59,48,0.15)' : 'transparent', borderRadius: 6, whiteSpace: 'pre'}}>
									{l.slice(0, n)}
									{n > 0 && n < l.length ? '▌' : ''}
								</div>
							);
						})}
						<div style={{position: 'absolute', right: -16, top: -30, width: 120, height: 120, borderRadius: 60, background: RED, padding: 28, boxSizing: 'border-box', opacity: eye, scale: String(interpolate(eye, [0, 0.6, 1], [0.5, 1.08, 1])), boxShadow: '0 16px 40px rgba(255,59,48,0.4)'}}>
							<svg viewBox="0 0 24 24" width="100%" fill="none" stroke="#fff" strokeWidth={2}>
								<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
								<circle cx="12" cy="12" r="3" />
							</svg>
						</div>
					</div>
				</Rise>
				<div style={{textAlign: 'center', fontFamily: IT, fontSize: 60, fontWeight: 700, lineHeight: 1.15}}>
					<Pop at={at(3, 17.35)} style={{color: INK}}>
						Всё — открытым текстом.
					</Pop>
					<br />
					<Pop at={at(3, 19.0)} style={{color: RED}}>
						Любой может подсмотреть
					</Pop>
				</div>
			</Page>
			<Tick at={at(3, 13.8)} />
			<Tick at={at(3, 17.35)} />
			<Tick at={at(3, 19.0)} />
		</Drift>
	);
};

/* 5 — swIPe, Columbia + Bell Labs, Ioannidis & Blaze */
const S5: React.FC = () => {
	const f = useCurrentFrame();
	const plain = 'PASS qwerty123';
	const enc = 'x9#Lq@7!vR2%kZ';
	const e = interpolate(f, [at(4, 28.6), at(4, 29.6)], [0, plain.length], clamp);
	const shown = plain
		.split('')
		.map((c, i) => (i < e ? enc[i] : c))
		.join('');
	const locked = e >= plain.length;
	const bl = prog(f, at(4, 22.3), 14);
	return (
		<Drift dur={DUR[4] + TR}>
			<AppleBg />
			<Page gap={24}>
				<Tracked src="history/columbia_hd.jpg" iw={827} ih={518} w={W} h={400} at={at(4, 20.5)} from={[413, 300, 1]} to={[413, 230, 1.5]} dur={fr(3)} targets={[{x: 325, y: 135, w: 175, h: 140, label: 'Колумбийский университет', at: at(4, 20.8)}]}>
					<div style={{position: 'absolute', right: 20, bottom: 20, background: INK, color: '#fff', fontFamily: IT, fontSize: 40, fontWeight: 700, padding: '12px 26px', borderRadius: 40, opacity: bl, scale: String(interpolate(bl, [0, 1], [0.8, 1]))}}>+ Bell Labs</div>
				</Tracked>
				<div style={{display: 'flex', gap: 26, alignItems: 'flex-start'}}>
					<Photo src="history/p1_hd.jpg" at={at(4, 23.7)} w={330} h={360} caption="Джон Иоаннидис" tilt={-2} pos="50% 30%" />
					<Photo src="history/p2_hd.jpg" at={at(4, 24.85)} w={330} h={360} caption="Мэтт Блейз" tilt={2} pos="50% 35%" />
				</div>
				<div style={{display: 'flex', alignItems: 'baseline', gap: 20}}>
					<Pop at={at(4, 26.6)} style={{fontFamily: IT, fontSize: 130, fontWeight: 700, color: ACCENT, letterSpacing: -5, lineHeight: 1}}>
						swIPe
					</Pop>
					<Pop at={at(4, 27.3)} style={{fontFamily: IT, fontSize: 46, fontWeight: 600, color: SUB}}>
						1993
					</Pop>
				</div>
				<Rise at={at(4, 28.1)} dist={30}>
					<div style={{width: W, boxSizing: 'border-box', background: locked ? ACCENT : '#0c0f14', borderRadius: 24, padding: '24px 34px', display: 'flex', alignItems: 'center', gap: 24}}>
						<svg viewBox="0 0 24 24" width={52} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
							<rect x="5" y="10.5" width="14" height="10" rx="2.5" />
							<path d={locked ? 'M8 10.5V7.5a4 4 0 0 1 8 0v3' : 'M8 10.5V7.5a4 4 0 0 1 7.5-2'} />
						</svg>
						<span style={{fontFamily: MONO, fontSize: 48, color: locked ? '#fff' : '#39d98a', whiteSpace: 'pre'}}>{shown}</span>
					</div>
				</Rise>
			</Page>
			<Tick at={at(4, 20.8)} />
			<Tick at={at(4, 23.7)} />
			<Tick at={at(4, 24.85)} />
			<Tick at={at(4, 26.6)} vol={0.22} />
			<Tick at={at(4, 29.6)} />
		</Drift>
	);
};

/* 6 — 1996, Microsoft, Gurdeep Singh Pall, PPTP, «отец VPN» */
const S6: React.FC = () => {
	const f = useCurrentFrame();
	const swap = prog(f, at(5, 32.2), 16);
	return (
		<Drift dur={DUR[5] + TR}>
			<AppleBg />
			<Page gap={30}>
				<div style={{position: 'relative', width: W, height: 600}}>
					<div style={{position: 'absolute', inset: 0, opacity: 1 - swap}}>
						<Tracked src="history/ms90_hd.jpg" iw={827} ih={515} w={W} h={600} at={at(5, 30.6)} from={[420, 260, 1]} to={[640, 190, 1.35]} dur={fr(1.8)} targets={[{x: 528, y: 118, w: 118, h: 118, label: 'Microsoft', at: at(5, 31.8)}]}>
							<div style={{position: 'absolute', left: 30, bottom: 16, fontFamily: IT, fontSize: 160, fontWeight: 700, color: '#fff', letterSpacing: -7, lineHeight: 1, textShadow: '0 6px 30px rgba(0,0,0,0.45)'}}>
								<Roll from={1993} to={1996} a={at(5, 30.7)} b={at(5, 31.5)} />
							</div>
						</Tracked>
					</div>
					<div style={{position: 'absolute', inset: 0, opacity: swap}}>
						<Tracked src="history/p3_hd.jpg" iw={350} ih={229} w={W} h={600} at={at(5, 32.2)} from={[175, 115, 1]} to={[250, 150, 1.25]} dur={fr(6)} targets={[]}>
							<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, padding: '60px 30px 22px', background: 'linear-gradient(transparent, rgba(0,0,0,0.65))', fontFamily: IT, fontSize: 44, fontWeight: 700, color: '#fff'}}>
								Гурдип Сингх Палл <span style={{fontWeight: 500, opacity: 0.8}}>и команда</span>
							</div>
						</Tracked>
					</div>
				</div>
				<div style={{display: 'flex', alignItems: 'center', gap: 26}}>
					<Pop at={at(5, 34.85)} style={{fontFamily: IT, fontSize: 170, fontWeight: 700, color: ACCENT, letterSpacing: -7, lineHeight: 1}}>
						PPTP
					</Pop>
					<div style={{fontFamily: IT, fontSize: 48, fontWeight: 700, color: INK, lineHeight: 1.1}}>
						<Pop at={at(5, 36.4)}>VPN →</Pop>
						<br />
						<Pop at={at(5, 37.7)} style={{color: ACCENT}}>
							для всех
						</Pop>
					</div>
				</div>
				<Rise at={at(5, 39.9)} dist={30}>
					<Card style={{width: W, padding: '26px 40px', boxSizing: 'border-box', background: INK, textAlign: 'center'}}>
						<span style={{fontFamily: IT, fontSize: 60, fontWeight: 700, color: '#fff', letterSpacing: -1}}>«Отец VPN»</span>
					</Card>
				</Rise>
			</Page>
			<Tick at={at(5, 31.5)} />
			<Tick at={at(5, 31.8)} vol={0.1} />
			<Tick at={at(5, 34.85)} vol={0.22} />
			<Tick at={at(5, 40.8)} />
		</Drift>
	);
};

/* 7 — only for companies: home → office */
const Building: React.FC<{kind: 'home' | 'office'; label: string; at: number}> = ({kind, label, at: a}) => (
	<Rise at={a} dist={40}>
		<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12}}>
			<div style={{width: 190, height: 190, borderRadius: 52, background: '#fff', boxShadow: '0 24px 50px rgba(20,40,90,0.12)', padding: 42, boxSizing: 'border-box'}}>
				<svg viewBox="0 0 24 24" width="100%" fill="none" stroke={INK} strokeWidth={1.7} strokeLinejoin="round">
					{kind === 'home' ? <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /> : <path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 9h4a1 1 0 0 1 1 1v11M3 21h18M8 8h3M8 12h3M8 16h3" />}
				</svg>
			</div>
			<div style={{fontFamily: IT, fontSize: 40, fontWeight: 700, color: INK}}>{label}</div>
		</div>
	</Rise>
);
const S7: React.FC = () => {
	const f = useCurrentFrame();
	const t = prog(f, at(6, 45.4), 30, INOUT);
	return (
		<Drift dur={DUR[6] + TR}>
			<AppleBg />
			<Page gap={40}>
				<div style={{textAlign: 'center'}}>
					<Lines at={at(6, 41.9)} size={76} weight={700} lines={['Сначала VPN был']} color={GRAY} />
					<Lines at={at(6, 43.5)} size={88} weight={700} lines={['только для компаний']} />
				</div>
				<Tracked src="history/office90_hd.jpg" iw={827} ih={591} w={W} h={520} at={at(6, 41.9)} from={[413, 300, 1]} to={[430, 330, 1.3]} dur={fr(5.5)} targets={[{x: 420, y: 300, w: 140, h: 125, label: 'рабочая сеть', at: at(6, 43.85)}]} />
				<div style={{position: 'relative', width: W, display: 'flex', justifyContent: 'space-between'}}>
					<Building kind="home" label="Дом" at={at(6, 44.5)} />
					<div style={{position: 'absolute', left: 200, right: 200, top: 75, height: 40, borderRadius: 20, background: 'rgba(0,113,227,0.1)', overflow: 'hidden', clipPath: `inset(0 ${(1 - t) * 100}% 0 0 round 20px)`, boxShadow: 'inset 0 0 0 3px rgba(0,113,227,0.4)'}}>
						{Array.from({length: 5}).map((_, i) => (
							<div key={i} style={{position: 'absolute', top: 10, left: ((f * 6 + i * 100) % 520) - 40, width: 34, height: 20, borderRadius: 6, background: ACCENT}} />
						))}
					</div>
					<Building kind="office" label="Офис" at={at(6, 44.9)} />
				</div>
			</Page>
			<Tick at={at(6, 43.85)} />
			<Tick at={at(6, 45.4)} />
		</Drift>
	);
};

/* 8 — today: 1 billion+ */
const S8: React.FC = () => {
	const f = useCurrentFrame();
	const n = Math.round(interpolate(f, [at(7, 48.8), at(7, 50.1)], [0, 1000], {...clamp, easing: INOUT}));
	return (
		<Drift dur={DUR[7] + TR} amount={0.05}>
			<AppleBg />
			<Page>
				<Lines at={at(7, 47.5)} size={110} weight={700} lines={['Сегодня']} color={GRAY} />
				<div style={{fontFamily: IT, fontSize: 180, fontWeight: 700, color: INK, letterSpacing: -8, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap'}}>
					{n >= 1000 ? '1 млрд+' : `${n} млн`}
				</div>
				<Lines at={at(7, 49.9)} size={90} weight={700} lines={['пользователей']} color={ACCENT} />
			</Page>
			<Tick at={at(7, 50.1)} vol={0.22} />
		</Drift>
	);
};

/* 9 — «30 лет прошло — а идея та же: твои данные должны принадлежать тебе» */
const S9: React.FC = () => (
	<Drift dur={DUR[8] + TR}>
		<AppleBg />
		<Page gap={10}>
			<Lines at={at(8, 50.45)} size={130} weight={700} lines={['30 лет спустя']} color={GRAY} />
			<div style={{height: 40}} />
			<Lines at={at(8, 52.7)} size={120} weight={700} lines={['Твои данные']} />
			<Lines at={at(8, 53.8)} size={120} weight={700} lines={['принадлежат']} />
			<Lines at={at(8, 54.5)} size={160} weight={700} lines={['тебе']} color={ACCENT} />
		</Page>
	</Drift>
);

/* 10 — CTA */
const S10: React.FC = () => {
	const f = useCurrentFrame();
	const linkAt = at(9, 56.1);
	const hl = prog(f, linkAt, 12);
	const tap = interpolate(f - linkAt, [0, 5, 14], [1, 0.94, 1], clamp);
	const k = (W - 32) / 828;
	return (
		<Drift dur={DUR[9]} amount={0.02}>
			<AppleBg />
			<Page gap={34}>
				<div style={{display: 'flex', alignItems: 'center', gap: 28}}>
					<AppIcon size={150} at={0} float={false} />
					<Lines at={at(9, 55.0)} size={110} weight={700} lines={['Horz VPN']} align="left" />
				</div>
				<Rise at={at(9, 55.4)} dist={50}>
					<div style={{position: 'relative', width: W - 32, borderRadius: 30, overflow: 'hidden', boxShadow: '0 30px 80px rgba(20,40,90,0.14)'}}>
						<Img src={staticFile('anon/profile.png')} style={{width: '100%', display: 'block'}} />
						<div style={{position: 'absolute', left: 20 * k, top: 492 * k, width: 280 * k, height: 58 * k, borderRadius: 14, border: `5px solid ${ACCENT}`, background: `rgba(0,113,227,${hl * 0.12})`, opacity: hl, scale: String(tap * interpolate(hl, [0, 1], [1.3, 1]))}} />
					</div>
				</Rise>
				<Rise at={at(9, 56.9)} dist={30}>
					<BlackPill style={{fontSize: 56, fontWeight: 600, padding: '32px 70px'}}>Подписывайся</BlackPill>
				</Rise>
				<Rise at={at(9, 57.7)} dist={20}>
					<div style={{fontFamily: IT, fontSize: 44, fontWeight: 600, color: SUB, textAlign: 'center'}}>
						дальше: как VPN работает <span style={{color: ACCENT}}>изнутри</span>
					</div>
				</Rise>
			</Page>
			<Tick at={linkAt} vol={0.22} />
		</Drift>
	);
};

const SCENES = [S1, S2, S3, S4, S5, S6, S7, S8, S9, S10];

export const History: React.FC = () => (
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
		<Watermark />
		<Audio src={staticFile('history/voice.mp3')} />
	</AbsoluteFill>
);
