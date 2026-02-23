import CalcButton from './CalcButton';
import type { ButtonDef } from '../types';

const BUTTON_ROWS: ButtonDef[][] = [
  [
    { label: 'SHIFT', action: 'toggle-shift', variant: 'mode' },
    { label: 'DEG', shiftLabel: 'RAD', action: 'toggle-angle', variant: 'mode' },
    { label: 'DMS', action: 'toggle-dms', variant: 'mode' },
    { label: 'STAT', action: 'toggle-stats', variant: 'mode' },
    { label: 'AC', action: 'ac', variant: 'action' },
  ],
  [
    { label: 'MC', action: 'mc', variant: 'memory' },
    { label: 'MR', action: 'mr', variant: 'memory' },
    { label: 'M+', action: 'm+', variant: 'memory' },
    { label: 'M-', action: 'm-', variant: 'memory' },
    { label: 'DEL', action: 'del', variant: 'action' },
  ],
  [
    { label: 'sin', shiftLabel: 'sin⁻¹', action: 'sin(', shiftAction: 'asin(', variant: 'function' },
    { label: 'cos', shiftLabel: 'cos⁻¹', action: 'cos(', shiftAction: 'acos(', variant: 'function' },
    { label: 'tan', shiftLabel: 'tan⁻¹', action: 'tan(', shiftAction: 'atan(', variant: 'function' },
    { label: 'π', action: 'pi', variant: 'function' },
    { label: 'e', action: 'e', variant: 'function' },
  ],
  [
    { label: 'x²', shiftLabel: 'x³', action: '^2', shiftAction: '^3', variant: 'function' },
    { label: '√', shiftLabel: '∛', action: 'sqrt(', shiftAction: 'cbrt(', variant: 'function' },
    { label: 'xʸ', shiftLabel: 'ʸ√x', action: '^(', shiftAction: 'yroot(', variant: 'function' },
    { label: 'log', shiftLabel: '10^x', action: 'log(', shiftAction: 'pow10(', variant: 'function' },
    { label: 'ln', shiftLabel: 'eˣ', action: 'ln(', shiftAction: 'exp(', variant: 'function' },
  ],
  [
    { label: 'nPr', action: 'nPr(', variant: 'function' },
    { label: 'nCr', action: 'nCr(', variant: 'function' },
    { label: 'EXP', action: 'exp10', variant: 'function' },
    { label: '(', action: '(', variant: 'operator' },
    { label: ')', action: ')', variant: 'operator' },
  ],
  [
    { label: '7', action: '7', variant: 'digit' },
    { label: '8', action: '8', variant: 'digit' },
    { label: '9', action: '9', variant: 'digit' },
    { label: '÷', action: '/', variant: 'operator' },
    { label: '×', action: '*', variant: 'operator' },
  ],
  [
    { label: '4', action: '4', variant: 'digit' },
    { label: '5', action: '5', variant: 'digit' },
    { label: '6', action: '6', variant: 'digit' },
    { label: '-', action: '-', variant: 'operator' },
    { label: '+', action: '+', variant: 'operator' },
  ],
  [
    { label: '1', action: '1', variant: 'digit' },
    { label: '2', action: '2', variant: 'digit' },
    { label: '3', action: '3', variant: 'digit' },
    { label: '=', action: '=', variant: 'operator', wide: true },
  ],
  [
    { label: '0', action: '0', variant: 'digit', wide: true },
    { label: '.', action: '.', variant: 'digit' },
    { label: '+/-', action: 'negate', variant: 'action' },
  ],
];

interface CalcKeypadProps {
  shiftActive: boolean;
  angleMode: 'DEG' | 'RAD';
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
                ? { ...button, label: angleMode, shiftLabel: angleMode === 'DEG' ? 'RAD' : 'DEG' }
                : button;
            return (
              <CalcButton
                key={`${rowIndex}-${buttonIndex}-${button.action}`}
                button={normalizedButton}
                shiftActive={shiftActive}
                onPress={onPress}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
