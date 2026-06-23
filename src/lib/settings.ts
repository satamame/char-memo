/**
 * アプリ全体の設定。IndexedDB ではなく localStorage に保存する。
 * （件数が少なく同期アクセスが便利なため）
 */
import { browser } from '$app/environment';

export interface AppSettings {
	/** 配色テーマ */
	theme: 'system' | 'light' | 'dark';
	/** 最後に開いていた作品（起動時に復帰するため） */
	lastOpenedBookId: string | null;
}

const STORAGE_KEY = 'char-memo:settings';

const DEFAULTS: AppSettings = {
	theme: 'system',
	lastOpenedBookId: null
};

/** 設定を読み込む（壊れていればデフォルトに戻す） */
export function loadSettings(): AppSettings {
	if (!browser) return { ...DEFAULTS };
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return { ...DEFAULTS };
		return { ...DEFAULTS, ...JSON.parse(raw) };
	} catch {
		return { ...DEFAULTS };
	}
}

/** 設定を保存する */
export function saveSettings(settings: AppSettings): void {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

/** 設定の一部を更新して保存し、更新後の設定を返す */
export function patchSettings(patch: Partial<AppSettings>): AppSettings {
	const next = { ...loadSettings(), ...patch };
	saveSettings(next);
	return next;
}
