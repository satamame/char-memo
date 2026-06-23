import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			// 更新は自動適用せず、UI で通知してユーザー操作で適用する（編集中のデータ保護のため）
			registerType: 'prompt',
			manifest: {
				name: 'char-memo — 登場人物メモ',
				short_name: 'char-memo',
				description: '読書中の登場人物を覚えておくためのメモアプリ',
				lang: 'ja',
				theme_color: '#1f2933',
				background_color: '#ffffff',
				display: 'standalone',
				start_url: '/',
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
				// アプリシェルをプリキャッシュしてオフライン動作させる
				globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}']
			},
			devOptions: {
				enabled: false
			}
		})
	]
});
