# デプロイと base path（配置パス）

char-memo は静的サイト（SPA）として `build/` を出力し、静的ホスティングに置くだけで動く。
ただし**どの URL パスに置くか**（＝ base path）をビルド時に埋め込む必要がある。
ルート直下以外（例：`https://example.com/apps/char-memo/`）に置くと、設定しないと
アセットが 404 になる。

## 既定値

- 既定の base path は **`/apps/char-memo`**（XServer の配置先）。
- 変更は環境変数 `BASE_PATH` で行う。末尾の `/` は自動で除去される。
  - ルート直下に置く: `BASE_PATH=/`（→ 空文字に正規化）
  - サブディレクトリ: `BASE_PATH=/foo/bar`
  - 制約: 先頭は `/`、末尾 `/` は不要（自動除去）。

## base path に関係するファイル

| ファイル | 役割 | 自動追従 |
| --- | --- | --- |
| `svelte.config.js` | `kit.paths.base`（リンク・アセットの接頭辞） | `BASE_PATH` で可 |
| `vite.config.ts` | PWA の `scope` / `start_url` | `BASE_PATH` で可 |
| `static/.htaccess` | Apache の SPA フォールバック（`RewriteBase`） | **手動**（テンプレートではない） |

> アプリ内の内部リンクは `$app/paths` の `base` を付けて生成しているため、
> `BASE_PATH` を変えればリンク・`goto`・ヘッダのロゴ画像はすべて自動で追従する。
> **手動で直すのは `static/.htaccess` の `RewriteBase` だけ。**

## base path を変更する手順

例：`/apps/char-memo` → `/reader/char-memo` に変えるとき。

1. **`.htaccess` の `RewriteBase` を新パスに合わせる**（`static/.htaccess`）。
   - サブディレクトリ: `RewriteBase /reader/char-memo/`（末尾 `/` あり）
   - ルート直下: `RewriteBase /`
2. **新しい base path でビルドする**。
   - PowerShell:
     ```powershell
     $env:BASE_PATH = '/reader/char-memo'; npm run build; Remove-Item Env:\BASE_PATH
     ```
   - bash:
     ```bash
     BASE_PATH=/reader/char-memo npm run build
     ```
   - ルート直下に置く場合は `BASE_PATH=/` を渡す。
3. **`build/` の中身をすべて、配置先ディレクトリに再アップロードする**。
   - base が変わるとアセットの参照先が全部変わるので、**全ファイル差し替え**。
   - `.htaccess` はドットファイル。FTPクライアントが隠す設定だとアップ漏れするので注意。
4. **動作確認**：
   - トップ（`https://example.com/reader/char-memo/`）が 404 なく開く。
   - 人物ページの URL を直接開く／リロードしても 404 にならない（`.htaccess` が効いている）。

## 既定値そのものを変えたい場合

毎回 `BASE_PATH` を渡したくない場合は、既定値（フォールバック）を書き換える：

- `svelte.config.js` … `?? '/apps/char-memo'` の部分
- `vite.config.ts` … 同上
- `static/.htaccess` … `RewriteBase`

この3か所を新パスに揃えれば、以後は `npm run build` だけで新パス向けに出力される。

## 注意点

- **dev サーバも base 配下になる**。`npm run dev` 起動後のアクセスは
  `http://localhost:5173<base>/`（既定なら `/apps/char-memo/`）。`/` は 404。
- **PWA の scope が変わると別アプリ扱い**になる。base を変更すると、既にインストール済みの
  端末では旧 scope の PWA が残ることがある。新パスでインストールし直すと確実。
- **同一オリジン配信なら CORS 不要**。インポートで読む JSON を別ドメインに置く場合の
  CORS については `samples/README.md` を参照。
- Apache 以外（Nginx 等）に置く場合は、`.htaccess` の代わりに
  「実ファイルが無ければ `index.html` を返す」フォールバックをサーバ設定で行う。
