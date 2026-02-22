import { useEffect, useMemo, useRef, useState } from 'react';
import { computeRetrievability } from './useFsrs';
import type {
  AnswerCheckResult,
  AppBackup,
  AppSettings,
  Card,
  CardState,
  Confusion,
  Dataset,
  DatasetSummary,
  DueCount,
  Review,
  StudyQueueItem,
  TopConfusionRow,
} from '../types';
import { DEFAULT_SETTINGS } from '../types';

type StoredCard = Card & { datasetId: string; dbKey: string };
type StoredCardState = CardState & { id: string };
type StoredConfusion = Confusion & { id: string };
type SettingsRecord = { id: string; value: AppSettings };

type StoreName = 'datasets' | 'cards' | 'cardState' | 'reviews' | 'confusions' | 'settings';

type DBApi = {
  ready: boolean;
  error: string | null;
  listDatasets: () => Promise<DatasetSummary[]>;
  importDataset: (input: Dataset | string) => Promise<DatasetSummary>;
  deleteDataset: (datasetId: string) => Promise<void>;
  getCardsByDataset: (datasetId: string) => Promise<Card[]>;
  upsertCard: (datasetId: string, card: Card) => Promise<void>;
  deleteCard: (datasetId: string, cardId: string) => Promise<void>;
  buildDueQueue: (datasetId: string) => Promise<StudyQueueItem[]>;
  upsertCardState: (state: CardState) => Promise<void>;
  appendReview: (review: Review) => Promise<void>;
  detectConfusion: (params: { datasetId: string; cardId: string; inputText: string }) => Promise<void>;
  countDue: (datasetId?: string) => Promise<DueCount>;
  computeAvgRetrievability: (datasetId?: string) => Promise<number | null>;
  listTopConfusions: (datasetId?: string, limit?: number) => Promise<TopConfusionRow[]>;
  exportAll: () => Promise<AppBackup>;
  importAll: (input: AppBackup | string) => Promise<void>;
  getSettings: () => Promise<AppSettings>;
  setSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;
  checkAnswer: (card: Card, inputText: string) => AnswerCheckResult;
};

const DB_NAME = 'memory_app_db';
const DB_VERSION = 1;
const SETTINGS_KEY = 'app-settings';

function normalizeText(value: string): string {
  return value.normalize('NFKC').trim().toLowerCase();
}

function makeCardKey(datasetId: string, cardId: string): string {
  return `${datasetId}::${cardId}`;
}

function makePairKey(a: string, b: string): string {
  return [a, b].sort().join('::');
}

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}

async function getAllByIndex<T>(store: IDBObjectStore, indexName: string, query: IDBValidKey): Promise<T[]> {
  const index = store.index(indexName);
  return promisifyRequest(index.getAll(query));
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains('datasets')) {
        db.createObjectStore('datasets', { keyPath: 'datasetId' });
      }

      if (!db.objectStoreNames.contains('cards')) {
        const store = db.createObjectStore('cards', { keyPath: 'dbKey' });
        store.createIndex('datasetId', 'datasetId', { unique: false });
      }

      if (!db.objectStoreNames.contains('cardState')) {
        const store = db.createObjectStore('cardState', { keyPath: 'id' });
        store.createIndex('datasetId', 'datasetId', { unique: false });
        store.createIndex('dueAt', 'dueAt', { unique: false });
      }

      if (!db.objectStoreNames.contains('reviews')) {
        const store = db.createObjectStore('reviews', { keyPath: 'id', autoIncrement: true });
        store.createIndex('datasetId', 'datasetId', { unique: false });
        store.createIndex('reviewedAt', 'reviewedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains('confusions')) {
        const store = db.createObjectStore('confusions', { keyPath: 'id' });
        store.createIndex('datasetId', 'datasetId', { unique: false });
        store.createIndex('count', 'count', { unique: false });
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

function coerceDataset(input: Dataset | string): Dataset {
  const raw = typeof input === 'string' ? JSON.parse(input) : input;
  if (!raw || typeof raw !== 'object') {
    throw new Error('データセットJSONの形式が不正です');
  }

  const dataset = raw as Partial<Dataset>;
  if (!dataset.datasetId || !dataset.title || !Array.isArray(dataset.cards)) {
    throw new Error('datasetId / title / cards が必要です');
  }

  return {
    schema: dataset.schema ?? 'dataset-json-v1',
    datasetId: String(dataset.datasetId),
    title: String(dataset.title),
    description: dataset.description ? String(dataset.description) : '',
    tags: Array.isArray(dataset.tags) ? dataset.tags.map(String) : [],
    cards: dataset.cards.map((card, index) => ({
      id: String(card.id ?? `card-${index + 1}`),
      topic: card.topic ? String(card.topic) : '',
      question: String(card.question ?? ''),
      answers: Array.isArray(card.answers) ? card.answers.map(String) : [],
      explanation: card.explanation ? String(card.explanation) : '',
      tags: Array.isArray(card.tags) ? card.tags.map(String) : [],
      createdAt: card.createdAt ? String(card.createdAt) : new Date().toISOString(),
      updatedAt: card.updatedAt ? String(card.updatedAt) : new Date().toISOString(),
    })).filter((card) => card.question && card.answers.length > 0),
  };
}

function checkAnswer(card: Card, inputText: string): AnswerCheckResult {
  const normalizedInput = normalizeText(inputText);
  const matchedAnswer = card.answers.find((answer) => normalizeText(answer) === normalizedInput) ?? null;
  return {
    isCorrect: Boolean(matchedAnswer),
    matchedAnswer,
    normalizedInput,
  };
}

function toCard(row: StoredCard): Card {
  return {
    id: row.id,
    topic: row.topic,
    question: row.question,
    answers: row.answers,
    explanation: row.explanation,
    tags: row.tags,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function useDB(): DBApi {
  const dbPromiseRef = useRef<Promise<IDBDatabase> | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDb = async () => {
    if (!dbPromiseRef.current) {
      dbPromiseRef.current = openDatabase();
    }
    const db = await dbPromiseRef.current;
    return db;
  };

  useEffect(() => {
    let active = true;
    getDb()
      .then(() => {
        if (!active) return;
        setReady(true);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'IndexedDB 初期化に失敗しました');
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (!dbPromiseRef.current) return;
      dbPromiseRef.current.then((db) => db.close()).catch(() => undefined);
    };
  }, []);

  return useMemo<DBApi>(() => ({
    ready,
    error,

    listDatasets: async () => {
      const db = await getDb();
      const tx = db.transaction('datasets', 'readonly');
      const store = tx.objectStore('datasets');
      const rows = await promisifyRequest(store.getAll()) as DatasetSummary[];
      await txDone(tx);
      return rows.sort((a, b) => b.updatedAt - a.updatedAt || a.title.localeCompare(b.title, 'ja'));
    },

    importDataset: async (input) => {
      const dataset = coerceDataset(input);
      const db = await getDb();
      const tx = db.transaction(['datasets', 'cards', 'cardState', 'reviews', 'confusions'], 'readwrite');
      const datasetsStore = tx.objectStore('datasets');
      const cardsStore = tx.objectStore('cards');
      const cardStateStore = tx.objectStore('cardState');
      const reviewsStore = tx.objectStore('reviews');
      const confusionsStore = tx.objectStore('confusions');

      const existingCards = await getAllByIndex<StoredCard>(cardsStore, 'datasetId', dataset.datasetId);
      for (const card of existingCards) cardsStore.delete(card.dbKey);

      const existingStates = await getAllByIndex<StoredCardState>(cardStateStore, 'datasetId', dataset.datasetId);
      for (const state of existingStates) cardStateStore.delete(state.id);

      const existingReviews = await getAllByIndex<Review & { id: number }>(reviewsStore, 'datasetId', dataset.datasetId);
      for (const review of existingReviews) reviewsStore.delete(review.id);

      const existingConfusions = await getAllByIndex<StoredConfusion>(confusionsStore, 'datasetId', dataset.datasetId);
      for (const confusion of existingConfusions) confusionsStore.delete(confusion.id);

      const now = Date.now();
      const summary: DatasetSummary = {
        schema: dataset.schema,
        datasetId: dataset.datasetId,
        title: dataset.title,
        description: dataset.description ?? '',
        tags: dataset.tags ?? [],
        cardCount: dataset.cards.length,
        updatedAt: now,
      };

      datasetsStore.put(summary);

      for (const card of dataset.cards) {
        const stored: StoredCard = {
          ...card,
          datasetId: dataset.datasetId,
          dbKey: makeCardKey(dataset.datasetId, card.id),
        };
        cardsStore.put(stored);
      }

      await txDone(tx);
      return summary;
    },

    deleteDataset: async (datasetId) => {
      const db = await getDb();
      const tx = db.transaction(['datasets', 'cards', 'cardState', 'reviews', 'confusions'], 'readwrite');
      tx.objectStore('datasets').delete(datasetId);

      const cardsStore = tx.objectStore('cards');
      for (const card of await getAllByIndex<StoredCard>(cardsStore, 'datasetId', datasetId)) {
        cardsStore.delete(card.dbKey);
      }

      const stateStore = tx.objectStore('cardState');
      for (const state of await getAllByIndex<StoredCardState>(stateStore, 'datasetId', datasetId)) {
        stateStore.delete(state.id);
      }

      const reviewsStore = tx.objectStore('reviews');
      for (const review of await getAllByIndex<Review & { id: number }>(reviewsStore, 'datasetId', datasetId)) {
        reviewsStore.delete(review.id);
      }

      const confusionsStore = tx.objectStore('confusions');
      for (const confusion of await getAllByIndex<StoredConfusion>(confusionsStore, 'datasetId', datasetId)) {
        confusionsStore.delete(confusion.id);
      }

      await txDone(tx);
    },

    getCardsByDataset: async (datasetId) => {
      const db = await getDb();
      const tx = db.transaction('cards', 'readonly');
      const rows = await getAllByIndex<StoredCard>(tx.objectStore('cards'), 'datasetId', datasetId);
      await txDone(tx);
      return rows.map(toCard).sort((a, b) => a.question.localeCompare(b.question, 'ja'));
    },

    upsertCard: async (datasetId, card) => {
      const db = await getDb();
      const tx = db.transaction(['datasets', 'cards'], 'readwrite');
      const datasetsStore = tx.objectStore('datasets');
      const cardsStore = tx.objectStore('cards');
      const summary = await promisifyRequest(datasetsStore.get(datasetId)) as DatasetSummary | undefined;
      if (!summary) {
        throw new Error('データセットが見つかりません');
      }

      const nowIso = new Date().toISOString();
      const dbKey = makeCardKey(datasetId, card.id);
      const existing = await promisifyRequest(cardsStore.get(dbKey)) as StoredCard | undefined;

      cardsStore.put({
        id: card.id,
        topic: card.topic ?? '',
        question: card.question,
        answers: card.answers,
        explanation: card.explanation ?? '',
        tags: card.tags ?? [],
        createdAt: existing?.createdAt ?? card.createdAt ?? nowIso,
        updatedAt: nowIso,
        datasetId,
        dbKey,
      } satisfies StoredCard);

      const rows = await getAllByIndex<StoredCard>(cardsStore, 'datasetId', datasetId);
      datasetsStore.put({
        ...summary,
        cardCount: rows.length,
        updatedAt: Date.now(),
      } satisfies DatasetSummary);

      await txDone(tx);
    },

    deleteCard: async (datasetId, cardId) => {
      const db = await getDb();
      const tx = db.transaction(['datasets', 'cards', 'cardState', 'reviews', 'confusions'], 'readwrite');
      const datasetsStore = tx.objectStore('datasets');
      const cardsStore = tx.objectStore('cards');
      const cardStateStore = tx.objectStore('cardState');
      const reviewsStore = tx.objectStore('reviews');
      const confusionsStore = tx.objectStore('confusions');

      cardsStore.delete(makeCardKey(datasetId, cardId));
      cardStateStore.delete(makeCardKey(datasetId, cardId));

      const reviews = await getAllByIndex<Review & { id: number }>(reviewsStore, 'datasetId', datasetId);
      for (const review of reviews) {
        if (review.cardId === cardId) {
          reviewsStore.delete(review.id);
        }
      }

      const confusions = await getAllByIndex<StoredConfusion>(confusionsStore, 'datasetId', datasetId);
      for (const confusion of confusions) {
        if (confusion.cardIdA === cardId || confusion.cardIdB === cardId) {
          confusionsStore.delete(confusion.id);
        }
      }

      const summary = await promisifyRequest(datasetsStore.get(datasetId)) as DatasetSummary | undefined;
      if (summary) {
        const rows = await getAllByIndex<StoredCard>(cardsStore, 'datasetId', datasetId);
        datasetsStore.put({
          ...summary,
          cardCount: rows.length,
          updatedAt: Date.now(),
        } satisfies DatasetSummary);
      }

      await txDone(tx);
    },

    buildDueQueue: async (datasetId) => {
      const db = await getDb();
      const tx = db.transaction(['cards', 'cardState'], 'readonly');
      const cards = await getAllByIndex<StoredCard>(tx.objectStore('cards'), 'datasetId', datasetId);
      const states = await getAllByIndex<StoredCardState>(tx.objectStore('cardState'), 'datasetId', datasetId);
      await txDone(tx);

      const stateMap = new Map(states.map((state) => [state.cardId, state]));
      const now = Date.now();

      return cards
        .map<StudyQueueItem>((card) => ({
          card: toCard(card),
          cardState: stateMap.get(card.id) ?? null,
        }))
        .filter((item) => !item.cardState || item.cardState.dueAt <= now)
        .sort((a, b) => {
          if (!a.cardState && !b.cardState) return a.card.question.localeCompare(b.card.question, 'ja');
          if (!a.cardState) return -1;
          if (!b.cardState) return 1;
          return a.cardState.dueAt - b.cardState.dueAt;
        });
    },

    upsertCardState: async (state) => {
      const db = await getDb();
      const tx = db.transaction('cardState', 'readwrite');
      const record: StoredCardState = { ...state, id: makeCardKey(state.datasetId, state.cardId) };
      tx.objectStore('cardState').put(record);
      await txDone(tx);
    },

    appendReview: async (review) => {
      const db = await getDb();
      const tx = db.transaction('reviews', 'readwrite');
      tx.objectStore('reviews').add(review);
      await txDone(tx);
    },

    detectConfusion: async ({ datasetId, cardId, inputText }) => {
      const normalizedInput = normalizeText(inputText);
      if (!normalizedInput) return;

      const db = await getDb();
      const tx = db.transaction(['cards', 'confusions'], 'readwrite');
      const cardsStore = tx.objectStore('cards');
      const confusionsStore = tx.objectStore('confusions');
      const cards = await getAllByIndex<StoredCard>(cardsStore, 'datasetId', datasetId);
      const matchedOther = cards.find((card) => card.id !== cardId && card.answers.some((a) => normalizeText(a) === normalizedInput));
      if (!matchedOther) {
        await txDone(tx);
        return;
      }

      const pairKey = makePairKey(cardId, matchedOther.id);
      const id = makeCardKey(datasetId, pairKey);
      const existing = await promisifyRequest(confusionsStore.get(id)) as StoredConfusion | undefined;

      const next: StoredConfusion = existing
        ? { ...existing, count: existing.count + 1 }
        : {
            id,
            datasetId,
            pairKey,
            cardIdA: [cardId, matchedOther.id].sort()[0],
            cardIdB: [cardId, matchedOther.id].sort()[1],
            count: 1,
          };

      confusionsStore.put(next);
      await txDone(tx);
    },

    countDue: async (datasetId) => {
      const db = await getDb();
      const tx = db.transaction(['datasets', 'cards', 'cardState'], 'readonly');
      const datasets = datasetId
        ? [await promisifyRequest(tx.objectStore('datasets').get(datasetId)) as DatasetSummary | undefined].filter(Boolean) as DatasetSummary[]
        : (await promisifyRequest(tx.objectStore('datasets').getAll()) as DatasetSummary[]);

      const cardsStore = tx.objectStore('cards');
      const statesStore = tx.objectStore('cardState');
      const now = Date.now();
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      const todayEndTs = endOfToday.getTime();
      let overdue = 0;
      let today = 0;

      for (const ds of datasets) {
        const cards = await getAllByIndex<StoredCard>(cardsStore, 'datasetId', ds.datasetId);
        const states = await getAllByIndex<StoredCardState>(statesStore, 'datasetId', ds.datasetId);
        const stateMap = new Map(states.map((s) => [s.cardId, s]));
        for (const card of cards) {
          const state = stateMap.get(card.id);
          if (!state) {
            overdue += 1;
            today += 1;
            continue;
          }
          if (state.dueAt <= now) overdue += 1;
          if (state.dueAt <= todayEndTs) today += 1;
        }
      }

      await txDone(tx);
      return { overdue, today };
    },

    computeAvgRetrievability: async (datasetId) => {
      const db = await getDb();
      const tx = db.transaction('cardState', 'readonly');
      const rows = datasetId
        ? await getAllByIndex<StoredCardState>(tx.objectStore('cardState'), 'datasetId', datasetId)
        : await promisifyRequest(tx.objectStore('cardState').getAll()) as StoredCardState[];
      await txDone(tx);
      if (rows.length === 0) return null;
      const now = Date.now();
      const avg = rows.reduce((sum, row) => sum + computeRetrievability({ now, lastReviewAt: row.lastReviewAt, stability: row.stability }), 0) / rows.length;
      return avg;
    },

    listTopConfusions: async (datasetId, limit = 10) => {
      const db = await getDb();
      const tx = db.transaction(['confusions', 'cards'], 'readonly');
      const confusionsStore = tx.objectStore('confusions');
      const cardsStore = tx.objectStore('cards');
      const rows = datasetId
        ? await getAllByIndex<StoredConfusion>(confusionsStore, 'datasetId', datasetId)
        : await promisifyRequest(confusionsStore.getAll()) as StoredConfusion[];
      const sorted = [...rows].sort((a, b) => b.count - a.count).slice(0, limit);

      const result: TopConfusionRow[] = [];
      for (const row of sorted) {
        const cardA = await promisifyRequest(cardsStore.get(makeCardKey(row.datasetId, row.cardIdA))) as StoredCard | undefined;
        const cardB = await promisifyRequest(cardsStore.get(makeCardKey(row.datasetId, row.cardIdB))) as StoredCard | undefined;
        result.push({
          datasetId: row.datasetId,
          pairKey: row.pairKey,
          cardIdA: row.cardIdA,
          cardIdB: row.cardIdB,
          count: row.count,
          labelA: cardA?.question ?? row.cardIdA,
          labelB: cardB?.question ?? row.cardIdB,
        });
      }

      await txDone(tx);
      return result;
    },

    exportAll: async () => {
      const db = await getDb();
      const tx = db.transaction(['datasets', 'cards', 'cardState', 'reviews', 'confusions', 'settings'], 'readonly');
      const backup: AppBackup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        datasets: await promisifyRequest(tx.objectStore('datasets').getAll()) as DatasetSummary[],
        cards: await promisifyRequest(tx.objectStore('cards').getAll()) as StoredCard[],
        cardState: await promisifyRequest(tx.objectStore('cardState').getAll()) as StoredCardState[],
        reviews: await promisifyRequest(tx.objectStore('reviews').getAll()) as Array<Review & { id?: number }>,
        confusions: await promisifyRequest(tx.objectStore('confusions').getAll()) as StoredConfusion[],
        settings: await promisifyRequest(tx.objectStore('settings').getAll()) as SettingsRecord[],
      };
      await txDone(tx);
      return backup;
    },

    importAll: async (input) => {
      const raw = typeof input === 'string' ? (JSON.parse(input) as AppBackup) : input;
      if (!raw || raw.version !== 1) {
        throw new Error('バックアップ形式が不正です');
      }

      const db = await getDb();
      const tx = db.transaction(['datasets', 'cards', 'cardState', 'reviews', 'confusions', 'settings'], 'readwrite');
      for (const name of ['datasets', 'cards', 'cardState', 'reviews', 'confusions', 'settings'] as StoreName[]) {
        tx.objectStore(name).clear();
      }

      for (const row of raw.datasets ?? []) tx.objectStore('datasets').put(row);
      for (const row of raw.cards ?? []) tx.objectStore('cards').put(row);
      for (const row of raw.cardState ?? []) tx.objectStore('cardState').put(row);
      for (const row of raw.reviews ?? []) tx.objectStore('reviews').put(row);
      for (const row of raw.confusions ?? []) tx.objectStore('confusions').put(row);
      for (const row of raw.settings ?? []) tx.objectStore('settings').put(row);

      await txDone(tx);
    },

    getSettings: async () => {
      const db = await getDb();
      const tx = db.transaction('settings', 'readonly');
      const record = await promisifyRequest(tx.objectStore('settings').get(SETTINGS_KEY)) as SettingsRecord | undefined;
      await txDone(tx);
      return record?.value ?? DEFAULT_SETTINGS;
    },

    setSettings: async (settings) => {
      const db = await getDb();
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      const current = await promisifyRequest(store.get(SETTINGS_KEY)) as SettingsRecord | undefined;
      const next: AppSettings = {
        ...DEFAULT_SETTINGS,
        ...(current?.value ?? {}),
        ...settings,
      };
      store.put({ id: SETTINGS_KEY, value: next } satisfies SettingsRecord);
      await txDone(tx);
      return next;
    },

    checkAnswer,
  }), [ready, error]);
}
