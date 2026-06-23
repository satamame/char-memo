# char-memo

読書中の登場人物を覚えておくためのメモ PWA。
データは端末内（IndexedDB / localStorage）に保存し、作品単位で JSON にインポート/エクスポートできます。

## 用語（コード内の識別子）

| 画面上 | コード内の名前 |
| --- | --- |
| 作品 | **book** |
| 登場人物 | **char** |

## 技術スタック

- **SvelteKit**（`adapter-static` / 完全クライアント動作の SPA・SSRなし）
- **TypeScript**
- **Vite**（ビルド）+ **@vite-pwa/sveltekit**（オフライン対応・更新は通知して手動適用）
- **idb**（IndexedDB ラッパ）
- **svelte-dnd-action**（人物一覧のドラッグ並べ替え）

## データ構成

```
作品(Book) ─┬─ 人物(Char)
            ├─ 人物(Char)
            └─ ...
```

- 作品・人物 → **IndexedDB**（ストア: `books` / `chars`。画像は Blob で保存）
- アプリ設定 → **localStorage**（`char-memo:settings`）
- 作品名は実質ユニーク（新規作成・改名時に重複チェック）。
- エクスポートは **作品単位**。画像は Base64 で JSON に内包。
- インポートは **取り込み前に作品名を確認/編集**できる（既定値は JSON 内の `title`）。
  確定時に作品名の重複を判定し、**同名があれば上書き／名前を変えれば新規取り込み**。

## 画面と遷移

- **作品一覧**（`/`）… 作品の追加（`+📔` でダイアログ）・インポート（`📥`）・各作品のエクスポート/削除
- **人物一覧**（`/book/[bookId]`）… ヘッダ＝作品タイトル。作品名変更（`✏️`）・エクスポート（`⬇`）・人物追加（`+👤`）。ドラッグで並べ替え
- **人物詳細**（`/book/[bookId]/char/[charId]`）… 読み取り専用。編集へ（`📝`）・この画面で削除
- **人物編集**（`/book/[bookId]/char/[charId]/edit`）… ヘッダの入力欄で名前を編集。`?new=1` で新規モード
  - 保存/戻る時の遷移先: **新規追加なら人物一覧へ／変更なら詳細へ**

## コマンド

```bash
npm run dev      # 開発サーバ (http://localhost:5173)
npm run build    # 本番ビルド → build/（静的ホスティングに配置するだけ）
npm run preview  # ビルド結果のプレビュー
npm run check    # 型チェック (svelte-check)
```

## デプロイ / 配置パス

サブディレクトリ配置（base path）と、その変更手順は **[docs/deploy.md](docs/deploy.md)** を参照。
既定の base は `/apps/char-memo`。ルート直下なら `BASE_PATH=/ npm run build`。

## アイコンについて

`static/icons/` のアイコンは `scripts/make-icons.mjs` が生成したプレースホルダです。
本番用アイコンに差し替えてください（再生成: `node scripts/make-icons.mjs`）。

## 主なディレクトリ

```
src/
├─ lib/
│  ├─ db/        … スキーマ・IndexedDB アクセス層
│  │   ├─ schema.ts    … Book / Char / エクスポート形式の型
│  │   ├─ database.ts  … idb 初期化・マイグレーション
│  │   ├─ books.ts     … 作品の CRUD・改名・重複チェック
│  │   └─ chars.ts     … 人物の CRUD・並べ替え
│  ├─ io/        … 作品単位の import / export
│  ├─ image/     … 画像の正規化(正方形/512px/WebP)と入力元(file/paste/camera/AI)
│  ├─ components/… AppHeader / Avatar / BookCard / CharListItem /
│  │              BookTitleDialog / ImagePicker / ImportDialog / ReloadPrompt
│  └─ settings.ts… localStorage 設定
└─ routes/
   ├─ +page.svelte                                  … 作品一覧
   └─ book/[bookId]/
      ├─ +page.svelte                               … 人物一覧（ドラッグ並べ替え）
      └─ char/[charId]/
         ├─ +page.svelte                            … 人物詳細
         └─ edit/+page.svelte                       … 人物編集
```
