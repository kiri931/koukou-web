import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTimer } from '../hooks/useTimer';

const EVAL_COPIES_KEY = 'presentation.evalCopies';
const CHECK_ITEMS_KEY = 'presentation.checkedItems';
const CHECK_ITEMS = [
  '最初の30秒でテーマと目的を明確に伝える',
  '1スライド1メッセージを守る',
  '文字サイズ・配色に十分な可読性がある',
  'データ・引用元を明示している',
  '時間配分を守り、結論で締める',
  '質疑応答を想定した補足資料を準備している',
];

const SLIDE_RUBRIC = [
  { criterion: '構成', levels: ['論理的で流れが明快', '概ね理解しやすい', '流れに飛躍がある', '構成が不明瞭'] },
  { criterion: 'デザイン', levels: ['統一感・可読性が高い', '大きな問題はない', '見づらい箇所がある', '可読性が低い'] },
  { criterion: '情報の正確性', levels: ['根拠が明確で正確', '概ね正確', '一部根拠が弱い', '誤り・根拠不足が多い'] },
  { criterion: '視覚資料活用', levels: ['図表が効果的', '適切に使用', '効果が限定的', 'ほぼ活用できていない'] },
  { criterion: 'メッセージ性', levels: ['要点が明確で印象的', '要点は伝わる', '要点が散漫', '主張が不明瞭'] },
];

const SPEECH_RUBRIC = [
  { criterion: '話し方', levels: ['明瞭で聞き取りやすい', '概ね聞き取りやすい', '聞き取りづらい場面あり', '聞き取りづらい'] },
  { criterion: '視線・姿勢', levels: ['聴衆をよく見ている', '時々視線を向ける', '視線が資料中心', 'ほぼ視線が合わない'] },
  { criterion: '時間管理', levels: ['時間内に適切に完結', '軽微な超過/不足', '時間調整が不十分', '時間配分が崩れている'] },
  { criterion: '説明力', levels: ['具体例が適切で理解しやすい', '概ね理解できる', '説明が抽象的', '説明不足で伝わらない'] },
  { criterion: '質疑応答', levels: ['的確に回答し発展させる', '概ね対応できる', '回答が曖昧', '回答困難'] },
];

const EVAL_FORM_ITEMS = [...SLIDE_RUBRIC, ...SPEECH_RUBRIC].map((row) => row.criterion);

function formatSeconds(sec: number) {
  const safe = Math.max(0, sec);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function RubricTable({ title, rows }: { title: string; rows: typeof SLIDE_RUBRIC }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-slate-200 bg-slate-100 px-3 py-2 text-left dark:border-slate-700 dark:bg-slate-800">評価基準（4点）</th>
              <th className="border border-slate-200 bg-slate-100 px-3 py-2 text-left dark:border-slate-700 dark:bg-slate-800">4</th>
              <th className="border border-slate-200 bg-slate-100 px-3 py-2 text-left dark:border-slate-700 dark:bg-slate-800">3</th>
              <th className="border border-slate-200 bg-slate-100 px-3 py-2 text-left dark:border-slate-700 dark:bg-slate-800">2</th>
              <th className="border border-slate-200 bg-slate-100 px-3 py-2 text-left dark:border-slate-700 dark:bg-slate-800">1</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.criterion}>
                <td className="border border-slate-200 px-3 py-2 font-medium dark:border-slate-700">{row.criterion}</td>
                {row.levels.map((level) => (
                  <td key={level} className="border border-slate-200 px-3 py-2 dark:border-slate-700">{level}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">各基準4点満点 / 合計20点</p>
    </section>
  );
}

export default function PresentationGuide() {
  const {
    timerMode,
    baseSeconds,
    running,
    displaySeconds,
    timerDone,
    setMode,
    setCountdownSeconds,
    start,
    stop,
    reset,
  } = useTimer();

  const [evalCopies, setEvalCopies] = useState(20);
  const [checkedItems, setCheckedItems] = useState<boolean[]>(new Array(6).fill(false));
  const [isPrintEvalMode, setIsPrintEvalMode] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('5');
  const [isTimerMinimized, setIsTimerMinimized] = useState(false);
  const [evalScores, setEvalScores] = useState<Record<string, number>>(
    () => Object.fromEntries(EVAL_FORM_ITEMS.map((item) => [item, 0])) as Record<string, number>
  );
  const prevTimerDoneRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = Number(window.localStorage.getItem(EVAL_COPIES_KEY));
    if (Number.isFinite(saved) && saved > 0) {
      setEvalCopies(Math.min(100, Math.floor(saved)));
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(CHECK_ITEMS_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === CHECK_ITEMS.length) {
        setCheckedItems(parsed.map((v) => Boolean(v)));
      }
    } catch {
      // ignore broken localStorage values
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(EVAL_COPIES_KEY, String(evalCopies));
  }, [evalCopies]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CHECK_ITEMS_KEY, JSON.stringify(checkedItems));
  }, [checkedItems]);

  useEffect(() => {
    const onAfterPrint = () => setIsPrintEvalMode(false);
    window.addEventListener('afterprint', onAfterPrint);
    return () => window.removeEventListener('afterprint', onAfterPrint);
  }, []);

  useEffect(() => {
    if (timerMode !== 'countdown') return;
    setCustomMinutes(String(Math.max(1, Math.floor(baseSeconds / 60))));
  }, [baseSeconds, timerMode]);

  useEffect(() => {
    if (!timerDone || prevTimerDoneRef.current) {
      prevTimerDoneRef.current = timerDone;
      return;
    }

    prevTimerDoneRef.current = true;

    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.45);
      void oscillator.onended;
    } catch {
      // Audio may be blocked by browser policy/device settings.
    }
  }, [timerDone, timerMode]);

  const completedCheckCount = checkedItems.filter(Boolean).length;
  const isCountdownWarning = timerMode === 'countdown' && displaySeconds > 0 && displaySeconds <= 30;
  const countdownProgressPercent =
    timerMode === 'countdown' && baseSeconds > 0
      ? Math.max(0, Math.min(100, (displaySeconds / baseSeconds) * 100))
      : 0;

  const evalCopiesView = useMemo(() => Array.from({ length: evalCopies }), [evalCopies]);

  const handleEvalPrint = () => {
    setIsPrintEvalMode(true);
    setTimeout(() => window.print(), 50);
  };

  const presets = [180, 300, 420, 600];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 text-slate-900 dark:text-slate-100">
      <div className={isPrintEvalMode ? 'print:hidden' : ''}>
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm print:hidden dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">プレゼンテーションガイド</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">授業用の進行タイマー、作成チェック、評価ルーブリックを1ページで扱えます。</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="eval-copies" className="text-sm text-slate-700 dark:text-slate-300">評価シート枚数</label>
              <Input
                id="eval-copies"
                type="number"
                min={1}
                max={100}
                className="w-24"
                value={evalCopies}
                onChange={(e) => setEvalCopies(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
              />
              <Button variant="outline" onClick={() => window.print()}>全体印刷</Button>
              <Button className="bg-amber-600 text-white hover:bg-amber-500" onClick={handleEvalPrint}>評価シート印刷</Button>
            </div>
          </div>
        </section>

        <section
          id="timer"
          className={`sticky top-20 z-10 mb-6 rounded-xl border border-slate-200 bg-white shadow-sm print:static md:top-24 dark:border-slate-800 dark:bg-slate-900/95 ${
            isTimerMinimized ? 'p-3' : 'p-5'
          }`}
        >
          {isTimerMinimized ? (
            <div className="-mx-1 overflow-x-auto px-1">
              <div className="flex min-w-max items-center gap-2 whitespace-nowrap sm:gap-3">
                <h2 className="shrink-0 pr-1 text-sm font-semibold text-slate-700 dark:text-slate-200 sm:text-base">タイマー</h2>
                <span className="h-5 w-px shrink-0 bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
                <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{timerMode === 'countdown' ? 'CD' : 'SW'}</span>
              <p
                className={`shrink-0 px-1 font-mono text-xl font-bold tracking-wider sm:text-2xl ${
                  isCountdownWarning ? 'text-red-600 dark:text-red-400' : ''
                }`}
              >
                {formatSeconds(displaySeconds)}
              </p>
              {!running ? (
                <Button size="sm" className="h-8 shrink-0 bg-amber-600 px-3 text-white hover:bg-amber-500" onClick={start}>開始</Button>
              ) : (
                <Button size="sm" variant="outline" className="h-8 shrink-0 px-3" onClick={stop}>停止</Button>
              )}
                <span className="h-5 w-px shrink-0 bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
                <Button size="sm" variant="outline" className="h-8 shrink-0 px-3" onClick={reset}>リセット</Button>
                <Button size="sm" variant="outline" className="h-8 shrink-0 px-3" onClick={() => setIsTimerMinimized(false)}>展開</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">タイマー</h2>
                <Button variant="outline" size="sm" onClick={() => setIsTimerMinimized(true)}>
                  最小化
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={timerMode === 'countdown' ? 'default' : 'outline'}
                  className={timerMode === 'countdown' ? 'bg-amber-600 text-white hover:bg-amber-500' : ''}
                  onClick={() => setMode('countdown')}
                >
                  カウントダウン
                </Button>
                <Button
                  variant={timerMode === 'stopwatch' ? 'default' : 'outline'}
                  className={timerMode === 'stopwatch' ? 'bg-amber-600 text-white hover:bg-amber-500' : ''}
                  onClick={() => setMode('stopwatch')}
                >
                  ストップウォッチ
                </Button>
              </div>

              {timerMode === 'countdown' && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {presets.map((sec) => (
                    <Button
                      key={sec}
                      variant="outline"
                      size="sm"
                      className={baseSeconds === sec ? 'border-amber-500 text-amber-700 dark:text-amber-300' : ''}
                      onClick={() => setCountdownSeconds(sec)}
                    >
                      {Math.floor(sec / 60)}分
                    </Button>
                  ))}
                  <div className="ml-2 flex items-center gap-2">
                    <label htmlFor="custom-minutes" className="text-sm text-slate-600 dark:text-slate-300">カスタム</label>
                    <Input
                      id="custom-minutes"
                      type="number"
                      min={1}
                      max={360}
                      className="h-8 w-20"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const minutes = Math.max(1, Math.min(360, Number(customMinutes) || 1));
                        setCountdownSeconds(minutes * 60);
                        setCustomMinutes(String(minutes));
                      }}
                    >
                      設定
                    </Button>
                    <span className="text-sm text-slate-500 dark:text-slate-400">現在: {Math.floor(baseSeconds / 60)}分</span>
                  </div>
                </div>
              )}
            </>
          )}

          {!isTimerMinimized && (
            <>
              <div className="mt-4 text-center">
                <p
                  className={`font-mono text-5xl font-bold tracking-wider ${
                    isCountdownWarning ? 'text-red-600 dark:text-red-400' : ''
                  }`}
                >
                  {formatSeconds(displaySeconds)}
                </p>
                {timerMode === 'countdown' && (
                  <div className="mx-auto mt-3 h-2 w-full max-w-xl overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isCountdownWarning ? 'bg-red-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${countdownProgressPercent}%` }}
                    />
                  </div>
                )}
                {timerDone && <p className="mt-2 text-sm font-semibold text-amber-600 dark:text-amber-400">時間になりました（音で通知）</p>}
                {isCountdownWarning && !timerDone && (
                  <p className="mt-2 text-sm font-semibold text-red-600 dark:text-red-400">残り30秒です</p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {!running ? (
                  <Button className="bg-amber-600 text-white hover:bg-amber-500" onClick={start}>開始</Button>
                ) : (
                  <Button variant="outline" onClick={stop}>停止</Button>
                )}
                <Button variant="outline" onClick={reset}>リセット</Button>
              </div>
            </>
          )}
        </section>

        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="mb-3 text-xl font-semibold">基本原則</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge className="bg-amber-500/20 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300">結論先行</Badge>
            <Badge className="bg-amber-500/20 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300">根拠明示</Badge>
            <Badge className="bg-amber-500/20 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300">1スライド1メッセージ</Badge>
          </div>
          <ul className="list-disc space-y-1 pl-5 text-slate-700 dark:text-slate-300">
            <li>冒頭で「何を伝えるか」を明言する</li>
            <li>データや引用は出典を必ず示す</li>
            <li>文字量を減らし、口頭説明で補う</li>
            <li>聴衆が次に知りたいことを先回りする</li>
          </ul>
          <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
            注意: 読ませるスライドより、話して伝えるスライドを目指す。
          </div>
        </section>

        <section id="rule-102030" className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="mb-3 text-xl font-semibold">10/20/30ルール</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <p className="text-3xl font-bold text-amber-500">10</p>
              <p className="mt-1 font-medium">スライド枚数</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">要点に絞り、情報の密度を上げる。</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <p className="text-3xl font-bold text-amber-500">20</p>
              <p className="mt-1 font-medium">発表時間（分）</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">導入・本論・結論で配分を設計する。</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <p className="text-3xl font-bold text-amber-500">30</p>
              <p className="mt-1 font-medium">最小フォントサイズ</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">後方席でも読めるサイズを基準にする。</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Guy Kawasaki によるビジネス向けの目安です。高校の授業発表では 3〜7分・5〜8枚 が多いため、例えば 7分発表なら 7枚前後を目安に調整してください。
          </p>
        </section>

        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="mb-3 text-xl font-semibold">スライド作成ステップ</h2>
          <ol className="space-y-2">
            {[
              '目的と評価基準を確認する',
              '結論と主張を1文で固定する',
              '根拠データ・事例を収集する',
              '章立て（導入/本論/結論）を作る',
              '図表中心でスライド化する',
              '通し練習で時間を調整する',
            ].map((step, i) => (
              <li key={step} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-sm font-bold text-amber-700 dark:text-amber-300">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section id="checklist" className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="mb-3 text-xl font-semibold">発表チェックリスト</h2>
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">{completedCheckCount}/{CHECK_ITEMS.length} 完了</p>
          <div className="space-y-2">
            {CHECK_ITEMS.map((item, index) => (
              <label
                key={item}
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 transition-colors ${
                  checkedItems[index]
                    ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checkedItems[index]}
                  onChange={() =>
                    setCheckedItems((prev) => prev.map((v, i) => (i === index ? !v : v)))
                  }
                />
                <span className={checkedItems[index] ? 'text-slate-500 line-through dark:text-slate-400' : ''}>{item}</span>
              </label>
            ))}
          </div>
        </section>

        <div className="mb-6 space-y-6">
          <RubricTable title="評価ルーブリック①（スライド）" rows={SLIDE_RUBRIC} />
          <RubricTable title="評価ルーブリック②（発表）" rows={SPEECH_RUBRIC} />
        </div>

        <section id="evaluation-form" className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="mb-3 text-xl font-semibold">自己/相互評価フォーム</h2>
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">発表後に各観点を4段階でチェックし、コメントを1つ記入します。</p>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">採点の目安: 4=優秀 / 3=良好 / 2=改善要 / 1=不十分</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-slate-200 bg-slate-100 px-3 py-2 text-left dark:border-slate-700 dark:bg-slate-800">観点</th>
                  <th className="border border-slate-200 bg-slate-100 px-3 py-2 text-center dark:border-slate-700 dark:bg-slate-800">4</th>
                  <th className="border border-slate-200 bg-slate-100 px-3 py-2 text-center dark:border-slate-700 dark:bg-slate-800">3</th>
                  <th className="border border-slate-200 bg-slate-100 px-3 py-2 text-center dark:border-slate-700 dark:bg-slate-800">2</th>
                  <th className="border border-slate-200 bg-slate-100 px-3 py-2 text-center dark:border-slate-700 dark:bg-slate-800">1</th>
                </tr>
              </thead>
              <tbody>
                {EVAL_FORM_ITEMS.map((item) => (
                  <tr key={item}>
                    <td className="border border-slate-200 px-3 py-2 dark:border-slate-700">{item}</td>
                    {[4, 3, 2, 1].map((num) => (
                      <td key={num} className="border border-slate-200 px-3 py-2 text-center dark:border-slate-700">
                        <label className="inline-flex cursor-pointer items-center justify-center">
                          <input
                            type="radio"
                            name={`eval-${item}`}
                            className="h-4 w-4"
                            checked={evalScores[item] === num}
                            onChange={() =>
                              setEvalScores((prev) => ({
                                ...prev,
                                [item]: num,
                              }))
                            }
                          />
                          <span className="sr-only">{item} {num}点</span>
                        </label>
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td colSpan={5} className="border border-slate-200 px-3 py-3 dark:border-slate-700">コメント: _______________________________________________</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="mb-2 text-xl font-semibold">参考資料</h2>
          <ul className="list-disc space-y-1 pl-5 text-slate-700 dark:text-slate-300">
            <li><a className="text-amber-700 underline underline-offset-4 dark:text-amber-300" href="https://www.canva.com/ja_jp/learn/presentation-design/" target="_blank" rel="noopener noreferrer">Canva プレゼンデザインガイド</a></li>
            <li><a className="text-amber-700 underline underline-offset-4 dark:text-amber-300" href="https://speakingaboutpresenting.com/" target="_blank" rel="noopener noreferrer">[英語] Speaking about Presenting</a></li>
            <li><a className="text-amber-700 underline underline-offset-4 dark:text-amber-300" href="https://www.garrreynolds.com/preso-tips/design/" target="_blank" rel="noopener noreferrer">[英語] Presentation Zen Tips</a></li>
          </ul>
        </section>
      </div>

      <section className={`${isPrintEvalMode ? 'block' : 'hidden'} print:block`}>
        {evalCopiesView.map((_, index) => (
          <div key={index} className="pr-copy mx-auto mb-4 max-w-3xl rounded-lg border border-slate-300 p-6 text-black break-after-page">
            <h2 className="text-xl font-bold">自己/相互評価フォーム</h2>
            <p className="mt-1 text-sm">No.{index + 1} / 氏名: ____________________ / 発表者: ____________________</p>
            <p className="mt-2 text-xs">採点の目安: 4=優秀 / 3=良好 / 2=改善要 / 1=不十分</p>
            <table className="mt-4 w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-slate-400 px-2 py-1 text-left">観点</th>
                  <th className="border border-slate-400 px-2 py-1">4</th>
                  <th className="border border-slate-400 px-2 py-1">3</th>
                  <th className="border border-slate-400 px-2 py-1">2</th>
                  <th className="border border-slate-400 px-2 py-1">1</th>
                </tr>
              </thead>
              <tbody>
                {EVAL_FORM_ITEMS.map((item) => (
                  <tr key={item}>
                    <td className="border border-slate-400 px-2 py-2">{item}</td>
                    <td className="border border-slate-400 px-2 py-2 text-center">□</td>
                    <td className="border border-slate-400 px-2 py-2 text-center">□</td>
                    <td className="border border-slate-400 px-2 py-2 text-center">□</td>
                    <td className="border border-slate-400 px-2 py-2 text-center">□</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={5} className="border border-slate-400 px-2 py-4">良かった点: ____________________________________________</td>
                </tr>
                <tr>
                  <td colSpan={5} className="border border-slate-400 px-2 py-4">改善点: ________________________________________________</td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </section>
    </main>
  );
}
