import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBox} from '@react-three/drei';
import {HALF_W, WALL_H, Z, groundY, orbPos, rnd} from './core';
import {BLUE, GREEN, drawAccount, drawBridgeBoard, drawLedger, drawSign, drawTV, drawTransfer, drawZeroSign, useDrawTex, drawBubble, drawCard, drawEnvelope} from './tex';

type V3 = [number, number, number];
const wallC = '#f6f7fb';

const B: React.FC<{p: V3; s: V3; c?: string; r?: number; e?: string; ei?: number; rot?: V3; cast?: boolean; rec?: boolean; metal?: number}> = ({p, s, c = wallC, r = 0.65, e, ei = 0, rot, cast = true, rec = true, metal = 0}) => (
	<mesh position={p} rotation={rot} castShadow={cast} receiveShadow={rec}>
		<boxGeometry args={s} />
		<meshStandardMaterial color={c} roughness={r} metalness={metal} emissive={e ?? '#000'} emissiveIntensity={ei} />
	</mesh>
);
const RB: React.FC<{p: V3; s: V3; c?: string; r?: number; rad?: number; rot?: V3}> = ({p, s, c = '#fff', r = 0.55, rad = 0.06, rot}) => (
	<mesh position={p} rotation={rot} castShadow receiveShadow>
		<RoundedBox args={s} radius={rad} smoothness={4}>
			<meshStandardMaterial color={c} roughness={r} />
		</RoundedBox>
	</mesh>
);

/** unlit textured plane (screens, signs) */
const Screen: React.FC<{p: V3; w: number; h: number; tex: THREE.Texture; rot?: V3; boost?: number}> = ({p, w, h, tex, rot, boost = 1}) => (
	<mesh position={p} rotation={rot}>
		<planeGeometry args={[w, h]} />
		<meshBasicMaterial map={tex} toneMapped={false} color={new THREE.Color(boost, boost, boost)} />
	</mesh>
);

const tileTex = (() => {
	let t: THREE.CanvasTexture | null = null;
	return () => {
		if (t) return t;
		const c = document.createElement('canvas');
		c.width = c.height = 256;
		const x = c.getContext('2d')!;
		x.fillStyle = '#ffffff';
		x.fillRect(0, 0, 256, 256);
		x.fillStyle = 'rgba(0,0,0,0.06)';
		x.fillRect(0, 0, 128, 128);
		x.fillRect(128, 128, 128, 128);
		x.strokeStyle = 'rgba(0,0,0,0.10)';
		x.lineWidth = 3;
		x.strokeRect(0, 0, 256, 256);
		t = new THREE.CanvasTexture(c);
		t.wrapS = t.wrapT = THREE.RepeatWrapping;
		t.colorSpace = THREE.SRGBColorSpace;
		t.anisotropy = 8;
		return t;
	};
})();

const Floor: React.FC<{z0: number; z1: number; color: string; x0?: number; x1?: number}> = ({z0, z1, color, x0 = -HALF_W, x1 = HALF_W}) => {
	const tex = useMemo(() => {
		const t = tileTex().clone();
		t.needsUpdate = true;
		t.repeat.set((x1 - x0) / 1.0, Math.abs(z0 - z1) / 1.0);
		return t;
	}, [z0, z1, x0, x1]);
	return (
		<mesh position={[(x0 + x1) / 2, -0.06, (z0 + z1) / 2]} receiveShadow>
			<boxGeometry args={[x1 - x0, 0.12, Math.abs(z0 - z1)]} />
			<meshStandardMaterial color={color} map={tex} roughness={0.5} />
		</mesh>
	);
};

/** wall with a tall door opening (camera can fly through) and a sign plaque on one pillar */
const OPEN_H = 2.85;
const DoorWall: React.FC<{z: number; side?: 'l' | 'r'; sign?: {label: string; sub: string | null; accent: string; icon: 'bank' | 'bridge' | 'tv' | 'house' | 'vault'}}> = ({z, side = 'r', sign}) => {
	const tex = useDrawTex(1080, 330, sign ? drawSign(sign.label, sign.sub, sign.accent, sign.icon) : () => undefined);
	return (
		<group>
			<B p={[-2.55, WALL_H / 2, z]} s={[3.0, WALL_H, 0.3]} />
			<B p={[2.55, WALL_H / 2, z]} s={[3.0, WALL_H, 0.3]} />
			<B p={[0, OPEN_H + (WALL_H - OPEN_H) / 2, z]} s={[2.1, WALL_H - OPEN_H, 0.3]} />
			{/* door frame */}
			<B p={[-1.07, OPEN_H / 2, z + 0.02]} s={[0.1, OPEN_H, 0.34]} c="#e3e7f1" />
			<B p={[1.07, OPEN_H / 2, z + 0.02]} s={[0.1, OPEN_H, 0.34]} c="#e3e7f1" />
			<B p={[0, OPEN_H + 0.03, z + 0.02]} s={[2.24, 0.1, 0.34]} c="#e3e7f1" />
			{sign ? <Screen p={[side === 'r' ? 2.55 : -2.55, 2.28, z + 0.17]} w={2.7} h={0.826} tex={tex} /> : null}
		</group>
	);
};

const Plant: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => (
	<group position={p} scale={s}>
		<mesh position={[0, 0.25, 0]} castShadow receiveShadow>
			<cylinderGeometry args={[0.22, 0.17, 0.5, 16]} />
			<meshStandardMaterial color="#e7ebf4" roughness={0.5} />
		</mesh>
		{[0, 1, 2, 3, 4].map((i) => (
			<mesh key={i} position={[Math.cos(i * 1.26) * 0.14, 0.78 + (i % 2) * 0.12, Math.sin(i * 1.26) * 0.14]} rotation={[0.25 * Math.sin(i), 0, 0.25 * Math.cos(i)]} castShadow>
				<sphereGeometry args={[0.2, 10, 10]} />
				<meshStandardMaterial color={i % 2 ? '#3aa86b' : '#2e9a5e'} roughness={0.7} />
			</mesh>
		))}
	</group>
);

const Lamp: React.FC<{p: V3; night: number}> = ({p, night}) => (
	<group position={p}>
		{night > 0.2 ? (
			<mesh>
				<sphereGeometry args={[0.1, 14, 14]} />
				<meshStandardMaterial color="#fff6d6" emissive="#ffd98a" emissiveIntensity={night * 3.2} roughness={0.4} />
			</mesh>
		) : null}
		<pointLight color="#ffd9a0" intensity={night * 9} distance={8} decay={2} />
	</group>
);

export const House: React.FC<{t: number; night: number}> = ({t, night}) => {
	const trans = useDrawTex(960, 920, drawTransfer(t), true);
	const tv = useDrawTex(960, 640, drawTV(t), true);
	const bridgeBoard = useDrawTex(1024, 440, drawBridgeBoard(t));
	const zero = useDrawTex(768, 288, drawZeroSign(t), true);
	const ledger = useDrawTex(960, 780, drawLedger(t), true);
	const accA = useDrawTex(768, 640, drawAccount('A', t), true);
	const accB = useDrawTex(768, 640, drawAccount('B', t), true);
	const sigBankA = useDrawTex(512, 160, drawSign('ТВОЙ БАНК', null, BLUE, 'bank'));
	const sigBankB = useDrawTex(512, 160, drawSign('БАНК ДРУГА', null, GREEN, 'bank'));
	const sigGrey = useDrawTex(512, 160, drawSign('БАНК', null, '#8a93a8', 'bank'));
	const water = useMemo(() => {
		const c = document.createElement('canvas');
		c.width = 256;
		c.height = 256;
		const x = c.getContext('2d')!;
		const g = x.createLinearGradient(0, 0, 0, 256);
		g.addColorStop(0, '#2e7bff');
		g.addColorStop(1, '#1559e6');
		x.fillStyle = g;
		x.fillRect(0, 0, 256, 256);
		x.strokeStyle = 'rgba(255,255,255,0.35)';
		x.lineWidth = 6;
		x.lineCap = 'round';
		for (let i = 0; i < 6; i++) {
			const y = i * 44 + 14;
			x.beginPath();
			x.moveTo(10, y);
			for (let k = 0; k <= 8; k++) x.lineTo(10 + k * 30, y + Math.sin(k * 1.3 + i) * 7);
			x.stroke();
		}
		const tx = new THREE.CanvasTexture(c);
		tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
		tx.repeat.set(3, 1.4);
		tx.colorSpace = THREE.SRGBColorSpace;
		return tx;
	}, []);
	water.offset.set(t * 0.08, t * 0.05);

	const L = Z.hallFront;
	const END = Z.r4[1];
	const mid = (a: number, b: number) => (a + b) / 2;

	/* bridge geometry */
	const N = 16;
	const deck = Array.from({length: N}).map((_, i) => {
		const z = Z.bridgeA + ((Z.bridgeB - Z.bridgeA) * (i + 0.5)) / N;
		const y = groundY(z) - 0.07;
		const dz = 0.05;
		const slope = Math.atan2(groundY(z - dz) - groundY(z + dz), 2 * dz); // y falls with -z
		return {z, y, slope};
	});
	const rail = useMemo(() => {
		const mk = (x: number) => {
			const pts = Array.from({length: 17}).map((_, i) => {
				const z = Z.bridgeA + ((Z.bridgeB - Z.bridgeA) * i) / 16;
				return new THREE.Vector3(x, groundY(z) + 0.95, z);
			});
			return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.045, 8, false);
		};
		return [mk(-1.25), mk(1.25)];
	}, []);

	/* orb */
	const op = orbPos(t);
	const orbOn = t >= 16.3 && t < 45.0;
	const trail = orbOn ? Array.from({length: 9}).map((_, k) => orbPos(Math.max(16.35, t - 0.05 * (k + 1)))) : [];
	const orbColor = t >= 39.3 && t < 42.3 ? '#27d17f' : '#4d8bff';

	return (
		<group>
			{/* base slab */}
			<mesh position={[0, -0.42, mid(L + 1, END - 1.5)]} receiveShadow>
				<boxGeometry args={[HALF_W * 2 + 2.6, 0.7, L - END + 3.4]} />
				<meshStandardMaterial color="#e9edf6" roughness={0.8} />
			</mesh>

			{/* ---- floors ---- */}
			<Floor z0={L} z1={Z.r1[0]} color="#f4efe6" />
			<Floor z0={Z.r1[0]} z1={Z.r1[1]} color="#cfdcff" />
			<Floor z0={Z.tv[0]} z1={Z.tv[1]} color="#efe6d8" />
			<Floor z0={Z.r2[0]} z1={Z.riverA} color="#dcd6ff" />
			<Floor z0={Z.riverB} z1={Z.r2[1]} color="#dcd6ff" />
			<Floor z0={Z.r3[0]} z1={Z.r3[1]} color="#d3f3e2" />
			<Floor z0={Z.r4[0]} z1={Z.r4[1]} color="#f1e7c9" />

			{/* ---- side walls (segmented, accent stripe) ---- */}
			{[
				[L, Z.r1[0], '#d9dee9'],
				[Z.r1[0], Z.r1[1], BLUE],
				[Z.tv[0], Z.tv[1], '#d9c9a8'],
				[Z.r2[0], Z.r2[1], '#6c4dff'],
				[Z.r3[0], Z.r3[1], GREEN],
				[Z.r4[0], Z.r4[1], '#c9a24a'],
			].map(([a, b, col], i) => (
				<group key={i}>
					{[-1, 1].map((sd) => (
						<group key={sd}>
							<B p={[sd * (HALF_W + 0.15), WALL_H / 2, mid(a as number, b as number)]} s={[0.3, WALL_H, Math.abs((a as number) - (b as number)) + 0.3]} />
							<B p={[sd * (HALF_W - 0.005), 0.28, mid(a as number, b as number)]} s={[0.02, 0.56, Math.abs((a as number) - (b as number))]} c={col as string} cast={false} />
							<B p={[sd * (HALF_W - 0.005), 0.04, mid(a as number, b as number)]} s={[0.04, 0.08, Math.abs((a as number) - (b as number))]} c="#cfd5e3" cast={false} />
						</group>
					))}
				</group>
			))}
			{/* back wall of the hall (front door side) */}
			<B p={[0, WALL_H / 2, L + 0.15]} s={[HALF_W * 2 + 0.6, WALL_H, 0.3]} />
			{/* ---- door walls ---- */}
			<DoorWall z={Z.r1[0]} side="r" sign={{label: 'ТВОЙ БАНК', sub: 'комната 1', accent: BLUE, icon: 'bank'}} />
			<DoorWall z={Z.r1[1]} />
			<DoorWall z={Z.tv[1]} side="r" sign={{label: 'СБП', sub: 'комната 2', accent: '#6c4dff', icon: 'bridge'}} />
			<DoorWall z={Z.r2[1]} side="r" sign={{label: 'БАНК ДРУГА', sub: 'комната 3', accent: GREEN, icon: 'bank'}} />
			<DoorWall z={Z.r3[1]} side="l" sign={{label: 'ЦЕНТРОБАНК', sub: 'комната 4', accent: '#c9a24a', icon: 'vault'}} />
			{/* end wall (vault) */}
			<B p={[0, WALL_H / 2, END - 0.15]} s={[HALF_W * 2 + 0.6, WALL_H, 0.3]} />

			{/* ================= HALL (start) ================= */}
			<B p={[0, 0.02, 0.6]} s={[2.6, 0.05, 3.2]} c="#2f4fb8" r={0.9} cast={false} />
			<B p={[0, 0.03, 0.6]} s={[2.3, 0.05, 2.9]} c="#e9efff" r={0.9} cast={false} />
			{/* front door (ajar), window with warm light */}
			<B p={[-2.0, 1.1, L - 0.02]} s={[1.3, 2.2, 0.08]} c="#8ea2d8" r={0.5} />
			<B p={[-2.0, 2.28, L - 0.02]} s={[1.5, 0.12, 0.12]} c="#e3e7f1" />
			<Screen p={[2.1, 1.7, L - 0.04]} w={1.6} h={1.3} tex={useDrawTex(256, 256, (ctx, w, h) => {
				const g = ctx.createLinearGradient(0, 0, 0, h);
				g.addColorStop(0, '#bfe0ff');
				g.addColorStop(1, '#fff3d0');
				ctx.fillStyle = g;
				ctx.fillRect(0, 0, w, h);
				ctx.fillStyle = 'rgba(255,255,255,0.9)';
				ctx.fillRect(w / 2 - 5, 0, 10, h);
				ctx.fillRect(0, h / 2 - 5, w, 10);
			})} rot={[0, Math.PI, 0]} />
			<B p={[2.1, 0.55, L - 0.2]} s={[1.9, 0.55, 0.45]} c="#d8c7a6" r={0.7} />
			<Plant p={[3.2, 0, L - 0.5]} s={1.1} />
			<RB p={[-3.4, 0.42, 1.2]} s={[0.7, 0.85, 0.7]} c="#d8c7a6" />
			<Lamp p={[0, 3.0, 0.5]} night={night} />

			{/* ================= R1: your bank ================= */}
			<Screen p={[-2.55, 1.35, Z.r1[1] + 0.2]} w={2.4} h={2.0} tex={trans} />
			<B p={[-2.55, 1.35, Z.r1[1] + 0.16]} s={[2.5, 2.1, 0.03]} c="#0b1330" cast={false} />
			{/* kiosk / ATM on the right */}
			<RB p={[2.6, 0.9, -10.6]} s={[1.3, 1.8, 0.8]} c="#e9eefc" rad={0.12} />
			<RB p={[2.6, 1.35, -10.18]} s={[1.0, 0.6, 0.05]} c="#0b1330" rad={0.04} />
			<B p={[2.6, 1.35, -10.14]} s={[0.9, 0.5, 0.01]} c="#2a8cff" e="#2a8cff" ei={0.8} cast={false} />
			<RB p={[2.6, 0.88, -10.15]} s={[0.9, 0.12, 0.2]} c="#cfd8f2" />
			<Plant p={[-3.4, 0, -5.2]} />
			<RB p={[3.2, 0.45, -5.6]} s={[0.9, 0.9, 0.9]} c="#dfe7ff" />
			<Lamp p={[0, 3.0, -8]} night={night} />

			{/* ================= HALL 2: TV + sofa ================= */}
			<Screen p={[-2.55, 1.6, Z.tv[1] + 0.22]} w={2.5} h={1.67} tex={tv} boost={1.08} />
			<B p={[-2.55, 1.6, Z.tv[1] + 0.17]} s={[2.62, 1.78, 0.04]} c="#10131c" cast={false} />
			<RB p={[-2.55, 0.32, Z.tv[1] + 0.4]} s={[2.6, 0.5, 0.5]} c="#2a2f3f" />
			{/* sofa */}
			<RB p={[-2.55, 0.38, -14.5]} s={[2.2, 0.5, 0.95]} c="#6c7fd1" rad={0.14} />
			<RB p={[-2.55, 0.78, -14.9]} s={[2.2, 0.7, 0.28]} c="#5b6fc4" rad={0.14} />
			<RB p={[-3.55, 0.55, -14.5]} s={[0.28, 0.7, 0.95]} c="#5b6fc4" rad={0.12} />
			<RB p={[-1.55, 0.55, -14.5]} s={[0.28, 0.7, 0.95]} c="#5b6fc4" rad={0.12} />
			<RB p={[2.7, 0.35, -14.2]} s={[0.9, 0.7, 0.9]} c="#f0e6d2" />
			<Plant p={[3.2, 0.7, -14.2]} s={0.6} />
			<Lamp p={[0, 2.6, -14]} night={night} />

			{/* ================= R2: SBP bridge ================= */}
			<B p={[0, -0.42, mid(Z.riverA, Z.riverB)]} s={[HALF_W * 2, 0.4, Math.abs(Z.riverA - Z.riverB)]} c="#14327a" rec />
			<mesh position={[0, -0.14, mid(Z.riverA, Z.riverB)]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
				<planeGeometry args={[HALF_W * 2, Math.abs(Z.riverA - Z.riverB)]} />
				<meshStandardMaterial map={water} roughness={0.25} metalness={0.1} emissive="#1a55e0" emissiveIntensity={0.25} />
			</mesh>
			<B p={[0, -0.04, Z.riverA + 0.05]} s={[HALF_W * 2, 0.24, 0.16]} c="#cdd3e6" />
			<B p={[0, -0.04, Z.riverB - 0.05]} s={[HALF_W * 2, 0.24, 0.16]} c="#cdd3e6" />
			{deck.map((d, i) => (
				<B key={i} p={[0, d.y, d.z]} s={[2.5, 0.14, 0.34]} c={i % 2 ? '#ffffff' : '#eef1fb'} rot={[d.slope, 0, 0]} />
			))}
			{rail.map((g, i) => (
				<mesh key={i} geometry={g} castShadow>
					<meshStandardMaterial color="#5b8cff" emissive="#2a6bff" emissiveIntensity={1.4} roughness={0.3} />
				</mesh>
			))}
			{[0, 4, 8, 12, 16].map((k) =>
				[-1.25, 1.25].map((x) => {
					const z = Z.bridgeA + ((Z.bridgeB - Z.bridgeA) * k) / 16;
					return <B key={`${k}${x}`} p={[x, groundY(z) + 0.45, z]} s={[0.07, 0.9, 0.07]} c="#dfe6fa" />;
				}),
			)}
			{/* banks */}
			<RB p={[-2.7, 0.95, -17.2]} s={[1.7, 1.9, 1.5]} c="#dfe6ff" rad={0.08} />
			<Screen p={[-2.7, 1.55, -16.44]} w={1.4} h={0.44} tex={sigBankA} />
			<RB p={[2.7, 0.75, -17.2]} s={[1.5, 1.5, 1.4]} c="#e6e9f2" rad={0.08} />
			<Screen p={[2.7, 1.3, -16.5]} w={1.2} h={0.38} tex={sigGrey} />
			
			<RB p={[2.7, 0.95, -23.8]} s={[1.7, 1.9, 1.5]} c="#d7f2e4" rad={0.08} />
			<Screen p={[2.7, 1.55, -23.04]} w={1.4} h={0.44} tex={sigBankB} />
			{/* the big СБП board over the bridge */}
			<B p={[-3.3, 0.9, -23.6]} s={[0.1, 1.8, 0.1]} c="#cfd5e3" />
			<B p={[-1.3, 0.9, -23.6]} s={[0.1, 1.8, 0.1]} c="#cfd5e3" />
			<B p={[-2.3, 2.15, -23.64]} s={[2.9, 1.28, 0.06]} c="#ffffff" />
			<Screen p={[-2.3, 2.15, -23.6]} w={2.8} h={1.2} tex={bridgeBoard} boost={1.05} />
			<Screen p={[1.85, 1.75, -20.9]} w={2.0} h={0.75} tex={zero} rot={[0, -0.55, 0]} />
			<B p={[1.85, 0.85, -20.93]} s={[0.07, 1.7, 0.07]} c="#cfd5e3" />
			<Lamp p={[0, 3.0, -20.5]} night={night} />

			{/* ================= R3: friend's bank ================= */}
			<Screen p={[2.55, 1.45, Z.r3[1] + 0.2]} w={2.4} h={1.95} tex={ledger} />
			<B p={[2.55, 1.45, Z.r3[1] + 0.16]} s={[2.5, 2.05, 0.03]} c="#0b1330" cast={false} />
			<RB p={[-2.7, 0.5, -31.9]} s={[2.0, 1.0, 0.8]} c="#e7f5ee" rad={0.1} />
			<RB p={[-2.7, 1.3, -32.0]} s={[0.9, 0.6, 0.06]} c="#10131c" rad={0.04} />
			<Plant p={[3.2, 0, -26.2]} />
			<Plant p={[-3.3, 0, -26.2]} s={0.9} />
			<Lamp p={[0, 3.0, -29]} night={night} />

			{/* ================= R4: central bank ================= */}
			{[-3.3, 3.3].flatMap((x) => [-35, -39].map((z) => (
				<mesh key={`${x}${z}`} position={[x, 1.6, z]} castShadow receiveShadow>
					<cylinderGeometry args={[0.28, 0.32, 3.2, 20]} />
					<meshStandardMaterial color="#efe6cf" roughness={0.45} />
				</mesh>
			)))}
			<mesh position={[0, 1.55, END + 0.02]} rotation={[Math.PI / 2, 0, 0]} castShadow>
				<cylinderGeometry args={[1.45, 1.45, 0.22, 48]} />
				<meshStandardMaterial color="#3a4256" metalness={0.7} roughness={0.28} />
			</mesh>
			<mesh position={[0, 1.55, END + 0.16]} rotation={[Math.PI / 2, 0, 0]}>
				<torusGeometry args={[1.2, 0.06, 10, 48]} />
				<meshStandardMaterial color="#c9a24a" metalness={0.8} roughness={0.25} />
			</mesh>
			{[0, 1, 2, 3, 4, 5].map((i) => (
				<mesh key={i} position={[Math.cos((i * Math.PI) / 3) * 0.55, 1.55 + Math.sin((i * Math.PI) / 3) * 0.55, END + 0.17]} rotation={[0, 0, (i * Math.PI) / 3]}>
					<boxGeometry args={[0.9, 0.08, 0.06]} />
					<meshStandardMaterial color="#c9a24a" metalness={0.8} roughness={0.25} />
				</mesh>
			))}
			<mesh position={[0, 1.55, END + 0.2]}>
				<sphereGeometry args={[0.28, 20, 20]} />
				<meshStandardMaterial color="#c9a24a" metalness={0.85} roughness={0.2} />
			</mesh>
			{[
				[-1.4, accA],
				[1.4, accB],
			].map(([x, tex]) => (
				<group key={x as number}>
					<B p={[x as number, 1.45, -40.0]} s={[2.1, 1.75, 0.08]} c="#0b1330" cast={false} />
					<Screen p={[x as number, 1.45, -39.95]} w={2.0} h={1.66} tex={tex as THREE.Texture} />
					<B p={[(x as number) - 0.8, 0.3, -40.0]} s={[0.1, 0.6, 0.1]} c="#c9a24a" metal={0.8} />
					<B p={[(x as number) + 0.8, 0.3, -40.0]} s={[0.1, 0.6, 0.1]} c="#c9a24a" metal={0.8} />
				</group>
			))}
			<Lamp p={[0, 3.0, -37]} night={night} />

			{/* ================= the payment request (orb) ================= */}
			{orbOn ? (
				<group>
					<mesh position={op}>
						<sphereGeometry args={[0.2, 20, 20]} />
						<meshBasicMaterial color={orbColor} toneMapped={false} />
					</mesh>
					<mesh position={op}>
						<sphereGeometry args={[0.32, 20, 20]} />
						<meshBasicMaterial color={orbColor} transparent opacity={0.25} toneMapped={false} />
					</mesh>
					<pointLight position={op} color={orbColor} intensity={6} distance={7} decay={2} />
					{trail.map((p, k) => (
						<mesh key={k} position={p}>
							<sphereGeometry args={[0.15 - k * 0.012, 10, 10]} />
							<meshBasicMaterial color={orbColor} transparent opacity={0.5 - k * 0.05} toneMapped={false} />
						</mesh>
					))}
				</group>
			) : null}
		</group>
	);
};

export {rnd};
export {drawBubble, drawCard, drawEnvelope};
