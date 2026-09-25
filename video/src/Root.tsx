import React from 'react';
import {Composition} from 'remotion';
import {Welcome} from './Welcome';
import {FPS, REEL_FRAMES, Reel} from './reel/Reel';

export const Root: React.FC = () => (
	<>
		<Composition id="Welcome" component={Welcome} durationInFrames={150} fps={30} width={960} height={540} />
		<Composition id="Reel" component={Reel} durationInFrames={REEL_FRAMES} fps={FPS} width={1080} height={1920} />
	</>
);
