/** 種を決めれば同じ列が出る乱数。テストで同じ問題を再現するために使う。 */
export type Rng = () => number;

export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** min 以上 max 以下の整数 */
export function int(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[int(rng, 0, items.length - 1)];
}

/**
 * 小数 places 桁の値。
 * 返すのは「実際に押す文字列」と「その文字列が表す値」で、
 * この2つが必ず一致することが大事（答えがずれる原因になるため）。
 */
export function dec(rng: Rng, min: number, max: number, places: number): { n: number; tok: string } {
  const raw = min + rng() * (max - min);
  const n = Number(raw.toFixed(places));
  return { n, tok: String(n) };
}

/** 0 を避けたいところで使う（割る数など） */
export function decNonZero(rng: Rng, min: number, max: number, places: number, floor = 0.05) {
  for (let i = 0; i < 20; i += 1) {
    const v = dec(rng, min, max, places);
    if (Math.abs(v.n) >= floor) return v;
  }
  return { n: min, tok: String(min) };
}
