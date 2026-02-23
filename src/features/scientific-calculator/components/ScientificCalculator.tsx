import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';
import CalcDisplay from './CalcDisplay';
import CalcKeypad from './CalcKeypad';
import DmsPanel from './DmsPanel';
import HelpSheet from './HelpSheet';
import StatisticsPanel from './StatisticsPanel';
import { useCalculator } from '../hooks/useCalculator';

export default function ScientificCalculator() {
  const [helpOpen, setHelpOpen] = useState(false);
  const {
    state,
    dms,
    dmsError,
    displayExpression,
    parenBalance,
    pressButton,
    setPanelMode,
    setDmsField,
    applyDmsToExpression,
    calculateDmsTrig,
  } = useCalculator();

  return (
    <TooltipProvider delayDuration={500} skipDelayDuration={100}>
      <main className="mx-auto max-w-5xl px-4 py-8 text-slate-900 dark:text-slate-100">
        <Card className="border-violet-200/80 bg-white/95 dark:border-violet-900/40 dark:bg-slate-900/70">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">関数電卓</CardTitle>
                <CardDescription>
                  日本のビジネス計算実務検定向けの物理電卓風ツール（クライアントサイド動作）
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-violet-600 text-white hover:bg-violet-600">STUDY</Badge>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  onClick={() => setHelpOpen(true)}
                  aria-label="使い方ガイドを開く"
                >
                  <HelpCircle className="size-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <CalcDisplay
              expression={displayExpression}
              result={state.result}
              angleMode={state.angleMode}
              shiftActive={state.shiftActive}
              memory={state.memory}
              parenBalance={parenBalance}
              hasError={state.hasError}
            />

            {state.panelMode === 'dms' && (
              <DmsPanel
                dms={dms}
                shiftActive={state.shiftActive}
                onChangeField={setDmsField}
                onConvert={applyDmsToExpression}
                onTrig={calculateDmsTrig}
                onClose={() => setPanelMode('none')}
                error={dmsError}
              />
            )}

            <CalcKeypad shiftActive={state.shiftActive} angleMode={state.angleMode} onPress={pressButton} />
          </CardContent>
        </Card>

        <HelpSheet open={helpOpen} onOpenChange={setHelpOpen} />
        <StatisticsPanel open={state.panelMode === 'stats'} onOpenChange={(open) => setPanelMode(open ? 'stats' : 'none')} />
      </main>
    </TooltipProvider>
  );
}
