/**
 * SeatChanger.swift の TypeScript 移植
 *
 * 座席グリッドへの生徒割り当てロジック。
 * グレー座席 = 無効席（生徒を割り当てない）。
 * カラーマッチング有効時: 座席の色と同じ色の生徒を優先配置。
 * カラーマッチング無効時: 全座席を blue 扱いとして全生徒を割り当て可能にする。
 */

import type { Seat, SeatAssignment, Student } from '../types'

/** Fisher-Yates シャッフル */
function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ---- 内部コア ----

/**
 * orderedSeats の順序で生徒を割り当て、originalSeats のグリッド順（y*cols+x）で返す。
 */
function assignOrdered(
  orderedSeats: Seat[],
  originalSeats: Seat[],
  students: Student[],
  rows: number,
  cols: number,
  colorMatch: boolean,
): SeatAssignment {
  const working = [...students]
  const seatStudentMap = new Map<string, Student | null>()

  for (const seat of orderedSeats) {
    if (seat.color === 'gray') {
      seatStudentMap.set(seat.id, null)
      continue
    }
    if (colorMatch) {
      const idx = working.findIndex(s => s.color === seat.color)
      seatStudentMap.set(seat.id, idx !== -1 ? (working.splice(idx, 1)[0] ?? null) : null)
    } else {
      seatStudentMap.set(seat.id, working.shift() ?? null)
    }
  }

  // グリッド順（y * cols + x）に並べ直して返す
  const gridSize = rows * cols
  const result: SeatAssignment = Array(gridSize).fill(null)
  for (const seat of originalSeats.slice(0, gridSize)) {
    const idx = seat.y * cols + seat.x
    if (idx >= 0 && idx < gridSize) {
      result[idx] = seatStudentMap.get(seat.id) ?? null
    }
  }
  return result
}

type SortMode = 'leftToRight' | 'rightToLeft' | 'topToBottom' | 'topToBottomRight'

/**
 * 座席を指定の読み順でソートして返す（グレーは末尾）。
 */
function sortSeats(seats: Seat[], mode: SortMode): Seat[] {
  const active = seats.filter(s => s.color !== 'gray')
  const gray = seats.filter(s => s.color === 'gray')

  active.sort((a, b) => {
    switch (mode) {
      case 'leftToRight':      return a.y !== b.y ? a.y - b.y : a.x - b.x
      case 'rightToLeft':     return a.y !== b.y ? a.y - b.y : b.x - a.x
      case 'topToBottom':      return a.x !== b.x ? a.x - b.x : a.y - b.y
      case 'topToBottomRight': return a.x !== b.x ? b.x - a.x : a.y - b.y
    }
  })

  return [...active, ...gray]
}

// ---- 公開 API ----

/**
 * ランダム席替え
 */
export function randomAssign(
  seats: Seat[],
  students: Student[],
  rows: number,
  cols: number,
  colorMatch: boolean,
): SeatAssignment {
  const gridSeats = seats.slice(0, rows * cols)
  const shuffledStudents = shuffled(students)
  return assignOrdered(gridSeats, gridSeats, shuffledStudents, rows, cols, colorMatch)
}

/**
 * 出席番号順（左→右、上→下）
 */
export function attendanceNumberSeat(
  rows: number,
  cols: number,
  seats: Seat[],
  students: Student[],
  colorMatch: boolean,
): SeatAssignment {
  const gridSeats = seats.slice(0, rows * cols)
  const ordered = sortSeats(gridSeats, 'leftToRight')
  return assignOrdered(ordered, gridSeats, students, rows, cols, colorMatch)
}

/**
 * 出席番号順（上→下、左→右）縦読み
 */
export function attendanceNumberSeatTate(
  rows: number,
  cols: number,
  seats: Seat[],
  students: Student[],
  colorMatch: boolean,
): SeatAssignment {
  const gridSeats = seats.slice(0, rows * cols)
  const ordered = sortSeats(gridSeats, 'topToBottom')
  return assignOrdered(ordered, gridSeats, students, rows, cols, colorMatch)
}

/**
 * 出席番号順（左→右）右前配置（右列から割り当て）
 */
export function attendanceNumberSeatRightFront(
  rows: number,
  cols: number,
  seats: Seat[],
  students: Student[],
  colorMatch: boolean,
): SeatAssignment {
  const gridSeats = seats.slice(0, rows * cols)
  const ordered = sortSeats(gridSeats, 'rightToLeft')
  return assignOrdered(ordered, gridSeats, students, rows, cols, colorMatch)
}

/**
 * 出席番号順（上→下）縦読み右前配置
 */
export function attendanceNumberSeatRightFrontTate(
  rows: number,
  cols: number,
  seats: Seat[],
  students: Student[],
  colorMatch: boolean,
): SeatAssignment {
  const gridSeats = seats.slice(0, rows * cols)
  const ordered = sortSeats(gridSeats, 'topToBottomRight')
  return assignOrdered(ordered, gridSeats, students, rows, cols, colorMatch)
}
