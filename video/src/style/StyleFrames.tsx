import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import '@fontsource/inter-tight/400.css';
import '@fontsource/inter-tight/500.css';
import '@fontsource/inter-tight/600.css';
import '@fontsource/inter-tight/700.css';
import '@fontsource/onest/300.css';
import '@fontsource/onest/400.css';
import '@fontsource/onest/500.css';
import '@fontsource/onest/600.css';

const IT = '"Inter Tight", sans-serif';
const ON = 'Onest, sans-serif';
const logo = staticFile('reel/logo.png');

const stats: [string, string][] = [
	['0', 'логов'],
	['10', 'Гбит/с'],
	['24/7', 'онлайн'],
];

/* ---------- A: Apple Light ---------- */
export const StyleA: React.FC = () => (
	<AbsoluteFill style={{background: 'linear-gradient(180deg,#fbfbfd 0%,#f2f3f7 100%)', fontFamily: IT, color: '#1d1d1f'}}>
		<div style={{position: 'absolute', top: 120, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16}}>
			<Img src={logo} style={{width: 44}} />
			<div style={{fontSize: 38, fontWeight: 600, letterSpacing: -0.5}}>Horz VPN</div>
		</div>
		<div style={{position: 'absolute', top: 330, width: '100%', display: 'flex', justifyContent: 'center'}}>
			<div
				style={{
					width: 400,
					height: 400,
					borderRadius: 96,
					background: 'linear-gradient(180deg,#ffffff,#f1f4fa)',
					boxShadow: '0 60px 120px rgba(20,40,90,0.16), 0 12px 30px rgba(20,40,90,0.08), inset 0 2px 0 #fff, inset 0 -6px 16px rgba(20,60,140,0.06)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<Img src={logo} style={{width: 250}} />
			</div>
		</div>
		<div style={{position: 'absolute', top: 850, left: 80, right: 80, textAlign: 'center'}}>
			<div style={{fontSize: 30, fontWeight: 500, color: '#0071e3', letterSpacing: 0.5}}>Подарок подписчикам</div>
			<div style={{fontSize: 104, fontWeight: 600, letterSpacing: -4, lineHeight: 1.04, marginTop: 18}}>
				Приватность.
				<br />
				<span style={{color: '#86868b', whiteSpace: 'nowrap'}}>Месяц бесплатно.</span>
			</div>
			<div style={{fontSize: 38, fontWeight: 400, color: '#6e6e73', marginTop: 34, lineHeight: 1.35}}>30 дней · 100 ГБ · 2 устройства</div>
		</div>
		<div style={{position: 'absolute', top: 1400, left: 120, right: 120, display: 'flex', justifyContent: 'space-between'}}>
			{stats.map(([n, l], i) => (
				<div key={l} style={{textAlign: 'center', flex: 1, borderLeft: i ? '1px solid #d2d2d7' : 'none'}}>
					<div style={{fontSize: 80, fontWeight: 600, letterSpacing: -3}}>{n}</div>
					<div style={{fontSize: 28, color: '#6e6e73', marginTop: 4}}>{l}</div>
				</div>
			))}
		</div>
		<div style={{position: 'absolute', top: 1660, width: '100%', display: 'flex', justifyContent: 'center'}}>
			<div style={{background: '#1d1d1f', color: '#fff', fontSize: 38, fontWeight: 500, padding: '28px 56px', borderRadius: 60}}>Открыть @horzvpnbot</div>
		</div>
	</AbsoluteFill>
);

/* ---------- B: Midnight Glass ---------- */
const GlassDark: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
	<div
		style={{
			background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
			border: '1px solid rgba(255,255,255,0.14)',
			borderRadius: 36,
			boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 30px 80px rgba(0,0,0,0.35)',
			...style,
		}}
	>
		{children}
	</div>
);

export const StyleB: React.FC = () => (
	<AbsoluteFill style={{background: '#04060d', fontFamily: IT, color: '#f5f7ff', overflow: 'hidden'}}>
		<div style={{position: 'absolute', width: 1300, height: 1300, left: 250, top: -520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,124,245,0.55), rgba(26,124,245,0) 60%)'}} />
		<div style={{position: 'absolute', width: 1100, height: 1100, left: -600, top: 1150, borderRadius: '50%', background: 'radial-gradient(circle, rgba(53,215,255,0.28), rgba(53,215,255,0) 60%)'}} />
		<svg width="1080" height="1920" style={{position: 'absolute'}}>
			<defs>
				<linearGradient id="bstreak" x1="0" x2="1">
					<stop offset="0" stopColor="#35d7ff" stopOpacity="0" />
					<stop offset="0.5" stopColor="#9fe6ff" stopOpacity="0.9" />
					<stop offset="1" stopColor="#1a7cf5" stopOpacity="0" />
				</linearGradient>
				<filter id="bglow"><feGaussianBlur stdDeviation="3" /></filter>
			</defs>
			{[0, 1, 2].map((i) => (
				<path key={i} d={`M-60 ${1660 + i * 26} C 300 ${1520 + i * 30}, 700 ${1840 - i * 20}, 1140 ${1600 + i * 34}`} stroke="url(#bstreak)" strokeWidth={i === 0 ? 3 : 1.4} fill="none" opacity={1 - i * 0.3} filter={i === 0 ? 'url(#bglow)' : undefined} />
			))}
		</svg>
		<AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '72px 72px', maskImage: 'radial-gradient(ellipse at 50% 30%, black 20%, transparent 70%)'}} />
		<div style={{position: 'absolute', top: 120, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16}}>
			<div style={{width: 64, height: 64, borderRadius: 18, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
				<Img src={logo} style={{width: 42}} />
			</div>
			<div style={{fontSize: 38, fontWeight: 600}}>Horz VPN</div>
		</div>
		<div style={{position: 'absolute', top: 430, width: '100%', display: 'flex', justifyContent: 'center'}}>
			<div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '14px 28px', borderRadius: 40, border: '1px solid rgba(127,208,255,0.35)', background: 'rgba(26,124,245,0.12)', fontSize: 28, fontWeight: 500, color: '#bfe6ff', letterSpacing: 1}}>
				<span style={{width: 12, height: 12, borderRadius: 6, background: '#35d7ff', boxShadow: '0 0 14px #35d7ff'}} />
				ПОДАРОК ПОДПИСЧИКАМ · 30 ДНЕЙ
			</div>
		</div>
		<div style={{position: 'absolute', top: 560, left: 60, right: 60, textAlign: 'center'}}>
			<div style={{fontSize: 104, fontWeight: 600, letterSpacing: -4, lineHeight: 1.04}}>
				Приватность
				<br />
				<span style={{background: 'linear-gradient(90deg,#7fd8ff,#3a8bff 60%,#8a7dff)', WebkitBackgroundClip: 'text', color: 'transparent', whiteSpace: 'nowrap'}}>без компромиссов</span>
			</div>
			<div style={{fontSize: 38, color: 'rgba(235,240,255,0.62)', marginTop: 36, lineHeight: 1.4}}>
				Месяц Horz VPN бесплатно.
				<br />
				Без логов. Без слежки.
			</div>
		</div>
		<div style={{position: 'absolute', top: 1060, left: 70, right: 70, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20}}>
			{stats.map(([n, l]) => (
				<GlassDark key={l} style={{padding: '40px 10px', textAlign: 'center'}}>
					<div style={{fontSize: 84, fontWeight: 600, letterSpacing: -3, lineHeight: 1}}>{n}</div>
					<div style={{fontSize: 28, color: 'rgba(235,240,255,0.55)', marginTop: 10}}>{l}</div>
				</GlassDark>
			))}
		</div>
		<div style={{position: 'absolute', top: 1400, width: '100%', display: 'flex', justifyContent: 'center'}}>
			<div style={{padding: 2, borderRadius: 60, background: 'linear-gradient(90deg,#35d7ff,#1a7cf5,#8a7dff)', boxShadow: '0 0 60px rgba(26,124,245,0.55)'}}>
				<div style={{background: '#0a1024', borderRadius: 58, padding: '28px 56px', fontSize: 40, fontWeight: 600}}>Забрать в @horzvpnbot →</div>
			</div>
		</div>
	</AbsoluteFill>
);

/* ---------- C: Aurora Editorial ---------- */
export const StyleC: React.FC = () => (
	<AbsoluteFill style={{background: '#f7f9fc', fontFamily: ON, color: '#0a1633', overflow: 'hidden'}}>
		<svg width="1080" height="1920" style={{position: 'absolute'}}>
			<defs>
				<linearGradient id="silk1" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor="#dff2ff" />
					<stop offset="0.45" stopColor="#5fb8ff" />
					<stop offset="1" stopColor="#0a55e0" />
				</linearGradient>
				<linearGradient id="silk2" x1="1" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
					<stop offset="1" stopColor="#8fd0ff" stopOpacity="0.2" />
				</linearGradient>
				<filter id="silkb"><feGaussianBlur stdDeviation="10" /></filter>
				<filter id="silks"><feGaussianBlur stdDeviation="2" /></filter>
			</defs>
			<path d="M-200 1380 C 150 1150, 450 1650, 760 1420 S 1200 1180, 1300 1300 L 1300 2000 L -200 2000 Z" fill="url(#silk1)" filter="url(#silkb)" opacity="0.95" />
			<path d="M-200 1480 C 200 1290, 500 1700, 820 1520 S 1200 1330, 1300 1420" stroke="url(#silk2)" strokeWidth="90" fill="none" filter="url(#silkb)" />
			{[0, 1, 2, 3, 4].map((i) => (
				<path key={i} d={`M-100 ${1430 + i * 22} C 220 ${1250 + i * 18}, 520 ${1680 - i * 10}, 820 ${1470 + i * 16} S 1180 ${1290 + i * 20}, 1250 ${1370 + i * 20}`} stroke="#ffffff" strokeWidth={i === 0 ? 3 : 1.2} fill="none" opacity={0.9 - i * 0.15} filter="url(#silks)" />
			))}
			<path d="M700 -100 C 900 200, 1150 150, 1200 420 L 1200 -100 Z" fill="url(#silk1)" opacity="0.35" filter="url(#silkb)" />
		</svg>
		<div style={{position: 'absolute', top: 120, left: 90, right: 90, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
			<div style={{display: 'flex', alignItems: 'center', gap: 14}}>
				<Img src={logo} style={{width: 46}} />
				<div style={{fontSize: 38, fontWeight: 600}}>
					Horz <span style={{color: '#0a55e0'}}>VPN</span>
				</div>
			</div>
			<div style={{fontSize: 22, letterSpacing: 6, color: '#6b7896', borderLeft: '2px solid #c9d3e6', paddingLeft: 18, lineHeight: 1.6}}>
				НА СВОЕЙ
				<br />
				ВОЛНЕ
			</div>
		</div>
		<div style={{position: 'absolute', top: 330, left: 90, right: 90}}>
			<div style={{width: 80, height: 4, background: '#0a55e0', borderRadius: 2}} />
			<div style={{display: 'flex', alignItems: 'flex-end', gap: 24, marginTop: 40}}>
				<div style={{fontSize: 400, fontWeight: 300, lineHeight: 0.8, letterSpacing: -20, background: 'linear-gradient(180deg,#1a8cff,#0a3fb8)', WebkitBackgroundClip: 'text', color: 'transparent'}}>30</div>
				<div style={{fontSize: 56, fontWeight: 500, lineHeight: 1.1, paddingBottom: 20}}>
					дней
					<br />в подарок
				</div>
			</div>
			<div style={{fontSize: 86, fontWeight: 600, letterSpacing: -3, lineHeight: 1.06, marginTop: 70, whiteSpace: 'nowrap'}}>
				Ваша приватность —
				<br />
				<span style={{color: '#0a55e0'}}>не товар.</span>
			</div>
			<div style={{fontSize: 36, color: '#5b6784', marginTop: 30, lineHeight: 1.4}}>Не собираем логи. Не продаём данные. Шифруем каждое подключение.</div>
			<div style={{display: 'flex', gap: 60, marginTop: 60}}>
				{stats.map(([n, l]) => (
					<div key={l}>
						<div style={{fontSize: 64, fontWeight: 600, letterSpacing: -2}}>{n}</div>
						<div style={{fontSize: 24, letterSpacing: 4, color: '#6b7896', textTransform: 'uppercase'}}>{l}</div>
					</div>
				))}
			</div>
		</div>
		<div style={{position: 'absolute', bottom: 150, left: 90, display: 'flex', alignItems: 'center', gap: 20, fontSize: 40, fontWeight: 600, color: '#fff'}}>
			@horzvpnbot
			<span style={{width: 64, height: 64, borderRadius: 32, background: '#fff', color: '#0a55e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36}}>→</span>
		</div>
	</AbsoluteFill>
);

export const StyleFrames: React.FC = () => (
	<AbsoluteFill style={{flexDirection: 'row', background: '#000', gap: 0}}>
		{[StyleA, StyleB, StyleC].map((S, i) => (
			<div key={i} style={{position: 'relative', width: 1080, height: 1920, overflow: 'hidden'}}>
				<S />
			</div>
		))}
	</AbsoluteFill>
);
