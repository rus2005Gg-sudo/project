import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import timeline from './timeline.json';
import {Call, Cta, Check, Forum, Hook, Horz, Logs, Market, Money, Scan} from './scenes';
import {Captions, Flash, Grain, SceneWrap, buildChunks} from '../common/fx';

const chunks = buildChunks(timeline.phrases);

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

export const Reel: React.FC = () => {
	const segs = timeline.segments;
	return (
		<AbsoluteFill style={{background: '#05060b', overflow: 'hidden'}}>
			{segs.map((s, i) => {
				const from = Math.round(s.start * FPS);
				const to = i + 1 < segs.length ? Math.round(segs[i + 1].start * FPS) : REEL_FRAMES;
				const Scene = scenes[s.id];
				return (
					<Sequence key={s.id} from={from} durationInFrames={to - from}>
						<SceneWrap dur={to - from} first={i === 0}>
							<Scene dur={to - from} />
						</SceneWrap>
						{i > 0 ? <Flash /> : null}
					</Sequence>
				);
			})}
			<Grain />
			<Captions chunks={chunks} />
			<Audio src={staticFile(timeline.voice)} volume={1} />
			<Audio src={staticFile('reel/music.wav')} volume={0.28} />
		</AbsoluteFill>
	);
};
