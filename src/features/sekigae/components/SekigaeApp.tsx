/**
 * 席替えアプリ ルートコンポーネント
 * タブナビゲーション: 席替え | 名簿 | グループ | 設定
 */

import { useRef, useState } from 'react'
import { Download, Upload, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSekigae } from '../hooks/useSekigae'
import { StudentListTab } from './StudentListTab'
import { SeatGridPanel } from './SeatGridPanel'
import { GroupPoolView } from './GroupPoolView'
import { RosterView } from './RosterView'
import { SettingsView } from './SettingsView'

type AppView = 'seating' | 'roster' | 'groups' | 'settings'

const VIEWS: { id: AppView; label: string }[] = [
  { id: 'seating',  label: '席替え' },
  { id: 'roster',   label: '名簿' },
  { id: 'groups',   label: 'グループ' },
  { id: 'settings', label: '設定' },
]

export function SekigaeApp() {
  const state = useSekigae()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [view, setView] = useState<AppView>('seating')

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await state.importData(file)
      e.target.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 -m-4 sm:-m-6 flex flex-col">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-100 shadow-sm shrink-0">
        {/* Top bar: logo + buttons */}
        <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🪑</span>
            <h1 className="text-base font-bold text-slate-800">席替えアプリ</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={state.exportData}
              title="JSONファイルとして保存"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">保存</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              title="JSONファイルから読み込み"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">読込</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
              onClick={state.resetToDemo}
              title="デモデータにリセット"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">リセット</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileImport}
            />
          </div>
        </div>

        {/* Tab navigation */}
        <div className="px-4 sm:px-6 flex gap-0 border-t border-slate-100">
          {VIEWS.map(v => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className={cn(
                'px-4 py-2 text-sm border-b-2 transition-colors -mb-px',
                view === v.id
                  ? 'border-indigo-500 text-indigo-700 font-medium'
                  : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300',
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {/* 席替えビュー: 2ペインレイアウト */}
        {view === 'seating' && (
          <div className="flex gap-4 p-4 max-w-[1200px] mx-auto h-full">
            {/* 名簿サイドバー */}
            <aside className="w-64 shrink-0">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 h-full flex flex-col">
                <StudentListTab
                  students={state.students}
                  config={state.config}
                  addStudent={state.addStudent}
                  removeStudent={state.removeStudent}
                  updateStudentName={state.updateStudentName}
                  updateStudentNumber={state.updateStudentNumber}
                  renumberAttendance={state.renumberAttendance}
                  applyNamesFromText={state.applyNamesFromText}
                  setStudentGroup={state.setStudentGroup}
                />
              </div>
            </aside>

            {/* 座席グリッドメイン */}
            <main className="flex-1 min-w-0 overflow-y-auto">
              <SeatGridPanel
                students={state.students}
                seats={state.seats}
                config={state.config}
                assignment={state.assignment}
                cycleSeatGroup={state.cycleSeatGroup}
                updateGridSize={state.updateGridSize}
                updateColorMatch={state.updateColorMatch}
                addGroup={state.addGroup}
                removeGroup={state.removeGroup}
                updateGroupName={state.updateGroupName}
                execRandomAssign={state.execRandomAssign}
                execAttendanceOrder={state.execAttendanceOrder}
                clearAssignment={state.clearAssignment}
                swapAssignment={state.swapAssignment}
              />
            </main>
          </div>
        )}

        {/* 名簿ビュー */}
        {view === 'roster' && (
          <div className="p-4 max-w-[1200px] mx-auto overflow-y-auto h-full">
            <RosterView
              students={state.students}
              config={state.config}
              addStudent={state.addStudent}
              removeStudent={state.removeStudent}
              updateStudentName={state.updateStudentName}
              updateStudentNumber={state.updateStudentNumber}
              renumberAttendance={state.renumberAttendance}
              applyNamesFromText={state.applyNamesFromText}
              setStudentGroup={state.setStudentGroup}
            />
          </div>
        )}

        {/* グループビュー */}
        {view === 'groups' && (
          <div className="p-4 max-w-[1200px] mx-auto overflow-y-auto h-full">
            <GroupPoolView
              students={state.students}
              config={state.config}
              setStudentGroup={state.setStudentGroup}
            />
          </div>
        )}

        {/* 設定ビュー */}
        {view === 'settings' && (
          <div className="p-4 max-w-[1200px] mx-auto overflow-y-auto h-full">
            <SettingsView
              students={state.students}
              seats={state.seats}
              config={state.config}
              updateSeatStyle={state.updateSeatStyle}
              setCheatEnabled={state.setCheatEnabled}
              setCheatAssignment={state.setCheatAssignment}
              clearCheatAssignments={state.clearCheatAssignments}
            />
          </div>
        )}
      </div>
    </div>
  )
}
