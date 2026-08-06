import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import CalcKeypad from './CalcKeypad';

function renderKeypad(props: Partial<React.ComponentProps<typeof CalcKeypad>> = {}) {
  return render(
    <TooltipProvider>
      <CalcKeypad shiftActive={false} angleMode="DEG" onPress={vi.fn()} {...props} />
    </TooltipProvider>
  );
}

/** 光っているキー = ハイライトの枠線が付いているボタン */
function highlightedKeys() {
  return screen
    .getAllByRole('button')
    .filter((button) => button.className.includes('ring-amber-700'));
}

describe('CalcKeypad のハイライト', () => {
  it('押すべきキーを指定していなければ、どれも光らない', () => {
    renderKeypad();
    expect(highlightedKeys()).toHaveLength(0);
  });

  it('SHIFT 中でも、指定が無ければどれも光らない', () => {
    // 指定なし(undefined)と、副機能を持たないキーの shiftAction(undefined) を
    // 突き合わせてしまい、SHIFT 中に大半のキーが光っていたことがある
    renderKeypad({ shiftActive: true });
    expect(highlightedKeys()).toHaveLength(0);
  });

  it('指定したキーだけが光る', () => {
    renderKeypad({ highlightedAction: '7' });
    const lit = highlightedKeys();
    expect(lit).toHaveLength(1);
    expect(lit[0]).toHaveTextContent('7');
  });

  it('SHIFT 側のキーは、SHIFT が点いているときだけ光る', () => {
    const { unmount } = renderKeypad({ highlightedAction: 'cbrt(', shiftActive: false });
    expect(highlightedKeys()).toHaveLength(0);
    unmount();

    renderKeypad({ highlightedAction: 'cbrt(', shiftActive: true });
    const lit = highlightedKeys();
    expect(lit).toHaveLength(1);
    expect(lit[0]).toHaveTextContent('∛');
  });
});
