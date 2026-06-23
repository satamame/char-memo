<script lang="ts">
	import { base } from '$app/paths';
	import Avatar from './Avatar.svelte';
	import type { Char } from '$lib/db/schema';

	interface Props {
		char: Char;
	}
	let { char }: Props = $props();
</script>

<a class="item" href="{base}/book/{char.bookId}/char/{char.id}">
	<Avatar image={char.image} name={char.name} size={48} />
	<div class="text">
		<div class="name">{char.name || '(名前未設定)'}</div>
		{#if char.description}
			<div class="desc">{char.description}</div>
		{/if}
	</div>
</a>

<style>
	.item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.6rem 0.75rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}
	.text {
		min-width: 0;
		flex: 1;
	}
	.name {
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.desc {
		color: var(--text-muted);
		font-size: 0.88rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
