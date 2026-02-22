import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type { AppSettings } from '../../types';

type Props = {
  settings: AppSettings;
  onSave: (next: Partial<AppSettings>) => Promise<unknown>;
};

export default function SettingsView({ settings, onSave }: Props) {
  const [targetRetentionRate, setTargetRetentionRate] = useState(settings.targetRetentionRate);
  const [examDate, setExamDate] = useState(settings.examDate ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTargetRetentionRate(settings.targetRetentionRate);
    setExamDate(settings.examDate ?? '');
  }, [settings]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await onSave({
        targetRetentionRate,
        examDate: examDate || null,
      });
      setMessage('設定を保存しました。');
    } catch (err) {
      setError(err instanceof Error ? err.message : '設定保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>設定</CardTitle>
        <CardDescription>目標保持率と試験日を設定し、復習間隔に反映します。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>目標保持率</Label>
            <span className="font-mono text-sm">{(targetRetentionRate * 100).toFixed(0)}%</span>
          </div>
          <Slider
            min={0.7}
            max={0.97}
            step={0.01}
            value={[targetRetentionRate]}
            onValueChange={([value]) => setTargetRetentionRate(value)}
          />
          <p className="text-xs text-slate-500">0.70〜0.97 の範囲。高いほど短い間隔で復習します。</p>
        </section>

        <section className="space-y-2">
          <Label htmlFor="anki-exam-date">試験日</Label>
          <input
            id="anki-exam-date"
            type="date"
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={examDate}
            onChange={(event) => setExamDate(event.target.value)}
          />
          <p className="text-xs text-slate-500">設定すると、間隔が試験日を超えにくいように調整されます。</p>
        </section>

        <div className="flex items-center gap-2">
          <Button onClick={save} disabled={saving} className="bg-green-600 text-white hover:bg-green-700">
            保存
          </Button>
          {message && <p className="text-sm text-green-600">{message}</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
