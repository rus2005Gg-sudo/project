import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import timeline from './timeline.json';
import {Always, Cta, Enter, Fail, Fight, Hook, Leak, Lift, Meet, NoLogs} from './scenes';
import {Captions, Flash, Grain, SceneWrap, buildChunks} from '../common/fx';

export const GYM_FPS = 30;
export const GYM_FRAMES = Math.ceil(timeline.total * GYM_FPS);

const scenes: Record<string, React.FC<{dur: number}>> = {
	hook: Hook,
	meet: Meet,
	fail: Fail,
	leak: Leak,
	horz: Enter,
	lift: Lift,
	always: Always,
	fight: Fight,
	nologs: NoLogs,
	cta: Cta,
};

const chunks = buildChunks(timeline.phrases);

export const Gym: React.FC = () => {
	const segs = timeline.segments;
	return (
		<AbsoluteFill style={{background: '#05060b', overflow: 'hidden'}}>
			{segs.map((s, i) => {
				const from = Math.round(s.start * GYM_FPS);
				const to = i + 1 < segs.length ? Math.round(segs[i + 1].start * GYM_FPS) : GYM_FRAMES;
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
			<Captions chunks={chunks} top={1480} />
			<Audio src={staticFile(timeline.voice)} volume={1} />
			<Audio src={staticFile('gym/music.wav')} volume={0.3} />
		</AbsoluteFill>
	);
};
