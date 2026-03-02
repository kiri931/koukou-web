/**
 * 席替えアプリ グローバル状態管理 hook
 *
 * useRef で最新値を追跡し、useEffect で localStorage への自動保存を行う。
 * 各操作関数は deps が最小限で済み、stale closure を起こさない。
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ClassConfig, ClassGroup, Seat, SeatAssignment, SeatColor, SeatFontSize, SeatNameColor, SeatStyle, SekigaeData, Student } from '../types'
import {
  attendanceNumberSeat,
  attendanceNumberSeatRightFront,
  attendanceNumberSeatRightFrontTate,
  attendanceNumberSeatTate,
  randomAssign,
} from '../utils/seatChanger'
import { parseNamesFromClipboardText } from '../utils/sheetPaste'
import { exportToJson, importFromJson, loadFromStorage, saveToStorage } from './useStorage'

// ---- デモデータ ----

const DEMO_NAMES = [
  '足立', '荒牧', '安楽', '井上', '伊藤', '江口', '大久保', '小川',
  '加藤', '佐々木', '佐藤', '鈴木', '高橋', '田中', '中村', '西村',
  '橋本', '林', '藤田', '前田', '松本', '村上', '山口', '山田',
  '横山', '吉田', '渡辺', '石田', '岡田', '斉藤',
]

function makeDemoStudents(): Student[] {
  return DEMO_NAMES.map((name, i) => ({
    id: crypto.randomUUID(),
    attendanceNumber: i + 1,
    name,
    color: 'blue' as SeatColor,
  }))
}

function makeDefaultSeats(rows: number, cols: number): Seat[] {
  const seats: Seat[] = []
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      seats.push({ id: crypto.randomUUID(), x, y, color: 'blue' })
    }
  }
  return seats
}

// グループに自動割り当てする色パレット（blue と gray を除く）
const GROUP_COLOR_PALETTE: SeatColor[] = [
  'red', 'yellow', 'green', 'orange', 'purple', 'pink', 'cyan', 'teal', 'mint', 'indigo', 'brown',
]

const DEFAULT_SEAT_STYLE: SeatStyle = { size: 'md', corner: 'md', fontSize: 'sm', nameColor: 'group' }

const DEFAULT_CONFIG: ClassConfig = {
  rows: 5,
  cols: 6,
  isColorMatch: false,
  groups: [],
  seatStyle: DEFAULT_SEAT_STYLE,
  cheatEnabled: false,
  cheatAssignments: {},
}

function makeInitialData(): SekigaeData {
  return {
    students: makeDemoStudents(),
    seats: makeDefaultSeats(DEFAULT_CONFIG.rows, DEFAULT_CONFIG.cols),
    config: DEFAULT_CONFIG,
  }
}

export type AttendanceMode =
  | 'leftToRight'
  | 'topToBottom'
  | 'rightToLeft'
  | 'topToBottomRight'

// ---- Hook ----

export function useSekigae() {
  const [students, setStudents] = useState<Student[]>([])
  const [seats, setSeats] = useState<Seat[]>([])
  const [config, setConfig] = useState<ClassConfig>(DEFAULT_CONFIG)
  const [assignment, setAssignment] = useState<SeatAssignment | null>(null)

  // 最新値を ref で追跡（useCallback の deps を最小化するため）
  const studentsRef = useRef(students)
  const seatsRef = useRef(seats)
  const configRef = useRef(config)
  studentsRef.current = students
  seatsRef.current = seats
  configRef.current = config

  // 初期ロード
  useEffect(() => {
    const saved = loadFromStorage()
    if (saved) {
      // マイグレーション: 古いデータに不足しているフィールドを補完
      const config: ClassConfig = {
        ...saved.config,
        groups: saved.config.groups ?? [],
        seatStyle: {
          ...DEFAULT_SEAT_STYLE,
          ...saved.config.seatStyle,
        },
        cheatEnabled: saved.config.cheatEnabled ?? false,
        cheatAssignments: saved.config.cheatAssignments ?? {},
      }
      setStudents(saved.students)
      setSeats(saved.seats)
      setConfig(config)
    } else {
      const initial = makeInitialData()
      setStudents(initial.students)
      setSeats(initial.seats)
      setConfig(initial.config)
    }
  }, [])

  // 自動保存（students / seats / config が変わるたびに実行）
  useEffect(() => {
    if (students.length === 0 && seats.length === 0) return // 初期ロード前は保存しない
    saveToStorage({ students, seats, config })
  }, [students, seats, config])

  // ---- 生徒操作 ----

  const addStudent = useCallback((afterIndex: number) => {
    setStudents(prev => {
      const next = [...prev]
      next.splice(afterIndex + 1, 0, {
        id: crypto.randomUUID(),
        attendanceNumber: 0,
        name: '',
        color: 'blue',
      })
      return next
    })
  }, [])

  const removeStudent = useCallback((index: number) => {
    setStudents(prev => {
      if (index < 0 || index >= prev.length) return prev
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  const updateStudentName = useCallback((index: number, name: string) => {
    setStudents(prev => prev.map((s, i) => i === index ? { ...s, name } : s))
  }, [])

  const updateStudentColor = useCallback((index: number, color: SeatColor) => {
    setStudents(prev => prev.map((s, i) => i === index ? { ...s, color } : s))
  }, [])

  const updateStudentNumber = useCallback((index: number, num: number) => {
    setStudents(prev => prev.map((s, i) => i === index ? { ...s, attendanceNumber: num } : s))
  }, [])

  const renumberAttendance = useCallback(() => {
    setStudents(prev => prev.map((s, i) => ({ ...s, attendanceNumber: i + 1 })))
  }, [])

  const applyNamesFromText = useCallback((text: string) => {
    const names = parseNamesFromClipboardText(text)
    setStudents(prev => prev.map((s, i) => i < names.length ? { ...s, name: names[i] } : s))
  }, [])

  // ---- 座席操作 ----

  const toggleSeatActive = useCallback((seatId: string) => {
    setSeats(prev =>
      prev.map(s =>
        s.id === seatId
          ? { ...s, color: (s.color === 'gray' ? 'blue' : 'gray') as SeatColor }
          : s,
      ),
    )
  }, [])

  const updateSeatColor = useCallback((seatId: string, color: SeatColor) => {
    setSeats(prev => prev.map(s => s.id === seatId ? { ...s, color } : s))
  }, [])

  // グループ定義のクリックサイクル:
  //   グループ未定義 → gray ↔ blue トグル
  //   グループ定義あり → gray → blue(なし) → group1 → group2 → ... → gray
  const cycleSeatGroup = useCallback((seatId: string) => {
    setSeats(prev => prev.map(seat => {
      if (seat.id !== seatId) return seat
      const groups = configRef.current.groups

      if (groups.length === 0) {
        return { ...seat, color: (seat.color === 'gray' ? 'blue' : 'gray') as SeatColor }
      }

      if (seat.color === 'gray') {
        return { ...seat, color: 'blue' as SeatColor }
      }
      const currentGroupIdx = groups.findIndex(g => g.color === seat.color)
      if (currentGroupIdx === -1) {
        // blue (なし) → 最初のグループ
        return { ...seat, color: groups[0].color }
      }
      if (currentGroupIdx < groups.length - 1) {
        // 次のグループ
        return { ...seat, color: groups[currentGroupIdx + 1].color }
      }
      // 最後のグループ → 無効化
      return { ...seat, color: 'gray' as SeatColor }
    }))
  }, [])

  // ---- グリッドサイズ変更 ----

  const updateGridSize = useCallback((rows: number, cols: number) => {
    const r = Math.max(1, Math.min(10, rows))
    const c = Math.max(1, Math.min(10, cols))
    setSeats(prevSeats => {
      const newSeats: Seat[] = []
      for (let y = 0; y < r; y++) {
        for (let x = 0; x < c; x++) {
          const existing = prevSeats.find(s => s.x === x && s.y === y)
          newSeats.push(existing ?? { id: crypto.randomUUID(), x, y, color: 'blue' })
        }
      }
      return newSeats
    })
    setConfig(prev => ({ ...prev, rows: r, cols: c }))
  }, [])

  const updateColorMatch = useCallback((isColorMatch: boolean) => {
    setConfig(prev => ({ ...prev, isColorMatch }))
  }, [])

  // ---- グループ管理 ----

  const addGroup = useCallback(() => {
    setConfig(prev => {
      if (prev.groups.length >= GROUP_COLOR_PALETTE.length) return prev
      const usedColors = prev.groups.map(g => g.color)
      const color = GROUP_COLOR_PALETTE.find(c => !usedColors.includes(c)) ?? 'red'
      const newGroup: ClassGroup = {
        id: crypto.randomUUID(),
        name: `グループ${prev.groups.length + 1}`,
        color,
      }
      return { ...prev, groups: [...prev.groups, newGroup] }
    })
  }, [])

  const removeGroup = useCallback((groupId: string) => {
    const group = configRef.current.groups.find(g => g.id === groupId)
    if (!group) return
    const groupColor = group.color
    setConfig(prev => ({ ...prev, groups: prev.groups.filter(g => g.id !== groupId) }))
    setStudents(prev => prev.map(s => s.color === groupColor ? { ...s, color: 'blue' as SeatColor } : s))
    setSeats(prev => prev.map(s => s.color === groupColor ? { ...s, color: 'blue' as SeatColor } : s))
  }, [])

  const updateGroupName = useCallback((groupId: string, name: string) => {
    setConfig(prev => ({
      ...prev,
      groups: prev.groups.map(g => g.id === groupId ? { ...g, name } : g),
    }))
  }, [])

  const setStudentGroup = useCallback((index: number, groupId: string | null) => {
    const color = groupId
      ? (configRef.current.groups.find(g => g.id === groupId)?.color ?? 'blue')
      : 'blue'
    setStudents(prev => prev.map((s, i) => i === index ? { ...s, color: color as SeatColor } : s))
  }, [])

  // ---- 座席スタイル ----

  const updateSeatStyle = useCallback((updates: Partial<SeatStyle>) => {
    setConfig(prev => ({
      ...prev,
      seatStyle: { ...prev.seatStyle, ...updates },
    }))
  }, [])

  // ---- チート設定 ----

  const setCheatEnabled = useCallback((enabled: boolean) => {
    setConfig(prev => ({ ...prev, cheatEnabled: enabled }))
  }, [])

  const setCheatAssignment = useCallback((seatIdx: number, studentId: string | null) => {
    setConfig(prev => {
      const next = { ...prev.cheatAssignments }
      if (studentId === null) {
        delete next[String(seatIdx)]
      } else {
        next[String(seatIdx)] = studentId
      }
      return { ...prev, cheatAssignments: next }
    })
  }, [])

  const clearCheatAssignments = useCallback(() => {
    setConfig(prev => ({ ...prev, cheatAssignments: {} }))
  }, [])

  // ---- 席替え ----

  const execRandomAssign = useCallback(() => {
    const s = studentsRef.current
    const allSeats = seatsRef.current
    const cfg = configRef.current
    const gridSeats = allSeats.slice(0, cfg.rows * cfg.cols)

    if (cfg.cheatEnabled && Object.keys(cfg.cheatAssignments).length > 0) {
      // チートモード: 事前決定席を優先配置し、残りをランダムで埋める
      const result: (Student | null)[] = new Array(gridSeats.length).fill(null)
      const usedIds = new Set<string>()

      for (const [idxStr, studentId] of Object.entries(cfg.cheatAssignments)) {
        const idx = parseInt(idxStr)
        if (!isNaN(idx) && idx < gridSeats.length && gridSeats[idx].color !== 'gray') {
          const student = s.find(st => st.id === studentId)
          if (student && !usedIds.has(student.id)) {
            result[idx] = student
            usedIds.add(student.id)
          }
        }
      }

      const remaining = s.filter(st => !usedIds.has(st.id))
      const emptyActive = gridSeats
        .map((seat, i) => ({ seat, i }))
        .filter(({ seat, i }) => seat.color !== 'gray' && result[i] === null)
        .map(({ i }) => i)

      // Fisher-Yates shuffle
      for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[remaining[i], remaining[j]] = [remaining[j], remaining[i]]
      }

      remaining.slice(0, emptyActive.length).forEach((st, i) => {
        result[emptyActive[i]] = st
      })

      setAssignment(result)
    } else {
      setAssignment(randomAssign(allSeats, s, cfg.rows, cfg.cols, cfg.isColorMatch))
    }
  }, [])

  const execAttendanceOrder = useCallback((mode: AttendanceMode) => {
    const s = studentsRef.current
    const seats = seatsRef.current
    const cfg = configRef.current
    let result: SeatAssignment
    switch (mode) {
      case 'leftToRight':
        result = attendanceNumberSeat(cfg.rows, cfg.cols, seats, s, cfg.isColorMatch); break
      case 'topToBottom':
        result = attendanceNumberSeatTate(cfg.rows, cfg.cols, seats, s, cfg.isColorMatch); break
      case 'rightToLeft':
        result = attendanceNumberSeatRightFront(cfg.rows, cfg.cols, seats, s, cfg.isColorMatch); break
      case 'topToBottomRight':
        result = attendanceNumberSeatRightFrontTate(cfg.rows, cfg.cols, seats, s, cfg.isColorMatch); break
    }
    setAssignment(result)
  }, [])

  const clearAssignment = useCallback(() => setAssignment(null), [])

  const swapAssignment = useCallback((fromIdx: number, toIdx: number) => {
    setAssignment(prev => {
      if (!prev) return prev
      const next = [...prev]
      ;[next[fromIdx], next[toIdx]] = [next[toIdx], next[fromIdx]]
      return next
    })
  }, [])

  // ---- データ入出力 ----

  const exportData = useCallback(() => {
    exportToJson({
      students: studentsRef.current,
      seats: seatsRef.current,
      config: configRef.current,
    })
  }, [])

  const importData = useCallback(async (file: File) => {
    const data = await importFromJson(file)
    setStudents(data.students)
    setSeats(data.seats)
    setConfig(data.config)
    setAssignment(null)
  }, [])

  const resetToDemo = useCallback(() => {
    const initial = makeInitialData()
    setStudents(initial.students)
    setSeats(initial.seats)
    setConfig(initial.config)
    setAssignment(null)
  }, [])

  return {
    students,
    seats,
    config,
    assignment,

    addStudent,
    removeStudent,
    updateStudentName,
    updateStudentColor,
    updateStudentNumber,
    renumberAttendance,
    applyNamesFromText,

    toggleSeatActive,
    updateSeatColor,
    cycleSeatGroup,
    updateGridSize,
    updateColorMatch,
    addGroup,
    removeGroup,
    updateGroupName,
    setStudentGroup,

    updateSeatStyle,
    setCheatEnabled,
    setCheatAssignment,
    clearCheatAssignments,

    execRandomAssign,
    execAttendanceOrder,
    clearAssignment,
    swapAssignment,

    exportData,
    importData,
    resetToDemo,

    gridSeats: seats.slice(0, config.rows * config.cols),
  }
}
