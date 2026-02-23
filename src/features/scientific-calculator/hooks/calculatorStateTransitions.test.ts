import type { CalculatorState } from '../types';
import { applyInsertOperator, applyInsertText } from './calculatorStateTransitions';

function createState(overrides: Partial<CalculatorState> = {}): CalculatorState {
  return {
    expression: '',
    result: '0',
    justEvaluated: false,
    hasError: false,
    shiftActive: false,
    angleMode: 'DEG',
    panelMode: 'none',
    memory: 0,
    ...overrides,
  };
}

describe('calculatorStateTransitions', () => {
  describe('applyInsertText', () => {
    it('appends text during normal input', () => {
      const next = applyInsertText(createState({ expression: '12', result: '12' }), '3', {
        resetAfterEval: true,
      });

      expect(next.expression).toBe('123');
      expect(next.result).toBe('12');
      expect(next.justEvaluated).toBe(false);
      expect(next.hasError).toBe(false);
    });

    it('resets expression after evaluation when resetAfterEval is enabled', () => {
      const next = applyInsertText(
        createState({ expression: '1+2', result: '3', justEvaluated: true }),
        '4',
        { resetAfterEval: true }
      );

      expect(next.expression).toBe('4');
      expect(next.result).toBe('0');
      expect(next.justEvaluated).toBe(false);
      expect(next.hasError).toBe(false);
    });

    it('resets from error state', () => {
      const next = applyInsertText(
        createState({ expression: '1/0', result: 'Error', hasError: true, justEvaluated: true }),
        '7'
      );

      expect(next.expression).toBe('7');
      expect(next.result).toBe('0');
      expect(next.justEvaluated).toBe(false);
      expect(next.hasError).toBe(false);
    });

    it('does not reset when justEvaluated is true and resetAfterEval is false', () => {
      const next = applyInsertText(
        createState({ expression: '1+2', result: '3', justEvaluated: true }),
        '+'
      );

      expect(next.expression).toBe('1+2+');
      expect(next.result).toBe('3');
      expect(next.justEvaluated).toBe(false);
      expect(next.hasError).toBe(false);
    });
  });

  describe('applyInsertOperator', () => {
    it('continues from result after evaluation', () => {
      const next = applyInsertOperator(
        createState({ expression: '1+2', result: '3', justEvaluated: true }),
        '+'
      );

      expect(next.expression).toBe('3+');
      expect(next.justEvaluated).toBe(false);
      expect(next.hasError).toBe(false);
    });

    it('replaces a trailing operator', () => {
      const next = applyInsertOperator(createState({ expression: '12+' }), '*');

      expect(next.expression).toBe('12*');
      expect(next.justEvaluated).toBe(false);
      expect(next.hasError).toBe(false);
    });

    it('uses 0 as a prefix for non-minus operator on empty input', () => {
      const next = applyInsertOperator(createState(), '+');

      expect(next.expression).toBe('0+');
    });

    it('starts a negative number with minus on empty input', () => {
      const next = applyInsertOperator(createState(), '-');

      expect(next.expression).toBe('-');
    });
  });
});
