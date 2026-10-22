import {useRef} from 'react';
import * as THREE from 'three';
import {clamp01, sstep} from './core';

export const BLUE = '#0a4dff';
export const INK = '#0a0a0c';
export const SUB = '#6b7280';
export const GREEN = '#1fb36b';
export const RED = '#ff3b30';
const HZ = '"Montserrat", sans-serif';
const MONO = '"JetBrains Mono", monospace';

/** shared image (the Horz app tile) loaded before first paint */
export const shared: {logo: HTMLImageElement | null} = {logo: null};

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
/** canvas texture that is (re)drawn on every render when `animated` — deterministic, frame driven */
export const useDrawTex = (w: number, h: number, draw: Draw, animated = false) => {
	const ref = useRef<{c: HTMLCanvasElement; t: THREE.CanvasTexture} | null>(null);
	if (!ref.current) {
		const c = document.createElement('canvas');
		c.width = w;
		c.height = h;
		const t = new THREE.CanvasTexture(c);
		t.colorSpace = THREE.SRGBColorSpace;
		t.anisotropy = 8;
		ref.current = {c, t};
		draw(c.getContext('2d')!, w, h);
		t.needsUpdate = true;
	} else if (animated) {
		const ctx = ref.current.c.getContext('2d')!;
		ctx.clearRect(0, 0, w, h);
		draw(ctx, w, h);
		ref.current.t.needsUpdate = true;
	}
	return ref.current.t;
};

export const rr = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.arcTo(x + w, y, x + w, y + h, r);
	ctx.arcTo(x + w, y + h, x, y + h, r);
	ctx.arcTo(x, y + h, x, y, r);
	ctx.arcTo(x, y, x + w, y, r);
	ctx.closePath();
};

const txt = (ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, weight: number, color: string, align: CanvasTextAlign = 'left', font = HZ) => {
	ctx.font = `${weight} ${size}px ${font}`;
	ctx.fillStyle = color;
	ctx.textAlign = align;
	ctx.textBaseline = 'middle';
	ctx.fillText(s, x, y);
};

const typed = (s: string, t: number, a: number, b: number) => s.slice(0, Math.floor(clamp01((t - a) / (b - a)) * s.length));

/* ------------------------------------------------------------- door header sign */
export const drawSign = (label: string, sub: string | null, accent: string, icon: 'bank' | 'bridge' | 'tv' | 'house' | 'vault'): Draw => (ctx, w, h) => {
	rr(ctx, 6, 6, w - 12, h - 12, 38);
	ctx.fillStyle = '#ffffff';
	ctx.fill();
	ctx.lineWidth = 12;
	ctx.strokeStyle = accent;
	ctx.stroke();
	// icon badge
	ctx.fillStyle = accent;
	rr(ctx, 40, 40, h - 80, h - 80, 30);
	ctx.fill();
	ctx.strokeStyle = '#fff';
	ctx.lineWidth = 9;
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	const cx = 40 + (h - 80) / 2;
	const cy = h / 2;
	const s = (h - 80) / 100;
	ctx.save();
	ctx.translate(cx - 50 * s, cy - 50 * s);
	ctx.scale(s, s);
	ctx.lineWidth = 8;
	if (icon === 'bank') {
		ctx.beginPath();
		ctx.moveTo(18, 38);
		ctx.lineTo(50, 18);
		ctx.lineTo(82, 38);
		ctx.closePath();
		ctx.moveTo(26, 46);
		ctx.lineTo(26, 70);
		ctx.moveTo(42, 46);
		ctx.lineTo(42, 70);
		ctx.moveTo(58, 46);
		ctx.lineTo(58, 70);
		ctx.moveTo(74, 46);
		ctx.lineTo(74, 70);
		ctx.moveTo(18, 80);
		ctx.lineTo(82, 80);
		ctx.stroke();
	} else if (icon === 'bridge') {
		ctx.beginPath();
		ctx.moveTo(14, 66);
		ctx.quadraticCurveTo(50, 20, 86, 66);
		ctx.moveTo(10, 72);
		ctx.lineTo(90, 72);
		ctx.moveTo(32, 54);
		ctx.lineTo(32, 72);
		ctx.moveTo(50, 44);
		ctx.lineTo(50, 72);
		ctx.moveTo(68, 54);
		ctx.lineTo(68, 72);
		ctx.stroke();
	} else if (icon === 'vault') {
		ctx.beginPath();
		ctx.arc(50, 50, 28, 0, Math.PI * 2);
		ctx.moveTo(50, 36);
		ctx.lineTo(50, 64);
		ctx.moveTo(36, 50);
		ctx.lineTo(64, 50);
		ctx.stroke();
	} else {
		ctx.beginPath();
		ctx.moveTo(18, 48);
		ctx.lineTo(50, 20);
		ctx.lineTo(82, 48);
		ctx.moveTo(26, 44);
		ctx.lineTo(26, 80);
		ctx.lineTo(74, 80);
		ctx.lineTo(74, 44);
		ctx.stroke();
	}
	ctx.restore();
	const tx = 40 + (h - 80) + 36;
	const avail = w - tx - 40;
	let fs = sub ? 100 : 118;
	ctx.font = `900 ${fs}px ${HZ}`;
	const mw = ctx.measureText(label).width;
	if (mw > avail) fs = Math.floor((fs * avail) / mw);
	txt(ctx, label, tx, sub ? h * 0.38 : h * 0.5, fs, 900, INK);
	if (sub) txt(ctx, sub, tx, h * 0.8, 46, 700, SUB);
};

/* ------------------------------------------------------------- R1: transfer form */
const PHONE = '+7 912 345-67-89';
export const drawTransfer = (t: number): Draw => (ctx, w, h) => {
	rr(ctx, 0, 0, w, h, 44);
	ctx.fillStyle = '#ffffff';
	ctx.fill();
	// header
	ctx.save();
	rr(ctx, 0, 0, w, 130, 44);
	ctx.clip();
	ctx.fillStyle = BLUE;
	ctx.fillRect(0, 0, w, 130);
	ctx.restore();
	txt(ctx, 'Перевод по номеру', 48, 66, 58, 900, '#fff');
	const field = (y: number, label: string, value: string, active: boolean, caret: boolean) => {
		txt(ctx, label, 56, y, 32, 700, SUB);
		rr(ctx, 48, y + 26, w - 96, 98, 24);
		ctx.fillStyle = '#f3f5fa';
		ctx.fill();
		if (active) {
			ctx.lineWidth = 5;
			ctx.strokeStyle = BLUE;
			ctx.stroke();
		}
		txt(ctx, value + (caret && Math.floor(t * 3) % 2 ? '|' : ''), 76, y + 76, 52, 800, INK, 'left', MONO);
	};
	const phone = typed(PHONE, t, 11.1, 11.75);
	field(168, 'Номер телефона', phone, t < 12.2, t >= 10.4 && t < 11.9);
	const bankShown = t >= 12.5;
	field(330, 'Банк получателя', bankShown ? 'Банк друга' : '', t >= 12.1 && t < 13.5, false);
	if (bankShown) {
		ctx.fillStyle = GREEN;
		ctx.beginPath();
		ctx.arc(w - 96, 330 + 75, 22, 0, Math.PI * 2);
		ctx.fill();
		ctx.strokeStyle = '#fff';
		ctx.lineWidth = 6;
		ctx.lineCap = 'round';
		ctx.beginPath();
		ctx.moveTo(w - 106, 330 + 76);
		ctx.lineTo(w - 97, 330 + 86);
		ctx.lineTo(w - 82, 330 + 64);
		ctx.stroke();
	}
	field(492, 'Сумма', typed('1 000 ₽', t, 13.6, 14.1), t >= 13.5 && t < 14.3, t >= 13.5 && t < 14.3);
	// checks
	const sent = t >= 16.4;
	const check = (y: number, label: string, at: number) => {
		const k = sstep((t - at) / 0.25);
		if (t < at - 0.6) return;
		const ok = t >= at;
		ctx.globalAlpha = clamp01((t - (at - 0.6)) / 0.3);
		if (ok) {
			ctx.fillStyle = GREEN;
			ctx.beginPath();
			ctx.arc(76, y, 20 * (0.6 + 0.4 * k), 0, Math.PI * 2);
			ctx.fill();
			ctx.strokeStyle = '#fff';
			ctx.lineWidth = 5;
			ctx.lineCap = 'round';
			ctx.beginPath();
			ctx.moveTo(67, y + 1);
			ctx.lineTo(74, y + 9);
			ctx.lineTo(86, y - 8);
			ctx.stroke();
		} else {
			ctx.strokeStyle = BLUE;
			ctx.lineWidth = 6;
			ctx.beginPath();
			ctx.arc(76, y, 18, t * 8, t * 8 + 4.2);
			ctx.stroke();
		}
		txt(ctx, label, 116, y + 1, 40, 800, ok ? INK : SUB);
		ctx.globalAlpha = 1;
	};
	if (t >= 14.3) {
		check(650, 'Деньги на счёте', 15.98);
		check(708, 'Лимиты в порядке', 16.1);
	}
	// button
	const press = t >= 16.4 ? sstep((t - 16.4) / 0.15) * (1 - sstep((t - 16.6) / 0.3)) : 0;
	rr(ctx, 48 + press * 6, 748 + press * 6, w - 96 - press * 12, 124 - press * 12, 32);
	ctx.fillStyle = sent ? GREEN : BLUE;
	ctx.fill();
	txt(ctx, sent ? 'Запрос отправлен в СБП →' : 'Отправить', w / 2, 810, sent ? 48 : 56, 900, '#fff', 'center');
};

/* ------------------------------------------------------------- hall 2: TV with the Horz ad */
export const drawTV = (t: number): Draw => (ctx, w, h) => {
	const g = ctx.createLinearGradient(0, 0, 0, h);
	g.addColorStop(0, '#fbfcfe');
	g.addColorStop(1, '#e6ebf5');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, w, h);
	const on = t >= 18.0;
	if (!on) {
		ctx.fillStyle = '#0b0d14';
		ctx.fillRect(0, 0, w, h);
		return;
	}
	const k = (a: number) => sstep((t - a) / 0.35);
	const flash = Math.max(0, 1 - (t - 18.0) / 0.25);
	// logo tile
	const a1 = k(18.15);
	ctx.save();
	ctx.globalAlpha = a1;
	if (shared.logo) {
		rr(ctx, 70, 90 + (1 - a1) * 40, 190, 190, 48);
		ctx.fillStyle = '#fff';
		ctx.shadowColor = 'rgba(20,30,60,0.25)';
		ctx.shadowBlur = 30;
		ctx.fill();
		ctx.shadowBlur = 0;
		ctx.drawImage(shared.logo, 70 + 30, 90 + 28 + (1 - a1) * 40, 130, 135);
	}
	ctx.restore();
	// wordmark
	ctx.save();
	ctx.globalAlpha = k(18.75);
	txt(ctx, 'HORZ', 300, 150, 150, 900, INK);
	ctx.fillStyle = BLUE;
	ctx.beginPath();
	ctx.arc(ctx.measureText('HORZ').width + 316, 196, 15, 0, Math.PI * 2);
	ctx.fill();
	txt(ctx, 'VPN', 306, 236, 42, 700, SUB);
	ctx.restore();
	// 3 days free
	ctx.save();
	ctx.globalAlpha = k(20.9);
	txt(ctx, '3', 76, 420 + (1 - k(20.9)) * 40, 230, 900, BLUE);
	txt(ctx, 'дня бесплатно', 210, 400, 86, 900, INK);
	rr(ctx, 76, 520 + (1 - k(21.3)) * 30, w - 152, 100, 50);
	ctx.fillStyle = INK;
	ctx.fill();
	ctx.globalAlpha = k(21.3);
	txt(ctx, 'Ссылка в профиле', w / 2, 570, 58, 800, '#fff', 'center');
	ctx.restore();
	if (flash > 0) {
		ctx.fillStyle = `rgba(255,255,255,${flash})`;
		ctx.fillRect(0, 0, w, h);
	}
	// scanlines
	ctx.fillStyle = 'rgba(10,20,60,0.05)';
	for (let y = 0; y < h; y += 6) ctx.fillRect(0, y, w, 2);
};

/* ------------------------------------------------------------- R2: bridge boards */
export const drawBridgeBoard = (t: number): Draw => (ctx, w, h) => {
	rr(ctx, 8, 8, w - 16, h - 16, 50);
	const g = ctx.createLinearGradient(0, 0, w, h);
	g.addColorStop(0, '#6c4dff');
	g.addColorStop(1, '#0a4dff');
	ctx.fillStyle = g;
	ctx.fill();
	ctx.lineWidth = 8;
	ctx.strokeStyle = 'rgba(255,255,255,0.9)';
	ctx.stroke();
	txt(ctx, 'СБП', w / 2, h * 0.42, 230, 900, '#fff', 'center');
	txt(ctx, 'общий мост между банками', w / 2, h * 0.79, 54, 800, 'rgba(255,255,255,0.92)', 'center');
};
export const drawZeroSign = (t: number): Draw => (ctx, w, h) => {
	const k = sstep((t - 28.55) / 0.3);
	rr(ctx, 6, 6, w - 12, h - 12, 40);
	ctx.fillStyle = '#fff';
	ctx.fill();
	ctx.lineWidth = 10;
	ctx.strokeStyle = RED;
	ctx.stroke();
	txt(ctx, 'мост хранит:', 60, h * 0.34, 54, 800, SUB);
	txt(ctx, '0 ₽', w / 2 + 40, h * 0.66, 150, 900, RED, 'center');
	if (k <= 0) {
		ctx.fillStyle = '#fff';
		ctx.fillRect(0, 0, w, h);
	}
};

/* ------------------------------------------------------------- R3: ledger + bubble */
const ROWS: [string, string][] = [
	['+7 903 118-20-45', '••2214'],
	['+7 925 770-09-31', '••9086'],
	['+7 912 345-67-89', '••0397'],
	['+7 916 402-18-77', '••5530'],
	['+7 985 264-33-10', '••7741'],
];
export const drawLedger = (t: number): Draw => (ctx, w, h) => {
	rr(ctx, 0, 0, w, h, 44);
	ctx.fillStyle = '#fff';
	ctx.fill();
	ctx.save();
	rr(ctx, 0, 0, w, 118, 44);
	ctx.clip();
	ctx.fillStyle = GREEN;
	ctx.fillRect(0, 0, w, 118);
	ctx.restore();
	txt(ctx, 'Клиенты банка', 44, 60, 52, 900, '#fff');
	const scanning = t >= 35.5 && t < 38.1;
	const scanRow = scanning ? Math.min(2, Math.floor((t - 35.55) / 0.85)) : t >= 38.1 ? 2 : -1;
	ROWS.forEach(([p, a], i) => {
		const y = 150 + i * 118;
		const hit = i === 2 && t >= 38.1;
		const act = i === scanRow && scanning;
		rr(ctx, 30, y, w - 60, 98, 22);
		ctx.fillStyle = hit ? '#dff7ea' : act ? '#eef3ff' : '#f4f6fb';
		ctx.fill();
		if (hit || act) {
			ctx.lineWidth = 5;
			ctx.strokeStyle = hit ? GREEN : BLUE;
			ctx.stroke();
		}
		txt(ctx, p, 56, y + 50, 38, 800, INK, 'left', MONO);
		txt(ctx, 'счёт ' + a, w - 56, y + 50, 38, 800, hit ? GREEN : SUB, 'right', MONO);
	});
	if (t >= 38.1) {
		const k = sstep((t - 38.1) / 0.3);
		ctx.globalAlpha = k;
		txt(ctx, 'найдено ✓', w / 2, h - 66, 56, 900, GREEN, 'center');
		ctx.globalAlpha = 1;
	}
};
export const drawBubble = (): Draw => (ctx, w, h) => {
	rr(ctx, 8, 8, w - 16, h - 40, 60);
	ctx.fillStyle = '#fff';
	ctx.shadowColor = 'rgba(20,30,60,0.3)';
	ctx.shadowBlur = 24;
	ctx.fill();
	ctx.shadowBlur = 0;
	ctx.beginPath();
	ctx.moveTo(w * 0.32, h - 36);
	ctx.lineTo(w * 0.24, h - 4);
	ctx.lineTo(w * 0.45, h - 36);
	ctx.fill();
	txt(ctx, 'Принимаю ✓', w / 2, (h - 40) / 2 + 8, 92, 900, GREEN, 'center');
};

/* ------------------------------------------------------------- R4: central-bank account boards */
const money = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
export const drawAccount = (which: 'A' | 'B', t: number): Draw => (ctx, w, h) => {
	rr(ctx, 0, 0, w, h, 44);
	ctx.fillStyle = '#0b1f4d';
	ctx.fill();
	ctx.lineWidth = 6;
	ctx.strokeStyle = '#c9a24a';
	ctx.stroke();
	txt(ctx, 'Счёт банка ' + (which === 'A' ? 'А' : 'Б'), w / 2, 90, 64, 900, '#f4e3b0', 'center');
	txt(ctx, which === 'A' ? '(твой)' : '(банк друга)', w / 2, 160, 38, 700, '#9fb0d8', 'center');
	const k = sstep((t - 45.0) / 1.8);
	const base = which === 'A' ? 1000000 : 2000000;
	const v = which === 'A' ? base - 1000 * k : base + 1000 * k;
	const col = k > 0.02 && k < 0.98 ? (which === 'A' ? '#ff8a80' : '#7dffb4') : '#ffffff';
	txt(ctx, money(v) + ' ₽', w / 2, h * 0.58, 92, 900, col, 'center');
	if (k > 0.02) txt(ctx, (which === 'A' ? '−' : '+') + '1 000 ₽', w / 2, h * 0.84, 62, 900, which === 'A' ? '#ff8a80' : '#7dffb4', 'center');
};

/* ------------------------------------------------------------- misc */
export const drawHoodie = (): Draw => (ctx, w, h) => {
	txt(ctx, 'H.', w / 2, h / 2, 330, 900, '#ffffff', 'center');
};
export const drawCard = (): Draw => (ctx, w, h) => {
	rr(ctx, 0, 0, w, h, 54);
	const g = ctx.createLinearGradient(0, 0, w, h);
	g.addColorStop(0, '#2a3a6a');
	g.addColorStop(1, '#0b1330');
	ctx.fillStyle = g;
	ctx.fill();
	ctx.fillStyle = '#e8c76a';
	rr(ctx, 56, 70, 100, 76, 14);
	ctx.fill();
	txt(ctx, '•••• •••• •••• 4271', 56, h * 0.62, 56, 800, '#fff', 'left', MONO);
	txt(ctx, 'ДАННЫЕ КАРТЫ', 56, h * 0.86, 36, 800, '#9fb0d8');
};
export const drawEnvelope = (): Draw => (ctx, w, h) => {
	rr(ctx, 0, 0, w, h, 40);
	ctx.fillStyle = '#ffffff';
	ctx.fill();
	ctx.lineWidth = 8;
	ctx.strokeStyle = BLUE;
	ctx.stroke();
	txt(ctx, '+7 912 ••• ••-89', w / 2, h * 0.34, 58, 800, INK, 'center', MONO);
	txt(ctx, '1 000 ₽', w / 2, h * 0.7, 120, 900, BLUE, 'center');
};
export const drawPhoneScreen = (t: number): Draw => (ctx, w, h) => {
	const g = ctx.createLinearGradient(0, 0, 0, h);
	g.addColorStop(0, '#2a8cff');
	g.addColorStop(1, '#0a4dff');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, w, h);
	rr(ctx, 40, h * 0.22, w - 80, 120, 30);
	ctx.fillStyle = 'rgba(255,255,255,0.95)';
	ctx.fill();
	txt(ctx, '1 000 ₽', w / 2, h * 0.22 + 62, 62, 900, BLUE, 'center');
	rr(ctx, 40, h * 0.52, w - 80, 120, 30);
	ctx.fillStyle = '#fff';
	ctx.fill();
	txt(ctx, 'Отправить', w / 2, h * 0.52 + 62, 52, 900, INK, 'center');
};
