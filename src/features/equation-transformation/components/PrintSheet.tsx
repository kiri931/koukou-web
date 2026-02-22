import { useEffect, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import type { PrintOptions } from "../types";

interface PrintSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_PRINT_OPTIONS: PrintOptions = {
  showAnswers: false,
  showExplain: false,
  showStudentInfo: true,
};

function applyPrintClasses(options: PrintOptions) {
  document.body.classList.toggle("print-show-answers", options.showAnswers);
  document.body.classList.toggle("print-show-explain", options.showExplain);
  document.body.classList.toggle("print-show-student-info", options.showStudentInfo);
}

export default function PrintSheet({ open, onOpenChange }: PrintSheetProps) {
  const [options, setOptions] = useState<PrintOptions>(DEFAULT_PRINT_OPTIONS);

  useEffect(() => {
    applyPrintClasses(options);
  }, [options]);

  const setOption = (key: keyof PrintOptions, checked: boolean) => {
    setOptions((prev) => ({ ...prev, [key]: checked }));
  };

  const handlePrint = () => {
    applyPrintClasses(options);
    onOpenChange(false);
    window.setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto w-full max-w-3xl rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>印刷設定</SheetTitle>
          <SheetDescription>印刷プレビューに含める内容を選択してください。</SheetDescription>
        </SheetHeader>

        <div className="space-y-3 px-6 pb-2">
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-800">
            <Checkbox
              id="print-option-student-info"
              checked={options.showStudentInfo}
              onCheckedChange={(checked) => setOption("showStudentInfo", checked === true)}
            />
            <label htmlFor="print-option-student-info" className="w-full cursor-pointer text-sm">
              氏名・学年欄を含める
            </label>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-800">
            <Checkbox
              id="print-option-answers"
              checked={options.showAnswers}
              onCheckedChange={(checked) => setOption("showAnswers", checked === true)}
            />
            <label htmlFor="print-option-answers" className="w-full cursor-pointer text-sm">
              解答を含める
            </label>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-800">
            <Checkbox
              id="print-option-explain"
              checked={options.showExplain}
              onCheckedChange={(checked) => setOption("showExplain", checked === true)}
            />
            <label htmlFor="print-option-explain" className="w-full cursor-pointer text-sm">
              解説を含める
            </label>
          </div>
        </div>

        <SheetFooter>
          <Button type="button" className="w-full" onClick={handlePrint}>
            印刷する
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
