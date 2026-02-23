import { useMemo, useState } from 'react';
import { evaluate } from 'mathjs';
import type { AngleMode, CalculatorState, DmsState, PanelMode } from '../types';
import { applyInsertOperator, applyInsertText } from './calculatorStateTransitions';

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
    yroot: (x: number, y: number) => x ** (1 / y),
    log: (x: number) => Math.log10(x),
    ln: (x: number) => Math.log(x),
    exp: (x: number) => Math.exp(x),
    pow10: (x: number) => 10 ** x,
    nPr: (n: number, r: number) => factorialSafe(n) / factorialSafe(n - r),
    nCr: (n: number, r: number) => factorialSafe(n) / (factorialSafe(r) * factorialSafe(n - r)),
    pi: Math.PI,
    e: Math.E,
    M: memory,
  };
}

function parseEvalNumber(expression: string, angleMode: AngleMode, memory: number): number {
  const value = evaluate(expression, buildScope(angleMode, memory));
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

function countParenBalance(expression: string) {
  let balance = 0;
  for (const ch of expression) {
    if (ch === '(') balance += 1;
    if (ch === ')') balance -= 1;
  }
  return balance;
}

function formatExpressionForDisplay(expression: string) {
  return expression
    .replace(/\*10\^\(/g, '×10^(')
    .replace(/\*/g, '×')
    .replace(/\//g, '÷')
    .replace(/\bpi\b/g, 'π')
    .replace(/\byroot\(/g, 'ʸ√x(')
    .replace(/\bpow10\(/g, '10^(')
    .replace(/\bexp\(/g, 'e^(');
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

export function useCalculator() {
  const [state, setState] = useState<CalculatorState>(createInitialState);
  const [dms, setDms] = useState<DmsState>({ degrees: '', minutes: '', seconds: '' });
  const [dmsError, setDmsError] = useState<string | null>(null);

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
        const value = evaluate(prev.expression, buildScope(prev.angleMode, prev.memory));
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

  const insertFunction = (fnToken: string) => {
    setState((prev) => {
      const seed = prev.justEvaluated && !prev.hasError ? prev.result : prev.expression;
      const nextExpression = prev.justEvaluated && !prev.hasError && prev.result !== ''
        ? `${fnToken}${seed})`
        : appendWithImplicitMultiplication(seed, fnToken);
      return {
        ...prev,
        expression: nextExpression,
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
      const base = prev.justEvaluated && !prev.hasError && token === '(' ? '' : prev.expression;
      const expression =
        token === '('
          ? appendWithImplicitMultiplication(base, token)
          : `${prev.justEvaluated && !prev.hasError ? prev.result : prev.expression}${token}`;
      return {
        ...prev,
        expression,
        result: prev.justEvaluated && token === '(' ? '0' : prev.result,
        justEvaluated: false,
        hasError: false,
      };
    });
  };

  const insertPostfix = (token: '^2' | '^3') => {
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
      case 'toggle-dms':
        setState((prev) => ({
          ...prev,
          panelMode: prev.panelMode === 'dms' ? 'none' : 'dms',
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
        setDmsError(null);
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
      case 'exp10':
        setState((prev) => {
          const base = prev.justEvaluated && !prev.hasError ? prev.result : prev.expression;
          return {
            ...prev,
            expression: `${base || '1'}*10^(`,
            justEvaluated: false,
            hasError: false,
          };
        });
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
          insertPostfix(action);
          break;
        }
        if (action === 'yroot(' || action === 'sqrt(' || action === 'cbrt(' || action === 'sin(' || action === 'cos(' || action === 'tan(' || action === 'asin(' || action === 'acos(' || action === 'atan(' || action === 'log(' || action === 'pow10(' || action === 'ln(' || action === 'exp(' || action === 'nPr(' || action === 'nCr(') {
          insertFunction(action);
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

  const setDmsField = (field: keyof DmsState, value: string) => {
    if (/^-?\d*(\.\d*)?$/.test(value) || value === '' || value === '-') {
      setDms((prev) => ({ ...prev, [field]: value }));
      setDmsError(null);
    }
  };

  const parseDmsToDegrees = () => {
    const deg = Number(dms.degrees || '0');
    const min = Number(dms.minutes || '0');
    const sec = Number(dms.seconds || '0');

    if (![deg, min, sec].every(Number.isFinite)) {
      throw new Error('DMS入力が不正です');
    }
    if (min < 0 || min >= 60) throw new Error('分は0〜59で入力');
    if (sec < 0 || sec >= 60) throw new Error('秒は0〜59.999で入力');

    const sign = deg < 0 ? -1 : 1;
    const absDeg = Math.abs(deg);
    return sign * (absDeg + min / 60 + sec / 3600);
  };

  const applyDmsToExpression = () => {
    try {
      const value = parseDmsToDegrees();
      setState((prev) => ({
        ...prev,
        expression: appendWithImplicitMultiplication(
          prev.justEvaluated && !prev.hasError ? '' : prev.expression,
          formatNumberLike(value)
        ),
        result: prev.justEvaluated ? '0' : prev.result,
        panelMode: 'none',
        justEvaluated: false,
        hasError: false,
      }));
      setDmsError(null);
    } catch (error) {
      setDmsError(error instanceof Error ? error.message : 'DMSエラー');
    }
  };

  const calculateDmsTrig = (kind: 'sin' | 'cos' | 'tan' | 'asin' | 'acos' | 'atan') => {
    try {
      const degreesValue = parseDmsToDegrees();
      const scope = buildScope(state.angleMode, state.memory);
      const fn = scope[kind] as (x: number) => number;
      const value = fn(degreesValue);
      const formatted = formatNumberLike(value);
      if (formatted === 'Error') throw new Error('計算結果が無効です');
      setState((prev) => ({
        ...prev,
        result: formatted,
        hasError: false,
        justEvaluated: true,
      }));
      setDmsError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'DMS計算エラー';
      setDmsError(message);
      setState((prev) => ({ ...prev, result: message, hasError: true, justEvaluated: true }));
    } finally {
      if (state.shiftActive) {
        setState((prev) => ({ ...prev, shiftActive: false }));
      }
    }
  };

  return {
    state,
    dms,
    dmsError,
    displayExpression,
    parenBalance,
    pressButton,
    setPanelMode,
    setDmsField,
    applyDmsToExpression,
    calculateDmsTrig,
  };
}
