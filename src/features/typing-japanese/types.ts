export interface Problem {
  question: string;
  answers: string[];
}

export type GameState = 'home' | 'playing' | 'result';

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface GameStats {
  correctChars: number;
  wrongChars: number;
  completedProblems: number;
}
