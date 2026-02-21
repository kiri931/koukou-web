export interface Task {
  id: string;
  name: string;
  duration: number; // 分
  color: string;
}

export const DEFAULT_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
];
