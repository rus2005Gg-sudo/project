import React, {useEffect, useMemo, useState} from 'react';
import '@fontsource/jetbrains-mono/500.css';
import {AbsoluteFill, Audio, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, spring} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Environment, Lightformer, RoundedBox} from '@react-three/drei';
import {useThree} from '@react-three/fiber';
import {Bloom, EffectComposer, ToneMapping, Vignette} from '@react-three/postprocessing';
import {ToneMappingMode} from 'postprocessing';
import {fitText} from '@remotion/layout-utils';
import * as THREE from 'three';
import {noise2D} from '@remotion/noise';
import {HZ, HZ_BLUE, HZ_INK, HZ_SUB} from './brand';
import {LOGO} from './kit';
import {FPS, SBP_FRAMES, armsOut, camAt, charX, charYaw, charZ, fovAt, groundY, headYaw, heroWave, lerp, nightAmt, phoneAmt, sstep, walkAmt, walkPhase} from './sbp/core';
import {House} from './sbp/House';
import {Person} from './sbp/Person';
import {BLUE, GREEN, RED, drawBubble, drawCard, drawEnvelope, drawHoodie, drawPhoneScreen, shared, useDrawTex} from './sbp/tex';

export {SBP_FRAMES};
export const SBP_FPS = FPS;
const W = 1080;
const H = 1920;

/* ------------------------------------------------------------------ 3D scene */
const CameraRig: React.FC<{t: number}> = ({t}) => {
	const camera = useThree().camera as THREE.PerspectiveCamera;
	const c = camAt(t);
	const f = t * FPS;
	const hand = 0.012;
	const jx = noise2D('cx', f / 38, 0) * hand;
	const jy = noise2D('cy', f / 41, 3) * hand;
	camera.position.set(c.p[0] + jx, c.p[1] + jy, c.p[2]);
	camera.lookAt(c.l[0], c.l[1], c.l[2]);
	// quick FOV punch on the "send" tap and on the money move
	const punch = Math.max(Math.exp(-Math.pow((t - 16.4) / 0.25, 2)), Math.exp(-Math.pow((t - 45.0) / 0.3, 2)));
	camera.fov = fovAt(t) - punch * 3;
	camera.updateProjectionMatrix();
	return null;
};

const Lights: React.FC<{t: number; night: number}> = ({t, night}) => {
	const target = useMemo(() => new THREE.Object3D(), []);
	const over = t >= 51.4 && t < 56.1;
	const cz = over ? -20 : charZ(t);
	const R = over ? 28 : 9;
	target.position.set(0, 0, cz - 2);
	const sun = new THREE.Color().lerpColors(new THREE.Color('#fff4e0'), new THREE.Color('#8fa8ff'), night);
	return (
		<>
			<hemisphereLight args={['#ffffff', '#d6ddf0', 1.5 - night * 1.2]} />
			<ambientLight intensity={0.5 - night * 0.35} />
			<primitive object={target} />
			<directionalLight position={[5, 11, cz + 5]} target={target} color={sun} intensity={1.9 - night * 1.35} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-R} shadow-camera-right={R} shadow-camera-top={R} shadow-camera-bottom={-R} shadow-camera-near={0.5} shadow-camera-far={60} shadow-bias={-0.0004} shadow-normalBias={0.03} />
			<Environment resolution={128}>
				<Lightformer intensity={2.2} position={[0, 6, 4]} scale={[14, 3, 1]} />
				<Lightformer intensity={1.2} color="#9fbaff" position={[-6, 2, 0]} scale={[3, 8, 1]} />
			</Environment>
		</>
	);
};

const Coin: React.FC<{p: [number, number, number]; spin: number}> = ({p, spin}) => (
	<group position={p} rotation={[Math.PI / 2, spin, 0]}>
		<mesh castShadow>
			<cylinderGeometry args={[0.22, 0.22, 0.06, 28]} />
			<meshStandardMaterial color="#e8c04a" metalness={0.9} roughness={0.25} emissive="#c9a24a" emissiveIntensity={0.5} />
		</mesh>
		<mesh position={[0, 0.034, 0]}>
			<torusGeometry args={[0.15, 0.015, 8, 24]} />
			<meshStandardMaterial color="#fff2b0" metalness={0.9} roughness={0.2} />
		</mesh>
	</group>
);

const Scene: React.FC<{t: number}> = ({t}) => {
	const night = nightAmt(t);
	const bg = useMemo(() => new THREE.Color(), []);
	bg.lerpColors(new THREE.Color('#eaeef7'), new THREE.Color('#0d1430'), night);
	const over = t >= 51.4 && t < 56.1;

	const hoodie = useDrawTex(256, 256, drawHoodie());
	const phoneTex = useDrawTex(256, 400, drawPhoneScreen(t));
	const bubble = useDrawTex(768, 256, drawBubble());
	const card = useDrawTex(768, 480, drawCard());
	const env = useDrawTex(768, 480, drawEnvelope());

	// hero
	const hz = charZ(t);
	const hero = {
		pos: [charX(t), groundY(hz), hz] as [number, number, number],
		yaw: charYaw(t),
		walk: walkAmt(t),
		phase: walkPhase(t),
		phone: phoneAmt(t),
		armsOut: armsOut(t),
		wave: heroWave(t),
		headYaw: headYaw(t),
	};
	// friend
	const fz = -30.6;
	const accept = sstep((t - 39.27) / 0.2);
	const hop = t > 39.27 && t < 40.0 ? Math.abs(Math.sin(((t - 39.27) / 0.7) * Math.PI)) * 0.35 : 0;
	const friendWave = sstep((t - 33.9) / 0.4) * (1 - sstep((t - 36.0) / 0.4));

	// coins between the account boards
	const coins = [0, 1, 2].map((i) => {
		const u = (t - (44.9 + i * 0.55)) / 1.35;
		if (u <= 0 || u >= 1) return null;
		const e = sstep(u);
		return {p: [lerp(-1.4, 1.4, e), 1.7 + Math.sin(e * Math.PI) * 1.1, -39.7] as [number, number, number], spin: u * 14};
	});

	// card / envelope props
	const propsIn = sstep((t - 47.85) / 0.3);
	const cross = sstep((t - 49.3) / 0.2);
	const envGlow = sstep((t - 50.3) / 0.4);
	const bobY = Math.sin(t * 2.2) * 0.05;

	return (
		<>
			<color attach="background" args={[bg.getStyle()]} />
			<fog attach="fog" args={[bg.getStyle(), over ? 70 : 16, over ? 140 : 44]} />
			<Lights t={t} night={night} />
			<CameraRig t={t} />
			<House t={t} night={night} />

			<Person {...hero} t={t} hoodie={BLUE} decal={hoodie} phoneTex={phoneTex} />
			{t < 43 ? <Person pos={[-1.2, 0, fz]} yaw={-2.71} walk={0} phase={0} phone={0} wave={friendWave} thumb={accept} hop={hop} headYaw={0} t={t} hoodie={GREEN} pants="#2a3350" cap="#1b2b22" /> : null}
			{t >= 39.27 && t < 41.6 ? (
				<mesh position={[-0.85, 2.55 + Math.sin(t * 3) * 0.04, fz + 0.3]} scale={[1.7 * Math.min(1, accept * 1.2), 0.57 * Math.min(1, accept * 1.2), 1]}>
					<planeGeometry args={[1, 1]} />
					<meshBasicMaterial map={bubble} transparent toneMapped={false} />
				</mesh>
			) : null}

			{coins.map((c, i) => (c ? <Coin key={i} p={c.p} spin={c.spin} /> : null))}

			{t >= 47.85 && t < 52 ? (
				<group>
					<group position={[-0.95, 2.0 + bobY, -38.3]} rotation={[0.1, Math.sin(t * 1.6) * 0.3 + 0.35, 0.05]} scale={propsIn * 0.72}>
						<RoundedBox args={[1.5, 0.94, 0.05]} radius={0.06} smoothness={4}>
							<meshStandardMaterial color="#0e1736" roughness={0.4} />
						</RoundedBox>
						<mesh position={[0, 0, 0.03]}>
							<planeGeometry args={[1.46, 0.9]} />
							<meshBasicMaterial map={card} transparent toneMapped={false} />
						</mesh>
					</group>
					{/* red cross: "nothing flies away" */}
					<group position={[-0.95, 2.0 + bobY, -37.95]} scale={cross * 0.72} rotation={[0, 0, 0]}>
						{[Math.PI / 4, -Math.PI / 4].map((r, i) => (
							<mesh key={i} rotation={[0, 0, r]}>
								<boxGeometry args={[1.5, 0.16, 0.08]} />
								<meshBasicMaterial color={RED} toneMapped={false} />
							</mesh>
						))}
					</group>
					<group position={[0.95, 2.0 + bobY, -38.3]} rotation={[0.05, Math.sin(t * 1.6) * 0.3 - 0.35, -0.04]} scale={propsIn * 0.72}>
						<RoundedBox args={[1.5, 0.94, 0.05]} radius={0.06} smoothness={4}>
							<meshStandardMaterial color="#ffffff" roughness={0.4} emissive={BLUE} emissiveIntensity={envGlow * 0.5} />
						</RoundedBox>
						<mesh position={[0, 0, 0.03]}>
							<planeGeometry args={[1.46, 0.9]} />
							<meshBasicMaterial map={env} transparent toneMapped={false} />
						</mesh>
						<pointLight color={BLUE} intensity={envGlow * 6} distance={5} decay={2} />
					</group>
				</group>
			) : null}

			<EffectComposer multisampling={4}>
				<Bloom mipmapBlur luminanceThreshold={0.92} luminanceSmoothing={0.25} intensity={0.45 + night * 0.4} radius={0.7} />
				<Vignette offset={0.3} darkness={0.55} />
				<ToneMapping mode={ToneMappingMode.NEUTRAL} />
			</EffectComposer>
		</>
	);
};

/* ------------------------------------------------------------------ captions */
type Tok = [string, number, ('r' | 'b' | 'g')?];
type Page = {from: number; to: number; lines: Tok[][]};
const PAGES: Page[] = [
	{from: 0, to: 2.82, lines: [[['Ты', 0.0], ['переводишь', 0.12]], [['другу', 0.64], ['тысячу', 1.04], ['рублей', 1.4]], [['по', 1.76], ['номеру', 1.88], ['телефона', 2.32]]]},
	{from: 2.84, to: 5.2, lines: [[['и', 2.84], ['через', 3.04]], [['три', 3.36, 'b'], ['секунды', 3.6, 'b']], [['они', 4.24], ['уже', 4.52], ['у', 4.76], ['него', 4.88]]]},
	{from: 5.32, to: 7.3, lines: [[['Но', 5.34], ['что', 5.74], ['происходит', 6.03]], [['по', 6.66], ['дороге?', 6.83]]]},
	{from: 7.45, to: 8.65, lines: [[['Пойдём,', 7.5, 'b']], [['покажу', 8.02]]]},
	{from: 8.68, to: 10.9, lines: [[['Комната', 8.7], ['первая', 9.38]], [['твой', 9.98, 'b'], ['банк', 10.38, 'b']]]},
	{from: 10.92, to: 14.2, lines: [[['Ты', 10.94], ['вводишь', 11.14], ['номер,', 11.7]], [['выбираешь', 12.14], ['банк', 12.71], ['друга', 13.1]], [['и', 13.47], ['сумму', 13.66]]]},
	{from: 14.25, to: 18.0, lines: [[['Банк', 14.27], ['проверяет,', 14.78]], [['что', 15.34], ['деньги', 15.51], ['есть', 15.98, 'g']], [['и', 16.27], ['отправляет', 16.42], ['запрос', 16.99]], [['в', 17.34], ['СБП', 17.46, 'b']]]},
	{from: 18.06, to: 22.05, lines: [[['Кстати,', 18.1], ['Horz', 18.75, 'b'], ['VPN', 19.23, 'b']], [['ссылка', 19.78], ['в', 20.27], ['профиле', 20.38]], [['3', 20.94, 'b'], ['дня', 21.19, 'b'], ['бесплатно', 21.42, 'b']]]},
	{from: 22.08, to: 24.5, lines: [[['Комната', 22.11], ['вторая', 22.86]], [['СБП', 23.62, 'b']]]},
	{from: 24.52, to: 26.85, lines: [[['Это', 24.55], ['общий', 24.98], ['мост', 25.46, 'b']], [['между', 25.86], ['банками', 26.18]]]},
	{from: 26.88, to: 28.5, lines: [[['Его', 26.9], ['построил', 27.14]], [['Центробанк', 27.74, 'b']]]},
	{from: 28.52, to: 30.38, lines: [[['Мост', 28.55], ['не', 29.06, 'r'], ['хранит', 29.23, 'r']], [['твои', 29.62], ['деньги', 29.98]]]},
	{from: 30.4, to: 32.9, lines: [[['Он', 30.42], ['только', 30.66], ['передаёт', 30.94]], [['запрос', 31.58], ['в', 31.94], ['нужный', 32.14], ['банк', 32.55]]]},
	{from: 32.92, to: 35.5, lines: [[['Комната', 32.95], ['третья', 33.78]], [['банк', 34.46, 'g'], ['друга', 34.98, 'g']]]},
	{from: 35.52, to: 39.2, lines: [[['Он', 35.54], ['находит', 35.78], ['у', 36.26], ['себя', 36.38]], [['по', 36.62], ['номеру', 36.78], ['телефона', 37.18]], [['нужный', 37.66], ['счёт', 38.06, 'g'], ['и', 38.46], ['отвечает', 38.62]]]},
	{from: 39.22, to: 40.28, lines: [[['Принимаю', 39.27, 'g'], ['✓', 39.6, 'g']]]},
	{from: 40.3, to: 42.2, lines: [[['И', 40.3], ['наконец', 40.51]], [['Центробанк', 41.22, 'b']]]},
	{from: 42.24, to: 44.58, lines: [[['У', 42.27], ['каждого', 42.42], ['банка', 42.9]], [['там', 43.34], ['есть', 43.54], ['свой', 43.86]], [['счёт', 44.19, 'b']]]},
	{from: 44.6, to: 47.75, lines: [[['и', 44.62], ['деньги', 44.78], ['просто', 45.23]], [['перемещаются', 45.5, 'b']], [['с', 46.23], ['одного', 46.38], ['счёта', 46.71], ['на', 47.14], ['другой', 47.34]]]},
	{from: 47.8, to: 50.25, lines: [[['Данные', 47.83], ['твоей', 48.42], ['карты', 48.78]], [['никуда', 49.19, 'r'], ['не', 49.58, 'r'], ['летят', 49.74, 'r']]]},
	{from: 50.28, to: 51.82, lines: [[['только', 50.31], ['номер', 50.66, 'b']], [['и', 51.1], ['сумма', 51.26, 'b']]]},
	{from: 51.85, to: 54.2, lines: [[['Вся', 51.84], ['цепочка', 52.19]], [['около', 52.87], ['трёх', 53.23, 'b'], ['секунд', 53.63, 'b']]]},
	{from: 54.24, to: 55.95, lines: [[['Хоть', 54.28], ['днём,', 54.56, 'b']], [['хоть', 55.03], ['ночью', 55.39, 'b']]]},
	{from: 55.98, to: 60.2, lines: [[['Подписывайся', 56.0, 'b']], [['дальше', 56.98], ['покажу,', 57.38]], [['как', 57.82], ['работает', 58.02], ['карта', 58.58]]]},
];
const CAP_W = 880;

const Captions: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const page = PAGES.find((p) => t >= p.from - 0.12 && t < p.to + 0.2);
	if (!page) return null;
	const outP = interpolate(t, [page.to - 0.05, page.to + 0.15], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return (
		<div style={{position: 'absolute', left: 100, right: 100, top: 300, height: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start'}}>
			{page.lines.map((line, li) => {
				const text = line.map((w) => w[0]).join(' ');
				const size = Math.min(100, Math.floor(fitText({text, withinWidth: CAP_W, fontFamily: 'Montserrat', fontWeight: 900}).fontSize * 0.94));
				return (
					<div key={li} style={{display: 'flex', gap: size * 0.24, justifyContent: 'center', whiteSpace: 'nowrap'}}>
						{line.map(([w, wt, c], wi) => {
							const a = wt * FPS - 3;
							const p = spring({frame: f - a, fps: FPS, config: {damping: 15, stiffness: 220}});
							const exit = outP > 0 ? Math.min(1, Math.max(0, (outP - (li * 0.1 + wi * 0.04)) / 0.7)) : 0;
							const color = c === 'r' ? RED : c === 'b' ? HZ_BLUE : c === 'g' ? GREEN : HZ_INK;
							return (
								<span key={wi} style={{display: 'inline-block', overflow: 'hidden', padding: `${size * 0.04}px ${size * 0.06}px ${size * 0.14}px`, margin: `0 -${size * 0.06}px -${size * 0.1}px`}}>
									<span style={{display: 'inline-block', fontFamily: HZ, fontWeight: 900, fontSize: size, lineHeight: 1.06, letterSpacing: -size * 0.03, color, WebkitTextStroke: `${Math.round(size * 0.13)}px #fff`, paintOrder: 'stroke fill', translate: `0 ${(1 - p) * 115 - exit * 115}%`}}>{w}</span>
								</span>
							);
						})}
					</div>
				);
			})}
		</div>
	);
};

/* ------------------------------------------------------------------ HUD overlays */
const Hud: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	const out: React.ReactNode[] = [];
	// stopwatch in the hook
	if (t >= 3.3 && t < 5.3) {
		const k = spring({frame: f - 3.3 * FPS, fps: FPS, config: {damping: 11, stiffness: 190}});
		const el = Math.min(3, Math.max(0, ((t - 3.45) / 1.45) * 3));
		const hide = interpolate(t, [4.95, 5.25], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
		out.push(
			<div key="sw" style={{position: 'absolute', left: 0, right: 0, top: 1130, display: 'flex', justifyContent: 'center', opacity: hide, scale: String(k)}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 22, background: '#fff', borderRadius: 80, padding: '20px 44px 20px 26px', boxShadow: '0 24px 60px rgba(20,30,60,0.2)'}}>
					<svg width={86} height={86} viewBox="0 0 100 100">
						<circle cx="50" cy="54" r="38" fill="none" stroke="#e6eaf3" strokeWidth="11" />
						<circle cx="50" cy="54" r="38" fill="none" stroke={HZ_BLUE} strokeWidth="11" strokeLinecap="round" strokeDasharray={`${(el / 3) * 238.8} 238.8`} transform="rotate(-90 50 54)" />
						<rect x="42" y="4" width="16" height="10" rx="4" fill={HZ_INK} />
					</svg>
					<div style={{fontFamily: HZ, fontWeight: 900, fontSize: 72, color: HZ_INK, letterSpacing: -2, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap'}}>{el.toFixed(1).replace('.', ',')} сек</div>
				</div>
			</div>,
		);
	}
	// recap chips
	if (t >= 51.9 && t < 56.0) {
		const chips = ['Ты', 'СБП', 'Банк', 'ЦБ'];
		out.push(
			<div key="chips" style={{position: 'absolute', left: 0, right: 0, top: 1240, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14}}>
				{chips.map((c, i) => {
					const k = spring({frame: f - (51.95 + i * 0.35) * FPS, fps: FPS, config: {damping: 13, stiffness: 200}});
					return (
						<React.Fragment key={c}>
							{i > 0 ? <div style={{fontFamily: HZ, fontWeight: 900, fontSize: 34, color: HZ_BLUE, opacity: k}}>→</div> : null}
							<div style={{background: '#fff', borderRadius: 40, padding: '12px 24px', fontFamily: HZ, fontWeight: 900, fontSize: 36, color: HZ_INK, boxShadow: '0 14px 34px rgba(20,30,60,0.16)', scale: String(k), opacity: k, whiteSpace: 'nowrap'}}>{c}</div>
						</React.Fragment>
					);
				})}
			</div>,
		);
		const k = spring({frame: f - 53.3 * FPS, fps: FPS, config: {damping: 11, stiffness: 190}});
		out.push(
			<div key="three" style={{position: 'absolute', left: 0, right: 0, top: 1060, display: 'flex', justifyContent: 'center', scale: String(k), opacity: Math.min(1, k * 2)}}>
				<div style={{fontFamily: HZ, fontWeight: 900, fontSize: 150, color: HZ_BLUE, letterSpacing: -5, WebkitTextStroke: '16px #fff', paintOrder: 'stroke fill', whiteSpace: 'nowrap'}}>≈ 3 сек</div>
			</div>,
		);
	}
	// day / night marker
	if (t >= 54.28 && t < 55.97) {
		const night = t >= 55.0;
		const k = spring({frame: f - (night ? 55.03 : 54.28) * FPS, fps: FPS, config: {damping: 12, stiffness: 200}});
		out.push(
			<div key="dn" style={{position: 'absolute', left: 0, right: 0, top: 800, display: 'flex', justifyContent: 'center', scale: String(k)}}>
				<div style={{width: 160, height: 160, borderRadius: 80, background: night ? '#16204a' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 50px rgba(20,30,60,0.3)'}}>
					{night ? (
						<svg viewBox="0 0 24 24" width={96} height={96}>
							<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="#ffe08a" />
						</svg>
					) : (
						<svg viewBox="0 0 24 24" width={96} height={96} fill="none" stroke="#ffb020" strokeWidth={2} strokeLinecap="round">
							<circle cx="12" cy="12" r="4.5" fill="#ffd25a" />
							<path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
						</svg>
					)}
				</div>
			</div>,
		);
	}
	// subscribe
	if (t >= 56.0) {
		const k = spring({frame: f - 56.2 * FPS, fps: FPS, config: {damping: 12, stiffness: 190}});
		const tap = interpolate(f - 57.6 * FPS, [0, 5, 14], [1, 0.92, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
		out.push(
			<div key="sub" style={{position: 'absolute', left: 0, right: 0, top: 1400, display: 'flex', justifyContent: 'center', scale: String(k * tap), opacity: Math.min(1, k * 2)}}>
				<div style={{fontFamily: HZ, fontWeight: 900, fontSize: 70, color: '#fff', background: HZ_INK, padding: '34px 86px', borderRadius: 90, boxShadow: '0 24px 60px rgba(20,30,60,0.3)'}}>Подписывайся</div>
			</div>,
		);
	}
	return <>{out}</>;
};

const Watermark: React.FC = () => (
	<div style={{position: 'absolute', top: 190, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
		<div style={{display: 'flex', alignItems: 'baseline', gap: 10, background: 'rgba(255,255,255,0.92)', padding: '10px 28px', borderRadius: 40, boxShadow: '0 8px 24px rgba(20,30,60,0.10)'}}>
			<span style={{fontFamily: HZ, fontWeight: 900, fontSize: 34, color: HZ_INK, letterSpacing: -1}}>
				HORZ<span style={{color: HZ_BLUE}}>.</span>
			</span>
			<span style={{fontFamily: HZ, fontWeight: 700, fontSize: 20, color: HZ_SUB, letterSpacing: 4}}>VPN</span>
		</div>
	</div>
);

const Tick: React.FC<{at: number; src?: string; vol?: number}> = ({at, src = 'sfx/tick-001.mp3', vol = 0.18}) => (
	<Sequence from={Math.max(0, Math.round(at * FPS))} layout="none">
		<Audio src={staticFile(src)} volume={vol} />
	</Sequence>
);

const useReady = () => {
	const [ready, setReady] = useState(false);
	const [handle] = useState(() => delayRender('fonts+logo'));
	useEffect(() => {
		(async () => {
			await Promise.all([document.fonts.load('900 92px Montserrat', 'АБВ abc 0123'), document.fonts.load('800 40px Montserrat', 'АБВ'), document.fonts.load('700 40px Montserrat', 'АБВ'), document.fonts.load('500 40px "JetBrains Mono"', 'abc 123')]);
			await new Promise<void>((res) => {
				const im = new Image();
				im.onload = () => {
					shared.logo = im;
					res();
				};
				im.onerror = () => res();
				im.src = LOGO;
			});
			setReady(true);
			continueRender(handle);
		})();
	}, [handle]);
	return ready;
};

const World: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / FPS;
	return <Scene t={t} />;
};

export const Sbp: React.FC = () => {
	const ready = useReady();
	return (
		<AbsoluteFill style={{background: '#eaeef7'}}>
			{ready ? (
				<>
					<ThreeCanvas width={W} height={H} shadows camera={{fov: 55, near: 0.1, far: 160, position: [0, 3, 5]}} gl={{antialias: false}}>
						<World />
					</ThreeCanvas>
					<Captions />
					<Hud />
					<Watermark />
				</>
			) : null}
			<Audio src={staticFile('sbp/voice.mp3')} />
			<Tick at={3.3} vol={0.2} />
			<Tick at={7.5} src="sfx/card-slide-1.mp3" vol={0.18} />
			<Tick at={11.14} vol={0.12} />
			<Tick at={13.66} vol={0.12} />
			<Tick at={15.98} src="sfx/success-chime.mp3" vol={0.2} />
			<Tick at={16.4} src="sfx/notification-pop.mp3" vol={0.22} />
			<Tick at={18.1} src="sfx/switch-on.mp3" vol={0.2} />
			<Tick at={22.9} src="sfx/card-slide-1.mp3" vol={0.16} />
			<Tick at={30.9} src="sfx/notification-pop.mp3" vol={0.18} />
			<Tick at={38.06} src="sfx/success-chime.mp3" vol={0.2} />
			<Tick at={39.27} src="sfx/success-chime.mp3" vol={0.22} />
			<Tick at={44.95} src="sfx/coin-collect.mp3" vol={0.2} />
			<Tick at={45.5} src="sfx/coin-collect.mp3" vol={0.16} />
			<Tick at={49.3} src="sfx/error-buzz.mp3" vol={0.16} />
			<Tick at={52.0} src="sfx/power-up-3.mp3" vol={0.2} />
			<Tick at={57.6} vol={0.2} />
		</AbsoluteFill>
	);
};

