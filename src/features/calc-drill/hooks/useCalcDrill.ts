import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BUTTON_ROWS } from '@/features/scientific-calculator/components/CalcKeypad';
import { useCalculator } from '@/features/scientific-calculator/hooks/useCalculator';
import { loadMissCounts, recordMiss, saveMissCounts, type MissCounts } from '../lib/missLog';
import type { DrillProblem } from '../types';

/** SHIFT を押さないと出せないキー。データには書かず、ここで自動的に差し込む。 */
const SHIFT_ONLY_ACTIONS = new Set(
  BUTTON_ROWS.flat()
    .map((button) => button.shiftAction)
    .filter((action): action is string => Boolean(action))
);

export function useCalcDrill(problems: DrillProblem[]) {
  const calc = useCalculator();
  const [problemIndex, setProblemIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [wrongKeyHint, setWrongKeyHint] = useState<string | null>(null);
  const [missCounts, setMissCounts] = useState<MissCounts>({});
  const hintTimer = useRef<number | null>(null);

  // localStorage はブラウザにしか無いので、描画後に読む
  useEffect(() => {
    setMissCounts(loadMissCounts());
  }, []);

  useEffect(() => {
    calc.pressButton('ac');
    setProblemIndex(0);
    setStepIndex(0);
  }, [problems]);

  useEffect(() => () => {
    if (hintTimer.current !== null) window.clearTimeout(hintTimer.current);
  }, []);

  const currentProblem = problems[problemIndex] ?? null;
  const totalProblems = problems.length;
  const totalSteps = currentProblem?.keySequence.length ?? 0;
  const isDone = currentProblem ? stepIndex >= totalSteps : true;

  const stepAction = !currentProblem || isDone ? null : currentProblem.keySequence[stepIndex];

  /**
   * いま押すべきキー。手順のキーそのものとは限らない。
   *  1. 角度モードが問題の要求と違えば DEG/RAD キー
   *  2. 手順のキーが SHIFT 側で、まだ SHIFT が点いていなければ SHIFT キー
   *  3. それ以外は手順のキー
   */
  const requiredAction = useMemo(() => {
    if (!currentProblem || isDone) return null;
    if (calc.state.angleMode !== currentProblem.angleMode) return 'toggle-angle';
    if (stepAction && SHIFT_ONLY_ACTIONS.has(stepAction) && !calc.state.shiftActive) {
      return 'toggle-shift';
    }
    return stepAction;
  }, [currentProblem, isDone, stepAction, calc.state.angleMode, calc.state.shiftActive]);

  const showWrongKeyHint = useCallback(() => {
    if (hintTimer.current !== null) window.clearTimeout(hintTimer.current);
    setWrongKeyHint('そのキーではありません');
    hintTimer.current = window.setTimeout(() => setWrongKeyHint(null), 1600);
  }, []);

  const pressButton = (action: string) => {
    if (!currentProblem || isDone) return;
    if (action !== requiredAction) {
      showWrongKeyHint();
      // 数えるのは「押すべきだったキー」。押し間違えた先には意味がない
      if (requiredAction) {
        setMissCounts((prev) => {
          const next = recordMiss(prev, requiredAction);
          saveMissCounts(next);
          return next;
        });
      }
      return;
    }
    setWrongKeyHint(null);
    calc.pressButton(action);
    // 角度モードと SHIFT は「下ごしらえ」なので、手順は進めない
    if (action === requiredAction && action === stepAction) {
      setStepIndex((prev) => prev + 1);
    }
  };

  const resetCalculator = () => {
    calc.pressButton('ac');
    setWrongKeyHint(null);
  };

  const nextProblem = () => {
    if (!totalProblems) return;
    resetCalculator();
    setProblemIndex((prev) => (prev + 1) % totalProblems);
    setStepIndex(0);
  };

  const retryProblem = () => {
    resetCalculator();
    setStepIndex(0);
  };

  const selectProblem = (index: number) => {
    if (!totalProblems || index < 0 || index >= totalProblems) return;
    resetCalculator();
    setProblemIndex(index);
    setStepIndex(0);
  };

  return {
    ...calc,
    pressButton,
    currentProblem,
    problemIndex,
    totalProblems,
    stepIndex,
    totalSteps,
    isDone,
    requiredAction,
    wrongKeyHint,
    missCounts,
    setMissCounts,
    nextProblem,
    retryProblem,
    selectProblem,
  };
}
