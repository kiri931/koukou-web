import type { DrillCategory, DrillLevel, Rounding } from '../types';
import { dec, decNonZero, int, pick, type Rng } from './random';

/**
 * 類題のもと。過去問そのものは持たず、同じ「形」の問題をここから作る。
 *
 * 区分は計算技術検定（全国工業高等学校長協会）の実際の出題区分に合わせてある。
 *   4級: 四則計算（4〜6数値）／集計計算（積和・割合）／実務計算（比例・反比例・平方・平方根）
 *   3級: 四則計算（6〜12数値・固定小数点／浮動小数点）／
 *        関数計算（合成関数・三角関数の度分秒・ラジアン）／
 *        実務計算（平方根の比例反比例・順列組合せ・一次式の変形）
 *
 * `value` は **電卓を通さない素の JavaScript で** 計算する。
 * ドリルは `guide` を電卓に流して答えを出すので、
 * この2つを突き合わせれば「ガイドが式と食い違っていないか」を機械が検算できる。
 * 同じ計算を2通りで書くのは重複ではなく、そのための二重化である。
 */
export interface RawProblem {
  category: DrillCategory;
  question: string;
  guide: string[];
  value: number;
  rounding: Rounding;
  angleMode?: 'DEG' | 'RAD';
}

export type Template = (rng: Rng) => RawProblem;

const D2: Rounding = { kind: 'decimals', value: 2 };
const D1: Rounding = { kind: 'decimals', value: 1 };
const D0: Rounding = { kind: 'decimals', value: 0 };
const S3: Rounding = { kind: 'sigfigs', value: 3 };

const toRad = (deg: number) => (deg * Math.PI) / 180;
const dmsValue = (d: number, m: number, s: number) => d + m / 60 + s / 3600;

/** |値| が小さすぎる分母を避ける。答えが桁外れになって練習にならないため。 */
function spread(rng: Rng, min: number, max: number, places: number, gapFrom: number, minGap: number) {
  for (let i = 0; i < 30; i += 1) {
    const v = dec(rng, min, max, places);
    if (Math.abs(v.n - gapFrom) >= minGap) return v;
  }
  return dec(rng, gapFrom + minGap, max, places);
}

// ────────────────────────────────────────────────────────────
// 4級 四則計算 — 4〜6個の数値
// ────────────────────────────────────────────────────────────

const yon_shisoku: Template[] = [
  (rng) => {
    const a = dec(rng, 10, 99, 1);
    const b = dec(rng, 1, 9, 2);
    const c = int(rng, 2, 9);
    return {
      category: '四則計算',
      question: `${a.tok} - ${b.tok} × ${c}`,
      guide: [a.tok, '-', b.tok, '×', String(c), '='],
      value: a.n - b.n * c,
      rounding: D2,
    };
  },
  (rng) => {
    // 割り切れるように、先に商を決めてから足される数を作る
    const c = int(rng, 2, 9);
    const q = dec(rng, 2, 60, 1);
    const a = dec(rng, 1, q.n * c - 1, 1);
    const bN = Number((q.n * c - a.n).toFixed(1));
    return {
      category: '四則計算',
      question: `( ${a.tok} + ${bN} ) ÷ ${c}`,
      guide: ['(', a.tok, '+', String(bN), ')', '÷', String(c), '='],
      value: (a.n + bN) / c,
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 10, 99, 1);
    const b = dec(rng, 1, 9, 1);
    const c = int(rng, 2, 12);
    const d = int(rng, 2, 12);
    return {
      category: '四則計算',
      question: `${a.tok} × ${b.tok} - ${c} × ${d}`,
      guide: [a.tok, '×', b.tok, '-', String(c), '×', String(d), '='],
      value: a.n * b.n - c * d,
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 60, 1);
    const b = dec(rng, 1, 60, 1);
    const c = dec(rng, 10, 90, 1);
    const d = dec(rng, 1, 9, 1);
    return {
      category: '四則計算',
      question: `( ${a.tok} + ${b.tok} ) × ( ${c.tok} - ${d.tok} )`,
      guide: ['(', a.tok, '+', b.tok, ')', '×', '(', c.tok, '-', d.tok, ')', '='],
      value: (a.n + b.n) * (c.n - d.n),
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 10, 99, 1);
    const b = decNonZero(rng, 1, 9, 1, 0.5);
    const c = dec(rng, 1, 30, 1);
    const d = int(rng, 2, 9);
    return {
      category: '四則計算',
      question: `${a.tok} ÷ ${b.tok} + ${c.tok} × ${d}`,
      guide: [a.tok, '÷', b.tok, '+', c.tok, '×', String(d), '='],
      value: a.n / b.n + c.n * d,
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 10, 99, 1);
    const b = dec(rng, 1, 40, 1);
    const c = dec(rng, 1, 9, 1);
    const d = int(rng, 2, 12);
    return {
      category: '四則計算',
      question: `${a.tok} + ${b.tok} - ${c.tok} × ${d}`,
      guide: [a.tok, '+', b.tok, '-', c.tok, '×', String(d), '='],
      value: a.n + b.n - c.n * d,
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 20, 99, 1);
    const b = dec(rng, 1, 19, 1);
    const c = dec(rng, 1, 20, 1);
    const d = dec(rng, 1, 20, 1);
    return {
      category: '四則計算',
      question: `( ${a.tok} - ${b.tok} ) ÷ ( ${c.tok} + ${d.tok} )`,
      guide: ['(', a.tok, '-', b.tok, ')', '÷', '(', c.tok, '+', d.tok, ')', '='],
      value: (a.n - b.n) / (c.n + d.n),
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 20, 1);
    const b = dec(rng, 1, 40, 1);
    const c = dec(rng, 1, 40, 1);
    const d = dec(rng, 1, 99, 1);
    return {
      category: '四則計算',
      question: `${a.tok} × ( ${b.tok} + ${c.tok} ) - ${d.tok}`,
      guide: [a.tok, '×', '(', b.tok, '+', c.tok, ')', '-', d.tok, '='],
      value: a.n * (b.n + c.n) - d.n,
      rounding: D2,
    };
  },
  (rng) => {
    // 5個の数値。4級の上限に近い長さ
    const a = dec(rng, 10, 99, 1);
    const b = dec(rng, 1, 9, 1);
    const c = int(rng, 2, 9);
    const d = dec(rng, 10, 90, 1);
    const e = int(rng, 2, 9);
    return {
      category: '四則計算',
      question: `${a.tok} + ${b.tok} × ${c} - ${d.tok} ÷ ${e}`,
      guide: [a.tok, '+', b.tok, '×', String(c), '-', d.tok, '÷', String(e), '='],
      value: a.n + b.n * c - d.n / e,
      rounding: D2,
    };
  },
];

// ────────────────────────────────────────────────────────────
// 4級 集計計算 — 積和・割合
// ────────────────────────────────────────────────────────────

const yon_shukei: Template[] = [
  (rng) => {
    const a = int(rng, 60, 480);
    const m = int(rng, 2, 30);
    const b = int(rng, 60, 480);
    const n = int(rng, 2, 30);
    const c = int(rng, 60, 480);
    const p = int(rng, 2, 30);
    return {
      category: '集計計算',
      question: `1個 ${a} 円を ${m} 個、1個 ${b} 円を ${n} 個、1個 ${c} 円を ${p} 個買ったときの合計金額`,
      guide: [String(a), '×', String(m), '+', String(b), '×', String(n), '+', String(c), '×', String(p), '='],
      value: a * m + b * n + c * p,
      rounding: D0,
    };
  },
  (rng) => {
    const a = int(rng, 1200, 98000);
    const b = dec(rng, 1, 95, 1);
    return {
      category: '集計計算',
      question: `${a} 円の ${b.tok} % はいくらか`,
      guide: [String(a), '×', b.tok, '÷', '100', '='],
      value: (a * b.n) / 100,
      rounding: D2,
    };
  },
  (rng) => {
    const b = int(rng, 200, 9000);
    const a = int(rng, 10, b);
    return {
      category: '集計計算',
      question: `${a} は ${b} の何 % か`,
      guide: [String(a), '÷', String(b), '×', '100', '='],
      value: (a / b) * 100,
      rounding: D1,
    };
  },
  (rng) => {
    const xs = Array.from({ length: 5 }, () => dec(rng, 10, 990, 1));
    return {
      category: '集計計算',
      question: `${xs.map((x) => x.tok).join(' + ')} の平均`,
      guide: [
        '(',
        ...xs.flatMap((x, i) => (i === 0 ? [x.tok] : ['+', x.tok])),
        ')',
        '÷',
        '5',
        '=',
      ],
      value: xs.reduce((sum, x) => sum + x.n, 0) / 5,
      rounding: D2,
    };
  },
  (rng) => {
    const a = int(rng, 800, 48000);
    const b = int(rng, 5, 60);
    return {
      category: '集計計算',
      question: `${a} 円の品を ${b} % 引きで買うといくらか`,
      guide: [String(a), '×', '(', '100', '-', String(b), ')', '÷', '100', '='],
      value: (a * (100 - b)) / 100,
      rounding: D2,
    };
  },
  (rng) => {
    const a = int(rng, 500, 9000);
    const r = int(rng, 8, 12);
    return {
      category: '集計計算',
      question: `税抜 ${a} 円に ${r} % の税を加えるといくらか`,
      guide: [String(a), '×', '(', '100', '+', String(r), ')', '÷', '100', '='],
      value: (a * (100 + r)) / 100,
      rounding: D2,
    };
  },
  (rng) => {
    const a = int(rng, 200, 5000);
    const b = a + int(rng, 20, 4000);
    return {
      category: '集計計算',
      question: `${a} が ${b} になった。何 % 増えたか`,
      guide: ['(', String(b), '-', String(a), ')', '÷', String(a), '×', '100', '='],
      value: ((b - a) / a) * 100,
      rounding: D1,
    };
  },
  (rng) => {
    const a = int(rng, 80, 600);
    const m = int(rng, 2, 40);
    const b = int(rng, 80, 600);
    const n = int(rng, 2, 40);
    return {
      category: '集計計算',
      question: `1個 ${a} 円を ${m} 個、1個 ${b} 円を ${n} 個 買ったときの平均単価`,
      guide: ['(', String(a), '×', String(m), '+', String(b), '×', String(n), ')', '÷', '(', String(m), '+', String(n), ')', '='],
      value: (a * m + b * n) / (m + n),
      rounding: D2,
    };
  },
  (rng) => {
    const xs = Array.from({ length: 6 }, () => dec(rng, 10, 9900, 1));
    return {
      category: '集計計算',
      question: `${xs.map((x) => x.tok).join(' + ')} の合計`,
      guide: [...xs.flatMap((x, i) => (i === 0 ? [x.tok] : ['+', x.tok])), '='],
      value: xs.reduce((sum, x) => sum + x.n, 0),
      rounding: D1,
    };
  },
];

// ────────────────────────────────────────────────────────────
// 4級 実務計算 — 比例・反比例・平方・平方根
// ────────────────────────────────────────────────────────────

const yon_jitsumu: Template[] = [
  (rng) => {
    const a = dec(rng, 1, 20, 2);
    const x = dec(rng, 1, 40, 1);
    return {
      category: '実務計算',
      question: `y = ${a.tok} x において、x = ${x.tok} のときの y`,
      guide: [a.tok, '×', x.tok, '='],
      value: a.n * x.n,
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 10, 900, 1);
    const x = decNonZero(rng, 0.5, 40, 2, 0.5);
    return {
      category: '実務計算',
      question: `y = ${a.tok} ÷ x において、x = ${x.tok} のときの y`,
      guide: [a.tok, '÷', x.tok, '='],
      value: a.n / x.n,
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 0.5, 12, 2);
    const x = dec(rng, 1, 20, 2);
    return {
      category: '実務計算',
      question: `y = ${a.tok} x² において、x = ${x.tok} のときの y`,
      guide: [a.tok, '×', x.tok, 'x²', '='],
      value: a.n * x.n * x.n,
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 20, 2);
    const x = dec(rng, 0.5, 90, 2);
    return {
      category: '実務計算',
      question: `y = ${a.tok} √x において、x = ${x.tok} のときの y`,
      guide: [a.tok, '×', '√', x.tok, '='],
      value: a.n * Math.sqrt(x.n),
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 10, 900, 1);
    const x = decNonZero(rng, 0.5, 30, 2, 0.5);
    return {
      category: '実務計算',
      question: `y = ${a.tok} ÷ x² において、x = ${x.tok} のときの y`,
      guide: [a.tok, '÷', x.tok, 'x²', '='],
      value: a.n / (x.n * x.n),
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 30, 2);
    const x = dec(rng, 1, 90, 2);
    return {
      category: '実務計算',
      question: `y = √( ${a.tok} x ) において、x = ${x.tok} のときの y`,
      guide: ['√', '(', a.tok, '×', x.tok, ')', '='],
      value: Math.sqrt(a.n * x.n),
      rounding: D2,
    };
  },
  (rng) => {
    // 定数 a, b をもつ一次式に代入する
    const a = dec(rng, 0.5, 15, 2);
    const b = dec(rng, 1, 60, 1);
    const x = dec(rng, 1, 40, 1);
    return {
      category: '実務計算',
      question: `y = ${a.tok} x + ${b.tok} において、x = ${x.tok} のときの y`,
      guide: [a.tok, '×', x.tok, '+', b.tok, '='],
      value: a.n * x.n + b.n,
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 90, 2);
    const b = dec(rng, 1, 90, 2);
    return {
      category: '実務計算',
      question: `直角をはさむ2辺が ${a.tok} と ${b.tok} のときの斜辺 c = √( a² + b² )`,
      guide: ['√', '(', a.tok, 'x²', '+', b.tok, 'x²', ')', '='],
      value: Math.sqrt(a.n ** 2 + b.n ** 2),
      rounding: D2,
    };
  },
];

// ────────────────────────────────────────────────────────────
// 3級 四則計算 — 固定小数点（小数第2位まで）と浮動小数点（有効数字3けた）
// ────────────────────────────────────────────────────────────

const san_shisoku: Template[] = [
  (rng) => {
    const [a, b, c, d, e] = Array.from({ length: 5 }, () => dec(rng, 0.1, 9.99, 2));
    const f = spread(rng, 0.1, 9.99, 2, e.n, 0.3);
    return {
      category: '四則計算',
      question: `${a.tok} - { ${b.tok} - ( ${c.tok} + ${d.tok} ) × ( ${e.tok} - ${f.tok} ) }`,
      guide: [a.tok, '-', '(', b.tok, '-', '(', c.tok, '+', d.tok, ')', '×', '(', e.tok, '-', f.tok, ')', ')', '='],
      value: a.n - (b.n - (c.n + d.n) * (e.n - f.n)),
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 0.1, 9.99, 2);
    const b = decNonZero(rng, 0.5, 9.99, 2, 0.5);
    const [c, d, e, f] = Array.from({ length: 4 }, () => dec(rng, 0.1, 9.99, 2));
    return {
      category: '四則計算',
      question: `${a.tok} ÷ ${b.tok} × ( ${c.tok} × ${d.tok} - ${e.tok} × ${f.tok} )`,
      guide: [a.tok, '÷', b.tok, '×', '(', c.tok, '×', d.tok, '-', e.tok, '×', f.tok, ')', '='],
      value: (a.n / b.n) * (c.n * d.n - e.n * f.n),
      rounding: D2,
    };
  },
  (rng) => {
    const [a, b, c, d, e] = Array.from({ length: 5 }, () => dec(rng, 0.1, 9.99, 2));
    const f = spread(rng, 0.1, 9.99, 2, e.n, 0.5);
    return {
      category: '四則計算',
      question: `${a.tok} × { ${b.tok} - ( ${c.tok} + ${d.tok} ) ÷ ( ${e.tok} - ${f.tok} ) }`,
      guide: [a.tok, '×', '(', b.tok, '-', '(', c.tok, '+', d.tok, ')', '÷', '(', e.tok, '-', f.tok, ')', ')', '='],
      value: a.n * (b.n - (c.n + d.n) / (e.n - f.n)),
      rounding: D2,
    };
  },
  (rng) => {
    const [a, b, c, d, e] = Array.from({ length: 5 }, () => dec(rng, 0.1, 9.99, 2));
    const f = decNonZero(rng, 0.5, 9.99, 2, 0.5);
    return {
      category: '四則計算',
      question: `( ${a.tok} + ${b.tok} ) × { - ( ${c.tok} + ${d.tok} ) - ${e.tok} ÷ ${f.tok} }`,
      guide: ['(', a.tok, '+', b.tok, ')', '×', '(', '-', '(', c.tok, '+', d.tok, ')', '-', e.tok, '÷', f.tok, ')', '='],
      value: (a.n + b.n) * (-(c.n + d.n) - e.n / f.n),
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 0.1, 9.99, 2);
    const b = decNonZero(rng, 0.5, 9.99, 2, 0.5);
    const [c, d] = Array.from({ length: 2 }, () => dec(rng, 0.1, 9.99, 2));
    const e = dec(rng, 0.1, 9.99, 2);
    const f = spread(rng, 0.1, 9.99, 2, e.n, 0.3);
    return {
      category: '四則計算',
      question: `( ${a.tok} - ${c.tok} ÷ ${b.tok} ) × ( ${d.tok} - ${e.tok} × ${f.tok} )`,
      guide: ['(', a.tok, '-', c.tok, '÷', b.tok, ')', '×', '(', d.tok, '-', e.tok, '×', f.tok, ')', '='],
      value: (a.n - c.n / b.n) * (d.n - e.n * f.n),
      rounding: D2,
    };
  },
  // ここから浮動小数点（×10ⁿ を使う）
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const c = dec(rng, 1, 9.99, 2);
    const d = spread(rng, 1, 9.99, 2, c.n, 0.8);
    const p = int(rng, 2, 9);
    const q = int(rng, 4, 11);
    const sign = pick(rng, ['+', '-'] as const);
    const num = sign === '+' ? a.n * 10 ** p + b.n * 10 ** p : a.n * 10 ** p - b.n * 10 ** p;
    return {
      category: '四則計算',
      question: `( ${a.tok} × 10^${p} ${sign} ${b.tok} × 10^${p} ) ÷ ( ${c.tok} × 10^${q} - ${d.tok} × 10^${q} )`,
      guide: ['(', a.tok, 'EXP', String(p), sign, b.tok, 'EXP', String(p), ')', '÷',
              '(', c.tok, 'EXP', String(q), '-', d.tok, 'EXP', String(q), ')', '='],
      value: num / (c.n * 10 ** q - d.n * 10 ** q),
      rounding: S3,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const c = dec(rng, 1, 9.99, 2);
    const p = int(rng, 2, 5);
    const q = int(rng, 2, 5);
    const r = int(rng, 3, 6);
    return {
      category: '四則計算',
      question: `${a.tok} × 10^-${p} × ( ${b.tok} × 10^-${q} + ${c.tok} × 10^-${r} )`,
      guide: [a.tok, 'EXP', '-', String(p), '×', '(', b.tok, 'EXP', '-', String(q), '+', c.tok, 'EXP', '-', String(r), ')', '='],
      value: a.n * 10 ** -p * (b.n * 10 ** -q + c.n * 10 ** -r),
      rounding: S3,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const c = dec(rng, 1, 9.99, 2);
    const d = dec(rng, 1, 9.99, 2);
    // 割り算で桁が跳ね上がらないよう、分母の指数は分子と近い正の値にする
    const p = int(rng, 4, 10);
    const q = int(rng, 5, 9);
    const r = int(rng, q - 2, q + 2);
    return {
      category: '四則計算',
      question: `${a.tok} × 10^${p} - ${b.tok} × 10^${q} ÷ ( ${c.tok} × 10^${r} + ${d.tok} × 10^${r} )`,
      guide: [a.tok, 'EXP', String(p), '-', b.tok, 'EXP', String(q), '÷',
              '(', c.tok, 'EXP', String(r), '+', d.tok, 'EXP', String(r), ')', '='],
      value: a.n * 10 ** p - (b.n * 10 ** q) / (c.n * 10 ** r + d.n * 10 ** r),
      rounding: S3,
    };
  },
];

// ────────────────────────────────────────────────────────────
// 3級 関数計算 — 合成関数・三角関数（度分秒・ラジアン）
// ────────────────────────────────────────────────────────────

const san_kansuu: Template[] = [
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const c = dec(rng, 1.2, 9.99, 2);
    const d = dec(rng, 1, 9.99, 2);
    const denom = b.n * b.n - Math.log10(c.n) * d.n;
    if (Math.abs(denom) < 0.2) {
      // 分母が 0 に近いと答えが桁外れになる。係数をずらして作り直す
      const d2 = Number((d.n + 3).toFixed(2));
      return {
        category: '関数計算',
        question: `${a.tok} + 1 ÷ ( ${b.tok}² - log ${c.tok} × ${d2} )`,
        guide: [a.tok, '+', '(', '1', '÷', '(', b.tok, 'x²', '-', 'log', c.tok, '×', String(d2), ')', ')', '='],
        value: a.n + 1 / (b.n * b.n - Math.log10(c.n) * d2),
        rounding: D2,
      };
    }
    return {
      category: '関数計算',
      question: `${a.tok} + 1 ÷ ( ${b.tok}² - log ${c.tok} × ${d.tok} )`,
      guide: [a.tok, '+', '(', '1', '÷', '(', b.tok, 'x²', '-', 'log', c.tok, '×', d.tok, ')', ')', '='],
      value: a.n + 1 / denom,
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const d1 = int(rng, 20, 84);
    const m1 = int(rng, 1, 59);
    const s1 = int(rng, 1, 59);
    const d2 = int(rng, 10, 70);
    const m2 = int(rng, 1, 59);
    const s2 = int(rng, 1, 59);
    const t = Math.tan(toRad(dmsValue(d1, m1, s1)));
    const s = Math.sin(toRad(dmsValue(d2, m2, s2)));
    return {
      category: '関数計算',
      question: `${a.tok} - ${b.tok} × tan ${d1}°${m1}'${s1}" ÷ sin ${d2}°${m2}'${s2}"`,
      guide: [a.tok, '-', b.tok, '×', 'tan', String(d1), '°\'"', String(m1), '°\'"', String(s1), '°\'"',
              '÷', 'sin', String(d2), '°\'"', String(m2), '°\'"', String(s2), '°\'"', '='],
      value: a.n - (b.n * t) / s,
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const n = int(rng, 3, 6);
    const c = dec(rng, 1.2, 9.99, 2);
    const d = dec(rng, 1.2, 9.99, 2);
    const e = dec(rng, 1.05, 2.5, 2);
    const denom = -b.n * c.n ** (1 / n) + d.n ** e.n;
    if (Math.abs(denom) < 0.2) {
      return san_kansuu[5](rng);
    }
    return {
      category: '関数計算',
      question: `${a.tok} ÷ ( - ${b.tok} × ${n}√${c.tok} + ${d.tok}^${e.tok} )`,
      guide: [a.tok, '÷', '(', '-', b.tok, '×', String(n), 'x√', c.tok, '+', d.tok, 'x^y', e.tok, ')', '='],
      value: a.n / denom,
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const p = dec(rng, 0.2, 1.8, 2);
    const b = dec(rng, 1, 9.99, 2);
    const c = dec(rng, 1, 9.99, 2);
    const d = dec(rng, 1, 9.99, 2);
    const e = decNonZero(rng, 0.5, 9.99, 2, 0.4);
    return {
      category: '関数計算',
      question: `${a.tok} × 10^${p.tok} - ³√( ${b.tok} × ${c.tok} ) + ${d.tok} ÷ ${e.tok}²`,
      guide: [a.tok, '×', '10^x', p.tok, '-', '³√', '(', b.tok, '×', c.tok, ')', '+', d.tok, '÷', e.tok, 'x²', '='],
      value: a.n * 10 ** p.n - Math.cbrt(b.n * c.n) + d.n / (e.n * e.n),
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const k = int(rng, 3, 8);
    const m = int(rng, 1, 4);
    const n = int(rng, 5, 9);
    return {
      category: '関数計算',
      angleMode: 'RAD',
      question: `${a.tok} × tan ( π ÷ ${k} ) - ${b.tok} × sin ( ${m} ÷ ${n} × π )`,
      guide: [a.tok, '×', 'tan', '(', 'π', '÷', String(k), ')', '-', b.tok, '×', 'sin', '(', String(m), '÷', String(n), '×', 'π', ')', '='],
      value: a.n * Math.tan(Math.PI / k) - b.n * Math.sin((m / n) * Math.PI),
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const c = dec(rng, 1, 9.99, 2);
    const d = dec(rng, 1.2, 9.99, 2);
    const e = dec(rng, 0.3, 2.2, 2);
    return {
      category: '関数計算',
      question: `${a.tok} × ( ${b.tok} × √${c.tok} + ${d.tok}^${e.tok} )`,
      guide: [a.tok, '×', '(', b.tok, '×', '√', c.tok, '+', d.tok, 'x^y', e.tok, ')', '='],
      value: a.n * (b.n * Math.sqrt(c.n) + d.n ** e.n),
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const c = dec(rng, 1.2, 9.99, 2);
    const d = dec(rng, 1.5, 9.99, 2);
    const logd = Math.log10(d.n);
    if (Math.abs(logd) < 0.15) return san_kansuu[5](rng);
    return {
      category: '関数計算',
      question: `${a.tok} × ( ${b.tok} - ³√${c.tok} ÷ log ${d.tok} )`,
      guide: [a.tok, '×', '(', b.tok, '-', '³√', c.tok, '÷', 'log', d.tok, ')', '='],
      value: a.n * (b.n - Math.cbrt(c.n) / logd),
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const t1 = dec(rng, 10, 80, 1);
    const t2 = dec(rng, 10, 80, 1);
    const b = dec(rng, 1, 9.99, 2);
    const denom = Math.cos(toRad(t1.n)) - Math.sin(toRad(t2.n));
    if (Math.abs(denom) < 0.15) return san_kansuu[5](rng);
    return {
      category: '関数計算',
      question: `${a.tok} × ( ${b.tok} ÷ ( cos ${t1.tok}° - sin ${t2.tok}° ) )`,
      guide: [a.tok, '×', '(', b.tok, '÷', '(', 'cos', t1.tok, '-', 'sin', t2.tok, ')', ')', '='],
      value: a.n * (b.n / denom),
      rounding: D2,
    };
  },
];

// ────────────────────────────────────────────────────────────
// 3級 実務計算 — 平方根の比例反比例・順列組合せ・一次式の変形
// ────────────────────────────────────────────────────────────

const san_jitsumu: Template[] = [
  (rng) => {
    const a = dec(rng, 10, 99, 2);
    const b = decNonZero(rng, 0.5, 9.99, 2, 0.5);
    const x = decNonZero(rng, 1, 9.99, 2, 0.8);
    const negative = rng() < 0.4;
    const xTok = negative ? `- ${x.tok}` : x.tok;
    return {
      category: '実務計算',
      question: `y = ${a.tok} ÷ ( ${b.tok} x² ) において、x = ${xTok} のときの y`,
      guide: negative
        ? [a.tok, '÷', '(', b.tok, '×', '(', '-', x.tok, ')', 'x²', ')', '=']
        : [a.tok, '÷', '(', b.tok, '×', x.tok, 'x²', ')', '='],
      value: a.n / (b.n * x.n * x.n),
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const x = dec(rng, 0.5, 90, 2);
    return {
      category: '実務計算',
      question: `y = ${a.tok} √x において、x = ${x.tok} のときの y`,
      guide: [a.tok, '×', '√', x.tok, '='],
      value: a.n * Math.sqrt(x.n),
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const x = decNonZero(rng, 0.3, 9.99, 2, 0.3);
    return {
      category: '実務計算',
      question: `y = - ${a.tok} × ${b.tok} ÷ √x において、x = ${x.tok} のときの y`,
      guide: ['-', a.tok, '×', b.tok, '÷', '√', x.tok, '='],
      value: (-a.n * b.n) / Math.sqrt(x.n),
      rounding: D2,
    };
  },
  (rng) => {
    const n = int(rng, 5, 9);
    const r = int(rng, 2, n - 1);
    return {
      category: '実務計算',
      question: `${n} 個から ${r} 個を取り出して並べる順列 ${n}P${r}`,
      guide: [String(n), 'nPr', String(r), '='],
      value: fact(n) / fact(n - r),
      rounding: D0,
    };
  },
  (rng) => {
    const n = int(rng, 6, 17);
    const r = int(rng, 2, Math.min(n - 1, 8));
    return {
      category: '実務計算',
      question: `${n} 個から ${r} 個を選ぶ組合せ ${n}C${r}`,
      guide: [String(n), 'nCr', String(r), '='],
      value: fact(n) / (fact(r) * fact(n - r)),
      rounding: D0,
    };
  },
  (rng) => {
    const n = int(rng, 4, 8);
    return {
      category: '実務計算',
      question: `円順列の数 P = ( n - 1 )! を求めよ。n = ${n} の場合`,
      guide: ['(', String(n), '-', '1', ')', 'x!', '='],
      value: fact(n - 1),
      rounding: D0,
    };
  },
  (rng) => {
    const a = decNonZero(rng, 0.2, 9.99, 2, 0.2);
    // b は負にもなるが、キーは「-」を別に押す。数値トークンに符号は入れない
    const bAbs = dec(rng, 0.1, 9.99, 2);
    const bNegative = rng() < 0.5;
    const bValue = bNegative ? -bAbs.n : bAbs.n;
    const bText = bNegative ? `- ${bAbs.tok}` : bAbs.tok;
    const y = dec(rng, 1, 20, 2);
    return {
      category: '実務計算',
      question: `y = a x + b を x について解き、a = ${a.tok}, b = ${bText}, y = ${y.tok} を代入した値`,
      guide: bNegative
        ? ['(', y.tok, '+', bAbs.tok, ')', '÷', a.tok, '=']
        : ['(', y.tok, '-', bAbs.tok, ')', '÷', a.tok, '='],
      value: (y.n - bValue) / a.n,
      rounding: D2,
    };
  },
  (rng) => {
    const a = dec(rng, 1, 9.99, 2);
    const b = dec(rng, 1, 9.99, 2);
    const c = spread(rng, 1, 9.99, 2, b.n, 0.5);
    const y = dec(rng, 1, 20, 2);
    return {
      category: '実務計算',
      question: `y = x ÷ ( a - b ) を x について解き、a = ${b.tok}, b = ${c.tok}, y = ${y.tok} を代入した値`,
      guide: [y.tok, '×', '(', b.tok, '-', c.tok, ')', '='],
      value: y.n * (b.n - c.n),
      rounding: D2,
    };
  },
  (rng) => {
    // 一次式の変形 + 平方根（三平方の定理の形）
    const b = dec(rng, 1, 9.99, 2);
    const c = dec(rng, 1, 9.99, 2);
    const t = dec(rng, 20, 160, 1);
    return {
      category: '実務計算',
      question: `a = √( b² + c² - 2 b c cos θ ) において、b = ${b.tok}, c = ${c.tok}, θ = ${t.tok}° のときの a`,
      guide: ['√', '(', b.tok, 'x²', '+', c.tok, 'x²', '-', '2', '×', b.tok, '×', c.tok, '×', 'cos', t.tok, ')', '='],
      value: Math.sqrt(b.n ** 2 + c.n ** 2 - 2 * b.n * c.n * Math.cos(toRad(t.n))),
      rounding: D2,
    };
  },
];

function fact(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i += 1) r *= i;
  return r;
}

export const TEMPLATES: Record<DrillLevel, Record<string, Template[]>> = {
  '4級': {
    四則計算: yon_shisoku,
    集計計算: yon_shukei,
    実務計算: yon_jitsumu,
  },
  '3級': {
    四則計算: san_shisoku,
    関数計算: san_kansuu,
    実務計算: san_jitsumu,
  },
};

export const CATEGORIES_BY_LEVEL: Record<DrillLevel, DrillCategory[]> = {
  '4級': ['四則計算', '集計計算', '実務計算'],
  '3級': ['四則計算', '関数計算', '実務計算'],
};
