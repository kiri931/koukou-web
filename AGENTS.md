# AGENTS.md

## Commands

- `npm run dev` — 開発サーバー起動（localhost:4321。埋まっていれば4322以降を自動で使う）
- `npm run build` — プロダクションビルド（`./dist/`に出力）
- `npm run preview` — ビルド結果のプレビュー
- `npm run test:run` — テストを1回流す（Vitest + jsdom）
- `npm run test` / `npm run test:watch` — 見張りながら流す
- `npm run storybook` — Storybook（`src/components/ui/*.stories.tsx`）

リンターは未設定。テストは Vitest が入っていて、`*.test.ts(x)` を置けば拾われる
（設定は `vitest.config.ts`、共通の下ごしらえは `setupTests.ts`）。
`@/` のパス別名はテストでも使える。

判定や生成のロジックは React の外（`lib/` など素の関数）に出してからテストを書く。
画面ごと動かすテストは `@testing-library/react` の `renderHook` / `render` で書ける
（例: `src/features/anki/hooks/useStudySession.test.ts`）。

実データを使う診断テストという書き方もある。`*.diagnostic.test.ts` は
本物のデータを流して品質を見張るもので、機能の合否ではなく
「データが増えたときに崩れていないか」を見る
（例: `src/features/anki/lib/audit.diagnostic.test.ts` が用語集68枚の選択肢を点検する）。

## Critical Constraints

- **プライバシー要件**: すべての画像処理はクライアントサイドで完結すること。サーバーへの画像送信は禁止。
- **CORS設定**: `astro.config.mjs` に OpenCV.js WASM読み込み用の `Cross-Origin-Embedder-Policy: unsafe-none` ヘッダー設定あり。変更時は OpenCV.js の動作確認が必要。
- **React読み込み**: ブラウザ専用のAPI(OpenCV.js・Canvas・localStorage等)に触れる機能コンポーネントは `client:only="react"` で読み込む(SSRできないため)。
  ただし `Header` のようにSSRできて操作も必要なものは `client:load` を使う。
  **`<Header />` に `client:load` を付け忘れると、見た目は出るのに「ツール」の
  ドロップダウンが押しても開かない**という分かりにくい壊れ方をする
  (実際に覚える君のページが本番でこの状態だった)。

## デザインの出どころ

- **ツールの一覧は `src/lib/site-links.ts` から作る。**
  トップページ・ツール一覧ページ・ヘッダーのドロップダウンは、すべてここから作る。
  以前は3箇所が別々に手書きされていて、**ツール一覧ページには16個中6個しか
  出ておらず**、ヘッダーのメニューからも5個が抜けていた。
- **その `site-links.ts` の中身は、メインサイトの
  `koukou-jouhou/src/lib/site-links.ts` の写し。あちらが親。**
  以前はここだけが独自の16件を持っていて、覚える君を使っている生徒が
  ヘッダーから作戦盤・フローチャート・かんじチェックなどに辿り着けなかった。
  **ツールを足すときは、まずメインサイト側に足して、同じ1件をここにも写すこと。**
  リンクはルート基準(`/flowchart/`)で書く。同一ドメインなので絶対URLは不要
  (実際 `https://koukou-jouhou.org/presentation` と `/tools/pdf-viewer/` が
  404 のまま気づかれずに残っていた)。
- カードは `src/components/LinkCard.tsx`、セクション見出しは
  `src/components/SectionHeading.tsx` を使う。Tailwind のクラスを
  ページに直接書き並べない(それが上の状態に戻る原因だった)。
- アクセント色は16進1色だけを `accent` で渡す。アイコンの文字色は
  `color-mix`(`.icon-chip` / `global.css`)が作る。**Tailwind のクラス名を
  `bg-${color}-500/10` のように動的に組み立てないこと** — 静的走査から漏れて
  CSSが出力されず、色が消える。
- 見出しに英大文字(`STUDY` `TOOLS`)を使わない。日本語サイトで中身を表さないうえ、
  スクリーンリーダーが1文字ずつ読み上げることがある。
- 本文は16px以上、読み物の幅は `max-w-3xl`、縦余白は `py-12 sm:py-16`。
  枠線は `slate-300` / ダーク `slate-800`。

見た目の細かい取り決めは、**メインサイト側の
`koukou-jouhou/docs/design-system.md` が親**。こちらはそれに合わせる。

## コンポーネント開発
- UIコンポーネントは React で作成すること。
- コンポーネント作成時は、同ディレクトリに `*.stories.tsx` ファイルも必ず作成すること。既存ストーリー（`src/components/ui/*.stories.tsx`）を参考にする。ただし `src/features/` 配下のコンポーネントはストーリー不要。

## MCP

shadcn MCP サーバーが `.mcp.json` で設定済み。shadcn/ui コンポーネント追加時に利用可能。