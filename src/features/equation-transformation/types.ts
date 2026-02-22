export interface Question {
  id: number;
  prompt: string;
  choices: string[];
  answer: string;
  explain: string;
}

export interface RenderedQuestion extends Question {
  shuffledChoices: string[];
}

export interface PrintOptions {
  showAnswers: boolean;
  showExplain: boolean;
  showStudentInfo: boolean;
}
