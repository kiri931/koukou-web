import { useEffect, useMemo, useState } from 'react';
import { ExternalLinkIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePdfData } from '../hooks/usePdfData';
import type { PdfScope, Question } from '../types';

function parseQuestionNumber(question: Question, fallbackNumber: number): number {
  const byId = question.id.match(/(\d+)$/);
  if (byId) {
    return Number.parseInt(byId[1], 10);
  }

  const byLabel = question.source.label.match(/(\d+)/);
  if (byLabel) {
    return Number.parseInt(byLabel[1], 10);
  }

  return fallbackNumber;
}

function buildPlaceholderQuestions(pdfId: string, scope: PdfScope, count: number): Question[] {
  const safeCount = Math.max(0, count);
  return Array.from({ length: safeCount }, (_, index) => {
    const num = index + 1;
    return {
      id: `${pdfId}-${scope.id}-${String(num).padStart(3, '0')}`,
      format: 'choice',
      stem: '',
      choices: ['ア', 'イ', 'ウ', 'エ'],
      answer_text: '',
      source: {
        type: 'pdf',
        pdfId,
        page: 1,
        label: `問${num}`,
      },
    };
  });
}

export default function PdfReferenceMode() {
  const [activePdfId, setActivePdfId] = useState<string | null>(null);
  const [scopeId, setScopeId] = useState<string>('all');
  const [focusedQuestionId, setFocusedQuestionId] = useState<string | null>(null);

  const { pdfList, currentPdf, questions, answers, isListLoading, isDataLoading, error } = usePdfData(activePdfId);

  useEffect(() => {
    if (!activePdfId && pdfList.length > 0) {
      setActivePdfId(pdfList[0].id);
    }
  }, [pdfList, activePdfId]);

  useEffect(() => {
    if (!currentPdf) {
      setScopeId('all');
      return;
    }

    const nextScope = currentPdf.scopes?.[0]?.id ?? 'all';
    setScopeId(nextScope);
  }, [currentPdf?.id]);

  const selectedScope = useMemo(() => {
    if (!currentPdf?.scopes?.length) {
      return null;
    }

    return currentPdf.scopes.find((scope) => scope.id === scopeId) ?? currentPdf.scopes[0];
  }, [currentPdf, scopeId]);

  const scopedQuestions = useMemo(() => {
    if (!currentPdf || !selectedScope) {
      return [];
    }

    const limit = selectedScope.questionCount;
    if (questions.length > 0) {
      if (typeof limit === 'number' && limit > 0) {
        return questions.slice(0, limit);
      }
      return questions;
    }

    if (typeof limit === 'number' && limit > 0) {
      return buildPlaceholderQuestions(currentPdf.id, selectedScope, limit);
    }

    return [];
  }, [currentPdf, selectedScope, questions]);

  useEffect(() => {
    if (scopedQuestions.length === 0) {
      setFocusedQuestionId(null);
      return;
    }

    if (!focusedQuestionId || !scopedQuestions.some((question) => question.id === focusedQuestionId)) {
      setFocusedQuestionId(scopedQuestions[0].id);
    }
  }, [scopedQuestions, focusedQuestionId]);

  const focusedQuestion = useMemo(
    () => scopedQuestions.find((question) => question.id === focusedQuestionId) ?? null,
    [scopedQuestions, focusedQuestionId]
  );

  const answerMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const row of answers?.answers ?? []) {
      map.set(row.q, row.answer);
    }
    return map;
  }, [answers]);

  const viewerLink = currentPdf
    ? `/tools/pdf-viewer/viewer?file=${encodeURIComponent(currentPdf.path)}&page=1`
    : '#';

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 text-slate-900 dark:text-slate-100">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">PDF参照モード</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          PDFと問題・解答を照合しながら学習できます。
        </p>
      </div>

      {isListLoading && <p className="text-sm text-slate-600 dark:text-slate-400">PDF一覧を読み込み中...</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {!isListLoading && pdfList.length > 0 && activePdfId && (
        <Tabs value={activePdfId} onValueChange={setActivePdfId} className="gap-4">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
            {pdfList.map((pdf) => (
              <TabsTrigger
                key={pdf.id}
                value={pdf.id}
                className="flex-none rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs data-[state=active]:border-slate-900 data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:border-slate-700 dark:bg-slate-900/70 dark:data-[state=active]:border-slate-100 dark:data-[state=active]:bg-slate-100 dark:data-[state=active]:text-slate-900"
              >
                {pdf.title}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activePdfId}>
            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50 md:flex-row md:items-center md:justify-between">
              <div className="flex w-full flex-col gap-2 md:max-w-sm">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">スコープ</label>
                <Select value={selectedScope?.id} onValueChange={setScopeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="スコープを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {(currentPdf?.scopes ?? []).map((scope) => (
                      <SelectItem key={scope.id} value={scope.id}>
                        {scope.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col items-start gap-2 md:items-end">
                <Button asChild>
                  <a href={viewerLink} target="_blank" rel="noreferrer noopener">
                    PDFを開く
                    <ExternalLinkIcon className="size-4" />
                  </a>
                </Button>
                {currentPdf?.note && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{currentPdf.note}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
              <Card className="py-0">
                <CardHeader className="px-4 pt-4 pb-2">
                  <CardTitle className="text-base">問題リスト</CardTitle>
                  <CardDescription>
                    {isDataLoading
                      ? '読み込み中...'
                      : `${scopedQuestions.length}問${answers ? ` / 解答: ${answers.exam}` : ''}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2 pb-2">
                  <div className="max-h-[60vh] space-y-1 overflow-auto">
                    {scopedQuestions.map((question, index) => {
                      const questionNo = parseQuestionNumber(question, index + 1);
                      const answer = answerMap.get(questionNo) ?? '-';
                      const active = focusedQuestionId === question.id;
                      return (
                        <button
                          key={question.id}
                          type="button"
                          onClick={() => setFocusedQuestionId(question.id)}
                          className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                            active
                              ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                              : 'border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span>{question.source.label}</span>
                          <Badge variant={active ? 'secondary' : 'outline'}>解答: {answer}</Badge>
                        </button>
                      );
                    })}
                    {scopedQuestions.length === 0 && !isDataLoading && (
                      <p className="px-2 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                        このPDFには表示できる問題データがありません。
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">問題 / 解答</CardTitle>
                  <CardDescription>選択中の問題の参照情報</CardDescription>
                </CardHeader>
                <CardContent>
                  {focusedQuestion ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge>{focusedQuestion.source.label}</Badge>
                        <Badge variant="outline">ページ {focusedQuestion.source.page}</Badge>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {focusedQuestion.stem || '問題文はPDF本体を参照してください。'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(focusedQuestion.choices.length > 0
                          ? focusedQuestion.choices
                          : ['ア', 'イ', 'ウ', 'エ']
                        ).map((choice) => (
                          <Badge key={choice} variant="secondary">
                            {choice}
                          </Badge>
                        ))}
                      </div>
                      <div className="rounded-md border border-dashed border-slate-300 p-3 text-sm dark:border-slate-700">
                        解答: {
                          answerMap.get(
                            parseQuestionNumber(
                              focusedQuestion,
                              scopedQuestions.findIndex((question) => question.id === focusedQuestion.id) + 1
                            )
                          ) ?? '-'
                        }
                      </div>
                      <Button asChild variant="outline">
                        <a
                          href={`/tools/pdf-viewer/viewer?file=${encodeURIComponent(currentPdf?.path ?? '')}&page=${focusedQuestion.source.page}`}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          このページを開く
                          <ExternalLinkIcon className="size-4" />
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">問題を選択してください。</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </main>
  );
}
