import type { DrillProblem } from '../types';

/**
 * 「どのキーで間違えたか」の記録。
 *
 * 数えるのは **押すべきだったキー** であって、実際に押した誤ったキーではない。
 * 知りたいのは「SHIFT を押し忘れる」「°′″ の順番が分からない」といった
 * つまずきどころで、押し間違えた先には意味がないため。
 *
 * 端末の localStorage にだけ置く。誰がどこで間違えたかを外に出さない。
 */
export type MissCounts = Record<string, number>;

const STORAGE_KEY = 'calc-drill:miss-counts:v1';

export function recordMiss(counts: MissCounts, action: string): MissCounts {
  return { ...counts, [action]: (counts[action] ?? 0) + 1 };
}

export function topMisses(counts: MissCounts, limit = 5): { action: string; count: number }[] {
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count || a.action.localeCompare(b.action))
    .slice(0, limit);
}

export function totalMisses(counts: MissCounts): number {
  return Object.values(counts).reduce((sum, n) => sum + n, 0);
}

/**
 * 間違えたキーを含む問題を前に出す。並びは安定させる
 * （同じ点数なら元の順のまま。毎回入れ替わると解き直しにくい）。
 */
export function sortByWeakness(problems: DrillProblem[], counts: MissCounts): DrillProblem[] {
  const score = (problem: DrillProblem) => {
    const used = new Set(problem.keySequence);
    let total = 0;
    for (const [action, count] of Object.entries(counts)) {
      // toggle-shift は手順に書かれていないので、SHIFT 側のキーの有無で見る
      if (action === 'toggle-shift') {
        if (problem.keySequence.some((a) => SHIFT_SIDE.has(a))) total += count;
        continue;
      }
      if (action === 'toggle-angle') {
        if (problem.angleMode === 'RAD') total += count;
        continue;
      }
      if (used.has(action)) total += count;
    }
    return total;
  };

  return problems
    .map((problem, index) => ({ problem, index, score: score(problem) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.problem);
}

/** SHIFT を押さないと出せないキー。CalcKeypad の shiftAction と対応させている。 */
const SHIFT_SIDE = new Set([
  'asin(', 'acos(', 'atan(', '^3', 'cbrt(', 'xroot(', 'pow10(', 'exp(', 'nCr(', 'ans',
]);

export function loadMissCounts(): MissCounts {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const counts: MissCounts = {};
    for (const [action, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) counts[action] = value;
    }
    return counts;
  } catch {
    // 壊れた記録より、記録なしから始めるほうがまし
    return {};
  }
}

export function saveMissCounts(counts: MissCounts): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
  } catch {
    // 容量超過やプライベートモード。記録できなくても練習は続けられる
  }
}

export function clearMissCounts(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 同上
  }
}
