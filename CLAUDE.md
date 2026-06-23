# CLAUDE.md

このリポジトリで作業するときのメモ。

## バックログ / TODO

作業の保留事項と優先順位は [TODO.md](TODO.md) を参照（セッション開始時にまず確認する）。

## プロジェクト概要

- 読書中の登場人物を覚えておくためのメモ PWA。詳細は [README.md](README.md)。
- 用語: 作品 = **book** / 登場人物 = **char**。
- データは IndexedDB（books / chars）、設定は localStorage。完全クライアント動作の SPA。

## よく使うコマンド

- `npm run dev` … 開発サーバ
- `npm run check` … 型チェック（svelte-check）
- `npm run build` … 本番ビルド（`build/` を静的ホスティングへ配置）
- `npm run icons` … アイコン再生成（`icon-source.png` から）

## 変更時の確認

- コミット前に `npm run check` と `npm run build` が通ることを確認する。
- コミットは指示があったときに行う（勝手に push しない）。
