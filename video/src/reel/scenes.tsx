import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {BrandBg, C, Card, DarkBg, Glitch, Logo, Pop, Shake, Tag, clamp, font, mono, useSpring} from './ui';

type SP = {dur: number};

const Title: React.FC<{children: React.ReactNode; color?: string; size?: number; top?: number}> = ({children, color = C.text, size = 64, top = 200}) => (
	<div style={{position: 'absolute', top, width: '100%', textAlign: 'center', fontFamily: font, fontWeight: 900, fontSize: size, color, lineHeight: 1.1}}>
		{children}
	</div>
);

export const Hook: React.FC<SP> = () => {
	const f = useCurrentFrame();
	const flash = interpolate(f, [0, 6], [1, 0], clamp);
	const stamp = useSpring(38, 9, 220);
	return (
		<AbsoluteFill>
			<DarkBg />
			<Shake amount={interpolate(f, [0, 10, 36, 44, 60], [30, 6, 6, 26, 4], clamp)}>
				<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 30, paddingBottom: 380}}>
					<Pop from="scale">
						<Glitch size={80} seed="h1" strength={1.4}>
							ТВОЙ БЕСПЛАТНЫЙ
						</Glitch>
					</Pop>
					<Pop from="scale" delay={4}>
						<Glitch size={210} seed="h2" color={C.red} strength={1.6}>
							VPN
						</Glitch>
					</Pop>
					<Pop from="scale" delay={10}>
						<Glitch size={118} seed="h3" strength={1.4}>
							ПРОДАЛ ТЕБЯ
						</Glitch>
					</Pop>
					<div
						style={{
							marginTop: 40,
							transform: `scale(${3 - 2 * stamp}) rotate(-10deg)`,
							opacity: stamp,
							fontFamily: font,
							fontWeight: 900,
							fontSize: 110,
							color: C.red,
							border: `10px solid ${C.red}`,
							borderRadius: 24,
							padding: '6px 40px',
							boxShadow: `0 0 60px ${C.red}88`,
						}}
					>
						SOLD $3
					</div>
				</AbsoluteFill>
			</Shake>
			<AbsoluteFill style={{background: '#fff', opacity: flash}} />
		</AbsoluteFill>
	);
};

const listings = [
	['VPN LOGS 2026 • IP + сайты', '1.2M юзеров', '$3'],
	['Email + номер + гео', '540K записей', '$5'],
	['История браузинга', '3.4M строк', '$9'],
	['Cookies / сессии', '210K', '$12'],
];

export const Forum: React.FC<SP> = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill>
			<DarkBg />
			<Title top={170}>
				Где-то на <span style={{color: C.red}}>теневом форуме</span>
			</Title>
			<div style={{position: 'absolute', top: 360, left: 70, right: 70}}>
				<Pop>
					<Card style={{padding: 0, overflow: 'hidden'}}>
						<div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '22px 28px', background: 'rgba(255,255,255,0.05)', borderBottom: '2px solid rgba(255,255,255,0.08)'}}>
							{['#ff5f57', '#febc2e', '#28c840'].map((c) => (
								<div key={c} style={{width: 20, height: 20, borderRadius: 10, background: c}} />
							))}
							<div style={{marginLeft: 20, fontFamily: mono, fontSize: 28, color: C.dim}}>
								http://████████.onion/market
							</div>
						</div>
						<div style={{padding: 28, display: 'flex', flexDirection: 'column', gap: 22}}>
							{listings.map(([n, q, p], i) => (
								<Pop key={n} delay={8 + i * 9} from="right">
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'space-between',
											padding: '24px 26px',
											borderRadius: 20,
											background: i === 0 ? 'rgba(255,45,85,0.14)' : 'rgba(255,255,255,0.04)',
											border: i === 0 ? `2px solid ${C.red}` : '2px solid transparent',
										}}
									>
										<div>
											<div style={{fontFamily: mono, fontWeight: 800, fontSize: 34, color: C.text}}>{n}</div>
											<div style={{fontFamily: mono, fontSize: 26, color: C.dim, marginTop: 6}}>{q}</div>
										</div>
										<div style={{fontFamily: font, fontWeight: 900, fontSize: 56, color: i === 0 ? C.red : C.green}}>{p}</div>
									</div>
								</Pop>
							))}
						</div>
					</Card>
				</Pop>
			</div>
			<div
				style={{
					position: 'absolute',
					top: 300,
					right: 80,
					opacity: f > 60 ? 1 : 0,
					transform: `rotate(8deg) scale(${f > 60 ? 1 : 1.6})`,
				}}
			>
				<Tag size={34}>ТВОИ ДАННЫЕ?</Tag>
			</div>
		</AbsoluteFill>
	);
};

const logLines = [
	['22:14:03', 'IP  185.43.•••.•••', C.red],
	['22:14:05', 'device  iPhone 15 / iOS 18', C.cyan],
	['22:14:09', 'visit  online-bank.ru/login', C.red],
	['22:14:12', 'visit  instagram.com', C.cyan],
	['22:14:20', 'geo  Москва, 55.75 / 37.61', C.red],
	['22:14:31', 'visit  mail.google.com', C.cyan],
	['22:14:40', 'upload → logs_db  ✓', C.green],
];

export const Logs: React.FC<SP> = ({dur}) => {
	const f = useCurrentFrame();
	const per = (dur - 40) / logLines.length;
	return (
		<AbsoluteFill>
			<DarkBg tint="25,227,255" />
			<div style={{position: 'absolute', top: 150, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
				<Pop>
					<div
						style={{
							width: 420,
							height: 300,
							borderRadius: 48,
							border: '6px solid #2a3150',
							background: 'linear-gradient(180deg,#141a2e,#0b0f1c)',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 22,
						}}
					>
						<div style={{fontFamily: font, fontWeight: 800, fontSize: 34, color: C.dim}}>FREE VPN</div>
						<div style={{width: 150, height: 80, borderRadius: 40, background: C.green, position: 'relative', boxShadow: `0 0 40px ${C.green}88`}}>
							<div style={{position: 'absolute', right: 8, top: 8, width: 64, height: 64, borderRadius: 32, background: '#fff'}} />
						</div>
						<div style={{fontFamily: font, fontWeight: 800, fontSize: 30, color: C.green}}>Подключено ✓</div>
					</div>
				</Pop>
			</div>
			{[...Array(10)].map((_, i) => {
				const p = ((f + i * 9) % 45) / 45;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: 540 + (random(`px${i}`) - 0.5) * 300,
							top: 470 + p * 150,
							width: 10,
							height: 26,
							borderRadius: 5,
							background: i % 2 ? C.red : C.cyan,
							opacity: (1 - p) * fadeOnce(f),
							boxShadow: `0 0 16px ${i % 2 ? C.red : C.cyan}`,
						}}
					/>
				);
			})}
			<div style={{position: 'absolute', top: 650, left: 60, right: 60}}>
				<Card glow="25,227,255" style={{padding: 34}}>
					<div style={{fontFamily: mono, fontWeight: 800, fontSize: 30, color: C.red, marginBottom: 20}}>● REC  /var/log/users.log</div>
					{logLines.map(([t, l, c], i) => {
						const s = 20 + i * per;
						const chars = Math.floor(interpolate(f, [s, s + per * 0.7], [0, l.length], clamp));
						if (f < s) return null;
						return (
							<div key={i} style={{fontFamily: mono, fontSize: 32, color: C.text, marginBottom: 14, whiteSpace: 'nowrap'}}>
								<span style={{color: C.dim}}>[{t}] </span>
								<span style={{color: c}}>{l.slice(0, chars)}</span>
								{chars < l.length && f % 16 < 8 ? <span style={{color: C.text}}>▌</span> : null}
							</div>
						);
					})}
				</Card>
			</div>
		</AbsoluteFill>
	);
};

const fadeOnce = (f: number) => interpolate(f, [10, 20], [0, 1], clamp);

export const Money: React.FC<SP> = () => {
	const f = useCurrentFrame();
	const cost = Math.floor(interpolate(f, [5, 45], [0, 48000], clamp));
	const eq = useSpring(62);
	return (
		<AbsoluteFill>
			<DarkBg />
			<div style={{position: 'absolute', top: 180, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20}}>
				<Pop>
					<div style={{fontFamily: font, fontWeight: 800, fontSize: 46, color: C.dim}}>Серверы в месяц</div>
				</Pop>
				<Pop delay={4}>
					<div style={{fontFamily: font, fontWeight: 900, fontSize: 150, color: C.text, letterSpacing: -4}}>
						${cost.toLocaleString('en-US')}
					</div>
				</Pop>
				<Pop delay={20}>
					<div style={{fontFamily: font, fontWeight: 800, fontSize: 46, color: C.dim}}>
						Ты платишь: <span style={{color: C.green}}>$0</span>
					</div>
				</Pop>
			</div>
			<div
				style={{
					position: 'absolute',
					top: 700,
					width: '100%',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: 26,
					opacity: eq,
					transform: `scale(${0.7 + 0.3 * eq})`,
				}}
			>
				<div style={{fontFamily: font, fontWeight: 900, fontSize: 72, color: C.text}}>Бесплатно</div>
				<div style={{fontFamily: font, fontWeight: 900, fontSize: 90, color: C.dim}}>=</div>
				<Glitch size={120} seed="tovar" color={C.red}>
					ТЫ — ТОВАР
				</Glitch>
			</div>
		</AbsoluteFill>
	);
};

const buyers = [
	['Рекламные сети', C.cyan],
	['Перекупщики данных', '#ffb020'],
	['Мошенники', C.red],
];

export const Market: React.FC<SP> = ({dur}) => {
	const f = useCurrentFrame();
	const step = dur / 5;
	const arrow = (i: number) => interpolate(f, [step * (1.4 + i * 0.9), step * (1.4 + i * 0.9) + 10], [0, 1], clamp);
	return (
		<AbsoluteFill>
			<DarkBg />
			<div style={{position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center', gap: 60, alignItems: 'center'}}>
				<Pop>
					<svg width="220" height="260" viewBox="0 0 220 260">
						{[200, 130, 60].map((y, i) => (
							<g key={i}>
								<rect x="20" y={y - 30} width="180" height="60" fill="#1b2340" stroke={C.cyan} strokeWidth="4" />
								<ellipse cx="110" cy={y + 30} rx="90" ry="22" fill="#1b2340" stroke={C.cyan} strokeWidth="4" />
								<ellipse cx="110" cy={y - 30} rx="90" ry="22" fill="#232d52" stroke={C.cyan} strokeWidth="4" />
							</g>
						))}
					</svg>
					<div style={{textAlign: 'center', fontFamily: mono, fontWeight: 800, fontSize: 30, color: C.cyan}}>logs_db</div>
				</Pop>
				<div style={{fontFamily: font, fontWeight: 900, fontSize: 90, color: C.dim, opacity: interpolate(f, [12, 20], [0, 1], clamp)}}>→</div>
				<Pop delay={18} from="scale">
					<div
						style={{
							width: 250,
							height: 250,
							borderRadius: 30,
							background: 'linear-gradient(160deg,#6b4a2a,#3d2914)',
							border: '5px solid #a8773f',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							flexDirection: 'column',
							gap: 10,
							boxShadow: '0 0 50px rgba(255,176,32,0.3)',
						}}
					>
						<div style={{fontFamily: mono, fontWeight: 800, fontSize: 36, color: '#ffd9a0'}}>LOGS.zip</div>
						<div style={{fontFamily: font, fontWeight: 900, fontSize: 48, color: C.green}}>$$$</div>
					</div>
				</Pop>
			</div>
			<div style={{position: 'absolute', top: 640, left: 110, right: 110, display: 'flex', flexDirection: 'column', gap: 36}}>
				{buyers.map(([n, c], i) => (
					<div key={n} style={{display: 'flex', alignItems: 'center', gap: 30, opacity: arrow(i), transform: `translateX(${(1 - arrow(i)) * 120}px)`}}>
						<div style={{fontFamily: font, fontWeight: 900, fontSize: 60, color: c}}>→</div>
						<Card glow={i === 2 ? '255,45,85' : '25,227,255'} style={{flex: 1, padding: '30px 36px', borderColor: c}}>
							<div style={{fontFamily: font, fontWeight: 900, fontSize: 50, color: c}}>{n}</div>
						</Card>
					</div>
				))}
			</div>
		</AbsoluteFill>
	);
};

export const Call: React.FC<SP> = () => {
	const f = useCurrentFrame();
	const ring = Math.sin(f * 0.9) * 6 * (f < 110 ? 1 : 0);
	const bubble = useSpring(55);
	return (
		<AbsoluteFill style={{background: 'linear-gradient(180deg,#1a1d2b,#07080d)'}}>
			<div style={{position: 'absolute', top: 150, width: '100%', textAlign: 'center', fontFamily: font, fontWeight: 800, fontSize: 36, color: C.dim}}>
				Входящий вызов…
			</div>
			<div style={{position: 'absolute', top: 260, width: '100%', display: 'flex', justifyContent: 'center'}}>
				<div style={{position: 'relative', width: 260, height: 260}}>
					{[0, 1, 2].map((i) => {
						const p = ((f + i * 12) % 36) / 36;
						return (
							<div
								key={i}
								style={{
									position: 'absolute',
									inset: -p * 120,
									borderRadius: '50%',
									border: `4px solid ${C.green}`,
									opacity: 1 - p,
								}}
							/>
						);
					})}
					<div
						style={{
							width: 260,
							height: 260,
							borderRadius: '50%',
							background: 'linear-gradient(160deg,#3b4466,#1c2135)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontFamily: font,
							fontWeight: 900,
							fontSize: 110,
							color: C.text,
							transform: `rotate(${ring}deg)`,
						}}
					>
						СБ
					</div>
				</div>
			</div>
			<div style={{position: 'absolute', top: 600, width: '100%', textAlign: 'center'}}>
				<div style={{fontFamily: font, fontWeight: 900, fontSize: 66, color: C.text}}>Служба безопасности</div>
				<div style={{fontFamily: font, fontWeight: 900, fontSize: 66, color: C.text}}>банка</div>
				<div style={{fontFamily: mono, fontSize: 38, color: C.dim, marginTop: 16}}>+7 (9••) •••-••-••</div>
			</div>
			<div
				style={{
					position: 'absolute',
					top: 900,
					left: 90,
					right: 90,
					opacity: bubble,
					transform: `translateY(${(1 - bubble) * 60}px)`,
				}}
			>
				<Card style={{padding: 36}}>
					<div style={{fontFamily: font, fontWeight: 800, fontSize: 40, color: C.text, lineHeight: 1.3}}>
						«Здравствуйте! Вы сейчас в Москве, заходили в онлайн-банк с iPhone 15…»
					</div>
				</Card>
			</div>
			<div style={{position: 'absolute', top: 1180, width: '100%', display: 'flex', justifyContent: 'center', gap: 260}}>
				<div style={{width: 150, height: 150, borderRadius: 75, background: C.red, boxShadow: `0 0 40px ${C.red}88`}} />
				<div style={{width: 150, height: 150, borderRadius: 75, background: '#28c840', boxShadow: '0 0 40px #28c84088'}} />
			</div>
		</AbsoluteFill>
	);
};

const apps = [
	['Free VPN ████', '7 трекеров'],
	['VPN ████ Unlimited', 'утечка DNS'],
	['████ Proxy Free', 'без шифрования'],
	['Fast VPN ████', 'передаёт данные'],
];

export const Scan: React.FC<SP> = ({dur}) => {
	const f = useCurrentFrame();
	const y = interpolate(f, [5, dur - 20], [0, 4], clamp);
	return (
		<AbsoluteFill>
			<DarkBg />
			<Title top={160}>Проверяем бесплатные VPN</Title>
			<div style={{position: 'absolute', top: 330, left: 80, right: 80, display: 'flex', flexDirection: 'column', gap: 30}}>
				{apps.map(([n, w], i) => {
					const hit = y > i + 0.5;
					return (
						<Pop key={n} delay={i * 4}>
							<Card glow={hit ? '255,45,85' : '120,130,170'} style={{padding: '30px 34px', display: 'flex', alignItems: 'center', gap: 28}}>
								<div style={{width: 96, height: 96, borderRadius: 24, background: 'linear-gradient(160deg,#3b4466,#1c2135)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font, fontWeight: 900, fontSize: 40, color: C.dim}}>
									VPN
								</div>
								<div style={{flex: 1}}>
									<div style={{fontFamily: font, fontWeight: 800, fontSize: 40, color: C.text}}>{n}</div>
									<div style={{fontFamily: font, fontWeight: 800, fontSize: 28, color: C.dim, marginTop: 6}}>★★★★☆ · бесплатно</div>
								</div>
								<div style={{opacity: hit ? 1 : 0, transform: `scale(${hit ? 1 : 1.5})`}}>
									<Tag>{w}</Tag>
								</div>
							</Card>
						</Pop>
					);
				})}
			</div>
			<div
				style={{
					position: 'absolute',
					left: 60,
					right: 60,
					top: 330 + y * 186,
					height: 6,
					background: C.red,
					boxShadow: `0 0 30px ${C.red}, 0 0 80px ${C.red}`,
					opacity: y < 4 ? 1 : 0,
				}}
			/>
		</AbsoluteFill>
	);
};

const checks = ['Политика без логов', 'Современное шифрование', 'Честная цена'];

export const Check: React.FC<SP> = ({dur}) => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill>
			<DarkBg tint="61,255,138" />
			<Title top={200} size={72}>
				Нормальный VPN — это:
			</Title>
			<div style={{position: 'absolute', top: 420, left: 110, right: 110, display: 'flex', flexDirection: 'column', gap: 44}}>
				{checks.map((c, i) => {
					const d = dur * 0.3 + i * dur * 0.17;
					const on = interpolate(f, [d, d + 8], [0, 1], clamp);
					return (
						<Pop key={c} delay={i * 5}>
							<div style={{display: 'flex', alignItems: 'center', gap: 34}}>
								<div
									style={{
										width: 100,
										height: 100,
										borderRadius: 26,
										border: `5px solid ${on ? C.green : '#3a4260'}`,
										background: on ? `${C.green}22` : 'transparent',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										boxShadow: on ? `0 0 40px ${C.green}66` : 'none',
									}}
								>
									<svg width="60" height="60" viewBox="0 0 24 24">
										<path d="M4 12 L10 18 L20 6" stroke={C.green} strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="30" strokeDashoffset={30 * (1 - on)} />
									</svg>
								</div>
								<div style={{fontFamily: font, fontWeight: 900, fontSize: 56, color: on ? C.text : C.dim}}>{c}</div>
							</div>
						</Pop>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};

const stats = [
	['0', 'логов'],
	['10', 'Гбит/с'],
	['24/7', 'серверы'],
	['AI', 'помощник'],
];

export const Horz: React.FC<SP> = ({dur}) => {
	const f = useCurrentFrame();
	const logo = useSpring(0, 11, 120);
	const glow = 0.5 + 0.5 * Math.sin(f / 10);
	const flash = interpolate(f, [0, 8], [1, 0], clamp);
	return (
		<AbsoluteFill>
			<BrandBg />
			<div style={{position: 'absolute', top: 150, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
				<div
					style={{
						width: 400,
						height: 400,
						borderRadius: 100,
						background: 'linear-gradient(180deg,#ffffff,#e6f2ff)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						transform: `scale(${logo}) rotate(${(1 - logo) * -30}deg)`,
						boxShadow: `0 20px 80px rgba(0,60,200,0.45), 0 0 ${60 + 40 * glow}px rgba(255,255,255,0.8)`,
					}}
				>
					<Logo size={260} />
				</div>
				<Pop delay={10}>
					<div style={{fontFamily: font, fontWeight: 900, fontSize: 120, color: '#fff', marginTop: 40, letterSpacing: -3, textShadow: '0 8px 30px rgba(0,40,140,0.5)'}}>
						Horz VPN
					</div>
				</Pop>
			</div>
			<div style={{position: 'absolute', top: 820, left: 80, right: 80, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30}}>
				{stats.map(([b, s], i) => (
					<Pop key={s} delay={dur * 0.28 + i * dur * 0.15} from="scale">
						<div
							style={{
								background: 'rgba(255,255,255,0.92)',
								borderRadius: 36,
								padding: '34px 20px',
								textAlign: 'center',
								boxShadow: '0 16px 50px rgba(0,50,160,0.35)',
							}}
						>
							<div style={{fontFamily: font, fontWeight: 900, fontSize: 96, color: C.blue, lineHeight: 1}}>{b}</div>
							<div style={{fontFamily: font, fontWeight: 800, fontSize: 40, color: '#0b1b44', marginTop: 8}}>{s}</div>
						</div>
					</Pop>
				))}
			</div>
			<AbsoluteFill style={{background: '#fff', opacity: flash}} />
		</AbsoluteFill>
	);
};

export const Cta: React.FC<SP> = () => {
	const f = useCurrentFrame();
	const pulse = 1 + 0.05 * Math.sin(f / 5);
	const tap = interpolate(f, [60, 70, 76], [0, 1, 0.9], clamp);
	return (
		<AbsoluteFill>
			<BrandBg />
			<div style={{position: 'absolute', top: 160, width: '100%', textAlign: 'center'}}>
				<Pop>
					<div style={{fontFamily: font, fontWeight: 900, fontSize: 76, color: '#fff', lineHeight: 1.1, textShadow: '0 8px 30px rgba(0,40,140,0.5)'}}>
						Перестань быть
						<br />
						товаром
					</div>
				</Pop>
			</div>
			<div style={{position: 'absolute', top: 480, left: 90, right: 90}}>
				<Pop delay={6} from="scale">
					<div style={{background: 'rgba(255,255,255,0.96)', borderRadius: 48, padding: 48, boxShadow: '0 30px 90px rgba(0,50,160,0.45)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
						<div style={{width: 200, height: 200, borderRadius: 100, background: '#fff', boxShadow: '0 8px 30px rgba(0,60,200,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
							<Logo size={130} />
						</div>
						<div style={{fontFamily: font, fontWeight: 900, fontSize: 60, color: '#0b1b44'}}>Horz VPN</div>
						<div style={{display: 'flex', alignItems: 'center', gap: 16}}>
							<svg width="56" height="56" viewBox="0 0 24 24">
								<circle cx="12" cy="12" r="12" fill="#27a7e7" />
								<path d="M5.5 11.8 L17.5 7 L15.5 17.5 L11.6 14.6 L9.8 16.6 L10 13.5 L15.3 8.8 L8.6 12.8Z" fill="#fff" />
							</svg>
							<div style={{fontFamily: font, fontWeight: 900, fontSize: 64, color: C.blue}}>@horzvpnbot</div>
						</div>
						<div
							style={{
								marginTop: 16,
								transform: `scale(${pulse * (1 - 0.06 * tap)})`,
								background: 'linear-gradient(180deg,#3aa2ff,#0b5fe8)',
								color: '#fff',
								fontFamily: font,
								fontWeight: 900,
								fontSize: 52,
								padding: '30px 70px',
								borderRadius: 60,
								boxShadow: `0 14px 40px rgba(11,95,232,0.5), 0 0 ${30 * tap}px rgba(255,255,255,0.9)`,
							}}
						>
							Запустить бота
						</div>
					</div>
				</Pop>
			</div>
		</AbsoluteFill>
	);
};
