/**
 * SheetDataProcessor.swift の TypeScript 移植
 *
 * Excelやスプレッドシートからコピペされたテキストを解析し、
 * 生徒名に適用する。
 *
 * 対応フォーマット:
 *   - 1列: 各行が1名
 *   - 複数列タブ区切り: 最初の列（出席番号）を飛ばして2列目を名前として使う
 *     例: "1\t足立\n2\t荒牧\n..." → ["足立", "荒牧", ...]
 */

/**
 * クリップボードのテキストから名前リストを抽出する。
 * @returns 名前の配列（空文字はスキップしない）
 */
export function parseNamesFromClipboardText(text: string): string[] {
  const lines = text
    .split('\n')
    .map(line => line.trimEnd()) // 末尾の空白・CRを除去
    .filter(line => line.length > 0)

  return lines.map(line => {
    const cols = line.split('\t')
    if (cols.length >= 2) {
      // タブ区切り: 先頭が数値（出席番号）なら2列目を名前とする
      const first = cols[0].trim()
      if (/^\d+$/.test(first)) {
        return cols[1].trim()
      }
      // 数値でない場合は1列目を名前とする
      return first
    }
    // 1列のみ: そのまま名前
    return line.trim()
  })
}
