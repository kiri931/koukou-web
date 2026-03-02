// ---- カラー ----

export const SEAT_COLORS = [
  'gray',
  'blue',
  'red',
  'yellow',
  'green',
  'orange',
  'purple',
  'pink',
  'cyan',
  'teal',
  'mint',
  'indigo',
  'brown',
] as const

export type SeatColor = (typeof SEAT_COLORS)[number]

// ---- 生徒 ----

export interface Student {
  id: string
  attendanceNumber: number
  name: string
  color: SeatColor
}

// ---- 座席 ----

export interface Seat {
  id: string
  x: number // 列 (0-based)
  y: number // 行 (0-based)
  color: SeatColor
}

// ---- グループ ----

export interface ClassGroup {
  id: string
  name: string
  color: SeatColor // 内部的な色（自動割り当て）
}

// ---- 座席スタイル ----

export type SeatSize = 'sm' | 'md' | 'lg'
export type SeatCorner = 'none' | 'sm' | 'md' | 'lg'
export type SeatFontSize = 'xs' | 'sm' | 'md' | 'lg'
export type SeatNameColor = 'group' | 'black' | 'gray'

export interface SeatStyle {
  size: SeatSize
  corner: SeatCorner
  fontSize: SeatFontSize
  nameColor: SeatNameColor
}

// チート設定: seatIndex (string) → studentId (string)
export type CheatAssignments = Record<string, string>

// ---- 設定 ----

export interface ClassConfig {
  rows: number // 行数 (1〜10)
  cols: number // 列数 (1〜10)
  isColorMatch: boolean // グループマッチング有効
  groups: ClassGroup[] // ユーザー定義グループ
  seatStyle: SeatStyle // 座席の見た目
  cheatEnabled: boolean // チート設定有効
  cheatAssignments: CheatAssignments // 事前決定席 (seatIndex → studentId)
}

// ---- 席替え結果 ----
// seatList の各インデックスに対応する Student（空席は null）
export type SeatAssignment = (Student | null)[]

// ---- 保存データ全体 ----

export interface SekigaeData {
  students: Student[]
  seats: Seat[]
  config: ClassConfig
}
