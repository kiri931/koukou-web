export interface Problem {
  question: string;
  answers: string[];
  language?: ProgrammingLanguage;
}

export type GameState = 'home' | 'playing' | 'result';

export type Difficulty = 'easy' | 'normal' | 'hard';
export type Mode = 'japanese' | 'programming';
export type ProgrammingDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ProgrammingLanguage = 'all' | 'common' | 'python' | 'javascript' | 'html' | 'css';

export interface GameStats {
  correctChars: number;
  wrongChars: number;
  completedProblems: number;
}
