import { act, renderHook } from '@testing-library/react';
import { useCalculator } from './useCalculator';

type CalculatorHook = ReturnType<typeof useCalculator>;

function press(result: { current: CalculatorHook }, ...actions: string[]) {
  act(() => {
    for (const action of actions) {
      result.current.pressButton(action);
    }
  });
}

function setAngleMode(result: { current: CalculatorHook }, mode: 'DEG' | 'RAD') {
  if (result.current.state.angleMode !== mode) {
    press(result, 'toggle-angle');
  }
}

describe('useCalculator', () => {
  it('evaluates a basic arithmetic expression', () => {
    const { result } = renderHook(() => useCalculator());

    press(result, '1', '+', '2', '=');

    expect(result.current.state.expression).toBe('1+2');
    expect(result.current.state.result).toBe('3');
    expect(result.current.state.hasError).toBe(false);
    expect(result.current.state.justEvaluated).toBe(true);
  });

  it('resets expression when a digit is entered after evaluation', () => {
    const { result } = renderHook(() => useCalculator());

    press(result, '1', '+', '2', '=');
    press(result, '4');

    expect(result.current.state.expression).toBe('4');
    expect(result.current.state.result).toBe('0');
    expect(result.current.state.justEvaluated).toBe(false);
    expect(result.current.state.hasError).toBe(false);
  });

  it('continues calculation when an operator is entered after evaluation', () => {
    const { result } = renderHook(() => useCalculator());

    press(result, '1', '+', '2', '=');
    press(result, '+');

    expect(result.current.state.expression).toBe('3+');
    expect(result.current.state.justEvaluated).toBe(false);

    press(result, '4', '=');

    expect(result.current.state.result).toBe('7');
    expect(result.current.state.justEvaluated).toBe(true);
  });

  it('calculates tan(45) in DEG mode with floating point tolerance', () => {
    const { result } = renderHook(() => useCalculator());

    setAngleMode(result, 'DEG');
    press(result, 'tan(', '4', '5', ')', '=');

    expect(result.current.state.angleMode).toBe('DEG');
    expect(Number(result.current.state.result)).toBeCloseTo(1, 10);
    expect(result.current.state.hasError).toBe(false);
  });

  it('calculates tan(pi/4) in RAD mode with floating point tolerance', () => {
    const { result } = renderHook(() => useCalculator());

    setAngleMode(result, 'RAD');
    press(result, 'tan(', 'pi', '/', '4', ')', '=');

    expect(result.current.state.angleMode).toBe('RAD');
    expect(Number(result.current.state.result)).toBeCloseTo(1, 10);
    expect(result.current.state.hasError).toBe(false);
  });

  it('closes forgotten parentheses when = is pressed', () => {
    const { result } = renderHook(() => useCalculator());

    // かっこを開いたまま = を押しても、実機と同じように答えが出る
    press(result, '(', '1', '+', '2', '*', '(', '3', '+', '4', '=');

    expect(result.current.state.result).toBe('15');
    expect(result.current.state.hasError).toBe(false);
  });

  it('enters ×10ⁿ as an exponent literal instead of opening a parenthesis', () => {
    const { result } = renderHook(() => useCalculator());

    // 3.46×10⁻⁵ + 1×10⁻⁵。かっこを開く実装だと = でエラーになっていた
    press(result, '3', '.', '4', '6', 'exp10', '-', '5', '+', '1', 'exp10', '-', '5', '=');

    expect(result.current.state.expression).toBe('3.46e-5+1e-5');
    expect(result.current.state.hasError).toBe(false);
    expect(Number(result.current.state.result)).toBeCloseTo(4.46e-5, 15);
  });

  it('shows the ×10ⁿ literal as a power of ten', () => {
    const { result } = renderHook(() => useCalculator());

    press(result, '3', '.', '4', '6', 'exp10', '-', '5');

    expect(result.current.displayExpression).toBe('3.46×10⁻⁵');
  });

  it('takes the preceding number as the root index for ʸ√x', () => {
    const { result } = renderHook(() => useCalculator());

    // 4 ʸ√x 3.56 = 3.56 の4乗根
    press(result, '4', 'xroot(', '3', '.', '5', '6', '=');

    expect(result.current.state.expression).toBe('xroot(4,3.56');
    expect(Number(result.current.state.result)).toBeCloseTo(3.56 ** (1 / 4), 10);
  });

  it('treats nPr and nCr as infix keys', () => {
    const { result } = renderHook(() => useCalculator());

    // 実機と同じく、引数の終わりは `)` で閉じる（ドリルのガイドはこの `)` を補う）
    press(result, '5', 'nPr(', '3', ')', '*', '7', 'nPr(', '2', '=');

    expect(result.current.state.expression).toBe('nPr(5,3)*nPr(7,2');
    expect(result.current.state.result).toBe('2520');
  });

  it('applies x! to the group just entered', () => {
    const { result } = renderHook(() => useCalculator());

    press(result, '(', '5', '-', '1', ')', 'fact(', '=');

    expect(result.current.state.expression).toBe('fact(5-1)');
    expect(result.current.displayExpression).toBe('(5-1)!');
    expect(result.current.state.result).toBe('24');
  });

  it('builds a degrees-minutes-seconds value with repeated °′″ presses', () => {
    const { result } = renderHook(() => useCalculator());

    press(result, '8', '5', 'dms', '2', '9', 'dms', '1', '7', 'dms', '=');

    expect(result.current.state.expression).toBe('85°29\'17"');
    expect(Number(result.current.state.result)).toBeCloseTo(85 + 29 / 60 + 17 / 3600, 10);
  });

  it('keeps a function argument open until the closing parenthesis, like a real calculator', () => {
    const { result } = renderHook(() => useCalculator());

    setAngleMode(result, 'DEG');
    press(result, 'sin(', '3', '0', '+', '6', '0', ')', '=');

    expect(result.current.state.expression).toBe('sin(30+60)');
    expect(Number(result.current.state.result)).toBeCloseTo(1, 10);
  });

  it('sets error state when evaluation result is invalid', () => {
    const { result } = renderHook(() => useCalculator());

    press(result, '1', '/', '0', '=');

    expect(result.current.state.result).toBe('Error');
    expect(result.current.state.hasError).toBe(true);
    expect(result.current.state.justEvaluated).toBe(true);
  });
});
