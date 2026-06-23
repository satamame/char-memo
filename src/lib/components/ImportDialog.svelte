<script lang="ts">
	// 作品インポート用ダイアログ。
	// ファイル選択 → 検証 → 取り込み前に作品名を確認/編集（デフォルト＝JSON内の title）。
	// 確定時に重複を判定し、同名があれば「上書き」、なければ新規取り込み（ボタンが自動で切り替わる）。
	import { parseImport, commitImport, readFileAsText } from '$lib/io/import';
	import { findBookByTitle } from '$lib/db/books';
	import type { Book, ExportFile } from '$lib/db/schema';

	interface Props {
		oncompleted: (bookId: string) => void;
		onclose: () => void;
	}
	let { oncompleted, onclose }: Props = $props();

	let phase = $state<'pick' | 'confirm' | 'working'>('pick');
	let data = $state<ExportFile | null>(null);
	let title = $state('');
	let conflict = $state<Book | undefined>(undefined);
	let error = $state<string | null>(null);
	let fileInput: HTMLInputElement;
	let titleInput = $state<HTMLInputElement | null>(null);

	// 確認画面に入ったら作品名入力にフォーカス
	$effect(() => {
		if (phase === 'confirm') titleInput?.focus();
	});

	// 作品名の変更に追従して、同名作品（重複）を検出する
	$effect(() => {
		if (phase !== 'confirm') return;
		const t = title.trim();
		let cancelled = false;
		(async () => {
			const found = t ? await findBookByTitle(t) : undefined;
			if (!cancelled) conflict = found;
		})();
		return () => {
			cancelled = true;
		};
	});

	async function handleFile() {
		const file = fileInput.files?.[0];
		fileInput.value = '';
		if (!file) return;
		error = null;
		try {
			const text = await readFileAsText(file);
			data = parseImport(text);
			title = data.book.title; // デフォルトは JSON 内の title
			phase = 'confirm';
		} catch (e) {
			error = e instanceof Error ? e.message : '読み込みに失敗しました';
		}
	}

	async function confirmImport() {
		if (!data) return;
		const t = title.trim();
		if (!t) {
			error = '作品名を入力してください';
			return;
		}
		phase = 'working';
		error = null;
		try {
			const bookId = await commitImport(data, { title: t, overwriteId: conflict?.id });
			oncompleted(bookId);
		} catch (e) {
			error = e instanceof Error ? e.message : '取り込みに失敗しました';
			phase = 'confirm';
		}
	}
</script>

<div class="backdrop" role="presentation" onclick={onclose}>
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="dialog" role="dialog" aria-modal="true" tabindex="-1" onclick={(e) => e.stopPropagation()}>
		{#if phase === 'pick'}
			<h2>作品をインポート</h2>
			<p>char-memo で書き出した <code>.charmemo.json</code> を選んでください。</p>
			<div class="row">
				<button type="button" class="btn" onclick={() => fileInput.click()}>ファイルを選択</button>
				<button type="button" class="btn" onclick={onclose}>閉じる</button>
			</div>
		{:else if phase === 'confirm' && data}
			<h2>取り込む作品名</h2>
			<p class="sub">{data.chars.length} 人の登場人物を取り込みます。</p>
			<form onsubmit={(e) => (e.preventDefault(), confirmImport())}>
				<input
					bind:this={titleInput}
					type="text"
					bind:value={title}
					placeholder="作品名"
					maxlength="120"
					aria-label="作品名"
				/>
				{#if conflict}
					<p class="warn">
						同名の作品が既にあります。このまま進めると<strong>上書き</strong>します（名前を変えれば新規取り込み）。
					</p>
				{/if}
				<div class="row">
					{#if conflict}
						<button type="submit" class="btn btn-danger">上書きして取り込み</button>
					{:else}
						<button type="submit" class="btn">取り込み</button>
					{/if}
					<button type="button" class="btn" onclick={onclose}>キャンセル</button>
				</div>
			</form>
		{:else}
			<p>取り込み中…</p>
		{/if}

		<!-- どのフェーズでも（ファイル選択時の検証エラー含め）エラーを表示する -->
		{#if error}<p class="error">{error}</p>{/if}

		<input
			bind:this={fileInput}
			type="file"
			accept=".json,application/json"
			hidden
			onchange={handleFile}
		/>
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
		max-width: 420px;
		width: 100%;
	}
	.dialog h2 {
		margin: 0 0 0.5rem;
		font-size: 1.1rem;
	}
	.sub {
		margin: 0 0 0.75rem;
		color: var(--text-muted);
		font-size: 0.9rem;
	}
	input {
		width: 100%;
		padding: 0.55em 0.7em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--bg);
	}
	.row {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
	}
	.warn {
		margin: 0.6rem 0 0;
		font-size: 0.85rem;
		color: var(--text);
		background: color-mix(in srgb, var(--danger) 12%, transparent);
		border-radius: 8px;
		padding: 0.5rem 0.6rem;
	}
	.error {
		color: var(--danger);
		margin: 0.6rem 0 0;
		font-size: 0.9rem;
	}
</style>
