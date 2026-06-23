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
	import ExportDialog from '$lib/components/ExportDialog.svelte';

	const bookId = $derived(page.params.bookId!);

	let book = $state<Book | undefined>(undefined);
	let chars = $state<Char[]>([]);
	let loading = $state(true);
	let showRename = $state(false);
	let showExport = $state(false);

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

	function handleConsider(e: CustomEvent<DndEvent<Char>>) {
		chars = e.detail.items;
	}
	async function handleFinalize(e: CustomEvent<DndEvent<Char>>) {
		chars = e.detail.items;
		await reorderChars(
			bookId,
			chars.map((c) => c.id)
		);
	}

	function handleExport() {
		showExport = true;
	}
</script>

<AppHeader title={book?.title ?? ''} icon="📔" backHref={`${base}/`}>
	{#snippet actions()}
		<button
			type="button"
			class="icon-btn"
			title="作品名を変更"
			onclick={() => (showRename = true)}
			disabled={!book}
		>
			✏️
		</button>
		<button
			type="button"
			class="icon-btn"
			title="エクスポート"
			onclick={handleExport}
			disabled={chars.length === 0}
		>
			⬇
		</button>
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
		<ul
			class="list"
			use:dndzone={{ items: chars, flipDurationMs: 150 }}
			onconsider={handleConsider}
			onfinalize={handleFinalize}
		>
			{#each chars as char (char.id)}
				<li><CharListItem {char} /></li>
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

{#if showExport && book}
	<ExportDialog bookId={book.id} bookTitle={book.title} onclose={() => (showExport = false)} />
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
	.muted {
		color: var(--text-muted);
	}
</style>
