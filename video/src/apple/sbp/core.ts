/** Timeline + world layout for «Как работает СБП» (3D walkthrough). Times are voice seconds. */
export const FPS = 30;
export const VOICE = 59.12;
export const SBP_FRAMES = Math.round((VOICE + 1.2) * FPS);

export const sstep = (x: number) => {
	const t = Math.min(1, Math.max(0, x));
	return t * t * (3 - 2 * t);
};
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const rnd = (n: number) => {
	const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
	return x - Math.floor(x);
};

/** smooth keyframed value over time */
export const track = (t: number, k: [number, number][]) => {
	if (t <= k[0][0]) return k[0][1];
	for (let i = 0; i < k.length - 1; i++) {
		if (t < k[i + 1][0]) return lerp(k[i][1], k[i + 1][1], sstep((t - k[i][0]) / (k[i + 1][0] - k[i][0])));
	}
	return k[k.length - 1][1];
};

/* ---------------- world layout (forward is -z) ---------------- */
export const HALF_W = 4; // inner half width
export const WALL_H = 3.2;
export const Z = {
	hallFront: 3.5,
	r1: [-4, -12] as [number, number],
	tv: [-12, -16] as [number, number],
	r2: [-16, -25] as [number, number],
	r3: [-25, -33] as [number, number],
	r4: [-33, -41] as [number, number],
	riverA: -18.9,
	riverB: -22.1,
	bridgeA: -18.2,
	bridgeB: -22.8,
};

/* ---------------- character path ---------------- */
type Leg = {t0: number; t1: number; z0: number; z1: number};
export const LEGS: Leg[] = [
	{t0: 7.5, t1: 10.1, z0: 0.3, z1: -8.4},
	{t0: 16.7, t1: 18.9, z0: -8.4, z1: -13.6},
	{t0: 21.7, t1: 24.4, z0: -13.6, z1: -20.5},
	{t0: 31.2, t1: 34.0, z0: -20.5, z1: -28.0},
	{t0: 39.4, t1: 42.4, z0: -28.0, z1: -37.0},
	{t0: 52.8, t1: 54.0, z0: -37.0, z1: -35.0},
];
/** trapezoid speed profile: position fraction for u in 0..1 */
const trap = (u: number, a = 0.2) => {
	const v = 1 / (1 - a);
	if (u <= 0) return 0;
	if (u >= 1) return 1;
	if (u < a) return (0.5 * v * u * u) / a;
	if (u <= 1 - a) return 0.5 * v * a + v * (u - a);
	return 1 - (0.5 * v * (1 - u) * (1 - u)) / a;
};
export const charZ = (t: number) => {
	let z = LEGS[0].z0;
	for (const l of LEGS) {
		if (t >= l.t1) z = l.z1;
		else if (t > l.t0) return lerp(l.z0, l.z1, trap((t - l.t0) / (l.t1 - l.t0)));
		else break;
	}
	return z;
};
export const charSpeed = (t: number) => Math.abs(charZ(t + 0.03) - charZ(t - 0.03)) / 0.06;
export const walkAmt = (t: number) => sstep(charSpeed(t) / 1.1);
export const walkPhase = (t: number) => {
	let d = 0;
	for (const l of LEGS) {
		if (t >= l.t1) d += Math.abs(l.z1 - l.z0);
		else if (t > l.t0) d += Math.abs(charZ(t) - l.z0);
	}
	return (d * Math.PI) / 0.8;
};

/** ground height (the bridge is an arch) */
export const groundY = (z: number) => {
	const zc = (Z.bridgeA + Z.bridgeB) / 2;
	const half = (Z.bridgeA - Z.bridgeB) / 2;
	const u = (z - zc) / half;
	if (Math.abs(u) >= 1) return 0;
	return 0.5 * (1 - u * u);
};

export const charX = (t: number) =>
	track(t, [
		[9.0, 0],
		[10.1, -1.0],
		[16.6, -1.0],
		[17.5, -0.3],
		[18.9, -0.7],
		[21.7, -0.7],
		[22.6, 0],
	]);
export const charYaw = (t: number) =>
	track(t, [
		[0, 0.5],
		[3.3, 0.25],
		[6.9, 0.15],
		[7.35, 0],
		[18.6, 0],
		[19.3, 0.55],
		[21.4, 0.55],
		[21.8, 0],
		[33.9, 0],
		[34.5, 0.4],
		[39.1, 0.4],
		[39.5, 0],
		[52.6, 0],
		[53.4, Math.PI],
	]);
export const headYaw = (t: number) =>
	track(t, [
		[0, 0],
		[4.2, 0.35],
		[6.0, -0.2],
		[7.3, 0],
		[24.6, 0],
		[26.0, -0.5],
		[29.2, 0.4],
		[31.0, 0],
		[44.0, 0],
		[44.8, 0.5],
		[46.8, -0.5],
		[48.0, 0],
	]);
/** 1 = holding phone & tapping */
export const phoneAmt = (t: number) =>
	track(t, [
		[0, 1],
		[7.2, 1],
		[7.6, 0],
		[9.9, 0],
		[10.2, 1],
		[16.9, 1],
		[17.2, 0],
	]);
/** arms out for balance on the bridge */
export const armsOut = (t: number) =>
	track(t, [
		[24.0, 0],
		[24.8, 1],
		[30.4, 1],
		[31.0, 0],
	]);
export const heroWave = (t: number) => track(t, [[55.4, 0], [55.9, 1]]);

/* ---------------- orb (the payment request) ---------------- */
export const ORB: [number, number, number, number][] = [
	// t, x, y, z
	[16.35, 0.35, 1.5, -9.2],
	[17.4, 0.0, 1.9, -12.0],
	[19.7, 0.0, 2.5, -21.8],
	[30.8, 0.0, 2.5, -21.8],
	[33.6, 0.0, 2.7, -29.0],
	[39.3, 0.0, 2.7, -29.0],
	[42.2, 0.0, 2.6, -37.8],
];
export const orbPos = (t: number): [number, number, number] => {
	if (t <= ORB[0][0]) return [ORB[0][1], ORB[0][2], ORB[0][3]];
	for (let i = 0; i < ORB.length - 1; i++) {
		const a = ORB[i];
		const b = ORB[i + 1];
		if (t < b[0]) {
			const u = sstep((t - a[0]) / (b[0] - a[0]));
			const hover = Math.sin(t * 4) * 0.05;
			return [lerp(a[1], b[1], u), lerp(a[2], b[2], u) + hover, lerp(a[3], b[3], u)];
		}
	}
	const l = ORB[ORB.length - 1];
	return [l[1], l[2] + Math.sin(t * 4) * 0.05, l[3]];
};

/* ---------------- camera keyframes ---------------- */
type CK = {t: number; p: [number, number, number]; l: [number, number, number]; flow?: boolean};
const fol = (z: number): {p: [number, number, number]; l: [number, number, number]; flow: boolean} => ({p: [0, 2.65, z + 6.0], l: [0, 1.3, z - 3.2], flow: true});
export const CAM: CK[] = [
	{t: 0.0, p: [1.3, 1.75, -3.5], l: [0.1, 1.35, 0.3]},
	{t: 3.3, p: [1.1, 1.7, -3.2], l: [0.05, 1.45, 0.3]},
	{t: 6.9, p: [1.35, 1.8, -3.5], l: [0.1, 1.35, 0.3]},
	{t: 7.3, p: [1.9, 1.95, -2.3], l: [0, 1.4, 0.2]},
	{t: 8.1, p: [2.3, 2.3, 2.2], l: [0, 1.3, -0.9]},
	{t: 9.2, ...fol(-5.0)},
	{t: 10.5, p: [1.2, 2.4, -5.0], l: [-1.8, 1.5, -11.0]},
	{t: 11.0, p: [0.9, 2.0, -7.2], l: [-2.4, 1.5, -12.0]},
	{t: 14.2, p: [0.9, 2.0, -7.2], l: [-2.4, 1.5, -12.0]},
	{t: 14.8, p: [1.4, 2.5, -5.2], l: [-1.8, 1.5, -11.0]},
	{t: 16.5, p: [0.7, 2.3, -6.3], l: [-1.2, 1.6, -10.0]},
	{t: 17.9, ...fol(-11.0)},
	{t: 19.3, p: [1.0, 9.6, -8.0], l: [-0.8, 0.9, -14.2]},
	{t: 21.6, p: [0.9, 9.5, -8.2], l: [-0.8, 0.9, -14.2]},
	{t: 23.0, ...fol(-17.0)},
	{t: 24.8, p: [0.8, 2.6, -16.2], l: [-0.8, 1.4, -21.0]},
	{t: 28.1, p: [0.9, 2.55, -16.4], l: [-0.8, 1.4, -21.0]},
	{t: 28.9, p: [-1.5, 2.4, -17.0], l: [1.3, 1.4, -21.0]},
	{t: 30.9, p: [-1.4, 3.0, -17.4], l: [0.2, 1.7, -24.6]},
	{t: 32.4, ...fol(-23.0)},
	{t: 34.6, p: [-5.8, 5.2, -24.2], l: [0.6, 1.3, -30.6]},
	{t: 39.2, p: [-5.5, 5.0, -24.4], l: [0.5, 1.4, -30.6]},
	{t: 40.9, ...fol(-32.0)},
	{t: 41.5, p: [0, 2.2, -30.0], l: [0, 1.5, -36.0], flow: true},
	{t: 42.4, p: [0, 2.2, -34.0], l: [0, 1.8, -40.0], flow: true},
	{t: 43.2, p: [0, 2.9, -33.8], l: [0, 1.8, -40.0]},
	{t: 47.6, p: [0, 2.9, -33.8], l: [0, 1.8, -40.0]},
	{t: 48.2, p: [0.2, 2.6, -34.3], l: [0, 2.0, -39.2]},
	{t: 51.2, p: [0.2, 2.6, -34.3], l: [0, 2.0, -39.2]},
	{t: 51.6, p: [0, 5.0, -30.0], l: [0, 1.0, -38.0]},
	{t: 52.8, p: [0, 24, -2], l: [0, 0, -22]},
	{t: 55.2, p: [0, 22, -4], l: [0, 0, -22]},
	{t: 56.2, p: [0.2, 1.9, -29.6], l: [0, 1.25, -35.0]},
	{t: 59.6, p: [0.2, 1.9, -29.5], l: [0, 1.25, -35.0]},
];
export const fovAt = (t: number) => {
	if (t < 7) return 52;
	const wide = sstep((t - 40.9) / 1.0) * (1 - sstep((t - 51.4) / 0.6));
	const r3 = sstep((t - 33.2) / 0.9) * (1 - sstep((t - 40.0) / 0.9));
	const fin = sstep((t - 55.9) / 0.4);
	return 55 + wide * 11 + r3 * 8 + fin * 3;
};

/** C1 Hermite through keyframes with finite-difference tangents (non-uniform times) */
const hermite = (t: number, ts: number[], vs: number[][], flow: boolean[]) => {
	const n = ts.length;
	if (t <= ts[0]) return vs[0];
	if (t >= ts[n - 1]) return vs[n - 1];
	let i = 0;
	while (t >= ts[i + 1]) i++;
	const dt = ts[i + 1] - ts[i];
	const u = (t - ts[i]) / dt;
	const out: number[] = [];
	for (let k = 0; k < 3; k++) {
		const m0 = i === 0 || !flow[i] ? 0 : (vs[i + 1][k] - vs[i - 1][k]) / (ts[i + 1] - ts[i - 1]);
		const m1 = i + 2 >= n || !flow[i + 1] ? 0 : (vs[i + 2][k] - vs[i][k]) / (ts[i + 2] - ts[i]);
		const u2 = u * u;
		const u3 = u2 * u;
		out.push((2 * u3 - 3 * u2 + 1) * vs[i][k] + (u3 - 2 * u2 + u) * dt * m0 + (-2 * u3 + 3 * u2) * vs[i + 1][k] + (u3 - u2) * dt * m1);
	}
	return out;
};
const CT = CAM.map((c) => c.t);
const CP = CAM.map((c) => c.p as number[]);
const CL = CAM.map((c) => c.l as number[]);
const CF = CAM.map((c) => !!c.flow);
export const camAt = (t: number) => {
	const p = hermite(t, CT, CP, CF);
	const l = hermite(t, CT, CL, CF);
	return {p: p as [number, number, number], l: l as [number, number, number]};
};

/** 0 = day … 1 = night */
export const nightAmt = (t: number) => track(t, [[54.7, 0], [55.1, 1], [55.85, 1], [55.98, 0]]);
