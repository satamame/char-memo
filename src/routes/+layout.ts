// 完全クライアント動作の PWA（SPA）。
// SSR は無効、プリレンダリングはしない（動的ルート /book/[id] があるため）。
// 全ルートは adapter-static の fallback(index.html) から起動する。
export const ssr = false;
export const prerender = false;
