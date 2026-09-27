import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {ACCENT, AppIcon, AppleBg, BlackPill, Count, Drift, Eyebrow, GRAY, INK, INOUT, IT, Lines, Lockup, Rise, blurZoom, clamp, prog} from './kit';

const TR = 16;
const D = [66, 84, 120];
export const BANNER_FRAMES = D.reduce((a, b) => a + b, 0);

const Center: React.FC<{children: React.ReactNode}> = ({children}) => (
	<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 70}}>{children}</AbsoluteFill>
);

// 1 — icon + "раздаёт подписки"
const S1: React.FC = () => (
	<Drift dur={D[0] + TR}>
		<AppleBg />
		<Center>
			<AppIcon size={300} at={0} />
			<div>
				<Rise at={10} dist={16}><div style={{fontFamily: IT, fontSize: 38, fontWeight: 500, color: ACCENT}}>Horz VPN раздаёт</div></Rise>
				<div style={{height: 16}} />
				<Lines at={16} size={110} align="left" lines={['подписки', 'бесплатно']} colors={[INK, ACCENT]} />
			</div>
		</Center>
	</Drift>
);

// 2 — big 30
const S2: React.FC = () => {
	const f = useCurrentFrame();
	const bar = prog(f, 8, 44, INOUT);
	return (
		<Drift dur={D[1] + TR}>
			<AppleBg />
			<Center>
				<Rise at={0} dist={60}>
					<div style={{fontFamily: IT, fontSize: 360, fontWeight: 700, color: INK, letterSpacing: -18, lineHeight: 1}}>
						<Count to={30} at={4} dur={40} />
					</div>
				</Rise>
				<div>
					<Lines at={14} size={110} align="left" lines={['дней', 'бесплатно']} colors={[INK, ACCENT]} />
					<div style={{width: 460, height: 10, borderRadius: 10, background: '#e5e5ea', marginTop: 40, overflow: 'hidden'}}>
						<div style={{width: `${bar * 100}%`, height: '100%', borderRadius: 10, background: `linear-gradient(90deg,${ACCENT},#5ac8fa)`}} />
					</div>
				</div>
			</Center>
		</Drift>
	);
};

// 3 — CTA: ищи в Telegram
const S3: React.FC = () => {
	const f = useCurrentFrame();
	const tap = (at: number) => interpolate(f - at, [0, 5, 14], [1, 0.93, 1], clamp);
	const pillScale = tap(50) * tap(86);
	const ring = (at: number) => {
		const p = prog(f, at, 26);
		return p > 0 && p < 1 ? (
			<div style={{position: 'absolute', inset: -10, borderRadius: 80, border: `3px solid ${ACCENT}`, opacity: 1 - p, scale: String(1 + p * 0.25)}} />
		) : null;
	};
	return (
		<Drift dur={D[2]}>
			<AppleBg />
			<Center>
				<AppIcon size={200} at={0} />
				<div>
					<Lines at={10} size={96} align="left" lines={['Ищи в', 'Telegram']} colors={[INK, ACCENT]} />
				</div>
				<Rise at={24} dist={40}>
					<div style={{position: 'relative', scale: String(pillScale)}}>
						{ring(52)}
						{ring(88)}
						<BlackPill style={{fontSize: 54, fontWeight: 600, padding: '34px 64px', borderRadius: 80}}>@horzvpnbot</BlackPill>
					</div>
				</Rise>
			</Center>
		</Drift>
	);
};

export const Banner: React.FC = () => (
	<AbsoluteFill style={{background: '#fbfbfd'}}>
		<TransitionSeries>
			{[S1, S2, S3].map((S, i) => (
				<React.Fragment key={i}>
					{i > 0 ? <TransitionSeries.Transition presentation={blurZoom() as never} timing={linearTiming({durationInFrames: TR, easing: INOUT})} /> : null}
					<TransitionSeries.Sequence durationInFrames={D[i] + (i < 2 ? TR : 0)}>
						<S />
					</TransitionSeries.Sequence>
				</React.Fragment>
			))}
		</TransitionSeries>
	</AbsoluteFill>
);
