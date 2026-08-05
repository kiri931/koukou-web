import type { DrillProblem } from '../types';
import { EXAM_PROBLEMS } from './examProblems';
import { KNOWN_BAD } from './knownBad';

/** 過去問より易しい導入用。4級を選んだ生徒が最初に触るのはこちら。 */
const BASE_DRILL_PROBLEMS: DrillProblem[] = [
  {
    id: '4-01',
    level: '4級',
    category: '四則計算',
    question: '123 + 456',
    expectedAnswer: '579',
    keySequence: ['1', '2', '3', '+', '4', '5', '6', '='],
    angleMode: 'DEG',
  },
  {
    id: '4-02',
    level: '4級',
    category: '四則計算',
    question: '980 - 765',
    expectedAnswer: '215',
    keySequence: ['9', '8', '0', '-', '7', '6', '5', '='],
    angleMode: 'DEG',
  },
  {
    id: '4-03',
    level: '4級',
    category: '四則計算',
    question: '24 × 35',
    expectedAnswer: '840',
    keySequence: ['2', '4', '*', '3', '5', '='],
    angleMode: 'DEG',
  },
  {
    id: '4-04',
    level: '4級',
    category: '四則計算',
    question: '144 ÷ 12',
    expectedAnswer: '12',
    keySequence: ['1', '4', '4', '/', '1', '2', '='],
    angleMode: 'DEG',
  },
  {
    id: '4-05',
    level: '4級',
    category: '四則計算',
    question: '12.5 + 7.8',
    expectedAnswer: '20.3',
    keySequence: ['1', '2', '.', '5', '+', '7', '.', '8', '='],
    angleMode: 'DEG',
  },
  {
    id: '4-06',
    level: '4級',
    category: '四則計算',
    question: '8.4 ÷ 2',
    expectedAnswer: '4.2',
    keySequence: ['8', '.', '4', '/', '2', '='],
    angleMode: 'DEG',
  },
  {
    id: '4-07',
    level: '4級',
    category: '応用計算',
    question: '( 45 + 55 ) × 2',
    expectedAnswer: '200',
    keySequence: ['(', '4', '5', '+', '5', '5', ')', '*', '2', '='],
    angleMode: 'DEG',
  },
  {
    id: '4-08',
    level: '4級',
    category: '応用計算',
    question: '1500 - ( 375 + 125 )',
    expectedAnswer: '1000',
    keySequence: ['1', '5', '0', '0', '-', '(', '3', '7', '5', '+', '1', '2', '5', ')', '='],
    angleMode: 'DEG',
  },
  {
    id: '4-09',
    level: '4級',
    category: '応用計算',
    question: '( 12 + 8 ) ÷ 5',
    expectedAnswer: '4',
    keySequence: ['(', '1', '2', '+', '8', ')', '/', '5', '='],
    angleMode: 'DEG',
  },
  {
    id: '4-10',
    level: '4級',
    category: '応用計算',
    question: '25 × 4 - 60',
    expectedAnswer: '40',
    keySequence: ['2', '5', '*', '4', '-', '6', '0', '='],
    angleMode: 'DEG',
  },
  {
    id: '3-01',
    level: '3級',
    category: '四則計算',
    question: '123456 + 789012',
    expectedAnswer: '912468',
    keySequence: ['1', '2', '3', '4', '5', '6', '+', '7', '8', '9', '0', '1', '2', '='],
    angleMode: 'DEG',
  },
  {
    id: '3-02',
    level: '3級',
    category: '四則計算',
    question: '987654 - 123456',
    expectedAnswer: '864198',
    keySequence: ['9', '8', '7', '6', '5', '4', '-', '1', '2', '3', '4', '5', '6', '='],
    angleMode: 'DEG',
  },
  {
    id: '3-03',
    level: '3級',
    category: '四則計算',
    question: '1250 × 64',
    expectedAnswer: '80000',
    keySequence: ['1', '2', '5', '0', '*', '6', '4', '='],
    angleMode: 'DEG',
  },
  {
    id: '3-05',
    level: '3級',
    category: '応用計算',
    question: '( 2500 + 3750 ) ÷ 25',
    expectedAnswer: '250',
    keySequence: ['(', '2', '5', '0', '0', '+', '3', '7', '5', '0', ')', '/', '2', '5', '='],
    angleMode: 'DEG',
  },
  {
    id: '3-06',
    level: '3級',
    category: '関数計算',
    question: 'sin 30°',
    expectedAnswer: '0.5',
    keySequence: ['sin(', '3', '0', ')', '='],
    angleMode: 'DEG',
  },
  {
    id: '3-07',
    level: '3級',
    category: '関数計算',
    question: 'cos 60°',
    expectedAnswer: '0.5',
    keySequence: ['cos(', '6', '0', ')', '='],
    angleMode: 'DEG',
  },
  {
    id: '3-08',
    level: '3級',
    category: '関数計算',
    question: 'tan 45°',
    expectedAnswer: '1',
    keySequence: ['tan(', '4', '5', ')', '='],
    angleMode: 'DEG',
  },
  {
    id: '3-09',
    level: '3級',
    category: '関数計算',
    question: '√144',
    expectedAnswer: '12',
    keySequence: ['sqrt(', '1', '4', '4', ')', '='],
    angleMode: 'DEG',
  },
  {
    id: '3-10',
    level: '3級',
    category: '関数計算',
    question: 'log 1000',
    expectedAnswer: '3',
    keySequence: ['log(', '1', '0', '0', '0', ')', '='],
    angleMode: 'DEG',
  },
  {
    id: '3-11',
    level: '3級',
    category: '関数計算',
    question: '5.2 × 10³',
    expectedAnswer: '5200',
    keySequence: ['5', '.', '2', 'exp10', '3', '='],
    angleMode: 'DEG',
  },
  {
    id: '3-12',
    level: '3級',
    category: '実務計算',
    question: '6 個から 3 個を選ぶ組合せ 6C3',
    expectedAnswer: '20',
    keySequence: ['6', 'nCr(', '3', '='],
    angleMode: 'DEG',
  },
];

const ALL_PROBLEMS = [...BASE_DRILL_PROBLEMS, ...EXAM_PROBLEMS];

/**
 * 実際に出題する問題。
 * ガイド通りに打っても答えが合わないものは KNOWN_BAD で伏せている（§間違った答えを教えない）。
 */
export const DRILL_PROBLEMS: DrillProblem[] = ALL_PROBLEMS.filter(
  (problem) => !(problem.id in KNOWN_BAD)
);

/** 診断テスト用。伏せたものも含めた全件。 */
export const ALL_DRILL_PROBLEMS = ALL_PROBLEMS;
