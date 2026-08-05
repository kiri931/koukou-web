// 問題文に答えが混ざっているときに伏せる。
//
// 用語集の一言説明には「頭文字を取ってPDCAサイクルとも呼ばれる」のように
// 別名が書いてあることがあり、その別名は覚える君の正答候補でもある。
// 答えが問題文に書いてある状態になるので、出題時だけ隠す。
// 詳しくは docs/anki/spec.md の「6. 問題文に答えが混ざっている場合」。

/** 伏せ字。答えの文字数に合わせない（合わせると文字数ヒントになる） */
const MASK = '〇〇〇';

/** これ以下の長さの候補は伏せない。本文中の別の意味で出てくるほうが多い */
const MIN_MASK_LENGTH = 3;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface MaskResult {
  /** 出題用の問題文 */
  text: string;
  /** 1か所でも伏せたか */
  masked: boolean;
}

/**
 * 問題文から答えを伏せる。
 *
 * 長い候補から先に置き換える。「問題解決の手順（PDCAサイクル）」を先に処理してから
 * 「PDCAサイクル」を見ないと、短いほうが先に消えて長いほうが一致しなくなる。
 */
export function maskQuestion(question: string, answers: string[]): MaskResult {
  const targets = [...new Set(answers)]
    .filter((answer) => answer.trim().length >= MIN_MASK_LENGTH)
    .sort((a, b) => b.length - a.length);

  let text = question;
  let masked = false;

  for (const target of targets) {
    const pattern = new RegExp(escapeRegExp(target.trim()), 'g');
    if (!pattern.test(text)) continue;
    text = text.replace(new RegExp(escapeRegExp(target.trim()), 'g'), MASK);
    masked = true;
  }

  return { text, masked };
}
