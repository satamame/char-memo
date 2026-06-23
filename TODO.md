# TODO / バックログ

char-memo の作業バックログ。チェックを付けたら `## Done` へ移す。
GitHub に push 後、議論・PR連携・共有が要る項目は Issues に昇格してよい。

## Now（着手中）

- なし（次の着手候補は Next から）

## Next（近いうちに）

- [ ] **ホスティングへデプロイ**：GitHub push → 静的ホスティング（HTTPS・SPAフォールバック確認）
- [ ] **実機（スマホ）でPWA確認**：インストール／オフライン／更新通知／URLインポート
- [ ] **共有リンク（スコープ①）**：`?src=<url>` で自動取込＋アプリ内で共有リンク生成（受け手はタップのみ）

## Someday / Ideas（やるかも）

- [ ] **オフライン初回ロード対応（Service Worker）**：現状、アプリの土台HTMLが precache されず、navigateFallback も base 非対応（`/`）のため、オフラインでは初回ロードできない。オンライン時は常にネットから最新を取得するので実害は小さい（「更新」を押す前から最新版が見える程度）。
  - 調査メモ：
    - ルート(`/`)を prerender すると土台HTMLは precache されるが、URLが `/`（オリジン直下）で base 配下（`/apps/char-memo/`）を指さない。
    - workbox の `manifestTransforms` を自前で与えると、@vite-pwa/sveltekit がURLを配信構造へ変換する内部処理を上書きしてしまい、precache URL が `client/...` や `prerendered/pages/...` のまま壊れる。
    - 正しく直すには「プラグインの変換を潰さず、土台HTMLのURLだけ base 配下へ」「navigateFallback を base 配下へ」する必要がある。**ローカルでビルド→`build/sw.js` 検査の反復**が前提。
- [ ] **ネタバレ②**：人物/自由メモに「ネタバレ印」→ 詳細画面でぼかし＋タップ表示（エクスポートは含む/除外を選択）
- [ ] **ネタバレ③**：読書位置のしきい値（「◯章から」）で、その先を自動的に隠す
- [ ] **Android Web Share Target**：共有メニューから json/URL を取り込み（iOS非対応）
- [ ] **AI画像生成の実装**：`src/lib/image/sources.ts` の `fromAIGeneration`（現状は未実装で例外。要API/ネットワーク）
- [ ] **旧形式インポートの移行対応**：旧 `work`/`persons` 形式を `book`/`char` に変換して取り込み（現状はエラー表示）
- [ ] **iOSのストレージ分離調査**：Safariタブ取込 vs インストール済みPWA のデータ分離挙動の確認・対策
- [ ] **PWA更新の定期チェック**：現状は起動/遷移時のみ（必要なら `registration.update()` を定期実行）

## Done（最近）

- [x] プロジェクト雛形（SvelteKit + adapter-static + TypeScript + PWA）
- [x] book/char データモデル・IndexedDB・作品単位の import/export
- [x] 作品/人物のドラッグ並べ替え
- [x] エクスポートに自由メモ除外オプション（共有時のネタバレ防止）
- [x] URL からのインポート＋サンプルデータ（`samples/`）・配信/CORSメモ
- [x] アプリアイコンをロゴ画像に反映＋作品一覧ヘッダにロゴ表示
- [x] git リポジトリ化・初期コミット
