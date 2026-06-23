<script lang="ts">
	// 顔アイコンの表示。Blob から object URL を作り、差し替え/破棄時に確実に解放する。
	interface Props {
		image: Blob | null;
		name?: string;
		size?: number;
	}
	let { image, name = '', size = 48 }: Props = $props();

	let url = $state<string | null>(null);

	$effect(() => {
		if (image) {
			const objectUrl = URL.createObjectURL(image);
			url = objectUrl;
			return () => URL.revokeObjectURL(objectUrl);
		}
		url = null;
	});

	const initial = $derived(name.trim().charAt(0) || '?');
</script>

<div class="avatar" style="--size: {size}px" aria-hidden={!image}>
	{#if url}
		<img src={url} alt={name ? `${name} の顔アイコン` : ''} />
	{:else}
		<span class="placeholder">{initial}</span>
	{/if}
</div>

<style>
	.avatar {
		width: var(--size);
		height: var(--size);
		flex: 0 0 auto;
		border-radius: 50%;
		overflow: hidden;
		background: var(--bg);
		border: 1px solid var(--border);
		display: grid;
		place-items: center;
	}
	.avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.placeholder {
		font-weight: 600;
		color: var(--text-muted);
		font-size: calc(var(--size) * 0.42);
		text-transform: uppercase;
	}
</style>
