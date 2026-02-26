import { useEffect, useState } from 'react';

import type { GradingResult, Quiz } from '../types';

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function isCorrectAnswer(studentAnswer: string, correctAnswer: string, format: 'choice' | 'text' | 'number'): boolean {
  if (format === 'number') {
    const student = Number.parseFloat(studentAnswer);
    const correct = Number.parseFloat(correctAnswer);

    if (Number.isNaN(student) || Number.isNaN(correct)) {
      return false;
    }

    return student === correct;
  }

  return normalizeText(studentAnswer) === normalizeText(correctAnswer);
}

export function useQuizSession(quiz: Quiz | null) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<GradingResult[] | null>(null);

  useEffect(() => {
    setAnswers({});
    setResults(null);
  }, [quiz?.id]);

  const setAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const grade = () => {
    if (!quiz) {
      setResults(null);
      return null;
    }

    const gradingResults = quiz.questions.map<GradingResult>((question) => {
      const studentAnswer = answers[question.id] ?? '';
      const correct = isCorrectAnswer(studentAnswer, question.correctAnswer, question.format);

      return {
        questionId: question.id,
        correct,
        studentAnswer,
        correctAnswer: question.correctAnswer,
        points: correct ? question.points : 0,
      };
    });

    setResults(gradingResults);
    return gradingResults;
  };

  const reset = () => {
    setAnswers({});
    setResults(null);
  };

  return { answers, setAnswer, results, grade, reset };
}
