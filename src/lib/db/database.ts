import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Book, Char } from './schema';

/** idb 用のストア定義 */
interface CharMemoDB extends DBSchema {
	books: {
		key: string;
		value: Book;
		indexes: { 'by-sortKey': number; 'by-title': string };
	};
	chars: {
		key: string;
		value: Char;
		indexes: { 'by-bookId': string };
	};
}

const DB_NAME = 'char-memo';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<CharMemoDB>> | null = null;

/** DB ハンドルを取得（初回にスキーマを構築。ブラウザ環境でのみ呼ぶこと） */
export function getDB(): Promise<IDBPDatabase<CharMemoDB>> {
	if (!dbPromise) {
		dbPromise = openDB<CharMemoDB>(DB_NAME, DB_VERSION, {
			upgrade(db) {
				if (!db.objectStoreNames.contains('books')) {
					const books = db.createObjectStore('books', { keyPath: 'id' });
					books.createIndex('by-sortKey', 'sortKey');
					books.createIndex('by-title', 'title');
				}
				if (!db.objectStoreNames.contains('chars')) {
					const chars = db.createObjectStore('chars', { keyPath: 'id' });
					chars.createIndex('by-bookId', 'bookId');
				}
				// 旧名のストア（開発時の名残）は破棄。スキーマ型に無いストア名なので緩い型にキャスト。
				const anyDb = db as unknown as IDBPDatabase;
				if (anyDb.objectStoreNames.contains('works')) anyDb.deleteObjectStore('works');
				if (anyDb.objectStoreNames.contains('persons')) anyDb.deleteObjectStore('persons');
			}
		});
	}
	return dbPromise;
}

/** 一意なIDを生成（crypto.randomUUID が使えない環境のフォールバック付き） */
export function newId(): string {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
		return crypto.randomUUID();
	}
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** sortKey の刻み幅。末尾追加時はこの幅で増やしていく。 */
export const SORT_STEP = 1000;
