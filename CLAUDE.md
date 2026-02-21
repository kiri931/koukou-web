# CLAUDE.md

## Commands

- `npm run dev` — 開発サーバー起動（localhost:4321）
- `npm run build` — プロダクションビルド（`./dist/`に出力）
- `npm run preview` — ビルド結果のプレビュー

テスト・リンターは未設定。

## Critical Constraints

- **プライバシー要件**: すべての画像処理はクライアントサイドで完結すること。サーバーへの画像送信は禁止。
- **CORS設定**: `astro.config.mjs` に OpenCV.js WASM読み込み用の `Cross-Origin-Embedder-Policy: unsafe-none` ヘッダー設定あり。変更時は OpenCV.js の動作確認が必要。
- **React読み込み**: Astroページ内のReactコンポーネントは `client:only="react"` ディレクティブで読み込む（SSR不可のため `client:load` は使わない）。

## MCP

shadcn MCP サーバーが `.mcp.json` で設定済み。shadcn/ui コンポーネント追加時に利用可能。