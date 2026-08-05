import { useMemo, useState } from 'react';
import { evaluate } from 'mathjs';
import type { AngleMode, CalculatorState, PanelMode } from '../types';
import { applyInsertOperator, applyInsertText } from './calculatorStateTransitions';
import {
  countParenBalance,
  formatExpressionForDisplay,
  nextDmsSeparator,
  prepareForEval,
  splitTrailingOperand,
} from './expression';

function isDigitAction(action: string) {
  return /^[0-9]$/.test(action);
}

function formatNumberLike(value: number) {
  if (!Number.isFinite(value)) return 'Error';
  if (Object.is(value, -0)) return '0';
  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1e12 || abs < 1e-10)) {
    return value.toExponential(10).replace(/\.0+e/, 'e').replace(/(\.\d*?)0+e/, '$1e');
  }
  const rounded = Math.round(value * 1e12) / 1e12;
  return String(rounded);
}

function formatEvalResult(value: unknown): string {
  if (typeof value === 'number') return formatNumberLike(value);
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'valueOf' in value) {
    const primitive = (value as { valueOf: () => unknown }).valueOf();
    if (typeof primitive === 'number') return formatNumberLike(primitive);
    if (typeof primitive === 'string') return primitive;
  }
  return String(value);
}

function factorialSafe(n: number) {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error('階乗は0以上の整数のみ対応');
  }
  if (n > 170) {
    throw new Error('階乗は170以下のみ対応');
  }
  let result = 1;
  for (let i = 2; i <= n; i += 1) result *= i;
  return result;
}

function buildScope(angleMode: AngleMode, memory: number) {
  const toRad = (x: number) => (angleMode === 'DEG' ? (x * Math.PI) / 180 : x);
  const fromRad = (x: number) => (angleMode === 'DEG' ? (x * 180) / Math.PI : x);
  return {
    sin: (x: number) => Math.sin(toRad(x)),
    cos: (x: number) => Math.cos(toRad(x)),
    tan: (x: number) => Math.tan(toRad(x)),
    asin: (x: number) => fromRad(Math.asin(x)),
    acos: (x: number) => fromRad(Math.acos(x)),
    atan: (x: number) => fromRad(Math.atan(x)),
    sqrt: (x: number) => Math.sqrt(x),
    cbrt: (x: number) => Math.cbrt(x),
    // 打つ順（4 ʸ√x 3.56 = 3.56の4乗根）と引数の順を一致させる
    xroot: (n: number, a: number) => (a < 0 && Number.isInteger(n) && n % 2 !== 0 ? -((-a) ** (1 / n)) : a ** (1 / n)),
    log: (x: number) => Math.log10(x),
    ln: (x: number) => Math.log(x),
    exp: (x: number) => Math.exp(x),
    pow10: (x: number) => 10 ** x,
    fact: factorialSafe,
    nPr: (n: number, r: number) => factorialSafe(n) / factorialSafe(n - r),
    nCr: (n: number, r: number) => factorialSafe(n) / (factorialSafe(r) * factorialSafe(n - r)),
    pi: Math.PI,
    e: Math.E,
    M: memory,
  };
}

function parseEvalNumber(expression: string, angleMode: AngleMode, memory: number): number {
  const value = evaluate(prepareForEval(expression), buildScope(angleMode, memory));
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) throw new Error('計算結果が無効です');
  return numeric;
}

function appendWithImplicitMultiplication(base: string, token: string) {
  const trimmed = base.trimEnd();
  const last = trimmed.slice(-1);
  if (trimmed && (/[0-9.]$/.test(trimmed) || last === ')')) {
    return `${trimmed}*${token}`;
  }
  return `${trimmed}${token}`;
}

function createInitialState(): CalculatorState {
  return {
    expression: '',
    result: '0',
    justEvaluated: false,
    hasError: false,
    shiftActive: false,
    angleMode: 'DEG',
    panelMode: 'none',
    memory: 0,
  };
}

const PREFIX_FUNCTIONS = new Set([
  'sqrt(', 'cbrt(', 'sin(', 'cos(', 'tan(',
  'asin(', 'acos(', 'atan(', 'log(', 'pow10(', 'ln(', 'exp(',
]);

const INFIX_FUNCTIONS: Record<string, string> = {
  'xroot(': 'xroot',
  'nPr(': 'nPr',
  'nCr(': 'nCr',
};

export function useCalculator() {
  const [state, setState] = useState<CalculatorState>(createInitialState);

  const parenBalance = useMemo(() => countParenBalance(state.expression), [state.expression]);
  const displayExpression = useMemo(
    () => formatExpressionForDisplay(state.expression),
    [state.expression]
  );

  const clearShiftIfNeeded = (consumed: boolean) => {
    if (!consumed) return;
    setState((prev) => (prev.shiftActive ? { ...prev, shiftActive: false } : prev));
  };

  const evaluateExpression = () => {
    setState((prev) => {
      if (!prev.expression.trim()) return prev;
      try {
        const value = evaluate(prepareForEval(prev.expression), buildScope(prev.angleMode, prev.memory));
        const formatted = formatEvalResult(value);
        if (formatted === 'Error') {
          return { ...prev, result: 'Error', hasError: true, justEvaluated: true };
        }
        return {
          ...prev,
          result: formatted,
          hasError: false,
          justEvaluated: true,
        };
      } catch (error) {
        return {
          ...prev,
          result: error instanceof Error ? error.message : 'Error',
          hasError: true,
          justEvaluated: true,
        };
      }
    });
  };

  const insertText = (token: string, options?: { resetAfterEval?: boolean }) => {
    setState((prev) => applyInsertText(prev, token, options));
  };

  const insertOperator = (operator: string) => {
    setState((prev) => applyInsertOperator(prev, operator));
  };

  const insertPrefixFunction = (fnToken: string) => {
    setState((prev) => {
      const seed = prev.justEvaluated && !prev.hasError ? prev.result : prev.expression;
      return {
        ...prev,
        expression: appendWithImplicitMultiplication(seed, fnToken),
        justEvaluated: false,
        hasError: false,
      };
    });
  };

  /** 4 ʸ√x 3.56 → xroot(4,3.56 ／ 5 nPr 3 → nPr(5,3 */
  const insertInfixFunction = (fnName: string) => {
    setState((prev) => {
      const base = prev.justEvaluated && !prev.hasError ? prev.result : prev.expression;
      const { head, operand } = splitTrailingOperand(base);
      return {
        ...prev,
        expression: `${head}${fnName}(${operand || '0'},`,
        justEvaluated: false,
        hasError: false,
      };
    });
  };

  /** ( 5 - 1 ) x! → fact((5-1)) その場で閉じる後置演算 */
  const insertPostfixFunction = (fnName: string) => {
    setState((prev) => {
      const base = prev.justEvaluated && !prev.hasError ? prev.result : prev.expression;
      const { head, operand } = splitTrailingOperand(base);
      return {
        ...prev,
        expression: `${head}${fnName}(${operand || '0'})`,
        justEvaluated: false,
        hasError: false,
      };
    });
  };

  const insertConstant = (token: 'pi' | 'e') => {
    setState((prev) => {
      const base = prev.justEvaluated && !prev.hasError ? '' : prev.expression;
      return {
        ...prev,
        expression: appendWithImplicitMultiplication(base, token),
        result: prev.justEvaluated ? '0' : prev.result,
        justEvaluated: false,
        hasError: false,
      };
    });
  };

  const insertParenthesis = (token: '(' | ')') => {
    setState((prev) => {
      if (token === '(') {
        const base = prev.justEvaluated && !prev.hasError ? '' : prev.expression;
        return {
          ...prev,
          expression: appendWithImplicitMultiplication(base, token),
          result: prev.justEvaluated && !prev.hasError ? '0' : prev.result,
          justEvaluated: false,
          hasError: false,
        };
      }
      // `)` は一番内側のかっこを1つ閉じるだけ（実機と同じ）。
      // 閉じ忘れは `=` のときにまとめて補う。
      const seed = prev.justEvaluated && !prev.hasError ? prev.result : prev.expression;
      return {
        ...prev,
        expression: `${seed})`,
        justEvaluated: false,
        hasError: false,
      };
    });
  };

  const insertPostfixPower = (token: '^2' | '^3') => {
    setState((prev) => {
      const base = prev.justEvaluated && !prev.hasError ? prev.result : prev.expression;
      return {
        ...prev,
        expression: `${base || '0'}${token}`,
        justEvaluated: false,
        hasError: false,
      };
    });
  };

  /** xʸ は中置。4.62 xʸ 1.57 → 4.62^(1.57 で、次の演算子や `)` で閉じる */
  const insertPowerGroup = () => {
    setState((prev) => {
      const base = prev.justEvaluated && !prev.hasError ? prev.result : prev.expression;
      return {
        ...prev,
        expression: `${base || '0'}^(`,
        justEvaluated: false,
        hasError: false,
      };
    });
  };

  const insertDmsSeparator = () => {
    setState((prev) => {
      const base = prev.justEvaluated && !prev.hasError ? prev.result : prev.expression;
      const separator = nextDmsSeparator(base);
      if (!separator) return prev;
      return {
        ...prev,
        expression: `${base}${separator}`,
        justEvaluated: false,
        hasError: false,
      };
    });
  };

  const evaluateCurrentAsNumber = (prev: CalculatorState): number | null => {
    const source = prev.justEvaluated && !prev.hasError ? prev.result : prev.expression;
    if (!source.trim()) return 0;
    try {
      return parseEvalNumber(source, prev.angleMode, prev.memory);
    } catch {
      return null;
    }
  };

  const pressButton = (action: string) => {
    const consumeShift = action !== 'toggle-shift';

    switch (action) {
      case 'toggle-shift':
        setState((prev) => ({ ...prev, shiftActive: !prev.shiftActive }));
        return;
      case 'toggle-angle':
        setState((prev) => ({
          ...prev,
          angleMode: prev.angleMode === 'DEG' ? 'RAD' : 'DEG',
          justEvaluated: false,
        }));
        break;
      case 'toggle-stats':
        setState((prev) => ({
          ...prev,
          panelMode: prev.panelMode === 'stats' ? 'none' : 'stats',
        }));
        break;
      case 'ac':
        setState((prev) => ({
          ...createInitialState(),
          angleMode: prev.angleMode,
          memory: prev.memory,
        }));
        break;
      case 'del':
        setState((prev) => {
          if (prev.justEvaluated || prev.hasError) {
            return { ...prev, expression: '', result: '0', hasError: false, justEvaluated: false };
          }
          return { ...prev, expression: prev.expression.slice(0, -1), hasError: false };
        });
        break;
      case '=':
        evaluateExpression();
        break;
      case 'mc':
        setState((prev) => ({ ...prev, memory: 0 }));
        break;
      case 'mr':
        setState((prev) => {
          const token = formatNumberLike(prev.memory);
          const base = prev.justEvaluated && !prev.hasError ? '' : prev.expression;
          return {
            ...prev,
            expression: appendWithImplicitMultiplication(base, token),
            result: prev.justEvaluated ? '0' : prev.result,
            justEvaluated: false,
            hasError: false,
          };
        });
        break;
      case 'm+':
        setState((prev) => {
          const value = evaluateCurrentAsNumber(prev);
          if (value === null) return prev;
          return { ...prev, memory: prev.memory + value };
        });
        break;
      case 'm-':
        setState((prev) => {
          const value = evaluateCurrentAsNumber(prev);
          if (value === null) return prev;
          return { ...prev, memory: prev.memory - value };
        });
        break;
      case 'ans':
        setState((prev) => {
          const token = prev.hasError ? '0' : prev.result;
          const base = prev.justEvaluated && !prev.hasError ? '' : prev.expression;
          return {
            ...prev,
            expression: appendWithImplicitMultiplication(base, token),
            result: prev.justEvaluated ? '0' : prev.result,
            justEvaluated: false,
            hasError: false,
          };
        });
        break;
      case 'exp10':
        // かっこを開かず、指数表記のリテラルとして入れる（3.46e-5）
        setState((prev) => {
          const base = prev.justEvaluated && !prev.hasError ? prev.result : prev.expression;
          return {
            ...prev,
            expression: `${base || '1'}e`,
            justEvaluated: false,
            hasError: false,
          };
        });
        break;
      case 'dms':
        insertDmsSeparator();
        break;
      case 'negate':
        setState((prev) => {
          const base = prev.justEvaluated && !prev.hasError ? prev.result : prev.expression || '0';
          return {
            ...prev,
            expression: `(-(${base}))`,
            justEvaluated: false,
            hasError: false,
          };
        });
        break;
      case '^(':
        insertPowerGroup();
        break;
      default:
        if (isDigitAction(action)) {
          insertText(action, { resetAfterEval: true });
          break;
        }
        if (action === '.') {
          insertText('.', { resetAfterEval: true });
          break;
        }
        if (['+', '-', '*', '/', '^'].includes(action)) {
          insertOperator(action);
          break;
        }
        if (action === '(' || action === ')') {
          insertParenthesis(action);
          break;
        }
        if (action === 'pi' || action === 'e') {
          insertConstant(action);
          break;
        }
        if (action === '^2' || action === '^3') {
          insertPostfixPower(action);
          break;
        }
        if (action === 'fact(') {
          insertPostfixFunction('fact');
          break;
        }
        if (INFIX_FUNCTIONS[action]) {
          insertInfixFunction(INFIX_FUNCTIONS[action]);
          break;
        }
        if (PREFIX_FUNCTIONS.has(action)) {
          insertPrefixFunction(action);
          break;
        }
        insertText(action);
        break;
    }

    clearShiftIfNeeded(consumeShift);
  };

  const setPanelMode = (panelMode: PanelMode) => {
    setState((prev) => ({ ...prev, panelMode }));
  };

  return {
    state,
    displayExpression,
    parenBalance,
    pressButton,
    setPanelMode,
  };
}
