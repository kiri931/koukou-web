const VOWELS = new Set(['a', 'i', 'u', 'e', 'o']);

/**
 * ローマ字文字列の中から「ん」を表している箇所を拾う。
 * 判定は IME と同じ貪欲な解釈に合わせる。
 *
 *  - `nn` は常に「ん」
 *  - 単独の `n` は、後ろが母音でも `y` でもない（＝子音か語末）ときだけ「ん」
 *    それ以外は「な行 / にゃ行」の子音なので対象外
 *
 * 例: genki → 'n' の後ろが 'k' なので「ん」/ neko → 後ろが 'e' なので「な行」
 */
function findSyllabicN(text: string): { at: number; len: number }[] {
  const found: { at: number; len: number }[] = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] !== 'n') {
      i += 1;
      continue;
    }
    const next = text[i + 1];
    if (next === 'n') {
      found.push({ at: i, len: 2 });
      i += 2;
      continue;
    }
    if (next === undefined || (!VOWELS.has(next) && next !== 'y')) {
      found.push({ at: i, len: 1 });
    }
    i += 1;
  }
  return found;
}

/**
 * その「ん」を単独の `n` で打てるか。
 * 直後が母音・`y`・`n` のときは、単独 `n` だと次の音とくっついて別の読みになる
 * （kanniiku → 「かんいいく」）ため、`nn` 表記に限る。
 */
function allowsSingleN(text: string, mark: { at: number; len: number }): boolean {
  const after = text[mark.at + mark.len];
  if (after === undefined) return true;
  return !VOWELS.has(after) && after !== 'y' && after !== 'n';
}

const MAX_SYLLABIC_N = 6;

/**
 * 1つの答えについて、「ん」を `n` とも `nn` とも打てるようにした表記をすべて作る。
 *
 * 問題データ側は「ん」をどちらか一方でしか持っていないことが多く、
 * 学校で教える `nn` 派の生徒が誤入力を取られていた。データを1問ずつ直すと
 * 問題を足すたびに漏れるので、判定側でまとめて吸収する。
 */
export function expandSyllabicN(answer: string): string[] {
  const marks = findSyllabicN(answer);
  if (marks.length === 0 || marks.length > MAX_SYLLABIC_N) return [answer];

  let variants = [''];
  let cursor = 0;
  for (const mark of marks) {
    const literal = answer.slice(cursor, mark.at);
    const spellings = allowsSingleN(answer, mark) ? ['n', 'nn'] : ['nn'];
    variants = variants.flatMap((prefix) => spellings.map((s) => `${prefix}${literal}${s}`));
    cursor = mark.at + mark.len;
  }
  const tail = answer.slice(cursor);
  return variants.map((v) => `${v}${tail}`);
}

/** 日本語モードの答えを、「ん」の表記ゆれを吸収した形に広げる。 */
export function expandAnswers(answers: string[]): string[] {
  return [...new Set(answers.flatMap(expandSyllabicN))];
}
