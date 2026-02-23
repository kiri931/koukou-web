import { forwardRef, type ButtonHTMLAttributes, type MouseEvent } from 'react';
import { cn } from '@/lib/utils';
import type { ButtonDef } from '../types';

interface CalcButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  button: ButtonDef;
  shiftActive: boolean;
  onPress: (action: string) => void;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}

const variantClassMap: Record<ButtonDef['variant'], string> = {
  digit: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700',
  operator: 'bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:hover:bg-amber-500/30',
  action: 'bg-slate-200 text-slate-900 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600',
  function: 'bg-blue-100 text-blue-900 hover:bg-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:hover:bg-blue-500/25',
  mode: 'bg-violet-100 text-violet-900 hover:bg-violet-200 dark:bg-violet-500/20 dark:text-violet-200 dark:hover:bg-violet-500/30',
  memory: 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/25',
};

const CalcButton = forwardRef<HTMLButtonElement, CalcButtonProps>(function CalcButton(
  { button, shiftActive, onPress, onClick, className, ...buttonProps },
  ref
) {
  const label = shiftActive && button.shiftLabel ? button.shiftLabel : button.label;
  const action = shiftActive && button.shiftAction ? button.shiftAction : button.action;
  const isShiftKey = button.action === 'toggle-shift';
  const hasShiftAlt = !isShiftKey && Boolean(button.shiftAction || button.shiftLabel);
  const showShiftSubLabel = hasShiftAlt && shiftActive && label !== button.label;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    onPress(action);
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      className={cn(
        'relative h-12 rounded-lg border border-white/50 px-2 text-sm font-semibold shadow-sm transition active:translate-y-px sm:h-14 sm:text-base',
        variantClassMap[button.variant],
        button.wide && 'col-span-2',
        showShiftSubLabel && 'py-1',
        isShiftKey && shiftActive && 'ring-2 ring-violet-400 ring-offset-1 dark:ring-violet-300',
        className
      )}
      aria-pressed={isShiftKey ? shiftActive : undefined}
      {...buttonProps}
    >
      {hasShiftAlt && (
        <span
          aria-hidden="true"
          className={cn(
            'absolute right-1.5 top-1.5 size-1.5 rounded-full bg-current opacity-45',
            shiftActive && 'opacity-80'
          )}
        />
      )}
      <span className={cn('block leading-none', showShiftSubLabel && 'flex flex-col items-center gap-1')}>
        <span className={cn('block', showShiftSubLabel && 'text-xs sm:text-sm')}>{label}</span>
        {showShiftSubLabel && (
          <span className="block text-[10px] font-medium opacity-70 sm:text-xs">{button.label}</span>
        )}
      </span>
    </button>
  );
});

export default CalcButton;
