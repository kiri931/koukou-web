export type DrillLevel = '3級' | '4級';

export type DrillCategory = '四則計算' | '関数計算' | '応用計算' | '実務計算';

/** 答えをどこまで丸めて答えるか。自動検算（problems.diagnostic.test.ts）もこれを見る。 */
export type Rounding =
  | { kind: 'decimals'; value: number }
  | { kind: 'sigfigs'; value: number };

export interface DrillProblem {
  id: string;
  level: DrillLevel;
  category: DrillCategory;
  question: string;
  expectedAnswer: string;
  keySequence: string[];
  /** 'RAD' の問題は、手順に入る前に DEG/RAD キーを押させる */
  angleMode: 'DEG' | 'RAD';
  rounding?: Rounding;
  exam_ref?: string;
}

export type DrillLevelFilter = DrillLevel | '両方';

export function roundingLabel(rounding?: Rounding): string | null {
  if (!rounding) return null;
  return rounding.kind === 'decimals'
    ? `小数第${rounding.value}位まで`
    : `有効数字${rounding.value}けたまで`;
}
