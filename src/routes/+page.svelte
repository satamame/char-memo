<script lang="ts">
	// 作品一覧（トップ画面）
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { dndzone, type DndEvent } from 'svelte-dnd-action';
	import { listBooks, createBook, deleteBook, reorderBooks } from '$lib/db/books';
	import type { Book } from '$lib/db/schema';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import BookCard from '$lib/components/BookCard.svelte';
	import BookTitleDialog from '$lib/components/BookTitleDialog.svelte';
	import ImportDialog from '$lib/components/ImportDialog.svelte';
	import ExportDialog from '$lib/components/ExportDialog.svelte';

	let books = $state<Book[]>([]);
	let loading = $state(true);
	let showCreate = $state(false);
	let showImport = $state(false);
	let exportTarget = $state<Book | null>(null);

	async function refresh() {
		books = await listBooks();
		loading = false;
	}

	$effect(() => {
		refresh();
	});

	function handleExport(book: Book) {
		exportTarget = book;
	}

	async function handleDelete(book: Book) {
		if (!confirm(`「${book.title}」とその全人物を削除します。よろしいですか？`)) return;
		await deleteBook(book.id);
		await refresh();
	}

	// 並べ替えモード（オンの間だけドラッグ可能・タップ遷移は無効化）
	let reordering = $state(false);

	function handleConsider(e: CustomEvent<DndEvent<Book>>) {
		books = e.detail.items;
		document.body.classList.add('dnd-dragging'); // ドラッグ中のカーソル固定
	}
	async function handleFinalize(e: CustomEvent<DndEvent<Book>>) {
		books = e.detail.items;
		document.body.classList.remove('dnd-dragging');
		await reorderBooks(books.map((b) => b.id));
	}
</script>

<AppHeader title="登場人物メモ">
	{#snippet leading()}
		<img class="app-logo" src="{base}/icons/icon-192.png" alt="" width="32" height="32" />
	{/snippet}
	{#snippet actions()}
		{#if books.length > 1}
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
		<button type="button" class="icon-btn" title="インポート" onclick={() => (showImport = true)}>
			📥
		</button>
		<button type="button" class="icon-btn" title="作品を追加" onclick={() => (showCreate = true)}>
			+📔
		</button>
	{/snippet}
</AppHeader>

<div class="page">
	{#if loading}
		<p class="muted">読み込み中…</p>
	{:else if books.length === 0}
		<p class="muted">まだ作品がありません。右上の「+📔」から追加してください。</p>
	{:else}
		{#if reordering}
			<p class="reorder-hint">並べ替えモード：項目をドラッグして移動。「完了」で終了。</p>
		{/if}
		<ul
			class="list"
			class:reordering
			use:dndzone={{ items: books, flipDurationMs: 150, dragDisabled: !reordering }}
			onconsider={handleConsider}
			onfinalize={handleFinalize}
		>
			{#each books as book (book.id)}
				<li class="row">
					{#if reordering}<span class="grip" aria-hidden="true">⠿</span>{/if}
					<div class="row-body">
						<BookCard
							{book}
							onexport={handleExport}
							ondelete={handleDelete}
							dimActions={reordering}
						/>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

{#if showCreate}
	<BookTitleDialog
		heading="作品を追加"
		submitLabel="作成"
		primary={true}
		onclose={() => (showCreate = false)}
		onsubmit={async (titleText) => {
			const book = await createBook(titleText);
			showCreate = false;
			goto(`${base}/book/${book.id}`);
		}}
	/>
{/if}

{#if showImport}
	<ImportDialog
		onclose={() => (showImport = false)}
		oncompleted={(bookId) => {
			showImport = false;
			goto(`${base}/book/${bookId}`);
		}}
	/>
{/if}

{#if exportTarget}
	<ExportDialog
		bookId={exportTarget.id}
		bookTitle={exportTarget.title}
		onclose={() => (exportTarget = null)}
	/>
{/if}

<style>
	.app-logo {
		flex: 0 0 auto;
		width: 32px;
		height: 32px;
		border-radius: 7px;
		display: block;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
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
	/* ボタンの減光は BookCard 側（dimActions）で行う。
	   ドラッグ中に body へ複製される要素にも効かせるため、祖先依存にしない。 */
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
	.icon-btn.active {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--accent-contrast);
	}
	.muted {
		color: var(--text-muted);
	}
</style>
