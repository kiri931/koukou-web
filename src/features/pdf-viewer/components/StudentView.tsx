import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { useQuizSession } from '../hooks/useQuizSession';
import type { QuestionFormat, Quiz, QuizQuestion } from '../types';
import { PdfPanel } from './PdfPanel';
import { QuizResults } from './QuizResults';

const textareaClassName =
  'border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-36 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-[3px]';

function isValidFormat(value: unknown): value is QuestionFormat {
  return value === 'choice' || value === 'text' || value === 'number';
}

function isQuizQuestion(value: unknown): value is QuizQuestion {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const question = value as Partial<QuizQuestion>;
  return (
    typeof question.id === 'string' &&
    isValidFormat(question.format) &&
    typeof question.stem === 'string' &&
    typeof question.correctAnswer === 'string' &&
    typeof question.points === 'number' &&
    (question.choices === undefined || Array.isArray(question.choices))
  );
}

function isQuiz(value: unknown): value is Quiz {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const quiz = value as Partial<Quiz>;
  return (
    typeof quiz.id === 'string' &&
    typeof quiz.title === 'string' &&
    typeof quiz.pdfUrl === 'string' &&
    typeof quiz.createdAt === 'number' &&
    Array.isArray(quiz.questions) &&
    quiz.questions.every(isQuizQuestion)
  );
}

function parseQuizJson(raw: string): Quiz {
  const parsed: unknown = JSON.parse(raw);
  if (!isQuiz(parsed)) {
    throw new Error('クイズJSONの形式が不正です。');
  }
  return parsed;
}

export function StudentView() {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [jsonText, setJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const { answers, setAnswer, results, grade, reset } = useQuizSession(quiz);

  const totalPoints = useMemo(
    () => (quiz?.questions ?? []).reduce((sum, question) => sum + question.points, 0),
    [quiz?.questions]
  );

  const importFromText = (text: string) => {
    try {
      const parsedQuiz = parseQuizJson(text);
      setQuiz(parsedQuiz);
      setJsonText(text);
      setImportError(null);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'JSONの読み込みに失敗しました。');
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();
    importFromText(text);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">生徒モード</CardTitle>
          <CardDescription>JSONを読み込んで、PDFを見ながら解答・採点します。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-64 flex-1 space-y-2">
              <Label htmlFor="quiz-json-file">JSONファイルを読込</Label>
              <Input id="quiz-json-file" type="file" accept="application/json,.json" onChange={handleFileChange} />
            </div>
            <Button type="button" variant="outline" onClick={() => importFromText(jsonText)} disabled={!jsonText.trim()}>
              貼り付けJSONを反映
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quiz-json-text">JSONを貼り付け</Label>
            <textarea
              id="quiz-json-text"
              className={textareaClassName}
              value={jsonText}
              onChange={(event) => setJsonText(event.target.value)}
              placeholder="教師モードでエクスポートした JSON を貼り付け"
            />
          </div>

          {importError && <p className="text-sm text-red-600">{importError}</p>}
        </CardContent>
      </Card>

      {!quiz && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">クイズJSONを読み込むと問題とPDFが表示されます。</p>
          </CardContent>
        </Card>
      )}

      {quiz && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <PdfPanel pdfUrl={quiz.pdfUrl} />

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{quiz.title}</CardTitle>
                <CardDescription>
                  {quiz.questions.length}問 / 満点 {totalPoints}点
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {quiz.questions.map((question, index) => (
                  <div key={question.id} className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">Q{index + 1}</p>
                      <p className="text-xs text-muted-foreground">{question.points}点</p>
                    </div>
                    <p className="text-sm">{question.stem}</p>

                    {question.format === 'choice' && (
                      <RadioGroup
                        value={answers[question.id] ?? ''}
                        onValueChange={(value) => setAnswer(question.id, value)}
                        className="gap-2"
                      >
                        {(question.choices ?? []).map((choice, choiceIndex) => {
                          const optionId = `${question.id}-choice-${choiceIndex}`;
                          return (
                            <Label key={optionId} htmlFor={optionId} className="rounded border p-3 font-normal">
                              <RadioGroupItem id={optionId} value={choice} />
                              <span>{choice}</span>
                            </Label>
                          );
                        })}
                      </RadioGroup>
                    )}

                    {question.format === 'text' && (
                      <Input
                        value={answers[question.id] ?? ''}
                        onChange={(event) => setAnswer(question.id, event.target.value)}
                        placeholder="解答を入力"
                      />
                    )}

                    {question.format === 'number' && (
                      <Input
                        type="number"
                        value={answers[question.id] ?? ''}
                        onChange={(event) => setAnswer(question.id, event.target.value)}
                        placeholder="数値を入力"
                      />
                    )}
                  </div>
                ))}

                <Button type="button" onClick={() => grade()} disabled={quiz.questions.length === 0}>
                  採点する
                </Button>
              </CardContent>
            </Card>

            {results && <QuizResults quiz={quiz} results={results} onReset={reset} />}
          </div>
        </div>
      )}
    </div>
  );
}
