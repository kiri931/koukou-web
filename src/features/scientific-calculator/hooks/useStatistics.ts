import { useMemo, useState } from 'react';
import type { StatisticsSummary } from '../types';

function parseNumber(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export function useStatistics() {
  const [draft, setDraft] = useState('');
  const [values, setValues] = useState<number[]>([]);

  const stats = useMemo<StatisticsSummary>(() => {
    const n = values.length;
    if (n === 0) return { n: 0, mean: 0, stddev: 0 };
    const sum = values.reduce((acc, value) => acc + value, 0);
    const mean = sum / n;
    const variance = values.reduce((acc, value) => acc + (value - mean) ** 2, 0) / n;
    return {
      n,
      mean,
      stddev: Math.sqrt(variance),
    };
  }, [values]);

  const addValue = (raw?: string) => {
    const source = raw ?? draft;
    const parsed = parseNumber(source);
    if (parsed === null) return false;
    setValues((prev) => [...prev, parsed]);
    if (raw === undefined) setDraft('');
    return true;
  };

  const addMany = (text: string) => {
    const parsed = text
      .split(/[\s,]+/)
      .map((token) => token.trim())
      .filter(Boolean)
      .map((token) => Number(token))
      .filter((value) => Number.isFinite(value));

    if (parsed.length === 0) return 0;
    setValues((prev) => [...prev, ...parsed]);
    return parsed.length;
  };

  const removeValueAt = (index: number) => {
    setValues((prev) => prev.filter((_, i) => i !== index));
  };

  const clearValues = () => setValues([]);

  return {
    draft,
    setDraft,
    values,
    stats,
    addValue,
    addMany,
    removeValueAt,
    clearValues,
  };
}
