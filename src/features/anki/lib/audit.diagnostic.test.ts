import { describe, expect, it } from 'vitest';
import { buildChoices } from '@/features/anki/lib/questionMode';
import { maskQuestion } from '@/features/anki/lib/maskQuestion';
import { buildHints } from '@/features/anki/lib/hints';
import glossary from '@/features/anki/lib/__fixtures__/glossary.json';
import type { Card } from '@/features/anki/types';

const cards = glossary.cards as Card[];
const pool = cards.map((card) => ({ card, cardState: null }));

describe('実データ68枚の診断', () => {
  it('全カードで4択が作れる', () => {
    const bad = cards.filter((c) => buildChoices(c, pool).choices.length < 4);
    console.log('選択肢が4未満:', bad.map((c) => c.answers[0]));
    expect(bad).toHaveLength(0);
  });

  it('選択肢に正解が1つだけ含まれる', () => {
    const bad: string[] = [];
    for (const c of cards) {
      const set = buildChoices(c, pool);
      const hits = set.choices.filter((choice) =>
        c.answers.some((a) => a.normalize('NFKC').toLowerCase() === choice.normalize('NFKC').toLowerCase())
      );
      if (hits.length !== 1) bad.push(`${c.answers[0]} -> ${set.choices.join(' / ')}`);
    }
    console.log('正解が複数/ゼロ:', bad);
    expect(bad).toHaveLength(0);
  });

  it('選択肢に重複がない', () => {
    const bad = cards.filter((c) => {
      const s = buildChoices(c, pool).choices;
      return new Set(s).size !== s.length;
    });
    expect(bad).toHaveLength(0);
  });

  it('問題文に答えが残っていない', () => {
    const bad: string[] = [];
    for (const c of cards) {
      const masked = maskQuestion(c.question, c.answers).text;
      for (const a of c.answers) {
        if (a.length >= 3 && masked.includes(a)) bad.push(`${c.answers[0]}: ${a}`);
      }
    }
    console.log('答えが残った:', bad);
    expect(bad).toHaveLength(0);
  });

  it('伏せ字で問題文が壊れていないか（伏せた件数と例）', () => {
    const maskedCards = cards.filter((c) => maskQuestion(c.question, c.answers).masked);
    console.log('伏せ字が入ったカード数:', maskedCards.length, '/', cards.length);
    for (const c of maskedCards) console.log('  ', maskQuestion(c.question, c.answers).text);
  });

  it('ヒントが3段階そろう', () => {
    const bad = cards.filter((c) => buildHints(c, 3).length < 3);
    console.log('ヒントが3段階未満:', bad.map((c) => c.answers[0]));
    expect(bad).toHaveLength(0);
  });

  it('選択肢の見た目サンプル', () => {
    for (const c of cards.slice(0, 6)) {
      const set = buildChoices(c, pool);
      console.log(`\nQ: ${maskQuestion(c.question, c.answers).text.slice(0, 50)}...`);
      set.choices.forEach((s, i) => console.log(`  ${i + 1}. ${s}${s === set.correct ? '  ← 正解' : ''}`));
    }
  });
});
