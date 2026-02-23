import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DmsState } from '../types';

interface DmsPanelProps {
  dms: DmsState;
  shiftActive: boolean;
  onChangeField: (field: keyof DmsState, value: string) => void;
  onConvert: () => void;
  onTrig: (kind: 'sin' | 'cos' | 'tan' | 'asin' | 'acos' | 'atan') => void;
  onClose: () => void;
  error: string | null;
}

export default function DmsPanel({
  dms,
  shiftActive,
  onChangeField,
  onConvert,
  onTrig,
  onClose,
  error,
}: DmsPanelProps) {
  const trigKinds = shiftActive
    ? [
        { label: 'sin⁻¹', kind: 'asin' as const },
        { label: 'cos⁻¹', kind: 'acos' as const },
        { label: 'tan⁻¹', kind: 'atan' as const },
      ]
    : [
        { label: 'sin', kind: 'sin' as const },
        { label: 'cos', kind: 'cos' as const },
        { label: 'tan', kind: 'tan' as const },
      ];

  return (
    <section className="rounded-xl border border-violet-200 bg-violet-50/60 p-3 dark:border-violet-900/50 dark:bg-violet-950/20">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-violet-900 dark:text-violet-200">DMS入力</h2>
        <Button type="button" size="xs" variant="ghost" onClick={onClose}>
          閉じる
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input
          value={dms.degrees}
          onChange={(e) => onChangeField('degrees', e.target.value)}
          placeholder="度"
          inputMode="decimal"
        />
        <Input
          value={dms.minutes}
          onChange={(e) => onChangeField('minutes', e.target.value)}
          placeholder="分 (0-59)"
          inputMode="decimal"
        />
        <Input
          value={dms.seconds}
          onChange={(e) => onChangeField('seconds', e.target.value)}
          placeholder="秒 (0-59.999)"
          inputMode="decimal"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" className="bg-violet-600 text-white hover:bg-violet-700" onClick={onConvert}>
          →DEG変換
        </Button>
        {trigKinds.map((item) => (
          <Button key={item.kind} type="button" size="sm" variant="outline" onClick={() => onTrig(item.kind)}>
            {item.label}
          </Button>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">{error}</p>}
    </section>
  );
}
