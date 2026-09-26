import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Robot} from './Robot';

export const RobotTest: React.FC = () => (
	<AbsoluteFill style={{background: 'linear-gradient(180deg,#f4f8ff,#d9e8ff)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around'}}>
		<Robot id="a" size={460} pose={{}} />
		<Robot id="b" size={460} pose={{armR: 150, wave: 20, tilt: -8, eyes: 'round'}} />
	</AbsoluteFill>
);
