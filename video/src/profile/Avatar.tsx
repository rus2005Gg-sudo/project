import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {LOGO} from '../apple/kit';

export const Avatar: React.FC = () => (
	<AbsoluteFill style={{background: 'radial-gradient(circle at 50% 35%, #ffffff 0%, #eef3fb 60%, #dfe8f7 100%)', alignItems: 'center', justifyContent: 'center'}}>
		<Img src={LOGO} style={{width: 560, filter: 'drop-shadow(0 30px 50px rgba(10,80,220,0.25))'}} />
	</AbsoluteFill>
);
