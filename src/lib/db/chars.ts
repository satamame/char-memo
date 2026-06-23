import { getDB, newId, SORT_STEP } from './database';
import type { Char } from './schema';

/** 指定作品の人物を sortKey 昇順で取得 */
export async function listChars(bookId: string): Promise<Char[]> {
	const db = await getDB();
	const chars = await db.getAllFromIndex('chars', 'by-bookId', bookId);
	chars.sort((a, b) => a.sortKey - b.sortKey);
	return chars;
}

/** 人物を1件取得 */
export async function getChar(id: string): Promise<Char | undefined> {
	const db = await getDB();
	return db.get('chars', id);
}

/** 新規人物を作成（作品末尾に追加） */
export async function createChar(bookId: string, init?: Partial<Char>): Promise<Char> {
	const db = await getDB();
	const existing = await db.getAllFromIndex('chars', 'by-bookId', bookId);
	const lastKey = existing.reduce((max, c) => Math.max(max, c.sortKey), 0);
	const now = Date.now();
	const char: Char = {
		id: newId(),
		bookId,
		name: init?.name ?? '',
		description: init?.description ?? '',
		image: init?.image ?? null,
		appearanceNote: init?.appearanceNote ?? '',
		freeNote: init?.freeNote ?? '',
		sortKey: init?.sortKey ?? lastKey + SORT_STEP,
		createdAt: now,
		updatedAt: now
	};
	await db.put('chars', char);
	return char;
}

/** 人物を更新（部分更新可。name/description は改行を除去。updatedAt 自動更新） */
export async function updateChar(
	id: string,
	patch: Partial<Omit<Char, 'id' | 'bookId' | 'createdAt'>>
): Promise<void> {
	const db = await getDB();
	const existing = await db.get('chars', id);
	if (!existing) return;
	const next: Char = { ...existing, ...patch, updatedAt: Date.now() };
	// 一覧表示する1行項目は改行を許さない
	if (patch.name !== undefined) next.name = stripNewlines(patch.name);
	if (patch.description !== undefined) next.description = stripNewlines(patch.description);
	await db.put('chars', next);
}

/** 人物を削除 */
export async function deleteChar(id: string): Promise<void> {
	const db = await getDB();
	await db.delete('chars', id);
}

/** 指定作品の全人物を削除（作品削除時に使用） */
export async function deleteCharsByBook(bookId: string): Promise<void> {
	const db = await getDB();
	const tx = db.transaction('chars', 'readwrite');
	const index = tx.store.index('by-bookId');
	for await (const cursor of index.iterate(bookId)) {
		await cursor.delete();
	}
	await tx.done;
}

/** 並べ替え後の人物 id 配列を受け取り、sortKey を一括で振り直す */
export async function reorderChars(bookId: string, orderedIds: string[]): Promise<void> {
	const db = await getDB();
	const tx = db.transaction('chars', 'readwrite');
	let key = SORT_STEP;
	for (const id of orderedIds) {
		const c = await tx.store.get(id);
		if (c && c.bookId === bookId) {
			c.sortKey = key;
			c.updatedAt = Date.now();
			await tx.store.put(c);
			key += SORT_STEP;
		}
	}
	await tx.done;
}

/** 改行（CR/LF）を空白に置換し、前後をトリム */
function stripNewlines(s: string): string {
	return s.replace(/[\r\n]+/g, ' ').trim();
}
