/**
 * 作品単位のエクスポート。
 * 1作品＋その全人物を、画像を Base64 で内包した JSON ファイルとして書き出す。
 */
import { getBook } from '../db/books';
import { listChars } from '../db/chars';
import { blobToDataURL } from '../image/normalize';
import { EXPORT_FORMAT_VERSION, type ExportFile, type ExportChar } from '../db/schema';

/** エクスポート時のオプション */
export interface ExportOptions {
	/** 自由メモ（ネタバレになりうる項目）を除外して書き出す（共有時のネタバレ防止） */
	excludeFreeNote?: boolean;
}

/** 指定作品をエクスポート用 JSON オブジェクトに変換 */
export async function buildExport(bookId: string, options: ExportOptions = {}): Promise<ExportFile> {
	const book = await getBook(bookId);
	if (!book) throw new Error('作品が見つかりません');

	const chars = await listChars(bookId);
	const exportChars: ExportChar[] = await Promise.all(
		chars.map(async (c) => ({
			name: c.name,
			description: c.description,
			image: c.image ? await blobToDataURL(c.image) : null,
			appearanceNote: c.appearanceNote,
			// 除外時は空文字にする（受け手側の形式は保ったまま中身だけ落とす）
			freeNote: options.excludeFreeNote ? '' : c.freeNote,
			sortKey: c.sortKey
		}))
	);

	return {
		format: 'char-memo',
		version: EXPORT_FORMAT_VERSION,
		exportedAt: Date.now(),
		book: { title: book.title },
		chars: exportChars
	};
}

/** 指定作品をエクスポートし、ブラウザでファイルダウンロードを実行 */
export async function exportBookToFile(bookId: string, options: ExportOptions = {}): Promise<void> {
	const data = await buildExport(bookId, options);
	const json = JSON.stringify(data, null, 2);
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	try {
		// 取り違え防止のため、除外版はファイル名に注記を付ける
		const suffix = options.excludeFreeNote ? '（ネタバレ抜き）' : '';
		const a = document.createElement('a');
		a.href = url;
		a.download = `${safeFileName(data.book.title)}${suffix}.charmemo.json`;
		document.body.appendChild(a);
		a.click();
		a.remove();
	} finally {
		// 少し待ってから解放（一部ブラウザでダウンロード開始前の解放を避ける）
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}
}

/** ファイル名に使えない文字を置換 */
function safeFileName(name: string): string {
	const cleaned = name.replace(/[\\/:*?"<>|]/g, '_').trim();
	return cleaned || 'book';
}
