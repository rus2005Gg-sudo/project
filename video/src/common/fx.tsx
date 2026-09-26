import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, font} from '../reel/ui';

type Word = {w: string; from: number; to: number};
export type Chunk = {words: Word[]; from: number; to: number};

const weight = (w: string) => Math.max(1, (w.match(/[аеёиоуыэюяaeiou0-9]/gi) || []).length) + 0.6;

export const buildChunks = (phrases: {text: string; start: number; end: number}[]): Chunk[] => {
	const out: Chunk[] = [];
	for (const p of phrases) {
		const words = p.text.split(' ');
		const total = words.reduce((a, w) => a + weight(w), 0);
		let t = p.start;
		const timed: Word[] = words.map((w) => {
			const d = (weight(w) / total) * (p.end - p.start);
			const r = {w, from: t, to: t + d};
			t += d;
			return r;
		});
		for (let i = 0; i < timed.length; ) {
			const g: Word[] = [timed[i++]];
			const len = () => g.map((x) => x.w).join(' ').length;
			while (i < timed.length && g.length < 3 && len() + timed[i].w.length < 22 && !/[.?!:—]$/.test(g[g.length - 1].w)) g.push(timed[i++]);
			while (i < timed.length && g[g.length - 1].w.length <= 2) g.push(timed[i++]);
			out.push({words: g, from: g[0].from, to: g[g.length - 1].to});
		}
	}
	return out;
};

export const KEY = /VPN|дрищ|Хорз|качок|Гбит|24\/7|логов|логи|данн|товар|@horzvpnbot|Horz|продал|мошенник|форум|бесплатн|Стоп/i;

export const Captions: React.FC<{chunks: Chunk[]; top?: number}> = ({chunks, top = 1430}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = f / fps;
	const c = chunks.find((x, i) => t >= x.from && t < (chunks[i + 1] ? Math.min(chunks[i + 1].from, x.to + 0.6) : x.to + 0.6));
	if (!c) return null;
	const local = f - c.from * fps;
	const p = spring({frame: local, fps, config: {damping: 12, stiffness: 240}});
	return (
		<div style={{position: 'absolute', top, left: 50, right: 50, display: 'flex', justifyContent: 'center'}}>
			<div
				style={{
					fontFamily: font,
					fontWeight: 900,
					fontSize: 78,
					lineHeight: 1.12,
					textAlign: 'center',
					transform: `scale(${0.82 + 0.18 * p}) translateY(${(1 - p) * 20}px)`,
					opacity: interpolate(local, [0, 2], [0, 1], clamp),
				}}
			>
				{c.words.map((w, i) => {
					const active = t >= w.from && t < w.to + 0.05;
					const spoken = t >= w.from;
					return (
						<span
							key={i}
							style={{
								color: active ? (KEY.test(w.w) ? '#ff3d6a' : '#ffe14d') : KEY.test(w.w) ? '#ffe14d' : '#ffffff',
								opacity: spoken ? 1 : 0.55,
								WebkitTextStroke: '10px #000',
								paintOrder: 'stroke fill',
								textShadow: '0 8px 24px rgba(0,0,0,0.7)',
								display: 'inline-block',
								transform: `scale(${active ? 1.08 : 1})`,
								margin: '0 18px',
							}}
						>
							{w.w}
						</span>
					);
				})}
			</div>
		</div>
	);
};

export const SceneWrap: React.FC<{dur: number; children: React.ReactNode; first: boolean}> = ({dur, children, first}) => {
	const f = useCurrentFrame();
	const push = interpolate(f, [0, dur], [1, 1.07], clamp);
	const enter = first ? 1 : interpolate(f, [0, 7], [0, 1], {...clamp});
	const zoomIn = 1 + (1 - enter) * 0.25;
	const blur = (1 - enter) * 18;
	const exit = interpolate(f, [dur - 5, dur], [0, 1], clamp);
	return (
		<AbsoluteFill style={{transform: `scale(${push * zoomIn * (1 + exit * 0.12)})`, filter: blur > 0.3 || exit > 0 ? `blur(${blur + exit * 10}px)` : undefined}}>
			{children}
		</AbsoluteFill>
	);
};

export const Flash: React.FC = () => {
	const f = useCurrentFrame();
	const o = interpolate(f, [0, 2, 8], [0, 0.55, 0], clamp);
	return <AbsoluteFill style={{background: '#fff', opacity: o, mixBlendMode: 'screen'}} />;
};

export const Grain: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<svg width="1080" height="1920" style={{position: 'absolute', opacity: 0.09, mixBlendMode: 'overlay'}}>
				<filter id="gr">
					<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 12} />
				</filter>
				<rect width="1080" height="1920" filter="url(#gr)" />
			</svg>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)'}} />
		</AbsoluteFill>
	);
};

