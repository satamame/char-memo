/**
 * 顔アイコン画像の正規化。
 * 入力画像を「正方形に中央トリミング → 最大辺まで縮小 → WebP 圧縮」して Blob を返す。
 * 容量とエクスポート（Base64）の肥大化を抑えるのが目的。
 */

const MAX_SIZE = 512; // 出力の一辺（px）
const QUALITY = 0.85; // WebP 品質

/** 任意の画像 Blob を正方形・最大512px・WebP の Blob に正規化 */
export async function normalizeImage(input: Blob): Promise<Blob> {
	const bitmap = await loadBitmap(input);
	try {
		const side = Math.min(bitmap.width, bitmap.height);
		const sx = (bitmap.width - side) / 2;
		const sy = (bitmap.height - side) / 2;
		const out = Math.min(side, MAX_SIZE);

		const canvas = document.createElement('canvas');
		canvas.width = out;
		canvas.height = out;
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('2D コンテキストを取得できませんでした');
		ctx.imageSmoothingQuality = 'high';
		ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, out, out);

		return await canvasToBlob(canvas);
	} finally {
		bitmap.close?.();
	}
}

/** Blob を data URL（Base64）へ。エクスポート時に使用。 */
export function blobToDataURL(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(blob);
	});
}

/** data URL（Base64）を Blob へ。インポート時に使用。 */
export async function dataURLToBlob(dataUrl: string): Promise<Blob> {
	const res = await fetch(dataUrl);
	return res.blob();
}

async function loadBitmap(blob: Blob): Promise<ImageBitmap> {
	// createImageBitmap は EXIF 回転を尊重しないブラウザがあるが、
	// 顔アイコン用途では許容範囲とする。
	return createImageBitmap(blob);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) resolve(blob);
				else reject(new Error('画像の書き出しに失敗しました'));
			},
			'image/webp',
			QUALITY
		);
	});
}
