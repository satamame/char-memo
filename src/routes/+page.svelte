<script lang="ts">
	// 作品一覧（トップ画面）
	import { goto } from '$app/navigation';
	import { dndzone, type DndEvent } from 'svelte-dnd-action';
	import { listBooks, createBook, deleteBook, reorderBooks } from '$lib/db/books';
	import { exportBookToFile } from '$lib/io/export';
	import type { Book } from '$lib/db/schema';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import BookCard from '$lib/components/BookCard.svelte';
	import BookTitleDialog from '$lib/components/BookTitleDialog.svelte';
	import ImportDialog from '$lib/components/ImportDialog.svelte';

	let books = $state<Book[]>([]);
	let loading = $state(true);
	let showCreate = $state(false);
	let showImport = $state(false);
	let error = $state<string | null>(null);

	async function refresh() {
		books = await listBooks();
		loading = false;
	}

	$effect(() => {
		refresh();
	});

	async function handleExport(book: Book) {
		try {
			await exportBookToFile(book.id);
		} catch (e) {
			error = e instanceof Error ? e.message : 'エクスポートに失敗しました';
		}
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
	{#if error}<p class="error">{error}</p>{/if}

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
			goto(`/book/${book.id}`);
		}}
	/>
{/if}

{#if showImport}
	<ImportDialog
		onclose={() => (showImport = false)}
		oncompleted={(bookId) => {
			showImport = false;
			goto(`/book/${bookId}`);
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
	.muted {
		color: var(--text-muted);
	}
	.error {
		color: var(--danger);
	}
</style>
