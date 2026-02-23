import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import CalcButton from './CalcButton';
import type { AngleMode, ButtonDef } from '../types';

const BUTTON_ROWS: ButtonDef[][] = [
  [
    {
      label: 'SHIFT',
      action: 'toggle-shift',
      variant: 'mode',
      description: '青いドットが付いたボタンの副機能を有効にします。もう一度押すと解除します。',
    },
    {
      label: 'DEG',
      shiftLabel: 'RAD',
      action: 'toggle-angle',
      variant: 'mode',
      description: '角度単位を度数法(DEG)とラジアン(RAD)で切り替えます。三角関数の結果に影響します。',
    },
    {
      label: 'DMS',
      action: 'toggle-dms',
      variant: 'mode',
      description: '度・分・秒(DMS)入力パネルを開閉します。角度入力や三角関数計算に使えます。',
    },
    {
      label: 'STAT',
      action: 'toggle-stats',
      variant: 'mode',
      description: '統計パネルを開閉します。データ数・平均・標準偏差を計算できます。',
    },
    {
      label: 'AC',
      action: 'ac',
      variant: 'action',
      description: '入力中の式と結果を全てクリアします。エラー表示も解除します。',
    },
  ],
  [
    { label: 'MC', action: 'mc', variant: 'memory', description: 'メモリをクリアします。' },
    { label: 'MR', action: 'mr', variant: 'memory', description: 'メモリの値を呼び出して式に挿入します。' },
    {
      label: 'M+',
      action: 'm+',
      variant: 'memory',
      description: '現在の結果をメモリへ加算します。例: 結果10のとき M+ でメモリに +10。',
    },
    {
      label: 'M-',
      action: 'm-',
      variant: 'memory',
      description: '現在の結果をメモリから減算します。例: 結果3のとき M- でメモリから -3。',
    },
    {
      label: 'DEL',
      action: 'del',
      variant: 'action',
      description: '式の末尾1文字を削除します。キー: Backspace / Delete',
    },
  ],
  [
    {
      label: 'sin',
      shiftLabel: 'sin⁻¹',
      action: 'sin(',
      shiftAction: 'asin(',
      variant: 'function',
      description: '正弦（サイン）を計算します。例: sin(30) = 0.5（DEGモード）',
      shiftDescription: '逆正弦（アークサイン）を計算します。例: sin⁻¹(0.5) = 30°',
    },
    {
      label: 'cos',
      shiftLabel: 'cos⁻¹',
      action: 'cos(',
      shiftAction: 'acos(',
      variant: 'function',
      description: '余弦（コサイン）を計算します。例: cos(60) = 0.5（DEGモード）',
      shiftDescription: '逆余弦（アークコサイン）を計算します。例: cos⁻¹(0.5) = 60°',
    },
    {
      label: 'tan',
      shiftLabel: 'tan⁻¹',
      action: 'tan(',
      shiftAction: 'atan(',
      variant: 'function',
      description: '正接（タンジェント）を計算します。例: tan(45) = 1（DEGモード）',
      shiftDescription: '逆正接（アークタンジェント）を計算します。例: tan⁻¹(1) = 45°',
    },
    {
      label: 'π',
      action: 'pi',
      variant: 'function',
      description: '円周率 π を入力します。例: 2×π ≈ 6.28318',
    },
    {
      label: 'e',
      action: 'e',
      variant: 'function',
      description: '自然対数の底 e を入力します。例: ln(e) = 1',
    },
  ],
  [
    {
      label: 'x²',
      shiftLabel: 'x³',
      action: '^2',
      shiftAction: '^3',
      variant: 'function',
      description: '2乗を入力します。例: 5 x² = 25',
      shiftDescription: '3乗を入力します。例: 2 x³ = 8',
    },
    {
      label: '√',
      shiftLabel: '∛',
      action: 'sqrt(',
      shiftAction: 'cbrt(',
      variant: 'function',
      description: '平方根を計算します。例: √(9) = 3',
      shiftDescription: '立方根を計算します。例: ∛(27) = 3',
    },
    {
      label: 'xʸ',
      shiftLabel: 'ʸ√x',
      action: '^(',
      shiftAction: 'yroot(',
      variant: 'function',
      description: 'べき乗を入力します。例: 2 xʸ 5 = 32',
      shiftDescription: 'y乗根を計算します。例: 32 の 5乗根 = 2',
    },
    {
      label: 'log',
      shiftLabel: '10^x',
      action: 'log(',
      shiftAction: 'pow10(',
      variant: 'function',
      description: '常用対数（log10）を計算します。例: log(1000) = 3',
      shiftDescription: '10のべき乗を計算します。例: 10^x(3) = 1000',
    },
    {
      label: 'ln',
      shiftLabel: 'eˣ',
      action: 'ln(',
      shiftAction: 'exp(',
      variant: 'function',
      description: '自然対数を計算します。例: ln(e) = 1',
      shiftDescription: '指数関数 e^x を計算します。例: eˣ(1) ≈ 2.71828',
    },
  ],
  [
    {
      label: 'nPr',
      action: 'nPr(',
      variant: 'function',
      description: '順列（並べ方の数）を計算します。例: 5 nPr 2 = 20',
    },
    {
      label: 'nCr',
      action: 'nCr(',
      variant: 'function',
      description: '組合せ（選び方の数）を計算します。例: 5 nCr 2 = 10',
    },
    {
      label: '×10ⁿ',
      action: 'exp10',
      variant: 'function',
      description: '科学的記数法の指数部分を入力します。例: 1.5×10³ = 1500',
    },
    {
      label: '(',
      action: '(',
      variant: 'operator',
      description: '左かっこを入力します。キー: (',
    },
    {
      label: ')',
      action: ')',
      variant: 'operator',
      description: '右かっこを入力します。キー: )',
    },
  ],
  [
    { label: '7', action: '7', variant: 'digit', description: '数字 7 を入力します。キー: 7' },
    { label: '8', action: '8', variant: 'digit', description: '数字 8 を入力します。キー: 8' },
    { label: '9', action: '9', variant: 'digit', description: '数字 9 を入力します。キー: 9' },
    { label: '÷', action: '/', variant: 'operator', description: '除算（割り算）。キー: /' },
    { label: '×', action: '*', variant: 'operator', description: '乗算（掛け算）。キー: * または x' },
  ],
  [
    { label: '4', action: '4', variant: 'digit', description: '数字 4 を入力します。キー: 4' },
    { label: '5', action: '5', variant: 'digit', description: '数字 5 を入力します。キー: 5' },
    { label: '6', action: '6', variant: 'digit', description: '数字 6 を入力します。キー: 6' },
    { label: '-', action: '-', variant: 'operator', description: '減算（引き算）。キー: -' },
    { label: '+', action: '+', variant: 'operator', description: '加算（足し算）。キー: +' },
  ],
  [
    { label: '1', action: '1', variant: 'digit', description: '数字 1 を入力します。キー: 1' },
    { label: '2', action: '2', variant: 'digit', description: '数字 2 を入力します。キー: 2' },
    { label: '3', action: '3', variant: 'digit', description: '数字 3 を入力します。キー: 3' },
    {
      label: '=',
      action: '=',
      variant: 'operator',
      wide: true,
      description: '計算を実行します。キー: Enter または =',
    },
  ],
  [
    { label: '0', action: '0', variant: 'digit', wide: true, description: '数字 0 を入力します。キー: 0' },
    {
      label: '±',
      action: 'negate',
      variant: 'action',
      wide: true,
      description: '最後の数値の符号を反転します。例: 5 → -5',
    },
    { label: '.', action: '.', variant: 'digit', description: '小数点を入力します。キー: .' },
  ],
];

interface CalcKeypadProps {
  shiftActive: boolean;
  angleMode: AngleMode;
  onPress: (action: string) => void;
}

export default function CalcKeypad({ shiftActive, angleMode, onPress }: CalcKeypadProps) {
  return (
    <div className="space-y-2">
      {BUTTON_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-5 gap-2">
          {row.map((button, buttonIndex) => {
            const normalizedButton =
              button.action === 'toggle-angle'
                ? { ...button, label: angleMode, shiftLabel: undefined }
                : button;
            const tooltipText = shiftActive && button.shiftDescription ? button.shiftDescription : button.description;

            return (
              <Tooltip key={`${rowIndex}-${buttonIndex}-${button.action}`} delayDuration={500}>
                <TooltipTrigger asChild>
                  <CalcButton button={normalizedButton} shiftActive={shiftActive} onPress={onPress} />
                </TooltipTrigger>
                {tooltipText && (
                  <TooltipContent side="top" className="max-w-[200px] text-center text-xs leading-snug">
                    {tooltipText}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </div>
      ))}
    </div>
  );
}
