export type AngleMode = 'DEG' | 'RAD';
export type PanelMode = 'none' | 'dms' | 'stats';

export interface CalculatorState {
  expression: string;
  result: string;
  justEvaluated: boolean;
  hasError: boolean;
  shiftActive: boolean;
  angleMode: AngleMode;
  panelMode: PanelMode;
  memory: number;
}

export interface DmsState {
  degrees: string;
  minutes: string;
  seconds: string;
}

export type CalcButtonVariant = 'digit' | 'operator' | 'action' | 'function' | 'mode' | 'memory';

export interface ButtonDef {
  label: string;
  shiftLabel?: string;
  action: string;
  shiftAction?: string;
  variant: CalcButtonVariant;
  wide?: boolean;
  description?: string;
  shiftDescription?: string;
}

export interface StatisticsSummary {
  n: number;
  mean: number;
  stddev: number;
}
