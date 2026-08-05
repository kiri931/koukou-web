// 出題モード（4択 / 記述）の判定と、選択肢の作り方。
// 詳しくは docs/anki/spec.md の「2. 出題モード」「3. 選択肢の作り方」。

import type { Card, CardState, StudyQueueItem } from '../types';

export type QuestionMode = 'choice' | 'input';

/** 1問あたりの選択肢の数 */
export const CHOICE_COUNT = 4;

/** 選択肢が最低これだけ作れないと4択として成立しないので記述に落とす */
const MIN_CHOICES = 2;

function normalize(value: string): string {
  return value.normalize('NFKC').trim().toLowerCase();
}

/**
 * そのカードを初めて解くのか。
 *
 * 判定はカードごとの学習回数。セッションの周回数ではない。
 * 用語集にあとから用語を足したとき、新しいカードだけが4択になる。
 */
export function isFirstEncounter(cardState: CardState | null | undefined): boolean {
  return !cardState || cardState.reps === 0;
}

/** 表示に使う代表形。ひらがな読みなどの同義候補は選択肢に混ぜない */
export function displayAnswer(card: Card): string {
  return card.answers[0] ?? '';
}

/**
 * 正解と紛らわしすぎる誤答か。
 *
 * 表記が一致するものはもちろん、一方が他方を丸ごと含むもの
 * （「アルゴリズム」と「探索アルゴリズム」）も外す。
 * 選択肢の中に「より正しそうな2つ」があると問題として成立しない。
 */
function conflicts(a: string, b: string): boolean {
  const x = normalize(a);
  const y = normalize(b);
  if (!x || !y) return true;
  return x === y || x.includes(y) || y.includes(x);
}

/**
 * カードIDと学習回数を種にした決定的なシャッフル（Fisher-Yates）。
 *
 * 同じカードを同じ回数目で開けば同じ並びになるのでテストできる。
 * カードが違えば正解の位置も変わるので、位置で覚えられることもない。
 */
export function shuffleWithSeed<T>(items: T[], seed: string): T[] {
  const out = [...items];
  let state = 0;
  for (let i = 0; i < seed.length; i += 1) {
    state = (state * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const next = () => {
    // xorshift32。Math.random を使わないのは、並びを再現できるようにするため
    state ^= state << 13;
    state >>>= 0;
    state ^= state >> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0x100000000;
  };

  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export interface ChoiceSet {
  mode: QuestionMode;
  choices: string[];
  /** 正解として表示されている文字列 */
  correct: string;
}

/**
 * 4択の選択肢を作る。
 *
 * 誤答はまず同じ topic から、足りなければ同じデータセットの他のカードから補う。
 * topic を揃えないと分野がバラバラになって消去法で当たってしまう。
 */
export function buildChoices(card: Card, pool: StudyQueueItem[], reps = 0): ChoiceSet {
  const correct = displayAnswer(card);
  if (!correct) {
    return { mode: 'input', choices: [], correct };
  }

  const candidates: string[] = [];
  const push = (value: string) => {
    if (!value) return;
    if (conflicts(correct, value)) return;
    if (candidates.some((existing) => conflicts(existing, value))) return;
    candidates.push(value);
  };

  const others = pool.filter((item) => item.card.id !== card.id);
  const sameTopic = card.topic ? others.filter((item) => item.card.topic === card.topic) : [];
  const rest = others.filter((item) => !sameTopic.includes(item));

  // 同じ topic の中でも毎回同じ3枚が出ないよう、拾う順番もカードごとに散らす
  for (const item of shuffleWithSeed(sameTopic, `${card.id}:topic:${reps}`)) {
    if (candidates.length >= CHOICE_COUNT - 1) break;
    push(displayAnswer(item.card));
  }
  for (const item of shuffleWithSeed(rest, `${card.id}:rest:${reps}`)) {
    if (candidates.length >= CHOICE_COUNT - 1) break;
    push(displayAnswer(item.card));
  }

  if (candidates.length + 1 < MIN_CHOICES) {
    // 誤答が1つも作れなかった。1択を出しても意味がないので書かせる
    return { mode: 'input', choices: [], correct };
  }

  return {
    mode: 'choice',
    choices: shuffleWithSeed([correct, ...candidates], `${card.id}:${reps}`),
    correct,
  };
}

/** そのカードを今どう出すか決める。選択肢が作れなければ記述に落ちる */
export function resolveQuestion(item: StudyQueueItem, pool: StudyQueueItem[]): ChoiceSet {
  if (!isFirstEncounter(item.cardState)) {
    return { mode: 'input', choices: [], correct: displayAnswer(item.card) };
  }
  return buildChoices(item.card, pool, item.cardState?.reps ?? 0);
}
