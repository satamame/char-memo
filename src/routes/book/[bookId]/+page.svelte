<script lang="ts">
	// 人物一覧（作品を選択した画面）。ヘッダ＝作品タイトル（✏️で改名）。ドラッグで並べ替え。
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { dndzone, type DndEvent } from 'svelte-dnd-action';
	import { getBook, updateBook } from '$lib/db/books';
	import { listChars, createChar, reorderChars } from '$lib/db/chars';
	import type { Book, Char } from '$lib/db/schema';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import CharListItem from '$lib/components/CharListItem.svelte';
	import BookTitleDialog from '$lib/components/BookTitleDialog.svelte';

	const bookId = $derived(page.params.bookId!);

	let book = $state<Book | undefined>(undefined);
	let chars = $state<Char[]>([]);
	let loading = $state(true);
	let showRename = $state(false);

	$effect(() => {
		const id = bookId;
		loading = true;
		(async () => {
			book = await getBook(id);
			chars = await listChars(id);
			loading = false;
		})();
	});

	async function addChar() {
		// 新規人物を作成し、編集画面（新規モード）へ。保存/戻るで人物一覧に戻る。
		const c = await createChar(bookId);
		goto(`${base}/book/${bookId}/char/${c.id}/edit?new=1`);
	}

	// 並べ替えモード（オンの間だけドラッグ可能・タップ遷移は無効化）
	let reordering = $state(false);

	function handleConsider(e: CustomEvent<DndEvent<Char>>) {
		chars = e.detail.items;
		document.body.classList.add('dnd-dragging'); // ドラッグ中のカーソル固定
	}
	async function handleFinalize(e: CustomEvent<DndEvent<Char>>) {
		chars = e.detail.items;
		document.body.classList.remove('dnd-dragging');
		await reorderChars(
			bookId,
			chars.map((c) => c.id)
		);
	}
</script>

<AppHeader backHref={`${base}/`}>
	{#snippet titleContent()}
		<!-- タイトル自体をタップで作品名変更（ヘッダのボタン数を減らすため） -->
		<button
			type="button"
			class="title-edit"
			onclick={() => (showRename = true)}
			disabled={!book}
			title="タップして作品名を変更"
		>
			<span class="title-emoji" aria-hidden="true">📔</span>
			<span class="title-text">{book?.title ?? ''}</span>
		</button>
	{/snippet}
	{#snippet actions()}
		{#if chars.length > 1}
			<button
				type="button"
				class="icon-btn"
				class:active={reordering}
				title={reordering ? '並べ替えを終了' : '並べ替え'}
				onclick={() => (reordering = !reordering)}
			>
				{reordering ? '完了' : '⇅'}
			</button>
		{/if}
		<button type="button" class="icon-btn" title="人物を追加" onclick={addChar}>+👤</button>
	{/snippet}
</AppHeader>

<div class="page">
	{#if loading}
		<p class="muted">読み込み中…</p>
	{:else if !book}
		<p class="muted">作品が見つかりませんでした。</p>
	{:else if chars.length === 0}
		<p class="muted">まだ登場人物がいません。右上の「+👤」から登録してください。</p>
	{:else}
		{#if reordering}
			<p class="reorder-hint">並べ替えモード：項目をドラッグして移動。「完了」で終了。</p>
		{/if}
		<ul
			class="list"
			class:reordering
			use:dndzone={{ items: chars, flipDurationMs: 150, dragDisabled: !reordering }}
			onconsider={handleConsider}
			onfinalize={handleFinalize}
		>
			{#each chars as char (char.id)}
				<li class="row">
					{#if reordering}<span class="grip" aria-hidden="true">⠿</span>{/if}
					<div class="row-body">
						<CharListItem {char} />
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

{#if showRename && book}
	<BookTitleDialog
		heading="作品名を変更"
		submitLabel="保存"
		initialTitle={book.title}
		excludeId={book.id}
		onclose={() => (showRename = false)}
		onsubmit={async (titleText) => {
			await updateBook(bookId, { title: titleText });
			book = await getBook(bookId);
			showRename = false;
		}}
	/>
{/if}

<style>
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.list :global(li) {
		list-style: none;
	}
	.row {
		display: flex;
		align-items: stretch;
		gap: 0.25rem;
	}
	.row-body {
		flex: 1;
		min-width: 0;
	}
	/* 並べ替え中は、カード全体を操作不可にしてドラッグ専用に（ホバー/タップ反応も消える）。
	   ポインタイベントは親の li に通り、行のドラッグは維持される。 */
	.list.reordering .row-body {
		pointer-events: none;
	}
	.list.reordering .row {
		cursor: grab;
	}
	.grip {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		padding: 0 0.4rem;
		color: var(--text-muted);
		font-size: 1.2rem;
		line-height: 1;
	}
	.reorder-hint {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.7rem;
		font-size: 0.85rem;
		color: var(--text-muted);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}
	/* タイトル＝作品名変更ボタン（見た目は通常のタイトル） */
	.title-edit {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		width: 100%;
		min-width: 0;
		padding: 0.1rem 0;
		border: none;
		background: transparent;
		color: inherit;
		font-size: 1.15rem;
		font-weight: 700;
		text-align: left;
		cursor: pointer;
	}
	.title-edit:disabled {
		cursor: default;
	}
	.title-emoji {
		flex: 0 0 auto;
	}
	.title-text {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.icon-btn.active {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--accent-contrast);
	}
	.muted {
		color: var(--text-muted);
	}
</style>
