import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// サブディレクトリ配置に対応するベースパス。詳細は docs/deploy.md を参照。
//   既定: /apps/char-memo （XServer の配置先）
//   ルート直下に置く場合:   BASE_PATH=/ npm run build
//   別パスに置く場合:       BASE_PATH=/foo/bar npm run build
// 末尾の "/" は正規化で除去する（"/" → "" ＝ルート。Windows で空文字を渡しにくい問題の回避）。
const base = (process.env.BASE_PATH ?? '/apps/char-memo').replace(/\/+$/, '');

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// 完全な静的サイトとして出力する（Node ランタイム不要・静的ホスティングのみで動作）
		adapter: adapter({
			fallback: 'index.html' // SPA フォールバック（動的ルート /book/[id] 等のため）
		}),
		paths: {
			base
		}
	}
};

export default config;
