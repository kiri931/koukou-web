import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardStats } from '../../types';

type Props = {
  stats: DashboardStats;
};

export default function DashboardView({ stats }: Props) {
  const avgPercent = stats.avgRetrievability == null ? null : Math.round(stats.avgRetrievability * 1000) / 10;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">期限切れ</CardTitle>
            <CardDescription>今すぐ学習対象</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{stats.due.overdue}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">本日分</CardTitle>
            <CardDescription>今日中に復習したい件数</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{stats.due.today}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">平均保持率</CardTitle>
            <CardDescription>FSRS 推定</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{avgPercent == null ? '-' : `${avgPercent}%`}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>取り違えランキング</CardTitle>
          <CardDescription>誤答で他カードの正答を入力した組み合わせ</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.topConfusions.length === 0 ? (
            <p className="text-sm text-slate-500">まだ記録がありません。</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="px-2 py-2">回数</th>
                    <th className="px-2 py-2">ペアA</th>
                    <th className="px-2 py-2">ペアB</th>
                    <th className="px-2 py-2">dataset</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topConfusions.map((row) => (
                    <tr key={`${row.datasetId}:${row.pairKey}`} className="border-b last:border-b-0">
                      <td className="px-2 py-2 font-mono">{row.count}</td>
                      <td className="px-2 py-2">{row.labelA}</td>
                      <td className="px-2 py-2">{row.labelB}</td>
                      <td className="px-2 py-2 font-mono text-xs text-slate-500">{row.datasetId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
