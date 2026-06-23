<script lang="ts">
	// PWA 更新通知。新しい SW を検知したらトーストを出し、ユーザー操作で適用する（prompt 方式）。
	// dev では SW 無効のため何も表示されない。
	import { useRegisterSW } from 'virtual:pwa-register/svelte';

	const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW();

	function dismiss() {
		needRefresh.set(false);
		offlineReady.set(false);
	}
</script>

{#if $needRefresh}
	<div class="toast" role="status">
		<span class="msg">新しいバージョンがあります。</span>
		<div class="row">
			<!-- true を渡すと新バージョンを適用してリロード -->
			<button type="button" class="btn btn-primary" onclick={() => updateServiceWorker(true)}>
				更新
			</button>
			<button type="button" class="btn" onclick={dismiss}>後で</button>
		</div>
	</div>
{:else if $offlineReady}
	<div class="toast" role="status">
		<span class="msg">オフラインで使えるようになりました。</span>
		<div class="row">
			<button type="button" class="btn" onclick={dismiss}>OK</button>
		</div>
	</div>
{/if}

<style>
	.toast {
		position: fixed;
		left: 50%;
		transform: translateX(-50%);
		bottom: calc(1rem + env(safe-area-inset-bottom));
		z-index: 200;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
		max-width: min(560px, calc(100vw - 2rem));
		padding: 0.7rem 0.9rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
	}
	.msg {
		font-size: 0.9rem;
	}
	.row {
		display: flex;
		gap: 0.5rem;
		margin-left: auto;
	}
</style>
