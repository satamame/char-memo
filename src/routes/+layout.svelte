<script lang="ts">
	import '../app.css';
	import ReloadPrompt from '$lib/components/ReloadPrompt.svelte';

	let { children } = $props();
</script>

<div class="app">
	{@render children()}
	<ReloadPrompt />
</div>

<style>
	.app {
		max-width: 760px;
		margin: 0 auto;
		min-height: 100dvh;
	}
</style>
