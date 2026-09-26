import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Character, Pose} from './Character';

const poses: [string, 'hero' | 'skinny', Pose][] = [
	['idle', 'hero', {l: {sh: 14, el: -12}, r: {sh: 14, el: -12}}],
	['flex', 'hero', {l: {sh: 95, el: 115}, r: {sh: 95, el: 115}, flex: 1, mouth: 'grin', glow: 1}],
	['press', 'hero', {l: {sh: 150, el: 20}, r: {sh: 150, el: 20}, mouth: 'grit', shades: true}],
	['skinny', 'skinny', {l: {sh: 8, el: 5}, r: {sh: 8, el: 5}}],
];

export const PoseTest: React.FC = () => (
	<AbsoluteFill style={{background: '#1b2036', flexDirection: 'row', flexWrap: 'wrap'}}>
		{poses.map(([n, b, p]) => (
			<div key={n} style={{width: 540, height: 960, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
				<Character build={b} pose={p} size={460} id={n} />
			</div>
		))}
	</AbsoluteFill>
);
