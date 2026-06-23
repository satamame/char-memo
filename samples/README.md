# 共有用サンプルデータと配信メモ

`sample.charmemo.json` は char-memo のエクスポート形式のサンプルです。
アプリの「インポート → URL から → 取得」で読み込めます。

## URL からインポートするときの注意（CORS）

別ドメインの JSON をアプリから取得するには、配信元が
`Access-Control-Allow-Origin` ヘッダ（CORS）を返す必要があります。

### GitHub に置く場合（設定不要で CORS 対応）

このリポジトリに置いたファイルは、次の URL なら **そのまま取得できます**
（`<user>/<repo>/<branch>` は自分のものに置き換え）。

- raw:
  `https://raw.githubusercontent.com/<user>/<repo>/<branch>/samples/sample.charmemo.json`
- jsDelivr（CDN・キャッシュあり）:
  `https://cdn.jsdelivr.net/gh/<user>/<repo>@<branch>/samples/sample.charmemo.json`

> 素の GitHub Pages（`*.github.io`）は CORS ヘッダを返さないことがあるため、
> URL 取得には raw か jsDelivr を推奨します。

### XServer など独自ホストに置く場合

Apache 系なら、JSON を置いたディレクトリの `.htaccess` に以下を追加すると
CORS が有効になります（`mod_headers` 必要・XServer は利用可）。

```apache
<FilesMatch "\.json$">
    Header set Access-Control-Allow-Origin "*"
</FilesMatch>
```

- アプリ本体と **同じドメイン** に JSON を置く場合は、同一オリジンなので CORS 設定は不要です。
- アプリが https なら、JSON も **https** で配信してください（混在コンテンツはブロックされます）。
