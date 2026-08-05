import examProblemsJson from './exam-problems.json';
import { parseGuideToKeySequence } from './parseGuide';
import type { DrillCategory, DrillLevel, DrillProblem, Rounding } from '../types';

type ExamProblemJson = {
  id: string;
  level: DrillLevel;
  category: DrillCategory;
  exam_ref?: string;
  question: string;
  answer: string;
  angleMode?: 'DEG' | 'RAD';
  rounding?: Rounding;
  guide: string[];
};

export type ParsedExamProblem =
  | { ok: true; problem: DrillProblem }
  | { ok: false; id: string; exam_ref?: string; reason: string };

/**
 * JSON をドリルの問題に変換する。
 * ガイド用語がキーに変換できないものは、投げずに「ダメだった理由」を返す。
 * 出題対象から外す判断は problems.ts が行い、一覧は診断テストが出す。
 */
export function parseExamProblems(source: ExamProblemJson[] = examProblemsJson as ExamProblemJson[]): ParsedExamProblem[] {
  return source.map((problem) => {
    // 2級の過去問が level:"3級" として混ざっていたことがある。
    // このドリルは3級・4級だけを出す。
    const refLevel = problem.exam_ref?.match(/([1-9]級)/)?.[1];
    if (refLevel && refLevel !== problem.level) {
      return {
        ok: false,
        id: problem.id,
        exam_ref: problem.exam_ref,
        reason: `出典は${refLevel}だが level は ${problem.level}`,
      };
    }

    try {
      return {
        ok: true,
        problem: {
          id: problem.id,
          level: problem.level,
          category: problem.category,
          question: problem.question,
          expectedAnswer: String(problem.answer),
          keySequence: parseGuideToKeySequence(problem.guide),
          angleMode: problem.angleMode ?? 'DEG',
          rounding: problem.rounding,
          exam_ref: problem.exam_ref,
        },
      };
    } catch (error) {
      return {
        ok: false,
        id: problem.id,
        exam_ref: problem.exam_ref,
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  });
}

export const PARSED_EXAM_PROBLEMS = parseExamProblems();

export const EXAM_PROBLEMS: DrillProblem[] = PARSED_EXAM_PROBLEMS.filter(
  (entry): entry is Extract<ParsedExamProblem, { ok: true }> => entry.ok
).map((entry) => entry.problem);
