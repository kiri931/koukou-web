import { useCallback, useEffect, useRef, useState } from 'react';
import type { TimerMode, UseTimerReturn } from '../types';

const MODE_KEY = 'presentation.timer.mode';
const BASE_SECONDS_KEY = 'presentation.timer.baseSeconds';
const DEFAULT_MODE: TimerMode = 'countdown';
const DEFAULT_BASE_SECONDS = 300;

function clampSeconds(value: number) {
  return Math.max(1, Math.min(60 * 60 * 6, Math.floor(value || 0)));
}

export function useTimer(): UseTimerReturn {
  const [timerMode, setTimerMode] = useState<TimerMode>(DEFAULT_MODE);
  const [baseSeconds, setBaseSeconds] = useState(DEFAULT_BASE_SECONDS);
  const [running, setRunning] = useState(false);
  const [displaySeconds, setDisplaySeconds] = useState(DEFAULT_BASE_SECONDS);
  const [timerDone, setTimerDone] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const startedAtRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getElapsedMs = useCallback(() => {
    if (!running || startedAtRef.current === null) return elapsedMs;
    return elapsedMs + (Date.now() - startedAtRef.current);
  }, [elapsedMs, running]);

  const updateDisplay = useCallback(() => {
    const elapsedSeconds = Math.floor(getElapsedMs() / 1000);

    if (timerMode === 'countdown') {
      const remaining = Math.max(baseSeconds - elapsedSeconds, 0);
      setDisplaySeconds(remaining);

      if (remaining === 0 && running) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        startedAtRef.current = null;
        setElapsedMs(baseSeconds * 1000);
        setRunning(false);
        setTimerDone(true);
      } else if (remaining > 0 && timerDone) {
        setTimerDone(false);
      }
      return;
    }

    setDisplaySeconds(elapsedSeconds);
    if (timerDone) setTimerDone(false);
  }, [baseSeconds, getElapsedMs, running, timerDone, timerMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedMode = window.localStorage.getItem(MODE_KEY);
    if (storedMode === 'countdown' || storedMode === 'stopwatch') {
      setTimerMode(storedMode);
    }

    const storedSeconds = Number(window.localStorage.getItem(BASE_SECONDS_KEY));
    if (Number.isFinite(storedSeconds) && storedSeconds > 0) {
      const clamped = clampSeconds(storedSeconds);
      setBaseSeconds(clamped);
      setDisplaySeconds(clamped);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(MODE_KEY, timerMode);
  }, [timerMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(BASE_SECONDS_KEY, String(baseSeconds));
  }, [baseSeconds]);

  useEffect(() => {
    if (!running) return;

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(updateDisplay, 200);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [running, updateDisplay]);

  useEffect(() => {
    updateDisplay();
  }, [timerMode, baseSeconds, elapsedMs, updateDisplay]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const setMode = useCallback(
    (mode: TimerMode) => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      startedAtRef.current = null;
      setRunning(false);
      setElapsedMs(0);
      setTimerDone(false);
      setTimerMode(mode);
      setDisplaySeconds(mode === 'countdown' ? baseSeconds : 0);
    },
    [baseSeconds]
  );

  const setCountdownSeconds = useCallback(
    (sec: number) => {
      const clamped = clampSeconds(sec);
      setBaseSeconds(clamped);

      if (timerMode !== 'countdown') return;
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      startedAtRef.current = null;
      setRunning(false);
      setElapsedMs(0);
      setTimerDone(false);
      setDisplaySeconds(clamped);
    },
    [timerMode]
  );

  const start = useCallback(() => {
    if (running) return;
    startedAtRef.current = Date.now();
    setTimerDone(false);
    setRunning(true);
  }, [running]);

  const stop = useCallback(() => {
    if (!running) return;
    if (startedAtRef.current !== null) {
      setElapsedMs((prev) => prev + (Date.now() - startedAtRef.current!));
    }
    startedAtRef.current = null;
    setRunning(false);
  }, [running]);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    startedAtRef.current = null;
    setRunning(false);
    setElapsedMs(0);
    setTimerDone(false);
    setDisplaySeconds(timerMode === 'countdown' ? baseSeconds : 0);
  }, [baseSeconds, timerMode]);

  return {
    timerMode,
    baseSeconds,
    running,
    displaySeconds,
    timerDone,
    setMode,
    setCountdownSeconds,
    start,
    stop,
    reset,
  };
}
