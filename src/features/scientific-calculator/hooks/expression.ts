// 式文字列そのものを扱う純関数。React に依存しないのでテストしやすい。

export function countParenBalance(expression: string) {
  let balance = 0;
  for (const ch of expression) {
    if (ch === '(') balance += 1;
    if (ch === ')') balance -= 1;
  }
  return balance;
}

/**
 * 度分秒表記を通常の数式に展開する。
 *   85°29'17"  ->  (85+29/60+17/3600)
 *   84°10'     ->  (84+10/60+0/3600)
 */
export function expandDms(expression: string) {
  return expression.replace(
    /(\d+(?:\.\d+)?)°(?:(\d+(?:\.\d+)?)')?(?:(\d+(?:\.\d+)?)")?/g,
    (_match, deg: string, min?: string, sec?: string) =>
      `(${deg}+${min ?? 0}/60+${sec ?? 0}/3600)`
  );
}

/**
 * mathjs に渡す直前の整形。
 * 閉じ忘れたかっこを補う（実際の関数電卓と同じ挙動）。
 */
export function prepareForEval(expression: string) {
  const missing = Math.max(0, countParenBalance(expression));
  return expandDms(`${expression}${')'.repeat(missing)}`);
}

/**
 * 末尾にある「1つのオペランド」を切り出す。
 * 中置キー（ʸ√x・nPr・nCr・xʸ）と後置キー（x!）が、
 * 直前の数値やかっこの塊を引数として取り込むために使う。
 *
 *   "3*(6-3)"   -> { head: "3*",  operand: "(6-3)" }
 *   "12+4.5"    -> { head: "12+", operand: "4.5" }
 *   "2*sin(30)" -> { head: "2*",  operand: "sin(30)" }
 */
export function splitTrailingOperand(expression: string): { head: string; operand: string } {
  if (!expression) return { head: '', operand: '' };

  if (expression.endsWith(')')) {
    let depth = 0;
    for (let i = expression.length - 1; i >= 0; i -= 1) {
      const ch = expression[i];
      if (ch === ')') depth += 1;
      if (ch === '(') {
        depth -= 1;
        if (depth === 0) {
          // かっこの直前に関数名があれば一緒に取り込む（sin( や cbrt( など）
          const nameMatch = expression.slice(0, i).match(/[A-Za-z_][A-Za-z0-9_]*$/);
          const start = nameMatch ? i - nameMatch[0].length : i;
          return { head: expression.slice(0, start), operand: expression.slice(start) };
        }
      }
    }
    return { head: '', operand: expression };
  }

  // 指数表記(3.46e-5)を含む数値リテラル
  const numberMatch = expression.match(/(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?$/);
  if (numberMatch) {
    const start = expression.length - numberMatch[0].length;
    return { head: expression.slice(0, start), operand: numberMatch[0] };
  }

  // pi や M などの識別子
  const identMatch = expression.match(/[A-Za-z_][A-Za-z0-9_]*$/);
  if (identMatch) {
    const start = expression.length - identMatch[0].length;
    return { head: expression.slice(0, start), operand: identMatch[0] };
  }

  return { head: expression, operand: '' };
}

/**
 * 度分秒キーを押したとき、次に入れる区切り記号を決める。
 * 数値部分を読み飛ばして、その手前の記号を見る。
 */
export function nextDmsSeparator(expression: string): '°' | "'" | '"' | null {
  const trimmed = expression.replace(/[\d.]+$/, '');
  const last = trimmed.slice(-1);
  if (last === '°') return "'";
  if (last === "'") return '"';
  if (last === '"') return null; // すでに秒まで入っている
  return '°';
}

const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '-': '⁻', '+': '⁺',
};

function toSuperscript(text: string) {
  return [...text].map((ch) => SUPERSCRIPT[ch] ?? ch).join('');
}

/** 画面に出す形。生徒が「打った通りに見える」ことを優先する。 */
export function formatExpressionForDisplay(expression: string) {
  return expression
    // 指数表記 3.46e-5 → 3.46×10⁻⁵（先頭が数字のときだけ。定数 e とは区別される）
    .replace(/(\d)e([+-]?\d*)/g, (_m, digit: string, exp: string) =>
      `${digit}×10${exp ? toSuperscript(exp) : ''}`)
    .replace(/\bxroot\((\d+(?:\.\d+)?),/g, '$1√(')
    .replace(/\bxroot\(/g, 'ˣ√(')
    .replace(/\bfact\(/g, '!(')
    .replace(/\bpow10\(/g, '10^(')
    .replace(/\bexp\(/g, 'e^(')
    .replace(/\bcbrt\(/g, '∛(')
    .replace(/\bsqrt\(/g, '√(')
    .replace(/\*/g, '×')
    .replace(/\//g, '÷')
    .replace(/\bpi\b/g, 'π');
}
