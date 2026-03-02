/**
 * 設定ビュー
 * - 座席の見た目（サイズ・角の丸み・文字サイズ・文字色）
 * - チート設定（事前席決め + 抽選演出）
 */

import { cn } from '@/lib/utils'
import { COLOR_BORDER_CLASS, COLOR_TEXT_CLASS } from '../utils/colors'
import type { SeatColor, SeatCorner, SeatFontSize, SeatNameColor, SeatSize } from '../types'
import type { useSekigae } from '../hooks/useSekigae'

type Props = Pick<
  ReturnType<typeof useSekigae>,
  | 'students'
  | 'seats'
  | 'config'
  | 'updateSeatStyle'
  | 'setCheatEnabled'
  | 'setCheatAssignment'
  | 'clearCheatAssignments'
>

const SIZE_OPTIONS: { value: SeatSize; label: string; desc: string }[] = [
  { value: 'sm', label: '小', desc: '狭い教室向け' },
  { value: 'md', label: '中', desc: '標準' },
  { value: 'lg', label: '大', desc: '広い教室向け' },
]

const CORNER_OPTIONS: { value: SeatCorner; label: string; cls: string }[] = [
  { value: 'none', label: '直角', cls: 'rounded-none' },
  { value: 'sm',   label: '小丸', cls: 'rounded-sm' },
  { value: 'md',   label: '中丸', cls: 'rounded-lg' },
  { value: 'lg',   label: '大丸', cls: 'rounded-2xl' },
]

const FONT_SIZE_OPTIONS: { value: SeatFontSize; label: string; preview: string }[] = [
  { value: 'xs', label: '極小', preview: 'text-[9px]' },
  { value: 'sm', label: '小',   preview: 'text-xs' },
  { value: 'md', label: '中',   preview: 'text-sm' },
  { value: 'lg', label: '大',   preview: 'text-base' },
]

const NAME_COLOR_OPTIONS: { value: SeatNameColor; label: string; swatch?: string }[] = [
  { value: 'group', label: 'グループ色' },
  { value: 'black', label: '黒' },
  { value: 'gray',  label: 'グレー' },
]

const PREVIEW_SIZE: Record<SeatSize, string> = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
}
const PREVIEW_CORNER: Record<SeatCorner, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-lg',
  lg: 'rounded-2xl',
}
const PREVIEW_FONT: Record<SeatFontSize, string> = {
  xs: 'text-[9px]',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}
const PREVIEW_NAME_COLOR: Record<SeatNameColor, { a: string; b: string }> = {
  group: { a: 'text-indigo-600', b: 'text-red-600' },
  black: { a: 'text-slate-900',  b: 'text-slate-900' },
  gray:  { a: 'text-slate-500',  b: 'text-slate-500' },
}
const PREVIEW_BORDER: Record<SeatNameColor, { a: string; b: string }> = {
  group: { a: 'border-indigo-400', b: 'border-red-400' },
  black: { a: 'border-indigo-400', b: 'border-red-400' },
  gray:  { a: 'border-indigo-400', b: 'border-red-400' },
}

export function SettingsView({
  students,
  seats,
  config,
  updateSeatStyle,
  setCheatEnabled,
  setCheatAssignment,
  clearCheatAssignments,
}: Props) {
  const { seatStyle, cheatEnabled, cheatAssignments, rows, cols } = config
  const gridSeats = seats.slice(0, rows * cols)
  const cheatCount = Object.keys(cheatAssignments ?? {}).length

  // チート: 既に割り当て済みの studentId セット
  const assignedStudentIds = new Set(Object.values(cheatAssignments ?? {}))

  const fontSize = seatStyle.fontSize ?? 'sm'
  const nameColor = seatStyle.nameColor ?? 'group'

  return (
    <div className="space-y-4">
      {/* 座席の見た目 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">座席の見た目</h2>
        <div className="space-y-5">

          {/* Size */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              サイズ
            </label>
            <div className="flex gap-2">
              {SIZE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateSeatStyle({ size: opt.value })}
                  className={cn(
                    'flex flex-col items-center gap-1 px-5 py-2.5 rounded-xl border-2 text-sm transition-colors',
                    seatStyle.size === opt.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                  )}
                >
                  <span className="font-semibold">{opt.label}</span>
                  <span className="text-[10px] text-slate-400">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Corner */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              角の丸み
            </label>
            <div className="flex gap-2">
              {CORNER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateSeatStyle({ corner: opt.value })}
                  className={cn(
                    opt.cls,
                    'px-5 py-2.5 border-2 text-sm transition-colors',
                    seatStyle.corner === opt.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font size */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              文字サイズ
            </label>
            <div className="flex gap-2">
              {FONT_SIZE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateSeatStyle({ fontSize: opt.value })}
                  className={cn(
                    'flex items-center justify-center gap-2 px-4 py-2 rounded-xl border-2 transition-colors min-w-[64px]',
                    fontSize === opt.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                  )}
                >
                  <span className={cn(opt.preview, 'font-bold')}>あ</span>
                  <span className="text-xs">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name color */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              文字色
            </label>
            <div className="flex gap-2">
              {NAME_COLOR_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateSeatStyle({ nameColor: opt.value })}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm transition-colors',
                    nameColor === opt.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                  )}
                >
                  {opt.value === 'group' && (
                    <span className="flex gap-0.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    </span>
                  )}
                  {opt.value === 'black' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                  )}
                  {opt.value === 'gray' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  )}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              プレビュー
            </label>
            <div className="flex items-end gap-2">
              <div className={cn(
                PREVIEW_SIZE[seatStyle.size], PREVIEW_CORNER[seatStyle.corner],
                'border-2 bg-white flex flex-col items-center justify-center gap-0.5',
                PREVIEW_BORDER[nameColor].a,
              )}>
                <span className="text-[9px] text-slate-400">1</span>
                <span className={cn(PREVIEW_FONT[fontSize], 'font-bold', PREVIEW_NAME_COLOR[nameColor].a)}>田中</span>
              </div>
              <div className={cn(
                PREVIEW_SIZE[seatStyle.size], PREVIEW_CORNER[seatStyle.corner],
                'border-2 bg-white flex flex-col items-center justify-center gap-0.5',
                PREVIEW_BORDER[nameColor].b,
              )}>
                <span className="text-[9px] text-slate-400">2</span>
                <span className={cn(PREVIEW_FONT[fontSize], 'font-bold', PREVIEW_NAME_COLOR[nameColor].b)}>山田</span>
              </div>
              <div className={cn(
                PREVIEW_SIZE[seatStyle.size], PREVIEW_CORNER[seatStyle.corner],
                'border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center',
              )}>
                <span className="text-[10px] text-slate-400">空席</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* チート設定 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">チート設定 🎰</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              特定の生徒を特定の席に事前に割り当て、抽選演出で隠します。
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={cheatEnabled}
            onClick={() => setCheatEnabled(!cheatEnabled)}
            className={cn(
              'relative w-10 h-5 rounded-full transition-colors shrink-0 mt-0.5',
              cheatEnabled ? 'bg-indigo-600' : 'bg-slate-200',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                cheatEnabled ? 'translate-x-5' : 'translate-x-0.5',
              )}
            />
          </button>
        </div>

        {cheatEnabled && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-500">
                各座席に割り当てる生徒を選択。「自動」はランダムで埋めます。
                {cheatCount > 0 && (
                  <span className="ml-2 text-indigo-600 font-medium">{cheatCount}席設定済み</span>
                )}
              </p>
              {cheatCount > 0 && (
                <button
                  type="button"
                  className="text-xs text-red-400 hover:text-red-600 transition-colors shrink-0 ml-3"
                  onClick={clearCheatAssignments}
                >
                  全クリア
                </button>
              )}
            </div>

            {/* 黒板ラベル */}
            <div className="flex justify-center mb-2">
              <span className="bg-slate-800 text-white rounded-full px-3 py-0.5 text-xs">黒板側</span>
            </div>

            {/* Cheat seat grid */}
            <div
              className="grid gap-1.5 mx-auto w-fit"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {gridSeats.map((seat, idx) => {
                if (seat.color === 'gray') {
                  return (
                    <div
                      key={seat.id}
                      className="w-20 h-16 rounded-lg bg-slate-100 border border-dashed border-slate-200 opacity-40"
                    />
                  )
                }

                const currentAssignedId = (cheatAssignments ?? {})[String(idx)] ?? ''

                // この席に選べる生徒: 未割り当て or この席に現在設定されている生徒のみ
                const availableStudents = students.filter(s =>
                  s.id === currentAssignedId || !assignedStudentIds.has(s.id)
                )

                return (
                  <div
                    key={seat.id}
                    className={cn(
                      'w-20 h-16 rounded-lg border-2 flex flex-col items-center justify-center gap-1 p-1',
                      COLOR_BORDER_CLASS[seat.color as SeatColor],
                      currentAssignedId ? 'bg-white' : 'bg-slate-50',
                    )}
                  >
                    <span className="text-[9px] text-slate-400 leading-none">{idx + 1}</span>
                    <select
                      className={cn(
                        'w-full text-[10px] border-0 bg-transparent focus:outline-none text-center cursor-pointer',
                        currentAssignedId
                          ? COLOR_TEXT_CLASS[seat.color as SeatColor] + ' font-semibold'
                          : 'text-slate-400',
                      )}
                      value={currentAssignedId}
                      onChange={e => setCheatAssignment(idx, e.target.value || null)}
                    >
                      <option value="">自動</option>
                      {availableStudents.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.attendanceNumber}. {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>

            <p className="text-[10px] text-slate-400 mt-3 text-center">
              「席替え」タブでランダム実行すると、抽選演出の後に確定席が配置されます
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
