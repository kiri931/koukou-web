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

  it('sets error state when evaluation result is invalid', () => {
    const { result } = renderHook(() => useCalculator());

    press(result, '1', '/', '0', '=');

    expect(result.current.state.result).toBe('Error');
    expect(result.current.state.hasError).toBe(true);
    expect(result.current.state.justEvaluated).toBe(true);
  });
});
