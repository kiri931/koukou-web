import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCalculator } from '@/features/scientific-calculator/hooks/useCalculator';
import {
  EXAM_DURATION_SEC,
  EXAM_QUESTION_COUNT,
  grade,
  isAnswerCorrect,
  pickExamQuestions,
} from '../lib/grading';
import type { DrillProblem } from '../types';

export type ExamPhase = 'ready' | 'running' | 'finished';

/**
 * 本番モード。検定の1区分（10分）を通しで解く。
 *
 * ガイド練習とちがい **キーの制限をしない**。
 * 本番は自分で手順を決めて打つので、ここで正解のキーを教えてしまうと
 * 「時間内に自分で解けるか」を測れなくなる。
 */
export function useExamMode(pool: DrillProblem[]) {
  const calc = useCalculator();
  const [phase, setPhase] = useState<ExamPhase>('ready');
  const [questions, setQuestions] = useState<DrillProblem[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<{ problem: DrillProblem; answer: string; correct: boolean }[]>([]);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(EXAM_DURATION_SEC);
  const timer = useRef<number | null>(null);

  const stopTimer = useCallback(() => {
    if (timer.current !== null) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => stopTimer, [stopTimer]);

  const finish = useCallback(() => {
    stopTimer();
    setEndsAt(null);
    setPhase('finished');
  }, [stopTimer]);

  // 残り時間は「終わる時刻」から毎秒引き直す。
  // 経過を足していく方式だと、タブが裏に回って間引かれたぶん時間が伸びてしまう。
  useEffect(() => {
    if (phase !== 'running' || endsAt === null) return;
    const update = () => {
      const left = Math.ceil((endsAt - Date.now()) / 1000);
      setRemaining(Math.max(0, left));
      if (left <= 0) finish();
    };
    update();
    timer.current = window.setInterval(update, 250);
    return stopTimer;
  }, [phase, endsAt, finish, stopTimer]);

  const start = () => {
    const picked = pickExamQuestions(pool, EXAM_QUESTION_COUNT);
    if (picked.length === 0) return;
    calc.pressButton('ac');
    setQuestions(picked);
    setIndex(0);
    setAnswers([]);
    setRemaining(EXAM_DURATION_SEC);
    setEndsAt(Date.now() + EXAM_DURATION_SEC * 1000);
    setPhase('running');
  };

  const currentProblem = questions[index] ?? null;

  /** いま電卓に出ている値を、この問題の答えとして出す。 */
  const submitAnswer = () => {
    if (!currentProblem || phase !== 'running') return;
    const answer = calc.state.result;
    const correct = isAnswerCorrect(answer, currentProblem);
    const nextAnswers = [...answers, { problem: currentProblem, answer, correct }];
    setAnswers(nextAnswers);
    calc.pressButton('ac');

    if (index + 1 >= questions.length) {
      finish();
      return;
    }
    setIndex(index + 1);
  };

  /** 分からない問題を飛ばす。空欄は不正解として数える（検定と同じ）。 */
  const skipQuestion = () => {
    if (!currentProblem || phase !== 'running') return;
    const nextAnswers = [...answers, { problem: currentProblem, answer: '（とばした）', correct: false }];
    setAnswers(nextAnswers);
    calc.pressButton('ac');
    if (index + 1 >= questions.length) {
      finish();
      return;
    }
    setIndex(index + 1);
  };

  const reset = () => {
    stopTimer();
    calc.pressButton('ac');
    setPhase('ready');
    setQuestions([]);
    setAnswers([]);
    setIndex(0);
    setEndsAt(null);
    setRemaining(EXAM_DURATION_SEC);
  };

  const result = useMemo(
    // 時間切れで残った問題も、答えていない＝不正解として数える
    () => grade(answers.filter((a) => a.correct).length, questions.length),
    [answers, questions.length]
  );

  return {
    ...calc,
    phase,
    questions,
    index,
    answers,
    remaining,
    currentProblem,
    result,
    start,
    submitAnswer,
    skipQuestion,
    finish,
    reset,
  };
}
