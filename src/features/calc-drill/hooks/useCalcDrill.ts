import { useEffect, useState } from 'react';
import { useCalculator } from '@/features/scientific-calculator/hooks/useCalculator';
import type { DrillProblem } from '../types';

export function useCalcDrill(problems: DrillProblem[]) {
  const calc = useCalculator();
  const [problemIndex, setProblemIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    calc.pressButton('ac');
    setProblemIndex(0);
    setStepIndex(0);
  }, [problems]);

  const currentProblem = problems[problemIndex] ?? null;
  const totalProblems = problems.length;
  const isDone = currentProblem ? stepIndex >= currentProblem.keySequence.length : true;
  const highlightedAction = !currentProblem || isDone ? null : currentProblem.keySequence[stepIndex];

  const handlePress = (action: string) => {
    if (!currentProblem || isDone || action !== highlightedAction) return;
    calc.pressButton(action);
    setStepIndex((prev) => prev + 1);
  };

  const resetCalculator = () => {
    calc.pressButton('ac');
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
    pressButton: handlePress,
    currentProblem,
    problemIndex,
    totalProblems,
    stepIndex,
    isDone,
    highlightedAction,
    nextProblem,
    retryProblem,
    selectProblem,
  };
}
