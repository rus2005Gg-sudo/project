import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import timeline from './timeline.json';
import {Call, Cta, Check, Forum, Hook, Horz, Logs, Market, Money, Scan} from './scenes';
import {clamp, font} from './ui';

export const FPS = 30;
export const REEL_FRAMES = Math.ceil(timeline.total * FPS);

const scenes: Record<string, React.FC<{dur: number}>> = {
	hook: Hook,
	forum: Forum,
	logs: Logs,
	money: Money,
	market: Market,
	call: Call,
	scan: Scan,
	check: Check,
	horz: Horz,
	cta: Cta,
};

const chunks = (text: string, start: number, dur: number) => {
	const words = text.split(' ');
	const out: {text: string; from: number; to: number}[] = [];
	const groups: string[] = [];
	for (let i = 0; i < words.length; ) {
		let g = words[i++];
		while (i < words.length && g.split(' ').length < 3 && (g + ' ' + words[i]).length <= 22 && !/[.?!:]$/.test(g)) g += ' ' + words[i++];
		while (i < words.length && g.split(' ').pop()!.length <= 2) g += ' ' + words[i++];
		groups.push(g);
	}
	const total = groups.reduce((a, g) => a + g.length + 3, 0);
	let t = start;
	for (const g of groups) {
		const d = ((g.length + 3) / total) * dur;
		out.push({text: g, from: t, to: t + d});
		t += d;
	}
	return out;
};

const allChunks = timeline.segments.flatMap((s) => chunks(s.caption, s.start, s.dur));

const Captions: React.FC = () => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = f / fps;
	const c = allChunks.find((x) => t >= x.from && t < x.to + 0.12);
	if (!c) return null;
	const local = f - c.from * fps;
	const p = spring({frame: local, fps, config: {damping: 12, stiffness: 220}});
	const key = /VPN|логи|данн|товар|@horzvpnbot|Horz|продал|мошенник/i.test(c.text);
	return (
		<div style={{position: 'absolute', top: 1440, left: 60, right: 60, display: 'flex', justifyContent: 'center'}}>
			<div
				style={{
					fontFamily: font,
					fontWeight: 900,
					fontSize: 76,
					lineHeight: 1.1,
					textAlign: 'center',
					color: key ? '#ffe14d' : '#ffffff',
					transform: `scale(${0.8 + 0.2 * p})`,
					opacity: interpolate(local, [0, 3], [0, 1], clamp),
					textShadow: '0 0 4px #000, 0 6px 0 rgba(0,0,0,0.85), 0 0 30px rgba(0,0,0,0.8)',
					WebkitTextStroke: '3px #000',
					paintOrder: 'stroke fill',
				}}
			>
				{c.text}
			</div>
		</div>
	);
};

export const Reel: React.FC = () => {
	const segs = timeline.segments;
	return (
		<AbsoluteFill style={{background: '#05060b'}}>
			{segs.map((s, i) => {
				const from = Math.round(s.start * FPS);
				const to = i + 1 < segs.length ? Math.round(segs[i + 1].start * FPS) : REEL_FRAMES;
				const Scene = scenes[s.id];
				return (
					<Sequence key={s.id} from={from} durationInFrames={to - from}>
						<Scene dur={to - from} />
					</Sequence>
				);
			})}
			{segs.map((s) => (
				<Sequence key={'a' + s.id} from={Math.round(s.start * FPS)}>
					<Audio src={staticFile(s.file)} volume={1} />
				</Sequence>
			))}
			<Audio src={staticFile('reel/music.wav')} volume={0.35} />
			<Captions />
		</AbsoluteFill>
	);
};
