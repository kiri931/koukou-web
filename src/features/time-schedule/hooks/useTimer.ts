import { useState, useRef, useEffect } from 'react';
import type { Task } from '../types';

export function useTimer(tasks: Task[], totalTime: number) {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Wall clock time when the current run segment started
  const segmentStartRef = useRef<number | null>(null);
  // Total elapsed ms accumulated from previous run segments (before current one)
  const elapsedBeforePauseRef = useRef<number>(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function startInterval() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const elapsed = elapsedBeforePauseRef.current + (Date.now() - segmentStartRef.current!);
      setElapsedMs(elapsed);
      if (elapsed >= totalTime * 60 * 1000) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsRunning(false);
        setIsPaused(false);
      }
    }, 100);
  }

  function start() {
    if (isRunning && !isPaused) return;

    segmentStartRef.current = Date.now();

    if (isPaused) {
      setIsPaused(false);
    } else {
      elapsedBeforePauseRef.current = 0;
      setElapsedMs(0);
      setIsRunning(true);
    }

    startInterval();
  }

  function pause() {
    if (!isRunning || isPaused) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    // Accumulate elapsed up to now
    elapsedBeforePauseRef.current += Date.now() - segmentStartRef.current!;
    segmentStartRef.current = null;
    setIsPaused(true);
  }

  function reset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    segmentStartRef.current = null;
    elapsedBeforePauseRef.current = 0;
    setIsRunning(false);
    setIsPaused(false);
    setElapsedMs(0);
  }

  // Compute current task index from elapsed time
  const elapsedMinutes = elapsedMs / 60000;
  let currentTaskIndex = -1;
  let accumulated = 0;
  for (let i = 0; i < tasks.length; i++) {
    accumulated += tasks[i].duration;
    if (elapsedMinutes < accumulated) {
      currentTaskIndex = i;
      break;
    }
  }

  return {
    isRunning,
    isPaused,
    elapsedMs,
    currentTaskIndex,
    start,
    pause,
    reset,
  };
}
