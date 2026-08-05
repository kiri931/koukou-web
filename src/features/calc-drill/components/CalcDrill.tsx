import { useMemo, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import CalcKeypad from '@/features/scientific-calculator/components/CalcKeypad';
import { generateProblems } from '../data/problems';
import { useCalcDrill } from '../hooks/useCalcDrill';
import type { DrillCategory, DrillLevelFilter } from '../types';
import DrillDisplay from './DrillDisplay';

const LEVEL_FILTERS: DrillLevelFilter[] = ['両方', '4級', '3級'];
const CATEGORY_FILTERS: (DrillCategory | 'すべて')[] = [
  'すべて',
  '四則計算',
  '集計計算',
  '関数計算',
  '実務計算',
];

export default function CalcDrill() {
  const [levelFilter, setLevelFilter] = useState<DrillLevelFilter>('両方');
  const [categoryFilter, setCategoryFilter] = useState<DrillCategory | 'すべて'>('すべて');
  const [listOpen, setListOpen] = useState(false);
  // 開くたびに違う種にする。過去問をそのまま出すのではなく、同じ形の問題を作っている
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 2 ** 31));
  const displayRef = useRef<HTMLDivElement>(null);

  const allProblems = useMemo(() => generateProblems(seed), [seed]);

  const filteredProblems = useMemo(
    () =>
      allProblems.filter(
        (problem) =>
          (levelFilter === '両方' || problem.level === levelFilter) &&
          (categoryFilter === 'すべて' || problem.category === categoryFilter)
      ),
    [allProblems, levelFilter, categoryFilter]
  );

  const {
    state,
    displayExpression,
    pressButton,
    currentProblem,
    problemIndex,
    totalProblems,
    stepIndex,
    totalSteps,
    isDone,
    requiredAction,
    wrongKeyHint,
    nextProblem,
    retryProblem,
    selectProblem,
  } = useCalcDrill(filteredProblems);

  return (
    <TooltipProvider delayDuration={500} skipDelayDuration={100}>
      <main className="mx-auto max-w-[30rem] px-4 py-4 text-slate-900 dark:text-slate-100">
        <p className="mb-3 text-base text-slate-600 dark:text-slate-300">
          光っているキーを順に押していきます。手順ごと覚えるための練習です。
          問題は検定と同じ形で毎回作り直されます。
        </p>

        <div className="mb-3 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-base text-slate-600 dark:text-slate-300">級</span>
            {LEVEL_FILTERS.map((filter) => (
              <Button
                key={filter}
                type="button"
                size="sm"
                variant={levelFilter === filter ? 'default' : 'outline'}
                onClick={() => setLevelFilter(filter)}
                aria-pressed={levelFilter === filter}
              >
                {filter}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-base text-slate-600 dark:text-slate-300">分野</span>
            {CATEGORY_FILTERS.map((filter) => (
              <Button
                key={filter}
                type="button"
                size="sm"
                variant={categoryFilter === filter ? 'default' : 'outline'}
                onClick={() => setCategoryFilter(filter)}
                aria-pressed={categoryFilter === filter}
              >
                {filter}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSeed(Math.floor(Math.random() * 2 ** 31))}
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              問題を作り直す
            </Button>
            <span className="text-base text-slate-600 dark:text-slate-300">
              {filteredProblems.length} 問
            </span>
          </div>
        </div>

        {currentProblem ? (
          <>
            <div ref={displayRef} className="scroll-mt-20">
            <DrillDisplay
              problem={currentProblem}
              problemNumber={problemIndex + 1}
              totalProblems={totalProblems}
              stepIndex={stepIndex}
              totalSteps={totalSteps}
              isDone={isDone}
              expression={displayExpression}
              result={state.result}
              hasError={state.hasError}
              angleMode={state.angleMode}
              shiftActive={state.shiftActive}
              requiredAction={requiredAction}
              wrongKeyHint={wrongKeyHint}
              onRetry={retryProblem}
              onNext={nextProblem}
            />
            </div>

            {/* ディスプレイのすぐ下。間を空けないのが目的なので mt は詰める */}
            <div className="mt-2">
              <CalcKeypad
                shiftActive={state.shiftActive}
                angleMode={state.angleMode}
                onPress={pressButton}
                highlightedAction={requiredAction ?? undefined}
              />
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => setListOpen((prev) => !prev)}
                aria-expanded={listOpen}
                className="rounded text-base font-semibold text-slate-700 underline underline-offset-2 dark:text-slate-200"
              >
                問題一覧（{filteredProblems.length}問）を{listOpen ? 'たたむ' : 'ひらく'}
              </button>
              {listOpen && (
                <div className="mt-2 max-h-80 overflow-auto rounded-md border border-slate-300 dark:border-slate-800">
                  <table className="w-full text-base">
                    <thead className="sticky top-0 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">#</th>
                        <th className="px-3 py-2 text-left font-medium">級</th>
                        <th className="px-3 py-2 text-left font-medium">分野</th>
                        <th className="px-3 py-2 text-left font-medium">問題</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProblems.map((problem, index) => (
                        <tr
                          key={problem.id}
                          className={
                            index === problemIndex
                              ? 'bg-amber-100 dark:bg-amber-900/30'
                              : 'border-t border-slate-200 dark:border-slate-800'
                          }
                        >
                          <td className="px-3 py-2 align-top tabular-nums">{index + 1}</td>
                          <td className="px-3 py-2 align-top">{problem.level}</td>
                          <td className="px-3 py-2 align-top">{problem.category}</td>
                          <td className="px-3 py-2 align-top">
                            <button
                              type="button"
                              onClick={() => {
                                selectProblem(index);
                                setListOpen(false);
                                // 一覧はキーパッドの下にあるので、選んだら表示に戻す
                                displayRef.current?.scrollIntoView({ block: 'start' });
                              }}
                              className="text-left underline underline-offset-2"
                            >
                              {problem.question}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="rounded-lg border border-slate-300 bg-slate-50 p-4 text-base text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            この条件に当てはまる問題がありません。級か分野の絞り込みを変えてください。
          </p>
        )}
      </main>
    </TooltipProvider>
  );
}
