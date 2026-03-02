/**
 * localStorage への保存・読み込みと JSON エクスポート/インポート
 */

import type { SekigaeData } from '../types'

const STORAGE_KEY = 'sekigae-data'

export function loadFromStorage(): SekigaeData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SekigaeData
  } catch {
    return null
  }
}

export function saveToStorage(data: SekigaeData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ストレージ容量超過等は無視
  }
}

export function exportToJson(data: SekigaeData): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'sekigae.json'
  a.click()
  URL.revokeObjectURL(url)
}

export function importFromJson(file: File): Promise<SekigaeData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target?.result as string) as SekigaeData
        resolve(data)
      } catch {
        reject(new Error('JSONの読み込みに失敗しました'))
      }
    }
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'))
    reader.readAsText(file)
  })
}
