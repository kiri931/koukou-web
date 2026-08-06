import { roundTo } from '../data/problems';
import type { DrillProblem } from '../types';

/**
 * 本番モードの採点。
 *
 * 検定は各区分100点満点で、70点以上が合格。
 * ここでもその基準に合わせる（点数の出し方を独自にすると、
 * 「本番で受かるのか」の目安として使えなくなるため）。
 */
export const PASSING_SCORE = 70;

/** 検定の1区分の持ち時間 */
export const EXAM_DURATION_SEC = 10 * 60;

/** 1区分の出題数 */
export const EXAM_QUESTION_COUNT = 10;

/**
 * 電卓に出ている値が、その問題の答えとして正しいか。
 *
 * 問題ごとの丸め（小数第2位まで／有効数字3けた）で丸めてから比べる。
 * 生徒が電卓の表示をそのまま答えとして出すので、
 * 丸める前の桁まで一致することは求めない。
 */
export function isAnswerCorrect(displayed: string, problem: DrillProblem): boolean {
  const got = Number(displayed);
  const want = Number(problem.expectedAnswer);
  if (!Number.isFinite(got) || !Number.isFinite(want)) return false;

  // 指定の桁で丸めたあとは厳密に比べる。答えはこちらで作っているので、
  // 記載側の丸めのぶれを吸収する必要がない。許すのは浮動小数点の誤差ぶんだけ。
  //
  // 誤差は必ず**相対**で見ること。絶対値で見ると、答えが 3.46e-8 のような
  // 小さい値のときに 3.51e-8 まで正解になってしまう。
  const a = roundTo(got, problem.rounding);
  const b = roundTo(want, problem.rounding);
  if (b === 0) return Math.abs(a) <= 1e-12;
  return Math.abs((a - b) / b) <= 1e-9;
}

export interface ExamResult {
  correct: number;
  total: number;
  score: number;
  passed: boolean;
}

export function grade(correct: number, total: number): ExamResult {
  const score = total === 0 ? 0 : Math.round((correct / total) * 100);
  return { correct, total, score, passed: score >= PASSING_SCORE };
}

/**
 * 出題する問題を選ぶ。
 *
 * **毎回シャッフルすること。** 先頭から順に取ると、「もう一度やる」で
 * まったく同じ10問が出てしまい、答えを覚えているだけで満点になる。
 * 本番の練習にならない。
 */
export function pickExamQuestions(
  pool: DrillProblem[],
  count: number,
  random: () => number = Math.random
): DrillProblem[] {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

/** 残り時間を mm:ss で。 */
export function formatRemaining(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
