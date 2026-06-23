<script lang="ts">
	import { base } from '$app/paths';
	import type { Book } from '$lib/db/schema';

	interface Props {
		book: Book;
		onexport: (book: Book) => void;
		ondelete: (book: Book) => void;
		/** 並べ替え中などにアクションボタンを薄く表示する */
		dimActions?: boolean;
	}
	let { book, onexport, ondelete, dimActions = false }: Props = $props();
</script>

<div class="card">
	<span class="book-icon" aria-hidden="true">📔</span>
	<a class="title" href="{base}/book/{book.id}">{book.title || '(無題の作品)'}</a>
	<div class="tools" class:dim={dimActions}>
		<button type="button" class="icon-btn ghost" title="エクスポート" onclick={() => onexport(book)}>
			⬇
		</button>
		<button
			type="button"
			class="icon-btn ghost danger"
			title="削除"
			onclick={() => ondelete(book)}
		>
			🗑
		</button>
	</div>
</div>

<style>
	.card {
		position: relative; /* タイトルリンクをセル全体に広げるための基準 */
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.3rem 0.4rem 0.3rem 1rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
	}
	.book-icon {
		flex: 0 0 auto;
		line-height: 1;
	}
	.title {
		flex: 1;
		font-weight: 600;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	/* タイトルリンクの当たり判定をセル全体へ拡張（余白・空白部分もタップ可） */
	.title::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: var(--radius);
	}
	.tools {
		position: relative; /* リンクの拡張領域より前面に置いてタップ可能にする */
		z-index: 1;
		display: flex;
		gap: 0.25rem;
	}
	/* 並べ替え中の減光＆無効化。BookCard 自身のクラスで行うことで、
	   ドラッグ中に body へ複製される要素にも適用される（祖先依存だと効かない）。
	   pointer-events: none で、複製側でもホバー強調やポインタカーソルが出ないようにする。 */
	.tools.dim {
		opacity: 0.3;
		pointer-events: none;
	}
	/* カード内は枠なしのゴースト表示。高さは抑えつつ、タップ幅は確保する。 */
	.icon-btn.ghost {
		border: none;
		background: transparent;
		min-width: 2.6rem;
		height: 2.1rem;
		font-size: 1.1rem;
	}
	.icon-btn.ghost:hover {
		background: var(--bg);
	}
	.icon-btn.ghost.danger:hover {
		background: color-mix(in srgb, var(--danger) 14%, transparent);
	}
</style>
