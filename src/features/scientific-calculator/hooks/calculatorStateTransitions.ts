import type { CalculatorState } from '../types';

const OPERATORS = ['+', '-', '*', '/', '^'] as const;

function isOperator(char?: string) {
  return !!char && OPERATORS.includes(char as (typeof OPERATORS)[number]);
}

export function applyInsertText(
  prev: CalculatorState,
  token: string,
  options?: { resetAfterEval?: boolean }
): CalculatorState {
  const resetAfterEval = options?.resetAfterEval ?? false;
  const shouldReset = prev.hasError || (prev.justEvaluated && resetAfterEval);
  return {
    ...prev,
    expression: shouldReset ? token : `${prev.expression}${token}`,
    result: shouldReset ? '0' : prev.result,
    hasError: false,
    justEvaluated: false,
  };
}

export function applyInsertOperator(prev: CalculatorState, operator: string): CalculatorState {
  const base = prev.justEvaluated && !prev.hasError ? prev.result : prev.expression;
  const normalized = base || (operator === '-' ? '' : '0');

  if (!normalized && operator === '-') {
    return {
      ...prev,
      expression: '-',
      justEvaluated: false,
      hasError: false,
    };
  }

  const last = normalized.slice(-1);
  const expression = isOperator(last)
    ? `${normalized.slice(0, -1)}${operator}`
    : `${normalized}${operator}`;

  return {
    ...prev,
    expression,
    justEvaluated: false,
    hasError: false,
  };
}
