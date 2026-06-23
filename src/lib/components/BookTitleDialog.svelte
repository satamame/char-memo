<script lang="ts">
	// 作品名の入力ダイアログ（新規作成・改名の両方で使う）。
	// 作品名はユニーク。excludeId を渡すとその作品自身は重複判定から除外する（改名時）。
	import { untrack } from 'svelte';
	import { findBookByTitle } from '$lib/db/books';

	interface Props {
		heading: string;
		submitLabel: string;
		/** 送信ボタンを強調するか（新規作成の「作成」のみ true 想定） */
		primary?: boolean;
		initialTitle?: string;
		excludeId?: string;
		onsubmit: (title: string) => void | Promise<void>;
		onclose: () => void;
	}
	let {
		heading,
		submitLabel,
		primary = false,
		initialTitle = '',
		excludeId,
		onsubmit,
		onclose
	}: Props = $props();

	let title = $state(untrack(() => initialTitle));
	let error = $state<string | null>(null);
	let busy = $state(false);
	let input = $state<HTMLInputElement | null>(null);

	$effect(() => {
		input?.focus();
		input?.select();
	});

	async function submit() {
		const t = title.trim();
		error = null;
		if (!t) {
			error = '作品名を入力してください';
			return;
		}
		busy = true;
		try {
			if (await findBookByTitle(t, excludeId)) {
				error = '同じ名前の作品が既にあります';
				return;
			}
			await onsubmit(t);
		} catch (e) {
			error = e instanceof Error ? e.message : '保存に失敗しました';
		} finally {
			busy = false;
		}
	}
</script>

<div class="backdrop" role="presentation" onclick={onclose}>
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="dialog" role="dialog" aria-modal="true" tabindex="-1" onclick={(e) => e.stopPropagation()}>
		<h2>{heading}</h2>
		<form onsubmit={(e) => (e.preventDefault(), submit())}>
			<input
				bind:this={input}
				type="text"
				bind:value={title}
				placeholder="作品名"
				maxlength="120"
				aria-label="作品名"
			/>
			{#if error}<p class="error">{error}</p>{/if}
			<div class="row">
				<button type="submit" class="btn" class:btn-primary={primary} disabled={busy}>
					{submitLabel}
				</button>
				<button type="button" class="btn" onclick={onclose}>キャンセル</button>
			</div>
		</form>
	</div>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		display: grid;
		place-items: center;
		padding: 1rem;
		z-index: 100;
	}
	.dialog {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: 1.25rem;
		max-width: 420px;
		width: 100%;
	}
	.dialog h2 {
		margin: 0 0 0.75rem;
		font-size: 1.1rem;
	}
	input {
		width: 100%;
		padding: 0.55em 0.7em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--bg);
	}
	.row {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
	}
	.error {
		color: var(--danger);
		margin: 0.6rem 0 0;
		font-size: 0.9rem;
	}
</style>
