import { useState } from 'react';
import { fsrsScheduleNext } from './useFsrs';
import type { AnswerCheckResult, AppSettings, Card, CardState, Grade, Review, StudySessionState } from '../types';

type StudyDeps = {
  buildDueQueue: (datasetId: string) => Promise<StudySessionState['queue']>;
  checkAnswer: (card: Card, inputText: string) => AnswerCheckResult;
  detectConfusion: (params: { datasetId: string; cardId: string; inputText: string }) => Promise<void>;
  upsertCardState: (state: CardState) => Promise<void>;
  appendReview: (review: Review) => Promise<void>;
};

const initialState: StudySessionState = {
  status: 'idle',
  datasetId: null,
  queue: [],
  index: 0,
  total: 0,
  correctCount: 0,
  incorrectCount: 0,
  current: null,
  userAnswer: '',
  isCorrect: null,
  matchedAnswer: null,
  responseMs: null,
  submittedAt: null,
  error: null,
};

function toQuestionState(base: StudySessionState, index: number): StudySessionState {
  const current = base.queue[index] ?? null;
  if (!current) {
    return {
      ...base,
      status: 'done',
      index,
      current: null,
      userAnswer: '',
      isCorrect: null,
      matchedAnswer: null,
      responseMs: null,
      submittedAt: null,
      error: null,
    };
  }

  return {
    ...base,
    status: 'question',
    index,
    current,
    userAnswer: '',
    isCorrect: null,
    matchedAnswer: null,
    responseMs: null,
    submittedAt: Date.now(),
    error: null,
  };
}

export function useStudySession(deps: StudyDeps, settings: AppSettings, onPersisted?: () => void | Promise<void>) {
  const [session, setSession] = useState<StudySessionState>(initialState);

  const startSession = async (datasetId: string) => {
    setSession({
      ...initialState,
      status: 'loading',
      datasetId,
      error: null,
    });

    try {
      const queue = await deps.buildDueQueue(datasetId);
      if (queue.length === 0) {
        setSession({
          ...initialState,
          status: 'done',
          datasetId,
          queue,
          total: 0,
          error: null,
        });
        return;
      }

      const base: StudySessionState = {
        ...initialState,
        datasetId,
        queue,
        total: queue.length,
        correctCount: 0,
        incorrectCount: 0,
        index: 0,
        current: queue[0],
        status: 'question',
        submittedAt: Date.now(),
      };
      setSession(base);
    } catch (err) {
      setSession((prev) => ({
        ...prev,
        status: 'idle',
        error: err instanceof Error ? err.message : 'セッション開始に失敗しました',
      }));
    }
  };

  const submitAnswer = async (text: string) => {
    if (session.status !== 'question' || !session.current || !session.datasetId) return;

    const result = deps.checkAnswer(session.current.card, text);
    if (!result.isCorrect) {
      try {
        await deps.detectConfusion({
          datasetId: session.datasetId,
          cardId: session.current.card.id,
          inputText: text,
        });
      } catch {
        // keep study flow even if confusion logging fails
      }
    }

    setSession((prev) => ({
      ...prev,
      status: 'reviewing',
      userAnswer: text,
      isCorrect: result.isCorrect,
      matchedAnswer: result.matchedAnswer,
      responseMs: prev.submittedAt ? Math.max(0, Date.now() - prev.submittedAt) : 0,
      error: null,
    }));
  };

  const submitGrade = async (grade: Grade) => {
    if (session.status !== 'reviewing' || !session.current || !session.datasetId) return;

    const now = Date.now();
    const nextState = fsrsScheduleNext({
      now,
      cardState: session.current.cardState,
      grade,
      baseTargetR: settings.targetRetentionRate,
      examDateIso: settings.examDate,
    });

    nextState.cardId = session.current.card.id;
    nextState.datasetId = session.datasetId;

    try {
      await deps.upsertCardState(nextState);
      await deps.appendReview({
        cardId: session.current.card.id,
        datasetId: session.datasetId,
        grade,
        responseMs: session.responseMs ?? 0,
        reviewedAt: now,
      });

      if (onPersisted) {
        await onPersisted();
      }

      setSession((prev) => {
        const updatedQueue = [...prev.queue];
        if (updatedQueue[prev.index]) {
          updatedQueue[prev.index] = {
            ...updatedQueue[prev.index],
            cardState: nextState,
          };
        }
        return toQuestionState({
          ...prev,
          queue: updatedQueue,
          correctCount: prev.correctCount + (prev.isCorrect ? 1 : 0),
          incorrectCount: prev.incorrectCount + (prev.isCorrect ? 0 : 1),
        }, prev.index + 1);
      });
    } catch (err) {
      setSession((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : '採点保存に失敗しました',
      }));
    }
  };

  const resetSession = () => {
    setSession(initialState);
  };

  return {
    session,
    startSession,
    submitAnswer,
    submitGrade,
    resetSession,
  };
}
