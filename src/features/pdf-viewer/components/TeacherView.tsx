import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { QuizQuestion } from '../types';
import type { QuizStore } from '../hooks/useQuizStore';
import { PDF_QUIZ_PRESETS } from '../presets';
import { QuestionEditor } from './QuestionEditor';

interface TeacherViewProps {
  store: QuizStore;
}

export function TeacherView({ store }: TeacherViewProps) {
  const { quiz, updateQuiz, addQuestion, updateQuestion, deleteQuestion, exportJson, resetQuiz } = store;
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [showNewEditor, setShowNewEditor] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');

  const questionCount = quiz?.questions.length ?? 0;
  const totalPoints = useMemo(
    () => (quiz?.questions ?? []).reduce((sum, question) => sum + question.points, 0),
    [quiz?.questions]
  );

  const handleAddQuestion = (question: QuizQuestion) => {
    addQuestion(question);
    setShowNewEditor(false);
  };

  const applyPreset = (presetId: string) => {
    const preset = PDF_QUIZ_PRESETS.find((row) => row.id === presetId);
    if (!preset) {
      return;
    }

    updateQuiz({
      pdfUrl: preset.pdfUrl,
      title: quiz?.title.trim() ? quiz.title : preset.suggestedTitle,
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">教師モード</CardTitle>
          <CardDescription>PDF URL と問題を作成し、JSON として生徒に共有します。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>情報系検定PDFプリセット</Label>
            <div className="flex flex-wrap gap-2">
              <select
                className="border-input bg-background h-9 min-w-[18rem] rounded-md border px-3 text-sm"
                value={selectedPresetId}
                onChange={(event) => setSelectedPresetId(event.target.value)}
              >
                <option value="">プリセットを選択</option>
                {PDF_QUIZ_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    [{preset.category}] {preset.label}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                disabled={!selectedPresetId}
                onClick={() => applyPreset(selectedPresetId)}
              >
                URLを反映
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {PDF_QUIZ_PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-auto border px-2 py-1 text-xs"
                  onClick={() => applyPreset(preset.id)}
                  title={preset.pdfUrl}
                >
                  {preset.category}: {preset.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              iframeで表示できないPDFでも、生徒モードでは「別タブで開く」リンクを表示します。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quiz-title">クイズタイトル</Label>
              <Input
                id="quiz-title"
                value={quiz?.title ?? ''}
                onChange={(event) => updateQuiz({ title: event.target.value })}
                placeholder="例: 情報I 小テスト 第1回"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quiz-pdf-url">PDF URL</Label>
              <Input
                id="quiz-pdf-url"
                type="url"
                value={quiz?.pdfUrl ?? ''}
                onChange={(event) => updateQuiz({ pdfUrl: event.target.value })}
                placeholder="https://example.com/sample.pdf"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
            <p className="text-muted-foreground">
              問題数 {questionCount} / 合計配点 {totalPoints} / 下書きは自動保存されます（localStorage）
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={resetQuiz}>
                新規クイズ
              </Button>
              <Button
                type="button"
                onClick={exportJson}
                disabled={!quiz || !quiz.pdfUrl.trim() || !quiz.title.trim() || questionCount === 0}
              >
                JSONエクスポート
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">問題管理</CardTitle>
          <CardDescription>4択・記述式・数値入力の問題を追加/編集できます。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(quiz?.questions ?? []).length === 0 && (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              まだ問題がありません。「問題を追加」から作成してください。
            </p>
          )}

          <div className="space-y-3">
            {(quiz?.questions ?? []).map((question, index) => {
              const isEditing = editingQuestionId === question.id;
              return (
                <div key={question.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">Q{index + 1}</p>
                      <p className="mt-1 text-sm">{question.stem}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        形式: {question.format} / 配点: {question.points}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingQuestionId(isEditing ? null : question.id)}
                      >
                        {isEditing ? '閉じる' : '編集'}
                      </Button>
                      <Button type="button" size="sm" variant="destructive" onClick={() => deleteQuestion(question.id)}>
                        削除
                      </Button>
                    </div>
                  </div>

                  {question.format === 'choice' && question.choices && (
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {question.choices.map((choice, choiceIndex) => (
                        <div key={choiceIndex} className="rounded border px-2 py-1 text-xs text-muted-foreground">
                          {choiceIndex + 1}. {choice}
                        </div>
                      ))}
                    </div>
                  )}

                  {isEditing && (
                    <div className="mt-4">
                      <QuestionEditor
                        initialQuestion={question}
                        submitLabel="問題を更新"
                        onSubmit={(nextQuestion) => {
                          updateQuestion(question.id, nextQuestion);
                          setEditingQuestionId(null);
                        }}
                        onCancel={() => setEditingQuestionId(null)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-3 rounded-lg border border-dashed p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">新しい問題を追加</p>
              {!showNewEditor && (
                <Button type="button" size="sm" onClick={() => setShowNewEditor(true)}>
                  問題を追加
                </Button>
              )}
            </div>
            {showNewEditor && (
              <QuestionEditor
                submitLabel="問題を追加"
                onSubmit={handleAddQuestion}
                onCancel={() => setShowNewEditor(false)}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
