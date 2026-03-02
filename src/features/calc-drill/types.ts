export interface DrillProblem {
  id: string;
  level: '4級' | '3級';
  category: '四則計算' | '関数計算' | '応用計算' | '実務計算' | '方程式' | '方程式の応用';
  question: string;
  expectedAnswer: string;
  keySequence: string[];
  ghostExpression?: string;
  exam_ref?: string;
  note?: string;
  hint?: string;
}

export type DrillLevelFilter = '4級' | '3級' | '両方';
