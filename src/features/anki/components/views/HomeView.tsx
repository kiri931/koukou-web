import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DatasetSummary } from '../../types';

type Props = {
  datasets: DatasetSummary[];
  dueByDataset: Record<string, number>;
  selectedDatasetId: string | null;
  onSelectDataset: (datasetId: string) => void;
  onStartSession: (datasetId: string) => Promise<void> | void;
  onMoveToStudy: () => void;
};

export default function HomeView(props: Props) {
  const { datasets, dueByDataset, selectedDatasetId, onSelectDataset, onStartSession, onMoveToStudy } = props;

  if (datasets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ホーム</CardTitle>
          <CardDescription>まずはデータ管理タブからデータセットJSONをインポートしてください。</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onMoveToStudy} variant="outline">学習タブへ</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>クイックスタート</CardTitle>
          <CardDescription>データセットを選んで、期限切れカードから学習を開始します。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {datasets.map((dataset) => {
            const isSelected = selectedDatasetId === dataset.datasetId;
            return (
              <Button
                key={dataset.datasetId}
                variant={isSelected ? 'default' : 'outline'}
                className={isSelected ? 'bg-green-600 text-white hover:bg-green-700' : ''}
                onClick={() => onSelectDataset(dataset.datasetId)}
              >
                {dataset.title}
              </Button>
            );
          })}
          {selectedDatasetId && (
            <Button
              onClick={async () => {
                await onStartSession(selectedDatasetId);
                onMoveToStudy();
              }}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              学習開始
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {datasets.map((dataset) => (
          <Card key={dataset.datasetId} className={selectedDatasetId === dataset.datasetId ? 'border-green-400' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">{dataset.title}</CardTitle>
                  <CardDescription>{dataset.description || '説明なし'}</CardDescription>
                </div>
                <Badge variant="secondary">due {dueByDataset[dataset.datasetId] ?? 0}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{dataset.cardCount} cards</Badge>
                {(dataset.tags ?? []).slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline">#{tag}</Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onSelectDataset(dataset.datasetId)}>選択</Button>
                <Button
                  onClick={async () => {
                    onSelectDataset(dataset.datasetId);
                    await onStartSession(dataset.datasetId);
                    onMoveToStudy();
                  }}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  学習開始
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
