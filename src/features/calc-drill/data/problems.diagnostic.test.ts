import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { BUTTON_ROWS } from '@/features/scientific-calculator/components/CalcKeypad';
import { useCalculator } from '@/features/scientific-calculator/hooks/useCalculator';
import type { DrillProblem, Rounding } from '../types';
import { PARSED_EXAM_PROBLEMS } from './examProblems';
import { KNOWN_BAD } from './knownBad';
import { ALL_DRILL_PROBLEMS, DRILL_PROBLEMS } from './problems';

const NORMAL_ACTIONS = new Set(BUTTON_ROWS.flat().map((b) => b.action));
const SHIFT_ACTIONS = new Set(
  BUTTON_ROWS.flat()
    .map((b) => b.shiftAction)
    .filter((a): a is string => Boolean(a))
);

/** rounding の指示どおりに丸める。答え合わせの基準を人間と揃えるため。 */
function round(value: number, rounding?: Rounding): number {
  if (!rounding) return value;
  if (rounding.kind === 'decimals') {
    const f = 10 ** rounding.value;
    return Math.round(value * f) / f;
  }
  if (value === 0) return 0;
  const digits = rounding.value - 1 - Math.floor(Math.log10(Math.abs(value)));
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

type PlayResult =
  | { ok: true; value: number }
  | { ok: false; reason: string; detail: string };

/** 実際の電卓に1キーずつ流し込んで、最後の答えを取る。 */
function play(problem: DrillProblem): PlayResult {
  const missing = problem.keySequence.filter(
    (a) => !NORMAL_ACTIONS.has(a) && !SHIFT_ACTIONS.has(a)
  );
  if (missing.length > 0) {
    return { ok: false, reason: '押せないキー', detail: [...new Set(missing)].join(' ') };
  }

  const { result } = renderHook(() => useCalculator());
  act(() => {
    if (result.current.state.angleMode !== problem.angleMode) {
      result.current.pressButton('toggle-angle');
    }
    for (const action of problem.keySequence) {
      // SHIFT はデータに書かず、必要なときにここで差し込む（本番の useCalcDrill と同じ規則）
      if (SHIFT_ACTIONS.has(action) && !NORMAL_ACTIONS.has(action)) {
        result.current.pressButton('toggle-shift');
      }
      result.current.pressButton(action);
    }
  });

  const state = result.current.state;
  if (state.hasError) {
    return { ok: false, reason: '= でエラー', detail: `式="${state.expression}" ${state.result}` };
  }
  const value = Number(state.result);
  if (!Number.isFinite(value)) {
    return { ok: false, reason: '答えが数値でない', detail: state.result };
  }
  return { ok: true, value };
}

function check(problem: DrillProblem): PlayResult & { matched?: boolean } {
  const played = play(problem);
  if (!played.ok) return played;
  const want = Number(problem.expectedAnswer);
  if (!Number.isFinite(want)) {
    return { ok: false, reason: '記載の答えが数値でない', detail: problem.expectedAnswer };
  }
  const got = round(played.value, problem.rounding);
  const rounded = round(want, problem.rounding);
  // 丸めたうえで、相対 0.5% まで許す（記載側の丸め方の揺れを吸収するため）
  const rel = Math.abs(rounded) > 1e-12 ? Math.abs((got - rounded) / rounded) : Math.abs(got - rounded);
  if (rel >= 0.005) {
    return { ok: false, reason: '答えが合わない', detail: `記載 ${problem.expectedAnswer} / 計算 ${played.value}` };
  }
  return { ...played, matched: true };
}

describe('計算技術検定ドリルの問題データ', () => {
  it('出題する問題は、全てガイド通りに打てて答えも合う', () => {
    const failures = DRILL_PROBLEMS.map((problem) => ({ problem, result: check(problem) }))
      .filter((entry) => !entry.result.ok)
      .map(({ problem, result }) => {
        const r = result as Extract<PlayResult, { ok: false }>;
        return `${problem.id} [${problem.level}/${problem.category}] ${r.reason}: ${r.detail}`;
      });

    if (failures.length > 0) {
      throw new Error(
        `出題対象なのに通らない問題が ${failures.length} 件あります。\n` +
          '直すか、data/knownBad.ts に理由付きで載せて出題から外してください。\n' +
          failures.join('\n')
      );
    }
    expect(DRILL_PROBLEMS.length).toBeGreaterThan(0);
  });

  it('3級・4級以外は混ざっていない', () => {
    const wrong = DRILL_PROBLEMS.filter((p) => p.level !== '3級' && p.level !== '4級');
    expect(wrong.map((p) => p.id)).toEqual([]);
  });

  it('伏せている問題・変換できない問題の一覧を出す', () => {
    const excludedByRef = PARSED_EXAM_PROBLEMS.filter((e) => !e.ok);
    const revived = Object.keys(KNOWN_BAD).filter((id) => {
      const problem = ALL_DRILL_PROBLEMS.find((p) => p.id === id);
      return problem ? check(problem).ok : false;
    });

    const lines = [
      `出題している: ${DRILL_PROBLEMS.length} 問（4級 ${DRILL_PROBLEMS.filter((p) => p.level === '4級').length} / 3級 ${DRILL_PROBLEMS.filter((p) => p.level === '3級').length}）`,
      '',
      `データを読み込めなかった: ${excludedByRef.length} 問`,
      ...excludedByRef.map((e) => `  ${'id' in e ? e.id : '?'} (${e.exam_ref ?? '出典なし'}) — ${e.reason}`),
      '',
      `答えが合わず伏せている: ${Object.keys(KNOWN_BAD).length} 問`,
      ...Object.entries(KNOWN_BAD).map(([id, why]) => `  ${id} — ${why}`),
    ];
    if (revived.length > 0) {
      lines.push('', `直って通るようになった（knownBad.ts から外せる）: ${revived.join(', ')}`);
    }
    console.log(lines.join('\n'));
  });
});
