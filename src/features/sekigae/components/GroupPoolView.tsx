/**
 * グループプールビュー
 * 生徒をドラッグ＆ドロップでグループ列間を移動できる
 */

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { COLOR_BG_CLASS } from '../utils/colors'
import type { ClassConfig, SeatColor, Student } from '../types'
import type { useSekigae } from '../hooks/useSekigae'

type Props = Pick<
  ReturnType<typeof useSekigae>,
  'students' | 'config' | 'setStudentGroup'
>

export function GroupPoolView({ students, config, setStudentGroup }: Props) {
  const [dragging, setDragging] = useState<string | null>(null) // student id
  const [dragOver, setDragOver] = useState<string | null>(null) // column key

  const { groups } = config

  const getStudentGroupId = (student: Student) =>
    groups.find(g => g.color === student.color)?.id ?? null

  const handleDrop = (targetGroupId: string | null) => {
    if (dragging !== null) {
      const idx = students.findIndex(s => s.id === dragging)
      if (idx !== -1) setStudentGroup(idx, targetGroupId)
    }
    setDragging(null)
    setDragOver(null)
  }

  const columns = [
    { key: '__none', label: '未割り当て', color: 'blue' as SeatColor, groupId: null as string | null },
    ...groups.map(g => ({ key: g.id, label: g.name, color: g.color, groupId: g.id })),
  ]

  if (groups.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
        <p className="text-slate-500 font-medium">グループがまだありません</p>
        <p className="text-xs text-slate-400 mt-2">
          「席替え」タブの設定で「グループ配置」を ON にしてグループを追加してください。
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">グループ割り当て</span>
        <span className="text-xs text-slate-400">生徒をドラッグして列間を移動</span>
      </div>
      <div
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ minHeight: '60vh' }}
      >
        {columns.map(col => {
          const colStudents = students
            .filter(s => getStudentGroupId(s) === col.groupId)
            .slice()
            .sort((a, b) => a.attendanceNumber - b.attendanceNumber)
          const isDragOver = dragOver === col.key

          return (
            <div
              key={col.key}
              className={cn(
                'flex-1 min-w-[140px] max-w-[200px] rounded-xl border-2 border-dashed flex flex-col transition-colors',
                isDragOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-slate-50',
              )}
              onDragOver={e => { e.preventDefault(); setDragOver(col.key) }}
              onDragLeave={e => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOver(null)
                }
              }}
              onDrop={() => handleDrop(col.groupId)}
            >
              {/* Column header */}
              <div className={cn(
                'px-3 py-2 rounded-t-lg text-xs font-semibold text-white flex items-center justify-between shrink-0',
                col.groupId ? COLOR_BG_CLASS[col.color] : 'bg-slate-400',
              )}>
                <span>{col.label}</span>
                <span className="opacity-80 font-normal">{colStudents.length}名</span>
              </div>

              {/* Student cards */}
              <div className="flex-1 p-2 space-y-1">
                {colStudents.map(student => (
                  <div
                    key={student.id}
                    draggable
                    onDragStart={() => setDragging(student.id)}
                    onDragEnd={() => { setDragging(null); setDragOver(null) }}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 bg-white rounded-lg border border-slate-200',
                      'cursor-grab active:cursor-grabbing text-xs select-none transition-opacity',
                      dragging === student.id && 'opacity-40',
                    )}
                  >
                    <span className="text-slate-400 tabular-nums w-5 text-right shrink-0 text-[10px]">
                      {student.attendanceNumber}
                    </span>
                    <span className="text-slate-700 flex-1 truncate">
                      {student.name || '(名無し)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
