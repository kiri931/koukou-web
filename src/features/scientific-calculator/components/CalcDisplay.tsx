interface CalcDisplayProps {
  expression: string;
  result: string;
  angleMode: 'DEG' | 'RAD';
  shiftActive: boolean;
  memory: number;
  parenBalance: number;
  hasError: boolean;
}

export default function CalcDisplay({
  expression,
  result,
  angleMode,
  shiftActive,
  memory,
  parenBalance,
  hasError,
}: CalcDisplayProps) {
  return (
    <div className="rounded-2xl border border-zinc-300 bg-zinc-900 p-4 text-zinc-100 shadow-inner dark:border-zinc-700">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wide text-zinc-300">
        <span className="rounded bg-zinc-700 px-2 py-0.5">{angleMode}</span>
        <span className={`rounded px-2 py-0.5 ${shiftActive ? 'bg-violet-500 text-white' : 'bg-zinc-700'}`}>SHIFT</span>
        <span className="rounded bg-zinc-700 px-2 py-0.5">M {memory.toFixed(4).replace(/\.0+$/, '')}</span>
        <span className={`rounded px-2 py-0.5 ${parenBalance === 0 ? 'bg-zinc-700' : 'bg-amber-500/80 text-zinc-950'}`}>
          () {parenBalance}
        </span>
      </div>
      <div className="min-h-10 break-all text-right font-mono text-sm text-zinc-400 sm:text-base">
        {expression || '0'}
      </div>
      <div className={`min-h-12 break-all text-right font-mono text-2xl font-bold sm:text-3xl ${hasError ? 'text-rose-300' : 'text-emerald-300'}`}>
        {result}
      </div>
    </div>
  );
}
