import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DrillProblem } from '../types';

interface DrillProblemCardProps {
  problem: DrillProblem;
  problemNumber: number;
  totalProblems: number;
  stepIndex: number;
  isDone: boolean;
  onRetry: () => void;
  onNext: () => void;
}

export default function DrillProblemCard({
  problem,
  problemNumber,
  totalProblems,
  stepIndex,
  isDone,
  onRetry,
  onNext,
}: DrillProblemCardProps) {
  const totalSteps = problem.keySequence.length;
  const currentSteps = Math.min(stepIndex, totalSteps);
  const progressPercent = totalSteps > 0 ? Math.round((currentSteps / totalSteps) * 100) : 0;

  return (
    <Card className="border-amber-200/80 bg-white/95 dark:border-amber-900/30 dark:bg-slate-900/70">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg sm:text-xl">問題 {problemNumber} / {totalProblems}</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-indigo-600 text-white hover:bg-indigo-600">{problem.level}</Badge>
            <Badge variant="secondary">{problem.category}</Badge>
          </div>
        </div>
        <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{problem.question}</p>
        {problem.exam_ref ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">出典: {problem.exam_ref}</p>
        ) : null}
        {problem.note ? (
          <div>
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-500/20 dark:text-amber-300">
              注意: {problem.note}
            </Badge>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>入力進捗</span>
            <span>{currentSteps} / {totalSteps}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-amber-500 transition-all"
              style={{ width: `${progressPercent}%` }}
              aria-hidden="true"
            />
          </div>
        </div>

        {isDone ? (
          <div className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
            <p className="font-semibold">正解!</p>
            <p>答え: {problem.expectedAnswer}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-400">ハイライトされたキーだけが入力できます。</p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onRetry}>
            もう一度
          </Button>
          {isDone && (
            <Button type="button" onClick={onNext}>
              次の問題
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
