import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {Environment, Lightformer, RoundedBox} from '@react-three/drei';
import * as THREE from 'three';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';

/** glossy silk ribbon: a flat band swept along a curve */
const Ribbon: React.FC<{color: string; t: number}> = ({color, t}) => {
	const geo = useMemo(() => {
		const pts = Array.from({length: 9}).map((_, i) => new THREE.Vector3(-4 + i, Math.sin(i * 0.9) * 0.9, Math.cos(i * 0.7) * 0.6));
		const curve = new THREE.CatmullRomCurve3(pts);
		const n = 200;
		const w = 0.55;
		const pos: number[] = [];
		const idx: number[] = [];
		for (let i = 0; i <= n; i++) {
			const u = i / n;
			const p = curve.getPointAt(u);
			const tan = curve.getTangentAt(u);
			const twist = u * Math.PI * 1.6;
			const side = new THREE.Vector3(0, Math.cos(twist), Math.sin(twist)).cross(tan).normalize().multiplyScalar(w);
			pos.push(p.x + side.x, p.y + side.y, p.z + side.z, p.x - side.x, p.y - side.y, p.z - side.z);
			if (i < n) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
		}
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
		g.setIndex(idx);
		g.computeVertexNormals();
		return g;
	}, []);
	return (
		<mesh geometry={geo} rotation={[0.3, t * 0.4, 0.2]}>
			<meshPhysicalMaterial color={color} metalness={0.2} roughness={0.15} clearcoat={1} clearcoatRoughness={0.05} side={THREE.DoubleSide} />
		</mesh>
	);
};

export const ThreeTest: React.FC = () => {
	const f = useCurrentFrame();
	const {width, height} = useVideoConfig();
	const t = f / 30;
	return (
		<AbsoluteFill style={{background: '#02040b'}}>
			<ThreeCanvas width={width} height={height} camera={{position: [0, 0, 7], fov: 35}} gl={{antialias: true}}>
				<Environment resolution={256}>
					<Lightformer intensity={4} position={[0, 4, 3]} scale={[10, 2, 1]} />
					<Lightformer intensity={2} color="#5b8cff" position={[-5, 0, 2]} scale={[2, 6, 1]} />
					<Lightformer intensity={2} position={[5, -1, 2]} scale={[2, 6, 1]} />
				</Environment>
				<ambientLight intensity={0.3} />
				<group position={[-1.5, 0.5, 0]}>
					<Ribbon color="#0a4dff" t={t} />
				</group>
				<RoundedBox args={[1.6, 1.6, 0.5]} radius={0.35} smoothness={6} position={[2.2, -0.2, 0]} rotation={[0.2, -0.5 + t * 0.3, -0.1]}>
					<meshPhysicalMaterial color="#ffffff" roughness={0.25} clearcoat={1} />
				</RoundedBox>
			</ThreeCanvas>
		</AbsoluteFill>
	);
};
