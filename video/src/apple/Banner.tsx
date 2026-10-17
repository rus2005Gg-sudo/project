import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {AppIcon, Drift, INOUT, OUT, blurZoom, clamp, prog} from './kit';
import {HZ, HZ_BG, HZ_BLUE, HZ_INK} from './brand';
import {ICONS} from './BotWelcome';

const TR = 14;
// voice-synced: scene boundaries follow the spoken words
const VOICE = 9.87;
const BS = [0, 1.42, 2.72, 6.72];
const BANNER_END = Math.round((VOICE + 0.6) * 30);
const D = BS.map((s, i) => (i < BS.length - 1 ? Math.round(BS[i + 1] * 30) : BANNER_END) - Math.round(s * 30));
export const BANNER_FRAMES = BANNER_END;
const RED = '#ff3b30';
const GREEN = '#22b45a';
const AppleBg: React.FC<{glow?: string}> = ({glow}) => (
	<AbsoluteFill style={{background: HZ_BG}}>
		{glow ? <AbsoluteFill style={{background: `radial-gradient(circle at 50% 0%, rgba(${glow},0.12), rgba(${glow},0) 55%)`}} /> : null}
	</AbsoluteFill>
);

/** heavy headline that slides up out of blur */
const Lines: React.FC<{at: number; size: number; lines: string[]; colors?: string[]; align?: 'left' | 'center'}> = ({at: a, size, lines, colors = [], align = 'center'}) => {
	const f = useCurrentFrame();
	return (
		<div style={{textAlign: align}}>
			{lines.map((l, i) => {
				const p = interpolate(f - a - i * 5, [0, 14], [0, 1], {...clamp, easing: OUT});
				return (
					<div key={i} style={{fontFamily: HZ, fontWeight: 900, fontSize: size, lineHeight: 1.04, letterSpacing: -size * 0.035, color: colors[i] ?? HZ_INK, whiteSpace: 'nowrap', opacity: p, translate: `0 ${(1 - p) * 40}px`, filter: p < 0.99 ? `blur(${(1 - p) * 10}px)` : undefined}}>
						{l}
					</div>
				);
			})}
		</div>
	);
};
const Rise: React.FC<{at: number; dist?: number; children: React.ReactNode}> = ({at: a, dist = 30, children}) => {
	const f = useCurrentFrame();
	const p = interpolate(f - a, [0, 16], [0, 1], {...clamp, easing: OUT});
	return <div style={{opacity: p, translate: `0 ${(1 - p) * dist}px`}}>{children}</div>;
};
const BlackPill: React.FC<{style?: React.CSSProperties; children: React.ReactNode}> = ({style, children}) => (
	<div style={{background: HZ_INK, color: '#fff', fontFamily: HZ, borderRadius: 100, letterSpacing: -1, whiteSpace: 'nowrap', ...style}}>{children}</div>
);

const Center: React.FC<{children: React.ReactNode; gap?: number}> = ({children, gap = 70}) => (
	<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap}}>{children}</AbsoluteFill>
);

// 1 — «Не работают соцсети?» + blocked app icons
const S1: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<Drift dur={D[0] + TR}>
			<AppleBg glow="255,59,48" />
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 46}}>
				<Lines at={2} size={112} lines={['Не работают соцсети?']} colors={[HZ_INK]} />
				<div style={{display: 'flex', gap: 30}}>
					{ICONS.map((ic, i) => {
						const p = prog(f, 8 + i * 2, 10);
						const x = prog(f, 17 + i * 2, 8);
						return (
							<div key={i} style={{position: 'relative', width: 130, height: 130, opacity: p, translate: `0 ${(1 - p) * 30 + Math.sin(f / 4 + i) * (x > 0.5 ? 2 : 0)}px`}}>
								<div style={{width: '100%', height: '100%', borderRadius: 34, background: ic.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', filter: `grayscale(${x})`, opacity: 1 - x * 0.4, boxShadow: '0 14px 30px rgba(20,40,90,0.12)'}}>{ic.glyph}</div>
								<div style={{position: 'absolute', right: -10, top: -10, width: 48, height: 48, borderRadius: 24, border: '4px solid #fff', background: RED, color: '#fff', fontFamily: HZ, fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: x, scale: String(interpolate(x, [0, 0.6, 1], [0.3, 1.15, 1]))}}>✕</div>
							</div>
						);
					})}
				</div>
			</AbsoluteFill>
		</Drift>
	);
};

// 2 — «Глушат интернет?» signal bars collapsing
const S2: React.FC = () => {
	const f = useCurrentFrame();
	const drop = prog(f, 8, 24, INOUT);
	return (
		<Drift dur={D[1] + TR}>
			<AppleBg glow="255,59,48" />
			<Center>
				<div style={{display: 'flex', alignItems: 'flex-end', gap: 22, height: 300}}>
					{[0.3, 0.5, 0.75, 1].map((h, i) => {
						const alive = drop < (4 - i) / 4 - 0.05 || i === 0;
						return <div key={i} style={{width: 64, height: 300 * h, borderRadius: 16, background: alive ? (drop > 0.5 ? RED : HZ_INK) : '#d1d1d6', opacity: alive ? 1 : 0.6}} />;
					})}
				</div>
				<div>
					<Lines at={1} size={130} align="left" lines={['Глушат', 'интернет?']} colors={[HZ_INK, RED]} />
				</div>
			</Center>
		</Drift>
	);
};

// 3 — Horz VPN: 3 days free (+ whitelists)
const S3: React.FC = () => (
	<Drift dur={D[2] + TR}>
		<AppleBg />
		<Center gap={60}>
			<AppIcon size={300} at={0} />
			<div>
				<Lines at={1} size={70} align="left" lines={['Horz VPN']} colors={[HZ_BLUE]} />
				<div style={{display: 'flex', alignItems: 'baseline', gap: 24}}>
					<Rise at={34} dist={40}>
						<div style={{fontFamily: HZ, fontSize: 250, fontWeight: 900, color: HZ_INK, letterSpacing: -12, lineHeight: 1}}>3</div>
					</Rise>
					<Lines at={38} size={100} align="left" lines={['дня', 'бесплатно']} colors={[HZ_INK, HZ_BLUE]} />
				</div>
				<Rise at={76} dist={20}>
					<div style={{display: 'inline-flex', alignItems: 'center', gap: 14, marginTop: 16, background: GREEN, color: '#fff', fontFamily: HZ, fontSize: 38, fontWeight: 800, padding: '12px 28px', borderRadius: 30}}>✓ Белые списки — есть</div>
				</Rise>
			</div>
		</Center>
	</Drift>
);

// 4 — CTA «Переходи и забирай»
const S4: React.FC = () => {
	const f = useCurrentFrame();
	const tap = (at: number) => interpolate(f - at, [0, 5, 14], [1, 0.93, 1], clamp);
	const ring = (at: number) => {
		const p = prog(f, at, 26);
		return p > 0 && p < 1 ? <div style={{position: 'absolute', inset: -12, borderRadius: 100, border: `4px solid ${HZ_BLUE}`, opacity: 1 - p, scale: String(1 + p * 0.25)}} /> : null;
	};
	return (
		<Drift dur={D[3]}>
			<AppleBg />
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 30}}>
				<Lines at={2} size={104} lines={['Переходи и забирай']} colors={[HZ_INK]} />
				<Rise at={22} dist={40}>
					<div style={{position: 'relative', scale: String(tap(28) * tap(52))}}>
						{ring(30)}
						{ring(54)}
						<BlackPill style={{fontSize: 64, fontWeight: 800, padding: '30px 80px', borderRadius: 100}}>3 дня бесплатно →</BlackPill>
					</div>
				</Rise>
				<Rise at={44} dist={24}>
					<div style={{fontFamily: HZ, fontWeight: 900, fontSize: 76, color: HZ_BLUE, letterSpacing: -2}}>@horzvpnbot</div>
				</Rise>
			</AbsoluteFill>
		</Drift>
	);
};

const SCENES = [S1, S2, S3, S4];

export const Banner: React.FC = () => (
	<AbsoluteFill style={{background: '#fbfbfd'}}>
		<TransitionSeries>
			{SCENES.map((S, i) => (
				<React.Fragment key={i}>
					{i > 0 ? <TransitionSeries.Transition presentation={blurZoom() as never} timing={linearTiming({durationInFrames: TR, easing: INOUT})} /> : null}
					<TransitionSeries.Sequence durationInFrames={D[i] + (i < SCENES.length - 1 ? TR : 0)}>
						<S />
					</TransitionSeries.Sequence>
				</React.Fragment>
			))}
		</TransitionSeries>
		<Audio src={staticFile('banner/voice.mp3')} />
	</AbsoluteFill>
);
