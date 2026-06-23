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

/** クリップボードの貼り付けイベントから画像を取り出して正規化する。画像が無ければ null */
export async function fromPasteEvent(event: ClipboardEvent): Promise<Blob | null> {
	const items = event.clipboardData?.items;
	if (!items) return null;
	for (const item of items) {
		if (item.type.startsWith('image/')) {
			const file = item.getAsFile();
			if (file) return normalizeImage(file);
		}
	}
	return null;
}

/**
 * AI 生成（優先度低・未実装）。
 * 外見メモ等のプロンプトから画像を生成する想定。実装時はここだけ差し替えればよい。
 * ネットワーク/APIキーが必要なため、静的PWA単体では動作しない点に注意。
 */
export async function fromAIGeneration(_prompt: string): Promise<Blob> {
	throw new Error('AI 画像生成は未実装です（今後対応予定）');
}
