import { useEffect, useState } from 'react';

import type { Quiz, QuizQuestion } from '../types';

const QUIZ_DRAFT_STORAGE_KEY = 'pdf-quiz-draft';

function createId(prefix = 'quiz'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyQuiz(): Quiz {
  return {
    id: createId('quiz'),
    title: '',
    pdfUrl: '',
    questions: [],
    createdAt: Date.now(),
  };
}

function isQuizQuestion(value: unknown): value is QuizQuestion {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const row = value as Partial<QuizQuestion>;
  return (
    typeof row.id === 'string' &&
    (row.format === 'choice' || row.format === 'text' || row.format === 'number') &&
    typeof row.stem === 'string' &&
    typeof row.correctAnswer === 'string' &&
    typeof row.points === 'number' &&
    (row.choices === undefined || Array.isArray(row.choices))
  );
}

function isQuiz(value: unknown): value is Quiz {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const quiz = value as Partial<Quiz>;
  return (
    typeof quiz.id === 'string' &&
    typeof quiz.title === 'string' &&
    typeof quiz.pdfUrl === 'string' &&
    typeof quiz.createdAt === 'number' &&
    Array.isArray(quiz.questions) &&
    quiz.questions.every(isQuizQuestion)
  );
}

function loadDraftFromLocalStorage(): Quiz | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(QUIZ_DRAFT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    return isQuiz(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function saveDraftToLocalStorage(quiz: Quiz | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!quiz) {
    window.localStorage.removeItem(QUIZ_DRAFT_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(QUIZ_DRAFT_STORAGE_KEY, JSON.stringify(quiz, null, 2));
}

function ensureQuiz(quiz: Quiz | null): Quiz {
  return quiz ?? createEmptyQuiz();
}

function sanitizeFilenamePart(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'pdf-quiz';
  }

  return trimmed.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'pdf-quiz';
}

export interface QuizStore {
  quiz: Quiz | null;
  setQuiz: React.Dispatch<React.SetStateAction<Quiz | null>>;
  updateQuiz: (partial: Partial<Quiz>) => void;
  addQuestion: (question: QuizQuestion) => void;
  updateQuestion: (id: string, partial: Partial<QuizQuestion>) => void;
  deleteQuestion: (id: string) => void;
  replaceQuiz: (quiz: Quiz) => void;
  resetQuiz: () => void;
  exportJson: () => void;
}

export function useQuizStore(): QuizStore {
  const [quiz, setQuiz] = useState<Quiz | null>(() => loadDraftFromLocalStorage());

  useEffect(() => {
    saveDraftToLocalStorage(quiz);
  }, [quiz]);

  const updateQuiz = (partial: Partial<Quiz>) => {
    setQuiz((prev) => ({ ...ensureQuiz(prev), ...partial }));
  };

  const addQuestion = (question: QuizQuestion) => {
    setQuiz((prev) => {
      const base = ensureQuiz(prev);
      return {
        ...base,
        questions: [...base.questions, question],
      };
    });
  };

  const updateQuestion = (id: string, partial: Partial<QuizQuestion>) => {
    setQuiz((prev) => {
      const base = ensureQuiz(prev);
      return {
        ...base,
        questions: base.questions.map((question) => (question.id === id ? { ...question, ...partial } : question)),
      };
    });
  };

  const deleteQuestion = (id: string) => {
    setQuiz((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        questions: prev.questions.filter((question) => question.id !== id),
      };
    });
  };

  const replaceQuiz = (nextQuiz: Quiz) => {
    setQuiz(nextQuiz);
  };

  const resetQuiz = () => {
    setQuiz(createEmptyQuiz());
  };

  const exportJson = () => {
    if (!quiz || typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const blob = new Blob([JSON.stringify(quiz, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${sanitizeFilenamePart(quiz.title)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  };

  return {
    quiz,
    setQuiz,
    updateQuiz,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    replaceQuiz,
    resetQuiz,
    exportJson,
  };
}
