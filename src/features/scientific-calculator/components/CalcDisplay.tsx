import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

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
  const [copied, setCopied] = useState(false);
  const normalizedMemory = Object.is(memory, -0) ? 0 : memory;

  const handleCopy = async () => {
    if (hasError) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-300 bg-zinc-900 p-4 text-zinc-100 shadow-inner dark:border-zinc-700">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wide text-zinc-300">
        <span className="rounded bg-zinc-700 px-2 py-0.5">{angleMode}</span>
        <span className={`rounded px-2 py-0.5 ${shiftActive ? 'bg-violet-500 text-white' : 'bg-zinc-700'}`}>SHIFT</span>
        {normalizedMemory !== 0 && (
          <span className="rounded bg-emerald-600 px-2 py-0.5 text-white">
            M {normalizedMemory.toFixed(4).replace(/\.0+$/, '')}
          </span>
        )}
        {parenBalance > 0 && (
          <span className="rounded bg-amber-500/80 px-2 py-0.5 text-zinc-950">() {parenBalance}</span>
        )}
      </div>
      <div className="min-h-10 break-all text-right font-mono text-sm text-zinc-400 sm:text-base">
        {expression || '0'}
      </div>
      <div className="flex items-start gap-2">
        <div
          className={`min-h-12 flex-1 break-all text-right font-mono text-2xl font-bold sm:text-3xl ${hasError ? 'text-rose-300' : 'text-emerald-300'}`}
        >
          {result}
        </div>
        <button
          type="button"
          onClick={() => void handleCopy()}
          disabled={hasError}
          className="mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-zinc-600/80 text-zinc-300 transition hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={copied ? 'コピー済み' : '結果をコピー'}
          title={copied ? 'コピー済み' : 'コピー'}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </button>
      </div>
    </div>
  );
}
