export type QuestionFormat = 'choice' | 'text' | 'number';

export interface QuizQuestion {
  id: string;
  format: QuestionFormat;
  stem: string;
  choices?: string[];
  correctAnswer: string;
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  pdfUrl: string;
  questions: QuizQuestion[];
  createdAt: number;
}

export interface GradingResult {
  questionId: string;
  correct: boolean;
  studentAnswer: string;
  correctAnswer: string;
  points: number;
}
