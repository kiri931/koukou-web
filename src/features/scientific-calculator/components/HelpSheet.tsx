import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

type HelpItem = {
  label: string;
  description: string;
  shiftLabel?: string;
  shiftDescription?: string;
};

type HelpSection = {
  title: string;
  items: HelpItem[];
};

const HELP_SECTIONS: HelpSection[] = [
  {
    title: 'モード・操作',
    items: [
      {
        label: 'SHIFT',
        description: '青いドット付きボタンの副機能を有効にします。もう一度押すと解除します。',
      },
      {
        label: 'DEG / RAD',
        description: '角度単位を度数法(DEG)とラジアン(RAD)で切り替えます。例: sin(30)=0.5 は DEG。',
      },
      {
        label: 'DMS',
        description: '度・分・秒の入力パネルを開きます。例: 35°41\'22\" を角度として入力。',
      },
      {
        label: 'STAT',
        description: '統計処理パネルを開きます。複数データから平均や標準偏差を計算できます。',
      },
      {
        label: 'AC',
        description: '入力中の式と結果を全てクリアします。エラー表示の解除にも使います。',
      },
      {
        label: 'DEL',
        description: '式の末尾1文字を削除します。例: 12+3 → 12+。',
      },
    ],
  },
  {
    title: 'メモリ',
    items: [
      { label: 'MC', description: 'メモリをクリアします。保存していた値を 0 に戻します。' },
      { label: 'MR', description: 'メモリの値を呼び出して式に挿入します。' },
      { label: 'M+', description: '現在の結果をメモリへ加算します。例: 結果10のとき M+ で +10。' },
      { label: 'M-', description: '現在の結果をメモリから減算します。例: 結果3のとき M- で -3。' },
    ],
  },
  {
    title: '三角関数',
    items: [
      {
        label: 'sin',
        description: '正弦（サイン）を計算します。例: sin(30) = 0.5（DEGモード）',
        shiftLabel: 'sin⁻¹',
        shiftDescription: '逆正弦（アークサイン）を計算します。例: sin⁻¹(0.5) = 30°',
      },
      {
        label: 'cos',
        description: '余弦（コサイン）を計算します。例: cos(60) = 0.5（DEGモード）',
        shiftLabel: 'cos⁻¹',
        shiftDescription: '逆余弦（アークコサイン）を計算します。例: cos⁻¹(0.5) = 60°',
      },
      {
        label: 'tan',
        description: '正接（タンジェント）を計算します。例: tan(45) = 1（DEGモード）',
        shiftLabel: 'tan⁻¹',
        shiftDescription: '逆正接（アークタンジェント）を計算します。例: tan⁻¹(1) = 45°',
      },
      { label: 'π', description: '円周率 π を入力します。例: 2 × π ≈ 6.28318' },
      { label: 'e', description: '自然対数の底 e を入力します。例: ln(e) = 1' },
    ],
  },
  {
    title: 'べき乗・対数',
    items: [
      {
        label: 'x²',
        description: '2乗を入力します。例: 5 x² = 25',
        shiftLabel: 'x³',
        shiftDescription: '3乗を入力します。例: 2 x³ = 8',
      },
      {
        label: '√',
        description: '平方根を計算します。例: √(9) = 3',
        shiftLabel: '∛',
        shiftDescription: '立方根を計算します。例: ∛(27) = 3',
      },
      {
        label: 'xʸ',
        description: 'べき乗を入力します。例: 2 xʸ 5 = 32',
        shiftLabel: 'ʸ√x',
        shiftDescription: 'y乗根を計算します。例: ʸ√x(32, 5) = 2',
      },
      {
        label: 'log',
        description: '常用対数 log10 を計算します。例: log(1000) = 3',
        shiftLabel: '10^x',
        shiftDescription: '10のべき乗を計算します。例: 10^x(3) = 1000',
      },
      {
        label: 'ln',
        description: '自然対数を計算します。例: ln(e) = 1',
        shiftLabel: 'eˣ',
        shiftDescription: '指数関数 e^x を計算します。例: eˣ(1) ≈ 2.71828',
      },
      {
        label: '×10ⁿ',
        description: '科学的記数法の指数部分を入力します。例: 1.5×10³ = 1500',
      },
    ],
  },
  {
    title: '順列・組合せ',
    items: [
      { label: 'nPr', description: '順列（並べ方の数）を計算します。例: 5 nPr 2 = 20' },
      { label: 'nCr', description: '組合せ（選び方の数）を計算します。例: 5 nCr 2 = 10' },
      { label: '(', description: '左かっこを入力します。式の優先順位をまとめるときに使います。' },
      { label: ')', description: '右かっこを入力します。左かっこと対で使います。' },
    ],
  },
  {
    title: '基本演算',
    items: [
      { label: '0-9', description: '数字を入力します。例: 123.45' },
      { label: '.', description: '小数点を入力します。例: 3.14' },
      { label: '±', description: '最後の数値の符号を反転します。例: 5 → -5' },
      { label: '÷', description: '除算（割り算）を入力します。例: 8 ÷ 2 = 4' },
      { label: '×', description: '乗算（掛け算）を入力します。例: 6 × 7 = 42' },
      { label: '-', description: '減算（引き算）を入力します。例: 9 - 4 = 5' },
      { label: '+', description: '加算（足し算）を入力します。例: 3 + 2 = 5' },
      { label: '=', description: '計算を実行します。結果を表示します。' },
    ],
  },
  {
    title: 'キーボードショートカット',
    items: [
      { label: '0-9', description: '数字キーでそのまま入力できます。' },
      { label: '+ - * /', description: '演算子を入力できます。÷ は /、× は * を使います。' },
      { label: 'Enter / =', description: '計算を実行します（= ボタンと同じ）。' },
      { label: 'Backspace', description: '1文字削除します（DEL と同じ）。' },
      { label: 'Escape', description: '全消去します（AC と同じ）。' },
      { label: '( ) .', description: 'かっこと小数点を入力できます。' },
    ],
  },
];

interface HelpSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function HelpSheet({ open, onOpenChange }: HelpSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[94vw] max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>使い方ガイド</SheetTitle>
          <SheetDescription>
            ボタンの役割と SHIFT 時の副機能をまとめています。デスクトップでは各ボタンをホバーしても説明を確認できます。
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-6 pb-6">
          {HELP_SECTIONS.map((section) => (
            <section key={section.title} className="space-y-2">
              <h3 className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-200">{section.title}</h3>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <div key={`${section.title}-${item.label}`} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono font-semibold text-slate-900 dark:bg-slate-800 dark:text-slate-100">
                        {item.label}
                      </span>
                      <span className="text-muted-foreground">{item.description}</span>
                    </div>
                    {item.shiftLabel && item.shiftDescription && (
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <span className="rounded bg-blue-100 px-1.5 py-0.5 font-mono font-semibold text-blue-900 dark:bg-blue-500/15 dark:text-blue-200">
                          SHIFT: {item.shiftLabel}
                        </span>
                        <span className="text-muted-foreground">{item.shiftDescription}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
