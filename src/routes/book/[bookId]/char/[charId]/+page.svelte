<script lang="ts">
	// 人物の詳細画面（読み取り専用）。ヘッダ＝人物名。📝 で編集画面へ。下部で削除できる。
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { getChar, deleteChar } from '$lib/db/chars';
	import type { Char } from '$lib/db/schema';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import Avatar from '$lib/components/Avatar.svelte';

	const bookId = $derived(page.params.bookId!);
	const charId = $derived(page.params.charId!);

	let char = $state<Char | undefined>(undefined);
	let loading = $state(true);

	$effect(() => {
		const id = charId;
		loading = true;
		(async () => {
			char = await getChar(id);
			loading = false;
		})();
	});

	async function remove() {
		if (!char) return;
		if (!confirm(`「${char.name || '(名前未設定)'}」を削除します。よろしいですか？`)) return;
		await deleteChar(charId);
		goto(`${base}/book/${bookId}`);
	}
</script>

<AppHeader title={char?.name || '(名前未設定)'} backHref={`${base}/book/${bookId}`}>
	{#snippet actions()}
		<button
			type="button"
			class="icon-btn"
			title="編集"
			onclick={() => goto(`${base}/book/${bookId}/char/${charId}/edit`)}
		>
			📝
		</button>
	{/snippet}
</AppHeader>

<div class="page">
	{#if loading}
		<p class="muted">読み込み中…</p>
	{:else if !char}
		<p class="muted">人物が見つかりませんでした。</p>
	{:else}
		<div class="top">
			<Avatar image={char.image} name={char.name} size={120} />
			{#if char.description}
				<p class="desc">{char.description}</p>
			{/if}
		</div>

		{#if char.appearanceNote}
			<section>
				<h2>外見メモ</h2>
				<p class="multiline">{char.appearanceNote}</p>
			</section>
		{/if}

		{#if char.freeNote}
			<section>
				<h2>自由メモ</h2>
				<p class="multiline">{char.freeNote}</p>
			</section>
		{/if}

		{#if !char.description && !char.appearanceNote && !char.freeNote}
			<p class="muted">まだ情報がありません。右上の「📝」から編集してください。</p>
		{/if}

		<div class="danger-zone">
			<button type="button" class="btn btn-danger" onclick={remove}>この人物を削除</button>
		</div>
	{/if}
</div>

<style>
	.top {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.6rem;
		text-align: center;
		margin-bottom: 1.25rem;
	}
	.desc {
		margin: 0;
		color: var(--text-muted);
	}
	section {
		margin-bottom: 1.25rem;
	}
	section h2 {
		font-size: 0.85rem;
		color: var(--text-muted);
		margin: 0 0 0.35rem;
		font-weight: 600;
	}
	/* 読み取り専用の表示。編集画面の入力欄（白背景＋枠）と区別するため、
	   ボックスにせず、左アクセント線のみの「引用」風にする。 */
	.multiline {
		margin: 0;
		white-space: pre-wrap;
		word-break: break-word;
		padding: 0.1rem 0 0.1rem 0.75rem;
		border-left: 3px solid var(--border);
		color: var(--text);
	}
	.danger-zone {
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border);
	}
	.muted {
		color: var(--text-muted);
	}
</style>
