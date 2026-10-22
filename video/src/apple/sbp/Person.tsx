import React from 'react';
import * as THREE from 'three';
import {RoundedBox} from '@react-three/drei';

export type PoseP = {
	pos: [number, number, number];
	yaw: number;
	walk: number; // 0..1
	phase: number;
	phone: number; // 0..1 holding & tapping
	armsOut?: number;
	wave?: number;
	headYaw?: number;
	headPitch?: number;
	hop?: number; // jump height
	thumb?: number; // right arm up (thumbs up)
	t: number; // seconds, for idle breathing
};

type Look = {hoodie: string; pants?: string; skin?: string; cap?: string; decal?: THREE.Texture | null; phoneTex?: THREE.Texture | null};

const SKIN = '#f1c9a5';
const mat = (color: string, rough = 0.55) => <meshStandardMaterial color={color} roughness={rough} metalness={0.02} />;

/** capsule from a fixed bottom-anchored pivot (pivot is the TOP of the limb) */
const Limb: React.FC<{len: number; r: number; color: string}> = ({len, r, color}) => (
	<mesh position={[0, -len / 2, 0]} castShadow>
		<capsuleGeometry args={[r, len - r * 2, 6, 12]} />
		{mat(color)}
	</mesh>
);

export const Person: React.FC<PoseP & Look> = ({pos, yaw, walk, phase, phone, armsOut = 0, wave = 0, headYaw = 0, headPitch = 0, hop = 0, thumb = 0, t, hoodie, pants = '#1b2338', skin = SKIN, cap = '#0a0a0c', decal, phoneTex}) => {
	const s = Math.sin(phase);
	const c = Math.cos(phase);
	const bob = Math.abs(s) * 0.07 * walk;
	const breathe = Math.sin(t * 2.4) * 0.012 * (1 - walk);
	// legs
	const thighL = s * 0.85 * walk;
	const thighR = -s * 0.85 * walk;
	const kneeL = -Math.max(0, c) * 1.0 * walk;
	const kneeR = -Math.max(0, -c) * 1.0 * walk;
	// arms
	const swing = 0.7 * walk;
	const holding = phone;
	const tap = Math.sin(t * 14) * 0.05 * holding;
	const waveA = wave * (Math.sin(t * 9) * 0.35);
	const armL = -s * swing * (1 - armsOut) + armsOut * 0 + 0;
	const armR = s * swing * (1 - holding) * (1 - wave);
	const lean = 0.1 * walk;
	return (
		<group position={[pos[0], pos[1] + hop, pos[2]]} rotation={[0, yaw, 0]} scale={0.82}>
			<group position={[0, bob, 0]}>
				{/* hips */}
				<group position={[0, 0.98, 0]}>
					<mesh position={[0, 0.02, 0]} castShadow>
						<RoundedBox args={[0.5, 0.2, 0.32]} radius={0.09} smoothness={4}>
							{mat(pants)}
						</RoundedBox>
					</mesh>
					{/* legs */}
					<group position={[-0.16, 0, 0]} rotation={[thighL, 0, armsOut * -0.05]}>
						<Limb len={0.5} r={0.105} color={pants} />
						<group position={[0, -0.5, 0]} rotation={[kneeL, 0, 0]}>
							<Limb len={0.5} r={0.1} color={pants} />
							<mesh position={[0, -0.02, 0]} castShadow>
								<sphereGeometry args={[0.1, 12, 12]} />
								{mat(pants)}
							</mesh>
							<group position={[0, -0.57, -0.07]}>
								<RoundedBox args={[0.2, 0.13, 0.4]} radius={0.055} smoothness={4}>
									{mat('#f4f6fa', 0.4)}
								</RoundedBox>
								<mesh position={[0, -0.075, 0]}>
									<boxGeometry args={[0.205, 0.035, 0.41]} />
									<meshStandardMaterial color="#0a4dff" roughness={0.5} />
								</mesh>
							</group>
						</group>
					</group>
					<group position={[0.16, 0, 0]} rotation={[thighR, 0, armsOut * 0.05]}>
						<Limb len={0.5} r={0.105} color={pants} />
						<group position={[0, -0.5, 0]} rotation={[kneeR, 0, 0]}>
							<Limb len={0.5} r={0.1} color={pants} />
							<mesh position={[0, -0.02, 0]} castShadow>
								<sphereGeometry args={[0.1, 12, 12]} />
								{mat(pants)}
							</mesh>
							<group position={[0, -0.57, -0.07]}>
								<RoundedBox args={[0.2, 0.13, 0.4]} radius={0.055} smoothness={4}>
									{mat('#f4f6fa', 0.4)}
								</RoundedBox>
								<mesh position={[0, -0.075, 0]}>
									<boxGeometry args={[0.205, 0.035, 0.41]} />
									<meshStandardMaterial color="#0a4dff" roughness={0.5} />
								</mesh>
							</group>
						</group>
					</group>
					{/* torso */}
					<group rotation={[-lean, 0, 0]} position={[0, 0, 0]}>
						<mesh position={[0, 0.42 + breathe, 0]} castShadow>
							<capsuleGeometry args={[0.27, 0.42, 8, 16]} />
							{mat(hoodie, 0.7)}
						</mesh>
						{/* hood ring */}
						<mesh position={[0, 0.8, 0.02]} rotation={[Math.PI / 2, 0, 0]} castShadow>
							<torusGeometry args={[0.17, 0.07, 10, 20]} />
							{mat(hoodie, 0.75)}
						</mesh>
						{/* pocket */}
						<mesh position={[0, 0.2, -0.265]}>
							<RoundedBox args={[0.34, 0.14, 0.04]} radius={0.04} smoothness={3}>
								{mat('#ffffff', 0.7)}
							</RoundedBox>
						</mesh>
						{decal ? (
							<mesh position={[0, 0.5, 0.2735]}>
								<planeGeometry args={[0.36, 0.36]} />
								<meshBasicMaterial map={decal} transparent toneMapped={false} />
							</mesh>
						) : null}
						{/* left arm */}
						<group position={[-0.37, 0.72, 0]} rotation={[armL, 0, 0.1 + armsOut * 1.2]}>
							<Limb len={0.46} r={0.09} color={hoodie} />
							<group position={[0, -0.46, 0]} rotation={[0.15 + 0.25 * Math.max(0, -s) * walk, 0, 0]}>
								<Limb len={0.42} r={0.08} color={hoodie} />
								<mesh position={[0, -0.45, 0]} castShadow>
									<sphereGeometry args={[0.085, 12, 12]} />
									{mat(skin)}
								</mesh>
							</group>
						</group>
						{/* right arm: swing / hold phone / wave / thumbs */}
						<group position={[0.37, 0.72, 0]} rotation={[armR + holding * 1.15 + wave * 2.9 + thumb * 2.6, 0, -0.1 - armsOut * 1.2 - wave * 0.55 + waveA]}>
							<Limb len={0.46} r={0.09} color={hoodie} />
							<group position={[0, -0.46, 0]} rotation={[0.2 + holding * 0.9 + tap, 0, 0]}>
								<Limb len={0.42} r={0.08} color={hoodie} />
								<mesh position={[0, -0.45, 0]} castShadow>
									<sphereGeometry args={[0.085, 12, 12]} />
									{mat(skin)}
								</mesh>
								{holding > 0.05 ? (
									<group position={[0, -0.5, -0.1]} rotation={[0.5, 0, 0]} scale={holding}>
										<RoundedBox args={[0.2, 0.36, 0.035]} radius={0.03} smoothness={4}>
											<meshStandardMaterial color="#111" roughness={0.3} />
										</RoundedBox>
										<mesh position={[0, 0, -0.019]}>
											<planeGeometry args={[0.17, 0.32]} />
											<meshBasicMaterial map={phoneTex ?? undefined} color={phoneTex ? '#ffffff' : '#2a8cff'} toneMapped={false} side={THREE.DoubleSide} />
										</mesh>
									</group>
								) : null}
							</group>
						</group>
						{/* head */}
						<group position={[0, 1.02, 0]} rotation={[headPitch, headYaw, 0]}>
							<mesh castShadow>
								<sphereGeometry args={[0.27, 28, 28]} />
								{mat(skin, 0.6)}
							</mesh>
							{/* cap */}
							<mesh position={[0, 0.05, 0.015]} rotation={[0.1, 0, 0]} castShadow>
								<sphereGeometry args={[0.285, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.48]} />
								{mat(cap, 0.6)}
							</mesh>
							<mesh position={[0, 0.03, -0.27]} rotation={[0.15, 0, 0]} castShadow>
								<cylinderGeometry args={[0.15, 0.15, 0.03, 20, 1, false, 0, Math.PI]} />
								{mat(cap, 0.6)}
							</mesh>
							{/* eyes */}
							<mesh position={[-0.095, -0.01, -0.245]}>
								<sphereGeometry args={[0.04, 12, 12]} />
								<meshStandardMaterial color="#111" roughness={0.2} />
							</mesh>
							<mesh position={[0.095, -0.01, -0.245]}>
								<sphereGeometry args={[0.04, 12, 12]} />
								<meshStandardMaterial color="#111" roughness={0.2} />
							</mesh>
							{/* smile */}
							<mesh position={[0, -0.085, -0.252]} rotation={[0, 0, Math.PI]}>
								<torusGeometry args={[0.06, 0.011, 6, 14, Math.PI]} />
								<meshStandardMaterial color="#7a3b2a" roughness={0.6} />
							</mesh>
						</group>
					</group>
				</group>
			</group>
		</group>
	);
};
