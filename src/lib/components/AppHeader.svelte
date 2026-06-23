<script lang="ts">
	// 各画面共通の固定（スクロールしない）ヘッダ。
	// title 文字列か titleContent スニペット（編集画面の名前入力など）でタイトル表示を切り替えられる。
	// 戻るは backHref（リンク）か onback（コールバック）で指定。右端に actions スニペットを配置。
	import type { Snippet } from 'svelte';

	interface Props {
		title?: string;
		/** タイトル文字列の左に表示する絵文字アイコン（title 文字列モード時のみ） */
		icon?: string;
		/** ヘッダ最左端に置く要素（アプリロゴなど）。戻るボタンより前に表示。 */
		leading?: Snippet;
		titleContent?: Snippet;
		backHref?: string;
		onback?: () => void;
		actions?: Snippet;
	}
	let { title = '', icon, leading, titleContent, backHref, onback, actions }: Props = $props();
</script>

<header class="app-header">
	{#if leading}
		{@render leading()}
	{/if}
	{#if onback}
		<button type="button" class="icon-btn back" aria-label="戻る" onclick={onback}>←</button>
	{:else if backHref}
		<a class="icon-btn back" aria-label="戻る" href={backHref}>←</a>
	{/if}

	<div class="title">
		{#if titleContent}
			{@render titleContent()}
		{:else}
			<h1>{#if icon}<span class="title-icon" aria-hidden="true">{icon}</span>{/if}{title}</h1>
		{/if}
	</div>

	{#if actions}
		<div class="actions">{@render actions()}</div>
	{/if}
</header>

<style>
	.app-header {
		position: sticky;
		top: 0;
		z-index: 20;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.55rem 0.75rem;
		padding-top: calc(0.55rem + env(safe-area-inset-top));
		background: color-mix(in srgb, var(--bg) 90%, transparent);
		backdrop-filter: blur(8px);
		border-bottom: 1px solid var(--border);
	}
	.title {
		flex: 1;
		min-width: 0;
	}
	.title :global(h1) {
		margin: 0;
		font-size: 1.15rem;
		font-weight: 700;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.title-icon {
		margin-right: 0.4rem;
	}
	.actions {
		display: flex;
		gap: 0.3rem;
		flex: 0 0 auto;
	}
	.back {
		font-size: 1.2rem;
	}
</style>
