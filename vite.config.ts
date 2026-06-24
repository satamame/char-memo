import { readFileSync } from 'node:fs';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

// svelte.config.js と同じベースパス（サブディレクトリ配置対応）。詳細は docs/deploy.md。
// PWA の scope / start_url をこの配下にする必要がある。
const base = (process.env.BASE_PATH ?? '/apps/char-memo').replace(/\/+$/, '');
const scope = `${base}/`;

// package.json の version をビルド時にアプリへ埋め込む（画面表示用）
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

export default defineConfig({
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version)
	},
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			// 更新は自動適用せず、UI で通知してユーザー操作で適用する（編集中のデータ保護のため）
			registerType: 'prompt',
			// SPA（adapter-static の fallback: index.html / prerender=false）向けのオフライン対応。
			// フォールバック HTML は adapter がプラグインより後に生成するため glob では拾えない。
			// spa オプションが _app/version.json のハッシュ付きで precache へ追加し、
			// navigateFallback も adapterFallback（= index.html）= SW スコープ（base 配下）相対に
			// なるので、サブディレクトリ配置でもオフライン初回ロードが効く。詳細は docs/deploy.md。
			kit: {
				adapterFallback: 'index.html',
				spa: true
			},
			manifest: {
				name: 'char-memo — 登場人物メモ',
				short_name: 'char-memo',
				description: '読書中の登場人物を覚えておくためのメモアプリ',
				lang: 'ja',
				theme_color: '#1f2933',
				background_color: '#ffffff',
				display: 'standalone',
				scope,
				start_url: scope,
				icons: [
					{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
					{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
					{
						src: 'icons/icon-512-maskable.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			},
			workbox: {
				// 静的アセット（JS/CSS/アイコン/manifest 等）をプリキャッシュ。
				// 土台 HTML（index.html）は上の kit.spa 経由で別途 precache される。
				globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}']
			},
			devOptions: {
				enabled: false
			}
		})
	]
});
