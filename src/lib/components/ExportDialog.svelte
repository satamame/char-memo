<script lang="ts">
	// 作品エクスポート用ダイアログ。書き出し前にネタバレ防止オプションを選べる。
	import { exportBookToFile } from '$lib/io/export';

	interface Props {
		bookId: string;
		bookTitle: string;
		onclose: () => void;
	}
	let { bookId, bookTitle, onclose }: Props = $props();

	let excludeFreeNote = $state(false);
	let busy = $state(false);
	let error = $state<string | null>(null);

	async function run() {
		busy = true;
		error = null;
		try {
			await exportBookToFile(bookId, { excludeFreeNote });
			onclose();
		} catch (e) {
			error = e instanceof Error ? e.message : 'エクスポートに失敗しました';
		} finally {
			busy = false;
		}
	}
</script>

<div class="backdrop" role="presentation" onclick={onclose}>
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="dialog" role="dialog" aria-modal="true" tabindex="-1" onclick={(e) => e.stopPropagation()}>
		<h2>エクスポート</h2>
		<p class="sub">「{bookTitle}」を JSON ファイルに書き出します。</p>

		<label class="opt">
			<input type="checkbox" bind:checked={excludeFreeNote} />
			<span>
				<strong>自由メモを除外する</strong>（ネタバレ防止）<br />
				<small
					>他人と共有する時に。名前・説明・外見メモ・画像は含まれ、自由メモだけ空にして書き出します。</small
				>
			</span>
		</label>

		{#if error}<p class="error">{error}</p>{/if}

		<div class="row">
			<button type="button" class="btn" onclick={run} disabled={busy}>書き出す</button>
			<button type="button" class="btn" onclick={onclose} disabled={busy}>キャンセル</button>
		</div>
	</div>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		display: grid;
		place-items: center;
		padding: 1rem;
		z-index: 100;
	}
	.dialog {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: 1.25rem;
		max-width: 440px;
		width: 100%;
	}
	.dialog h2 {
		margin: 0 0 0.5rem;
		font-size: 1.1rem;
	}
	.sub {
		margin: 0 0 1rem;
		color: var(--text-muted);
		font-size: 0.9rem;
	}
	.opt {
		display: flex;
		gap: 0.6rem;
		align-items: flex-start;
		padding: 0.75rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		cursor: pointer;
	}
	.opt input {
		margin-top: 0.25rem;
		flex: 0 0 auto;
	}
	.opt small {
		color: var(--text-muted);
	}
	.row {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
	}
	.error {
		color: var(--danger);
		margin: 0.75rem 0 0;
		font-size: 0.9rem;
	}
</style>
