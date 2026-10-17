import React from 'react';
import '@fontsource/jetbrains-mono/500.css';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {Drift as KitDrift, INOUT, OUT, blurZoom, clamp, prog} from './kit';
import {HZ, HZ_BG, HZ_BLUE, HZ_INK, HZ_SUB, Wordmark} from './brand';

export const SK_FPS = 30;
const VOICE = 72.36;
const TR = 14;
const STARTS = [0, 6.65, 13.6, 16.2, 23.55, 29.35, 34.35, 40.45, 43.9, 48.3, 53.6, 60.85, 62.75, 69.05];
const fr = (s: number) => Math.round(s * SK_FPS);
export const SK_FRAMES = fr(VOICE + 1.4);
const DUR = STARTS.map((s, i) => (i < STARTS.length - 1 ? fr(STARTS[i + 1]) : SK_FRAMES) - fr(s));
/** local frame of an absolute voice timestamp */
const at = (i: number, t: number) => fr(t) - fr(STARTS[i]);

const RED = '#ff3b30';
const GREEN = '#22b45a';
const W = 880;
const MONO = '"JetBrains Mono", ui-monospace, monospace';

const Tick: React.FC<{at: number; vol?: number}> = ({at: a, vol = 0.16}) => (
	<Sequence from={Math.max(0, a)} layout="none">
		<Audio src={staticFile('sfx/tick-001.mp3')} volume={vol} />
	</Sequence>
);

const Roll: React.FC<{from: number; to: number; a: number; b: number; fmt?: (n: number) => string}> = ({from, to, a, b, fmt}) => {
	const f = useCurrentFrame();
	const v = Math.round(interpolate(f, [a, b], [from, to], {...clamp, easing: INOUT}));
	return <span style={{fontVariantNumeric: 'tabular-nums'}}>{fmt ? fmt(v) : v}</span>;
};

/** block that slides up out of blur */
const Slam: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties}> = ({at: a, children, style}) => {
	const f = useCurrentFrame();
	const p = interpolate(f - a, [0, 14], [0, 1], {...clamp, easing: OUT});
	return <div style={{opacity: p, translate: `0 ${(1 - p) * 44}px`, filter: p < 0.99 ? `blur(${(1 - p) * 10}px)` : undefined, ...style}}>{children}</div>;
};

/** heavy headline */
const T: React.FC<{at: number; size: number; lines: string[]; color?: string; hi?: string; hiLine?: number}> = ({at: a, size, lines, color = HZ_INK, hi, hiLine}) => (
	<Slam at={a}>
		<div style={{fontFamily: HZ, fontWeight: 900, fontSize: size, lineHeight: 1.04, letterSpacing: -size * 0.035, color, textAlign: 'center', whiteSpace: 'nowrap'}}>
			{lines.map((l, i) => (
				<div key={i} style={{color: hi && i === hiLine ? hi : color}}>{l}</div>
			))}
		</div>
	</Slam>
);

const Pill: React.FC<{at: number; children: React.ReactNode; bg?: string; color?: string; size?: number}> = ({at: a, children, bg = HZ_INK, color = '#fff', size = 54}) => (
	<Slam at={a}>
		<div style={{fontFamily: HZ, fontWeight: 800, fontSize: size, color, background: bg, padding: `${size * 0.32}px ${size * 0.8}px`, borderRadius: 100, whiteSpace: 'nowrap', letterSpacing: -size * 0.02}}>{children}</div>
	</Slam>
);

const Label: React.FC<{at: number; children: React.ReactNode}> = ({at: a, children}) => (
	<Slam at={a}>
		<div style={{fontFamily: HZ, fontWeight: 700, fontSize: 40, color: HZ_SUB, letterSpacing: 6, textTransform: 'uppercase'}}>{children}</div>
	</Slam>
);

const Card: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
	<div style={{background: '#fff', borderRadius: 36, boxShadow: '0 30px 70px rgba(20,30,60,0.14)', boxSizing: 'border-box', ...style}}>{children}</div>
);

const Page: React.FC<{children: React.ReactNode; gap?: number}> = ({children, gap = 0}) => (
	<AbsoluteFill style={{padding: '290px 100px 360px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap}}>{children}</AbsoluteFill>
);

const Sc: React.FC<{dur: number; children: React.ReactNode}> = ({dur, children}) => (
	<KitDrift dur={dur} amount={0.012}>
		<AbsoluteFill style={{background: HZ_BG}} />
		{children}
	</KitDrift>
);

/** image card with slow push-in; `focus` shifts the crop */
const Shot: React.FC<{src: string; at: number; w: number; h: number; pos?: string; zoom?: number; children?: React.ReactNode}> = ({src, at: a, w, h, pos = 'center', zoom = 0.07, children}) => {
	const f = useCurrentFrame();
	const p = interpolate(f - a, [0, 16], [0, 1], {...clamp, easing: OUT});
	const kb = 1.02 + interpolate(f - a, [0, 200], [0, zoom], clamp);
	return (
		<div style={{opacity: p, translate: `0 ${(1 - p) * 60}px`, scale: String(0.94 + p * 0.06), width: w, height: h, borderRadius: 32, overflow: 'hidden', position: 'relative', boxShadow: '0 30px 70px rgba(20,30,60,0.22)', background: '#fff'}}>
			<Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos, scale: String(kb)}} />
			{children}
		</div>
	);
};

const Watermark: React.FC = () => (
	<div style={{position: 'absolute', top: 190, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
		<div style={{display: 'flex', alignItems: 'baseline', gap: 10, background: 'rgba(255,255,255,0.9)', padding: '10px 28px', borderRadius: 40, boxShadow: '0 8px 24px rgba(20,30,60,0.10)'}}>
			<span style={{fontFamily: HZ, fontWeight: 900, fontSize: 34, color: HZ_INK, letterSpacing: -1}}>
				HORZ<span style={{color: HZ_BLUE}}>.</span>
			</span>
			<span style={{fontFamily: HZ, fontWeight: 700, fontSize: 20, color: HZ_SUB, letterSpacing: 4}}>VPN</span>
		</div>
	</div>
);

/* 0 — 2013, FBI hunts the most mysterious person on the internet */
const S0: React.FC = () => (
	<Sc dur={DUR[0] + TR}>
		<Page gap={34}>
			<T at={at(0, 0.1)} size={230} lines={['2013']} />
			<Shot src="silk/fbi.png" at={at(0, 0.5)} w={W} h={560} pos="40% 50%" />
			<Pill at={at(0, 2.1)} bg={HZ_BLUE} size={50}>ФБР · 2 года охоты</Pill>
			<T at={at(0, 4.2)} size={66} lines={['за самым загадочным', 'человеком интернета']} hi={HZ_BLUE} hiLine={1} />
		</Page>
		<Tick at={at(0, 2.1)} />
	</Sc>
);

/* 1 — Dread Pirate Roberts / Silk Road */
const S1: React.FC = () => (
	<Sc dur={DUR[1] + TR}>
		<Page gap={32}>
			<Label at={at(1, 6.75)}>его ник</Label>
			<T at={at(1, 7.3)} size={112} lines={['Dread Pirate', 'Roberts']} hi={HZ_BLUE} hiLine={1} />
			<Shot src="silk/site.jpg" at={at(1, 9.5)} w={W} h={480} pos="left top" zoom={0.1} />
			<Pill at={at(1, 10.3)} size={52}>Silk Road · даркнет</Pill>
		</Page>
		<Tick at={at(1, 7.3)} />
		<Tick at={at(1, 10.3)} />
	</Sc>
);

/* 2 — turnover > $1B */
const S2: React.FC = () => (
	<Sc dur={DUR[2] + TR}>
		<Page gap={30}>
			<Label at={at(2, 13.7)}>оборот</Label>
			<Slam at={at(2, 14.7)}>
				<div style={{fontFamily: HZ, fontWeight: 900, fontSize: 210, color: HZ_INK, letterSpacing: -9, lineHeight: 1, whiteSpace: 'nowrap'}}>
					$<Roll from={0} to={1} a={at(2, 14.7)} b={at(2, 15.4)} />
					<span style={{color: HZ_BLUE}}> млрд+</span>
				</div>
			</Slam>
		</Page>
		<Tick at={at(2, 14.7)} vol={0.24} />
	</Sc>
);

/* 3 — ad: giveaway of 5 premium subscriptions */
const S3: React.FC = () => (
	<Sc dur={DUR[3] + TR}>
		<Page gap={26}>
			<Label at={at(3, 16.25)}>Кстати · розыгрыш</Label>
			<Slam at={at(3, 18.0)}>
				<div style={{fontFamily: HZ, fontWeight: 900, fontSize: 320, color: HZ_BLUE, letterSpacing: -14, lineHeight: 0.95}}>5</div>
			</Slam>
			<T at={at(3, 18.4)} size={70} lines={['премиум-подписок']} />
			<Slam at={at(3, 19.3)}>
				<Wordmark size={190} />
			</Slam>
			<Pill at={at(3, 21.3)} size={46}>Все подробности — в Telegram</Pill>
			<Pill at={at(3, 22.4)} bg={HZ_BLUE} size={58}>@horzvpn</Pill>
		</Page>
		<Tick at={at(3, 18.0)} vol={0.24} />
		<Tick at={at(3, 21.3)} />
		<Tick at={at(3, 22.4)} vol={0.22} />
	</Sc>
);

/* 4 — how did they find him? not hackers: an IRS agent googled */
const S4: React.FC = () => {
	const f = useCurrentFrame();
	const q = 'silk road';
	const typed = Math.floor(interpolate(f, [at(4, 28.4), at(4, 29.1)], [0, 1], clamp) * q.length);
	return (
		<Sc dur={DUR[4] + TR}>
			<Page gap={30}>
				<T at={at(4, 23.6)} size={92} lines={['Как его', 'нашли?']} />
				<div style={{display: 'flex', gap: 22}}>
					{[
						['Хакеры', 24.95],
						['Взлом', 25.95],
					].map(([t, s]) => {
						const x = prog(f, at(4, (s as number) + 0.4), 8);
						return (
							<Slam key={t as string} at={at(4, s as number)}>
								<div style={{position: 'relative', fontFamily: HZ, fontWeight: 800, fontSize: 56, color: x > 0.5 ? '#aeaeb2' : HZ_INK, background: '#fff', padding: '20px 40px', borderRadius: 60, boxShadow: '0 10px 30px rgba(20,30,60,0.1)'}}>
									{t}
									<span style={{position: 'absolute', right: -14, top: -14, width: 54, height: 54, borderRadius: 27, background: RED, color: '#fff', fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', scale: String(x)}}>✕</span>
								</div>
							</Slam>
						);
					})}
				</div>
				<Slam at={at(4, 26.7)}>
					<Card style={{width: W, padding: '28px 40px', display: 'flex', alignItems: 'center', gap: 26}}>
						<div style={{width: 96, height: 96, borderRadius: 48, background: HZ_INK, color: '#fff', fontFamily: HZ, fontWeight: 900, fontSize: 30, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>IRS</div>
						<div style={{fontFamily: HZ, fontWeight: 800, fontSize: 46, color: HZ_INK, lineHeight: 1.1}}>Агент налоговой службы</div>
					</Card>
				</Slam>
				<Slam at={at(4, 28.3)}>
					<Card style={{width: W, padding: '26px 36px', display: 'flex', alignItems: 'center', gap: 22, borderRadius: 70}}>
						<svg viewBox="0 0 24 24" width={52} fill="none" stroke={HZ_SUB} strokeWidth={2.4} strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M16 16l5 5" /></svg>
						<div style={{fontFamily: HZ, fontWeight: 600, fontSize: 48, color: HZ_INK, minWidth: 380}}>
							{q.slice(0, typed)}
							<span style={{opacity: Math.floor(f / 12) % 2, color: HZ_BLUE}}>|</span>
						</div>
						<div style={{marginLeft: 'auto', fontFamily: HZ, fontWeight: 800, fontSize: 34, color: HZ_BLUE}}>погуглил</div>
					</Card>
				</Slam>
			</Page>
			<Tick at={at(4, 24.95)} />
			<Tick at={at(4, 25.95)} />
			<Tick at={at(4, 28.6)} vol={0.22} />
		</Sc>
	);
};

/* 5 — old forum post by altoid advertising Silk Road */
const Post: React.FC<{at: number; user: string; lines: number[]; hi?: React.ReactNode}> = ({at: a, user, lines, hi}) => (
	<Slam at={a}>
		<Card style={{width: W, padding: '34px 40px'}}>
			<div style={{display: 'flex', alignItems: 'center', gap: 22, marginBottom: 26}}>
				<div style={{width: 84, height: 84, borderRadius: 42, background: HZ_BLUE, color: '#fff', fontFamily: HZ, fontWeight: 900, fontSize: 46, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{user[0]}</div>
				<div>
					<div style={{fontFamily: MONO, fontSize: 42, color: HZ_INK, fontWeight: 500}}>{user}</div>
					<div style={{fontFamily: HZ, fontWeight: 600, fontSize: 28, color: HZ_SUB}}>старый форум</div>
				</div>
			</div>
			{lines.map((w, i) => (
				<div key={i} style={{height: 22, width: `${w}%`, borderRadius: 11, background: '#e6e9f0', marginBottom: 16}} />
			))}
			{hi}
		</Card>
	</Slam>
);

const S5: React.FC = () => (
	<Sc dur={DUR[5] + TR}>
		<Page gap={34}>
			<Label at={at(5, 29.45)}>он просто погуглил</Label>
			<T at={at(5, 30.0)} size={84} lines={['Старый пост', 'на форуме']} hi={HZ_BLUE} hiLine={1} />
			<Post
				at={at(5, 31.3)}
				user="altoid"
				lines={[92, 78, 85]}
				hi={
					<Slam at={at(5, 32.8)}>
						<div style={{display: 'inline-block', fontFamily: HZ, fontWeight: 900, fontSize: 54, color: '#fff', background: HZ_BLUE, padding: '10px 28px', borderRadius: 18, marginTop: 8}}>Silk Road</div>
					</Slam>
				}
			/>
		</Page>
		<Tick at={at(5, 31.3)} />
		<Tick at={at(5, 32.8)} vol={0.22} />
	</Sc>
);

/* 6 — same altoid looks for a programmer and leaves his real email */
const S6: React.FC = () => {
	const f = useCurrentFrame();
	const m = prog(f, at(6, 39.2), 16, OUT);
	return (
		<Sc dur={DUR[6] + TR}>
			<Page gap={34}>
				<T at={at(6, 34.4)} size={78} lines={['Через пару месяцев']} />
				<Post
					at={at(6, 35.3)}
					user="altoid"
					lines={[88, 70]}
					hi={
						<Slam at={at(6, 36.9)}>
							<div style={{display: 'inline-block', fontFamily: HZ, fontWeight: 900, fontSize: 52, color: '#fff', background: HZ_INK, padding: '10px 28px', borderRadius: 18, marginTop: 8}}>ищу программиста</div>
						</Slam>
					}
				/>
				<Slam at={at(6, 38.2)}>
					<div style={{fontFamily: HZ, fontWeight: 800, fontSize: 44, color: HZ_SUB}}>и оставляет свою настоящую почту</div>
				</Slam>
				<Card style={{width: W, padding: '28px 36px', display: 'flex', alignItems: 'center', gap: 24, opacity: m, boxShadow: `0 0 0 ${4 * m}px ${RED}, 0 30px 70px rgba(20,30,60,0.14)`}}>
					<svg viewBox="0 0 24 24" width={64} fill="none" stroke={RED} strokeWidth={1.8} strokeLinejoin="round"><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3.5 6.5l8.5 6.5 8.5-6.5" /></svg>
					<div style={{fontFamily: MONO, fontSize: 40, color: HZ_INK, fontWeight: 500}}>rossulbricht@gmail.com</div>
				</Card>
			</Page>
			<Tick at={at(6, 36.9)} />
			<Tick at={at(6, 39.3)} vol={0.26} />
		</Sc>
	);
};

/* 7 — the name and age */
const S7: React.FC = () => (
	<Sc dur={DUR[7] + TR}>
		<Page gap={32}>
			<Label at={at(7, 40.55)}>имя</Label>
			<Shot src="silk/ross.jpg" at={at(7, 40.9)} w={640} h={700} pos="50% 30%" zoom={0.05} />
			<T at={at(7, 41.35)} size={96} lines={['Росс Ульбрихт']} />
			<Slam at={at(7, 42.55)}>
				<div style={{fontFamily: HZ, fontWeight: 900, fontSize: 96, color: HZ_BLUE, letterSpacing: -4, whiteSpace: 'nowrap'}}>
					<Roll from={0} to={29} a={at(7, 42.6)} b={at(7, 43.4)} /> год
				</div>
			</Slam>
		</Page>
		<Tick at={at(7, 41.35)} />
		<Tick at={at(7, 43.0)} vol={0.22} />
	</Sc>
);

/* 8 — 1 Oct 2013, agents come to a San Francisco public library */
const Library: React.FC<{size: number}> = ({size}) => (
	<svg viewBox="0 0 200 160" width={size} fill="none" stroke={HZ_INK} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round">
		<path d="M20 60L100 20l80 40z" fill="#fff" />
		<path d="M30 68h140M36 140h128M24 148h152" />
		{[48, 78, 108, 138].map((x) => (
			<path key={x} d={`M${x} 72v62`} />
		))}
		<circle cx="100" cy="46" r="8" fill={HZ_BLUE} stroke="none" />
	</svg>
);
const S8: React.FC = () => (
	<Sc dur={DUR[8] + TR}>
		<Page gap={34}>
			<T at={at(8, 44.0)} size={104} lines={['1 октября', '2013']} hi={HZ_BLUE} hiLine={1} />
			<Slam at={at(8, 45.4)}>
				<Card style={{width: W, padding: '36px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20}}>
					<Library size={420} />
					<div style={{fontFamily: HZ, fontWeight: 900, fontSize: 52, color: HZ_INK, textAlign: 'center', lineHeight: 1.1}}>Публичная библиотека</div>
				</Card>
			</Slam>
			<Pill at={at(8, 47.3)} bg={HZ_BLUE} size={52}>Сан-Франциско</Pill>
		</Page>
		<Tick at={at(8, 44.4)} vol={0.22} />
		<Tick at={at(8, 47.3)} />
	</Sc>
);

/* 9 — staged quarrel, Ross is distracted, agent grabs the open laptop */
const Person: React.FC<{c: string; size?: number; label?: string}> = ({c, size = 150, label}) => (
	<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
		<svg viewBox="0 0 100 120" width={size} fill={c}>
			<circle cx="50" cy="30" r="22" />
			<path d="M10 118c0-30 18-50 40-50s40 20 40 50z" />
		</svg>
		{label ? <div style={{fontFamily: HZ, fontWeight: 800, fontSize: 32, color: HZ_SUB}}>{label}</div> : null}
	</div>
);
const S9: React.FC = () => {
	const f = useCurrentFrame();
	const quarrel = f >= at(9, 48.9);
	const look = prog(f, at(9, 50.5), 14, OUT);
	const grab = prog(f, at(9, 51.9), 10, OUT);
	return (
		<Sc dur={DUR[9] + TR}>
			<Page gap={34}>
				<T at={at(9, 48.35)} size={74} lines={['Двое', 'изобразили ссору']} hi={HZ_BLUE} hiLine={1} />
				<Slam at={at(9, 48.9)}>
					<Card style={{width: W, padding: '40px 20px', display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', position: 'relative', overflow: 'hidden'}}>
						<Person c="#8e96a8" label="агент" />
						<div style={{fontFamily: HZ, fontWeight: 900, fontSize: 90, color: RED, opacity: quarrel ? 0.6 + 0.4 * Math.sin(f / 3) : 0, alignSelf: 'center'}}>!?</div>
						<Person c="#8e96a8" label="агент" />
						<div style={{position: 'absolute', left: '50%', top: 18, translate: `${-50 + look * 0}% 0`, fontFamily: HZ, fontWeight: 800, fontSize: 28, color: HZ_BLUE, opacity: look}}>Росс отвлёкся 👀</div>
					</Card>
				</Slam>
				<Slam at={at(9, 50.3)}>
					<Card style={{width: W, padding: '30px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
						<Person c={HZ_BLUE} size={110} label="Росс" />
						<svg viewBox="0 0 120 70" width={260} fill="none" stroke={HZ_INK} strokeWidth={5} strokeLinejoin="round" style={{translate: `${grab * 150}px ${grab * -10}px`, rotate: `${grab * -8}deg`}}>
							<path d="M20 8h80v44H20z" fill="#fff" />
							<path d="M6 58h108l-8 8H14z" fill="#dfe3ec" />
						</svg>
					</Card>
				</Slam>
				<Pill at={at(9, 52.0)} bg={RED} size={50}>агент выхватил ноутбук</Pill>
			</Page>
			<Tick at={at(9, 48.9)} />
			<Tick at={at(9, 51.9)} vol={0.26} />
		</Sc>
	);
};

/* 10 — open laptop: no password, everything inside, 144,000 BTC */
const S10: React.FC = () => {
	const f = useCurrentFrame();
	const open = prog(f, at(10, 54.2), 14, OUT);
	return (
		<Sc dur={DUR[10] + TR}>
			<Page gap={28}>
				<T at={at(10, 53.65)} size={84} lines={['Без пароля']} />
				<Slam at={at(10, 54.1)}>
					<div style={{width: 560, height: 330, borderRadius: 28, background: HZ_INK, padding: 22, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 30px 70px rgba(20,30,60,0.25)'}}>
						<div style={{textAlign: 'center', fontFamily: HZ, fontWeight: 800, color: '#fff'}}>
							<svg viewBox="0 0 24 24" width={110} fill="none" stroke={GREEN} strokeWidth={1.8} strokeLinecap="round" style={{opacity: open}}>
								<rect x="5" y="10.5" width="14" height="10" rx="2.5" />
								<path d="M8 10.5V7.5a4 4 0 0 1 7.6-1.7" />
							</svg>
							<div style={{fontSize: 40, marginTop: 12, color: GREEN}}>ОТКРЫТ</div>
						</div>
					</div>
				</Slam>
				<Slam at={at(10, 55.0)}>
					<div style={{fontFamily: HZ, fontWeight: 800, fontSize: 44, color: HZ_SUB}}>а внутри — всё:</div>
				</Slam>
				{[
					['✉', 'Переписка', 56.35],
					['📓', 'Дневник', 57.2],
				].map(([ic, t, s]) => (
					<Slam key={t as string} at={at(10, s as number)}>
						<Card style={{width: W, padding: '20px 40px', display: 'flex', alignItems: 'center', gap: 24, fontFamily: HZ, fontWeight: 800, fontSize: 48, color: HZ_INK}}>
							<span style={{fontSize: 54}}>{ic}</span>
							{t}
						</Card>
					</Slam>
				))}
				<Slam at={at(10, 58.2)}>
					<Card style={{width: W, padding: '22px 40px', display: 'flex', alignItems: 'center', gap: 22, background: '#fff7e8'}}>
						<span style={{fontSize: 58, color: '#f7931a'}}>₿</span>
						<div style={{fontFamily: HZ, fontWeight: 900, fontSize: 62, color: HZ_INK, letterSpacing: -2, whiteSpace: 'nowrap'}}>
							<Roll from={0} to={144000} a={at(10, 58.3)} b={at(10, 59.8)} fmt={(n) => n.toLocaleString('ru-RU')} /> BTC
						</div>
					</Card>
				</Slam>
			</Page>
			<Tick at={at(10, 54.1)} />
			<Tick at={at(10, 56.35)} />
			<Tick at={at(10, 57.2)} />
			<Tick at={at(10, 58.2)} vol={0.24} />
		</Sc>
	);
};

/* 11 — outcome: site seized, life sentence */
const S11: React.FC = () => (
	<Sc dur={DUR[11] + TR}>
		<Page gap={30}>
			<Label at={at(11, 60.9)}>итог</Label>
			<Shot src="silk/seized.jpg" at={at(11, 61.0)} w={W} h={640} zoom={0.04} />
			<Slam at={at(11, 61.55)}>
				<div style={{fontFamily: HZ, fontWeight: 900, fontSize: 92, color: RED, letterSpacing: -3, whiteSpace: 'nowrap'}}>Пожизненный срок</div>
			</Slam>
		</Page>
		<Tick at={at(11, 61.55)} vol={0.26} />
	</Sc>
);

/* 12 — 2025 pardon; it all started with one old post */
const S12: React.FC = () => (
	<Sc dur={DUR[12] + TR}>
		<Page gap={32}>
			<Slam at={at(12, 63.2)}>
				<div style={{fontFamily: HZ, fontWeight: 900, fontSize: 230, color: HZ_INK, letterSpacing: -10, lineHeight: 1}}>
					<Roll from={2013} to={2025} a={at(12, 63.2)} b={at(12, 64.1)} />
				</div>
			</Slam>
			<Shot src="silk/news.jpg" at={at(12, 64.4)} w={W} h={462} zoom={0.04} />
			<Pill at={at(12, 64.7)} bg={GREEN} size={54}>помилован</Pill>
			<T at={at(12, 65.8)} size={62} lines={['всё началось с одного', 'старого поста на форуме']} hi={HZ_BLUE} hiLine={1} />
		</Page>
		<Tick at={at(12, 63.2)} vol={0.22} />
		<Tick at={at(12, 64.7)} vol={0.24} />
	</Sc>
);

/* 13 — CTA */
const S13: React.FC = () => {
	const f = useCurrentFrame();
	const tapAt = at(13, 69.3);
	const tap = interpolate(f - tapAt, [0, 5, 14], [1, 0.93, 1], clamp);
	return (
		<Sc dur={DUR[13]}>
			<Page gap={44}>
				<Slam at={0}>
					<Wordmark size={200} />
				</Slam>
				<Slam at={at(13, 69.1)}>
					<div style={{scale: String(tap)}}>
						<div style={{fontFamily: HZ, fontWeight: 900, fontSize: 68, color: '#fff', background: HZ_INK, padding: '36px 90px', borderRadius: 90, letterSpacing: -2}}>Подписывайся</div>
					</div>
				</Slam>
				<T at={at(13, 70.3)} size={58} lines={['дальше — ещё', 'расследования']} color={HZ_SUB} />
			</Page>
			<Tick at={tapAt} vol={0.22} />
		</Sc>
	);
};

const SCENES = [S0, S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13];

export const Silk: React.FC = () => (
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
		<Audio src={staticFile('silk/voice.mp3')} />
	</AbsoluteFill>
);
