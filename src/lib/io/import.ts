/**
 * 作品単位のインポート。
 * フロー: ファイル読込 → 検証 → 取り込み前に作品名を確認/編集（デフォルト＝JSON内の title）
 *         → 確定時に重複をチェックし、重複があれば上書き、なければ新規取り込み。
 */
import { getDB, newId, SORT_STEP } from '../db/database';
import { deleteBook } from '../db/books';
import { dataURLToBlob } from '../image/normalize';
import { EXPORT_FORMAT_VERSION, type Book, type Char, type ExportFile } from '../db/schema';

/** ファイル内容(JSON文字列)を検証して中身を返す（重複判定はまだしない） */
export function parseImport(jsonText: string): ExportFile {
	let parsed: unknown;
	try {
		parsed = JSON.parse(jsonText);
	} catch {
		throw new Error('JSON として読み込めませんでした（ファイルが壊れているか JSON ではありません）。');
	}

	if (typeof parsed !== 'object' || parsed === null) {
		throw new Error('char-memo のエクスポートファイルではありません。');
	}
	// 余分なキー（旧形式の work/persons など）も判定に使えるよう緩い型で受ける
	const data = parsed as Partial<ExportFile> & { work?: unknown; persons?: unknown };

	if (data.format !== 'char-memo') {
		throw new Error('char-memo のエクスポートファイルではありません。');
	}
	if (typeof data.version !== 'number' || data.version > EXPORT_FORMAT_VERSION) {
		throw new Error('このバージョンのアプリでは読み込めない新しい形式です。');
	}
	// 旧形式（work / persons を使っていた頃）のファイルは取り込めない
	if (data.work !== undefined || data.persons !== undefined) {
		throw new Error('古い形式のファイルのため取り込めません（book/char 形式ではありません）。');
	}
	if (!data.book?.title || !Array.isArray(data.chars)) {
		throw new Error('ファイルの形式が正しくありません（作品名または登場人物の配列がありません）。');
	}

	return data as ExportFile;
}

interface CommitOptions {
	/** 取り込み時に使う作品名（ユーザーが編集した最終的なタイトル） */
	title: string;
	/** 同名作品を上書きする場合、その作品 id。指定時は削除してから取り込む。 */
	overwriteId?: string;
}

/**
 * 取り込みを確定する。作成された作品の id を返す。
 * overwriteId 指定時は既存作品（と人物）を削除してから取り込む。
 */
export async function commitImport(data: ExportFile, options: CommitOptions): Promise<string> {
	const title = options.title.trim();
	if (!title) throw new Error('作品名を入力してください');

	if (options.overwriteId) {
		await deleteBook(options.overwriteId); // 上書き＝既存を消してから入れ直す
	}

	const db = await getDB();
	const now = Date.now();

	// 作品末尾の sortKey を求める
	const books = await db.getAllFromIndex('books', 'by-sortKey');
	const lastKey = books.length ? books[books.length - 1].sortKey : 0;

	const book: Book = {
		id: newId(),
		title,
		sortKey: lastKey + SORT_STEP,
		createdAt: now,
		updatedAt: now
	};

	// 画像（data URL）を Blob に戻す
	const chars: Char[] = await Promise.all(
		data.chars.map(async (c, i) => ({
			id: newId(),
			bookId: book.id,
			name: c.name ?? '',
			description: c.description ?? '',
			image: c.image ? await dataURLToBlob(c.image) : null,
			appearanceNote: c.appearanceNote ?? '',
			freeNote: c.freeNote ?? '',
			sortKey: typeof c.sortKey === 'number' ? c.sortKey : (i + 1) * SORT_STEP,
			createdAt: now,
			updatedAt: now
		}))
	);

	// 作品と人物をまとめて1トランザクションで書き込む
	const tx = db.transaction(['books', 'chars'], 'readwrite');
	await tx.objectStore('books').put(book);
	const charStore = tx.objectStore('chars');
	for (const char of chars) {
		await charStore.put(char);
	}
	await tx.done;

	return book.id;
}

/** File オブジェクトをテキストとして読む補助 */
export function readFileAsText(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(reader.error);
		reader.readAsText(file);
	});
}
