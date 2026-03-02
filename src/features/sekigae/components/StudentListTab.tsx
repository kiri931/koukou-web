/**
 * 名簿サイドバーパネル
 * - 生徒の追加・削除・名前編集・グループ設定
 * - Excelからのコピペ対応（展開式）
 */

import { useState } from 'react'
import { Plus, Trash2, ClipboardPaste, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { COLOR_BG_CLASS } from '../utils/colors'
import type { ClassGroup, SeatColor } from '../types'
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

export function StudentListTab({
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
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">名簿</span>
          <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full px-2 py-0.5">
            {students.length}名
          </span>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            title="番号を振り直す"
            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
            onClick={renumberAttendance}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="名簿をコピペ"
            className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors ${
              showPaste
                ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
                : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
            onClick={() => setShowPaste(!showPaste)}
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* コピペ入力エリア */}
      {showPaste && (
        <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2 shrink-0">
          <p className="text-xs text-slate-500">
            Excelからコピーした名前を貼り付け。1行1名 or「番号⇥名前」形式。
          </p>
          <textarea
            className="w-full h-24 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder={'足立\n荒牧\n安楽\n...'}
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
          />
          <div className="flex gap-1.5">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 text-xs px-3" onClick={handlePasteApply}>
              適用
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-slate-500" onClick={() => { setPasteText(''); setShowPaste(false) }}>
              キャンセル
            </Button>
          </div>
        </div>
      )}

      {/* カラム見出し（グループ列がある時だけ） */}
      {showGroupCol && (
        <div className="flex items-center gap-1 px-1 mb-0.5 shrink-0">
          <span className="w-10 shrink-0" />
          <span className="flex-1 text-[10px] text-slate-400">名前</span>
          <span className="text-[10px] text-slate-400 w-[72px] text-center shrink-0">グループ</span>
          <span className="w-4 shrink-0" />
        </div>
      )}

      {/* 生徒リスト（スクロール可能） */}
      <div className="flex-1 overflow-y-auto space-y-0.5 min-h-0">
        {students.map((student, index) => (
          <StudentRow
            key={student.id}
            number={student.attendanceNumber}
            name={student.name}
            color={student.color}
            groups={config.groups}
            showGroupCol={showGroupCol}
            onNumberChange={n => updateStudentNumber(index, n)}
            onNameChange={n => updateStudentName(index, n)}
            onGroupChange={groupId => setStudentGroup(index, groupId)}
            onRemove={() => removeStudent(index)}
          />
        ))}
      </div>

      {/* 追加ボタン */}
      <button
        type="button"
        className="mt-2 w-full h-8 rounded-lg border border-dashed border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 flex items-center justify-center gap-1 text-xs transition-colors shrink-0"
        onClick={() => addStudent(students.length - 1)}
      >
        <Plus className="w-3.5 h-3.5" />
        生徒を追加
      </button>
    </div>
  )
}

// ---- サブコンポーネント ----

function StudentRow({
  number,
  name,
  color,
  groups,
  showGroupCol,
  onNumberChange,
  onNameChange,
  onGroupChange,
  onRemove,
}: {
  number: number
  name: string
  color: SeatColor
  groups: ClassGroup[]
  showGroupCol: boolean
  onNumberChange: (n: number) => void
  onNameChange: (n: string) => void
  onGroupChange: (groupId: string | null) => void
  onRemove: () => void
}) {
  const currentGroup = groups.find(g => g.color === color) ?? null

  return (
    <div className="flex items-center gap-1 rounded-lg border border-transparent px-1 py-1 hover:bg-slate-50 hover:border-slate-100 transition-colors group">
      {/* 出席番号 */}
      <Input
        type="number"
        className="w-10 h-6 text-center text-xs px-0.5 border-slate-200 focus:border-indigo-300 shrink-0"
        value={number}
        onChange={e => onNumberChange(Number(e.target.value))}
      />

      {/* 名前 */}
      <Input
        className="flex-1 h-6 text-xs border-slate-200 focus:border-indigo-300 min-w-0"
        placeholder="名前"
        value={name}
        onChange={e => onNameChange(e.target.value)}
      />

      {/* グループセレクタ */}
      {showGroupCol && (
        <GroupSelect
          currentGroup={currentGroup}
          groups={groups}
          onGroupChange={onGroupChange}
        />
      )}

      {/* 削除 */}
      <button
        type="button"
        className="w-4 h-4 flex items-center justify-center text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
        onClick={onRemove}
      >
        <Trash2 className="w-3 h-3" />
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
    <div className="relative shrink-0">
      <select
        className={cn(
          'h-6 rounded-lg text-xs border appearance-none cursor-pointer pr-4 pl-2 focus:outline-none focus:ring-1 focus:ring-indigo-300 transition-colors',
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
      {/* ドロップダウン矢印（色付きの場合は白） */}
      <span className={cn(
        'absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-[8px]',
        currentGroup ? 'text-white/80' : 'text-slate-400',
      )}>▼</span>
    </div>
  )
}
