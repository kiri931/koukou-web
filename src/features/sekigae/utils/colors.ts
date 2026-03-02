import type { SeatColor } from '../types'

// ColorString.swift の移植

export const COLOR_KEYS: SeatColor[] = [
  'gray', 'blue', 'red', 'yellow', 'green', 'orange',
  'purple', 'pink', 'cyan', 'teal', 'mint', 'indigo', 'brown',
]

// 座席設定で使えるカラー（gray を除いた選択肢）
export const SEAT_COLOR_OPTIONS: SeatColor[] = COLOR_KEYS.filter(c => c !== 'gray')

export const JAPANESE_COLOR_NAMES: Record<SeatColor, string> = {
  gray:   '灰',
  blue:   '青',
  red:    '赤',
  yellow: '黄',
  green:  '緑',
  orange: '橙',
  purple: '紫',
  pink:   'ピンク',
  cyan:   '水色',
  teal:   '青緑',
  mint:   'ミント',
  indigo: '藍',
  brown:  '茶',
}

/**
 * カラーキーに対応する Tailwind CSS クラス（背景色）
 * ColorString.uiColor と対応する識別しやすい配色
 */
export const COLOR_BG_CLASS: Record<SeatColor, string> = {
  gray:   'bg-gray-400',
  blue:   'bg-blue-500',
  red:    'bg-red-500',
  yellow: 'bg-yellow-400',
  green:  'bg-green-600',
  orange: 'bg-orange-500',
  purple: 'bg-purple-600',
  pink:   'bg-pink-500',
  cyan:   'bg-cyan-500',
  teal:   'bg-teal-500',
  mint:   'bg-emerald-500',
  indigo: 'bg-indigo-600',
  brown:  'bg-amber-800',
}

/**
 * カラーキーに対応するテキスト色クラス（ラベル等）
 */
export const COLOR_TEXT_CLASS: Record<SeatColor, string> = {
  gray:   'text-gray-600',
  blue:   'text-blue-600',
  red:    'text-red-600',
  yellow: 'text-yellow-600',
  green:  'text-green-700',
  orange: 'text-orange-600',
  purple: 'text-purple-700',
  pink:   'text-pink-600',
  cyan:   'text-cyan-600',
  teal:   'text-teal-600',
  mint:   'text-emerald-600',
  indigo: 'text-indigo-700',
  brown:  'text-amber-900',
}

/**
 * カラーキーに対応するボーダー色クラス
 */
export const COLOR_BORDER_CLASS: Record<SeatColor, string> = {
  gray:   'border-gray-400',
  blue:   'border-blue-500',
  red:    'border-red-500',
  yellow: 'border-yellow-400',
  green:  'border-green-600',
  orange: 'border-orange-500',
  purple: 'border-purple-600',
  pink:   'border-pink-500',
  cyan:   'border-cyan-500',
  teal:   'border-teal-500',
  mint:   'border-emerald-500',
  indigo: 'border-indigo-600',
  brown:  'border-amber-800',
}

export function isValidColor(value: string): value is SeatColor {
  return COLOR_KEYS.includes(value as SeatColor)
}
