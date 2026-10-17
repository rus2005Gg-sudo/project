import React, {useEffect, useMemo, useState} from 'react';
import '@fontsource/montserrat/800-italic.css';
import '@fontsource/montserrat/900-italic.css';
import '@fontsource/manrope/800.css';
import {ThreeCanvas} from '@remotion/three';
import {Environment, Lightformer, RoundedBox} from '@react-three/drei';
import {Bloom, ChromaticAberration, EffectComposer, Noise, ToneMapping, Vignette} from '@react-three/postprocessing';
import {ToneMappingMode} from 'postprocessing';
import {noise2D} from '@remotion/noise';
import * as THREE from 'three';
import {AbsoluteFill, Img, continueRender, delayRender, interpolate, spring, useCurrentFrame} from 'remotion';
import {LOGO, clamp} from './kit';

/**
 * 4.9 s bumper, real 3D (three.js): logo tile "holds" a glass sign that flips
 * from «ЕСЛИ VPN…» to «HORZ VPN», whip down, glowing @horzvpnbot pill,
 * glossy 3D ribbons and 3D app icons. Surround is chroma GREEN (brand blue survives keying).
 */
export const BUMPERPRO_FRAMES = 148;
const RIM = new THREE.Color('#3f74ff').multiplyScalar(1.5);
const TEXT_BOOST = new THREE.Color(1.3, 1.3, 1.3);
const W = 1696;
const H = 672;
const KEY = '#00ff00';
const SKY = '#5b8cff';
const FLIP = 38;
const WHIP = 66;

const sp = (f: number, at: number, damping = 12, stiffness = 140) => spring({frame: f - at, fps: 30, config: {damping, stiffness, mass: 0.9}});
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeIn = (t: number) => t * t;
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const rnd = (n: number) => {
	const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
	return x - Math.floor(x);
};

/* ---------------- textures (loaded once, render waits for them) ---------------- */

const svg = (body: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="512" height="512">${body}</svg>`)}`;
const ICON_SVGS = {
	ig: svg(`<defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#feda75"/><stop offset=".3" stop-color="#fa7e1e"/><stop offset=".55" stop-color="#d62976"/><stop offset=".8" stop-color="#962fbf"/><stop offset="1" stop-color="#4f5bd5"/></linearGradient></defs><rect width="100" height="100" rx="20" fill="url(#g)"/><rect x="25" y="25" width="50" height="50" rx="15" fill="none" stroke="#fff" stroke-width="7"/><circle cx="50" cy="50" r="12" fill="none" stroke="#fff" stroke-width="7"/><circle cx="65.5" cy="34.5" r="4" fill="#fff"/>`),
	yt: svg(`<rect width="100" height="100" rx="20" fill="#ff0033"/><path d="M40 31 L71 50 L40 69 Z" fill="#fff" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>`),
	tt: svg(`<rect width="100" height="100" rx="20" fill="#111"/><g fill="none" stroke-width="8" stroke-linecap="round"><path d="M55 23v35a12 12 0 1 1-12-12M55 23c2 9 9 14 17 14" stroke="#25f4ee" transform="translate(-2.5 -2)"/><path d="M55 23v35a12 12 0 1 1-12-12M55 23c2 9 9 14 17 14" stroke="#fe2c55" transform="translate(2.5 2)"/><path d="M55 23v35a12 12 0 1 1-12-12M55 23c2 9 9 14 17 14" stroke="#fff"/></g>`),
	tg: svg(`<defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2aabee"/><stop offset="1" stop-color="#1d8fc9"/></linearGradient></defs><rect width="100" height="100" rx="20" fill="url(#t)"/><path transform="translate(12 13) scale(3.1)" d="M3 11.5l16.5-6.5c.8-.3 1.5.2 1.2 1.4l-2.8 13.2c-.2 1-.8 1.2-1.6.7l-4.4-3.3-2.1 2c-.2.2-.4.4-.9.4l.3-4.5 8.2-7.4c.4-.3-.1-.5-.5-.2L6.8 13.6 2.5 12.3c-.9-.3-.9-.9.5-.8z" fill="#fff"/>`),
	dc: svg(`<rect width="100" height="100" rx="20" fill="#5865f2"/><g transform="translate(14 14) scale(3)" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"><path d="M6 7c4-2 8-2 12 0l2 9c-2 1.5-4 2.2-5 2.2l-1-1.7M6 7L4 16c2 1.5 4 2.2 5 2.2l1-1.7M8.5 15.5c2.3 1 4.7 1 7 0"/></g><circle cx="42.5" cy="50" r="3.5" fill="#fff"/><circle cx="57.5" cy="50" r="3.5" fill="#fff"/>`),
};
type IconKey = keyof typeof ICON_SVGS;

const loadImg = (src: string) =>
	new Promise<HTMLImageElement>((res, rej) => {
		const im = new Image();
		im.onload = () => res(im);
		im.onerror = rej;
		im.src = src;
	});

const toTex = (c: HTMLCanvasElement) => {
	const t = new THREE.CanvasTexture(c);
	t.colorSpace = THREE.SRGBColorSpace;
	t.anisotropy = 8;
	return t;
};

type Tex = {front: THREE.Texture; back: THREE.Texture; logo: THREE.Texture; icons: Record<IconKey, THREE.Texture>; grid: THREE.Texture; dot: THREE.Texture; glow: THREE.Texture};

const signText = (draw: (ctx: CanvasRenderingContext2D) => void) => {
	const c = document.createElement('canvas');
	c.width = 2048;
	c.height = 512;
	const ctx = c.getContext('2d')!;
	ctx.textBaseline = 'middle';
	ctx.textAlign = 'center';
	draw(ctx);
	return toTex(c);
};

const useTextures = (): Tex | null => {
	const [tex, setTex] = useState<Tex | null>(null);
	const [handle] = useState(() => delayRender('3d textures'));
	useEffect(() => {
		(async () => {
			await Promise.all([document.fonts.load('italic 900 200px Montserrat', 'ЕСЛИ VPN HORZ'), document.fonts.load('800 80px Manrope', '@horzvpnbot')]);
			const front = signText((ctx) => {
				ctx.font = 'italic 900 230px Montserrat';
				const a = 'ЕСЛИ VPN';
				const wa = ctx.measureText(a).width;
				const wd = ctx.measureText('…').width;
				const x0 = 1024 + 90 - (wa + wd) / 2;
				ctx.textAlign = 'left';
				ctx.fillStyle = '#ffffff';
				ctx.fillText(a, x0, 266);
				ctx.fillStyle = SKY;
				ctx.fillText('…', x0 + wa, 266);
			});
			const back = signText((ctx) => {
				ctx.font = 'italic 900 270px Montserrat';
				const a = 'HORZ ';
				const b = 'VPN';
				const wa = ctx.measureText(a).width;
				const wb = ctx.measureText(b).width;
				const x0 = 1024 + 90 - (wa + wb) / 2;
				ctx.textAlign = 'left';
				ctx.shadowColor = 'rgba(91,140,255,0.9)';
				ctx.shadowBlur = 40;
				ctx.fillStyle = '#ffffff';
				ctx.fillText(a, x0, 270);
				ctx.fillStyle = SKY;
				ctx.fillText(b, x0 + wa, 270);
			});
			const logoImg = await loadImg(LOGO);
			const lc = document.createElement('canvas');
			lc.width = 1024;
			lc.height = 1024;
			const lctx = lc.getContext('2d')!;
			const s = 700;
			lctx.drawImage(logoImg, (1024 - s * (logoImg.width / logoImg.height)) / 2, (1024 - s) / 2, s * (logoImg.width / logoImg.height), s);
			const icons = {} as Record<IconKey, THREE.Texture>;
			for (const k of Object.keys(ICON_SVGS) as IconKey[]) {
				const im = await loadImg(ICON_SVGS[k]);
				const c = document.createElement('canvas');
				c.width = 512;
				c.height = 512;
				c.getContext('2d')!.drawImage(im, 0, 0, 512, 512);
				icons[k] = toTex(c);
			}
			// grid, dust sprite, backdrop glow
			const gc = document.createElement('canvas');
			gc.width = 256;
			gc.height = 256;
			const gx = gc.getContext('2d')!;
			gx.strokeStyle = 'rgba(91,140,255,0.07)';
			gx.lineWidth = 3;
			gx.strokeRect(0, 0, 256, 256);
			const grid = toTex(gc);
			grid.wrapS = THREE.RepeatWrapping;
			grid.wrapT = THREE.RepeatWrapping;
			grid.repeat.set(12, 6);
			const dc = document.createElement('canvas');
			dc.width = 64;
			dc.height = 64;
			const dx = dc.getContext('2d')!;
			const dg = dx.createRadialGradient(32, 32, 0, 32, 32, 32);
			dg.addColorStop(0, 'rgba(255,255,255,1)');
			dg.addColorStop(0.35, 'rgba(255,255,255,0.6)');
			dg.addColorStop(1, 'rgba(255,255,255,0)');
			dx.fillStyle = dg;
			dx.fillRect(0, 0, 64, 64);
			const wc = document.createElement('canvas');
			wc.width = 512;
			wc.height = 256;
			const wx = wc.getContext('2d')!;
			const wg = wx.createRadialGradient(256, 128, 0, 256, 128, 256);
			wg.addColorStop(0, 'rgba(10,77,255,0.16)');
			wg.addColorStop(1, 'rgba(10,77,255,0)');
			wx.fillStyle = wg;
			wx.fillRect(0, 0, 512, 256);
			setTex({front, back, logo: toTex(lc), icons, grid, dot: toTex(dc), glow: toTex(wc)});
			continueRender(handle);
		})();
	}, [handle]);
	return tex;
};

/* ---------------- 3D pieces ---------------- */

const Lights: React.FC = () => (
	<>
		<Environment resolution={256}>
			<Lightformer intensity={3.2} position={[0, 5, 4]} scale={[14, 2.5, 1]} />
			<Lightformer intensity={2.2} color="#7fa8ff" position={[-7, 0, 3]} scale={[2, 8, 1]} />
			<Lightformer intensity={1.6} position={[7, -1, 3]} scale={[2, 8, 1]} />
			<Lightformer intensity={0.7} color="#0a4dff" position={[0, -5, 2]} scale={[14, 2, 1]} />
		</Environment>
		<ambientLight intensity={0.25} />
		<directionalLight position={[3, 4, 6]} intensity={1.4} />
	</>
);

/** glossy silk ribbon: a flat band swept along a curve, twist animated by `phase` */
const ribbonGeo = (phase: number, width: number) => {
	const pts = Array.from({length: 8}).map((_, i) => new THREE.Vector3(-3.5 + i, Math.sin(i * 0.95 + 0.4) * 0.8, Math.cos(i * 0.7) * 0.5));
	const curve = new THREE.CatmullRomCurve3(pts);
	const n = 180;
	const pos: number[] = [];
	const idx: number[] = [];
	for (let i = 0; i <= n; i++) {
		const u = i / n;
		const p = curve.getPointAt(u);
		const tan = curve.getTangentAt(u);
		const twist = u * Math.PI * 1.4 + phase;
		const side = new THREE.Vector3(0, Math.cos(twist), Math.sin(twist)).cross(tan).normalize().multiplyScalar(width * (0.75 + 0.25 * Math.sin(u * Math.PI)));
		pos.push(p.x + side.x, p.y + side.y, p.z + side.z, p.x - side.x, p.y - side.y, p.z - side.z);
		if (i < n) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
	}
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
	g.setIndex(idx);
	g.computeVertexNormals();
	return g;
};

const Ribbon: React.FC<{phase: number; width?: number}> = ({phase, width = 0.62}) => {
	const geo = useMemo(() => ribbonGeo(phase, width), [phase, width]);
	return (
		<mesh geometry={geo}>
			<meshPhysicalMaterial color="#0a4dff" emissive="#06217a" emissiveIntensity={0.35} metalness={0.25} roughness={0.14} clearcoat={1} clearcoatRoughness={0.04} side={THREE.DoubleSide} />
		</mesh>
	);
};

const Icon3D: React.FC<{tex: THREE.Texture; body: string; pos: [number, number, number]; rot: [number, number, number]; pop: number; f: number; seed: number}> = ({tex, body, pos, rot, pop, f, seed}) => (
	<group position={[pos[0] + noise2D('x' + seed, f / 70, 0) * 0.08, pos[1] + noise2D('y' + seed, f / 60, 0) * 0.12, pos[2]]} rotation={[rot[0] + noise2D('rx' + seed, f / 80, 0) * 0.1, rot[1] + noise2D('ry' + seed, f / 75, 0) * 0.14, rot[2]]} scale={Math.max(0.001, pop)}>
		<RoundedBox args={[1.5, 1.5, 0.42]} radius={0.3} smoothness={5}>
			<meshPhysicalMaterial color={body} roughness={0.3} clearcoat={1} clearcoatRoughness={0.08} />
		</RoundedBox>
		<mesh position={[0, 0, 0.212]}>
			<planeGeometry args={[1.5, 1.5]} />
			<meshPhysicalMaterial map={tex} transparent roughness={0.32} clearcoat={1} clearcoatRoughness={0.06} />
		</mesh>
	</group>
);

/** deterministic drifting dust with depth */
const Dust: React.FC<{f: number; tex: THREE.Texture}> = ({f, tex}) => {
	const N = 150;
	const geo = useMemo(() => {
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(N * 3), 3));
		return g;
	}, []);
	const arr = geo.attributes.position.array as Float32Array;
	for (let i = 0; i < N; i++) {
		arr[i * 3] = (rnd(i) - 0.5) * 17;
		arr[i * 3 + 1] = ((((rnd(i + 90) * 8 + f * (0.006 + rnd(i + 5) * 0.012)) % 8) + 8) % 8) - 4;
		arr[i * 3 + 2] = -0.5 - rnd(i + 7) * 5;
	}
	geo.attributes.position.needsUpdate = true;
	return (
		<points geometry={geo}>
			<pointsMaterial map={tex} size={0.1} sizeAttenuation transparent depthWrite={false} blending={THREE.AdditiveBlending} color={new THREE.Color(0.55, 0.7, 1.8)} />
		</points>
	);
};

const Backdrop: React.FC<{tex: Tex}> = ({tex}) => (
	<>
		<mesh position={[0, 0, -3]}>
			<planeGeometry args={[28, 14]} />
			<meshBasicMaterial map={tex.grid} transparent />
		</mesh>
		<mesh position={[0.6, -0.3, -2.6]}>
			<planeGeometry args={[16, 8]} />
			<meshBasicMaterial map={tex.glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
		</mesh>
	</>
);

/* ---------------- layout helpers (card mask shared by DOM and WebGL layers) ---------------- */

const Clip: React.FC<{r: {l: number; t: number; w: number; h: number}; children?: React.ReactNode; style?: React.CSSProperties}> = ({r, children, style}) => (
	<div style={{position: 'absolute', left: r.l, top: r.t, width: r.w, height: r.h, borderRadius: Math.min(80, r.h / 2), overflow: 'hidden', ...style}}>
		<div style={{position: 'absolute', left: -r.l, top: -r.t, width: W, height: H}}>{children}</div>
	</div>
);

const Inner: React.FC = () => {
	const f = useCurrentFrame();
	const tex = useTextures();

	// opening: glowing line → card
	const ease3 = (t: number) => 1 - Math.pow(1 - t, 3);
	const lineW = interpolate(f, [0, 8], [0, W * 0.86], {...clamp, easing: ease3});
	const open = interpolate(f, [8, 19], [0, 1], {...clamp, easing: ease3});
	const cw = f < 8 ? lineW : lerp(W * 0.86, W, open);
	const ch = f < 8 ? 8 : lerp(8, H, open);
	const r = {l: (W - cw) / 2, t: (H - ch) / 2, w: cw, h: ch};

	// scene A motion
	const tileIn = sp(f, 12, 9, 150);
	const signIn = sp(f, 17, 11, 120);
	const flip = easeInOut(interpolate(f, [FLIP, FLIP + 8], [0, 1], clamp));
	const squash = interpolate(f, [FLIP + 6, FLIP + 9, FLIP + 16], [0, 1, 0], clamp);
	const whipA = easeIn(interpolate(f, [WHIP, WHIP + 8], [0, 1], clamp));
	const showA = f < WHIP + 9;

	// scene B motion
	const bIn = sp(f, WHIP + 3, 13, 170);
	const showB = f >= WHIP + 2;
	const rib1 = sp(f, WHIP + 6, 14, 80);
	const rib2 = sp(f, WHIP + 8, 14, 80);
	const pulse = 0.65 + 0.35 * Math.sin(f / 6);
	const shine = interpolate(f, [104, 122], [-0.3, 1.3], clamp);
	const tg = interpolate(f, [WHIP + 24, WHIP + 34], [0, 1], clamp);
	const whipCA = interpolate(f, [WHIP - 1, WHIP + 4, WHIP + 12], [0, 1, 0], clamp);
	// directional (vertical) motion blur for the whip
	const blurA = interpolate(f, [WHIP, WHIP + 8], [0, 26], clamp);
	const blurB = interpolate(f, [WHIP + 3, WHIP + 11], [26, 0], clamp);
	const canvasBlur = f >= WHIP && f < WHIP + 12 ? Math.max(f < WHIP + 9 ? blurA : 0, showB ? blurB : 0) : 0;

	const icons: {k: IconKey; body: string; pos: [number, number, number]; rot: [number, number, number]; at: number}[] = [
		{k: 'ig', body: '#c13584', pos: [-5.6, 1.85, -0.6], rot: [0.25, 0.45, -0.22], at: WHIP + 10},
		{k: 'yt', body: '#e0002c', pos: [5.5, 1.95, -0.5], rot: [0.3, -0.5, 0.2], at: WHIP + 12},
		{k: 'tt', body: '#151515', pos: [-5.7, -1.95, -0.4], rot: [-0.25, 0.5, 0.16], at: WHIP + 14},
		{k: 'dc', body: '#4f5ae0', pos: [5.75, -1.9, -0.5], rot: [-0.3, -0.45, -0.18], at: WHIP + 16},
	];

	return (
		<AbsoluteFill style={{background: KEY}}>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id="vblurA" x="0" y="-20%" width="100%" height="140%">
					<feGaussianBlur stdDeviation={`0 ${canvasBlur.toFixed(2)}`} />
				</filter>
				<filter id="vblurB" x="0" y="-50%" width="100%" height="200%">
					<feGaussianBlur stdDeviation={`0 ${blurB.toFixed(2)}`} />
				</filter>
			</svg>
			{/* background: dark card, grid, glow, particles */}
			<Clip r={r} style={{background: '#02040b', boxShadow: f < 10 ? `0 0 36px 4px rgba(91,140,255,0.9), 0 0 0 2px ${SKY}` : '0 0 0 2px rgba(91,140,255,0.25)'}}>
			</Clip>

			{/* back WebGL layer: logo tile + sign (A), 3D icons (B) */}
			{tex ? (
				<Clip r={r}>
					<div style={{position: 'absolute', inset: 0, filter: canvasBlur > 0.3 ? 'url(#vblurA)' : undefined}}>
						<ThreeCanvas width={W} height={H} camera={{position: [0, 0, 10], fov: 30}} gl={{antialias: false, alpha: false}}>
							<color attach="background" args={['#02040b']} />
							<Backdrop tex={tex} />
							<Dust f={f} tex={tex.dot} />
							<Lights />
							{showA ? (
								<group position={[0, -whipA * 7, 0]}>
									{/* sign */}
									<group position={[lerp(12, 1.4, signIn), 0.05, 0]} rotation={[0, lerp(0.7, -0.12, signIn), lerp(0.3, -0.06, signIn)]}>
										<group rotation={[flip * Math.PI, 0, 0]}>
											<RoundedBox args={[8.9, 2.85, 0.04]} radius={0.38} smoothness={5} position={[0, 0, 0]}>
												<meshBasicMaterial color={RIM} toneMapped={false} transparent opacity={Math.pow(Math.abs(Math.cos(flip * Math.PI)), 3)} />
											</RoundedBox>
											<RoundedBox args={[8.7, 2.65, 0.3]} radius={0.32} smoothness={5}>
												<meshPhysicalMaterial color="#0c1530" metalness={0.15} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />
											</RoundedBox>
											<mesh position={[0, 0, 0.16]}>
												<planeGeometry args={[8.2, 2.05]} />
												<meshBasicMaterial map={tex.front} color={TEXT_BOOST} transparent toneMapped={false} />
											</mesh>
											<mesh position={[0, 0, -0.16]} rotation={[Math.PI, 0, 0]}>
												<planeGeometry args={[8.2, 2.05]} />
												<meshBasicMaterial map={tex.back} color={TEXT_BOOST} transparent toneMapped={false} />
											</mesh>
										</group>
									</group>
									{/* logo tile, overlapping the sign like it holds it */}
									<group position={[lerp(-10, -3.75, tileIn), -0.15 + Math.sin(f / 10) * 0.05, 0.9]} rotation={[0.08, lerp(-1.4, 0.38, tileIn), lerp(-0.7, -0.14, tileIn)]} scale={[1 + squash * 0.1, 1 - squash * 0.12, 1]}>
										<RoundedBox args={[2.5, 2.5, 0.7]} radius={0.5} smoothness={6}>
											<meshPhysicalMaterial color="#ffffff" roughness={0.22} clearcoat={1} clearcoatRoughness={0.05} />
										</RoundedBox>
										<mesh position={[0, 0, 0.352]}>
											<planeGeometry args={[2.1, 2.1]} />
											<meshPhysicalMaterial map={tex.logo} transparent roughness={0.25} clearcoat={1} />
										</mesh>
									</group>
								</group>
							) : null}
							{showB ? (
								<group position={[0, lerp(7, 0, bIn), 0]}>
									{icons.map((ic, i) => (
										<Icon3D key={ic.k} tex={tex.icons[ic.k]} body={ic.body} pos={ic.pos} rot={ic.rot} pop={sp(f, ic.at, 10, 160)} f={f} seed={i * 1.7} />
									))}
								</group>
							) : null}
							{showB ? (
								<>
									<group position={[lerp(-11, -4.7, rib1), lerp(6, 2.15, rib1), 1]} rotation={[0.25, 0.15, 0.32]} scale={1.1}>
										<Ribbon phase={f / 40} />
									</group>
									<group position={[lerp(11, 4.8, rib2), lerp(-6, -2.2, rib2), 1]} rotation={[-0.25, -0.15, 0.32 + Math.PI]} scale={1.1}>
										<Ribbon phase={f / 44 + 1.2} />
									</group>
								</>
							) : null}
							<EffectComposer multisampling={4}>
								<Bloom mipmapBlur luminanceThreshold={0.95} luminanceSmoothing={0.2} intensity={0.85} radius={0.65} />
								<ChromaticAberration offset={new THREE.Vector2(0.0035 * whipCA, 0.0018 * whipCA)} radialModulation={false} modulationOffset={0} />
								<Vignette offset={0.28} darkness={0.72} />
								<Noise opacity={0.035} />
								<ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
							</EffectComposer>
						</ThreeCanvas>
					</div>
				</Clip>
			) : null}

			{/* handle pill (DOM for crisp glowing text) */}
			{showB ? (
				<Clip r={r}>
					<div style={{position: 'absolute', left: 0, right: 0, top: 132, display: 'flex', justifyContent: 'center', translate: `0 ${lerp(-760, 0, bIn)}px`, filter: showB && blurB > 0.3 ? 'url(#vblurB)' : undefined}}>
						<div style={{position: 'relative', padding: '28px 116px 40px', borderRadius: 76, overflow: 'hidden', background: 'linear-gradient(180deg, rgba(24,70,210,0.55), rgba(6,22,90,0.75))', border: '6px solid #86abff', boxShadow: `0 0 ${52 + 36 * pulse}px rgba(91,140,255,0.8), inset 0 0 68px rgba(91,140,255,0.38), 0 44px 88px rgba(0,0,0,0.55)`}}>
							<div style={{filter: `drop-shadow(0 0 ${16 + 12 * pulse}px rgba(120,165,255,0.9))`}}>
								<div style={{fontFamily: '"Manrope", sans-serif', fontWeight: 800, fontSize: 172, letterSpacing: -4, lineHeight: 1.15, whiteSpace: 'nowrap', background: 'linear-gradient(180deg,#f2f6ff 10%,#9cbcff 90%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>@horzvpnbot</div>
							</div>
							<div style={{position: 'absolute', top: -40, bottom: -40, width: 180, left: `${shine * 100}%`, background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.35), rgba(255,255,255,0))', rotate: '18deg'}} />
						</div>
					</div>
				</Clip>
			) : null}

			{/* ищи в тг + vignette */}
			<Clip r={r}>
				{showB ? (
					<div style={{position: 'absolute', left: 0, right: 0, top: 488, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22, opacity: tg, translate: `0 ${(1 - tg) * 24}px`}}>
						<div style={{width: 78, height: 78, borderRadius: 22, background: 'linear-gradient(160deg,#fff,#e4ebf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 28px rgba(0,0,0,0.5)'}}>
							<Img src={LOGO} style={{width: '72%'}} />
						</div>
						<span style={{fontFamily: '"Montserrat", sans-serif', fontStyle: 'italic', fontWeight: 800, fontSize: 70, color: '#dfe7f7', letterSpacing: 1}}>ИЩИ В ТГ</span>
					</div>
				) : null}
			</Clip>
		</AbsoluteFill>
	);
};

export const BumperPro: React.FC = () => <Inner />;
