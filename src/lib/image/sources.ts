/**
 * 画像入力の各方式（ファイル選択 / 貼り付け / カメラ撮影 / AI生成）を
 * 「正規化済み Blob を返す」共通インターフェースに集約する。
 *
 * UI 側はこれらを呼ぶだけでよく、入力元の違いを意識しなくて済む。
 */
import { normalizeImage } from './normalize';

/** File（ファイル選択・カメラ撮影の結果）から正規化画像を得る */
export async function fromFile(file: File): Promise<Blob> {
	if (!file.type.startsWith('image/')) {
		throw new Error('画像ファイルを選択してください');
	}
	return normalizeImage(file);
}

/**
 * クリップボードを直接読み取り、画像があれば正規化して返す（Clipboard API）。
 * ボタン押下などのユーザー操作から呼ぶこと（読み取り許可・ジェスチャが必要）。
 * テキスト欄への貼り付けを介さないので、モバイルでも自然に動く。
 */
export async function fromClipboard(): Promise<Blob> {
	if (!navigator.clipboard || !('read' in navigator.clipboard)) {
		throw new Error('この端末／ブラウザはクリップボードからの貼り付けに未対応です。');
	}
	let items: ClipboardItems;
	try {
		items = await navigator.clipboard.read();
	} catch {
		throw new Error('クリップボードを読み取れませんでした（許可が必要な場合があります）。');
	}
	for (const item of items) {
		const type = item.types.find((t) => t.startsWith('image/'));
		if (type) {
			return normalizeImage(await item.getType(type));
		}
	}
	throw new Error('クリップボードに画像がありません。');
}

/**
 * AI 生成（優先度低・未実装）。
 * 外見メモ等のプロンプトから画像を生成する想定。実装時はここだけ差し替えればよい。
 * ネットワーク/APIキーが必要なため、静的PWA単体では動作しない点に注意。
 */
export async function fromAIGeneration(_prompt: string): Promise<Blob> {
	throw new Error('AI 画像生成は未実装です（今後対応予定）');
}
