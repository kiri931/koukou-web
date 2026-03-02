const SYMBOL_MAP: Record<string, string> = {
  '×': '*',
  '÷': '/',
  EXP: 'exp10',
};

export function parseGuideToKeySequence(guide: string[]): string[] {
  const result: string[] = [];

  for (const token of guide) {
    const mapped = SYMBOL_MAP[token];
    if (mapped) {
      result.push(mapped);
      continue;
    }

    if (/^-?[\d.]+$/.test(token)) {
      result.push(...token.split(''));
      continue;
    }

    result.push(token);
  }

  return result;
}
