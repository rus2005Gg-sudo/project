import React from 'react';
import '@fontsource/jetbrains-mono/500.css';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {LOGO, INOUT, OUT, blurZoom, clamp} from './kit';
import {HZ, HZ_BG, HZ_BLUE, HZ_INK, HZ_SUB, Wordmark} from './brand';
import {ICONS} from './BotWelcome';

/** «Как работает шифрование» — dark neon explainer, synced to the voice. */
export const ENC_FPS = 30;
const VOICE = 39.71;
const TR = 12;
const STARTS = [0, 3.6, 7.15, 14.2, 21.1, 23.8, 30.8, 36.4];
const fr = (s: number) => Math.round(s * ENC_FPS);
export const ENC_FRAMES = fr(VOICE + 1.2);
const DUR = STARTS.map((s, i) => (i < STARTS.length - 1 ? fr(STARTS[i + 1]) : ENC_FRAMES) - fr(s));
const at = (i: number, t: number) => fr(t) - fr(STARTS[i]);

const BLUE = HZ_BLUE;
const SKY = HZ_BLUE;
const RED = '#ff3b30';
const INK = HZ_INK;
const CARD: React.CSSProperties = {background: '#fff', borderRadius: 34, boxShadow: '0 30px 70px rgba(20,30,60,0.12)'};
const GREEN = '#2ee59d';
const MONO = '"JetBrains Mono", monospace';
const W = 880;

const rnd = (n: number) => {
	const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
	return x - Math.floor(x);
};
const sp = (f: number, a: number, d = 12) => spring({frame: f - a, fps: ENC_FPS, config: {damping: d, stiffness: 150}});

const Bg: React.FC<{tint?: string}> = ({tint = '10,77,255'}) => (
	<AbsoluteFill style={{background: HZ_BG}}>
		<AbsoluteFill style={{background: `radial-gradient(ellipse 70% 40% at 50% 52%, rgba(${tint},0.10), rgba(${tint},0) 70%)`}} />
	</AbsoluteFill>
);

const Page: React.FC<{children: React.ReactNode; gap?: number}> = ({children, gap = 40}) => (
	<AbsoluteFill style={{padding: '290px 100px 360px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap}}>{children}</AbsoluteFill>
);

/** heavy headline: slams in with overshoot + blur */
const Slam: React.FC<{at: number; size: number; children: React.ReactNode; color?: string; glow?: string}> = ({at: a, size, children, color = INK, glow}) => {
	const f = useCurrentFrame();
	const p = sp(f, a, 10);
	const o = interpolate(f - a, [0, 6], [0, 1], clamp);
	return (
		<div style={{fontFamily: HZ, fontWeight: 900, fontSize: size, letterSpacing: -size * 0.035, lineHeight: 1.04, color, textAlign: 'center', opacity: o, scale: String(interpolate(p, [0, 1], [1.6, 1])), filter: o < 1 ? `blur(${(1 - o) * 14}px)` : undefined, textShadow: glow ? `0 0 40px ${glow}` : undefined}}>
			{children}
		</div>
	);
};

const Tick: React.FC<{at: number; vol?: number}> = ({at: a, vol = 0.18}) => (
	<Sequence from={Math.max(0, a)} layout="none">
		<Audio src={staticFile('sfx/tick-001.mp3')} volume={vol} />
	</Sequence>
);

const GLYPHS = '#$%&@*+=?!<>/\\{}[]0123456789ABCDEFabcdef§¥Ж▓░';
/** text that scrambles into cipher at `a` (and stays cipher) */
const Scramble: React.FC<{text: string; a: number; size: number; color?: string}> = ({text, a, size, color = INK}) => {
	const f = useCurrentFrame();
	return (
		<span style={{fontFamily: MONO, fontSize: size, color, whiteSpace: 'pre-wrap'}}>
			{text.split('').map((ch, i) => {
				const k = f - a - i * 0.7;
				if (k < 0 || ch === ' ') return <span key={i}>{ch}</span>;
				const g = GLYPHS[Math.floor(rnd(i * 13 + Math.floor(f / 2)) * GLYPHS.length)];
				return (
					<span key={i} style={{color: BLUE}}>
						{g}
					</span>
				);
			})}
		</span>
	);
};

const Bubble: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
	<div style={{background: 'linear-gradient(180deg,#2a8cff,#1f6fe0)', color: '#fff', fontFamily: HZ, fontWeight: 700, fontSize: 52, padding: '30px 44px', borderRadius: '44px 44px 12px 44px', boxShadow: '0 30px 70px rgba(31,111,224,0.45)', ...style}}>{children}</div>
);

const Eye: React.FC<{size: number}> = ({size}) => (
	<svg viewBox="0 0 24 24" width={size} fill="none" stroke={RED} strokeWidth={2}>
		<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
		<circle cx="12" cy="12" r="3.2" fill={RED} />
	</svg>
);

/* 0 — HOOK: your message can be read by anyone */
const S0: React.FC = () => {
	const f = useCurrentFrame();
	const shake = f > at(0, 2.6) && f < at(0, 3.0) ? Math.sin(f * 3) * 8 : 0;
	const scan = interpolate(f, [at(0, 2.0), at(0, 3.5)], [0, 1], clamp);
	return (
		<AbsoluteFill>
			<Bg tint="255,59,48" />
			<Page gap={60}>
				<Slam at={0} size={110}>
					Прямо сейчас
				</Slam>
				<div style={{position: 'relative', translate: `${shake}px 0`, scale: String(sp(f, 6, 11))}}>
					<Bubble>Мой пароль: qwerty123</Bubble>
					<div style={{position: 'absolute', left: 0, right: 0, top: `${scan * 100}%`, height: 6, background: RED, boxShadow: `0 0 30px ${RED}`, opacity: scan > 0 && scan < 1 ? 1 : 0}} />
				</div>
				<Slam at={at(0, 2.05)} size={96} color={RED}>
					читает кто угодно
				</Slam>
				<div style={{display: 'flex', gap: 40}}>
					{[0, 1, 2].map((i) => (
						<div key={i} style={{scale: String(sp(f, at(0, 2.6) + i * 3, 9))}}>
							<Eye size={110} />
						</div>
					))}
				</div>
			</Page>
			<Tick at={6} />
			<Tick at={at(0, 2.6)} vol={0.26} />
		</AbsoluteFill>
	);
};

/* 1 — who: Wi-Fi in a cafe, provider, hacker */
const WHO: [string, string, number][] = [
	['☕', 'Wi-Fi в кафе', 3.68],
	['🏢', 'Провайдер', 4.96],
	['💀', 'Хакер в той же сети', 5.84],
];
const S1: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill>
			<Bg tint="255,59,48" />
			<Page gap={34}>
				<Bubble style={{fontSize: 46}}>Мой пароль: qwerty123</Bubble>
				{WHO.map(([ic, t, s], i) => {
					const p = sp(f, at(1, s), 11);
					return (
						<div key={t} style={{width: W, display: 'flex', alignItems: 'center', gap: 28, padding: '26px 36px', borderRadius: 32, ...CARD, border: `3px solid rgba(255,59,48,${0.15 + 0.45 * p})`, translate: `${(1 - p) * (i % 2 ? 600 : -600)}px 0`, opacity: Math.min(1, p * 1.5)}}>
							<div style={{fontSize: 80}}>{ic}</div>
							<div style={{fontFamily: HZ, fontWeight: 900, fontSize: 54, color: INK, flex: 1}}>{t}</div>
							<Eye size={80} />
						</div>
					);
				})}
			</Page>
			{WHO.map(([, t, s]) => (
				<Tick key={t} at={at(1, s)} vol={0.2} />
			))}
		</AbsoluteFill>
	);
};

/* 2 — no encryption = postcard */
const S2: React.FC = () => {
	const f = useCurrentFrame();
	const fly = interpolate(f, [at(2, 8.4), at(2, 10.2)], [-700, 0], {...clamp, easing: OUT});
	const card = sp(f, at(2, 10.6), 12);
	return (
		<AbsoluteFill>
			<Bg tint="255,59,48" />
			<Page gap={44}>
				<Slam at={0} size={100}>
					Без шифрования
				</Slam>
				<div style={{translate: `${fly}px 0`, rotate: `${-4 + card * 8}deg`, width: 820, padding: 46, borderRadius: 26, background: '#f3ead7', boxShadow: '0 40px 90px rgba(20,30,60,0.22)', position: 'relative'}}>
					<div style={{position: 'absolute', right: 40, top: 36, width: 110, height: 130, border: '4px dashed #b9a988', borderRadius: 8}} />
					<div style={{fontFamily: HZ, fontWeight: 800, fontSize: 40, color: '#7a6a4c', letterSpacing: 4}}>ОТКРЫТКА</div>
					<div style={{fontFamily: MONO, fontSize: 50, color: '#1c1a16', marginTop: 30, lineHeight: 1.4}}>
						логин: ivan@mail.ru
						<br />
						пароль: qwerty123
					</div>
				</div>
				<Slam at={at(2, 11.4)} size={68} color={RED}>
					каждый видит, что внутри
				</Slam>
				<div style={{display: 'flex', gap: 30}}>
					{[0, 1, 2, 3].map((i) => (
						<div key={i} style={{scale: String(sp(f, at(2, 12.4) + i * 3, 9))}}>
							<Eye size={90} />
						</div>
					))}
				</div>
			</Page>
			<Tick at={at(2, 10.2)} />
			<Tick at={at(2, 11.4)} vol={0.24} />
		</AbsoluteFill>
	);
};

/* 3 — encryption scrambles the text */
const S3: React.FC = () => {
	const f = useCurrentFrame();
	const lock = sp(f, at(3, 17.3), 9);
	const flash = interpolate(f - at(3, 17.3), [0, 3, 12], [0, 0.7, 0], clamp);
	return (
		<AbsoluteFill>
			<Bg />
			<Page gap={50}>
				<Slam at={0} size={110}>
					Шифрование
				</Slam>
				<div style={{width: W, padding: '44px 48px', borderRadius: 34, ...CARD, border: `3px solid rgba(10,77,255,${0.1 + lock * 0.6})`, textAlign: 'center', minHeight: 230, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
					<Scramble text="Привет, это мой пароль" a={at(3, 17.3)} size={62} />
				</div>
				<div style={{fontSize: 150, scale: String(lock), filter: 'drop-shadow(0 20px 30px rgba(20,30,60,0.2))'}}>🔒</div>
				<Slam at={at(3, 19.6)} size={64}>
					без ключа — <span style={{color: SKY}}>не прочитать</span>
				</Slam>
			</Page>
			<AbsoluteFill style={{background: '#fff', opacity: flash}} />
			<Tick at={at(3, 15.9)} />
			<Tick at={at(3, 17.3)} vol={0.3} />
		</AbsoluteFill>
	);
};

/* 4 — the key: only you and the server */
const S4: React.FC = () => {
	const f = useCurrentFrame();
	const k1 = sp(f, at(4, 22.5), 10);
	const k2 = sp(f, at(4, 23.2), 10);
	const dash = (f * 6) % 60;
	return (
		<AbsoluteFill>
			<Bg />
			<Page gap={60}>
				<Slam at={0} size={100}>
					🔑 Ключ есть только
				</Slam>
				<div style={{display: 'flex', alignItems: 'center', gap: 20}}>
					{[
						['📱', 'у тебя', k1],
						['🖥️', 'у сервера', k2],
					].map(([ic, t, p], i) => (
						<React.Fragment key={t as string}>
							{i === 1 ? (
								<svg width={240} height={40}>
									<line x1={0} y1={20} x2={240} y2={20} stroke={BLUE} strokeWidth={8} strokeDasharray="24 36" strokeDashoffset={-dash} />
								</svg>
							) : null}
							<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, scale: String(0.6 + (p as number) * 0.4), opacity: p as number}}>
								<div style={{width: 230, height: 230, ...CARD, borderRadius: 50, border: `3px solid ${BLUE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 120}}>{ic}</div>
								<div style={{fontFamily: HZ, fontWeight: 900, fontSize: 50, color: INK}}>{t}</div>
							</div>
						</React.Fragment>
					))}
				</div>
			</Page>
			<Tick at={at(4, 22.5)} />
			<Tick at={at(4, 23.2)} />
		</AbsoluteFill>
	);
};

/* 5 — brute force: billions of years, longer than the universe */
const S5: React.FC = () => {
	const f = useCurrentFrame();
	const n = Math.round(interpolate(f, [at(5, 24.3), at(5, 28.0)], [0, 1e9], {...clamp, easing: (t) => t * t * t}));
	const tries = Math.floor(rnd(f) * 1e12).toString(16).toUpperCase().padStart(10, '0');
	return (
		<AbsoluteFill>
			<Bg />
			<Page gap={36}>
				<Slam at={0} size={84}>
					Подобрать перебором
				</Slam>
				<div style={{fontFamily: MONO, fontSize: 46, color: HZ_SUB}}>ключ: {tries}… ✕</div>
				<div style={{fontFamily: HZ, fontWeight: 900, fontSize: 52, color: HZ_SUB}}>💻 суперкомпьютеру нужно</div>
				<div style={{fontFamily: HZ, fontWeight: 900, fontSize: 150, color: BLUE, letterSpacing: -6, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap'}}>{n.toLocaleString('ru-RU')}+</div>
				<Slam at={at(5, 28.0)} size={70} color={SKY}>
					лет
				</Slam>
				<Slam at={at(5, 28.4)} size={60}>
					🌌 дольше, чем существует Вселенная
				</Slam>
			</Page>
			<Tick at={at(5, 28.0)} vol={0.3} />
			<Tick at={at(5, 29.9)} />
		</AbsoluteFill>
	);
};

/* 6 — ad: Horz VPN encrypts all your traffic */
const S6: React.FC = () => {
	const f = useCurrentFrame();
	const pull = interpolate(f, [at(6, 33.0), at(6, 34.6)], [0, 1], {...clamp, easing: INOUT});
	return (
		<AbsoluteFill>
			<Bg />
			<Page gap={44}>
				<Slam at={0} size={56} color={HZ_SUB}>
					Кстати
				</Slam>
				<div style={{scale: String(sp(f, at(6, 31.4), 10)), width: 230, height: 230, borderRadius: 56, background: 'linear-gradient(160deg,#fff,#e4ebf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 30px 60px rgba(20,30,60,0.18)'}}>
					<Img src={LOGO} style={{width: '68%'}} />
				</div>
				<div style={{scale: String(sp(f, at(6, 31.5), 11))}}>
					<Wordmark size={150} />
				</div>
				<div style={{position: 'relative', width: W, height: 150}}>
					{ICONS.slice(0, 6).map((ic, i) => {
						const x0 = i * 150;
						const x = interpolate(pull, [0, 1], [x0, 365]);
						return (
							<div key={i} style={{position: 'absolute', left: x, top: 0, width: 130, height: 130, borderRadius: 32, background: ic.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: interpolate(f - at(6, 32.5) - i * 2, [0, 6], [0, 1 - pull * 0.9], clamp), scale: String(1 - pull * 0.4)}}>
								{ic.glyph}
							</div>
						);
					})}
					<div style={{position: 'absolute', left: 340, top: -10, width: 180, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 120, opacity: pull, scale: String(0.5 + pull * 0.5), filter: 'drop-shadow(0 20px 30px rgba(20,30,60,0.2))'}}>🔒</div>
				</div>
				<Slam at={at(6, 33.0)} size={58}>
					шифрует <span style={{color: SKY}}>весь трафик</span>
				</Slam>
				<div style={{scale: String(sp(f, at(6, 35.3), 11)), fontFamily: HZ, fontWeight: 800, fontSize: 52, color: '#fff', background: INK, padding: '26px 64px', borderRadius: 70}}>Ссылка в профиле</div>
			</Page>
			<Tick at={at(6, 31.5)} />
			<Tick at={at(6, 34.6)} vol={0.24} />
			<Tick at={at(6, 35.3)} />
		</AbsoluteFill>
	);
};

/* 7 — subscribe */
const S7: React.FC = () => {
	const f = useCurrentFrame();
	const tap = interpolate(f - at(7, 36.9), [0, 5, 14], [1, 0.92, 1], clamp);
	return (
		<AbsoluteFill>
			<Bg />
			<Page gap={50}>
				<div style={{scale: String(sp(f, 2, 10) * tap), fontFamily: HZ, fontWeight: 900, fontSize: 76, color: '#fff', background: INK, padding: '36px 90px', borderRadius: 90}}>Подписывайся</div>
				<Slam at={at(7, 37.4)} size={64} color={HZ_SUB}>
					дальше — <span style={{color: SKY}}>как работают ключи</span> 🔑
				</Slam>
			</Page>
			<Tick at={at(7, 36.9)} vol={0.24} />
		</AbsoluteFill>
	);
};

const SCENES = [S0, S1, S2, S3, S4, S5, S6, S7];

const Watermark: React.FC = () => (
	<div style={{position: 'absolute', top: 190, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
		<div style={{display: 'flex', alignItems: 'baseline', gap: 10, background: 'rgba(255,255,255,0.92)', padding: '10px 28px', borderRadius: 40, boxShadow: '0 8px 24px rgba(20,30,60,0.10)'}}>
			<span style={{fontFamily: HZ, fontWeight: 900, fontSize: 34, color: INK, letterSpacing: -1}}>
				HORZ<span style={{color: BLUE}}>.</span>
			</span>
			<span style={{fontFamily: HZ, fontWeight: 700, fontSize: 20, color: HZ_SUB, letterSpacing: 4}}>VPN</span>
		</div>
	</div>
);

export const Enc: React.FC = () => (
	<AbsoluteFill style={{background: '#fbfcfe'}}>
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
		<Audio src={staticFile('enc/voice.mp3')} />
	</AbsoluteFill>
);
