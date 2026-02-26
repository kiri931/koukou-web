import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import type { QuestionFormat, QuizQuestion } from '../types';

interface QuestionEditorProps {
  initialQuestion?: QuizQuestion;
  onSubmit: (question: QuizQuestion) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

interface QuestionDraft {
  format: QuestionFormat;
  stem: string;
  choices: string[];
  correctAnswer: string;
  points: number;
}

function createQuestionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `q_${crypto.randomUUID()}`;
  }

  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function emptyDraft(): QuestionDraft {
  return {
    format: 'choice',
    stem: '',
    choices: ['', '', '', ''],
    correctAnswer: '',
    points: 1,
  };
}

const CHOICE_TEMPLATES: Array<{ label: string; values: string[] }> = [
  { label: '1,2,3,4', values: ['1', '2', '3', '4'] },
  { label: 'ア,イ,ウ,エ', values: ['ア', 'イ', 'ウ', 'エ'] },
];

function toDraft(question?: QuizQuestion): QuestionDraft {
  if (!question) {
    return emptyDraft();
  }

  return {
    format: question.format,
    stem: question.stem,
    choices:
      question.format === 'choice'
        ? [...(question.choices ?? ['', '', '', '']), '', '', '', ''].slice(0, 4)
        : ['', '', '', ''],
    correctAnswer: question.correctAnswer,
    points: question.points || 1,
  };
}

const textareaClassName =
  'border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-24 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-[3px]';

export function QuestionEditor({ initialQuestion, onSubmit, onCancel, submitLabel }: QuestionEditorProps) {
  const [draft, setDraft] = useState<QuestionDraft>(() => toDraft(initialQuestion));

  useEffect(() => {
    setDraft(toDraft(initialQuestion));
  }, [initialQuestion]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedChoices =
      draft.format === 'choice' ? draft.choices.map((choice) => choice.trim()).filter(Boolean).slice(0, 4) : undefined;

    const question: QuizQuestion = {
      id: initialQuestion?.id ?? createQuestionId(),
      format: draft.format,
      stem: draft.stem.trim(),
      choices: draft.format === 'choice' ? [...draft.choices] : undefined,
      correctAnswer: draft.correctAnswer.trim(),
      points: Math.max(1, Number.isFinite(draft.points) ? draft.points : 1),
    };

    if (!question.stem || !question.correctAnswer) {
      return;
    }

    if (question.format === 'choice' && (normalizedChoices?.length ?? 0) < 4) {
      return;
    }

    onSubmit(question);

    if (!initialQuestion) {
      setDraft(emptyDraft());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>形式</Label>
          <Select
            value={draft.format}
            onValueChange={(value) => setDraft((prev) => ({ ...prev, format: value as QuestionFormat }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="形式を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="choice">4択</SelectItem>
              <SelectItem value="text">記述式</SelectItem>
              <SelectItem value="number">数値</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>配点</Label>
          <Input
            type="number"
            min={1}
            value={draft.points}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                points: Number.parseInt(event.target.value || '1', 10) || 1,
              }))
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>問題文</Label>
        <textarea
          className={textareaClassName}
          value={draft.stem}
          onChange={(event) => setDraft((prev) => ({ ...prev, stem: event.target.value }))}
          placeholder="問題文を入力"
        />
      </div>

      {draft.format === 'choice' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label>選択肢（4つ）</Label>
            <div className="flex flex-wrap gap-2">
              {CHOICE_TEMPLATES.map((template) => (
                <Button
                  key={template.label}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setDraft((prev) => ({ ...prev, choices: [...template.values] }))}
                >
                  {template.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {draft.choices.map((choice, index) => (
              <Input
                key={index}
                value={choice}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    choices: prev.choices.map((row, rowIndex) => (rowIndex === index ? event.target.value : row)),
                  }))
                }
                placeholder={`選択肢 ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>正解</Label>
        <Input
          type={draft.format === 'number' ? 'number' : 'text'}
          value={draft.correctAnswer}
          onChange={(event) => setDraft((prev) => ({ ...prev, correctAnswer: event.target.value }))}
          placeholder={draft.format === 'choice' ? '例: ア / 1 / Tokyo' : '正解を入力'}
        />
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
        )}
        <Button type="submit">{submitLabel ?? (initialQuestion ? '更新' : '追加')}</Button>
      </div>
    </form>
  );
}
