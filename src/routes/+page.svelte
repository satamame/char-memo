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

	function handleConsider(e: CustomEvent<DndEvent<Book>>) {
		books = e.detail.items;
	}
	async function handleFinalize(e: CustomEvent<DndEvent<Book>>) {
		books = e.detail.items;
		await reorderBooks(books.map((b) => b.id));
	}
</script>

<AppHeader title="登場人物メモ">
	{#snippet leading()}
		<img class="app-logo" src="{base}/icons/icon-192.png" alt="" width="32" height="32" />
	{/snippet}
	{#snippet actions()}
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
		<ul
			class="list"
			use:dndzone={{ items: books, flipDurationMs: 150 }}
			onconsider={handleConsider}
			onfinalize={handleFinalize}
		>
			{#each books as book (book.id)}
				<li>
					<BookCard {book} onexport={handleExport} ondelete={handleDelete} />
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
	.muted {
		color: var(--text-muted);
	}
</style>
