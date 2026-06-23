import { getDB, newId, SORT_STEP } from './database';
import type { Book } from './schema';
import { deleteCharsByBook } from './chars';

/** 全作品を sortKey 昇順で取得 */
export async function listBooks(): Promise<Book[]> {
	const db = await getDB();
	return db.getAllFromIndex('books', 'by-sortKey');
}

/** 作品を1件取得 */
export async function getBook(id: string): Promise<Book | undefined> {
	const db = await getDB();
	return db.get('books', id);
}

/**
 * タイトルで作品を検索（重複判定用。前後空白は無視して比較）。
 * excludeId を渡すとその作品自身は除外する（改名時に自分とは衝突しないように）。
 */
export async function findBookByTitle(title: string, excludeId?: string): Promise<Book | undefined> {
	const db = await getDB();
	const target = title.trim();
	const all = await db.getAll('books');
	return all.find((b) => b.title.trim() === target && b.id !== excludeId);
}

/** 新規作品を作成し、生成された作品を返す */
export async function createBook(title: string): Promise<Book> {
	const db = await getDB();
	const books = await db.getAllFromIndex('books', 'by-sortKey');
	const lastKey = books.length ? books[books.length - 1].sortKey : 0;
	const now = Date.now();
	const book: Book = {
		id: newId(),
		title: title.trim(),
		sortKey: lastKey + SORT_STEP,
		createdAt: now,
		updatedAt: now
	};
	await db.put('books', book);
	return book;
}

/** 作品を更新（部分更新可。updatedAt は自動更新） */
export async function updateBook(
	id: string,
	patch: Partial<Pick<Book, 'title' | 'sortKey'>>
): Promise<void> {
	const db = await getDB();
	const existing = await db.get('books', id);
	if (!existing) return;
	const next: Book = {
		...existing,
		...patch,
		title: patch.title !== undefined ? patch.title.trim() : existing.title,
		updatedAt: Date.now()
	};
	await db.put('books', next);
}

/** 作品とその全人物を削除 */
export async function deleteBook(id: string): Promise<void> {
	await deleteCharsByBook(id);
	const db = await getDB();
	await db.delete('books', id);
}

/** 並べ替え後の作品 id 配列を受け取り、sortKey を一括で振り直す */
export async function reorderBooks(orderedIds: string[]): Promise<void> {
	const db = await getDB();
	const tx = db.transaction('books', 'readwrite');
	let key = SORT_STEP;
	for (const id of orderedIds) {
		const b = await tx.store.get(id);
		if (b) {
			b.sortKey = key;
			b.updatedAt = Date.now();
			await tx.store.put(b);
			key += SORT_STEP;
		}
	}
	await tx.done;
}
