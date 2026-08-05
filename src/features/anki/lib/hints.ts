// 「ヒント」ボタンを押した回数だけ開く、段階的なヒント。
// 詳しくは docs/anki/spec.md の「4. ヒント」。

import type { Card } from '../types';
import { displayAnswer } from './questionMode';

export const MAX_HINT_LEVEL = 3;

export interface Hint {
  /** 何のヒントか（見出しとして出す） */
  label: string;
  /** 中身 */
  value: string;
}

/**
 * 文字数・最初の1文字を数えるときの形。
 *
 * 「問題解決の手順（PDCAサイクル）」は「問題解決の手順」＝7文字として扱う。
 * 括弧の中まで数えると、答えとして打つ形と食い違う。
 */
export function hintBase(card: Card): string {
  return displayAnswer(card)
    .replace(/[（(].*?[）)]/g, '')
    .trim();
}

/**
 * 開いた段階数ぶんのヒントを返す。
 *
 * level は 0〜3。0 のときは空配列（押していないので何も出ない）。
 * topic が無いカードでは1段階目を飛ばし、文字数から始める。
 */
export function buildHints(card: Card, level: number): Hint[] {
  const base = hintBase(card);
  const all: Hint[] = [];

  if (card.topic) {
    all.push({ label: 'カテゴリ', value: card.topic });
  }
  if (base) {
    all.push({ label: '文字数', value: `${'○'.repeat(base.length)}（${base.length}文字）` });
    all.push({
      label: '最初の1文字',
      value: base.length > 1 ? `${base[0]}${'○'.repeat(base.length - 1)}` : base,
    });
  }

  return all.slice(0, Math.max(0, level));
}

/** これ以上ヒントが残っているか（ボタンを出すかどうか） */
export function hasMoreHints(card: Card, level: number): boolean {
  return buildHints(card, MAX_HINT_LEVEL).length > level;
}
