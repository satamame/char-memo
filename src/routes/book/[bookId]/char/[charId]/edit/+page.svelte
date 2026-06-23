<script lang="ts">
	// 人物の編集画面。ヘッダ＝名前（その場で編集可）。
	// 保存/戻る時:  新規追加(?new=1)なら人物一覧へ、変更なら詳細画面へ戻る。
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { getChar, updateChar, deleteChar } from '$lib/db/chars';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import ImagePicker from '$lib/components/ImagePicker.svelte';

	const bookId = $derived(page.params.bookId!);
	const charId = $derived(page.params.charId!);
	const isNew = $derived(page.url.searchParams.get('new') === '1');

	// 編集用ローカル状態（fetch 後に初期化）
	let name = $state('');
	let description = $state('');
	let image = $state<Blob | null>(null);
	let appearanceNote = $state('');
	let freeNote = $state('');

	let loaded = $state(false);
	let notFound = $state(false);
	let saved = $state(false); // 保存済みなら戻る時に新規でも削除しない

	// 読み込み時点のスナップショット（変更検知用）
	let original = $state({
		name: '',
		description: '',
		image: null as Blob | null,
		appearanceNote: '',
		freeNote: ''
	});

	$effect(() => {
		const id = charId;
		loaded = false;
		notFound = false;
		saved = false;
		(async () => {
			const c = await getChar(id);
			if (c) {
				name = c.name;
				description = c.description;
				image = c.image;
				appearanceNote = c.appearanceNote;
				freeNote = c.freeNote;
				original = {
					name: c.name,
					description: c.description,
					image: c.image,
					appearanceNote: c.appearanceNote,
					freeNote: c.freeNote
				};
			} else {
				notFound = true;
			}
			loaded = true;
		})();
	});

	// 入力が読み込み時から変化しているか（画像は参照比較で判定）
	const dirty = $derived(
		name !== original.name ||
			description !== original.description ||
			image !== original.image ||
			appearanceNote !== original.appearanceNote ||
			freeNote !== original.freeNote
	);

	// 改行を許さない項目はその場で除去
	function oneLine(s: string): string {
		return s.replace(/[\r\n]+/g, ' ');
	}

	const detailHref = $derived(`${base}/book/${bookId}/char/${charId}`);
	const listHref = $derived(`${base}/book/${bookId}`);

	async function save() {
		await updateChar(charId, {
			name: oneLine(name).trim(),
			description: oneLine(description).trim(),
			image,
			appearanceNote,
			freeNote
		});
		saved = true;
		goto(isNew ? listHref : detailHref);
	}

	async function back() {
		// 変更があるのに戻る場合は破棄の確認をする
		if (dirty && !confirm('変更を破棄して戻りますか？')) return;
		// 新規作成の人物を未保存のまま戻る＝作成キャンセル → 空の人物を削除
		if (isNew && !saved) {
			await deleteChar(charId);
			goto(listHref);
		} else {
			goto(isNew ? listHref : detailHref);
		}
	}
</script>

<AppHeader onback={back}>
	{#snippet titleContent()}
		<input
			class="name-input"
			type="text"
			bind:value={name}
			oninput={() => (name = oneLine(name))}
			placeholder="名前"
			maxlength="120"
			aria-label="名前"
		/>
	{/snippet}
	{#snippet actions()}
		<button type="button" class="icon-btn primary" title="保存" onclick={save} disabled={!loaded}>
			保存
		</button>
	{/snippet}
</AppHeader>

<div class="page">
	{#if !loaded}
		<p class="muted">読み込み中…</p>
	{:else if notFound}
		<p class="muted">人物が見つかりませんでした。</p>
	{:else}
		<form class="editor" onsubmit={(e) => (e.preventDefault(), save())}>
			<ImagePicker {image} {name} onchange={(img) => (image = img)} />

			<label>
				<span>説明</span>
				<input
					type="text"
					bind:value={description}
					oninput={() => (description = oneLine(description))}
					maxlength="200"
					placeholder="職業・性別・年齢など（一覧に表示）"
				/>
			</label>

			<label>
				<span>外見メモ</span>
				<textarea bind:value={appearanceNote} rows="3" placeholder="画像を作る時の参考に"></textarea>
			</label>

			<label>
				<span>自由メモ</span>
				<textarea bind:value={freeNote} rows="6" placeholder="ストーリー上の出来事など"></textarea>
			</label>

			<div class="actions">
				<button type="submit" class="btn btn-primary">保存</button>
			</div>
		</form>
	{/if}
</div>

<style>
	.name-input {
		width: 100%;
		padding: 0.4em 0.55em;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--surface);
		font-size: 1.1rem;
		font-weight: 700;
	}
	.editor {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	label span {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-muted);
	}
	input,
	textarea {
		width: 100%;
		padding: 0.55em 0.7em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		resize: vertical;
	}
	.actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.muted {
		color: var(--text-muted);
	}
</style>
