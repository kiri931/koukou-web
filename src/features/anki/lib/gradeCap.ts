// 自己採点の上限。
// 4択で当てただけ・ヒントを見て書けただけのカードを Easy にすると、
// FSRS が「よく覚えている」と判断して次回が数週間先になってしまう。
// 詳しくは docs/anki/spec.md の「5. ヒント・選択が復習間隔に与える影響」。

import type { Grade } from '../types';
import type { QuestionMode } from './questionMode';

export interface GradeCapContext {
  mode: QuestionMode;
  usedHint: boolean;
  isCorrect: boolean | null;
}

/** 押せる最大の評価 */
export function maxGrade(ctx: GradeCapContext): Grade {
  if (!ctx.isCorrect) return 1;
  if (ctx.usedHint) return 2;
  if (ctx.mode === 'choice') return 3;
  return 4;
}

/**
 * 上限を超える評価を丸める。
 *
 * ボタンを出さないだけでは、数字キーの 4 がそのまま通ってしまう。
 * キーボードからの入力も必ずここを通す。
 */
export function capGrade(grade: Grade, ctx: GradeCapContext): Grade {
  const max = maxGrade(ctx);
  return (grade > max ? max : grade) as Grade;
}

/** なぜ選べないのかを1行で。理由の無い制限は不親切 */
export function gradeCapReason(ctx: GradeCapContext): string | null {
  if (!ctx.isCorrect) return null;
  if (ctx.usedHint) return 'ヒントを見て答えたので、「Good」「Easy」は出しません。もう一度短い間隔で出ます。';
  if (ctx.mode === 'choice') return '選んで正解したので「Easy」は出しません。次は自分で書いて答えます。';
  return null;
}
