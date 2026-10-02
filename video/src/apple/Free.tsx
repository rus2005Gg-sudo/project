import React from 'react';
import '@fontsource/jetbrains-mono/500.css';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {Img} from 'remotion';
import {LOGO, ACCENT, AppIcon, AppleBg, BlackPill, Card, Drift as KitDrift, Eyebrow, GRAY, HAIR, INK, INOUT, IT, Lines, Lockup, Rise, SUB, blurZoom, clamp, prog} from './kit';

export const FR_FPS = 30;
const VOICE = 58.64;
const TR = 14;
// scene starts (s), slightly ahead of the first word of each phrase (word times from ASR)
const STARTS = [0, 2.75, 9.3, 14.8, 27.2, 39.0, 45.85, 49.9, 54.1];
const fr = (s: number) => Math.round(s * FR_FPS);
export const FREE_FRAMES = fr(VOICE + 1.4);
const DUR = STARTS.map((s, i) => (i < STARTS.length - 1 ? fr(STARTS[i + 1]) : FREE_FRAMES) - fr(s));
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

/* ---------- glyphs ---------- */
const G = {
	phone: (c: string) => <svg viewBox="0 0 24 24" width="100%" fill="none" stroke={c} strokeWidth={1.7} strokeLinecap="round"><rect x="6.5" y="2.5" width="11" height="19" rx="2.8" /><path d="M10.5 18.5h3" /></svg>,
	isp: (c: string) => <svg viewBox="0 0 24 24" width="100%" fill="none" stroke={c} strokeWidth={1.7} strokeLinecap="round"><rect x="3" y="13" width="18" height="7" rx="2" /><path d="M7 16.5h.01M11 16.5h.01M8 13V9M16 13V9M5 7a10 10 0 0 1 14 0M8 9.5a6 6 0 0 1 8 0" /></svg>,
	globe: (c: string) => <svg viewBox="0 0 24 24" width="100%" fill="none" stroke={c} strokeWidth={1.7}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18" /></svg>,
	server: (c: string) => <svg viewBox="0 0 24 24" width="100%" fill="none" stroke={c} strokeWidth={1.7} strokeLinecap="round"><rect x="4" y="3.5" width="16" height="7" rx="2" /><rect x="4" y="13.5" width="16" height="7" rx="2" /><path d="M8 7h.01M8 17h.01" /></svg>,
	eye: (c: string) => <svg viewBox="0 0 24 24" width="100%" fill="none" stroke={c} strokeWidth={1.8}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>,
	lock: (c: string) => <svg viewBox="0 0 24 24" width="100%" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></svg>,
	key: (c: string) => <svg viewBox="0 0 24 24" width="100%" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round"><circle cx="7.5" cy="12" r="4" /><path d="M11.5 12H21M17 12v3M20 12v2" /></svg>,
	mail: (c: string) => <svg viewBox="0 0 24 24" width="100%" fill="none" stroke={c} strokeWidth={1.8} strokeLinejoin="round"><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3.5 6.5l8.5 6.5 8.5-6.5" /></svg>,
};

const Step: React.FC<{at: number; n: number}> = ({at: a, n}) => (
	<Pop at={a} style={{fontFamily: IT, fontSize: 46, fontWeight: 700, color: '#fff', background: ACCENT, padding: '10px 30px', borderRadius: 40}}>
		Шаг {n}
	</Pop>
);

const Node: React.FC<{at: number; icon: React.ReactNode; label: string; size?: number; ring?: string}> = ({at: a, icon, label, size = 170, ring}) => (
	<Rise at={a} dist={30}>
		<div style={{display: 'flex', alignItems: 'center', gap: 28}}>
			<div style={{width: size, height: size, borderRadius: size * 0.28, background: '#fff', boxShadow: `0 20px 44px rgba(20,40,90,0.10)${ring ? `, 0 0 0 4px ${ring}` : ''}`, padding: size * 0.22, boxSizing: 'border-box', flexShrink: 0}}>{icon}</div>
			<div style={{fontFamily: IT, fontSize: 52, fontWeight: 700, color: INK}}>{label}</div>
		</div>
	</Rise>
);

/** full-bleed photo card with slow push-in and dark grade for legibility */
const Shot: React.FC<{src: string; at: number; h: number; children?: React.ReactNode; tint?: string}> = ({src, at: a, h, children, tint = 'rgba(0,0,0,0.0)'}) => {
	const f = useCurrentFrame();
	const p = prog(f, a, 20);
	return (
		<div style={{position: 'relative', width: W, height: h, borderRadius: 34, overflow: 'hidden', boxShadow: '0 30px 80px rgba(20,40,90,0.22)', opacity: p, translate: `0 ${(1 - p) * 50}px`}}>
			<Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', scale: String(interpolate(f - a, [0, 300], [1.05, 1.18], clamp))}} />
			<div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${tint}, rgba(0,0,0,0.55))`}} />
			{children}
		</div>
	);
};

const Source: React.FC<{at: number; children: React.ReactNode}> = ({at: a, children}) => (
	<Rise at={a} dist={10}>
		<div style={{fontFamily: IT, fontSize: 30, fontWeight: 500, color: GRAY, textAlign: 'center'}}>{children}</div>
	</Rise>
);

const YearTag: React.FC<{at: number; y: string}> = ({at: a, y}) => (
	<Pop at={a} style={{fontFamily: IT, fontSize: 150, fontWeight: 700, color: INK, letterSpacing: -7, lineHeight: 1}}>
		{y}
	</Pop>
);

/* 1 — hook: «Бесплатный VPN. Звучит отлично, правда?» */
const S1: React.FC = () => (
	<Drift dur={DUR[0] + TR}>
		<AppleBg />
		<Page gap={40}>
			<Shot src="free/phone.jpg" at={0} h={820}>
				<div style={{position: 'absolute', left: 0, right: 0, bottom: 50, textAlign: 'center'}}>
					<Pop at={0} style={{fontFamily: IT, fontSize: 120, fontWeight: 700, color: '#fff', letterSpacing: -5, textShadow: '0 6px 30px rgba(0,0,0,0.5)'}}>
						Бесплатный VPN
					</Pop>
				</div>
			</Shot>
			<Lines at={at(0, 1.25)} size={90} weight={700} lines={['Звучит отлично?']} color={GRAY} />
		</Page>
	</Drift>
);

/* 2 — «серверы, трафик, поддержка стоят денег. Кто платит? Ты. Просто не деньгами» */
const S2: React.FC = () => {
	const costs: [React.ReactNode, string, number][] = [
		[G.server(INK), 'Серверы', at(1, 3.15)],
		[G.globe(INK), 'Трафик', at(1, 3.75)],
		[G.phone(INK), 'Поддержка', at(1, 4.3)],
	];
	return (
		<Drift dur={DUR[1] + TR}>
			<AppleBg />
			<Page gap={26}>
				{costs.map(([ic, t, a]) => (
					<Rise key={t} at={a} dist={40} dur={16}>
						<Card style={{width: W, padding: '26px 40px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 28}}>
							<div style={{width: 80, flexShrink: 0}}>{ic}</div>
							<div style={{flex: 1, fontFamily: IT, fontSize: 56, fontWeight: 700, color: INK}}>{t}</div>
							<Pop at={at(1, 5.35)} style={{fontFamily: IT, fontSize: 56, fontWeight: 700, color: RED}}>
								₽₽₽
							</Pop>
						</Card>
					</Rise>
				))}
				<div style={{height: 20}} />
				<Lines at={at(1, 5.9)} size={96} weight={700} lines={['Кто платит?']} />
				<Pop at={at(1, 7.4)} style={{fontFamily: IT, fontSize: 200, fontWeight: 700, color: RED, letterSpacing: -9, lineHeight: 1}}>
					Ты.
				</Pop>
				<Lines at={at(1, 8.0)} size={64} weight={700} lines={['Просто не деньгами']} color={SUB} />
			</Page>
			{costs.map(([, t, a]) => (
				<Tick key={t} at={a} />
			))}
			<Tick at={at(1, 7.4)} vol={0.24} />
		</Drift>
	);
};

/* 3 — ad */
const S3: React.FC = () => (
	<Drift dur={DUR[2] + TR}>
		<AppleBg />
		<Page gap={30}>
			<Eyebrow at={at(2, 9.35)}>Кстати</Eyebrow>
			<AppIcon size={240} at={at(2, 9.8)} />
			<Lines at={at(2, 9.95)} size={150} weight={700} lines={['Horz VPN']} />
			<Rise at={at(2, 10.8)} dist={30}>
				<BlackPill style={{fontSize: 52, fontWeight: 600, padding: '30px 60px'}}>Ссылка в профиле</BlackPill>
			</Rise>
			<Rise at={at(2, 11.85)} dist={40} dur={18}>
				<Card style={{width: W, padding: '28px 40px', boxSizing: 'border-box', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 22}}>
					<span style={{fontFamily: IT, fontSize: 130, fontWeight: 700, color: ACCENT, letterSpacing: -6, lineHeight: 1}}>30</span>
					<span style={{fontFamily: IT, fontSize: 54, fontWeight: 600, color: INK}}>дней бесплатно</span>
				</Card>
			</Rise>
			<Lines at={at(2, 13.05)} size={60} weight={700} lines={['честно и без подвоха']} color={GREEN} />
		</Page>
		<Tick at={at(2, 10.8)} />
		<Tick at={at(2, 12.2)} />
	</Drift>
);

/* 4 — 2015, Hola sold users' bandwidth */
const S4: React.FC = () => {
	const f = useCurrentFrame();
	const nodes = Array.from({length: 14}).map((_, i) => ({x: 80 + ((i * 197) % 720), y: 70 + ((i * 131) % 380)}));
	const lit = prog(f, at(3, 22.3), 40);
	return (
		<Drift dur={DUR[3] + TR}>
			<AppleBg glow="255,59,48" />
			<Page gap={28}>
				<YearTag at={at(3, 14.9)} y="2015" />
				<Rise at={at(3, 16.4)} dist={40}>
					<Card style={{width: W, padding: '30px 40px', boxSizing: 'border-box'}}>
						<div style={{fontFamily: IT, fontSize: 30, fontWeight: 600, color: GRAY}}>Журналисты выяснили</div>
						<div style={{fontFamily: IT, fontSize: 56, fontWeight: 700, color: INK, lineHeight: 1.15, marginTop: 8}}>
							Бесплатный VPN <span style={{color: RED}}>Hola</span> продавал интернет-канал пользователей
						</div>
					</Card>
				</Rise>
				<Shot src="free/servers.jpg" at={at(3, 21.2)} h={520}>
					<svg width={W} height={520} style={{position: 'absolute', inset: 0}}>
						{nodes.map((n, i) =>
							i > 0 ? <line key={'l' + i} x1={nodes[i - 1].x} y1={nodes[i - 1].y} x2={n.x} y2={n.y} stroke={RED} strokeWidth={3} opacity={lit * 0.7} /> : null,
						)}
						{nodes.map((n, i) => {
							const q = prog(f, at(3, 22.3) + i * 2, 10);
							return <circle key={i} cx={n.x} cy={n.y} r={14} fill={RED} opacity={q} />;
						})}
					</svg>
					<div style={{position: 'absolute', left: 24, top: 24, background: RED, color: '#fff', fontFamily: IT, fontSize: 34, fontWeight: 700, padding: '8px 18px', borderRadius: 12, opacity: prog(f, at(3, 23.6), 12)}}>
						компьютеры пользователей = узлы чужой сети
					</div>
				</Shot>
				<Pop at={at(3, 26.1)} style={{fontFamily: IT, fontSize: 58, fontWeight: 700, color: RED}}>
					…и через неё атаковали сайт
				</Pop>
				<Source at={at(3, 17)}>по данным ZDNet и Lifehacker, май 2015</Source>
			</Page>
			<Tick at={at(3, 14.9)} />
			<Tick at={at(3, 19.7)} />
			<Tick at={at(3, 26.1)} />
		</Drift>
	);
};

/* 5 — 2017 study: 283 apps, ~1/5 no encryption, 38% malware */
const S5: React.FC = () => {
	const f = useCurrentFrame();
	const noEnc = prog(f, at(4, 34.8), 20);
	const mal = prog(f, at(4, 37.5), 20);
	return (
		<Drift dur={DUR[4] + TR}>
			<AppleBg />
			<Page gap={26}>
				<YearTag at={at(4, 27.3)} y="2017" />
				<Lines at={at(4, 29.8)} size={64} weight={700} lines={['Исследователи проверили']} color={SUB} />
				<div style={{fontFamily: IT, fontSize: 220, fontWeight: 700, color: INK, letterSpacing: -10, lineHeight: 1}}>
					<Roll from={0} to={283} a={at(4, 30.2)} b={at(4, 31.6)} />
				</div>
				<Lines at={at(4, 31.8)} size={56} weight={700} lines={['VPN-приложения для Android']} color={SUB} />
				<div style={{height: 10}} />
				{[
					['~1 из 5', 'вообще не шифровали трафик', noEnc, at(4, 33.15), 20],
					['38%', 'с вредоносным кодом', mal, at(4, 36.3), 38],
				].map(([big, t, p, a, pct]) => (
					<Rise key={String(big)} at={a as number} dist={40} dur={16}>
						<Card style={{width: W, padding: '28px 40px', boxSizing: 'border-box'}}>
							<div style={{display: 'flex', alignItems: 'baseline', gap: 22}}>
								<span style={{fontFamily: IT, fontSize: 84, fontWeight: 700, color: RED, letterSpacing: -3, whiteSpace: 'nowrap'}}>{big}</span>
								<span style={{fontFamily: IT, fontSize: 40, fontWeight: 600, color: INK}}>{t}</span>
							</div>
							<div style={{height: 14, borderRadius: 7, background: '#eee', marginTop: 16, overflow: 'hidden'}}>
								<div style={{width: `${(p as number) * (pct as number)}%`, height: '100%', background: RED, borderRadius: 7}} />
							</div>
						</Card>
					</Rise>
				))}
				<Source at={at(4, 31.8)}>CSIRO и Университет Нового Южного Уэльса</Source>
			</Page>
			<Tick at={at(4, 31.6)} />
			<Tick at={at(4, 34.8)} />
			<Tick at={at(4, 37.5)} />
		</Drift>
	);
};

/* 6 — 2020: 7 free VPNs leaked 1+ TB */
const S6: React.FC = () => {
	const f = useCurrentFrame();
	const tb = interpolate(f, [at(5, 43.5), at(5, 44.6)], [0, 1.2], {...clamp, easing: INOUT});
	return (
		<Drift dur={DUR[5] + TR}>
			<AppleBg glow="255,59,48" />
			<Page gap={28}>
				<YearTag at={at(5, 39.1)} y="2020" />
				<Shot src="free/leak.jpg" at={at(5, 39.3)} h={620}>
					<div style={{position: 'absolute', left: 0, right: 0, bottom: 40, textAlign: 'center', fontFamily: IT, color: '#fff', textShadow: '0 6px 30px rgba(0,0,0,0.6)'}}>
						<div style={{fontSize: 180, fontWeight: 700, letterSpacing: -8, lineHeight: 1, fontVariantNumeric: 'tabular-nums'}}>{tb.toFixed(1).replace('.', ',')} ТБ</div>
						<div style={{fontSize: 46, fontWeight: 600, opacity: 0.9}}>данных пользователей в открытом доступе</div>
					</div>
				</Shot>
				<Pop at={at(5, 40.65)} style={{fontFamily: IT, fontSize: 70, fontWeight: 700, color: INK}}>
					<span style={{color: RED}}>7</span> бесплатных VPN
				</Pop>
				<Source at={at(5, 41)}>по данным исследователей безопасности, июль 2020</Source>
			</Page>
			<Tick at={at(5, 40.65)} />
			<Tick at={at(5, 44.6)} vol={0.24} />
		</Drift>
	);
};

/* 7 — rule */
const S7: React.FC = () => (
	<Drift dur={DUR[6] + TR}>
		<AppleBg />
		<Page gap={10}>
			<Lines at={at(6, 45.9)} size={80} weight={700} lines={['Правило простое']} color={GRAY} />
			<div style={{height: 40}} />
			<Lines at={at(6, 47.1)} size={110} weight={700} lines={['Если продукт', 'бесплатный —']} stagger={at(6, 47.9) - at(6, 47.1)} />
			<div style={{height: 20}} />
			<Pop at={at(6, 48.6)} style={{fontFamily: IT, fontSize: 130, fontWeight: 700, color: '#fff', background: RED, padding: '16px 50px', borderRadius: 40, letterSpacing: -4}}>
				товар — это ты
			</Pop>
		</Page>
		<Tick at={at(6, 48.6)} vol={0.24} />
	</Drift>
);

/* 8 — choose a service that earns on subscription */
const S8: React.FC = () => (
	<Drift dur={DUR[7] + TR}>
		<AppleBg />
		<Page gap={30}>
			<AppIcon size={220} at={at(7, 49.95)} />
			<Lines at={at(7, 50.0)} size={90} weight={700} lines={['Выбирай сервис,']} />
			<Lines at={at(7, 51.0)} size={70} weight={700} lines={['который зарабатывает']} color={SUB} />
			<Rise at={at(7, 52.0)} dist={30}>
				<Card style={{width: W, padding: '30px 40px', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-around', fontFamily: IT, fontWeight: 700}}>
					<span style={{fontSize: 56, color: GREEN}}>✓ на подписке</span>
					<span style={{fontSize: 56, color: '#aeaeb2', textDecoration: 'line-through'}}>на данных</span>
				</Card>
			</Rise>
		</Page>
		<Tick at={at(7, 52.1)} />
	</Drift>
);

/* 9 — CTA */
const S9: React.FC = () => {
	const f = useCurrentFrame();
	const tapAt = at(8, 54.6);
	const tap = interpolate(f - tapAt, [0, 5, 14], [1, 0.93, 1], clamp);
	return (
		<Drift dur={DUR[8]}>
			<AppleBg />
			<Page gap={40}>
				<Rise at={0} dist={30}>
					<div style={{scale: String(tap)}}>
						<BlackPill style={{fontSize: 64, fontWeight: 700, padding: '38px 90px', borderRadius: 90}}>Подписывайся</BlackPill>
					</div>
				</Rise>
				<div style={{textAlign: 'center'}}>
					<Lines at={at(8, 55.2)} size={56} weight={600} lines={['Дальше покажу:']} color={GRAY} />
					<Lines at={at(8, 56.0)} size={86} weight={700} lines={['как за минуту']} />
					<Lines at={at(8, 56.7)} size={86} weight={700} lines={['проверить свой VPN']} color={ACCENT} />
				</div>
			</Page>
			<Tick at={tapAt} vol={0.22} />
		</Drift>
	);
};

const SCENES = [S1, S2, S3, S4, S5, S6, S7, S8, S9];

export const Free: React.FC = () => (
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
		<Audio src={staticFile('free/voice.mp3')} />
	</AbsoluteFill>
);
