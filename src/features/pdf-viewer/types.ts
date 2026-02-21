export interface PdfScope {
  id: string;
  label: string;
  questionCount?: number;
}

export interface PdfEntry {
  id: string;
  title: string;
  path: string;
  answerPath?: string;
  note?: string;
  scopes: PdfScope[];
}

export interface Question {
  id: string;
  format: 'choice' | 'text';
  stem: string;
  choices: string[];
  answer_text: string;
  source: {
    type: 'pdf';
    pdfId: string;
    page: number;
    label: string;
  };
}

export interface AnswerEntry {
  q: number;
  answer: string;
  choice: number;
}

export interface AnswerData {
  exam: string;
  source_pdf: string;
  answers: AnswerEntry[];
}
