import { describe, expect, it } from 'vitest';
import { maskQuestion } from './maskQuestion';
import { buildChoices, isFirstEncounter, resolveQuestion, shuffleWithSeed } from './questionMode';
import { buildHints, hasMoreHints, hintBase } from './hints';
import { capGrade, gradeCapReason, maxGrade } from './gradeCap';
import type { Card, CardState, StudyQueueItem } from '../types';

function card(id: string, question: string, answers: string[], topic?: string): Card {
  return { id, question, answers, topic };
}

function item(c: Card, cardState: CardState | null = null): StudyQueueItem {
  return { card: c, cardState };
}

function state(reps: number): CardState {
  return {
    cardId: 'x',
    datasetId: 'd',
    stability: 1,
    difficulty: 5,
    lastReviewAt: null,
    dueAt: 0,
    reps,
    lapses: 0,
  };
}

// 実際に用語集で答えが漏れていた2件
const pdca = card(
  'problem-solving',
  '「計画・実行・評価・改善」を繰り返しながら、物事をより良くしていくための代表的な手順のこと。頭文字を取ってPDCAサイクルとも呼ばれる。',
  ['問題解決の手順（PDCAサイクル）', '問題解決の手順', 'PDCAサイクル', 'もんだいかいけつのてじゅん'],
  '情報社会の問題解決'
);
const sortAlgo = card(
  'sort',
  'バラバラに並んだデータを、大きさや順番の規則にしたがって並べ替える手順のこと。「ソート」とも呼ばれる。',
  ['整列アルゴリズム（ソート）', '整列アルゴリズム', 'ソート', 'せいれつあるごりずむ'],
  'コンピュータとプログラミング'
);

describe('maskQuestion', () => {
  it('問題文に混ざった答えを伏せる', () => {
    const result = maskQuestion(pdca.question, pdca.answers);
    expect(result.masked).toBe(true);
    expect(result.text).not.toContain('PDCAサイクル');
    expect(result.text).toContain('〇〇〇');
    expect(result.text).toContain('「計画・実行・評価・改善」');
  });

  it('鉤括弧の中の別名も伏せる', () => {
    const result = maskQuestion(sortAlgo.question, sortAlgo.answers);
    expect(result.text).not.toContain('ソート');
    expect(result.text).toContain('並べ替える手順');
  });

  it('答えが混ざっていない問題文は触らない', () => {
    const plain = card('sns', 'インターネット上で人と人とのつながりを作るサービスのこと。', ['SNS', 'えすえぬえす']);
    const result = maskQuestion(plain.question, plain.answers);
    expect(result.masked).toBe(false);
    expect(result.text).toBe(plain.question);
  });

  it('2文字以下の候補は伏せない（本文が壊れるため）', () => {
    const result = maskQuestion('データを表す最小の単位で、0か1のどちらかを表す。', ['ビット', '1', '0']);
    expect(result.text).toContain('0か1');
  });

  it('伏せ字の長さは答えの文字数を漏らさない', () => {
    const short = maskQuestion('これはアルゴリズムです。', ['アルゴリズム']);
    const long = maskQuestion('これは整列アルゴリズムです。', ['整列アルゴリズム']);
    expect(short.text.replace('これは', '').replace('です。', '')).toBe(
      long.text.replace('これは', '').replace('です。', '')
    );
  });
});

describe('isFirstEncounter', () => {
  it('cardState が無ければ初回', () => {
    expect(isFirstEncounter(null)).toBe(true);
  });
  it('reps が 0 なら初回', () => {
    expect(isFirstEncounter(state(0))).toBe(true);
  });
  it('1回でも解いていれば初回ではない', () => {
    expect(isFirstEncounter(state(1))).toBe(false);
  });
});

describe('buildChoices', () => {
  const pool: StudyQueueItem[] = [
    item(pdca),
    item(card('a', 'q', ['シグニファイア'], '情報社会の問題解決')),
    item(card('b', 'q', ['デジタルデバイド'], '情報社会の問題解決')),
    item(card('c', 'q', ['情報格差'], '情報社会の問題解決')),
    item(card('d', 'q', ['標本化'], '別カテゴリ')),
  ];

  it('4つの選択肢を作り、正解を含む', () => {
    const set = buildChoices(pdca, pool);
    expect(set.mode).toBe('choice');
    expect(set.choices).toHaveLength(4);
    expect(set.choices).toContain('問題解決の手順（PDCAサイクル）');
  });

  it('誤答は同じカテゴリから選ぶ', () => {
    const set = buildChoices(pdca, pool);
    const wrong = set.choices.filter((c) => c !== set.correct);
    expect(wrong).not.toContain('標本化');
  });

  it('同じカテゴリが足りなければ他のカテゴリで補う', () => {
    const thin: StudyQueueItem[] = [
      item(pdca),
      item(card('a', 'q', ['シグニファイア'], '情報社会の問題解決')),
      item(card('d', 'q', ['標本化'], '別カテゴリ')),
      item(card('e', 'q', ['量子化'], '別カテゴリ')),
    ];
    const set = buildChoices(pdca, thin);
    expect(set.choices).toHaveLength(4);
    expect(set.choices).toContain('標本化');
  });

  it('正解を含む・含まれる誤答は使わない', () => {
    const confusing: StudyQueueItem[] = [
      item(sortAlgo),
      item(card('a', 'q', ['アルゴリズム'], 'コンピュータとプログラミング')),
      item(card('b', 'q', ['整列アルゴリズム（ソート）'], 'コンピュータとプログラミング')),
      item(card('c', 'q', ['探索アルゴリズム'], 'コンピュータとプログラミング')),
      item(card('d', 'q', ['変数'], 'コンピュータとプログラミング')),
    ];
    const set = buildChoices(sortAlgo, confusing);
    const wrong = set.choices.filter((c) => c !== set.correct);
    expect(wrong).not.toContain('整列アルゴリズム（ソート）');
    expect(wrong).not.toContain('アルゴリズム');
    // 「探索アルゴリズム」は正解を含みも含まれもしない別の用語なので、誤答として使ってよい
    expect(wrong).toContain('探索アルゴリズム');
  });

  it('ひらがな読みなどの同義候補は選択肢に混ぜない', () => {
    const set = buildChoices(pdca, pool);
    expect(set.choices).not.toContain('もんだいかいけつのてじゅん');
    expect(set.choices).not.toContain('PDCAサイクル');
  });

  it('誤答が作れなければ記述に落とす', () => {
    const set = buildChoices(pdca, [item(pdca)]);
    expect(set.mode).toBe('input');
    expect(set.choices).toEqual([]);
  });

  it('選択肢が足りなければ集まった数だけで出す', () => {
    const set = buildChoices(pdca, [item(pdca), item(card('a', 'q', ['シグニファイア'], '情報社会の問題解決'))]);
    expect(set.mode).toBe('choice');
    expect(set.choices).toHaveLength(2);
  });

  it('同じカード・同じ回数なら並びが再現する', () => {
    expect(buildChoices(pdca, pool, 0).choices).toEqual(buildChoices(pdca, pool, 0).choices);
  });

  it('カードが違えば正解の位置も変わる', () => {
    const positions = new Set(
      ['a1', 'b2', 'c3', 'd4', 'e5', 'f6'].map((id) => {
        const c = card(id, 'q', [`正解${id}`], '情報社会の問題解決');
        const set = buildChoices(c, [item(c), ...pool]);
        return set.choices.indexOf(set.correct);
      })
    );
    expect(positions.size).toBeGreaterThan(1);
  });
});

describe('resolveQuestion', () => {
  const pool = [
    item(pdca),
    item(card('a', 'q', ['シグニファイア'], '情報社会の問題解決')),
    item(card('b', 'q', ['デジタルデバイド'], '情報社会の問題解決')),
    item(card('c', 'q', ['情報格差'], '情報社会の問題解決')),
  ];

  it('初回は選択', () => {
    expect(resolveQuestion(item(pdca, null), pool).mode).toBe('choice');
  });

  it('2回目は記述', () => {
    expect(resolveQuestion(item(pdca, state(1)), pool).mode).toBe('input');
  });
});

describe('shuffleWithSeed', () => {
  it('中身を落とさない', () => {
    const input = [1, 2, 3, 4, 5];
    expect([...shuffleWithSeed(input, 'seed')].sort()).toEqual(input);
  });
  it('元の配列を壊さない', () => {
    const input = [1, 2, 3];
    shuffleWithSeed(input, 'seed');
    expect(input).toEqual([1, 2, 3]);
  });
});

describe('hints', () => {
  it('括弧の中は文字数に数えない', () => {
    expect(hintBase(pdca)).toBe('問題解決の手順');
  });

  it('押さなければ何も出ない', () => {
    expect(buildHints(pdca, 0)).toEqual([]);
  });

  it('1段階目はカテゴリ', () => {
    const hints = buildHints(pdca, 1);
    expect(hints).toHaveLength(1);
    expect(hints[0].value).toBe('情報社会の問題解決');
  });

  it('2段階目で文字数が出る', () => {
    const hints = buildHints(pdca, 2);
    expect(hints[1].value).toBe('○○○○○○○（7文字）');
  });

  it('3段階目で最初の1文字が出る', () => {
    const hints = buildHints(pdca, 3);
    expect(hints[2].value).toBe('問○○○○○○');
  });

  it('4段階目以降は増えない', () => {
    expect(buildHints(pdca, 9)).toHaveLength(3);
    expect(hasMoreHints(pdca, 3)).toBe(false);
  });

  it('カテゴリが無いカードは文字数から始まる', () => {
    const noTopic = card('x', 'q', ['変数']);
    const hints = buildHints(noTopic, 1);
    expect(hints[0].label).toBe('文字数');
    expect(hasMoreHints(noTopic, 2)).toBe(false);
  });
});

describe('gradeCap', () => {
  it('不正解は Unknown のみ', () => {
    const ctx = { mode: 'input' as const, usedHint: false, isCorrect: false };
    expect(maxGrade(ctx)).toBe(1);
    expect(capGrade(4, ctx)).toBe(1);
  });

  it('選択で正解なら Good まで', () => {
    const ctx = { mode: 'choice' as const, usedHint: false, isCorrect: true };
    expect(maxGrade(ctx)).toBe(3);
    expect(capGrade(4, ctx)).toBe(3);
    expect(capGrade(2, ctx)).toBe(2);
  });

  it('ヒントを使ったら Hard まで', () => {
    const ctx = { mode: 'input' as const, usedHint: true, isCorrect: true };
    expect(maxGrade(ctx)).toBe(2);
    expect(capGrade(4, ctx)).toBe(2);
  });

  it('ヒント無しで書けたら Easy まで', () => {
    const ctx = { mode: 'input' as const, usedHint: false, isCorrect: true };
    expect(maxGrade(ctx)).toBe(4);
    expect(capGrade(4, ctx)).toBe(4);
    expect(gradeCapReason(ctx)).toBeNull();
  });

  it('制限をかけたときは理由を出す', () => {
    expect(gradeCapReason({ mode: 'choice', usedHint: false, isCorrect: true })).toContain('Easy');
    expect(gradeCapReason({ mode: 'input', usedHint: true, isCorrect: true })).toContain('ヒント');
  });
});
