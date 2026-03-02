/**
 * 座席グリッドパネル（統合）
 * - assignment === null → レイアウト編集モード（クリックでグループ循環）
 * - assignment !== null → 結果表示モード（生徒名表示、D&Dで入替）
 * - チート有効時 → ランダム実行でスロット演出
 */

import { useState } from 'react'
import { Minus, Plus, Shuffle, ListOrdered, RotateCcw, Printer, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { COLOR_BG_CLASS, COLOR_BORDER_CLASS, COLOR_TEXT_CLASS } from '../utils/colors'
import type { ClassGroup, SeatAssignment, SeatColor, SeatCorner, SeatFontSize, SeatNameColor, SeatSize } from '../types'
import type { AttendanceMode } from '../hooks/useSekigae'
import type { useSekigae } from '../hooks/useSekigae'

type Props = Pick<
  ReturnType<typeof useSekigae>,
  | 'students'
  | 'seats'
  | 'config'
  | 'assignment'
  | 'cycleSeatGroup'
  | 'updateGridSize'
  | 'updateColorMatch'
  | 'addGroup'
  | 'removeGroup'
  | 'updateGroupName'
  | 'execRandomAssign'
  | 'execAttendanceOrder'
  | 'clearAssignment'
  | 'swapAssignment'
>

const ATTENDANCE_MODES: { mode: AttendanceMode; label: string }[] = [
  { mode: 'leftToRight',      label: '横↓' },
  { mode: 'topToBottom',      label: '縦↓' },
  { mode: 'rightToLeft',      label: '横↑' },
  { mode: 'topToBottomRight', label: '縦↑' },
]

const LAYOUT_SIZES: Record<SeatSize, { normal: string; compact: string }> = {
  sm: { normal: 'w-10 h-10', compact: 'w-8 h-8' },
  md: { normal: 'w-12 h-12', compact: 'w-10 h-10' },
  lg: { normal: 'w-14 h-14', compact: 'w-12 h-12' },
}
const RESULT_SIZES: Record<SeatSize, { normal: string; compact: string }> = {
  sm: { normal: 'w-12 h-12', compact: 'w-10 h-10' },
  md: { normal: 'w-16 h-16', compact: 'w-14 h-14' },
  lg: { normal: 'w-20 h-20', compact: 'w-16 h-16' },
}
const CORNER_CLASS: Record<SeatCorner, string> = {
  none: 'rounded-none',
  sm:   'rounded-sm',
  md:   'rounded-lg',
  lg:   'rounded-2xl',
}
const FONT_SIZE_CLASS: Record<SeatFontSize, string> = {
  xs: 'text-[9px]',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}
const NAME_COLOR_CLASS: Record<SeatNameColor, string> = {
  group: '', // uses COLOR_TEXT_CLASS per seat color
  black: 'text-slate-900',
  gray:  'text-slate-500',
}

export function SeatGridPanel({
  students,
  seats,
  config,
  assignment,
  cycleSeatGroup,
  updateGridSize,
  updateColorMatch,
  addGroup,
  removeGroup,
  updateGroupName,
  execRandomAssign,
  execAttendanceOrder,
  clearAssignment,
  swapAssignment,
}: Props) {
  const { rows, cols, isColorMatch, groups } = config
  const [animKey, setAnimKey] = useState(0)
  const [showSeatNumbers, setShowSeatNumbers] = useState(false)
  const [dragFromIdx, setDragFromIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [shuffleDisplay, setShuffleDisplay] = useState<SeatAssignment | null>(null)

  const isAnimating = shuffleDisplay !== null
  const displayAssignment = shuffleDisplay ?? assignment

  const gridSeats = seats.slice(0, rows * cols)

  const activeCount = gridSeats.filter(s => s.color !== 'gray').length
  const studentCount = students.length
  const warning = studentCount > activeCount
    ? `生徒数（${studentCount}名）が有効座席数（${activeCount}席）を超えています。`
    : null

  const seatStyle = config.seatStyle ?? { size: 'md', corner: 'md', fontSize: 'sm', nameColor: 'group' }
  const isCompact = cols > 6
  const layoutCellSize = isCompact ? LAYOUT_SIZES[seatStyle.size].compact : LAYOUT_SIZES[seatStyle.size].normal
  const resultCellSize = isCompact ? RESULT_SIZES[seatStyle.size].compact : RESULT_SIZES[seatStyle.size].normal
  const cornerClass = CORNER_CLASS[seatStyle.corner]
  const fontSizeClass = FONT_SIZE_CLASS[seatStyle.fontSize ?? 'sm']
  const nameColorFixed = seatStyle.nameColor !== 'group' ? NAME_COLOR_CLASS[seatStyle.nameColor] : null

  // グループごとの生徒数
  const groupStudentCounts = groups.reduce<Record<string, number>>((acc, g) => {
    acc[g.id] = students.filter(s => s.color === g.color).length
    return acc
  }, {})

  const runLotteryAnimation = () => {
    let frame = 0
    const tick = () => {
      frame++
      if (frame >= 18) {
        setShuffleDisplay(null)
        setAnimKey(k => k + 1)
        return
      }
      const shuffled = [...students].sort(() => Math.random() - 0.5)
      const display: SeatAssignment = gridSeats.map((seat, i) => {
        if (seat.color === 'gray') return null
        return shuffled[i % Math.max(1, shuffled.length)] ?? null
      })
      setShuffleDisplay(display)
      const delay = frame < 8 ? 80 : frame < 13 ? 130 : frame < 16 ? 200 : 350
      setTimeout(tick, delay)
    }
    // First frame
    const firstShuffled = [...students].sort(() => Math.random() - 0.5)
    setShuffleDisplay(gridSeats.map((seat, i) => seat.color === 'gray' ? null : firstShuffled[i] ?? null))
    setTimeout(tick, 80)
  }

  const handleRandomAssign = () => {
    execRandomAssign()
    if (config.cheatEnabled && Object.keys(config.cheatAssignments ?? {}).length > 0) {
      runLotteryAnimation()
    } else {
      setAnimKey(k => k + 1)
    }
  }

  const handleAttendanceOrder = (mode: AttendanceMode) => {
    execAttendanceOrder(mode)
    setAnimKey(k => k + 1)
  }

  const handleDrop = (toIdx: number) => {
    if (dragFromIdx !== null && dragFromIdx !== toIdx) {
      swapAssignment(dragFromIdx, toIdx)
    }
    setDragFromIdx(null)
    setDragOverIdx(null)
  }

  return (
    <div className="space-y-4">
      {/* 設定カード */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-4 py-3 space-y-3">
        {/* 1行目: 行列・スイッチ類 */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* 行設定 */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 min-w-[1.5rem]">行</span>
            <button
              type="button"
              className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              onClick={() => updateGridSize(rows - 1, cols)}
              disabled={rows <= 1}
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-6 text-center font-semibold tabular-nums text-sm">{rows}</span>
            <button
              type="button"
              className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              onClick={() => updateGridSize(rows + 1, cols)}
              disabled={rows >= 10}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <span className="text-slate-200 hidden sm:block">|</span>

          {/* 列設定 */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 min-w-[1.5rem]">列</span>
            <button
              type="button"
              className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              onClick={() => updateGridSize(rows, cols - 1)}
              disabled={cols <= 1}
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-6 text-center font-semibold tabular-nums text-sm">{cols}</span>
            <button
              type="button"
              className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              onClick={() => updateGridSize(rows, cols + 1)}
              disabled={cols >= 10}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <span className="text-slate-200 hidden sm:block">|</span>

          {/* グループマッチ */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">グループ配置</span>
            <button
              type="button"
              role="switch"
              aria-checked={isColorMatch}
              onClick={() => updateColorMatch(!isColorMatch)}
              className={cn(
                'relative w-9 h-5 rounded-full transition-colors shrink-0',
                isColorMatch ? 'bg-indigo-600' : 'bg-slate-200',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                  isColorMatch ? 'translate-x-4' : 'translate-x-0.5',
                )}
              />
            </button>
          </div>

          <span className="text-slate-200 hidden sm:block">|</span>

          {/* 番号表示 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">番号表示</span>
            <button
              type="button"
              role="switch"
              aria-checked={showSeatNumbers}
              onClick={() => setShowSeatNumbers(v => !v)}
              className={cn(
                'relative w-9 h-5 rounded-full transition-colors shrink-0',
                showSeatNumbers ? 'bg-indigo-600' : 'bg-slate-200',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                  showSeatNumbers ? 'translate-x-4' : 'translate-x-0.5',
                )}
              />
            </button>
          </div>
        </div>

        {/* 2行目: グループ管理（グループ配置がONの時のみ） */}
        {isColorMatch && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">
              グループ
            </span>
            {groups.map(group => (
              <GroupTag
                key={group.id}
                group={group}
                count={groupStudentCounts[group.id] ?? 0}
                onRename={updateGroupName}
                onRemove={removeGroup}
              />
            ))}
            {groups.length < 8 && (
              <button
                type="button"
                onClick={addGroup}
                className="h-6 px-2.5 rounded-full border border-dashed border-slate-300 text-xs text-slate-400 hover:border-indigo-300 hover:text-indigo-500 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                追加
              </button>
            )}
            {groups.length === 0 && (
              <span className="text-xs text-slate-400">
                「追加」でグループを作成し、座席エリアに割り当てられます
              </span>
            )}
          </div>
        )}
      </div>

      {/* 警告 */}
      {warning && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {warning}
        </div>
      )}

      {/* チート有効バッジ */}
      {config.cheatEnabled && Object.keys(config.cheatAssignments ?? {}).length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 flex items-center gap-2">
          <span>🎰</span>
          <span>チート設定が有効です。ランダム実行時に抽選演出が表示されます。</span>
        </div>
      )}

      {/* 印刷エリア */}
      <div id="print-area" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        {/* 黒板ラベル */}
        <div className="flex justify-center mb-3">
          <span className="bg-slate-800 text-white rounded-full px-4 py-1 text-xs">黒板側</span>
        </div>

        {/* グリッド */}
        <div
          className="grid gap-1.5 mx-auto w-fit"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {gridSeats.map((seat, idx) => {
            const isDisabled = seat.color === 'gray'

            if (displayAssignment) {
              // 結果表示モード（または抽選アニメーション）
              const student = displayAssignment[idx]
              const isDragOver = !isAnimating && dragOverIdx === idx
              const isDragging = !isAnimating && dragFromIdx === idx

              if (isDisabled) {
                return (
                  <div
                    key={`${idx}-${animKey}`}
                    className={cn(resultCellSize, cornerClass, 'border border-dashed border-slate-200 opacity-30')}
                  />
                )
              }

              return (
                <div
                  key={`${idx}-${animKey}`}
                  className={cn(
                    resultCellSize, cornerClass,
                    !isAnimating && 'seat-animate',
                    'border-2 flex flex-col items-center justify-center gap-0.5 relative transition-transform',
                    student?.name
                      ? cn('bg-white', COLOR_BORDER_CLASS[seat.color as SeatColor], nameColorFixed ?? COLOR_TEXT_CLASS[seat.color as SeatColor])
                      : 'bg-slate-50 border-dashed border-slate-300 text-slate-400',
                    student?.name && !isAnimating ? 'cursor-grab active:cursor-grabbing' : '',
                    isDragOver && 'ring-2 ring-indigo-400 scale-105',
                    isDragging && 'opacity-50 scale-95',
                    isAnimating && 'transition-none overflow-hidden',
                  )}
                  draggable={!!student?.name && !isAnimating}
                  onDragStart={() => setDragFromIdx(idx)}
                  onDragEnd={() => { setDragFromIdx(null); setDragOverIdx(null) }}
                  onDragOver={e => { e.preventDefault(); setDragOverIdx(idx) }}
                  onDragLeave={() => setDragOverIdx(null)}
                  onDrop={() => handleDrop(idx)}
                  title={student?.name ? `${student.attendanceNumber ?? ''} ${student.name}` : '空席'}
                >
                  {showSeatNumbers && !isAnimating && (
                    <span className="absolute top-0.5 left-1 text-[9px] opacity-40 leading-none">{idx + 1}</span>
                  )}
                  {student?.name ? (
                    <>
                      {!isAnimating && student.attendanceNumber !== null && (
                        <span className="text-[9px] opacity-60 leading-none">{student.attendanceNumber}</span>
                      )}
                      <span className={cn(fontSizeClass, 'font-bold leading-tight text-center px-0.5 line-clamp-2')}>
                        {student.name}
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px]">空席</span>
                  )}
                </div>
              )
            }

            // レイアウト編集モード
            const seatGroup = groups.find(g => g.color === seat.color) ?? null
            return (
              <LayoutSeatCell
                key={seat.id}
                color={seat.color as SeatColor}
                seatGroup={seatGroup}
                showSeatNumbers={showSeatNumbers}
                seatIndex={idx}
                sizeClass={layoutCellSize}
                cornerClass={cornerClass}
                onClick={() => cycleSeatGroup(seat.id)}
              />
            )
          })}
        </div>

        {/* アニメーション中オーバーレイメッセージ */}
        {isAnimating && (
          <div className="flex justify-center mt-3">
            <span className="text-xs text-slate-400 animate-pulse">抽選中...</span>
          </div>
        )}
      </div>

      {/* アクションボタン */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          onClick={handleRandomAssign}
          disabled={isAnimating}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
        >
          <Shuffle className="w-4 h-4" />
          {config.cheatEnabled && Object.keys(config.cheatAssignments ?? {}).length > 0 ? '抽選' : 'ランダム'}
        </Button>

        {ATTENDANCE_MODES.map(({ mode, label }) => (
          <Button
            key={mode}
            variant="outline"
            size="sm"
            className="border-slate-200 bg-white text-slate-700 gap-1"
            disabled={isAnimating}
            onClick={() => handleAttendanceOrder(mode)}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            {label}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          className="border-slate-200 bg-white text-slate-700 gap-1"
          onClick={() => window.print()}
        >
          <Printer className="w-3.5 h-3.5" />
          印刷
        </Button>

        {displayAssignment && !isAnimating && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAssignment}
            className="text-slate-500 gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            クリア
          </Button>
        )}
      </div>

      {!displayAssignment && (
        <p className="text-xs text-slate-400">
          {isColorMatch && groups.length > 0
            ? `座席をクリックで「なし → ${groups.map(g => g.name).join(' → ')} → 無効」と切り替え。`
            : '座席をクリックで有効/無効切り替え。'}
          {isColorMatch && groups.length === 0 && ' グループを追加すると座席エリアに割り当てられます。'}
        </p>
      )}
    </div>
  )
}

// ---- サブコンポーネント ----

function LayoutSeatCell({
  color,
  seatGroup,
  showSeatNumbers,
  seatIndex,
  sizeClass,
  cornerClass,
  onClick,
}: {
  color: SeatColor
  seatGroup: ClassGroup | null
  showSeatNumbers: boolean
  seatIndex: number
  sizeClass: string
  cornerClass: string
  onClick: () => void
}) {
  const isDisabled = color === 'gray'
  const hasGroup = seatGroup !== null

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        sizeClass, cornerClass,
        'border-2 transition-all relative flex flex-col items-center justify-center',
        isDisabled
          ? 'bg-slate-100 border-slate-200 opacity-40'
          : hasGroup
            ? cn(COLOR_BG_CLASS[color], 'border-transparent opacity-90 hover:opacity-100 hover:scale-105')
            : 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:scale-105',
      )}
      title={isDisabled ? '無効席' : hasGroup ? `${seatGroup.name}（クリックで切り替え）` : 'グループなし（クリックで切り替え）'}
    >
      {showSeatNumbers && !isDisabled && (
        <span className={cn(
          'absolute top-0.5 left-1 text-[9px] leading-none',
          hasGroup ? 'text-white/60' : 'text-blue-400',
        )}>{seatIndex + 1}</span>
      )}
      {!isDisabled && hasGroup && (
        <span className="text-[10px] text-white font-semibold text-center leading-tight px-0.5 line-clamp-2">
          {seatGroup.name}
        </span>
      )}
    </button>
  )
}

function GroupTag({
  group,
  count,
  onRename,
  onRemove,
}: {
  group: ClassGroup
  count: number
  onRename: (id: string, name: string) => void
  onRemove: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(group.name)

  const commit = () => {
    onRename(group.id, draft.trim() || group.name)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        autoFocus
        className="h-6 px-2 rounded-full border border-indigo-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
        style={{ width: `${Math.max(5, draft.length + 2)}ch` }}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') { setDraft(group.name); setEditing(false) }
        }}
      />
    )
  }

  return (
    <div className={cn(
      'flex items-center gap-1 h-6 pl-2.5 pr-1.5 rounded-full text-white text-xs',
      COLOR_BG_CLASS[group.color],
    )}>
      <button
        type="button"
        className="hover:underline cursor-pointer"
        onClick={() => { setDraft(group.name); setEditing(true) }}
      >
        {group.name}
      </button>
      <span className="opacity-60 text-[10px] tabular-nums">({count})</span>
      <button
        type="button"
        className="opacity-60 hover:opacity-100 transition-opacity ml-0.5"
        onClick={() => onRemove(group.id)}
        title="グループを削除"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}
