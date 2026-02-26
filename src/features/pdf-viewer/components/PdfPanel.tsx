import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PdfPanelProps {
  pdfUrl: string;
}

export function PdfPanel({ pdfUrl }: PdfPanelProps) {
  const [failed, setFailed] = useState(false);
  const iframeSrc = pdfUrl
    ? `${pdfUrl}#page=1&zoom=page-width&view=FitH&pagemode=none&navpanes=0`
    : '';

  useEffect(() => {
    setFailed(false);
  }, [pdfUrl]);

  if (!pdfUrl) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base">PDF Viewer</CardTitle>
          <CardDescription>クイズを読み込むと PDF を表示します。</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="h-full gap-4">
      <CardHeader>
        <CardTitle className="text-base">PDF Viewer</CardTitle>
        <CardDescription>表示できない場合は別タブで開いてください。</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {!failed && (
          <iframe
            title="Quiz PDF"
            src={iframeSrc}
            className="min-h-[72vh] w-full flex-1 rounded-md border bg-white"
            onError={() => setFailed(true)}
          />
        )}
        <div className="flex items-center justify-between gap-2 rounded-md border border-dashed p-3 text-sm">
          <span>{failed ? 'PDFの埋め込み表示に失敗しました。' : 'PDFが表示されない場合はこちら'}</span>
          <Button asChild variant="outline" size="sm">
            <a href={pdfUrl} target="_blank" rel="noreferrer noopener">
              別タブで開く
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
