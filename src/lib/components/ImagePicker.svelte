<script lang="ts">
	// 顔アイコンの入力UI。4方式（ファイル選択 / 貼り付け / カメラ撮影 / AI生成）を集約。
	// どの方式でも正規化済み Blob を onchange で親に渡す。
	import Avatar from './Avatar.svelte';
	import { fromFile, fromClipboard, fromAIGeneration } from '$lib/image/sources';

	interface Props {
		image: Blob | null;
		name?: string;
		/** 正規化済み画像（クリア時は null）を返す */
		onchange: (image: Blob | null) => void;
	}
	let { image, name = '', onchange }: Props = $props();

	let busy = $state(false);
	let error = $state<string | null>(null);

	let fileInput: HTMLInputElement;
	let cameraInput: HTMLInputElement;

	async function handleFile(input: HTMLInputElement) {
		const file = input.files?.[0];
		input.value = ''; // 同じファイルを再選択できるようにリセット
		if (!file) return;
		await run(() => fromFile(file));
	}

	// クリップボードを直接読んで画像をセット（テキスト欄への貼り付けを介さない）
	async function handlePaste() {
		await run(() => fromClipboard());
	}

	async function handleAI() {
		// 優先度低・未実装。プロンプトは外見メモ等を将来渡す想定。
		await run(() => fromAIGeneration(name));
	}

	async function run(producer: () => Promise<Blob>) {
		busy = true;
		error = null;
		try {
			onchange(await producer());
		} catch (e) {
			error = e instanceof Error ? e.message : '画像の処理に失敗しました';
		} finally {
			busy = false;
		}
	}
</script>

<div class="picker">
	<Avatar {image} {name} size={96} />

	<div class="actions">
		<button type="button" class="btn" onclick={() => fileInput.click()} disabled={busy}>
			ファイル選択
		</button>
		<button type="button" class="btn" onclick={handlePaste} disabled={busy}> 貼り付け </button>
		<button type="button" class="btn" onclick={() => cameraInput.click()} disabled={busy}>
			カメラ撮影
		</button>
		<button type="button" class="btn" onclick={handleAI} disabled={busy}> AI生成 </button>
		{#if image}
			<button type="button" class="btn btn-danger" onclick={() => onchange(null)} disabled={busy}>
				削除
			</button>
		{/if}
	</div>

	<p class="hint">「貼り付け」でクリップボードの画像をセットできます（既存画像は上書き）。</p>
	{#if error}<p class="error">{error}</p>{/if}

	<input
		bind:this={fileInput}
		type="file"
		accept="image/*"
		hidden
		onchange={() => handleFile(fileInput)}
	/>
	<input
		bind:this={cameraInput}
		type="file"
		accept="image/*"
		capture="environment"
		hidden
		onchange={() => handleFile(cameraInput)}
	/>
</div>

<style>
	.picker {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.6rem;
		padding: 1rem;
		border: 1px dashed var(--border);
		border-radius: var(--radius);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		justify-content: center;
	}
	.hint {
		margin: 0;
		font-size: 0.8rem;
		color: var(--text-muted);
	}
	.error {
		margin: 0;
		color: var(--danger);
		font-size: 0.85rem;
	}
</style>
