import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';
import CalcDisplay from '@/features/scientific-calculator/components/CalcDisplay';
import CalcKeypad from '@/features/scientific-calculator/components/CalcKeypad';
import { DRILL_PROBLEMS } from '../data/problems';
import { useCalcDrill } from '../hooks/useCalcDrill';
import type { DrillLevelFilter } from '../types';
import DrillProblemCard from './DrillProblemCard';

const LEVEL_FILTERS: DrillLevelFilter[] = ['両方', '4級', '3級'];

export default function CalcDrill() {
  const [levelFilter, setLevelFilter] = useState<DrillLevelFilter>('両方');

  const filteredProblems = useMemo(() => {
    if (levelFilter === '両方') return DRILL_PROBLEMS;
    return DRILL_PROBLEMS.filter((problem) => problem.level === levelFilter);
  }, [levelFilter]);

  const {
    state,
    displayExpression,
    parenBalance,
    pressButton,
    currentProblem,
    problemIndex,
    totalProblems,
    stepIndex,
    isDone,
    highlightedAction,
    nextProblem,
    retryProblem,
    selectProblem,
  } = useCalcDrill(filteredProblems);

  return (
    <TooltipProvider delayDuration={500} skipDelayDuration={100}>
      <main className="mx-auto max-w-5xl px-4 py-8 text-slate-900 dark:text-slate-100">
        <Card className="border-amber-200/80 bg-white/95 dark:border-amber-900/40 dark:bg-slate-900/70">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">計算技術検定ドリル</CardTitle>
                <CardDescription>次に押すキーを追いながら、3級・4級の計算手順を練習します。</CardDescription>
              </div>
              <Badge className="bg-amber-600 text-white hover:bg-amber-600">STUDY</Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              {LEVEL_FILTERS.map((filter) => (
                <Button
                  key={filter}
                  type="button"
                  variant={levelFilter === filter ? 'default' : 'outline'}
                  onClick={() => setLevelFilter(filter)}
                >
                  {filter}
                </Button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {currentProblem ? (
              <>
                <DrillProblemCard
                  problem={currentProblem}
                  problemNumber={problemIndex + 1}
                  totalProblems={totalProblems}
                  stepIndex={stepIndex}
                  isDone={isDone}
                  onRetry={retryProblem}
                  onNext={nextProblem}
                />
                <CalcDisplay
                  expression={displayExpression}
                  ghostExpression={currentProblem.ghostExpression}
                  result={state.result}
                  angleMode={state.angleMode}
                  shiftActive={state.shiftActive}
                  memory={state.memory}
                  parenBalance={parenBalance}
                  hasError={state.hasError}
                />
                <CalcKeypad
                  shiftActive={state.shiftActive}
                  angleMode={state.angleMode}
                  onPress={pressButton}
                  highlightedAction={highlightedAction ?? undefined}
                />
                <Card className="border-slate-200 bg-white/95 dark:border-slate-700 dark:bg-slate-900/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">問題一覧（{filteredProblems.length}件）</CardTitle>
                    <CardDescription>現在の級フィルタに一致する問題を表示しています。</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-72 overflow-auto rounded-md border border-slate-200 dark:border-slate-700">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium">#</th>
                            <th className="px-3 py-2 text-left font-medium">ID</th>
                            <th className="px-3 py-2 text-left font-medium">級</th>
                            <th className="px-3 py-2 text-left font-medium">カテゴリ</th>
                            <th className="px-3 py-2 text-left font-medium">問題</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProblems.map((problem, index) => (
                            <tr
                              key={problem.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => selectProblem(index)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  selectProblem(index);
                                }
                              }}
                              className={
                                index === problemIndex
                                  ? 'cursor-pointer bg-amber-50 dark:bg-amber-900/20'
                                  : 'cursor-pointer border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40'
                              }
                            >
                              <td className="px-3 py-2 align-top tabular-nums">{index + 1}</td>
                              <td className="px-3 py-2 align-top font-mono text-xs">{problem.id}</td>
                              <td className="px-3 py-2 align-top">{problem.level}</td>
                              <td className="px-3 py-2 align-top">{problem.category}</td>
                              <td className="px-3 py-2 align-top">{problem.question}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
                問題データが見つかりません。
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </TooltipProvider>
  );
}
