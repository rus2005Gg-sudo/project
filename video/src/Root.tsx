import React from 'react';
import {Composition} from 'remotion';
import {Welcome} from './Welcome';

export const Root: React.FC = () => (
	<Composition id="Welcome" component={Welcome} durationInFrames={150} fps={30} width={960} height={540} />
);
