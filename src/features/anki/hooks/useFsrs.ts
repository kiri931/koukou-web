import type { CardState, Grade } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;
const LOG_09 = Math.log(0.9);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseExamDate(examDateIso: string | null | undefined): number | null {
  if (!examDateIso) return null;
  const date = new Date(`${examDateIso}T23:59:59.999`);
  const time = date.getTime();
  return Number.isFinite(time) ? time : null;
}

export function computeRetrievability(params: {
  now: number;
  lastReviewAt: number | null;
  stability: number;
}): number {
  const { now, lastReviewAt, stability } = params;
  if (!lastReviewAt || stability <= 0) return 0;
  const elapsedDays = Math.max(0, (now - lastReviewAt) / DAY_MS);
  const r = Math.exp((LOG_09 * elapsedDays) / Math.max(stability, 0.01));
  return clamp(r, 0, 1);
}

export function intervalFromTargetR(params: { targetR: number; stability: number }): number {
  const targetR = clamp(params.targetR, 0.7, 0.97);
  const stability = Math.max(params.stability, 0.05);
  const intervalDays = (stability * Math.log(targetR)) / LOG_09;
  return Math.max(1, Math.round(intervalDays));
}

export function fsrsScheduleNext(params: {
  now: number;
  cardState: CardState | null;
  grade: Grade;
  baseTargetR: number;
  examDateIso: string | null;
}): CardState {
  const { now, cardState, grade, baseTargetR, examDateIso } = params;
  const current = cardState;
  const targetR = clamp(baseTargetR, 0.7, 0.97);

  let difficulty: number;
  let stability: number;
  let reps = (current?.reps ?? 0) + 1;
  let lapses = current?.lapses ?? 0;

  if (!current) {
    const initialDifficulty: Record<Grade, number> = { 1: 8.7, 2: 7.2, 3: 5.5, 4: 4.2 };
    const initialStability: Record<Grade, number> = { 1: 0.2, 2: 0.7, 3: 2.4, 4: 4.0 };
    difficulty = initialDifficulty[grade];
    stability = initialStability[grade];
  } else {
    const retrievability = computeRetrievability({
      now,
      lastReviewAt: current.lastReviewAt,
      stability: current.stability,
    });

    const difficultyDelta: Record<Grade, number> = { 1: 0.8, 2: 0.35, 3: -0.15, 4: -0.4 };
    difficulty = clamp(current.difficulty + difficultyDelta[grade], 1, 10);

    if (grade === 1) {
      lapses += 1;
      stability = Math.max(0.2, current.stability * (0.35 + 0.25 * retrievability));
    } else {
      const bonus: Record<Grade, number> = { 1: 0, 2: 0.9, 3: 1.35, 4: 1.75 };
      const diffPenalty = 1 + (10 - difficulty) * 0.03;
      stability = Math.max(
        0.3,
        current.stability * (1 + (1 - retrievability) * bonus[grade] * diffPenalty),
      );
    }
  }

  let intervalDays = grade === 1 ? 1 : intervalFromTargetR({ targetR, stability });
  const examTs = parseExamDate(examDateIso);
  if (examTs) {
    const maxDays = Math.floor((examTs - now) / DAY_MS);
    if (Number.isFinite(maxDays)) {
      intervalDays = clamp(intervalDays, 1, Math.max(1, maxDays));
    }
  }

  const dueAt = now + intervalDays * DAY_MS;

  return {
    cardId: current?.cardId ?? '',
    datasetId: current?.datasetId ?? '',
    stability,
    difficulty,
    lastReviewAt: now,
    dueAt,
    reps,
    lapses,
  };
}
