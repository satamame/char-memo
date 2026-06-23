/**
 * データモデルの単一の真実の源（schema）。
 * エクスポート JSON のバージョンもここで管理し、将来形式が変わってもインポート互換を保つ。
 */

/** 作品（book） */
export interface Book {
	id: string;
	/** 作品タイトル（実質ユニーク。インポートはこの値で重複判定する） */
	title: string;
	/** 作品一覧でのカスタム並び順（浮動小数。中間値を挿入して並べ替える） */
	sortKey: number;
	createdAt: number;
	updatedAt: number;
}

/** 登場人物（char）。ある作品に属する。 */
export interface Char {
	id: string;
	/** 所属作品の id */
	bookId: string;
	/** 名前（フルネーム＋愛称可・改行不可） */
	name: string;
	/** 説明（職業/性別/年齢など・一覧表示・改行不可） */
	description: string;
	/** 顔アイコン画像。保存時は Blob、未設定なら null */
	image: Blob | null;
	/** 外見メモ（画像生成の参考・複数行可） */
	appearanceNote: string;
	/** 自由メモ（ストーリー上の出来事など・複数行可） */
	freeNote: string;
	/** 人物一覧でのカスタム並び順 */
	sortKey: number;
	createdAt: number;
	updatedAt: number;
}

// ---- エクスポート形式（作品単位） ----

/** 現在のエクスポート形式バージョン。形式を変えたら上げる。 */
export const EXPORT_FORMAT_VERSION = 1;

/** エクスポート JSON 内の人物（画像は Base64 データURLで内包、内部IDは持たない） */
export interface ExportChar {
	name: string;
	description: string;
	/** 画像の data URL（例: "data:image/webp;base64,..."）。未設定なら null */
	image: string | null;
	appearanceNote: string;
	freeNote: string;
	sortKey: number;
}

/** エクスポートファイル全体（＝1作品＋その全人物） */
export interface ExportFile {
	format: 'char-memo';
	version: number;
	exportedAt: number;
	book: {
		title: string;
	};
	chars: ExportChar[];
}
