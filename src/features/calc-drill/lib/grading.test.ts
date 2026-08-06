import { describe, expect, it } from 'vitest';
import type { DrillProblem } from '../types';
import { formatRemaining, grade, isAnswerCorrect, PASSING_SCORE } from './grading';

function problem(expectedAnswer: string, rounding?: DrillProblem['rounding']): DrillProblem {
  return {
    id: 'x',
    level: '3級',
    category: '四則計算',
    question: 'x',
    expectedAnswer,
    keySequence: [],
    angleMode: 'DEG',
    rounding,
  };
}

describe('grading', () => {
  it('丸めたうえで比べる（小数第2位まで）', () => {
    const p = problem('-10.37', { kind: 'decimals', value: 2 });
    expect(isAnswerCorrect('-10.37', p)).toBe(true);
    // 電卓には丸める前の値が出ている
    expect(isAnswerCorrect('-10.374829', p)).toBe(true);
    expect(isAnswerCorrect('-10.41', p)).toBe(false);
  });

  it('有効数字3けたの問題', () => {
    const p = problem('3.46e-8', { kind: 'sigfigs', value: 3 });
    expect(isAnswerCorrect('3.4581e-8', p)).toBe(true);
    expect(isAnswerCorrect('3.51e-8', p)).toBe(false);
  });

  it('答えが 0 の問題でも壊れない', () => {
    const p = problem('0', { kind: 'decimals', value: 2 });
    expect(isAnswerCorrect('0', p)).toBe(true);
    expect(isAnswerCorrect('0.001', p)).toBe(true); // 小数第2位まで丸めると 0
    expect(isAnswerCorrect('1', p)).toBe(false);
  });

  it('数値でない表示は不正解にする（Error など）', () => {
    const p = problem('12');
    expect(isAnswerCorrect('Error', p)).toBe(false);
    expect(isAnswerCorrect('', p)).toBe(false);
    expect(isAnswerCorrect('かっこが足りません', p)).toBe(false);
  });

  it('検定と同じ 70点以上で合格', () => {
    expect(grade(7, 10)).toEqual({ correct: 7, total: 10, score: 70, passed: true });
    expect(grade(6, 10)).toEqual({ correct: 6, total: 10, score: 60, passed: false });
    expect(grade(0, 0)).toEqual({ correct: 0, total: 0, score: 0, passed: false });
    expect(PASSING_SCORE).toBe(70);
  });

  it('残り時間の表示', () => {
    expect(formatRemaining(600)).toBe('10:00');
    expect(formatRemaining(65)).toBe('1:05');
    expect(formatRemaining(0)).toBe('0:00');
    expect(formatRemaining(-5)).toBe('0:00');
  });
});
