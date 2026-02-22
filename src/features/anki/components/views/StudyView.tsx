import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { DatasetSummary, Grade, StudySessionState } from '../../types';

type Props = {
  datasets: DatasetSummary[];
  selectedDatasetId: string | null;
  onSelectDataset: (datasetId: string) => void;
  session: StudySessionState;
  onStartSession: (datasetId: string) => Promise<void> | void;
  onSubmitAnswer: (text: string) => Promise<void> | void;
  onSubmitGrade: (grade: Grade) => Promise<void> | void;
  onResetSession: () => void;
};

const gradeButtons: Array<{ grade: Grade; label: string; keyHint: string; className: string }> = [
  { grade: 2, label: 'Hard', keyHint: '2', className: 'bg-amber-600 text-white hover:bg-amber-700' },
  { grade: 3, label: 'Good', keyHint: '3', className: 'bg-green-600 text-white hover:bg-green-700' },
  { grade: 4, label: 'Easy', keyHint: '4', className: 'bg-sky-600 text-white hover:bg-sky-700' },
];

function ProgressBar({ session }: { session: StudySessionState }) {
  const percent = session.total > 0 ? (session.index / session.total) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>進捗</span>
        <span className="font-mono">{session.index} / {session.total}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-green-500 transition-all"
          style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
        />
      </div>
    </div>
  );
}

function Kbd({ children }: { children: string }) {
  return <kbd className="rounded border px-1.5 py-0.5 font-mono text-xs">{children}</kbd>;
}

export default function StudyView(props: Props) {
  const {
    datasets,
    selectedDatasetId,
    onSelectDataset,
    session,
    onStartSession,
    onSubmitAnswer,
    onSubmitGrade,
    onResetSession,
  } = props;
  const [answerText, setAnswerText] = useState('');

  const currentDataset = datasets.find((d) => d.datasetId === (session.datasetId ?? selectedDatasetId));
  const accuracy = useMemo(() => {
    const total = session.correctCount + session.incorrectCount;
    if (total === 0) return null;
    return (session.correctCount / total) * 100;
  }, [session.correctCount, session.incorrectCount]);

  useEffect(() => {
    if (session.status !== 'reviewing') return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === '1') {
        if (!session.isCorrect) {
          event.preventDefault();
          void onSubmitGrade(1);
        }
        return;
      }
      if (event.key === '2' || event.key === '3' || event.key === '4') {
        event.preventDefault();
        void onSubmitGrade(Number(event.key) as Grade);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [session.status, session.isCorrect, onSubmitGrade]);

  const handleSubmit = async () => {
    const text = answerText;
    await onSubmitAnswer(text);
    setAnswerText('');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>学習</CardTitle>
          <CardDescription>短答入力してから自己採点し、FSRSで次回出題間隔を更新します。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {datasets.map((dataset) => (
              <Button
                key={dataset.datasetId}
                variant={(session.datasetId ?? selectedDatasetId) === dataset.datasetId ? 'default' : 'outline'}
                className={(session.datasetId ?? selectedDatasetId) === dataset.datasetId ? 'bg-green-600 text-white hover:bg-green-700' : ''}
                onClick={() => onSelectDataset(dataset.datasetId)}
                disabled={session.status === 'loading'}
              >
                {dataset.title}
              </Button>
            ))}
            {selectedDatasetId && session.status !== 'question' && session.status !== 'reviewing' && (
              <Button onClick={() => onStartSession(selectedDatasetId)} className="bg-green-600 text-white hover:bg-green-700">
                セッション開始
              </Button>
            )}
            {session.status !== 'idle' && (
              <Button variant="outline" onClick={onResetSession}>リセット</Button>
            )}
          </div>
          {session.error && <p className="text-sm text-red-500">{session.error}</p>}
        </CardContent>
      </Card>

      {session.status === 'idle' && (
        <Card>
          <CardContent className="pt-6 text-sm text-slate-600 dark:text-slate-300">
            {datasets.length === 0 ? 'データセットがありません。データ管理タブで JSON をインポートしてください。' : 'データセットを選択して「セッション開始」を押してください。'}
          </CardContent>
        </Card>
      )}

      {session.status === 'loading' && (
        <Card>
          <CardContent className="pt-6">読み込み中...</CardContent>
        </Card>
      )}

      {session.status === 'question' && session.current && (
        <Card>
          <CardHeader className="space-y-3">
            <ProgressBar session={session} />
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>{currentDataset?.title ?? '学習中'}</CardTitle>
                <CardDescription>
                  {session.index + 1} / {session.total}
                </CardDescription>
              </div>
              <Badge variant="outline">QUESTION</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {session.current.card.topic && <Badge variant="secondary">{session.current.card.topic}</Badge>}
            <div className="rounded-lg border p-4">
              <p className="whitespace-pre-wrap text-lg leading-relaxed">{session.current.card.question}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="anki-answer">回答</Label>
              <Input
                id="anki-answer"
                value={answerText}
                onChange={(event) => setAnswerText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleSubmit();
                  }
                }}
                placeholder="短答を入力"
                autoComplete="off"
              />
            </div>
            <Button onClick={handleSubmit} disabled={!answerText.trim()} className="bg-green-600 text-white hover:bg-green-700">
              送信
            </Button>
          </CardContent>
        </Card>
      )}

      {session.status === 'reviewing' && session.current && (
        <Card>
          <CardHeader className="space-y-3">
            <ProgressBar session={session} />
            <div className="flex items-center justify-between gap-3">
              <CardTitle>採点</CardTitle>
              <Badge className={session.isCorrect ? 'bg-green-600 text-white' : 'bg-rose-600 text-white'}>
                {session.isCorrect ? '正解' : '不正解'}
              </Badge>
            </div>
            <CardDescription>数字キー 1/2/3/4 でも採点できます。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <p className="mb-1 text-sm text-slate-500">問題</p>
                <p className="whitespace-pre-wrap">{session.current.card.question}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="mb-1 text-sm text-slate-500">あなたの回答</p>
                <p className="whitespace-pre-wrap">{session.userAnswer || '（未入力）'}</p>
                <p className="mt-2 text-sm text-slate-500">正答例: {session.current.card.answers.join(' / ')}</p>
                {session.matchedAnswer && <p className="mt-1 text-sm text-green-600">一致: {session.matchedAnswer}</p>}
              </div>
            </div>
            {session.current.card.explanation && (
              <div className="rounded-lg border bg-slate-50 p-4 text-sm dark:bg-slate-900/40">
                <p className="mb-1 font-medium">解説</p>
                <p className="whitespace-pre-wrap">{session.current.card.explanation}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {!session.isCorrect && (
                <Button variant="outline" onClick={() => onSubmitGrade(1)}>
                  <span className="inline-flex items-center gap-2"><Kbd>1</Kbd> Unknown</span>
                </Button>
              )}
              {gradeButtons.map((item) => (
                <Button key={item.grade} className={item.className} onClick={() => onSubmitGrade(item.grade)}>
                  <span className="inline-flex items-center gap-2"><Kbd>{item.keyHint}</Kbd> {item.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {session.status === 'done' && (
        <Card>
          <CardHeader>
            <CardTitle>セッション完了</CardTitle>
            <CardDescription>{currentDataset?.title ?? '選択中データセット'} の期限切れカードを処理しました。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">今回の対象件数: {session.total} 件</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-slate-500">正解</p>
                <p className="font-mono text-xl font-bold text-green-600">{session.correctCount}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-slate-500">不正解</p>
                <p className="font-mono text-xl font-bold text-rose-600">{session.incorrectCount}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-slate-500">正答率</p>
                <p className="font-mono text-xl font-bold">{accuracy == null ? '-' : `${accuracy.toFixed(1)}%`}</p>
              </div>
            </div>
            {selectedDatasetId && (
              <Button onClick={() => onStartSession(selectedDatasetId)} className="bg-green-600 text-white hover:bg-green-700">
                もう一度開始
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
