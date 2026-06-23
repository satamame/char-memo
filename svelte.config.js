import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// 完全な静的サイトとして出力する（Node ランタイム不要・静的ホスティングのみで動作）
		adapter: adapter({
			fallback: 'index.html' // SPA フォールバック（動的ルート /work/[id] 等のため）
		})
	}
};

export default config;
