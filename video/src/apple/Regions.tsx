import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import map from './russia.json';
import {ACCENT, AppleBg, GRAY, INK, INOUT, IT, Lockup, OUT, SUB, clamp, prog} from './kit';

export const RG_FPS = 30;
const T_END = 65.23;
export const REGIONS_FRAMES = Math.ceil((T_END + 1.2) * RG_FPS);

const CFO = ['Белгородская область', 'Брянская область', 'Владимирская область', 'Воронежская область', 'Ивановская область', 'Калужская область', 'Костромская область', 'Курская область', 'Липецкая область', 'Московская область', 'Орловская область', 'Рязанская область', 'Смоленская область', 'Тамбовская область', 'Тверская область', 'Тульская область', 'Ярославская область', 'Москва'];

const CFO_FLAGS = ['bel', 'bry', 'vla', 'vor', 'iva', 'klu', 'kos', 'krs', 'lip', 'mos', 'orl', 'rya', 'smo', 'tam', 'tve', 'tul', 'yar', 'mow'];

const Flag: React.FC<{code: string; h: number}> = ({code, h}) => (
	<div style={{height: h, width: h * 1.5, borderRadius: h * 0.14, overflow: 'hidden', boxShadow: '0 8px 20px rgba(20,40,90,0.25), 0 0 0 3px #ffffff', flexShrink: 0, background: '#fff'}}>
		<Img src={staticFile(`flags/${code}.svg`)} style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}} />
	</div>
);

type Item = {t: number; regions: string[]; flags?: string[]; n?: number; title?: string; stat?: string; label?: string; sub?: string; maxZoom?: number};

const items: Item[] = [
	{t: 0, regions: []},
	{t: 7.06, regions: ['Белгородская область'], flags: ['bel'], n: 1, title: 'Белгородская область', stat: '88%', label: 'подключений — по белым спискам'},
	{t: 12.49, regions: ['Курская область'], flags: ['krs'], n: 2, title: 'Курская область', stat: '1 из 8', label: 'подключений без ограничений'},
	{t: 18.12, regions: ['Брянская область'], flags: ['bry'], n: 3, title: 'Брянская область', stat: '12%', label: 'сессий без ограничений'},
	{t: 22.48, regions: ['Воронежская область'], flags: ['vor'], n: 4, title: 'Воронежская область', stat: '−40%', label: 'мобильного трафика'},
	{t: 27.06, regions: ['Ивановская область'], flags: ['iva'], n: 5, title: 'Ивановская область', stat: '−40%', label: 'мобильного трафика'},
	{t: 31.46, regions: ['Краснодарский край'], flags: ['kda'], n: 6, title: 'Краснодарский край', stat: '−40%', label: 'мобильного трафика'},
	{t: 35.5, regions: ['Москва', 'Московская область'], flags: ['mow', 'mos'], n: 7, title: 'Москва и Подмосковье', stat: '3 недели', label: 'без мобильного интернета в марте', sub: 'Сейчас без ограничений — меньше половины подключений'},
	{t: 43.82, regions: ['Санкт-Петербург'], flags: ['spe'], n: 8, title: 'Санкт-Петербург', stat: '44%', label: 'сессий без ограничений', maxZoom: 22},
	{t: 48.46, regions: ['Ленинградская область'], flags: ['len'], n: 9, title: 'Ленинградская область', stat: '59%', label: 'подключений проходят свободно'},
	{t: 53.39, regions: CFO, flags: CFO_FLAGS, n: 10, title: 'Центральная Россия', stat: '1 из 3', label: 'подключений без ограничений'},
	{t: 59.0, regions: []},
];

const TOP10 = items.flatMap((it) => (it.n && it.n < 10 ? it.regions : []));
const byName: Record<string, {d: string; bbox: number[]; c: number[]}> = Object.fromEntries(map.regions.map((r) => [r.name, r]));

const MAP_CX = 540;
const MAP_CY = 760;
const FULL = {cx: map.w / 2, cy: map.h / 2, z: 1040 / map.w};

const viewFor = (names: string[], maxZoom = 8) => {
	if (!names.length) return FULL;
	const bb = names.map((n) => byName[n].bbox);
	const x0 = Math.min(...bb.map((b) => b[0]));
	const y0 = Math.min(...bb.map((b) => b[1]));
	const x1 = Math.max(...bb.map((b) => b[2]));
	const y1 = Math.max(...bb.map((b) => b[3]));
	const z = Math.min(maxZoom, 620 / Math.max(x1 - x0, 1), 560 / Math.max(y1 - y0, 1));
	return {cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, z};
};

const views = items.map((it) => viewFor(it.regions, it.maxZoom));

const camera = (t: number) => {
	let k = 0;
	for (let i = 0; i < items.length; i++) if (t >= items[i].t) k = i;
	const to = views[k];
	const from = views[Math.max(0, k - 1)];
	const fly = k === 0 ? 1 : interpolate(t - items[k].t, [0, 1.3], [0, 1], {...clamp, easing: INOUT});
	// dip out mid-flight: zoom along a log curve with a slight pull-back
	const lz = interpolate(fly, [0, 1], [Math.log(from.z), Math.log(to.z)]) - Math.sin(fly * Math.PI) * 0.45;
	return {cx: interpolate(fly, [0, 1], [from.cx, to.cx]), cy: interpolate(fly, [0, 1], [from.cy, to.cy]), z: Math.exp(lz), k};
};

const MapLayer: React.FC = () => {
	const f = useCurrentFrame();
	const t = f / RG_FPS;
	const {cx, cy, z, k} = camera(t);
	const active = items[k].regions;
	const endAll = k === items.length - 1;
	const drawP = interpolate(t - items[k].t, [0.5, 1.9], [0, 1], {...clamp, easing: OUT});
	const flags = items[k].flags ?? [];
	const many = flags.length > 2;
	return (
		<>
		<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
			<defs>
				<filter id="rgShadow" x="-20%" y="-20%" width="140%" height="140%">
					<feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#0b3a8a" floodOpacity="0.18" />
				</filter>
			</defs>
			<g transform={`translate(${MAP_CX - cx * z} ${MAP_CY - cy * z}) scale(${z})`}>
				{map.regions.map((r) => {
					const isTop = TOP10.includes(r.name) || CFO.includes(r.name);
					const shown = endAll ? TOP10.includes(r.name) : false;
					return (
						<path
							key={r.name}
							d={r.d}
							fill={shown ? 'rgba(0,113,227,0.28)' : isTop && k > 0 && items.slice(1, k).some((it) => it.regions.includes(r.name)) ? 'rgba(0,113,227,0.10)' : '#e6e8ee'}
							stroke="#ffffff"
							strokeWidth={1.2}
							vectorEffect="non-scaling-stroke"
						/>
					);
				})}
				{active.map((name) => (
					<g key={name} filter="url(#rgShadow)">
						<path d={byName[name].d} fill={`rgba(0,113,227,${0.22 * drawP})`} stroke="none" />
						<path d={byName[name].d} fill="none" stroke={ACCENT} strokeWidth={4} vectorEffect="non-scaling-stroke" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - drawP} strokeLinejoin="round" />
					</g>
				))}
			</g>
		</svg>
		{flags.map((code, i) => {
			const name = active[i];
			if (!name || (many && name === 'Москва')) return null;
			const [fx, fy] = byName[name].c;
			const x = MAP_CX + (fx - cx) * z;
			const y = MAP_CY + (fy - cy) * z;
			const h = many ? 30 : 84;
			const at = 1.0 + (many ? i * 0.05 : i * 0.15);
			const p = interpolate(t - items[k].t, [at, at + 0.45], [0, 1], {...clamp, easing: OUT});
			return (
				<div key={code} style={{position: 'absolute', left: x, top: y, translate: '-50% -50%', opacity: p, scale: String(0.6 + 0.4 * p)}}>
					<Flag code={code} h={h} />
				</div>
			);
		})}
		</>
	);
};

const Card: React.FC<{it: Item; start: number; end: number}> = ({it, start, end}) => {
	const f = useCurrentFrame();
	const t = f / RG_FPS;
	if (t < start - 0.1 || t > end + 0.1) return null;
	const inP = interpolate(t - start, [0.35, 1.1], [0, 1], {...clamp, easing: OUT});
	const outP = interpolate(t, [end - 0.35, end], [0, 1], clamp);
	const p = inP * (1 - outP);
	return (
		<div style={{position: 'absolute', left: 70, right: 70, top: 1250, opacity: p, translate: `0 ${(1 - inP) * 40}px`, filter: p < 0.99 ? `blur(${(1 - p) * 8}px)` : undefined}}>
			<div style={{background: 'rgba(255,255,255,0.9)', borderRadius: 44, padding: '40px 48px', boxShadow: '0 30px 80px rgba(20,40,90,0.14)', fontFamily: IT}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 18}}>
					<div style={{width: 56, height: 56, borderRadius: 28, background: INK, color: '#fff', fontSize: 28, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{it.n}</div>
					<div style={{fontSize: 46, fontWeight: 600, color: INK, letterSpacing: -1, lineHeight: 1.1}}>{it.title}</div>
				</div>
				<div style={{display: 'flex', alignItems: 'baseline', gap: 20, marginTop: 22, flexWrap: 'wrap'}}>
					<div style={{fontSize: 128, fontWeight: 600, color: ACCENT, letterSpacing: -5, lineHeight: 1}}>{it.stat}</div>
					<div style={{fontSize: 38, fontWeight: 500, color: SUB, lineHeight: 1.2, maxWidth: 480}}>{it.label}</div>
				</div>
				{it.sub ? (
					<div style={{fontSize: 32, color: GRAY, marginTop: 18, opacity: interpolate(t - start, [3.6, 4.4], [0, 1], clamp)}}>{it.sub}</div>
				) : null}
			</div>
		</div>
	);
};

const Title: React.FC<{start: number; end: number; lines: string[]; eyebrow: string; foot?: string}> = ({start, end, lines, eyebrow, foot}) => {
	const f = useCurrentFrame();
	const t = f / RG_FPS;
	if (t < start - 0.1 || t > end + 0.1) return null;
	const outP = interpolate(t, [end - 0.4, end], [0, 1], clamp);
	return (
		<div style={{position: 'absolute', top: 1180, left: 60, right: 60, textAlign: 'center', fontFamily: IT, opacity: 1 - outP}}>
			<div style={{fontSize: 32, fontWeight: 500, color: ACCENT, opacity: prog(f, start * RG_FPS + 6, 20)}}>{eyebrow}</div>
			{lines.map((l, i) => {
				const p = prog(f, start * RG_FPS + 10 + i * 6, 26);
				return (
					<div key={i} style={{overflow: 'hidden', marginTop: i ? 0 : 18}}>
						<div style={{fontSize: 80, fontWeight: 600, letterSpacing: -3, lineHeight: 1.06, color: i ? GRAY : INK, translate: `0 ${(1 - p) * 105}%`, opacity: p}}>{l}</div>
					</div>
				);
			})}
			{foot ? <div style={{fontSize: 28, color: GRAY, marginTop: 30, opacity: prog(f, start * RG_FPS + 30, 20)}}>{foot}</div> : null}
		</div>
	);
};

export const Regions: React.FC = () => (
	<AbsoluteFill>
		<AppleBg />
		<MapLayer />
		<Lockup at={0} />
		<Title start={0} end={items[1].t} eyebrow="Июль 2026" lines={['10 регионов,', 'где интернет ограничивают', 'сильнее всего']} foot="По данным Vigo и «Коммерсанта»" />
		{items.slice(1, -1).map((it, i) => (
			<Card key={it.n} it={it} start={it.t} end={items[i + 2].t} />
		))}
		<Title start={items[items.length - 1].t} end={T_END + 1.2} eyebrow="Сохрани, чтобы знать" lines={['Где связь', 'может пропасть.']} foot="Подписывайся — рассказываем, что происходит с интернетом" />
		<Audio src={staticFile('regions/voice.mp3')} />
	</AbsoluteFill>
);

