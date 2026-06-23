// 元画像から PWA アイコン/ファビコンを一括生成する。
//
// 使い方:
//   node scripts/make-icons.mjs [元画像のパス]
//   - 引数を省略すると、プロジェクト直下の icon-source.(png|svg|jpg|jpeg|webp) を探す。
//   - 見つからなければ、単色のプレースホルダ画像を使う（従来どおり）。
//
// 生成物（static/ 配下。ファイル名は manifest / app.html と一致）:
//   icons/icon-192.png            … PWA標準
//   icons/icon-512.png            … PWA標準（高解像度）
//   icons/icon-512-maskable.png   … Android マスク用（中央80%＋背景）
//   icons/apple-touch-icon-180.png… iOS ホーム画面用（任意）
//   favicon.png                   … ブラウザのタブ
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const iconsDir = join(root, 'static', 'icons');
const staticDir = join(root, 'static');
mkdirSync(iconsDir, { recursive: true });

// ---- 設定 ----
const BG = '#ffffff'; // maskable / apple-touch の背景色（透過を埋める）
const FG = '#1f2933'; // プレースホルダの色（テーマカラー）
const MASKABLE_SAFE = 0.8; // maskable の絵柄スケール（残りがセーフゾーンの余白）

// 透過なし扱いの背景（sharp の color オブジェクト）
const bgColor = { r: 0xff, g: 0xff, b: 0xff, alpha: 1 };
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

// ---- 元画像の決定 ----
const argSrc = process.argv[2];
const candidates = argSrc
	? [argSrc]
	: ['png', 'svg', 'jpg', 'jpeg', 'webp'].map((ext) => join(root, `icon-source.${ext}`));
const found = candidates.find((p) => existsSync(p));

const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <rect width="512" height="512" fill="${BG}"/>
  <circle cx="256" cy="256" r="174" fill="${FG}"/>
</svg>`;

const source = found ?? Buffer.from(placeholderSvg);
if (found) {
	console.log(`元画像: ${found}`);
} else {
	console.log('元画像が見つからないためプレースホルダを使用します。');
	console.log('  → 任意の画像から作るには: node scripts/make-icons.mjs <画像パス>');
	console.log('  → または icon-source.png をプロジェクト直下に置いてください。');
}

// ---- 生成ヘルパ ----
// 標準アイコン: 正方形に cover（中央を埋める。透過は保持）
async function square(size, outPath) {
	await sharp(source).resize(size, size, { fit: 'cover' }).png().toFile(outPath);
}

// maskable: 絵柄を中央 MASKABLE_SAFE 倍に縮小して背景色の正方形へ合成（端の切り抜き対策）
async function maskable(size, outPath) {
	const inner = Math.round(size * MASKABLE_SAFE);
	const fg = await sharp(source)
		.resize(inner, inner, { fit: 'contain', background: transparent })
		.png()
		.toBuffer();
	await sharp({ create: { width: size, height: size, channels: 4, background: bgColor } })
		.composite([{ input: fg, gravity: 'center' }])
		.png()
		.toFile(outPath);
}

// 背景を埋めた正方形（iOS は透過を嫌うため）
async function flat(size, outPath) {
	await sharp(source).resize(size, size, { fit: 'cover' }).flatten({ background: BG }).png().toFile(outPath);
}

// ---- 出力 ----
await square(192, join(iconsDir, 'icon-192.png'));
await square(512, join(iconsDir, 'icon-512.png'));
await maskable(512, join(iconsDir, 'icon-512-maskable.png'));
await flat(180, join(iconsDir, 'apple-touch-icon-180.png'));
await square(64, join(staticDir, 'favicon.png'));

console.log('アイコンを生成しました。');
