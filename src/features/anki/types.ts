export type Grade = 1 | 2 | 3 | 4; // Unknown / Hard / Good / Easy
export type TabId = 'home' | 'study' | 'dashboard' | 'data' | 'settings';

export interface Card {
  id: string;
  topic?: string;
  question: string;
  answers: string[];
  explanation?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Dataset {
  schema: string;
  datasetId: string;
  title: string;
  description?: string;
  tags?: string[];
  cards: Card[];
}

export interface CardState {
  cardId: string;
  datasetId: string;
  stability: number;
  difficulty: number;
  lastReviewAt: number | null;
  dueAt: number;
  reps: number;
  lapses: number;
}

export interface Review {
  cardId: string;
  datasetId: string;
  grade: Grade;
  responseMs: number;
  reviewedAt: number;
}

export interface Confusion {
  pairKey: string;
  cardIdA: string;
  cardIdB: string;
  count: number;
  datasetId: string;
}

export interface AppSettings {
  targetRetentionRate: number;
  examDate: string | null;
}

export interface DatasetSummary {
  schema: string;
  datasetId: string;
  title: string;
  description?: string;
  tags?: string[];
  cardCount: number;
  updatedAt: number;
}

export interface DueCount {
  overdue: number;
  today: number;
}

export interface StudyQueueItem {
  card: Card;
  cardState: CardState | null;
}

export interface AnswerCheckResult {
  isCorrect: boolean;
  matchedAnswer: string | null;
  normalizedInput: string;
}

export interface TopConfusionRow {
  datasetId: string;
  pairKey: string;
  cardIdA: string;
  cardIdB: string;
  count: number;
  labelA: string;
  labelB: string;
}

export interface DashboardStats {
  due: DueCount;
  avgRetrievability: number | null;
  topConfusions: TopConfusionRow[];
}

export interface AppBackup {
  version: 1;
  exportedAt: string;
  datasets: DatasetSummary[];
  cards: Array<Card & { datasetId: string; dbKey: string }>;
  cardState: Array<CardState & { id: string }>;
  reviews: Array<Review & { id?: number }>;
  confusions: Array<Confusion & { id: string }>;
  settings: { id: string; value: AppSettings }[];
}

export type StudySessionStatus = 'idle' | 'loading' | 'question' | 'reviewing' | 'done';

export interface StudySessionState {
  status: StudySessionStatus;
  datasetId: string | null;
  queue: StudyQueueItem[];
  index: number;
  total: number;
  correctCount: number;
  incorrectCount: number;
  current: StudyQueueItem | null;
  userAnswer: string;
  isCorrect: boolean | null;
  matchedAnswer: string | null;
  responseMs: number | null;
  submittedAt: number | null;
  error: string | null;
}

export const DEFAULT_SETTINGS: AppSettings = {
  targetRetentionRate: 0.9,
  examDate: null,
};
