import { cn } from '@/lib/utils';
import type { ButtonDef } from '../types';

interface CalcButtonProps {
  button: ButtonDef;
  shiftActive: boolean;
  onPress: (action: string) => void;
}

const variantClassMap: Record<ButtonDef['variant'], string> = {
  digit: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700',
  operator: 'bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:hover:bg-amber-500/30',
  action: 'bg-slate-200 text-slate-900 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600',
  function: 'bg-blue-100 text-blue-900 hover:bg-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:hover:bg-blue-500/25',
  mode: 'bg-violet-100 text-violet-900 hover:bg-violet-200 dark:bg-violet-500/20 dark:text-violet-200 dark:hover:bg-violet-500/30',
  memory: 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/25',
};

export default function CalcButton({ button, shiftActive, onPress }: CalcButtonProps) {
  const label = shiftActive && button.shiftLabel ? button.shiftLabel : button.label;
  const action = shiftActive && button.shiftAction ? button.shiftAction : button.action;
  const isShiftKey = button.action === 'toggle-shift';

  return (
    <button
      type="button"
      onClick={() => onPress(action)}
      className={cn(
        'h-12 rounded-lg border border-white/50 px-2 text-sm font-semibold shadow-sm transition active:translate-y-px sm:h-14 sm:text-base',
        variantClassMap[button.variant],
        button.wide && 'col-span-2',
        isShiftKey && shiftActive && 'ring-2 ring-violet-400 ring-offset-1 dark:ring-violet-300'
      )}
      aria-pressed={isShiftKey ? shiftActive : undefined}
    >
      {label}
    </button>
  );
}
