/**
 * 名簿ビュー（フルワイドの生徒名簿エディタ）
 */

import { useState } from 'react'
import { Plus, Trash2, RefreshCw, ClipboardPaste } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { COLOR_BG_CLASS } from '../utils/colors'
import type { ClassConfig, ClassGroup } from '../types'
import type { useSekigae } from '../hooks/useSekigae'

type Props = Pick<
  ReturnType<typeof useSekigae>,
  | 'students'
  | 'config'
  | 'addStudent'
  | 'removeStudent'
  | 'updateStudentName'
  | 'updateStudentNumber'
  | 'renumberAttendance'
  | 'applyNamesFromText'
  | 'setStudentGroup'
>

export function RosterView({
  students,
  config,
  addStudent,
  removeStudent,
  updateStudentName,
  updateStudentNumber,
  renumberAttendance,
  applyNamesFromText,
  setStudentGroup,
}: Props) {
  const [pasteText, setPasteText] = useState('')
  const [showPaste, setShowPaste] = useState(false)

  const handlePasteApply = () => {
    if (pasteText.trim()) {
      applyNamesFromText(pasteText)
      setPasteText('')
      setShowPaste(false)
    }
  }

  const showGroupCol = config.groups.length > 0

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">名簿</span>
          <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full px-2 py-0.5">
            {students.length}名
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
            onClick={renumberAttendance}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            番号振り直し
          </button>
          <button
            type="button"
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors',
              showPaste
                ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50',
            )}
            onClick={() => setShowPaste(!showPaste)}
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            コピペ
          </button>
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1"
            onClick={() => addStudent(students.length - 1)}
          >
            <Plus className="w-3.5 h-3.5" />
            生徒を追加
          </Button>
        </div>
      </div>

      {/* Paste area */}
      {showPaste && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
          <p className="text-xs text-slate-500">
            Excelからコピーした名前を貼り付け。1行1名 or「番号⇥名前」形式。
          </p>
          <textarea
            className="w-full h-32 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder={'足立\n荒牧\n安楽\n...'}
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 text-xs px-3" onClick={handlePasteApply}>
              適用
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-slate-500" onClick={() => { setPasteText(''); setShowPaste(false) }}>
              キャンセル
            </Button>
          </div>
        </div>
      )}

      {/* Column headers */}
      <div className="flex items-center gap-3 px-2 pb-1.5 border-b border-slate-100 mb-1">
        <span className="w-14 shrink-0 text-[10px] text-slate-400 text-center">番号</span>
        <span className="flex-1 text-[10px] text-slate-400">名前</span>
        {showGroupCol && <span className="w-28 shrink-0 text-[10px] text-slate-400 text-center">グループ</span>}
        <span className="w-7 shrink-0" />
      </div>

      {/* Student list */}
      <div className="space-y-0.5 max-h-[65vh] overflow-y-auto">
        {students.map((student, index) => {
          const currentGroup = config.groups.find(g => g.color === student.color) ?? null
          return (
            <div
              key={student.id}
              className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors group"
            >
              <Input
                type="number"
                className="w-14 h-7 text-center text-xs px-0.5 border-slate-200 focus:border-indigo-300 shrink-0"
                value={student.attendanceNumber}
                onChange={e => updateStudentNumber(index, Number(e.target.value))}
              />
              <Input
                className="flex-1 h-7 text-xs border-slate-200 focus:border-indigo-300"
                placeholder="名前"
                value={student.name}
                onChange={e => updateStudentName(index, e.target.value)}
              />
              {showGroupCol && (
                <div className="w-28 shrink-0">
                  <GroupSelect
                    currentGroup={currentGroup}
                    groups={config.groups}
                    onGroupChange={groupId => setStudentGroup(index, groupId)}
                  />
                </div>
              )}
              <button
                type="button"
                className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                onClick={() => removeStudent(index)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Add button */}
      <button
        type="button"
        className="mt-2 w-full h-9 rounded-lg border border-dashed border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 flex items-center justify-center gap-1 text-xs transition-colors"
        onClick={() => addStudent(students.length - 1)}
      >
        <Plus className="w-3.5 h-3.5" />
        生徒を追加
      </button>
    </div>
  )
}

function GroupSelect({
  currentGroup,
  groups,
  onGroupChange,
}: {
  currentGroup: ClassGroup | null
  groups: ClassGroup[]
  onGroupChange: (groupId: string | null) => void
}) {
  return (
    <div className="relative">
      <select
        className={cn(
          'w-full h-7 rounded-lg text-xs border appearance-none cursor-pointer pr-4 pl-2 focus:outline-none focus:ring-1 focus:ring-indigo-300 transition-colors',
          currentGroup
            ? cn('text-white border-transparent', COLOR_BG_CLASS[currentGroup.color])
            : 'border-slate-200 bg-white text-slate-500',
        )}
        value={currentGroup?.id ?? ''}
        onChange={e => onGroupChange(e.target.value || null)}
      >
        <option value="">なし</option>
        {groups.map(group => (
          <option key={group.id} value={group.id}>{group.name}</option>
        ))}
      </select>
      <span className={cn(
        'absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-[8px]',
        currentGroup ? 'text-white/80' : 'text-slate-400',
      )}>▼</span>
    </div>
  )
}
