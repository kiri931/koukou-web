import { useEffect, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTypingGame } from '../hooks/useTypingGame';
import type { Difficulty, Mode, ProgrammingDifficulty, ProgrammingLanguage } from '../types';

const japaneseDiffOptions: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'easy' },
  { value: 'normal', label: 'normal' },
  { value: 'hard', label: 'hard' },
];

const programmingDiffOptions: { value: ProgrammingDifficulty; label: string }[] = [
  { value: 'beginner', label: '入門' },
  { value: 'intermediate', label: '基礎' },
  { value: 'advanced', label: '実践' },
];

const programmingLanguageOptions: { value: ProgrammingLanguage; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
];

const durationOptions = [30, 60, 120];

function renderQuestionText(text: string, isProgramming: boolean): ReactNode {
  if (!isProgramming) return text;
  return text.split('').map((char, i) => {
    const isSpecial = /[^a-zA-Z0-9 ]/.test(char);
    return (
      <span key={`${char}-${i}`} className={isSpecial ? 'font-bold text-amber-500' : undefined}>
        {char}
      </span>
    );
  });
}

export default function TypingGame() {
  const {
    gameState,
    mode,
    handleSetMode,
    difficulty,
    setDifficulty,
    programmingDifficulty,
    setProgrammingDifficulty,
    programmingLanguage,
    setProgrammingLanguage,
    timeLimit,
    setTimeLimit,
    timeLeft,
    currentProblem,
    userInput,
    stats,
    accuracy,
    startGame,
    handleKeyInput,
    backToHome,
  } = useTypingGame();
  const isProgramming = mode === 'programming';
  const currentDifficultyOptions = isProgramming ? programmingDiffOptions : japaneseDiffOptions;

  useEffect(() => {
    if (gameState !== 'playing') return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === ' ') {
        event.preventDefault();
        handleKeyInput(' ');
        return;
      }
      if (event.key.length !== 1) return;
      handleKeyInput(event.key);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [gameState, handleKeyInput]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 text-slate-900 dark:text-slate-100">
      <Card className="border-sky-200/80 bg-white/95 dark:border-sky-900/50 dark:bg-slate-900/70">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">タイピング練習</CardTitle>
            <Badge className="bg-sky-500 text-white hover:bg-sky-500">Typing</Badge>
          </div>
          <CardDescription>
            {isProgramming
              ? 'プログラミングで使う特殊文字をコードで練習するタイピングゲーム'
              : 'ひらがなのローマ字入力を練習するタイピングゲーム'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {gameState === 'home' && (
            <div className="space-y-8">
              <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">モード</h2>
                <Tabs value={mode} onValueChange={(value) => handleSetMode(value as Mode)}>
                  <TabsList className="grid h-auto w-full max-w-sm grid-cols-2">
                    <TabsTrigger value="japanese">日本語</TabsTrigger>
                    <TabsTrigger value="programming">プログラミング</TabsTrigger>
                  </TabsList>
                </Tabs>
              </section>

              <Separator />

              <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">難易度</h2>
                <RadioGroup
                  value={isProgramming ? programmingDifficulty : difficulty}
                  onValueChange={(value) => {
                    if (isProgramming) {
                      setProgrammingDifficulty(value as ProgrammingDifficulty);
                      return;
                    }
                    setDifficulty(value as Difficulty);
                  }}
                  className="grid gap-3 sm:grid-cols-3"
                >
                  {currentDifficultyOptions.map((option) => (
                    <label
                      key={option.value}
                      htmlFor={`difficulty-${option.value}`}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-sky-400 hover:bg-sky-50 dark:border-slate-800 dark:text-slate-200 dark:hover:border-sky-600 dark:hover:bg-slate-800"
                    >
                      <RadioGroupItem id={`difficulty-${option.value}`} value={option.value} />
                      <span className={isProgramming ? '' : 'uppercase'}>{option.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </section>

              <Separator />

              {isProgramming && (
                <>
                  <section className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">言語</h2>
                    <RadioGroup
                      value={programmingLanguage}
                      onValueChange={(value) => setProgrammingLanguage(value as ProgrammingLanguage)}
                      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
                    >
                      {programmingLanguageOptions.map((option) => (
                        <label
                          key={option.value}
                          htmlFor={`language-${option.value}`}
                          className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-sky-400 hover:bg-sky-50 dark:border-slate-800 dark:text-slate-200 dark:hover:border-sky-600 dark:hover:bg-slate-800"
                        >
                          <RadioGroupItem id={`language-${option.value}`} value={option.value} />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  </section>

                  <Separator />
                </>
              )}

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">時間</h2>
                  <Badge variant="secondary" className="font-mono text-base">
                    {timeLimit}s
                  </Badge>
                </div>
                <Slider
                  min={30}
                  max={120}
                  step={30}
                  value={[timeLimit]}
                  onValueChange={([value]) => setTimeLimit(value)}
                  className="max-w-xl"
                />
                <div className="flex gap-2">
                  {durationOptions.map((seconds) => (
                    <Button
                      key={seconds}
                      variant={timeLimit === seconds ? 'default' : 'outline'}
                      size="sm"
                      className={timeLimit === seconds ? 'bg-sky-600 text-white hover:bg-sky-700' : ''}
                      onClick={() => setTimeLimit(seconds)}
                    >
                      {seconds}s
                    </Button>
                  ))}
                </div>
              </section>

              <Button onClick={startGame} className="bg-sky-600 text-white hover:bg-sky-700">
                スタート
              </Button>
            </div>
          )}

          {gameState === 'playing' && currentProblem && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-sky-400 text-sky-600 dark:text-sky-300">
                  PLAYING
                </Badge>
                <div className="font-mono text-2xl font-bold tabular-nums text-sky-600 dark:text-sky-300">
                  {timeLeft}s
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardDescription>{isProgramming ? 'タイプしてください' : 'お題（かな）'}</CardDescription>
                  <CardTitle className="text-4xl font-mono leading-tight">
                    {renderQuestionText(currentProblem.question, isProgramming)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xl dark:border-slate-800 dark:bg-slate-950/50">
                    <span>{userInput}</span>
                    <span className="ml-1 inline-block h-5 w-0.5 animate-pulse bg-sky-500 align-middle" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {gameState === 'result' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">結果</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-800">
                  <p className="text-sm text-slate-500 dark:text-slate-400">完了問題数</p>
                  <p className="font-mono text-2xl font-bold">{stats.completedProblems}</p>
                </div>
                <div className="rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-800">
                  <p className="text-sm text-slate-500 dark:text-slate-400">正解文字数</p>
                  <p className="font-mono text-2xl font-bold">{stats.correctChars}</p>
                </div>
                <div className="rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-800">
                  <p className="text-sm text-slate-500 dark:text-slate-400">誤入力数</p>
                  <p className="font-mono text-2xl font-bold">{stats.wrongChars}</p>
                </div>
                <div className="rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-800">
                  <p className="text-sm text-slate-500 dark:text-slate-400">正解率</p>
                  <p className="font-mono text-2xl font-bold">{accuracy.toFixed(2)}%</p>
                </div>
              </div>

              <Button onClick={backToHome} className="bg-sky-600 text-white hover:bg-sky-700">
                ホームに戻る
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
