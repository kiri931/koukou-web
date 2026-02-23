import { useMemo, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { questions as questionBank } from "../data/questions";
import type { RenderedQuestion } from "../types";
import PrintSheet from "./PrintSheet";

const DEFAULT_COUNT = 10;

function shuffleArray<T>(items: readonly T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function clampQuestionCount(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_COUNT;
  return Math.max(1, Math.min(questionBank.length, Math.floor(value)));
}

function renderMath(tex: string) {
  return katex.renderToString(tex, {
    throwOnError: false,
    strict: "ignore",
    output: "html",
  });
}

function renderInlineMixed(text: string) {
  const parts: string[] = [];
  let matched = false;
  let lastIndex = 0;
  const regex = /\\\((.+?)\\\)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    matched = true;
    const [raw, math] = match;
    const start = match.index;
    if (start > lastIndex) {
      parts.push(escapeHtml(text.slice(lastIndex, start)));
    }
    parts.push(renderMath(math));
    lastIndex = start + raw.length;
  }

  if (lastIndex < text.length) {
    parts.push(escapeHtml(text.slice(lastIndex)));
  }

  if (!matched) {
    return escapeHtml(text);
  }

  return parts.join("");
}

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function MathText({ text, className }: { text: string; className?: string }) {
  const html = useMemo(() => renderInlineMixed(text), [text]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

function MathChoice({ text }: { text: string }) {
  const html = useMemo(() => renderMath(text), [text]);
  return <span className="equation-choice-katex" dangerouslySetInnerHTML={{ __html: html }} />;
}

function feedbackMessage(correct: number, total: number) {
  if (correct === total) return "満点！移項と係数処理が完璧です。";
  if (correct >= Math.ceil(total * 0.8)) {
    return "とても良いです。符号と割り算の扱いを再確認すると満点が見えます。";
  }
  if (correct >= Math.ceil(total * 0.5)) {
    return "基礎はできています。移項時の符号ミスに注意！";
  }
  return "まずは移項→係数で割るの手順を丁寧に練習しましょう。";
}

function pickQuestions(count: number): RenderedQuestion[] {
  return shuffleArray(questionBank)
    .slice(0, clampQuestionCount(count))
    .map((question) => ({
      ...question,
      shuffledChoices: shuffleArray(question.choices),
    }));
}

function parseFracBraces(s: string, start: number): [string, string, number] | null {
  let i = start;
  let depth = 1;

  while (i < s.length) {
    const ch = s[i];
    if (ch === "{") depth += 1;
    if (ch === "}") depth -= 1;
    if (depth === 0) break;
    i += 1;
  }

  if (depth !== 0) return null;
  const numerator = s.slice(start, i);
  if (s[i + 1] !== "{") return null;

  let j = i + 2;
  depth = 1;
  while (j < s.length) {
    const ch = s[j];
    if (ch === "{") depth += 1;
    if (ch === "}") depth -= 1;
    if (depth === 0) break;
    j += 1;
  }

  if (depth !== 0) return null;
  const denominator = s.slice(i + 2, j);
  return [numerator, denominator, j + 1];
}

function stripOuterParens(s: string) {
  const hasTopLevelAddSub = (expr: string) => {
    let depth = 0;
    for (let i = 0; i < expr.length; i += 1) {
      const ch = expr[i];
      if (ch === "(") depth += 1;
      else if (ch === ")") depth -= 1;
      else if (depth === 0 && (ch === "+" || ch === "-")) return true;
    }
    return false;
  };

  const isWrappedBySingleOuterParens = (expr: string) => {
    if (!(expr.startsWith("(") && expr.endsWith(")"))) return false;
    let depth = 0;
    for (let i = 0; i < expr.length; i += 1) {
      const ch = expr[i];
      if (ch === "(") depth += 1;
      else if (ch === ")") depth -= 1;
      if (depth === 0 && i < expr.length - 1) return false;
    }
    return depth === 0;
  };

  let prev = "";
  let next = s;
  while (next !== prev) {
    prev = next;

    if (isWrappedBySingleOuterParens(next)) {
      const inner = next.slice(1, -1);
      if (!hasTopLevelAddSub(inner)) {
        next = inner;
        continue;
      }
    }

    next = next.replace(/\(([A-Za-z0-9^]+)\)/g, "$1");
  }

  return next;
}

function normalizeAnswer(s: string) {
  const convertFracs = (value: string): string => {
    let out = "";
    for (let i = 0; i < value.length; ) {
      if (value.startsWith("\\frac{", i)) {
        const parsed = parseFracBraces(value, i + "\\frac{".length);
        if (!parsed) {
          out += value[i];
          i += 1;
          continue;
        }
        const [num, den, nextIndex] = parsed;
        out += `(${convertFracs(num)})/(${convertFracs(den)})`;
        i = nextIndex;
        continue;
      }
      out += value[i];
      i += 1;
    }
    return out;
  };

  let next = s.replace(/\s+/g, "");
  next = next.replace(/\\(?:d|t)frac\{/g, "\\frac{");
  next = next.replace(/\\left/g, "").replace(/\\right/g, "");
  next = convertFracs(next);
  next = next.replace(/\^\{([^{}]+)\}/g, "^$1");
  next = stripOuterParens(next);
  return next;
}

function naturalToLatex(s: string) {
  return s
    .replace(/\(([^)]+)\)\/\(([^)]+)\)/g, "\\frac{$1}{$2}")
    .replace(/\(([^)]+)\)\/([A-Za-z0-9^]+)/g, "\\frac{$1}{$2}");
}

export default function EquationTransformation() {
  type QuizMode = "choice" | "input";
  const [questionCountInput, setQuestionCountInput] = useState(String(DEFAULT_COUNT));
  const [items, setItems] = useState<RenderedQuestion[]>(() => pickQuestions(DEFAULT_COUNT));
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [graded, setGraded] = useState(false);
  const [score, setScore] = useState(0);
  const [printSheetOpen, setPrintSheetOpen] = useState(false);
  const [mode, setMode] = useState<QuizMode>("choice");

  const total = items.length;

  const reloadQuestions = () => {
    const count = clampQuestionCount(Number(questionCountInput));
    setItems(pickQuestions(count));
    setAnswers({});
    setGraded(false);
    setScore(0);
  };

  const resetAnswers = () => {
    setAnswers({});
    setGraded(false);
    setScore(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const gradeAnswers = () => {
    let correct = 0;
    for (const item of items) {
      const given = answers[item.id];
      if (!given) continue;
      if (mode === "choice") {
        if (given === item.answer) correct += 1;
      } else {
        if (normalizeAnswer(given) === normalizeAnswer(item.answer)) correct += 1;
      }
    }
    setScore(correct);
    setGraded(true);
  };

  const resultVisible = graded && total > 0;
  const feedback = resultVisible ? feedbackMessage(score, total) : "";

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 text-slate-900 dark:text-slate-100">
      <style>{`
        @media print {
          header, .no-print, [data-theme-toggle] { display: none !important; }
          [data-slot="sheet-portal"], [data-slot="sheet-overlay"], [data-slot="sheet-content"] { display: none !important; }
          body { background: white !important; }
          .print-root { max-width: none !important; padding: 0 !important; }
          .print-card { box-shadow: none !important; border-color: #cbd5e1 !important; break-inside: avoid; }
          .print-footer { display: none !important; position: fixed; bottom: 8mm; left: 12mm; right: 12mm; font-size: 10pt; color: #334155; }
          .print-answer { display: none !important; }
          .print-explain { display: none !important; }
          .print-student-info { display: none !important; }
          body.print-show-answers .print-answer { display: block !important; }
          body.print-show-explain .print-explain { display: block !important; }
          body.print-show-student-info .print-student-info { display: block !important; }
          .katex { color: #000 !important; }
          @page { size: A4; margin: 12mm; }
        }
      `}</style>

      <div className="print-root">
        <PrintSheet open={printSheetOpen} onOpenChange={setPrintSheetOpen} />
        <Card className="mb-6 border-emerald-200/80 bg-white/95 dark:border-emerald-900/40 dark:bg-slate-900/70">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">等式の変形テスト</CardTitle>
                <CardDescription>問題バンクからランダム出題（既定10問）</CardDescription>
              </div>
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Study</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="no-print">
              <Tabs
                value={mode}
                onValueChange={(v) => {
                  setMode(v as QuizMode);
                  setAnswers({});
                  setGraded(false);
                  setScore(0);
                }}
              >
                <TabsList className="w-64">
                  <TabsTrigger value="choice">択一式</TabsTrigger>
                  <TabsTrigger value="input">記述式</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                ルール
              </h2>
              <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                <li>出題数は既定で {DEFAULT_COUNT} 問（変更可）</li>
                <li>すべて解いたら「採点する」を押してください</li>
                <li>採点後は各問の解説が自動で開きます</li>
              </ul>
              {mode === "input" && (
                <div className="mt-3 rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                    記述方式
                  </p>
                  <ul className="mt-1 space-y-1 text-sm text-slate-700 dark:text-slate-300">
                    <li>記述式では `x=(5y-7)/3` のように半角で入力してください</li>
                    <li>分数は `a/b`、かっこ付き分数は `(a+b)/(c-d)` の形で入力できます</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="no-print flex flex-col gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-end">
              <div className="w-full sm:w-44">
                <label htmlFor="equation-count" className="mb-1 block text-sm font-medium">
                  出題数
                </label>
                <Input
                  id="equation-count"
                  type="number"
                  min={1}
                  max={questionBank.length}
                  value={questionCountInput}
                  onChange={(event) => setQuestionCountInput(event.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={reloadQuestions}>
                  出題を更新
                </Button>
                <Button type="button" onClick={gradeAnswers}>
                  採点する
                </Button>
                <Button type="button" variant="outline" onClick={resetAnswers}>
                  やり直し
                </Button>
                <Button type="button" variant="outline" onClick={() => setPrintSheetOpen(true)}>
                  印刷（A4）
                </Button>
              </div>
            </div>

            {resultVisible && (
              <div className="no-print rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono">
                    {score} / {total}
                  </Badge>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    正解率 {Math.round((score / total) * 100)}%
                  </span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300">{feedback}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <section className="space-y-4">
          {items.map((item, index) => {
            const selected = answers[item.id];
            const isCorrect =
              graded &&
              (mode === "choice"
                ? selected === item.answer
                : !!selected && normalizeAnswer(selected) === normalizeAnswer(item.answer));
            const inputPreviewLatex = mode === "input" && selected ? naturalToLatex(selected) : "";

            return (
              <Card
                key={`${item.id}-${index}`}
                className="print-card gap-4 border-slate-200 bg-white/95 py-4 dark:border-slate-800 dark:bg-slate-900/70"
              >
                <CardHeader className="gap-3 px-4 pb-0 sm:px-6">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg">Q{index + 1}</CardTitle>
                    {graded && (
                      <Badge
                        variant={isCorrect ? "default" : "destructive"}
                        className={cn(isCorrect ? "bg-emerald-600 hover:bg-emerald-600" : "")}
                      >
                        {isCorrect ? "正解" : "不正解"}
                      </Badge>
                    )}
                  </div>
                  <MathText text={item.prompt} className="leading-7 text-slate-800 dark:text-slate-100" />
                </CardHeader>

                <CardContent className="px-4 sm:px-6">
                  {mode === "choice" && (
                    <RadioGroup
                      value={selected ?? ""}
                      onValueChange={(value) => setAnswers((prev) => ({ ...prev, [item.id]: value }))}
                      className="gap-2"
                    >
                      {item.shuffledChoices.map((choice, choiceIndex) => {
                        const isPicked = selected === choice;
                        const showCorrect = graded && choice === item.answer;
                        const showWrong = graded && isPicked && choice !== item.answer;

                        return (
                          <label
                            key={`${item.id}-${choice}-${choiceIndex}`}
                            className={cn(
                              "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 transition",
                              "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50",
                              showCorrect &&
                                "border-emerald-300 bg-emerald-50/80 dark:border-emerald-800 dark:bg-emerald-950/30",
                              showWrong &&
                                "border-rose-300 bg-rose-50/80 dark:border-rose-800 dark:bg-rose-950/30"
                            )}
                          >
                            <RadioGroupItem value={choice} disabled={graded} className="mt-1" />
                            <MathChoice text={choice} />
                          </label>
                        );
                      })}
                    </RadioGroup>
                  )}

                  {mode === "input" && (
                    <div className="space-y-2">
                      <Input
                        placeholder="例: x=(5y-7)/3"
                        value={selected ?? ""}
                        disabled={graded}
                        onChange={(e) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        className={cn(
                          graded &&
                            isCorrect &&
                            "border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-100",
                          graded &&
                            !isCorrect &&
                            selected &&
                            "border-rose-400 bg-rose-50 text-rose-900 dark:border-rose-700 dark:bg-rose-950/30 dark:text-rose-100"
                        )}
                      />
                      {!graded && selected && (
                        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950/50">
                          <span className="mr-2 text-xs text-slate-500 dark:text-slate-400">
                            プレビュー:
                          </span>
                          <MathChoice text={inputPreviewLatex} />
                        </div>
                      )}
                    </div>
                  )}

                  {graded && (mode === "input" || selected) && !isCorrect && (
                    <div className="no-print mt-3 space-y-1 text-sm">
                      {mode === "input" && selected && (
                        <p className="text-rose-700 dark:text-rose-300">
                          あなたの解答: <MathChoice text={naturalToLatex(selected)} />
                        </p>
                      )}
                      <p className="text-rose-700 dark:text-rose-300">
                        正解: <MathChoice text={item.answer} />
                      </p>
                    </div>
                  )}

                  {graded && isCorrect && mode === "input" && selected && (
                    <div className="no-print mt-3 text-sm text-emerald-700 dark:text-emerald-300">
                      正解！ <MathChoice text={naturalToLatex(selected)} />
                    </div>
                  )}

                  <p className="print-answer hidden mt-3 text-sm text-slate-700">
                    解答: <MathChoice text={item.answer} />
                  </p>

                  <details
                    className="no-print mt-4 rounded-lg border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/50"
                    open={graded}
                  >
                    <summary className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-200">
                      解説
                    </summary>
                    <MathText
                      text={item.explain}
                      className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300"
                    />
                  </details>

                  <div className="print-explain hidden mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm leading-7 text-slate-700">
                    <p className="mb-2 font-medium">解説</p>
                    <MathText text={item.explain} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <p className="print-footer print-student-info hidden">
          等式の変形テスト ／ 氏名：__________________ ／ 学年：____ 組：____ 番：____
        </p>
      </div>
    </main>
  );
}
