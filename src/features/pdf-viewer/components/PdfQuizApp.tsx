import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useQuizStore } from '../hooks/useQuizStore';
import { StudentView } from './StudentView';
import { TeacherView } from './TeacherView';

export default function PdfQuizApp() {
  const store = useQuizStore();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 text-slate-900 dark:text-slate-100">
      <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
        このページは大幅改修中につき、使用しないでください。
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">PDF Quiz アプリ</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          教師はPDF URLと問題をJSON化し、生徒はブラウザ上でPDFを見ながら解答・採点できます。
        </p>
      </div>

      <Tabs defaultValue="teacher" className="gap-4">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
          <TabsTrigger
            value="teacher"
            className="flex-none rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs data-[state=active]:border-slate-900 data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:border-slate-700 dark:bg-slate-900/70 dark:data-[state=active]:border-slate-100 dark:data-[state=active]:bg-slate-100 dark:data-[state=active]:text-slate-900"
          >
            教師モード
          </TabsTrigger>
          <TabsTrigger
            value="student"
            className="flex-none rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs data-[state=active]:border-slate-900 data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:border-slate-700 dark:bg-slate-900/70 dark:data-[state=active]:border-slate-100 dark:data-[state=active]:bg-slate-100 dark:data-[state=active]:text-slate-900"
          >
            生徒モード
          </TabsTrigger>
        </TabsList>

        <TabsContent value="teacher">
          <TeacherView store={store} />
        </TabsContent>
        <TabsContent value="student">
          <StudentView />
        </TabsContent>
      </Tabs>
    </main>
  );
}
