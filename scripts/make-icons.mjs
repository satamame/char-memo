// プレースホルダのPWAアイコン/ファビコンを生成する。
// 依存なしで動くよう、zlib だけで単色＋文字風ではなく単色丸のPNGを書き出す。
// （後で本番アイコンに差し替える前提）
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(here, '..', 'static', 'icons');
const staticDir = join(here, '..', 'static');
mkdirSync(iconsDir, { recursive: true });

const crcTable = (() => {
	const t = new Uint32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		t[n] = c >>> 0;
	}
	return t;
})();
function crc32(buf) {
	let c = 0xffffffff;
	for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
	return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
	const len = Buffer.alloc(4);
	len.writeUInt32BE(data.length, 0);
	const typeBuf = Buffer.from(type, 'ascii');
	const crc = Buffer.alloc(4);
	crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
	return Buffer.concat([len, typeBuf, data, crc]);
}

// 背景色＋中央の円（テーマ色）のRGBA画像を生成
function makePng(size, bg, fg) {
	const cx = size / 2;
	const cy = size / 2;
	const r = size * 0.34;
	const rows = [];
	for (let y = 0; y < size; y++) {
		const row = Buffer.alloc(1 + size * 4); // 先頭にフィルタバイト
		for (let x = 0; x < size; x++) {
			const inside = (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
			const [rr, gg, bb] = inside ? fg : bg;
			const o = 1 + x * 4;
			row[o] = rr;
			row[o + 1] = gg;
			row[o + 2] = bb;
			row[o + 3] = 255;
		}
		rows.push(row);
	}
	const raw = Buffer.concat(rows);
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(size, 0);
	ihdr.writeUInt32BE(size, 4);
	ihdr[8] = 8; // bit depth
	ihdr[9] = 6; // color type RGBA
	const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
	return Buffer.concat([
		sig,
		chunk('IHDR', ihdr),
		chunk('IDAT', deflateSync(raw)),
		chunk('IEND', Buffer.alloc(0))
	]);
}

const bg = [255, 255, 255];
const fg = [31, 41, 51]; // theme #1f2933

writeFileSync(join(iconsDir, 'icon-192.png'), makePng(192, bg, fg));
writeFileSync(join(iconsDir, 'icon-512.png'), makePng(512, bg, fg));
writeFileSync(join(iconsDir, 'icon-512-maskable.png'), makePng(512, fg, bg));
writeFileSync(join(staticDir, 'favicon.png'), makePng(64, bg, fg));

console.log('icons generated');
