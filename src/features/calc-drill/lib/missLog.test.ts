import { beforeEach, describe, expect, it } from 'vitest';
import type { DrillProblem } from '../types';
import {
  clearMissCounts,
  loadMissCounts,
  recordMiss,
  saveMissCounts,
  sortByWeakness,
  topMisses,
  totalMisses,
} from './missLog';

function problem(id: string, keySequence: string[], angleMode: 'DEG' | 'RAD' = 'DEG'): DrillProblem {
  return {
    id,
    level: '3級',
    category: '四則計算',
    question: id,
    expectedAnswer: '0',
    keySequence,
    angleMode,
  };
}

describe('missLog', () => {
  beforeEach(() => {
    clearMissCounts();
  });

  it('数え上げと並べ替え', () => {
    let counts = {};
    counts = recordMiss(counts, 'dms');
    counts = recordMiss(counts, 'dms');
    counts = recordMiss(counts, 'toggle-shift');

    expect(totalMisses(counts)).toBe(3);
    expect(topMisses(counts)).toEqual([
      { action: 'dms', count: 2 },
      { action: 'toggle-shift', count: 1 },
    ]);
  });

  it('間違えたキーを含む問題を前に出す', () => {
    const problems = [
      problem('なし', ['1', '+', '2', '=']),
      problem('度分秒', ['8', '5', 'dms', '=']),
      problem('平方根', ['sqrt(', '9', ')', '=']),
    ];
    const counts = { dms: 5 };

    expect(sortByWeakness(problems, counts).map((p) => p.id)).toEqual(['度分秒', 'なし', '平方根']);
  });

  it('同点なら元の順を保つ', () => {
    const problems = [problem('a', ['1']), problem('b', ['2']), problem('c', ['3'])];
    expect(sortByWeakness(problems, {}).map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('SHIFT の押し忘れは、SHIFT側のキーを使う問題に効く', () => {
    const problems = [
      problem('ふつう', ['sqrt(', '9', ')', '=']),
      problem('SHIFT側', ['cbrt(', '2', '7', ')', '=']),
    ];
    // 手順に toggle-shift は書かれていないので、キー列だけ見ても分からない
    expect(sortByWeakness(problems, { 'toggle-shift': 3 }).map((p) => p.id)).toEqual([
      'SHIFT側',
      'ふつう',
    ]);
  });

  it('角度モードの押し忘れは RAD の問題に効く', () => {
    const problems = [problem('DEG', ['1', '=']), problem('RAD', ['1', '='], 'RAD')];
    expect(sortByWeakness(problems, { 'toggle-angle': 2 }).map((p) => p.id)).toEqual(['RAD', 'DEG']);
  });

  it('保存して読み直せる', () => {
    saveMissCounts({ dms: 3, 'toggle-shift': 1 });
    expect(loadMissCounts()).toEqual({ dms: 3, 'toggle-shift': 1 });

    clearMissCounts();
    expect(loadMissCounts()).toEqual({});
  });

  it('壊れた記録は捨てて、記録なしから始める', () => {
    localStorage.setItem('calc-drill:miss-counts:v1', '{"dms": "こわれてる", "ok": 2}');
    expect(loadMissCounts()).toEqual({ ok: 2 });

    localStorage.setItem('calc-drill:miss-counts:v1', 'これはJSONではない');
    expect(loadMissCounts()).toEqual({});
  });
});
