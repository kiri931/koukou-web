import { cn } from '@/lib/utils'
import { COLOR_BG_CLASS, JAPANESE_COLOR_NAMES, SEAT_COLOR_OPTIONS } from '../utils/colors'
import type { SeatColor } from '../types'

interface ColorPickerProps {
  value: SeatColor
  onChange: (color: SeatColor) => void
  includeGray?: boolean
  size?: 'sm' | 'md'
}

export function ColorPicker({ value, onChange, includeGray = false, size = 'sm' }: ColorPickerProps) {
  const options = includeGray ? (['gray', ...SEAT_COLOR_OPTIONS] as SeatColor[]) : SEAT_COLOR_OPTIONS
  const dotSize = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'

  return (
    <div className="flex flex-wrap gap-1">
      {options.map(color => (
        <button
          key={color}
          type="button"
          title={JAPANESE_COLOR_NAMES[color]}
          onClick={() => onChange(color)}
          className={cn(
            dotSize,
            'rounded-full border-2 transition-transform',
            COLOR_BG_CLASS[color],
            value === color
              ? 'border-foreground scale-110'
              : 'border-transparent hover:border-muted-foreground',
          )}
        />
      ))}
    </div>
  )
}
