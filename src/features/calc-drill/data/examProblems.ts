import examProblemsJson from './exam-problems.json';
import { parseGuideToKeySequence } from './parseGuide';
import type { DrillProblem } from '../types';

type ExamProblemJson = {
  id: string;
  level: '4級' | '3級';
  category: DrillProblem['category'];
  exam_ref?: string;
  question: string;
  answer: string | number;
  note?: string;
  guide: string[];
};

export const EXAM_PROBLEMS: DrillProblem[] = (examProblemsJson as ExamProblemJson[]).map((problem) => ({
  id: problem.id,
  level: problem.level,
  category: problem.category,
  question: problem.question,
  expectedAnswer: String(problem.answer),
  keySequence: parseGuideToKeySequence(problem.guide),
  ghostExpression: problem.question,
  exam_ref: problem.exam_ref,
  note: problem.note,
}));
