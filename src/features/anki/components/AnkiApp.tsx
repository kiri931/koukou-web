import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAnki } from '../hooks/useAnki';
import type { TabId } from '../types';
import DashboardView from './views/DashboardView';
import DataManagementView from './views/DataManagementView';
import HomeView from './views/HomeView';
import SettingsView from './views/SettingsView';
import StudyView from './views/StudyView';

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnkiApp() {
  const [tab, setTab] = useState<TabId>('home');
  const anki = useAnki();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 text-slate-900 dark:text-slate-100">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">覚える君</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">短答入力 × 分散復習（FSRS）で暗記を進める学習ツール</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">datasets {anki.datasets.length}</Badge>
          <Badge className="bg-green-600 text-white">due {anki.dashboard.due.overdue}</Badge>
        </div>
      </div>

      {(anki.error || anki.dbError) && (
        <Card className="mb-4 border-red-300">
          <CardContent className="pt-6 text-sm text-red-600">{anki.error ?? anki.dbError}</CardContent>
        </Card>
      )}

      {!anki.dbReady && (
        <Card>
          <CardHeader>
            <CardTitle>初期化中</CardTitle>
          </CardHeader>
          <CardContent>IndexedDB を初期化しています...</CardContent>
        </Card>
      )}

      {anki.dbReady && (
        <Tabs value={tab} onValueChange={(value) => setTab(value as TabId)}>
          <TabsList className="grid h-auto grid-cols-2 gap-1 md:grid-cols-5">
            <TabsTrigger value="home">ホーム</TabsTrigger>
            <TabsTrigger value="study">学習</TabsTrigger>
            <TabsTrigger value="dashboard">ダッシュボード</TabsTrigger>
            <TabsTrigger value="data">データ管理</TabsTrigger>
            <TabsTrigger value="settings">設定</TabsTrigger>
          </TabsList>

          <TabsContent value="home">
            <HomeView
              datasets={anki.datasets}
              dueByDataset={anki.dueByDataset}
              selectedDatasetId={anki.selectedDatasetId}
              onSelectDataset={anki.setSelectedDatasetId}
              onStartSession={anki.startSession}
              onMoveToStudy={() => setTab('study')}
            />
          </TabsContent>

          <TabsContent value="study">
            <StudyView
              datasets={anki.datasets}
              selectedDatasetId={anki.selectedDatasetId}
              onSelectDataset={anki.setSelectedDatasetId}
              session={anki.session}
              onStartSession={anki.startSession}
              onSubmitAnswer={anki.submitAnswer}
              onSubmitGrade={anki.submitGrade}
              onResetSession={anki.resetSession}
            />
          </TabsContent>

          <TabsContent value="dashboard">
            <DashboardView stats={anki.dashboard} />
          </TabsContent>

          <TabsContent value="data">
            <DataManagementView
              datasets={anki.datasets}
              onImportDataset={anki.importDataset}
              onImportBackup={anki.importBackup}
              onExportBackup={async () => {
                const backup = await anki.exportBackup();
                const stamp = new Date().toISOString().replace(/[:.]/g, '-');
                downloadJson(`anki-backup-${stamp}.json`, backup);
              }}
              onDeleteDataset={anki.deleteDataset}
              onGetCards={anki.getCardsForDataset}
              onSaveCard={anki.addOrUpdateCard}
              onDeleteCard={anki.deleteCard}
            />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsView settings={anki.settings} onSave={anki.updateSettings} />
          </TabsContent>
        </Tabs>
      )}
    </main>
  );
}
