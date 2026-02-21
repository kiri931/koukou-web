export type TimerMode = 'countdown' | 'stopwatch';

export interface UseTimerReturn {
  timerMode: TimerMode;
  baseSeconds: number;
  running: boolean;
  displaySeconds: number;
  timerDone: boolean;
  setMode: (mode: TimerMode) => void;
  setCountdownSeconds: (sec: number) => void;
  start: () => void;
  stop: () => void;
  reset: () => void;
}
